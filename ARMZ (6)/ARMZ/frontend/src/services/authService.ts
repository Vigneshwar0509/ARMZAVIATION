import apiClient from '@/src/api/client';
import { API_ENDPOINTS } from '@/src/api/endpoints';
import toast from 'react-hot-toast';
import { logger } from '@/src/utils/logger';
import { normalizePlanCode } from '@/src/lib/subscription';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company_name?: string;
  hr_name?: string;
  company_details?: string;
  role: 'student' | 'employer' | 'admin';
  subscription?: string;
  isVerified: boolean;
  profileComplete: boolean;
  createdAt: string;
  updatedAt: string;
  isPrime?: boolean;
  onboardingRequired?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  onboardingRequired?: boolean;
  isNewUser?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  requestedRole?: 'student' | 'employer';
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  role: 'student' | 'employer';
  companyName?: string;
  hrName?: string;
  companyDetails?: string;
  dob: string;
  gender: string;
  nationality: string;
  country: string;
  state: string;
  city: string;
  highestQualification: string;
  careerInterest: string;
  agree: boolean;
  emailOtp?: string;
  phoneOtp?: string;
}

export interface OTPData {
  email?: string;
  phone?: string;
  otp: string;
  type: 'email' | 'phone' | 'password_reset';
}

export interface PasswordResetData {
  token: string;
  newPassword: string;
}

const normalizeUser = (user: any): User => ({
  ...user,
  role: user?.isPrime ? 'admin' : user?.role === 'prime' ? 'admin' : (user?.role || 'student'),
  subscription: normalizePlanCode(user?.subscription) || undefined,
  isVerified: user?.isVerified ?? user?.is_verified ?? false,
  profileComplete: user?.profileComplete ?? user?.profile_complete ?? false,
  createdAt: user?.createdAt ?? user?.date_joined ?? '',
  updatedAt: user?.updatedAt ?? '',
  isPrime: Boolean(user?.isPrime),
  onboardingRequired: Boolean(user?.onboardingRequired),
});

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
    // Fall through to the standard login path.
  }

  return '/login';
};

const clearStoredAuthState = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('auth-storage');
  sessionStorage.removeItem('auth-storage');
};

const storeAuthTokens = (token?: string | null, refreshToken?: string | null) => {
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }

  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken);
  } else {
    localStorage.removeItem('refresh_token');
  }
};

class AuthService {
  async login(
    credentials: LoginCredentials,
    requestedRole?: 'student' | 'employer'
  ): Promise<AuthResponse> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
      const authPayload = response.data;
      const { user, token, accessToken, refreshToken, refresh, refresh_token } = authPayload;

      const normalizedUser = normalizeUser({
        ...user,
        role: user.role || requestedRole || credentials.requestedRole || 'student',
      });

      if (normalizedUser.role === 'admin') {
        throw new Error('Administrator accounts must sign in through the admin login page.');
      }

      const normalizedToken = token ?? accessToken;
      const normalizedRefreshToken = refreshToken ?? refresh ?? refresh_token;

