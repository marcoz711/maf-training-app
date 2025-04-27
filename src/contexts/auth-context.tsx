"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, AuthError } from "@supabase/supabase-js";
import { AuthContextType } from "@/types";
import { useRouter } from "next/navigation";

// Create context with undefined default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthState = {
  user: User | null;
  loading: boolean;
  initialLoading: boolean;
  signInLoading: boolean;
  signUpLoading: boolean;
  resetPasswordLoading: boolean;
  error: string | null;
};

/**
 * Provider component that wraps app and makes auth object available to any
 * child component that calls useAuth().
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    initialLoading: true,
    signInLoading: false,
    signUpLoading: false,
    resetPasswordLoading: false,
    error: null,
  });

  const supabase = createClient();

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, signInLoading: true, error: null }));
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      const authError = error as AuthError;
      setState(prev => ({ 
        ...prev, 
        error: authError.message || 'Failed to sign in. Please check your credentials.'
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, signInLoading: false }));
    }
  }, [supabase.auth]);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, signUpLoading: true, error: null }));
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
    } catch (error) {
      const authError = error as AuthError;
      setState(prev => ({ 
        ...prev, 
        error: authError.message || 'Failed to sign up. Please try again.'
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, signUpLoading: false }));
    }
  }, [supabase.auth]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      setState(prev => ({ ...prev, resetPasswordLoading: true, error: null }));
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (error) {
      const authError = error as AuthError;
      setState(prev => ({ 
        ...prev, 
        error: authError.message || 'Failed to send password reset email.'
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, resetPasswordLoading: false }));
    }
  }, [supabase.auth]);

  const signOut = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      await supabase.auth.signOut();
      setState(prev => ({ ...prev, user: null }));
      router.push('/login');
    } catch (error) {
      const authError = error as AuthError;
      setState(prev => ({ 
        ...prev, 
        error: authError.message || 'Failed to sign out.'
      }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [supabase.auth, router]);

  // Listen for changes on auth state
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setState(prev => ({ 
          ...prev, 
          user: session?.user || null,
          initialLoading: false,
          loading: false 
        }));
      } catch (error) {
        console.error("Error getting session:", error);
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to load session.',
          initialLoading: false,
          loading: false 
        }));
      }
    };

    // Initialize
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState(prev => ({ 
          ...prev, 
          user: session?.user || null,
          loading: false 
        }));
      }
    );

    // Cleanup on unmount
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const value = {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook for components nested in AuthProvider to get the auth object
 * and re-render when it changes.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const useRequireAuth = (redirectTo = '/login') => {
  const { user, loading, initialLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !initialLoading && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, initialLoading, router, redirectTo]);

  return { user, loading: loading || initialLoading };
}; 