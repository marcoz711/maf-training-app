import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { AuthProvider } from '@/contexts/auth-context';
import { ProfileProvider } from '@/contexts/profile-context';

// Mock implementations
const mockAuthContext = {
  user: null,
  signIn: jest.fn(),
  signOut: jest.fn(),
  loading: false,
  error: null,
};

const mockProfileContext = {
  profile: null,
  loading: false,
  error: null,
  saveProfile: jest.fn(),
  saveStatus: 'idle',
};

function render(ui: React.ReactElement, { ...renderOptions } = {}) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AuthProvider value={mockAuthContext}>
        <ProfileProvider value={mockProfileContext}>
          {children}
        </ProfileProvider>
      </AuthProvider>
    );
  }
  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { render }; 