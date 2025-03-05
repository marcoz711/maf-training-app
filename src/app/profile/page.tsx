"use client";

import { useAuth } from "@/contexts/auth-context";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'connected' | 'not_connected'>('loading');
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?message=Please login to view your profile');
    }
  }, [user, loading, router]);
  
  // Check FitnessSyncer connection status
  useEffect(() => {
    const checkConnectionStatus = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/fitnesssyncer/connection/status');
        const data = await response.json();
        
        setConnectionStatus(data.connected ? 'connected' : 'not_connected');
      } catch (error) {
        console.error('Error checking FitnessSyncer connection:', error);
        setConnectionStatus('not_connected');
      }
    };
    
    if (user) {
      checkConnectionStatus();
    }
  }, [user]);
  
  // Handle disconnect
  const handleDisconnect = async () => {
    if (!user) return;
    
    setIsDisconnecting(true);
    setConnectionError(null);
    
    try {
      const response = await fetch('/api/fitnesssyncer/connection/disconnect', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to disconnect');
      }
      
      // Update connection status
      setConnectionStatus('not_connected');
    } catch (error) {
      console.error('Error disconnecting from FitnessSyncer:', error);
      setConnectionError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsDisconnecting(false);
    }
  };
  
  // Handle connect button click
  const handleConnect = () => {
    router.push('/fitnesssyncer/connect');
  };
  
  // Show loading state while checking authentication
  if (loading) {
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
  
  return (
    <div className="max-w-4xl mx-auto mt-10 p-6">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Account Information</h2>
        <p className="mb-1"><strong>Email:</strong> {user.email}</p>
        <p><strong>User ID:</strong> {user.id}</p>
      </div>
      
      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">Connected Services</h2>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">FitnessSyncer</h3>
              <p className="text-sm text-gray-600">
                Sync your fitness activities from external services
              </p>
              {connectionError && (
                <p className="text-sm text-red-600 mt-1">{connectionError}</p>
              )}
            </div>
            <div>
              {connectionStatus === 'loading' ? (
                <p>Checking status...</p>
              ) : connectionStatus === 'connected' ? (
                <div className="flex items-center">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  <span className="text-green-600 font-medium">Connected</span>
                  <div className="ml-4 flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push('/fitnesssyncer/manage')}
                    >
                      Manage
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={handleDisconnect}
                      disabled={isDisconnecting}
                      className="text-red-600 hover:bg-red-50"
                    >
                      {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button 
                  onClick={handleConnect}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Connect with FitnessSyncer
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}