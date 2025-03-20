"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import Navigation from '@/components/Navigation';

type DataSource = {
  id: string;
  name: string;
  description?: string;
};

const FitnessSyncerConnection = () => {
  const { user } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<string>('Loading...');
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [authCode, setAuthCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDataSources, setIsLoadingDataSources] = useState(false);

  const refreshToken = async () => {
    if (!user) return false;
    
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/fitnesssyncer/refresh-token', {
        method: 'POST',
        headers: {
          'x-user-id': user.id,
        },
      });
      
      if (!response.ok) {
        const data = await response.json();
        console.error('Token refresh failed:', data.error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchDataSources = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/fitnesssyncer/data-sources', {
        headers: {
          'x-user-id': user.id,
        },
      });
      
      if (response.status === 401) {
        const data = await response.json();
        if (data.error === 'Token expired, please reconnect') {
          // Try to refresh the token
          const refreshed = await refreshToken();
          if (refreshed) {
            // Retry fetching data sources
            return fetchDataSources();
          }
        }
        setError(data.error);
        setDataSources([]);
        return;
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setDataSources(data);
        setError(null);
      } else if (data.items && Array.isArray(data.items)) {
        setDataSources(data.items);
        setError(null);
      } else if (data.error) {
        console.log('API response:', data.error);
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
  }, [user, refreshToken]);

  const checkConnection = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const connectionResponse = await fetch('/api/fitnesssyncer/check-connection', {
        headers: {
          'x-user-id': user.id,
        },
      });
      
      const connectionData = await connectionResponse.json();
      
      if (connectionData.connected) {
        if (connectionData.status === 'expired') {
          // Try to refresh the token
          const refreshed = await refreshToken();
          if (refreshed) {
            setConnectionStatus('Connected');
            setIsConnected(true);
            setError(null);
            fetchDataSources();
          } else {
            setConnectionStatus('Token Expired');
            setIsConnected(false);
            setError('Token expired, please reconnect');
          }
        } else {
          setConnectionStatus('Connected');
          setIsConnected(true);
          setError(null);
          fetchDataSources();
        }
      } else {
        setConnectionStatus('Not Connected');
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      setConnectionStatus('Connection Error');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [user, refreshToken, fetchDataSources]);

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
    <>
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6">FitnessSyncer Connection</h1>
          
          {error && error !== 'FitnessSyncer connection not found' && (
            <div className="p-4 mb-6 bg-red-100 border border-red-400 text-red-700 rounded">
              <p>Error: {error}</p>
            </div>
          )}
          
          <div className="p-4 bg-gray-100 rounded-lg mb-6">
            <p className="text-gray-700 mb-4">
              Status: {isLoading ? (
                <span className="text-blue-600">Checking connection...</span>
              ) : (
                <span className={connectionStatus === 'Connected' ? 'text-green-600 font-bold' : 'text-amber-600'}>
                  {connectionStatus}
                </span>
              )}
              {isRefreshing && <span className="ml-2 text-blue-600">(Refreshing token...)</span>}
            </p>
            
            {!isLoading && (
              <>
                {!isConnected && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Step 1: Connect to FitnessSyncer</h3>
                      <button 
                        className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" 
                        onClick={handleConnect}
                        disabled={isRefreshing}
                      >
                        Connect to FitnessSyncer
                      </button>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Step 2: Copy the authorization code</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        After authorizing, you&apos;ll be redirected to a URL like:
                      </p>
                      <div className="overflow-x-auto">
                        <code className="block bg-gray-200 px-2 py-1 rounded text-sm whitespace-nowrap">
                          https://personal.fitnesssyncer.com/?code=YOUR_CODE&amp;state=connect
                        </code>
                      </div>
                      <p className="text-sm text-gray-600 my-4">
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
                          className="w-full sm:w-auto px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                        >
                          {isLoading ? 'Processing...' : 'Submit Code'}
                        </button>
                      </form>
                    </div>
                  </div>
                )}
                
                {isConnected && (
                  <button 
                    className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" 
                    onClick={handleConnect}
                    disabled={isRefreshing}
                  >
                    Reconnect to FitnessSyncer
                  </button>
                )}
              </>
            )}
          </div>
          
          {isConnected && !isLoading && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Available Data Sources</h2>
              {isLoadingDataSources ? (
                <div className="flex items-center space-x-2 text-gray-600">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Loading data sources...</span>
                </div>
              ) : dataSources.length > 0 ? (
                <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {dataSources.map((source, index) => (
                    <li key={index} className="p-4 bg-white rounded-lg shadow">
                      <h3 className="font-semibold">{source.name}</h3>
                      <p className="text-gray-600">{source.description}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">No data sources available</p>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default FitnessSyncerConnection; 