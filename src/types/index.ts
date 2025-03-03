import { User } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  age?: number;
  has_major_illness: boolean;
  has_injury: boolean;
  has_consistent_training: boolean;
  has_advanced_training: boolean;
  maf_hr?: number;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
} 