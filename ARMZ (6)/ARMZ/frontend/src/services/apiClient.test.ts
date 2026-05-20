import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import axiosRetry from 'axios-retry';

let ENV: any;
const requestHandlers: Array<{ fulfilled: any; rejected?: any }> = [];
const responseHandlers: Array<{ fulfilled: any; rejected?: any }> = [];

const mockAxiosInstance = {
  interceptors: {
    request: {
      handlers: requestHandlers,
      use: (fulfilled: any, rejected: any) => requestHandlers.push({ fulfilled, rejected }),
    },
    response: {
      handlers: responseHandlers,
      use: (fulfilled: any, rejected: any) => responseHandlers.push({ fulfilled, rejected }),
    },
  },
  post: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

// Mock dependencies
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock('axios-retry', () => ({
  default: vi.fn(),
  exponentialDelay: vi.fn(),
}));
vi.mock('@/src/config/env', () => ({
  ENV: {
    API_BASE_URL: 'https://api.example.com',
    FRONTEND_ONLY: false,
  },
}));
vi.mock('@/src/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock localStorage and sessionStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
const sessionStorageMock = {
  getItem: vi.fn(),
  removeItem: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    protocol: 'https:',
    pathname: '/dashboard',
    href: '',
  },
  writable: true,
});

const loadApiModule = async () => {
  return await import('@/src/services/apiClient');
};

