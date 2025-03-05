/**
 * FitnessSyncer OAuth Flow Debugging Utility
 * 
 * This module provides debugging utilities for tracking the OAuth flow with FitnessSyncer.
 * Debugging can be enabled by setting the environment variable FITNESSSYNCER_DEBUG=true
 */

import crypto from 'crypto';

/**
 * Enum for OAuth flow stages
 */
export enum OAuthStage {
  AUTH_START = 'AUTH_START',
  AUTH_REDIRECT = 'AUTH_REDIRECT',
  AUTH_CALLBACK = 'AUTH_CALLBACK',
  CODE_RECEIVED = 'CODE_RECEIVED',
  TOKEN_EXCHANGE = 'TOKEN_EXCHANGE',
  TOKEN_STORE = 'TOKEN_STORE',
  CONNECTION_COMPLETE = 'CONNECTION_COMPLETE',
  CONNECTION_CHECK = 'CONNECTION_CHECK',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  ERROR = 'ERROR'
}

/**
 * Check if debugging is enabled
 * 
 * Debugging is enabled through the environment variable FITNESSSYNCER_DEBUG=true
 */
export function isDebuggingEnabled(): boolean {
  return process.env.FITNESSSYNCER_DEBUG === 'true';
}

/**
 * Generate a unique session ID for tracking a single OAuth flow
 */
export function generateSessionId(): string {
  return crypto.randomBytes(8).toString('hex');
}

/**
 * Format a timestamped debug message
 */
function formatDebugMessage(sessionId: string, stage: OAuthStage, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [FitnessSyncer] [${sessionId}] [${stage}] ${message}`;
}

/**
 * Log an OAuth flow step
 */
export function logOAuthStep(sessionId: string, stage: OAuthStage, message: string): void {
  if (!isDebuggingEnabled()) return;
  
  const formattedMessage = formatDebugMessage(sessionId, stage, message);
  console.log(formattedMessage);
}

/**
 * Log an OAuth flow error
 */
export function logOAuthError(
  sessionId: string, 
  stage: OAuthStage, 
  error: Error, 
  context?: string
): void {
  if (!isDebuggingEnabled()) return;
  
  const errorMessage = `ERROR: ${error.message}${context ? ` - ${context}` : ''}`;
  const formattedMessage = formatDebugMessage(sessionId, stage, errorMessage);
  console.error(formattedMessage);
  
  // If we have a stack trace, log it with proper indentation
  if (error.stack) {
    const stackLines = error.stack.split('\n');
    // Skip the first line as it's usually the error message we already logged
    const stackTrace = stackLines.slice(1).map(line => `  ${line.trim()}`).join('\n');
    console.error(`[${sessionId}] Stack trace:\n${stackTrace}`);
  }
}

/**
 * Sanitize and validate a token for logging purposes
 * Returns a safe representation of the token info for debugging
 */
export function validateToken(token: string): Record<string, unknown> {
  if (!token) {
    return { valid: false, reason: 'empty token' };
  }
  
  try {
    // Return basic info about the token without exposing it
    return {
      valid: true,
      length: token.length,
      firstChar: token.charAt(0),
      lastChar: token.charAt(token.length - 1),
      truncated: `${token.substring(0, 3)}...${token.substring(token.length - 3)}`
    };
  } catch (error) {
    return { 
      valid: false, 
      reason: error instanceof Error ? error.message : 'unknown error'
    };
  }
}

/**
 * Log an API response for debugging (sanitizing sensitive data)
 */
export function logApiResponse(
  sessionId: string,
  stage: OAuthStage, 
  response: any, 
  context?: string
): void {
  if (!isDebuggingEnabled()) return;
  
  try {
    // Clone the response to avoid modifying the original
    const sanitizedResponse = JSON.parse(JSON.stringify(response));
    
    // Sanitize sensitive fields if they exist
    if (sanitizedResponse.access_token) sanitizedResponse.access_token = '[REDACTED]';
    if (sanitizedResponse.refresh_token) sanitizedResponse.refresh_token = '[REDACTED]';
    if (sanitizedResponse.token) sanitizedResponse.token = '[REDACTED]';
    
    // Log the sanitized response
    const responseStr = JSON.stringify(sanitizedResponse, null, 2);
    const contextMsg = context ? `${context}:\n` : '';
    const message = `${contextMsg}${responseStr}`;
    
    logOAuthStep(sessionId, stage, message);
  } catch (error) {
    logOAuthError(
      sessionId, 
      stage, 
      error instanceof Error ? error : new Error('Failed to log API response'),
      'Could not stringify or sanitize response'
    );
  }
}

/**
 * Log a request for debugging (sanitizing sensitive data)
 */
export function logApiRequest(
  sessionId: string,
  stage: OAuthStage,
  url: string,
  method: string,
  headers: Record<string, string>,
  body?: any,
  context?: string
): void {
  if (!isDebuggingEnabled()) return;
  
  try {
    // Clone the headers and body to avoid modifying the originals
    const sanitizedHeaders = { ...headers };
    let sanitizedBody = body ? JSON.parse(JSON.stringify(body)) : undefined;
    
    // Sanitize sensitive header fields
    if (sanitizedHeaders.authorization) sanitizedHeaders.authorization = '[REDACTED]';
    if (sanitizedHeaders.Authorization) sanitizedHeaders.Authorization = '[REDACTED]';
    
    // Sanitize sensitive body fields
    if (sanitizedBody) {
      if (sanitizedBody.client_secret) sanitizedBody.client_secret = '[REDACTED]';
      if (sanitizedBody.code) sanitizedBody.code = '[REDACTED]';
      if (sanitizedBody.refresh_token) sanitizedBody.refresh_token = '[REDACTED]';
    }
    
    // Construct the message
    const headersStr = JSON.stringify(sanitizedHeaders, null, 2);
    const bodyStr = sanitizedBody ? `\nBody: ${JSON.stringify(sanitizedBody, null, 2)}` : '';
    const contextMsg = context ? `${context} - ` : '';
    const message = `${contextMsg}${method} ${url}\nHeaders: ${headersStr}${bodyStr}`;
    
    logOAuthStep(sessionId, stage, message);
  } catch (error) {
    logOAuthError(
      sessionId, 
      stage, 
      error instanceof Error ? error : new Error('Failed to log API request'),
      'Could not stringify or sanitize request'
    );
  }
} 