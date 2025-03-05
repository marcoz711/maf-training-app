"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

/**
 * FitnessSyncer Connect Button
 * 
 * Initiates the FitnessSyncer authorization flow when clicked.
 * This button calls the authorize API endpoint and then redirects the user
 * to FitnessSyncer's authorization page.
 */
export function FitnessSyncerConnectButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Call the authorize endpoint
      const response = await fetch("/api/fitnesssyncer/authorize");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to start authorization process");
      }

      // First, navigate to the connect page (this is necessary so the user knows where to return)
      router.push("/fitnesssyncer/connect");
      
      // Then, after a short delay, redirect to the FitnessSyncer authorization URL
      // The delay ensures the user sees the connect page first
      setTimeout(() => {
        window.location.href = data.redirect_url;
      }, 500);

    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button 
        onClick={handleConnect} 
        disabled={isLoading}
        className="flex items-center space-x-2"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <span>Connect to FitnessSyncer</span>
          </>
        )}
      </Button>
      
      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
} 