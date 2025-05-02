import { ErrorInfo } from 'react';

type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

interface ErrorContext {
  componentName?: string;
  errorType?: string;
  severity?: ErrorSeverity;
  additionalInfo?: Record<string, unknown>;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private isDevelopment: boolean;
  private analyticsEnabled: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.analyticsEnabled = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true';
  }

  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  private formatError(error: Error, errorInfo?: ErrorInfo, context?: ErrorContext): string {
    const timestamp = new Date().toISOString();
    const errorDetails = {
      timestamp,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      ...context,
    };

    return JSON.stringify(errorDetails, null, this.isDevelopment ? 2 : 0);
  }

  private logToConsole(error: Error, errorInfo?: ErrorInfo, context?: ErrorContext): void {
    if (this.isDevelopment) {
      console.error('Error Details:', this.formatError(error, errorInfo, context));
    } else {
      console.error('An error occurred:', error.message);
    }
  }

  private async logToAnalytics(error: Error, context?: ErrorContext): Promise<void> {
    if (!this.analyticsEnabled) return;

    try {
      // Replace with your actual analytics implementation
      // Example: await analytics.track('error', { error, ...context });
    } catch (analyticsError) {
      console.error('Failed to log error to analytics:', analyticsError);
    }
  }

  public async logError(
    error: Error,
    errorInfo?: ErrorInfo,
    context?: ErrorContext
  ): Promise<void> {
    this.logToConsole(error, errorInfo, context);
    await this.logToAnalytics(error, context);
  }

  public async logUIError(
    error: Error,
    errorInfo: ErrorInfo,
    componentName: string
  ): Promise<void> {
    await this.logError(error, errorInfo, {
      componentName,
      errorType: 'ui',
      severity: 'medium',
    });
  }

  public async logDataError(
    error: Error,
    componentName: string,
    additionalInfo?: Record<string, unknown>
  ): Promise<void> {
    await this.logError(error, undefined, {
      componentName,
      errorType: 'data',
      severity: 'high',
      additionalInfo,
    });
  }

  public async logAuthError(
    error: Error,
    componentName: string
  ): Promise<void> {
    await this.logError(error, undefined, {
      componentName,
      errorType: 'auth',
      severity: 'critical',
    });
  }

  public async logApiError(
    error: Error,
    componentName: string,
    endpoint?: string,
    requestData?: unknown
  ): Promise<void> {
    await this.logError(error, undefined, {
      componentName,
      errorType: 'api',
      severity: 'high',
      additionalInfo: {
        endpoint,
        requestData: this.isDevelopment ? requestData : undefined,
      },
    });
  }
}

export const errorLogger = ErrorLogger.getInstance(); 