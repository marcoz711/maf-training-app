import { renderHook, act } from '@testing-library/react';
import { useProfile } from '../use-profile';
import { ProfileProvider } from '@/contexts/profile-context';

// Mock the profile context
const mockProfile = {
  age: 30,
  has_major_illness: false,
  has_injury: false,
  has_consistent_training: true,
  has_advanced_training: false,
  maf_hr: 155,
};

const mockSaveProfile = jest.fn();

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ProfileProvider
    value={{
      profile: mockProfile,
      loading: false,
      error: null,
      saveProfile: mockSaveProfile,
      saveStatus: 'idle',
    }}
  >
    {children}
  </ProfileProvider>
);

describe('useProfile Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns profile data', () => {
    const { result } = renderHook(() => useProfile(), { wrapper });
    expect(result.current.profile).toEqual(mockProfile);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('calls saveProfile with correct data', async () => {
    const { result } = renderHook(() => useProfile(), { wrapper });
    
    const updatedProfile = {
      age: 31,
      has_major_illness: false,
      has_injury: false,
      has_consistent_training: true,
      has_advanced_training: false,
      maf_hr: 155,
    };

    await act(async () => {
      await result.current.saveProfile(updatedProfile);
    });

    expect(mockSaveProfile).toHaveBeenCalledWith(updatedProfile);
  });

  it('handles loading state', () => {
    const loadingWrapper = ({ children }: { children: React.ReactNode }) => (
      <ProfileProvider
        value={{
          profile: null,
          loading: true,
          error: null,
          saveProfile: mockSaveProfile,
          saveStatus: 'idle',
        }}
      >
        {children}
      </ProfileProvider>
    );

    const { result } = renderHook(() => useProfile(), { wrapper: loadingWrapper });
    expect(result.current.loading).toBe(true);
  });

  it('handles error state', () => {
    const errorWrapper = ({ children }: { children: React.ReactNode }) => (
      <ProfileProvider
        value={{
          profile: null,
          loading: false,
          error: 'Test error',
          saveProfile: mockSaveProfile,
          saveStatus: 'idle',
        }}
      >
        {children}
      </ProfileProvider>
    );

    const { result } = renderHook(() => useProfile(), { wrapper: errorWrapper });
    expect(result.current.error).toBe('Test error');
  });
}); 