"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { FitnessSyncerCodeEntry } from "@/components/fitnesssyncer/code-entry";
import { 
  generateSessionId, 
  logOAuthStep, 
  OAuthStage, 
  logOAuthError, 
  isDebuggingEnabled 
} from "@/utils/fitnesssyncer-debug";

/**
 * FitnessSyncer Connect Page
 * 
 * A comprehensive page that guides users through the FitnessSyncer connection process:
 * 1. Initial connection button
 * 2. Authorization instructions
 * 3. Authorization redirect button
 * 4. Manual code entry form
 */
export default function FitnessSyncerConnectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // State for the connection flow
  const [step, setStep] = useState<"initial" | "instructions" | "code_entry">("initial");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [debugEnabled, setDebugEnabled] = useState(false);
  
  // Initialize debugging session on component mount
  useEffect(() => {
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    setDebugEnabled(isDebuggingEnabled());
    
    // Get state and code from URL if available (for direct access after redirect)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const stateParam = urlParams.get('state');
      const codeParam = urlParams.get('code');
      
      if (stateParam && codeParam) {
        // If both state and code are in the URL, go directly to code entry
        setStep('code_entry');
        
        if (isDebuggingEnabled()) {
          logOAuthStep(
            newSessionId, 
            OAuthStage.CODE_RECEIVED, 
            `Found state and code in URL parameters, moving to code entry step`
          );
        }
      }
    }
    
    if (isDebuggingEnabled()) {
      logOAuthStep(newSessionId, OAuthStage.AUTH_START, "Component mounted, session initialized");
    }
  }, []);
  
  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!loading && !user) {
      if (debugEnabled) {
        logOAuthError(
          sessionId, 
          OAuthStage.ERROR, 
          new Error("User not authenticated"), 
          "Redirecting to login page"
        );
      }
      router.push("/login?message=Please login to connect your FitnessSyncer account");
    }
  }, [user, loading, router, sessionId, debugEnabled]);
  
  // Handle initial connection button click
  const handleStartConnection = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (debugEnabled) {
        logOAuthStep(
          sessionId, 
          OAuthStage.AUTH_START, 
          "Initiating authorization process"
        );
      }
      
      // Call the authorize endpoint to get the authentication URL
      const response = await fetch("/api/fitnesssyncer/authorize");
      
      // Get the raw text first to handle potential JSON parsing errors
      const responseText = await response.text();
      
      try {
        // Now try to parse it as JSON
        const data = JSON.parse(responseText);
        
        if (!response.ok || !data.success) {
          const errorMsg = data.message || "Failed to start authorization process";
          
          if (debugEnabled) {
            logOAuthError(
              sessionId, 
              OAuthStage.AUTH_START, 
              new Error(errorMsg), 
              `Status: ${response.status}, Response: ${JSON.stringify(data)}`
            );
          }
          
          throw new Error(errorMsg);
        }
        
        if (debugEnabled) {
          logOAuthStep(
            sessionId, 
            OAuthStage.AUTH_START, 
            `Authorization URL received: ${data.redirect_url?.substring(0, 50)}...`
          );
        }
        
        // Store the authorization URL and move to instructions step
        setAuthUrl(data.redirect_url);
        setStep("instructions");
      } catch (parseError) {
        // Handle JSON parsing error
        const errorMsg = "Invalid response from server. Unable to parse JSON.";
        
        if (debugEnabled) {
          logOAuthError(
            sessionId, 
            OAuthStage.ERROR, 
            new Error("JSON parsing error"), 
            `Raw response: ${responseText.substring(0, 100)}...`
          );
        }
        
        throw new Error(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMsg);
      
      if (debugEnabled && err instanceof Error) {
        logOAuthError(
          sessionId, 
          OAuthStage.ERROR, 
          err
        );
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle authorization button click
  const handleContinueToAuth = () => {
    if (authUrl) {
      if (debugEnabled) {
        logOAuthStep(
          sessionId, 
          OAuthStage.AUTH_REDIRECT, 
          `Redirecting to FitnessSyncer: ${authUrl?.substring(0, 50)}...`
        );
      }
      
      // Store session ID and state in sessionStorage for the code entry component
      if (typeof window !== "undefined") {
        sessionStorage.setItem("fitnesssyncer_session_id", sessionId);
        
        // Extract state parameter from authUrl
        const urlObj = new URL(authUrl);
        const stateParam = urlObj.searchParams.get('state');
        if (stateParam) {
          sessionStorage.setItem("fitnesssyncer_state", stateParam);
          
          if (debugEnabled) {
            logOAuthStep(
              sessionId, 
              OAuthStage.AUTH_REDIRECT, 
              `Stored state in sessionStorage: ${stateParam.substring(0, 10)}...`
            );
          }
        }
      }
      
      // Open FitnessSyncer authorization in a new tab
      window.open(authUrl, "_blank", "noopener,noreferrer");
      
      // Move to code entry step
      setStep("code_entry");
    }
  };
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-10 p-6">
        <p>Loading...</p>
      </div>
    );
  }
  
  // Only render content if user is authenticated
  if (!user) {
    return null; // Don't render anything while redirecting
  }
  
  // Debug information displayed when debugging is enabled
  const renderDebugInfo = () => {
    if (!debugEnabled) return null;
    
    return (
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md text-sm">
        <div className="flex justify-between items-center mb-2">
          <p className="font-semibold">Debug Mode Active</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/debug/fitnesssyncer?sessionId=${sessionId}`)}
          >
            View Debug Info
          </Button>
        </div>
        <p className="text-gray-600">Session ID: {sessionId}</p>
        <p className="text-gray-600 mt-1">Current Step: {step}</p>
        {error && <p className="text-red-600 mt-1">Error: {error}</p>}
      </div>
    );
  };
  
  return (
    <div className="max-w-4xl mx-auto mt-10 p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Connect to FitnessSyncer</h1>
      
      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-md text-red-700">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
              step === "initial" ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-600"
            }`}>
              1
            </div>
            <span className="text-sm">Start</span>
          </div>
          <div className="flex-1 h-1 mx-2 bg-gray-200">
            <div className={`h-full bg-blue-600 transition-all ${
              step !== "initial" ? "w-full" : "w-0"
            }`}></div>
          </div>
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
              step === "instructions" ? "bg-blue-600 text-white" : 
              step === "code_entry" ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-600"
            }`}>
              2
            </div>
            <span className="text-sm">Authorize</span>
          </div>
          <div className="flex-1 h-1 mx-2 bg-gray-200">
            <div className={`h-full bg-blue-600 transition-all ${
              step === "code_entry" ? "w-full" : "w-0"
            }`}></div>
          </div>
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
              step === "code_entry" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
            }`}>
              3
            </div>
            <span className="text-sm">Enter Code</span>
          </div>
        </div>
      </div>
      
      {/* Step 1: Initial connection */}
      {step === "initial" && (
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold mb-4">Connect Your FitnessSyncer Account</h2>
          <p className="mb-6 text-gray-600">
            Connecting your FitnessSyncer account will allow us to sync your fitness activities.
          </p>
          <Button
            size="lg"
            onClick={handleStartConnection}
            disabled={isLoading}
            className="px-8"
          >
            {isLoading ? "Preparing Connection..." : "Connect with FitnessSyncer"}
          </Button>
        </div>
      )}
      
      {/* Step 2: Instructions */}
      {step === "instructions" && (
        <div className="bg-white border rounded-lg p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Follow These Steps</h2>
          <ol className="list-decimal pl-5 space-y-4 mb-6">
            <li>
              <strong>Authorize Access:</strong> Click the button below to open FitnessSyncer's authorization page in a new tab.
            </li>
            <li>
              <strong>Login to FitnessSyncer:</strong> If prompted, log in to your FitnessSyncer account.
            </li>
            <li>
              <strong>Grant Permission:</strong> Review the permissions and click "Allow" on FitnessSyncer's website.
            </li>
            <li>
              <strong>Copy the Code:</strong> After authorizing, you'll be redirected to FitnessSyncer's website. 
              Look in the URL bar for a parameter that starts with <code className="bg-gray-100 px-1 rounded">code=</code> followed by a string of characters.
              Copy this code.
            </li>
            <li>
              <strong>Return Here:</strong> Come back to this tab and paste the code in the form that will appear.
            </li>
          </ol>
          
          <div className="flex justify-center space-x-4">
            <Button
              size="lg"
              onClick={handleContinueToAuth}
              className="px-8"
            >
              Continue to Authorization
            </Button>
            <Button
              variant="outline"
              onClick={() => setStep("code_entry")}
            >
              I Already Have a Code
            </Button>
          </div>
        </div>
      )}
      
      {/* Step 3: Code Entry */}
      {step === "code_entry" && (
        <div>
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-100 rounded-md text-yellow-800">
            <h3 className="font-semibold mb-2">Authorization Code Required</h3>
            <p>After authorizing on FitnessSyncer's website, you'll need to copy the code from the URL.</p>
            <p className="mt-2">Look for <code className="font-mono bg-yellow-100 px-1 rounded">code=...</code> in the URL after being redirected.</p>
          </div>
          
          <FitnessSyncerCodeEntry 
            sessionId={sessionId}
            state={typeof window !== 'undefined' ? 
              new URLSearchParams(window.location.search).get('state') || undefined : undefined}
          />
          
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={() => setStep("instructions")}
              className="mt-4"
            >
              View Instructions Again
            </Button>
          </div>
        </div>
      )}
      
      {/* Debug information */}
      {renderDebugInfo()}
      
      {/* Cancel button */}
      <div className="mt-8 text-center">
        <Button
          variant="ghost"
          onClick={() => router.push("/profile")}
          className="text-gray-500"
        >
          Cancel and Return to Profile
        </Button>
      </div>
    </div>
  );
} 