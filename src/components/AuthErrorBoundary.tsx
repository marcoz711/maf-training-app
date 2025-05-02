"use client";

import { ReactNode } from 'react';
import { ErrorBoundary } from './error-boundary';
import { useRouter } from 'next/navigation';

interface AuthErrorBoundaryProps {
  children: ReactNode;
  componentName: string;
  fallback?: ReactNode;
}

export function AuthErrorBoundary({
  children,
  componentName,
  fallback,
}: AuthErrorBoundaryProps) {
  const router = useRouter();

  const handleRetry = () => {
    // Redirect to login page or refresh auth token
    router.push('/login');
  };

  return (
    <ErrorBoundary
      errorType="auth"
      componentName={componentName}
      retry={handleRetry}
      fallback={fallback}
    >
      {children}
    </ErrorBoundary>
  );
}

export function AuthErrorFallback() {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg max-w-2xl mx-auto my-8">
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0">
          <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div className="ml-3">
          <h2 className="text-lg font-bold text-red-800">Authentication Error</h2>
          <p className="text-sm text-red-600">
            Your session has expired or you don&apos;t have permission to access this resource.
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={() => window.location.href = '/login'}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
} 