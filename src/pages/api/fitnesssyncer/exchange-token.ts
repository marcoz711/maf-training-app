import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { withErrorHandling, standardErrorResponse } from '@/lib/api';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return standardErrorResponse(res, 405, 'Method not allowed');
  }

  const { code, userId } = req.body;

  if (!code) {
    return standardErrorResponse(res, 400, 'Authorization code is required', 'MISSING_CODE');
  }

  if (!userId) {
    return standardErrorResponse(res, 400, 'User ID is required', 'MISSING_USER_ID');
  }

    // Exchange the authorization code for access token
    const tokenResponse = await fetch(process.env.FITNESSSYNCER_TOKEN_URL || '', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code.toString(),
        client_id: process.env.NEXT_PUBLIC_FITNESSSYNCER_CLIENT_ID || '',
        client_secret: process.env.FITNESSSYNCER_CLIENT_SECRET || '',
        redirect_uri: process.env.NEXT_PUBLIC_FITNESSSYNCER_REDIRECT_URI || '',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Error from FitnessSyncer:', tokenData);
    return standardErrorResponse(
      res, 
      400, 
      tokenData.error_description || 'Failed to get access token',
      'TOKEN_EXCHANGE_FAILED'
    );
    }

    // Store tokens in the database
    const { access_token, refresh_token, expires_in } = tokenData;
    const { error } = await supabase.from('api_connections').upsert({
      user_id: userId,
      provider: 'fitnesssyncer',
      access_token,
      refresh_token,
      token_expiry: new Date(Date.now() + expires_in * 1000).toISOString(),
      status: 'connected',
      scopes: ['sources'],
    }, { onConflict: 'user_id, provider' });

    if (error) {
      console.error('Database error:', error);
    return standardErrorResponse(res, 500, 'Failed to store connection', 'DB_STORE_ERROR');
    }

  return { success: true };
}

export default withErrorHandling(handler); 