      storeAuthTokens(normalizedToken, normalizedRefreshToken);
      toast.success(`Welcome back, ${normalizedUser.name}!`);
      return { user: normalizedUser, token: normalizedToken, refreshToken: normalizedRefreshToken };
    } catch (error: any) {
      const message = error.message || error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  }

  async register(data: RegisterData): Promise<{ user: User; requiresVerification: boolean; token?: string; refreshToken?: string; onboardingRequired?: boolean }> {
    try {
      const payload = {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        password: data.password,
        confirmPassword: data.confirmPassword,
        dob: data.dob,
        gender: data.gender,
        nationality: data.nationality,
        country: data.country,
        state: data.state,
        city: data.city,
        highestQualification: data.highestQualification,
        careerInterest: data.careerInterest,
        agree: data.agree,
        phone: data.phone?.trim(),
        role: data.role,
        companyName: data.companyName?.trim(),
        hrName: data.hrName?.trim(),
        companyDetails: data.companyDetails?.trim(),
      };
      const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, payload);
      const authPayload = response.data;
      const { token, accessToken, refreshToken, refresh, refresh_token } = authPayload;
      const normalizedToken = token ?? accessToken;
      const normalizedRefreshToken = refreshToken ?? refresh ?? refresh_token;
      storeAuthTokens(normalizedToken, normalizedRefreshToken);
        toast.success('Account created! Please check your email for the verification code.');
      return {
        ...authPayload,
        user: normalizeUser(authPayload.user),
      };
    } catch (error: any) {
      const message = error.message || error.response?.data?.message || 'Registration failed';
      toast.error(message);
      throw error;
    }
  }

  async sendOTP(email?: string, phone?: string, type: 'email' | 'phone' | 'password_reset' = 'email'): Promise<void> {
    // OTP flow disabled: no-op
    return Promise.resolve();
  }

  async verifyOTP(data: OTPData): Promise<any> {
    try {
      // Remove any accidental spaces or dashes user might have typed or pasted
      const sanitizedData = {
        ...data,
        otp: data.otp.replace(/[\s-]/g, '').trim(),
      };
      // OTP verification disabled: treat as successful no-op
      toast.success('OTP verification is disabled.');
      return { user: undefined };
    } catch (error: any) {
      const message = error.message || error.response?.data?.message || 'OTP verification failed';
      toast.error(message);
      throw error;
    }
  }

  async googleLogin(idToken: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.GOOGLE, { idToken });
      const { user, token, accessToken, refreshToken, refresh, refresh_token, onboardingRequired, isNewUser } = response.data;
      const normalizedToken = token ?? accessToken;
      const normalizedRefreshToken = refreshToken ?? refresh ?? refresh_token;

      const normalizedUser = normalizeUser(user);
      storeAuthTokens(normalizedToken, normalizedRefreshToken);
      toast.success(`Welcome, ${normalizedUser.name}!`);
      return {
        onboardingRequired,
        isNewUser,
        token: normalizedToken,
        refreshToken: normalizedRefreshToken,
        user: normalizedUser,
      };
    } catch (error: any) {
      const message = error.message || error.response?.data?.message || 'Google login failed';
      toast.error(message);
      throw error;
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
      toast.success('Password reset instructions sent to your email');
      return response.data;
    } catch (error: any) {
      const message = error.message || error.response?.data?.message || 'Failed to send reset email';
      toast.error(message);
      throw error;
    }
  }

  async resetPassword(data: PasswordResetData): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, data);
      toast.success('Password reset successful! Please login with your new password.');
    } catch (error: any) {
      const message = error.message || error.response?.data?.message || 'Password reset failed';
      toast.error(message);
      throw error;
    }
  }

  async refreshToken(): Promise<string> {
    try {
      const refreshTokenValue = localStorage.getItem('refresh_token');
      const refreshBody = refreshTokenValue
        ? { refreshToken: refreshTokenValue, refresh: refreshTokenValue, refresh_token: refreshTokenValue }
        : {};
      console.log('[AUTH] refreshToken called, body:', refreshBody);
      const response = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH, refreshBody);
      const { token, accessToken, refreshToken: newRefreshToken, refresh, refresh_token } = response.data;
      const normalizedToken = token ?? accessToken;
      const normalizedRefreshToken = newRefreshToken ?? refresh ?? refresh_token ?? refreshTokenValue;
      storeAuthTokens(normalizedToken, normalizedRefreshToken);
      console.log('[AUTH] refreshToken response keys:', Object.keys(response.data));
      console.log('[AUTH] stored after refresh', {
        auth_token: localStorage.getItem('auth_token'),
        refresh_token: localStorage.getItem('refresh_token'),
      });
      return normalizedToken;
    } catch (error) {
      logger.warn('Refresh token failed, clearing session');
      clearStoredAuthState();
      window.location.href = getUnauthorizedRedirectPath();
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      logger.warn('Logout API request failed', { error });
    } finally {
      clearStoredAuthState();
      toast.success('Logged out successfully');
    }
  }

  async getProfile(silent = false): Promise<User> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.AUTH.PROFILE);
      return normalizeUser(response.data.user);
    } catch (error: any) {
      if (!silent) {
        const message = error.message || error.response?.data?.message || 'Failed to get profile';
        toast.error(message);
      }
      throw error;
    }
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put(API_ENDPOINTS.AUTH.PROFILE, data);
      toast.success('Profile updated successfully');
      return normalizeUser(response.data.user);
    } catch (error: any) {
      const message = error.message || error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
      throw error;
    }
  }

  async deleteAccount(): Promise<void> {
    try {
      await apiClient.delete(API_ENDPOINTS.AUTH.PROFILE);
      clearStoredAuthState();
      toast.success('Account deleted successfully');
    } catch (error: any) {
      const message = error.message || error.response?.data?.message || 'Failed to delete account';
      toast.error(message);
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return false;
  }

  getToken(): string | null {
    return null;
  }

  async adminLogin(email: string, password: string): Promise<{ user: User; requiresOTP: false; token?: string; refreshToken?: string; message?: string }> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.ADMIN_LOGIN, { email, password });
      const responseKeys = Object.keys(response.data || {});
      console.log('[AUTH] adminLogin response keys:', responseKeys);
      console.log('[AUTH] adminLogin response payload:', response.data);

      const {
        user,
        token,
        accessToken,
        refreshToken,
        refresh,
        refresh_token,
        message,
      } = response.data;
      const normalizedUser = normalizeUser(user);
      const normalizedToken = token ?? accessToken;
      const normalizedRefreshToken = refreshToken ?? refresh ?? refresh_token;

      // Store tokens immediately when provided by the server.
      if (normalizedToken || normalizedRefreshToken) {
        storeAuthTokens(normalizedToken, normalizedRefreshToken);
      }

      console.log('[AUTH] auth token stored', {
        auth_token: localStorage.getItem('auth_token'),
        refresh_token: localStorage.getItem('refresh_token'),
      });

      return {
        user: normalizedUser,
        requiresOTP: false,
        token: normalizedToken,
        refreshToken: normalizedRefreshToken,
        message,
      };
    } catch (error: any) {
      const message = error.message || error.response?.data?.message || 'Admin login failed';
      toast.error(message);
      throw error;
    }
  }
}

export const authService = new AuthService();
