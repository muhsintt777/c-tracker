import { create } from 'zustand';
import type { AuthService, AuthUser } from '@/app/ports/AuthService';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  ready: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

let service: AuthService | null = null;
let unsubscribe: (() => void) | null = null;

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,
  ready: false,
  error: null,
  async signIn(email, password) {
    if (!service) return;
    set({ error: null, loading: true });
    try {
      await service.signIn(email, password);
    } catch (reason) {
      set({
        error:
          reason instanceof Error
            ? reason.message
            : 'Something went wrong. Please try again.',
        loading: false,
      });
    }
  },
  async signOut() {
    if (!service) return;
    set({ error: null });
    try {
      await service.signOut();
    } catch (reason) {
      set({
        error:
          reason instanceof Error
            ? reason.message
            : 'Something went wrong. Please try again.',
      });
    }
  },
  clearError: () => set({ error: null }),
}));

export function initializeAuth(nextService: AuthService) {
  unsubscribe?.();
  service = nextService;
  useAuth.setState({ loading: true, ready: nextService.ready, error: null });
  unsubscribe = nextService.subscribe(
    (user) => useAuth.setState({ user, loading: false }),
    (error) => useAuth.setState({ error: error.message, loading: false }),
  );
}
