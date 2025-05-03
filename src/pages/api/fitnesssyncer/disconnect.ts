import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { withErrorHandling, standardErrorResponse, standardSuccessResponse } from '@/lib/api';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return standardErrorResponse(res, 405, 'Method not allowed');
  }

  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    return standardErrorResponse(res, 401, 'User ID is required', 'MISSING_USER_ID');
  }

  // Delete the FitnessSyncer connection
  const { error } = await supabase
    .from('api_connections')
    .delete()
    .eq('user_id', userId)
    .eq('provider', 'fitnesssyncer');

  if (error) {
    console.error('Error deleting connection:', error);
    return standardErrorResponse(res, 500, 'Failed to delete connection', 'DB_DELETE_ERROR');
  }

  return standardSuccessResponse(res, { message: 'Successfully disconnected from FitnessSyncer' });
}

export default withErrorHandling(handler); 