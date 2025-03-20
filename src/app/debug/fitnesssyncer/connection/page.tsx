"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";

export default function FitnessSyncerConnectionDebugPage() {
  const { user, loading } = useAuth();
  const [connectionData, setConnectionData] = useState<any>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchConnectionData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // 1. Get data directly from the database
        const supabase = createClient();
        
        const { data: dbData, error: dbError } = await supabase
          .from("api_connections")
          .select("*")
          .eq("provider", "fitnesssyncer")
          .eq("user_id", user.id)
          .single();
          
        if (dbError && dbError.code !== 'PGRST116') {
          console.error("Database error:", dbError);
          setError(`Database query error: ${dbError.message}`);
        }
        
        setConnectionData(dbData || null);
        
        // 2. Get data from the API
        const response = await fetch('/api/fitnesssyncer/connection/status', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        
        const apiData = await response.json();
        setApiResponse(apiData);
        
      } catch (err) {
        console.error("Error fetching connection data:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchConnectionData();
    }
  }, [user]);
  
  if (loading || isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 mt-10">
        <h1 className="text-2xl font-bold mb-6">FitnessSyncer Connection Debug</h1>
        <p>Loading connection data...</p>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6 mt-10">
        <h1 className="text-2xl font-bold mb-6">FitnessSyncer Connection Debug</h1>
        <p className="text-red-600">You must be logged in to view this page.</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6 mt-10">
      <h1 className="text-2xl font-bold mb-6">FitnessSyncer Connection Debug</h1>
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-6">
          <h2 className="font-semibold text-red-700 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">User Information</h2>
        <div className="bg-white p-4 border rounded-md shadow-sm">
          <p><strong>User ID:</strong> {user.id}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Database Connection Record</h2>
          <div className="bg-white p-4 border rounded-md shadow-sm">
            {connectionData ? (
              <div className="space-y-3">
                <p><strong>Status:</strong> {connectionData.status || 'Not set'}</p>
                <p><strong>Provider:</strong> {connectionData.provider}</p>
                <p><strong>ID:</strong> {connectionData.id}</p>
                <p><strong>Created:</strong> {connectionData.created_at ? new Date(connectionData.created_at).toLocaleString() : 'Not set'}</p>
                <p><strong>Updated:</strong> {connectionData.updated_at ? new Date(connectionData.updated_at).toLocaleString() : 'Not set'}</p>
                <p><strong>Has Access Token:</strong> {connectionData.access_token ? 'Yes' : 'No'}</p>
                <p><strong>Has Refresh Token:</strong> {connectionData.refresh_token ? 'Yes' : 'No'}</p>
                <p><strong>Token Expiry:</strong> {connectionData.token_expiry ? new Date(connectionData.token_expiry).toLocaleString() : 'Not set'}</p>
              </div>
            ) : (
              <p className="text-orange-600">No connection record found in database</p>
            )}
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">API Connection Response</h2>
          <div className="bg-white p-4 border rounded-md shadow-sm">
            {apiResponse ? (
              <div className="space-y-3">
                <p><strong>Connected:</strong> <span className={apiResponse.connected ? "text-green-600" : "text-red-600"}>{apiResponse.connected ? 'Yes' : 'No'}</span></p>
                <p><strong>Status:</strong> {apiResponse.status || 'Not reported'}</p>
                <p><strong>Connection ID:</strong> {apiResponse.connection_id || 'Not reported'}</p>
                <p><strong>Provider:</strong> {apiResponse.provider || 'Not reported'}</p>
                <p><strong>Created At:</strong> {apiResponse.created_at ? new Date(apiResponse.created_at).toLocaleString() : 'Not reported'}</p>
                <p><strong>Last Updated:</strong> {apiResponse.last_updated ? new Date(apiResponse.last_updated).toLocaleString() : 'Not reported'}</p>
                <p><strong>Expires At:</strong> {apiResponse.expires_at ? new Date(apiResponse.expires_at).toLocaleString() : 'Not reported'}</p>
              </div>
            ) : (
              <p className="text-orange-600">No response from API</p>
            )}
          </div>
        </div>
      </div>
      
      {connectionData && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Additional Info</h2>
          <div className="bg-white p-4 border rounded-md shadow-sm">
            <pre className="overflow-auto text-xs p-4 bg-gray-50 rounded-md">
              {connectionData.additional_info ? JSON.stringify(JSON.parse(connectionData.additional_info), null, 2) : 'None'}
            </pre>
          </div>
        </div>
      )}
      
      {apiResponse?.debug && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">API Debug Info</h2>
          <div className="bg-white p-4 border rounded-md shadow-sm">
            <pre className="overflow-auto text-xs p-4 bg-gray-50 rounded-md">
              {JSON.stringify(apiResponse.debug, null, 2)}
            </pre>
          </div>
        </div>
      )}
      
      <div className="flex justify-center mt-8">
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Refresh Data
        </button>
      </div>
    </div>
  );
} 