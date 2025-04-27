import { User } from "@supabase/supabase-js";

/**
 * Represents a user's profile information in the application.
 * All fields except id are optional and can be null or undefined.
 */
export interface Profile {
  /** Unique identifier for the profile */
  id: string;
  
  /** User's age in years */
  age?: number | null;
  
  /** Whether the user has any major illness */
  has_major_illness?: boolean | null;
  
  /** Whether the user has any injuries */
  has_injury?: boolean | null;
  
  /** Whether the user has consistent training experience */
  has_consistent_training?: boolean | null;
  
  /** Whether the user has advanced training experience */
  has_advanced_training?: boolean | null;
  
  /** User's MAF (Maximum Aerobic Function) heart rate */
  maf_hr?: number | null;
  
  /** Timestamp when the profile was created */
  created_at?: string;
}

/**
 * Represents an error that occurred during profile operations
 */
export interface ProfileError {
  /** Human-readable error message */
  message: string;
  
  /** Optional error code for programmatic handling */
  code?: string;
}

/**
 * Context type for authentication state and operations
 */
export interface AuthContextType {
  /** The currently authenticated user, or null if not authenticated */
  user: User | null;
  
  /** Whether authentication state is being loaded */
  loading: boolean;

  /** Whether the initial auth check is still loading */
  initialLoading: boolean;

  /** Whether a sign-in operation is in progress */
  signInLoading: boolean;

  /** Whether a sign-up operation is in progress */
  signUpLoading: boolean;

  /** Whether a password reset operation is in progress */
  resetPasswordLoading: boolean;

  /** Current error message, if any */
  error: string | null;

  /** Function to sign in a user */
  signIn: (email: string, password: string) => Promise<void>;

  /** Function to sign up a new user */
  signUp: (email: string, password: string) => Promise<void>;

  /** Function to sign out the current user */
  signOut: () => Promise<void>;

  /** Function to reset a user's password */
  resetPassword: (email: string) => Promise<void>;

  /** Function to clear the current error */
  clearError: () => void;
}

export interface Activity {
  id: string;
  user_id: string;
  date: string;
  type: string;
  duration: number;
  distance?: number;
  avg_heart_rate?: number;
  max_heart_rate?: number;
  notes?: string;
  created_at: string;
}

export interface Connection {
  id: string;
  user_id_1: string;
  user_id_2: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}

export interface DatabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
} 