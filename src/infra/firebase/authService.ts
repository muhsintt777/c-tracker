import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import type { AuthService, AuthUser } from '@/app/ports/AuthService';
import { auth, db, firebaseReady } from './firebase';

function authError(error: unknown): Error {
  if (!(error instanceof Error)) {
    return new Error('Something went wrong. Please try again.');
  }

  const code = 'code' in error ? String(error.code) : '';
  const messages: Record<string, string> = {
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/wrong-password': 'Incorrect email or password.',
    'auth/user-not-found': 'Incorrect email or password.',
    'auth/invalid-email': 'Incorrect email or password.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/operation-not-allowed':
      'Email/password sign-in is not enabled in Firebase Authentication.',
    'auth/network-request-failed':
      'Network error. Check your connection and try again.',
  };

  return new Error(messages[code] ?? error.message);
}

function toAuthUser(user: User): AuthUser {
  return { uid: user.uid, email: user.email };
}

async function syncUserProfile(user: User): Promise<void> {
  if (!db) return;
  const userRef = doc(db, 'users', user.uid);
  const userSnapshot = await getDoc(userRef);
  if (userSnapshot.exists()) {
    await updateDoc(userRef, { updatedAt: serverTimestamp() });
  } else {
    await setDoc(userRef, {
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

export const authService: AuthService = {
  ready: firebaseReady,
  subscribe(onUser, onError) {
    if (!auth) {
      onUser(null);
      return () => undefined;
    }

    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      if (!active) return;
      if (!nextUser) {
        onUser(null);
        return;
      }

      try {
        await syncUserProfile(nextUser);
      } catch (error) {
        if (active) onError(authError(error));
      } finally {
        if (active) onUser(toAuthUser(nextUser));
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  },
  async signIn(email, password) {
    if (!auth || !firebaseReady) {
      throw new Error(
        'Add your Firebase web configuration to .env.local to enable sign-in.',
      );
    }
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      throw authError(error);
    }
  },
  async signOut() {
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      throw authError(error);
    }
  },
};
