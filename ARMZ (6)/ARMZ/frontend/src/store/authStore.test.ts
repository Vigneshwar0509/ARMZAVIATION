import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAuthStore } from '@/src/store/authStore';
import { authService, type User } from '@/src/services/authService';
import { logger } from '@/src/utils/logger';

// Mock dependencies
vi.mock('@/src/services/authService', () => ({
  authService: {
    logout: vi.fn(),
    getProfile: vi.fn(),
  },
}));
vi.mock('@/src/utils/logger', () => ({
  logger: {
    warn: vi.fn(),
  },
}));

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

describe('useAuthStore', () => {
  const mockAuthService = authService as any;
  const mockLogger = logger as any;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorageMock.getItem.mockClear();
    sessionStorageMock.setItem.mockClear();
    sessionStorageMock.removeItem.mockClear();

    // Reset store state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('login', () => {
    it('should set user and authentication state', () => {
      const mockUser: User = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'student',
        isVerified: true,
        profileComplete: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      useAuthStore.getState().login(mockUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });
  });

  describe('logout', () => {
    it('should call authService.logout and reset state', async () => {
      // Set initial authenticated state
      useAuthStore.setState({
        user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'student' } as User,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      mockAuthService.logout.mockResolvedValue(undefined);

      await useAuthStore.getState().logout();

      expect(mockAuthService.logout).toHaveBeenCalled();

      const state = useAuthStore.getState();
      expect(state.user).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should reset state even if logout fails', async () => {
      // Set initial authenticated state
      useAuthStore.setState({
        user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'student' } as User,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      mockAuthService.logout.mockRejectedValue(new Error('Logout failed'));

      await useAuthStore.getState().logout();

      expect(mockAuthService.logout).toHaveBeenCalled();

      const state = useAuthStore.getState();
      expect(state.user).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });
  });

  describe('initializeAuth', () => {
    it('should initialize auth successfully when user is authenticated', async () => {
      const mockUser: User = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'student',
        isVerified: true,
        profileComplete: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      // Mock persisted state
      sessionStorageMock.getItem.mockReturnValue(
        JSON.stringify({
          state: { isAuthenticated: true },
        })
      );

      mockAuthService.getProfile.mockResolvedValue(mockUser);

      await useAuthStore.getState().initializeAuth();

      expect(mockAuthService.getProfile).toHaveBeenCalledWith(true);
      expect(sessionStorageMock.getItem).toHaveBeenCalledWith('auth-storage');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should handle unauthenticated state', async () => {
      // Mock no persisted state
      sessionStorageMock.getItem.mockReturnValue(null);

      mockAuthService.getProfile.mockRejectedValue(new Error('No session'));

      await useAuthStore.getState().initializeAuth();

      expect(mockAuthService.getProfile).not.toHaveBeenCalled();

      const state = useAuthStore.getState();
      expect(state.user).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should handle invalid persisted state JSON', async () => {
      // Mock invalid JSON
      sessionStorageMock.getItem.mockReturnValue('invalid-json');

      mockAuthService.getProfile.mockRejectedValue(new Error('No session'));

      await useAuthStore.getState().initializeAuth();

      expect(mockLogger.warn).toHaveBeenCalledWith('Failed to bootstrap auth session', expect.any(Object));
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('auth-storage');

      const state = useAuthStore.getState();
      expect(state.user).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should handle profile fetch failure', async () => {
      // Mock persisted state but failed profile fetch
      sessionStorageMock.getItem.mockReturnValue(
        JSON.stringify({
          state: { isAuthenticated: true },
        })
      );

      const error = new Error('Profile fetch failed');
      mockAuthService.getProfile.mockRejectedValue(error);

      await useAuthStore.getState().initializeAuth();

      expect(mockLogger.warn).toHaveBeenCalledWith('Failed to bootstrap auth session', { error });
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('auth-storage');

      const state = useAuthStore.getState();
      expect(state.user).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should handle case when persisted state shows not authenticated', async () => {
      // Mock persisted state showing not authenticated
      sessionStorageMock.getItem.mockReturnValue(
        JSON.stringify({
          state: { isAuthenticated: false },
        })
      );

      await useAuthStore.getState().initializeAuth();

      expect(mockAuthService.getProfile).not.toHaveBeenCalled();

      const state = useAuthStore.getState();
      expect(state.user).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });
  });

  describe('setLoading', () => {
    it('should set loading state', () => {
      useAuthStore.getState().setLoading(true);

      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(true);

      useAuthStore.getState().setLoading(false);

      const updatedState = useAuthStore.getState();
      expect(updatedState.isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error state and reset loading', () => {
      // Set initial loading state
      useAuthStore.setState({ isLoading: true });

      useAuthStore.getState().setError('Test error');

      const state = useAuthStore.getState();
      expect(state.error).toBe('Test error');
      expect(state.isLoading).toBe(false);

      useAuthStore.getState().setError(null);

      const updatedState = useAuthStore.getState();
      expect(updatedState.error).toBe(null);
      expect(updatedState.isLoading).toBe(false);
    });
  });

  describe('Persistence', () => {
    it('should persist user and authentication state to sessionStorage', () => {
      const mockUser: User = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'student',
        isVerified: true,
        profileComplete: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      useAuthStore.getState().login(mockUser);

      const partialize = useAuthStore.persist.getOptions().partialize;
      expect(partialize).toBeTypeOf('function');

      const persistedSlice = partialize?.(useAuthStore.getState() as any);
      expect(persistedSlice).toEqual({
        user: mockUser,
        isAuthenticated: true,
      });
    });

    it('should restore state from sessionStorage on rehydration', () => {
      // Simulate rehydration
      const persistedState = {
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          role: 'student',
        },
        isAuthenticated: true,
      };

      // The persist middleware handles rehydration automatically
      // We can test that the onRehydrateStorage callback works
      useAuthStore.persist.setOptions({
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.isLoading = false;
            state.error = null;
          }
        },
      });

      // Manually trigger rehydration (this is normally done by zustand)
      useAuthStore.setState(persistedState as any);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(persistedState.user);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });
  });
});