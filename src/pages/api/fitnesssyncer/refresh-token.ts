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

    // Get the current connection with refresh token
    const { data: connection, error: connectionError } = await supabase
      .from('api_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'fitnesssyncer')
      .single();

    if (connectionError || !connection || !connection.refresh_token) {
    return standardErrorResponse(res, 404, 'Valid connection not found', 'NO_CONNECTION');
    }

    // Request new tokens using refresh token
    const tokenResponse = await fetch(process.env.FITNESSSYNCER_TOKEN_URL || '', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: connection.refresh_token,
        client_id: process.env.NEXT_PUBLIC_FITNESSSYNCER_CLIENT_ID || '',
        client_secret: process.env.FITNESSSYNCER_CLIENT_SECRET || '',
        redirect_uri: process.env.NEXT_PUBLIC_FITNESSSYNCER_REDIRECT_URI || '',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token refresh failed with status:', tokenResponse.status, 'Response:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        return standardErrorResponse(
          res, 
          tokenResponse.status, 
          errorData.error_description || 'Failed to refresh token', 
          errorData.error || 'TOKEN_REFRESH_FAILED'
        );
      } catch {
        return standardErrorResponse(
          res, 
          tokenResponse.status, 
          'Failed to refresh token', 
          'TOKEN_REFRESH_FAILED'
        );
      }
    }

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Error refreshing token:', tokenData);
      return standardErrorResponse(
        res, 
        400, 
        tokenData.error_description || 'Failed to refresh token', 
        tokenData.error || 'TOKEN_ERROR'
      );
    }

    // Update tokens in database
    const { access_token, refresh_token, expires_in } = tokenData;
    const { error: updateError } = await supabase
      .from('api_connections')
      .update({
        access_token,
        refresh_token,
        token_expiry: new Date(Date.now() + expires_in * 1000).toISOString(),
        status: 'connected',
      })
      .eq('user_id', userId)
      .eq('provider', 'fitnesssyncer');

    if (updateError) {
      console.error('Error updating tokens:', updateError);
      return standardErrorResponse(
        res, 
        500, 
        'Failed to update tokens in database', 
        'DB_UPDATE_ERROR'
      );
    }

    return standardSuccessResponse(res, { 
      token_expiry: new Date(Date.now() + expires_in * 1000).toISOString(),
      status: 'connected'
    });
}

export default withErrorHandling(handler); 