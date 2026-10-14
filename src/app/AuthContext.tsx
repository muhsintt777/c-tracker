import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { auth, db, firebaseReady } from "../lib/firebase";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function authErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const code = "code" in error ? String(error.code) : "";
    if (code === "auth/popup-closed-by-user") return "";
    if (code === "auth/unauthorized-domain") {
      return "This domain is not authorized for Google sign-in. Add it in Firebase Authentication settings.";
    }
    if (code === "auth/network-request-failed") return "Network error. Check your connection and try again.";
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authInstance = auth;
    const firestore = db;
    if (!authInstance || !firestore) {
      setLoading(false);
      return;
    }

    let active = true;
    void getRedirectResult(authInstance).catch((reason: unknown) => {
      if (active) {
        const message = authErrorMessage(reason);
        if (message) setError(message);
      }
    });

    const unsubscribe = onAuthStateChanged(authInstance, async (nextUser) => {
      if (!active) return;
      setUser(nextUser);
      if (!nextUser) {
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(firestore, "users", nextUser.uid);
        const userSnapshot = await getDoc(userRef);
        if (!active) return;
        if (userSnapshot.exists()) {
          await updateDoc(userRef, { updatedAt: serverTimestamp() });
        } else {
          await setDoc(userRef, {
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      } catch (reason) {
        if (active) setError(authErrorMessage(reason));
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  async function signIn() {
    if (!auth || !firebaseReady) {
      setError("Add your Firebase web configuration to .env.local to enable sign-in.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const isMobile = /iPad|iPhone|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) await signInWithRedirect(auth, provider);
      else {
        try {
          await signInWithPopup(auth, provider);
        } catch (reason) {
          const code = reason instanceof Error && "code" in reason ? String(reason.code) : "";
          if (code !== "auth/popup-blocked" && code !== "auth/operation-not-supported-in-this-environment") {
            throw reason;
          }
          await signInWithRedirect(auth, provider);
        }
      }
    } catch (reason) {
      const message = authErrorMessage(reason);
      if (message) setError(message);
      setLoading(false);
    }
  }

  async function signOut() {
    if (!auth) return;
    setError(null);
    try {
      await firebaseSignOut(auth);
    } catch (reason) {
      setError(authErrorMessage(reason));
    }
  }

  const value = useMemo(() => ({
    user,
    loading,
    error,
    signIn,
    signOut,
    clearError: () => setError(null)
  }), [user, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
