import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Extract code from query parameters
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is missing' });
  }

  try {
    // Exchange the code for access token
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
      return res.redirect(`/connect/fitnesssyncer?error=${encodeURIComponent(tokenData.error_description || 'Failed to get access token')}`);
    }

    // Get user from cookie session (you might need to implement your own auth check here)
    const { data: { user } } = await supabase.auth.getUser(req.cookies['supabase-auth-token']);
    
    if (!user) {
      return res.redirect('/login?message=Please login first');
    }

    // Store tokens in the database
    const { access_token, refresh_token, expires_in } = tokenData;
    const { error } = await supabase.from('api_connections').upsert({
      user_id: user.id,
      provider: 'fitnesssyncer',
      access_token,
      refresh_token,
      token_expiry: new Date(Date.now() + expires_in * 1000).toISOString(),
      status: 'connected',
      scopes: 'sources',
    }, { onConflict: 'user_id, provider' });

    if (error) {
      console.error('Database error:', error);
      return res.redirect('/connect/fitnesssyncer?error=Failed to store connection');
    }

    // Redirect back to the connection page with success message
    return res.redirect('/connect/fitnesssyncer?status=connected');
  } catch (error) {
    console.error('Error in callback handler:', error);
    return res.redirect('/connect/fitnesssyncer?error=Server error processing your request');
  }
} 