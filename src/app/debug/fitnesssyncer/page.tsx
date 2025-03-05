"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  isDebuggingEnabled, 
  getOAuthFlowOverview, 
  identifyFailurePoint,
  OAuthStage,
  clearSession
} from "@/utils/fitnesssyncer-debug";

/**
 * FitnessSyncer Debug Page
 * 
 * A page that displays debugging information for FitnessSyncer OAuth flows.
 * Only available when NEXT_PUBLIC_DEBUG_FITNESSSYNCER=true is set in environment.
 */
export default function FitnessSyncerDebugPage() {
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [flowData, setFlowData] = useState<any[] | null>(null);
  const [failureInfo, setFailureInfo] = useState<any | null>(null);
  
  // Check if debugging is enabled on component mount
  useEffect(() => {
    setDebugEnabled(isDebuggingEnabled());
  }, []);
  
  // Handle session ID input change
  const handleSessionIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSessionId(e.target.value);
  };
  
  // Load flow data for a specific session
  const handleViewFlow = () => {
    if (!sessionId) return;
    
    const flowSteps = getOAuthFlowOverview(sessionId);
    setFlowData(flowSteps);
    
    const failure = identifyFailurePoint(sessionId);
    setFailureInfo(failure);
  };
  
  // Clear session data
  const handleClearSession = () => {
    if (!sessionId) return;
    
    clearSession(sessionId);
    setFlowData(null);
    setFailureInfo(null);
  };
  
  // Format timestamp for display
  const formatTimestamp = (timestamp: Date) => {
    if (!timestamp) return "N/A";
    
    try {
      return new Date(timestamp).toLocaleString();
    } catch (e) {
      return String(timestamp);
    }
  };
  
  // Get color class based on stage
  const getStageColorClass = (stage: OAuthStage, isFailureStage: boolean) => {
    if (isFailureStage) return "bg-red-100 border-red-300";
    if (stage === OAuthStage.CONNECTION_ERROR) return "bg-red-50 border-red-200";
    if (stage === OAuthStage.CONNECTION_COMPLETE) return "bg-green-50 border-green-200";
    return "bg-blue-50 border-blue-200";
  };
  
  if (!debugEnabled) {
    return (
      <div className="max-w-4xl mx-auto mt-10 p-6">
        <h1 className="text-3xl font-bold mb-6">FitnessSyncer Debugging</h1>
        
        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2 text-yellow-800">Debugging Not Enabled</h2>
          <p className="text-yellow-700">
            To enable FitnessSyncer debugging, set the following in your <code className="bg-yellow-100 px-1 rounded">.env.local</code> file:
          </p>
          <pre className="bg-yellow-100 p-3 rounded mt-2 text-yellow-800">
            NEXT_PUBLIC_DEBUG_FITNESSSYNCER=true
          </pre>
          <p className="mt-4 text-yellow-700">
            After setting this variable, restart your development server.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-5xl mx-auto mt-10 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">FitnessSyncer Debugging</h1>
        
        <div className="flex items-center">
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm mr-4">
            Debugging Enabled
          </div>
        </div>
      </div>
      
      <div className="bg-white border rounded-lg p-6 shadow-sm mb-8">
        <h2 className="text-xl font-semibold mb-4">OAuth Flow Sessions</h2>
        
        <div className="flex mb-4">
          <input
            type="text"
            value={sessionId}
            onChange={handleSessionIdChange}
            placeholder="Enter Session ID (e.g., fs-1634567890-abc123)"
            className="flex-1 p-2 border border-gray-300 rounded-l-md"
          />
          <Button
            onClick={handleViewFlow}
            disabled={!sessionId}
            className="rounded-l-none"
          >
            View Flow
          </Button>
        </div>
        
        <p className="text-sm text-gray-600">
          Enter a session ID to view details of an OAuth flow. Session IDs can be found in browser cookies or server logs.
        </p>
      </div>
      
      {failureInfo && (
        <div className={`border rounded-lg p-6 shadow-sm mb-8 ${failureInfo.failed ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <h2 className="text-xl font-semibold mb-4">
            {failureInfo.failed ? 'Flow Failure Detected' : 'Flow Status'}
          </h2>
          
          {failureInfo.failed ? (
            <div>
              <p className="mb-2">
                <strong>Failed at stage:</strong> {failureInfo.stage}
              </p>
              
              {failureInfo.error && (
                <p className="mb-2">
                  <strong>Error:</strong> {failureInfo.error.message}
                </p>
              )}
              
              {failureInfo.details && (
                <p className="mb-2">
                  <strong>Details:</strong> {failureInfo.details}
                </p>
              )}
              
              <div className="mt-4 p-4 bg-white rounded-md border border-red-200">
                <p className="font-medium mb-2">Recommendation:</p>
                <p>{failureInfo.recommendation}</p>
              </div>
            </div>
          ) : (
            <p>No failures detected in this OAuth flow.</p>
          )}
        </div>
      )}
      
      {flowData && flowData.length > 0 ? (
        <div className="border rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">OAuth Flow Timeline</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleClearSession}
              className="text-red-600 hover:bg-red-50"
            >
              Clear Session Data
            </Button>
          </div>
          
          <div className="space-y-4">
            {flowData.map((step, index) => {
              const isFailureStage = failureInfo?.failed && failureInfo?.stage === step.stage;
              
              return (
                <div 
                  key={index} 
                  className={`border rounded-md p-4 ${getStageColorClass(step.stage, isFailureStage)}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold">{step.stage}</span>
                    <span className="text-sm text-gray-600">
                      {formatTimestamp(step.timestamp)}
                      {step.durationMs !== undefined && ` (+${step.durationMs}ms)`}
                    </span>
                  </div>
                  
                  {step.details && (
                    <p className="text-sm mb-2">{step.details}</p>
                  )}
                  
                  {step.error && (
                    <div className="mt-2 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                      <p className="font-medium">Error:</p>
                      <p>{step.error.message}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : flowData === null ? null : (
        <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
          <p>No flow data found for this session ID.</p>
        </div>
      )}
    </div>
  );
} 