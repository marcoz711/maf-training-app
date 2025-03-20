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
    // Get the user's FitnessSyncer connection
    const { data: connection, error: connectionError } = await supabase
      .from('api_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'fitnesssyncer')
      .single();

    if (connectionError || !connection) {
      return res.status(404).json({ error: 'FitnessSyncer connection not found' });
    }

    // Check if token is expired
    if (new Date(connection.token_expiry) < new Date()) {
      return res.status(401).json({ error: 'Token expired, please reconnect' });
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
        return res.status(401).json({ error: 'Token expired, please reconnect' });
      }
      return res.status(response.status).json({ error: `Failed to fetch data sources: ${response.statusText}` });
    }

    const data = await response.json();
    
    // Ensure we're returning an array
    if (data && data.items && Array.isArray(data.items)) {
      return res.status(200).json(data.items);
    } else {
      console.error('Unexpected response format from FitnessSyncer:', data);
      return res.status(200).json([]);
    }
  } catch (error) {
    console.error('Error fetching data sources:', error);
    return res.status(500).json({ error: 'Server error' });
  }
} 