import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get user ID from header
  const userId = req.headers['x-user-id'] as string;

  if (!userId) {
    return res.status(401).json({ error: 'User ID is required' });
  }

  try {
    // Check if the user has a FitnessSyncer connection
    const { data: connection, error: connectionError } = await supabase
      .from('api_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'fitnesssyncer')
      .single();

    if (connectionError || !connection) {
      return res.status(200).json({ connected: false });
    }

    // Check if token is expired
    if (new Date(connection.token_expiry) < new Date()) {
      return res.status(200).json({ 
        connected: true, 
        status: 'expired',
        message: 'Token is expired, please reconnect'
      });
    }

    // User is connected with a valid token
    return res.status(200).json({ 
      connected: true,
      status: 'active'
    });
  } catch (error) {
    console.error('Error checking connection:', error);
    return res.status(500).json({ error: 'Server error' });
  }
} 