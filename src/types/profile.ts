export interface Profile {
  id: string;
  age: number | null;
  has_major_illness: boolean | null;
  has_injury: boolean | null;
  has_consistent_training: boolean | null;
  has_advanced_training: boolean | null;
  maf_hr: number | null;
  created_at?: string;
}

export type ProfileError = {
  message: string;
  code?: string;
} 