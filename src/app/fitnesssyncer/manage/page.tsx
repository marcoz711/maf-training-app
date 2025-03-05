"use client";

import { useAuth } from "@/contexts/auth-context";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/**
 * FitnessSyncer Management Page
 * 
 * This page allows users to:
 * - View connection details
 * - Reconnect if needed
 * - Disconnect their account
 */
export default function FitnessSyncerManagePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [connectionDetails, setConnectionDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?message=Please login to manage your FitnessSyncer connection');
    }
  }, [user, loading, router]);
  
  // Fetch connection details
  useEffect(() => {
    const fetchConnectionDetails = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Use the main connection endpoint we just created
        const response = await fetch('/api/fitnesssyncer/connection', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies for authentication
        });
        
        const data = await response.json();
        
        // Log for debugging
        console.log('Connection response:', data);
        
        if (!response.ok) {
          // Check if this is an authentication error
          if (response.status === 401) {
            // Redirect to login page
            router.push('/login?message=Please login to manage your FitnessSyncer connection');
            return;
          }
          
          throw new Error(data.error || 'Failed to fetch connection status');
        }
        
        setConnectionDetails(data);
        
        // If not connected, redirect to connect page after a short delay
        if (!data.connected) {
          setTimeout(() => {
            router.push('/fitnesssyncer/connect');
          }, 1500);
        }
      } catch (err) {
        console.error('Error fetching connection details:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchConnectionDetails();
    }
  }, [user, router]);
  
  // Handle disconnect
  const handleDisconnect = async () => {
    if (!user) return;
    
    setIsDisconnecting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/fitnesssyncer/connection/disconnect', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to disconnect');
      }
      
      // Redirect to profile page after successful disconnect
      router.push('/profile');
    } catch (err) {
      console.error('Error disconnecting from FitnessSyncer:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsDisconnecting(false);
    }
  };
  
  // Handle reconnect
  const handleReconnect = () => {
    router.push('/fitnesssyncer/connect');
  };
  
  // Show loading state while checking authentication
  if (loading || isLoading) {
    return (
      <div className="max-w-4xl mx-auto mt-10 p-6">
        <p>Loading...</p>
      </div>
    );
  }
  
  // Don't render anything if not authenticated (while redirecting)
  if (!user) {
    return null;
  }
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto mt-10 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">FitnessSyncer Connection</h1>
        <Button 
          variant="ghost"
          onClick={() => router.push('/profile')}
        >
          Back to Profile
        </Button>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-md text-red-700">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
          <div className="mt-3">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => router.push('/fitnesssyncer/connect')}
            >
              Try Connecting Again
            </Button>
          </div>
        </div>
      )}
      
      {!isLoading && !error && connectionDetails && !connectionDetails.connected && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-100 rounded-md text-yellow-700">
          <p className="font-medium">Not Connected</p>
          <p>You don't have an active connection to FitnessSyncer. Redirecting to the connection page...</p>
        </div>
      )}
      
      {connectionDetails && connectionDetails.connected && (
        <div className="space-y-6">
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <h2 className="text-xl font-semibold">Active Connection</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium">{connectionDetails.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Expires</p>
                <p className="font-medium">{formatDate(connectionDetails.expires_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="font-medium">{formatDate(connectionDetails.last_updated)}</p>
              </div>
            </div>
            
            <p className="mb-6 text-sm text-gray-600">
              Your FitnessSyncer account is connected and ready to use. You can disconnect or reconnect your account at any time.
            </p>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleReconnect}
              >
                Reconnect
              </Button>
              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="text-red-600 hover:bg-red-50"
              >
                {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
            <h3 className="font-semibold text-blue-800 mb-2">About FitnessSyncer</h3>
            <p className="text-blue-700 text-sm">
              FitnessSyncer allows you to sync your fitness data from various services, 
              making it easier to track and analyze your workout information. This connection 
              allows our app to access your activity data to provide you with training insights.
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 