"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';

type DataSource = {
  id: string;
  name: string;
};

const FitnessSyncerConnection = () => {
  const { user } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState('Not Connected');
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [authCode, setAuthCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const checkConnection = useCallback(async () => {
    if (!user) return;
    
    try {
      // First check if user is connected
      const connectionResponse = await fetch('/api/fitnesssyncer/check-connection', {
        headers: {
          'x-user-id': user.id || '',
        },
      });
      
      const connectionData = await connectionResponse.json();
      
      if (connectionData.connected) {
        setConnectionStatus('Connected');
        setIsConnected(true);
        fetchDataSources();
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  }, [user]);

  useEffect(() => {
    // Check for status or error parameters in the URL
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const errorMsg = params.get('error');
    
    if (status === 'connected') {
      setConnectionStatus('Connected');
      setIsConnected(true);
    }
    
    if (errorMsg) {
      setError(errorMsg);
    }

    // Check connection status on load
    if (user) {
      checkConnection();
    }
  }, [user, checkConnection]);

  const fetchDataSources = async () => {
    try {
      const response = await fetch('/api/fitnesssyncer/data-sources', {
        headers: {
          'x-user-id': user?.id || '',
        },
      });
      const data = await response.json();
      
      // Ensure we're setting an array, even if the API returns something else
      if (Array.isArray(data)) {
        setDataSources(data);
      } else if (data.items && Array.isArray(data.items)) {
        setDataSources(data.items);
      } else if (data.error) {
        console.log('API response:', data.error);
        // Don't show connection not found error to user
        if (data.error !== 'FitnessSyncer connection not found') {
          setError(data.error);
        }
        setDataSources([]);
      } else {
        console.error('Unexpected data format from API:', data);
        setDataSources([]);
      }
    } catch (error) {
      console.error('Error fetching data sources:', error);
      setDataSources([]);
    }
  };

  const handleConnect = async () => {
    try {
      const clientId = process.env.NEXT_PUBLIC_FITNESSSYNCER_CLIENT_ID;
      const redirectUri = process.env.NEXT_PUBLIC_FITNESSSYNCER_REDIRECT_URI;
      const authUrl = `${process.env.NEXT_PUBLIC_FITNESSSYNCER_AUTH_URL}?client_id=${clientId}&response_type=code&scope=sources&redirect_uri=${redirectUri}&state=connect`;
      window.open(authUrl, '_blank');
    } catch (error) {
      console.error('Error connecting to FitnessSyncer:', error);
      setConnectionStatus('Connection Failed');
    }
  };

  const handleAuthCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!authCode.trim()) {
      setError('Please enter the authorization code');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/fitnesssyncer/exchange-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: authCode,
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setConnectionStatus('Connected');
        setIsConnected(true);
        setAuthCode('');
        fetchDataSources();
      }
    } catch (error) {
      console.error('Error exchanging token:', error);
      setError('Failed to exchange token, please try again');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto mt-10 p-6 border rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6">FitnessSyncer Connection</h1>
      
      {error && error !== 'FitnessSyncer connection not found' && (
        <div className="p-4 mb-6 bg-red-100 border border-red-400 text-red-700 rounded">
          <p>Error: {error}</p>
        </div>
      )}
      
      <div className="p-4 bg-gray-100 rounded-lg mb-6">
        <p className="text-gray-700 mb-4">
          Status: <span className={connectionStatus === 'Connected' ? 'text-green-600 font-bold' : 'text-amber-600'}>{connectionStatus}</span>
        </p>
        {!isConnected && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Step 1: Connect to FitnessSyncer</h3>
              <button 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" 
                onClick={handleConnect}
              >
                Connect to FitnessSyncer
              </button>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Step 2: Copy the authorization code</h3>
              <p className="text-sm text-gray-600 mb-2">
                After authorizing, you'll be redirected to a URL like: <br />
                <code className="bg-gray-200 px-2 py-1 rounded">https://personal.fitnesssyncer.com/?code=YOUR_CODE&amp;state=connect</code>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Copy the code value (between &quot;code=&quot; and &quot;&amp;state=&quot;) and paste it below.
              </p>
              
              <form onSubmit={handleAuthCodeSubmit} className="space-y-3">
                <div>
                  <label htmlFor="auth-code" className="block text-sm font-medium text-gray-700">
                    Authorization Code
                  </label>
                  <input
                    id="auth-code"
                    type="text"
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Paste authorization code here"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : 'Submit Code'}
                </button>
              </form>
            </div>
          </div>
        )}
        
        {isConnected && (
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={handleConnect}>
            Reconnect to FitnessSyncer
          </button>
        )}
      </div>
      
      {isConnected && (
        <>
          <h2 className="text-2xl font-bold mb-4">Available Data Sources</h2>
          {dataSources.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {dataSources.map((source) => (
                <li key={source.id} className="py-4">
                  <div className="flex items-center">
                    <div className="ml-3">
                      <p className="text-lg font-medium text-gray-900">{source.name}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No data sources available</p>
          )}
        </>
      )}
    </main>
  );
};

export default FitnessSyncerConnection; 