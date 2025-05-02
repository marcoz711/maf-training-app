"use client";

import { ReactNode } from 'react';
import { ErrorBoundary } from './error-boundary';
import { DefaultErrorFallback } from './error-boundary';

interface GlobalErrorBoundaryProps {
  children: ReactNode;
}

export function GlobalErrorBoundary({ children }: GlobalErrorBoundaryProps) {
  return (
    <ErrorBoundary
      errorType="ui"
      componentName="GlobalErrorBoundary"
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <DefaultErrorFallback
            onRetry={() => window.location.reload()}
          />
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
} 