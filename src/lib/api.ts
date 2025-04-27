import { NextApiRequest, NextApiResponse } from 'next';
import { ProfileError } from '@/types';

/**
 * Standard error response format
 */
export interface ApiErrorResponse {
  error: string;
  code?: string;
}

/**
 * Standard success response format
 */
export interface ApiSuccessResponse<T> {
  data: T;
}

/**
 * Creates a standardized error response
 */
export function standardErrorResponse(
  res: NextApiResponse,
  status: number,
  message: string,
  code?: string
) {
  console.error(`API Error [${status}]: ${message}`);
  
  const response: ApiErrorResponse = {
    error: message,
    ...(code && { code })
  };

  return res.status(status).json(response);
}

/**
 * Creates a standardized success response
 */
export function standardSuccessResponse<T>(
  res: NextApiResponse,
  data: T,
  status: number = 200
) {
  const response: ApiSuccessResponse<T> = {
    data
  };

  return res.status(status).json(response);
}

/**
 * Higher-order function that wraps API handlers with error handling
 */
export function withErrorHandling<T>(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<T>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const result = await handler(req, res);
      return standardSuccessResponse(res, result);
    } catch (error) {
      // Log the full error for debugging
      console.error('API Handler Error:', error);

      // Handle known error types
      if (error instanceof Error) {
        // Check if it's a ProfileError
        if ('code' in error) {
          return standardErrorResponse(
            res,
            400,
            error.message,
            (error as ProfileError).code
          );
        }
        
        // Handle other Error instances
        return standardErrorResponse(res, 500, error.message);
      }

      // Handle unknown error types
      return standardErrorResponse(
        res,
        500,
        'An unexpected error occurred'
      );
    }
  };
} 