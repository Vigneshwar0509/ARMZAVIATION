import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/src/types';
import { authService } from '@/src/services/authService';
import { logger } from '@/src/utils/logger';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasBootstrappedAuth: boolean;
  error: string | null;
  login: (user: User) => void;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      hasBootstrappedAuth: false,
      isLoading: false,
      error: null,
      login: (user) => set({ 
        user, 
        isAuthenticated: true,
        hasBootstrappedAuth: true,
        isLoading: false,
        error: null
      }),
      logout: async () => {
        try {
          await authService.logout();
        } catch (error) {
          logger.warn('Logout request failed; clearing local auth state anyway', { error });
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },
      initializeAuth: async () => {
        set({ isLoading: true, error: null, hasBootstrappedAuth: false });
        try {
          // httpOnly cookies can't be read from JavaScript, so we need a different approach
          // Check if we have persisted auth data from a previous session
          try {
            const stored = sessionStorage.getItem('auth-storage');
            const persistedState = stored ? JSON.parse(stored) : null;

            // If we do not have persisted auth state, but tokens exist in localStorage,
            // attempt to fetch profile using tokens. Otherwise, finish bootstrapping.
            if (!persistedState?.state?.isAuthenticated) {
              const hasToken = Boolean(localStorage.getItem('auth_token') || localStorage.getItem('refresh_token'));
              if (!hasToken) {
                set({ user: null, isAuthenticated: false, hasBootstrappedAuth: true, isLoading: false, error: null });
                return;
              }
            }

          } catch (e) {
            // If parsing fails, continue to try fetching the profile if tokens exist.
          }

          // Try to fetch the profile - the backend will use the httpOnly cookie or
          // tokens supplied by the client. Use silent mode to avoid showing error toasts during initialization.
          const user = await authService.getProfile(true);
          set({ user, isAuthenticated: true, hasBootstrappedAuth: true, isLoading: false, error: null });
        } catch (error) {
          // No user session found - this is normal for first-time visitors.
          logger.warn('Failed to bootstrap auth session', { error });
          sessionStorage.removeItem('auth-storage');
          set({ user: null, isAuthenticated: false, hasBootstrappedAuth: true, isLoading: false, error: null });
        }
      },
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error, isLoading: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
          state.error = null;
          state.hasBootstrappedAuth = false;
        }
      },
    }
  )
);
