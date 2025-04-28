import { createContext, useContext } from 'react';

export interface Profile {
  age: number;
  has_major_illness: boolean;
  has_injury: boolean;
  has_consistent_training: boolean;
  has_advanced_training: boolean;
  maf_hr: number;
}

export interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  saveProfile: (profile: Profile) => Promise<void>;
  saveStatus: 'idle' | 'loading' | 'success' | 'error';
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  loading: false,
  error: null,
  saveProfile: async () => {},
  saveStatus: 'idle',
});

export const ProfileProvider = ProfileContext.Provider;
export const useProfile = () => useContext(ProfileContext); 