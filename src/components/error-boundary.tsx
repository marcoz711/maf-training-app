"use client";

import { Component, ReactNode } from 'react';
import { errorLogger } from '@/utils/error-logger';

interface ErrorBoundaryProps {
  fallback?: ReactNode;
  children: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  componentName?: string;
  errorType?: 'ui' | 'data' | 'auth' | 'api';
  retry?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

/**
 * Error Boundary component to catch and handle rendering errors
 * Usage:
 * <ErrorBoundary fallback={<ErrorFallback />}>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  async componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Log error based on type
    if (this.props.errorType === 'ui') {
      await errorLogger.logUIError(error, errorInfo, this.props.componentName || 'Unknown');
    } else if (this.props.errorType === 'data') {
      await errorLogger.logDataError(error, this.props.componentName || 'Unknown');
    } else if (this.props.errorType === 'auth') {
      await errorLogger.logAuthError(error, this.props.componentName || 'Unknown');
    } else if (this.props.errorType === 'api') {
      await errorLogger.logApiError(error, this.props.componentName || 'Unknown');
    } else {
      await errorLogger.logError(error, errorInfo, {
        componentName: this.props.componentName,
        errorType: this.props.errorType,
      });
    }

    // Call optional onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    if (this.props.retry) {
      this.props.retry();
    }
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          errorType={this.props.errorType}
        />
      );
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error?: Error;
  errorInfo?: React.ErrorInfo;
  onRetry: () => void;
  errorType?: string;
}

export function DefaultErrorFallback({
  error,
  errorInfo,
  onRetry,
  errorType,
}: DefaultErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg max-w-2xl mx-auto my-8">
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0">
          <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="ml-3">
          <h2 className="text-lg font-bold text-red-800">
            {errorType ? `${errorType} Error` : 'Something went wrong'}
          </h2>
          <p className="text-sm text-red-600">
            {error?.message || 'An unexpected error occurred'}
          </p>
        </div>
      </div>

      {isDevelopment && errorInfo?.componentStack && (
        <div className="mt-4 p-4 bg-red-100 rounded text-sm font-mono overflow-auto max-h-48">
          <pre className="text-red-800">{errorInfo.componentStack}</pre>
        </div>
      )}

      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Try again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Reload page
        </button>
      </div>
    </div>
  );
} 