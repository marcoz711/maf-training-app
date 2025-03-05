"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  generateSessionId, 
  logOAuthStep, 
  logOAuthError, 
  validateToken,
  OAuthStage, 
  isDebuggingEnabled 
} from "@/utils/fitnesssyncer-debug";
import { createClient } from "@/lib/supabase/client";

interface FitnessSyncerCodeEntryProps {
  sessionId?: string;
  state?: string; // Allow state to be passed as a prop
}

/**
 * FitnessSyncer Code Entry Component
 * 
 * This component allows users to manually enter the authorization code
 * they receive after authorizing with FitnessSyncer. The code is then
 * sent to the API to exchange for access tokens.
 */
export function FitnessSyncerCodeEntry({ sessionId, state: propState }: FitnessSyncerCodeEntryProps) {
  const router = useRouter();
  const [code, setCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [internalSessionId, setInternalSessionId] = useState<string>("");
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [state, setState] = useState<string | undefined>(propState);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  
  // Function to get cookie value by name
  const getCookie = (name: string): string | undefined => {
    if (typeof document === 'undefined') return undefined;
    
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : undefined;
  };
  
  // Initialize debugging session if needed
  useEffect(() => {
    setDebugEnabled(isDebuggingEnabled());
    
    // If state is already set via props, use that
    if (propState) {
      setState(propState);
      if (isDebuggingEnabled() && sessionId) {
        logOAuthStep(
          sessionId,
          OAuthStage.CODE_RECEIVED,
          `Using state from props: ${propState.substring(0, 10)}...`
        );
      }
      return;
    }
    
    // Try to get state from multiple sources
    const currentSessionId = sessionId || internalSessionId;
    let stateValue: string | undefined;
    
    // 1. Try sessionStorage first
    if (typeof window !== 'undefined') {
      stateValue = sessionStorage.getItem('fitnesssyncer_state') || undefined;
      if (stateValue && isDebuggingEnabled() && currentSessionId) {
        logOAuthStep(
          currentSessionId,
          OAuthStage.CODE_RECEIVED,
          `Retrieved state from sessionStorage: ${stateValue.substring(0, 10)}...`
        );
      }
    }
    
    // 2. If not found, try client-accessible cookie
    if (!stateValue) {
      stateValue = getCookie('fitnesssyncer_state_client');
      if (stateValue && isDebuggingEnabled() && currentSessionId) {
        logOAuthStep(
          currentSessionId,
          OAuthStage.CODE_RECEIVED,
          `Retrieved state from client cookie: ${stateValue.substring(0, 10)}...`
        );
      }
    }
    
    // 3. Last resort, try the httpOnly cookie through URL parameter
    if (!stateValue && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      stateValue = urlParams.get('state') || undefined;
      if (stateValue && isDebuggingEnabled() && currentSessionId) {
        logOAuthStep(
          currentSessionId,
          OAuthStage.CODE_RECEIVED,
          `Retrieved state from URL parameter: ${stateValue.substring(0, 10)}...`
        );
      }
    }
    
    if (stateValue) {
      setState(stateValue);
    }
    
    // If no sessionId was provided, try to get it from sessionStorage
    if (!sessionId && typeof window !== "undefined") {
      const storedSessionId = sessionStorage.getItem("fitnesssyncer_session_id");
      if (storedSessionId) {
        setInternalSessionId(storedSessionId);
        if (isDebuggingEnabled()) {
          logOAuthStep(
            storedSessionId, 
            OAuthStage.CODE_RECEIVED, 
            "Code entry component mounted with session ID from storage"
          );
        }
      }
    } else if (sessionId) {
      setInternalSessionId(sessionId);
      if (isDebuggingEnabled()) {
        logOAuthStep(
          sessionId, 
          OAuthStage.CODE_RECEIVED, 
          "Code entry component mounted with provided session ID"
        );
      }
    }
  }, [sessionId, propState, internalSessionId]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset states
    setError(null);
    setIsLoading(true);
    setIsConnected(false);
    setMessage("");
    
    const currentSessionId = sessionId || internalSessionId;
    
    try {
      // Validate input
      if (!code || code.trim() === "") {
        if (debugEnabled && currentSessionId) {
          logOAuthError(
            currentSessionId, 
            OAuthStage.CODE_RECEIVED, 
            new Error("Empty authorization code provided")
          );
        }
        throw new Error("Please enter the authorization code");
      }
      
      if (!state) {
        if (debugEnabled && currentSessionId) {
          logOAuthError(
            currentSessionId, 
            OAuthStage.CODE_RECEIVED, 
            new Error("Missing state parameter"),
            "State parameter not found in cookies, sessionStorage, or URL"
          );
        }
        throw new Error("Missing state parameter. Please restart the authorization process.");
      }
      
      const trimmedCode = code.trim();
      
      if (debugEnabled && currentSessionId) {
        logOAuthStep(
          currentSessionId, 
          OAuthStage.CODE_RECEIVED, 
          `Authorization code received (length: ${trimmedCode.length})`
        );
      }
      
      // Call the API to exchange the code for tokens
      if (debugEnabled && currentSessionId) {
        logOAuthStep(
          currentSessionId, 
          OAuthStage.TOKEN_EXCHANGE, 
          "Initiating token exchange"
        );
      }
      
      const response = await fetch("/api/fitnesssyncer/connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          code: trimmedCode,
          state: state
        }),
      });
      
      // Log the raw response for debugging
      console.log("Raw response status:", response.status);
      console.log("Raw response headers:", Object.fromEntries([...response.headers.entries()]));
      
      let data;
      try {
        const textResponse = await response.text();
        console.log("Raw response text:", textResponse);
        
        try {
          data = JSON.parse(textResponse);
          console.log("Parsed response data:", data);
        } catch (jsonError) {
          console.error("JSON parse error:", jsonError);
          throw new Error(`Invalid JSON response: ${textResponse.substring(0, 100)}...`);
        }
      } catch (parseError) {
        console.error("Error getting response text:", parseError);
        throw new Error("Invalid response from server. Could not read response text.");
      }
      
      if (!response.ok || data.error) {
        const errorMsg = data.error || data.details || 
                      `Failed to connect (${response.status}: ${response.statusText})`;
        
        if (debugEnabled && currentSessionId) {
          logOAuthError(
            currentSessionId, 
            OAuthStage.TOKEN_EXCHANGE, 
            new Error(errorMsg),
            `Response: ${JSON.stringify(data)}`
          );
        }
        
        console.error("Connection error details:", data);
        
        let detailedError = errorMsg;
        if (data.details || data.hint || data.code) {
          detailedError += `\n\nDetails: ${data.details || 'None'}`;
          if (data.hint) detailedError += `\nHint: ${data.hint}`;
          if (data.code) detailedError += `\nCode: ${data.code}`;
        }
        
        throw new Error(detailedError);
      }
      
      // If we get here, the connection was successful and we have the token
      if (debugEnabled && currentSessionId) {
        logOAuthStep(
          currentSessionId, 
          OAuthStage.CONNECTION_COMPLETE, 
          "Connection successful: " + (data.message || "No details provided")
        );
      }
      
      // Now we need to store the token in the database using the client-side Supabase SDK
      // This should respect RLS policies since it uses the authenticated user's session
      try {
        const supabase = createClient();
        
        // Check if we have an existing connection
        const { data: existingConnections, error: fetchError } = await supabase
          .from("api_connections")
          .select("id")
          .eq("provider", "fitnesssyncer")
          .single();
          
        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "No rows found"
          console.error("Error checking for existing connections:", fetchError);
          throw new Error(`Failed to check for existing connections: ${fetchError.message}`);
        }
        
        let dbError;
        
        // If connection exists, update it
        if (existingConnections?.id) {
          const { error } = await supabase
            .from("api_connections")
            .update({
              access_token: data.access_token,
              refresh_token: data.refresh_token,
              token_expiry: data.token_expiry,
              status: "active",
              additional_info: JSON.stringify(data),
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingConnections.id);
            
          dbError = error;
        } 
        // Otherwise create a new one
        else {
          const { error } = await supabase
            .from("api_connections")
            .insert({
              provider: data.provider,
              access_token: data.access_token,
              refresh_token: data.refresh_token,
              token_expiry: data.token_expiry,
              status: "active",
              additional_info: JSON.stringify(data),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            
          dbError = error;
        }
        
        if (dbError) {
          console.error("Error saving connection to database:", dbError);
          throw new Error(`Failed to save connection: ${dbError.message}`);
        }
        
        setIsConnected(true);
        setMessage(data.message || "Successfully connected to FitnessSyncer!");
        setIsLoading(false);
        
        // Success! Show a success message and then redirect
        setTimeout(() => {
          router.push("/fitnesssyncer/manage");
          router.refresh();
        }, 1500);
      } catch (dbErr: any) {
        console.error("Database error:", dbErr);
        
        // We still got the token, so tell the user the partial success
        setIsConnected(true);
        setMessage("Connected to FitnessSyncer, but couldn't save your connection details. Please try again later.");
        setIsLoading(false);
        
        if (debugEnabled && currentSessionId) {
          logOAuthError(
            currentSessionId, 
            OAuthStage.TOKEN_STORE, 
            dbErr,
            "Error saving connection data to database"
          );
        }
      }
    } catch (err: any) {
      setError(err.message || "An unknown error occurred");
      setIsLoading(false);
      
      if (debugEnabled && currentSessionId) {
        logOAuthError(
          currentSessionId, 
          OAuthStage.CONNECTION_ERROR, 
          err,
          "Error in connection process"
        );
      }
    }
  };
  
  // Handle cancellation
  const handleCancel = () => {
    router.push("/profile"); // Redirect back to profile page
  };

  // Add a reset handler to try again
  const handleReset = () => {
    setError(null);
    setCode("");
    setIsLoading(false);
    setIsConnected(false);
    setMessage("");
  };
  
  return (
    <div className="border rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Enter Authorization Code</h2>
      
      {/* Success message */}
      {success && (
        <div className="mb-6 p-3 bg-green-50 text-green-700 rounded-md">
          <p className="font-medium">Connection Successful!</p>
          <p>{message}</p>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-md">
          <p className="font-medium">Error:</p>
          <p className="whitespace-pre-wrap">{error}</p>
          <div className="mt-3">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleReset}
            >
              Try Again
            </Button>
          </div>
        </div>
      )}
      
      {/* Code entry form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label 
            htmlFor="code" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Authorization Code
          </label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your authorization code here"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading || success}
          />
          <p className="text-xs text-gray-500 mt-1">
            This is the code from the URL after authorizing on FitnessSyncer's website
          </p>
        </div>
        
        <Button
          type="submit"
          disabled={isLoading || success}
          className="w-full"
        >
          {isLoading ? "Connecting..." : "Complete Connection"}
        </Button>
      </form>
      
      {debugEnabled && internalSessionId && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-600">
          Debug Session ID: {internalSessionId}
        </div>
      )}
    </div>
  );
} 