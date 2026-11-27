export interface AuthUser {
  uid: string;
  email: string | null;
}

export interface AuthService {
  readonly ready: boolean;
  subscribe(
    onUser: (user: AuthUser | null) => void,
    onError: (error: Error) => void,
  ): () => void;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}
