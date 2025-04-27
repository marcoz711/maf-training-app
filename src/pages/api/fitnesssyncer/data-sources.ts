import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { withErrorHandling, standardErrorResponse, standardSuccessResponse } from '@/lib/api';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get user ID from header
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    return standardErrorResponse(res, 401, 'User ID is required', 'MISSING_USER_ID');
  }

    // Get the user's FitnessSyncer connection
    const { data: connection, error: connectionError } = await supabase
      .from('api_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'fitnesssyncer')
      .single();

    if (connectionError || !connection) {
    return standardErrorResponse(res, 404, 'FitnessSyncer connection not found', 'NO_CONNECTION');
    }

    // Check if token is expired
    if (new Date(connection.token_expiry) < new Date()) {
    return standardErrorResponse(res, 401, 'Token expired, please reconnect', 'TOKEN_EXPIRED');
    }

    // Fetch data sources from FitnessSyncer
    const response = await fetch(`${process.env.FITNESSSYNCER_API_URL || 'https://api.fitnesssyncer.com/api'}/providers/sources/`, {
      headers: {
        Authorization: `Bearer ${connection.access_token}`,
      },
    });

    if (!response.ok) {
      // If the API returns an unauthorized error, the token might be invalid
      if (response.status === 401) {
      return standardErrorResponse(res, 401, 'Token expired, please reconnect', 'TOKEN_EXPIRED');
      }
    return standardErrorResponse(
      res, 
      response.status, 
      `Failed to fetch data sources: ${response.statusText}`,
      'API_ERROR'
    );
    }

    const data = await response.json();
    
    // Ensure we're returning an array
    if (data && data.items && Array.isArray(data.items)) {
    return standardSuccessResponse(res, data.items);
    } else {
      console.error('Unexpected response format from FitnessSyncer:', data);
    return standardSuccessResponse(res, []);
    }
}

export default withErrorHandling(handler); 