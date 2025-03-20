import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    return res.status(401).json({ error: 'User ID is required' });
  }

  try {
    // Get the current connection with refresh token
    const { data: connection, error: connectionError } = await supabase
      .from('api_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'fitnesssyncer')
      .single();

    if (connectionError || !connection || !connection.refresh_token) {
      return res.status(404).json({ error: 'Valid connection not found' });
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
      return res.status(tokenResponse.status).json({ error: 'Failed to refresh token' });
    }

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Error refreshing token:', tokenData);
      return res.status(400).json({ error: tokenData.error_description || 'Failed to refresh token' });
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
      return res.status(500).json({ error: 'Failed to update tokens' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error refreshing token:', error);
    return res.status(500).json({ error: 'Server error' });
  }
} 