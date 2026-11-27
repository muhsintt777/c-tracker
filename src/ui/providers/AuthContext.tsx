import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { AuthService, AuthUser } from '@/app/ports/AuthService';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  ready: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  service,
  children,
}: {
  service: AuthService;
  children: ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return service.subscribe(
      (nextUser) => {
        setUser(nextUser);
        setLoading(false);
      },
      (reason) => {
        setError(reason.message);
        setLoading(false);
      },
    );
  }, [service]);

  async function signIn(email: string, password: string) {
    setError(null);
    setLoading(true);
    try {
      await service.signIn(email, password);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Something went wrong. Please try again.',
      );
      setLoading(false);
    }
  }

  async function signOut() {
    setError(null);
    try {
      await service.signOut();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Something went wrong. Please try again.',
      );
    }
  }

  const value: AuthContextValue = {
    user,
    loading,
    ready: service.ready,
    error,
    signIn,
    signOut,
    clearError: () => setError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