describe('apiClient', () => {
  const mockAxios = axios as any;
  const mockAxiosRetry = axiosRetry as any;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    requestHandlers.length = 0;
    responseHandlers.length = 0;

    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    sessionStorageMock.getItem.mockClear();
    sessionStorageMock.removeItem.mockClear();

    window.location.href = '';
    window.location.protocol = 'https:';
    window.location.pathname = '/dashboard';

    const envModule = await import('@/src/config/env');
    ENV = envModule.ENV;
    ENV.API_BASE_URL = 'https://api.example.com';
    ENV.FRONTEND_ONLY = false;

    await loadApiModule();
  });

  afterEach(() => {
    // Keep the mocked axios creation and retry setup intact for the module scope.
  });

  describe('Configuration', () => {
    it('should create axios instance with correct configuration', () => {
      expect(mockAxios.create).toHaveBeenCalledWith({
        baseURL: ENV.API_BASE_URL,
        timeout: 10000,
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should configure axios-retry with correct options', () => {
      expect(mockAxiosRetry).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          retries: 2,
          retryDelay: axiosRetry.exponentialDelay,
        })
      );
    });
  });

  describe('Request Interceptor', () => {
    it('should add authorization header when token exists', async () => {
      const token = 'test-token';
      localStorageMock.getItem.mockReturnValue(token);

      const config = { headers: {} };
      const interceptor = mockAxios.create.mock.results[0].value.interceptors.request.handlers[0];

      const result = await interceptor.fulfilled(config);

      expect(result.headers.Authorization).toBe(`Bearer ${token}`);
    });

    it('should not add authorization header when no token exists', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const config = { headers: {} };
      const interceptor = mockAxios.create.mock.results[0].value.interceptors.request.handlers[0];

      const result = await interceptor.fulfilled(config);

      expect(result.headers.Authorization).toBeUndefined();
    });

    it('should reject request when backend is temporarily unavailable', async () => {
      const originalDate = Date.now;
      Date.now = vi.fn().mockReturnValue(1000);

      const errorInterceptor = mockAxios.create.mock.results[0].value.interceptors.response.handlers[0];
      const networkError = { config: { url: '/test' }, message: 'Network Error' };

      await expect(errorInterceptor.rejected(networkError)).rejects.toEqual(
        expect.objectContaining({
          isNetworkError: true,
          message: 'Unable to reach server. Please check your connection and try again.',
        })
      );

      Date.now = vi.fn().mockReturnValue(2000); // Within the backend circuit breaker window
      const requestInterceptor = mockAxios.create.mock.results[0].value.interceptors.request.handlers[0];

      await expect(requestInterceptor.fulfilled({})).rejects.toEqual(
        expect.objectContaining({
          isBackendUnavailable: true,
          message: 'Backend is temporarily unreachable. Retrying automatically in a few seconds.',
        })
      );

      Date.now = originalDate;
    });

    it('should reject request for mixed content (HTTPS to HTTP)', async () => {
      window.location.protocol = 'https:';
      ENV.API_BASE_URL = 'http://api.example.com';

      const interceptor = mockAxios.create.mock.results[0].value.interceptors.request.handlers[0];

      await expect(interceptor.fulfilled({})).rejects.toEqual(
        expect.objectContaining({
          isMixedContent: true,
          message: 'Blocked insecure API call: this page is HTTPS but API URL is HTTP. Configure VITE_API_URL with HTTPS.',
        })
      );
    });

    it('should reject request in frontend-only mode', async () => {
      ENV.FRONTEND_ONLY = true;

      const interceptor = mockAxios.create.mock.results[0].value.interceptors.request.handlers[0];

      await expect(interceptor.fulfilled({})).rejects.toEqual(
        expect.objectContaining({
          isFrontendOnly: true,
          message: 'Frontend-only mode: API calls are disabled.',
        })
      );
    });
  });

  describe('Response Interceptor', () => {
    it('should unwrap API envelope response', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { id: 1, name: 'test' },
          message: 'Success',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      const interceptor = mockAxios.create.mock.results[0].value.interceptors.response.handlers[0];
      const result = await interceptor.fulfilled(mockResponse);

      expect(result.data).toEqual({ id: 1, name: 'test' });
    });

    it('should not unwrap non-envelope response', async () => {
      const mockResponse = {
        data: { id: 1, name: 'test' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      const interceptor = mockAxios.create.mock.results[0].value.interceptors.response.handlers[0];
      const result = await interceptor.fulfilled(mockResponse);

      expect(result.data).toEqual({ id: 1, name: 'test' });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const mockError = {
        config: { url: '/test' },
        message: 'Network Error',
      };

      const interceptor = mockAxios.create.mock.results[0].value.interceptors.response.handlers[0];

      await expect(interceptor.rejected(mockError)).rejects.toEqual(
        expect.objectContaining({
          isNetworkError: true,
          message: 'Unable to reach server. Please check your connection and try again.',
        })
      );
    });

    it('should handle 401 errors and attempt token refresh', async () => {
      const mockError = {
        response: { status: 401 },
        config: { url: '/protected', _retry: false },
      };

      // Mock successful refresh
      mockAxios.post.mockResolvedValueOnce({
        data: { success: true, data: { token: 'new-token' } },
      });

      const interceptor = mockAxios.create.mock.results[0].value.interceptors.response.handlers[0];

      await expect(interceptor.rejected(mockError)).rejects.toBeDefined();

      expect(mockAxios.post).toHaveBeenCalledWith(
        `${ENV.API_BASE_URL}/auth/refresh`,
        {},
        expect.objectContaining({
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        })
      );
    });

    it('should handle 401 errors and redirect to login on refresh failure', async () => {
      const mockError = {
        response: { status: 401 },
        config: { url: '/protected', _retry: false },
      };

      // Mock failed refresh
      mockAxios.post.mockRejectedValueOnce(new Error('Refresh failed'));

      const interceptor = mockAxios.create.mock.results[0].value.interceptors.response.handlers[0];

      await expect(interceptor.rejected(mockError)).rejects.toEqual(
        expect.objectContaining({
          message: 'Session expired. Please login again.',
        })
      );

      expect(window.location.href).toBe('/login');
    });

    it('should extract error message from DRF validation errors', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            email: ['Email is required'],
            password: ['Password too short'],
          },
        },
        config: {},
      };

      const interceptor = mockAxios.create.mock.results[0].value.interceptors.response.handlers[0];

      await expect(interceptor.rejected(mockError)).rejects.toEqual(
        expect.objectContaining({
          message: 'Email is required',
        })
      );
    });

    it('should provide default error message when none available', async () => {
      const mockError = {
        response: {
          status: 500,
          data: {},
        },
        config: {},
      };

      const interceptor = mockAxios.create.mock.results[0].value.interceptors.response.handlers[0];

      await expect(interceptor.rejected(mockError)).rejects.toEqual(
        expect.objectContaining({
          message: 'Something went wrong. Please try again.',
        })
      );
    });
  });

  describe('Retry Logic', () => {
    it('should not retry payment verification endpoints', () => {
      const retryCondition = mockAxiosRetry.mock.calls[0][1].retryCondition;

      const paymentError = {
        config: { url: '/payments/verify' },
        response: { status: 500 },
      };

      expect(retryCondition(paymentError)).toBe(false);
    });

    it('should retry on 429 status', () => {
      const retryCondition = mockAxiosRetry.mock.calls[0][1].retryCondition;

      const rateLimitError = {
        response: { status: 429 },
      };

      expect(retryCondition(rateLimitError)).toBe(true);
    });

    it('should retry on 5xx errors', () => {
      const retryCondition = mockAxiosRetry.mock.calls[0][1].retryCondition;

      const serverError = {
        response: { status: 500 },
      };

      expect(retryCondition(serverError)).toBe(true);
    });
  });
});