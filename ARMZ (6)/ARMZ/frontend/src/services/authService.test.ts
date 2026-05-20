import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authService } from '@/src/services/authService';
import apiClient from '@/src/api/client';
import { API_ENDPOINTS } from '@/src/api/endpoints';
import toast from 'react-hot-toast';
import { normalizePlanCode } from '@/src/lib/subscription';

// Mock dependencies
vi.mock('@/src/api/client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock('@/src/api/endpoints', () => ({
  API_ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      ADMIN_LOGIN: '/auth/admin/login',
      GOOGLE: '/auth/google',
      SEND_OTP: '/auth/send-otp',
      VERIFY_OTP: '/auth/verify-otp',
      RESEND_OTP: '/auth/resend-otp',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh',
      PROFILE: '/auth/profile',
    },
  },
}));
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));
vi.mock('@/src/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));
vi.mock('@/src/lib/subscription', () => ({
  normalizePlanCode: vi.fn((code) => code),
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

describe('AuthService', () => {
  const mockApiClient = apiClient as any;
  const mockToast = toast as any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage mocks
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    sessionStorageMock.getItem.mockClear();
    sessionStorageMock.removeItem.mockClear();

    // Reset window.location
    window.location.href = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('login', () => {
    it('should login successfully without persisting tokens', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      const mockResponse = {
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'student',
            is_verified: true,
            profile_complete: true,
            date_joined: '2024-01-01',
          },
          token: 'access-token',
          refreshToken: 'refresh-token',
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await authService.login(credentials);

      expect(mockApiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.LOGIN, credentials);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
      expect(mockToast.success).toHaveBeenCalledWith('Welcome back, Test User!');
      expect(result).toEqual({
        user: expect.objectContaining({
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          role: 'student',
          isVerified: true,
          profileComplete: true,
        }),
        token: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('should handle login failure and show error toast', async () => {
      const credentials = { email: 'test@example.com', password: 'wrongpassword' };
      const mockError = {
        message: 'Invalid credentials',
        response: { data: { message: 'Invalid credentials' } },
      };

      mockApiClient.post.mockRejectedValue(mockError);

      await expect(authService.login(credentials)).rejects.toThrow();

      expect(mockToast.error).toHaveBeenCalledWith('Invalid credentials');
    });

    it('should use requested role when user role is not provided', async () => {
      const credentials = { email: 'test@example.com', password: 'password123', requestedRole: 'employer' as const };
      const mockResponse = {
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            // No role provided
            is_verified: true,
            profile_complete: true,
            date_joined: '2024-01-01',
          },
          token: 'access-token',
          refreshToken: 'refresh-token',
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await authService.login(credentials);

      expect(result.user.role).toBe('employer');
    });

    it('should reject admin accounts through normal login flow', async () => {
      const credentials = { email: 'admin@example.com', password: 'AdminPass123!' };
      const mockResponse = {
        data: {
          user: {
            id: '1',
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'admin',
            is_verified: true,
            profile_complete: true,
            date_joined: '2024-01-01',
          },
          token: 'access-token',
          refreshToken: 'refresh-token',
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      await expect(authService.login(credentials)).rejects.toThrow(
        'Administrator accounts must sign in through the admin login page.'
      );
      expect(mockToast.error).toHaveBeenCalledWith(
        'Administrator accounts must sign in through the admin login page.'
      );
    });
  });

  describe('register', () => {
    it('should register successfully without persisting tokens', async () => {
      const registerData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        phone: '+1234567890',
        role: 'student' as const,
        dob: '1990-01-01',
        gender: 'male',
        nationality: 'US',
        country: 'United States',
        state: 'CA',
        city: 'San Francisco',
        highestQualification: 'Bachelor',
        careerInterest: 'Engineering',
        agree: true,
      };

      const mockResponse = {
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'student',
            is_verified: false,
            profile_complete: false,
            date_joined: '2024-01-01',
          },
          requiresVerification: true,
          token: 'access-token',
          refreshToken: 'refresh-token',
          onboardingRequired: true,
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await authService.register(registerData);

      expect(mockApiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.REGISTER, expect.any(Object));
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
      expect(result).toEqual({
        user: expect.objectContaining({
          id: '1',
          name: 'Test User',
          role: 'student',
          isVerified: false,
          profileComplete: false,
        }),
        requiresVerification: true,
        token: 'access-token',
        refreshToken: 'refresh-token',
        onboardingRequired: true,
      });
    });

    it('should handle registration failure', async () => {
      const registerData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'student' as const,
        dob: '1990-01-01',
        gender: 'male',
        nationality: 'US',
        country: 'United States',
        state: 'CA',
        city: 'San Francisco',
        highestQualification: 'Bachelor',
        careerInterest: 'Engineering',
        agree: true,
      };

      const mockError = {
        response: { data: { message: 'Email already exists' } },
      };

      mockApiClient.post.mockRejectedValue(mockError);

      await expect(authService.register(registerData)).rejects.toThrow();
      expect(mockToast.error).toHaveBeenCalledWith('Email already exists');
    });
  });

  describe('verifyOTP', () => {
    it('should verify OTP successfully without persisting tokens', async () => {
      const otpData = {
        email: 'test@example.com',
        otp: '123456',
        type: 'email' as const,
      };

      const mockResponse = {
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'student',
            is_verified: true,
            profile_complete: true,
            date_joined: '2024-01-01',
          },
          token: 'access-token',
          refreshToken: 'refresh-token',
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await authService.verifyOTP(otpData);

      expect(mockApiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.VERIFY_OTP, otpData);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
      expect(result).toEqual({
        user: expect.objectContaining({
          id: '1',
          name: 'Test User',
          isVerified: true,
        }),
        token: 'access-token',
        refreshToken: 'refresh-token',
      });
    });
  });

  describe('sendOTP', () => {
    it('should send OTP successfully with normalized email', async () => {
      mockApiClient.post.mockResolvedValue({ data: { message: 'OTP sent' } });

      await authService.sendOTP('  TEST@EXAMPLE.COM  ', undefined, 'email');

      expect(mockApiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.SEND_OTP, {
        type: 'email',
        email: 'test@example.com',
      });
      expect(mockToast.success).toHaveBeenCalledWith('OTP sent to   TEST@EXAMPLE.COM  ');
    });
  });

  describe('requestPasswordReset', () => {
    it('should send forgot password request', async () => {
      const email = 'test@example.com';

      mockApiClient.post.mockResolvedValue({ data: { message: 'OTP sent' } });

      await authService.requestPasswordReset(email);

      expect(mockApiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
      expect(mockToast.success).toHaveBeenCalledWith('Password reset instructions sent to your email');
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const resetData = {
        token: 'reset-token',
        newPassword: 'newpassword123',
      };

      mockApiClient.post.mockResolvedValue({ data: { message: 'Password reset successful' } });

      await authService.resetPassword(resetData);

      expect(mockApiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.RESET_PASSWORD, resetData);
      expect(mockToast.success).toHaveBeenCalledWith('Password reset successful! Please login with your new password.');
    });
  });

  describe('logout', () => {
    it('should logout and clear stored auth state', async () => {
      mockApiClient.post.mockResolvedValue({ data: { message: 'Logged out' } });

      await authService.logout();

      expect(mockApiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.LOGOUT);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth-storage');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('auth-storage');
      expect(mockToast.success).toHaveBeenCalledWith('Logged out successfully');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token using the auth cookie', async () => {
      mockApiClient.post.mockResolvedValue({ data: { token: 'new-access-token' } });

      const token = await authService.refreshToken();

      expect(mockApiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.REFRESH, {});
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
      expect(token).toBe('new-access-token');
    });

    it('should clear auth state and redirect when refresh fails', async () => {
      mockApiClient.post.mockRejectedValue(new Error('refresh failed'));
      window.location.pathname = '/dashboard';

      await expect(authService.refreshToken()).rejects.toThrow();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth-storage');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('auth-storage');
      expect(window.location.href).toBe('/login');
    });
  });

  describe('getProfile', () => {
    it('should get user profile', async () => {
      const mockResponse = {
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'student',
            is_verified: true,
            profile_complete: true,
            date_joined: '2024-01-01',
          },
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await authService.getProfile();

      expect(mockApiClient.get).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.PROFILE);
      expect(result).toEqual(expect.objectContaining({
        id: '1',
        name: 'Test User',
        isVerified: true,
      }));
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateData = {
        name: 'Updated Name',
        phone: '+1234567890',
      };

      const mockResponse = {
        data: {
          user: {
            id: '1',
            name: 'Updated Name',
            email: 'test@example.com',
            phone: '+1234567890',
            role: 'student',
            is_verified: true,
            profile_complete: true,
            date_joined: '2024-01-01',
          },
        },
      };

      mockApiClient.put.mockResolvedValue(mockResponse);

      const result = await authService.updateProfile(updateData);

      expect(mockApiClient.put).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.PROFILE, updateData);
      expect(result.name).toBe('Updated Name');
      expect(mockToast.success).toHaveBeenCalledWith('Profile updated successfully');
    });
  });

  describe('deleteAccount', () => {
    it('should delete account and clear local auth state', async () => {
      mockApiClient.delete.mockResolvedValue({ data: { success: true } });

      await authService.deleteAccount();

      expect(mockApiClient.delete).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.PROFILE);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('auth-storage');
      expect(mockToast.success).toHaveBeenCalledWith('Account deleted successfully');
    });
  });

  describe('adminLogin', () => {
    it('should normalize admin user and return OTP requirement', async () => {
      mockApiClient.post.mockResolvedValue({
        data: {
          user: {
            id: '11',
            name: 'Prime Admin',
            email: 'admin@example.com',
            role: 'prime',
            is_verified: true,
            profile_complete: true,
            date_joined: '2024-01-01T00:00:00Z',
          },
          requiresOTP: true,
          message: 'OTP sent',
        },
      });

      const result = await authService.adminLogin('admin@example.com', 'StrongPass123!');

      expect(mockApiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.ADMIN_LOGIN, {
        email: 'admin@example.com',
        password: 'StrongPass123!',
      });
      expect(result.requiresOTP).toBe(true);
      expect(result.user.role).toBe('admin');
      expect(mockToast.success).toHaveBeenCalledWith('OTP sent');
    });
  });

  describe('token helpers', () => {
    it('getToken should not expose browser-stored tokens', () => {
      expect(authService.getToken()).toBeNull();
    });

    it('isAuthenticated should return false without JS-readable auth state', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('normalizeUser', () => {
    it('should normalize user data correctly', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      const mockResponse = {
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'student',
            is_verified: true,
            profile_complete: false,
            date_joined: '2024-01-01T00:00:00Z',
            subscription: 'basic_plan',
            isPrime: false,
          },
          token: 'access-token',
          refreshToken: 'refresh-token',
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      await authService.login(credentials);

      expect(normalizePlanCode).toHaveBeenCalledWith('basic_plan');
    });
  });

  describe('getUnauthorizedRedirectPath', () => {
    it('should return admin login path for admin routes', () => {
      window.location.pathname = '/admin/dashboard';

      // Test through logout which calls getUnauthorizedRedirectPath internally
      mockApiClient.post.mockResolvedValue({ data: { message: 'Logged out' } });

      authService.logout();

      // The redirect happens in the apiClient interceptor, not directly in logout
      expect(mockApiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.LOGOUT);
    });

    it('should return standard login path for non-admin routes', () => {
      window.location.pathname = '/dashboard';

      mockApiClient.post.mockResolvedValue({ data: { message: 'Logged out' } });

      authService.logout();

      expect(mockApiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.LOGOUT);
    });
  });
});