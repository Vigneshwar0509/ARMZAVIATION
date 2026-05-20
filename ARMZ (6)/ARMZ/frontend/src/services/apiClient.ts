import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import type { ApiEnvelope } from '@/src/api/types';
import { ENV } from '@/src/config/env';
import { logger } from '@/src/utils/logger';

const networkErrorLogTimestamps = new Map<string, number>();
const NETWORK_ERROR_LOG_THROTTLE_MS = 10000;
const BACKEND_CIRCUIT_BREAKER_MS = 30000;
const REFRESH_PATH = '/auth/refresh';

let backendUnavailableUntil = 0;

const isBackendTemporarilyUnavailable = (): boolean => Date.now() < backendUnavailableUntil;

const markBackendUnavailable = () => {
  backendUnavailableUntil = Date.now() + BACKEND_CIRCUIT_BREAKER_MS;
};

const clearStoredAuthState = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('auth-storage');
  sessionStorage.removeItem('auth-storage');
};

const getUnauthorizedRedirectPath = (): string => {
  if (typeof window === 'undefined') {
    return '/login';
  }

  const pathname = window.location.pathname.toLowerCase();
  if (pathname.startsWith('/admin')) {
    return '/admin-login';
  }

  try {
    const raw = window.sessionStorage.getItem('auth-storage');
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed?.state?.user?.role === 'admin') {
      return '/admin-login';
    }
  } catch {
    // Fall back to the standard login route if persisted auth state is malformed.
  }

  return '/login';
};

const isHttpsToHttpApiBlocked = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.location.protocol === 'https:' && ENV.API_BASE_URL.toLowerCase().startsWith('http://');
};

const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const unwrapApiEnvelope = <T>(payload: T | ApiEnvelope<T>): T => {
  if (
    payload &&
    typeof payload === 'object' &&
    'success' in (payload as Record<string, unknown>) &&
    'data' in (payload as Record<string, unknown>) &&
    'message' in (payload as Record<string, unknown>)
  ) {
    return (payload as ApiEnvelope<T>).data;
  }

  return payload as T;
};

axiosRetry(apiClient, {
  retries: 2,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    if (error.config?.url?.includes('/payments/verify')) {
      return false;
    }
    const status = error.response?.status;
    if (status === 429) {
      return true;
    }
    return typeof status === 'number' && status >= 500;
  },
});

// Request interceptor for auth token
apiClient.interceptors.request.use(
  (config) => {
    if (isBackendTemporarilyUnavailable()) {
      return Promise.reject({
        isBackendUnavailable: true,
        message: 'Backend is temporarily unreachable. Retrying automatically in a few seconds.',
        config,
      });
    }

    if (isHttpsToHttpApiBlocked()) {
      return Promise.reject({
        isMixedContent: true,
        message: 'Blocked insecure API call: this page is HTTPS but API URL is HTTP. Configure VITE_API_URL with HTTPS.',
        config,
      });
    }

    if (ENV.FRONTEND_ONLY) {
      return Promise.reject({
        isFrontendOnly: true,
        message: 'Frontend-only mode: API calls are disabled.',
        config,
      });
    }

    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.withCredentials = true;

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    response.data = unwrapApiEnvelope(response.data);
    return response;
  },
  async (error: AxiosError<{ message?: string }> & { config?: any }) => {
    if ((error as any)?.isBackendUnavailable) {
      return Promise.reject({
        ...error,
        isBackendUnavailable: true,
        message: 'Backend is temporarily unreachable. Retrying automatically in a few seconds.',
      });
    }

    if ((error as any)?.isMixedContent) {
      return Promise.reject({
        ...error,
        isMixedContent: true,
        message: 'Blocked insecure API call: this page is HTTPS but API URL is HTTP. Configure VITE_API_URL with HTTPS.',
      });
    }

    if ((error as any)?.isFrontendOnly || ENV.FRONTEND_ONLY) {
      return Promise.reject({
        ...error,
        isFrontendOnly: true,
        message: 'Frontend-only mode: API calls are disabled.',
      });
    }

    if (!error.response) {
      markBackendUnavailable();

      const url = error.config?.url ?? 'unknown-url';
      const now = Date.now();
      const lastLoggedAt = networkErrorLogTimestamps.get(url) ?? 0;
      if (now - lastLoggedAt > NETWORK_ERROR_LOG_THROTTLE_MS) {
        logger.error('Network error while calling API', { url });
        networkErrorLogTimestamps.set(url, now);
      }

      return Promise.reject({
        ...error,
        isNetworkError: true,
        message: 'Unable to reach server. Please check your connection and try again.',
      });
    }

    if (
      error.response.status === 401 &&
      error.config &&
      !error.config._retry &&
      error.config.url !== REFRESH_PATH
    ) {
      error.config._retry = true;
      try {
        const refreshResponse = await axios.post(
          `${ENV.API_BASE_URL}${REFRESH_PATH}`,
          {},
          {
            withCredentials: true,
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000,
          }
        );

        const refreshPayload = unwrapApiEnvelope(refreshResponse.data);

        // If refresh succeeded, retry the original request
        return apiClient(error.config);
      } catch (refreshError: any) {
        // Refresh failed - user is not authenticated
        // This is expected for unauthenticated users or when refresh token is invalid
        logger.warn('Auth refresh failed - user is unauthenticated', { 
          status: refreshError.response?.status,
          url: REFRESH_PATH 
        });
        // Don't mark backend as unavailable, just redirect to login
        clearStoredAuthState();
        if (typeof window !== 'undefined') {
          window.location.href = getUnauthorizedRedirectPath();
        }
        return Promise.reject({ ...error, message: 'Session expired. Please login again.' });
      }
    }

    if (error.response.status === 401) {
      clearStoredAuthState();
      if (typeof window !== 'undefined') {
        window.location.href = getUnauthorizedRedirectPath();
      }
    }

    let message = error.response.data?.message;
    const apiErrors = (error.response.data as any)?.errors;

    // Handle Django REST Framework validation error format (objects with arrays of strings)
    if (!message && error.response.status === 400 && error.response.data && typeof error.response.data === 'object') {
      try {
        const errorSource =
          apiErrors && typeof apiErrors === 'object'
            ? apiErrors
            : error.response.data;
        const errorValues = Object.values(errorSource).flat();
        if (errorValues.length > 0 && typeof errorValues[0] === 'string') {
          message = errorValues[0];
        }
      } catch (e) {
        // Ignore extraction errors
      }
    }

    if (!message) {
      message = 'Something went wrong. Please try again.';
    }

    return Promise.reject({ ...error, message });
  }
);

export default apiClient;
