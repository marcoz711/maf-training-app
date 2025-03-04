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

  const { code, userId } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' });
  }

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
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
      return res.status(400).json({ error: tokenData.error_description || 'Failed to get access token' });
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
      return res.status(500).json({ error: 'Failed to store connection' });
    }

    // Return success
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in exchange token handler:', error);
    return res.status(500).json({ error: 'Server error processing your request' });
  }
} 