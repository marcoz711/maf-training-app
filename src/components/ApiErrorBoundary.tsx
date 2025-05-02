"use client";

import { ReactNode } from 'react';
import { ErrorBoundary } from './error-boundary';

interface ApiErrorBoundaryProps {
  children: ReactNode;
  componentName: string;
  endpoint?: string;
  onRetry?: () => void;
  fallback?: ReactNode;
}

export function ApiErrorBoundary({
  children,
  componentName,
  endpoint,
  onRetry,
  fallback,
}: ApiErrorBoundaryProps) {
  return (
    <ErrorBoundary
      errorType="api"
      componentName={componentName}
      retry={onRetry}
      fallback={fallback}
    >
      {children}
    </ErrorBoundary>
  );
}

export function ApiErrorFallback({ 
  onRetry,
  endpoint,
}: { 
  onRetry: () => void;
  endpoint?: string;
}) {
  return (
    <div className="p-6 bg-orange-50 border border-orange-200 rounded-lg max-w-2xl mx-auto my-8">
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0">
          <svg className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="ml-3">
          <h2 className="text-lg font-bold text-orange-800">API Error</h2>
          <p className="text-sm text-orange-600">
            {endpoint 
              ? `Failed to connect to ${endpoint}`
              : 'Failed to connect to the server'}
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
        >
          Retry Request
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
} 