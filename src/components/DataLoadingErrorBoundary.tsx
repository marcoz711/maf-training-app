"use client";

import { ReactNode } from 'react';
import { ErrorBoundary } from './error-boundary';

interface DataLoadingErrorBoundaryProps {
  children: ReactNode;
  componentName: string;
  onRetry?: () => void;
  fallback?: ReactNode;
}

export function DataLoadingErrorBoundary({
  children,
  componentName,
  onRetry,
  fallback,
}: DataLoadingErrorBoundaryProps) {
  return (
    <ErrorBoundary
      errorType="data"
      componentName={componentName}
      retry={onRetry}
      fallback={fallback}
    >
      {children}
    </ErrorBoundary>
  );
}

export function DataLoadingErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg max-w-2xl mx-auto my-8">
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0">
          <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="ml-3">
          <h2 className="text-lg font-bold text-yellow-800">Data Loading Error</h2>
          <p className="text-sm text-yellow-600">
            We couldn&apos;t load the data. Please try again.
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
        >
          Retry Loading
        </button>
      </div>
    </div>
  );
} 