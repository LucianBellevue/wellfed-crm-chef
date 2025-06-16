import { create } from 'zustand';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '../firebase/config';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  initialize: () => (() => void);
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,
  initialized: false,
  
  // Initialize auth state listener
  initialize: () => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        set({ user, initialized: true });
      },
      (error) => {
        console.error('Auth state change error:', error);
        set({ error: error.message, initialized: true });
      }
    );
    
    // Clean up subscription on unmount
    return () => unsubscribe();
  },
  
  // Sign up with email and password
  signUp: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      set({ user: userCredential.user, loading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign up';
      console.error('Sign up error:', error);
      set({ error: errorMessage, loading: false });
    }
  },
  
  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      set({ user: userCredential.user, loading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
      console.error('Sign in error:', error);
      set({ error: errorMessage, loading: false });
    }
  },
  
  // Sign out
  signOut: async () => {
    set({ loading: true, error: null });
    try {
      await firebaseSignOut(auth);
      set({ user: null, loading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign out';
      console.error('Sign out error:', error);
      set({ error: errorMessage, loading: false });
    }
  },
  
  // Reset password
  resetPassword: async (email: string) => {
    set({ loading: true, error: null });
    try {
      await sendPasswordResetEmail(auth, email);
      set({ loading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
      console.error('Password reset error:', error);
      set({ error: errorMessage, loading: false });
    }
  },
  
  // Clear error
  clearError: () => {
    set({ error: null });
  }
}));
