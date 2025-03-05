'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertCircleIcon, BugIcon, CheckCircleIcon, ClipboardIcon, RefreshCwIcon, SettingsIcon, XIcon } from 'lucide-react';
import Link from 'next/link';

export default function FitnessSyncerDebugPage() {
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [debugSessionId, setDebugSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  
  // Check if debugging is enabled on the server
  useEffect(() => {
    const checkDebugStatus = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/fitnesssyncer/debug-status');
        const data = await response.json();
        setDebugEnabled(data.enabled);
        setStatusMessage(data.message || null);
      } catch (error) {
        console.error('Failed to check debug status:', error);
        setStatusMessage('Failed to check debug status');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkDebugStatus();
  }, []);
  
  // Track debug session ID from authorization flow
  const trackSession = (sessionId: string) => {
    setDebugSessionId(sessionId);
  };
  
  // Copy sessionId to clipboard
  const copySessionId = () => {
    if (debugSessionId) {
      navigator.clipboard.writeText(debugSessionId);
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">FitnessSyncer OAuth Debug</h1>
          <p className="text-muted-foreground">
            Debug and troubleshoot the OAuth connection with FitnessSyncer
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <BugIcon className={debugEnabled ? 'text-green-500' : 'text-muted-foreground'} />
          <span>Debug Mode: {debugEnabled ? 'Enabled' : 'Disabled'}</span>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Debug Status</CardTitle>
          <CardDescription>
            Current debugging configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Checking debug status...</p>
          ) : (
            <div className="space-y-4">
              <div className={`p-4 border rounded-md ${debugEnabled ? 'border-green-200 bg-green-50 text-green-800' : 'border-amber-200 bg-amber-50 text-amber-800'} flex items-start space-x-2`}>
                {debugEnabled ? (
                  <CheckCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-medium">
                    Debugging is {debugEnabled ? 'enabled' : 'disabled'}
                  </p>
                  <p className="text-sm">
                    {statusMessage || (debugEnabled 
                      ? 'Debug logs will be written to the server console' 
                      : 'Set FITNESSSYNCER_DEBUG=true in your environment to enable debugging')}
                  </p>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>Debugging can only be enabled by setting the <code className="bg-slate-100 px-1 py-0.5 rounded">FITNESSSYNCER_DEBUG=true</code> environment variable on the server.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Separator />
      
      <Tabs defaultValue="start">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="start">Start Authentication</TabsTrigger>
          <TabsTrigger value="token">Complete Authentication</TabsTrigger>
          <TabsTrigger value="logs">Debug Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="start" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Start OAuth Flow</CardTitle>
              <CardDescription>
                Begin the FitnessSyncer authorization process
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!debugEnabled && (
                <div className="p-4 border border-amber-200 rounded-md bg-amber-50 text-amber-800 flex items-start space-x-2">
                  <AlertCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Debugging is disabled</p>
                    <p className="text-sm">Enable debugging via environment variables to track the OAuth flow</p>
                  </div>
                </div>
              )}
              
              <p>
                This will start the OAuth flow with FitnessSyncer. You'll be redirected to 
                FitnessSyncer to authorize access to your data.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="redirect-uri">Redirect URI</Label>
                <Input 
                  id="redirect-uri" 
                  value={process.env.NEXT_PUBLIC_FITNESSSYNCER_REDIRECT_URI || "Not configured"} 
                  readOnly 
                />
                <p className="text-xs text-muted-foreground">
                  This URI must match the one configured in your FitnessSyncer application
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link href="/profile/connections" passHref>
                <Button variant="outline">Back to Connections</Button>
              </Link>
              <StartAuthButton 
                debugEnabled={debugEnabled} 
                onSuccess={trackSession} 
              />
            </CardFooter>
          </Card>
          
          {debugSessionId && (
            <Card>
              <CardHeader>
                <CardTitle>Debug Session</CardTitle>
                <CardDescription>
                  Your debug session ID for tracking this authorization flow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-sm py-1 px-3 font-mono">
                    {debugSessionId}
                  </Badge>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={copySessionId}
                    title="Copy to clipboard"
                  >
                    <ClipboardIcon className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Keep this ID to track your authorization flow in the logs
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="token" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Complete Authentication</CardTitle>
              <CardDescription>
                Complete the FitnessSyncer authorization process by providing the code and state
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CompleteAuthForm 
                debugEnabled={debugEnabled}
                debugSessionId={debugSessionId}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Debug Logs</CardTitle>
              <CardDescription>
                View logs from your OAuth flow sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border border-slate-200 rounded-md bg-slate-50">
                <p className="text-center text-muted-foreground py-8">
                  Logs are available in the server console when debug mode is enabled
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" disabled>
                <RefreshCwIcon className="mr-2 h-4 w-4" />
                Refresh Logs
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Component to start the authorization flow
function StartAuthButton({ debugEnabled, onSuccess }: { 
  debugEnabled: boolean; 
  onSuccess: (sessionId: string) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const startAuth = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/fitnesssyncer/authorize');
      const data = await response.json();
      
      if (data.success) {
        // If debugging is enabled, track the session ID
        if (debugEnabled && data.debug_session_id) {
          onSuccess(data.debug_session_id);
        }
        
        // Open the authorization URL in a new tab
        if (data.redirect_url) {
          window.open(data.redirect_url, '_blank');
        }
      } else {
        setError(data.error || 'Failed to start authorization');
      }
    } catch (error) {
      console.error('Failed to start authorization:', error);
      setError('Failed to start authorization');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-2">
      <Button 
        onClick={startAuth} 
        disabled={isLoading}
      >
        {isLoading ? 'Starting...' : 'Start Authorization'}
      </Button>
      
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
}

// Component to complete the authorization flow with code and state
function CompleteAuthForm({ debugEnabled, debugSessionId }: { 
  debugEnabled: boolean;
  debugSessionId: string | null;
}) {
  const [code, setCode] = useState('');
  const [state, setState] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const completeAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/fitnesssyncer/connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess('Connection established successfully!');
        // Clear form fields
        setCode('');
        setState('');
      } else {
        setError(data.error || data.details || 'Failed to complete authorization');
      }
    } catch (error) {
      console.error('Failed to complete authorization:', error);
      setError('Failed to complete authorization');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={completeAuth} className="space-y-4">
      {debugSessionId && (
        <div className="p-3 border border-blue-100 rounded-md bg-blue-50 text-blue-800 flex items-start space-x-2">
          <p className="text-xs">
            Debug Session ID: <span className="font-mono">{debugSessionId}</span>
          </p>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="code">Authorization Code</Label>
        <Input 
          id="code" 
          value={code} 
          onChange={(e) => setCode(e.target.value)}
          placeholder="The authorization code from the redirect URL"
          required
        />
        <p className="text-xs text-muted-foreground">
          After authorizing with FitnessSyncer, copy the "code" parameter from the URL
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="state">State Parameter</Label>
        <Input 
          id="state" 
          value={state} 
          onChange={(e) => setState(e.target.value)}
          placeholder="The state parameter from the redirect URL"
          required
        />
        <p className="text-xs text-muted-foreground">
          Copy the "state" parameter from the URL to verify the request
        </p>
      </div>
      
      {error && (
        <div className="p-3 border border-red-200 rounded-md bg-red-50 text-red-800 flex items-start space-x-2">
          <XIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
      
      {success && (
        <div className="p-3 border border-green-200 rounded-md bg-green-50 text-green-800 flex items-start space-x-2">
          <CheckCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Success</p>
            <p className="text-sm">{success}</p>
          </div>
        </div>
      )}
      
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Completing...' : 'Complete Authorization'}
        </Button>
      </div>
    </form>
  );
} 