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

    // Check if the user has a FitnessSyncer connection
    const { data: connection, error: connectionError } = await supabase
      .from('api_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'fitnesssyncer')
      .single();

    if (connectionError || !connection) {
    return standardSuccessResponse(res, { connected: false });
    }

    // Check if token is expired
    if (new Date(connection.token_expiry) < new Date()) {
    return standardSuccessResponse(res, { 
        connected: true, 
        status: 'expired',
        message: 'Token is expired, please reconnect'
      });
    }

    // User is connected with a valid token
  return standardSuccessResponse(res, { 
      connected: true,
      status: 'active'
    });
  }

export default withErrorHandling(handler); 