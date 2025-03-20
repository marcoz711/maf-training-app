"use client";

import { useState } from 'react';
import Navigation from '@/components/Navigation';

interface DebugResponse {
  message: string;
  data?: unknown;
  error?: string;
}

export default function DebugFitnessSyncerConnection() {
  const [response, setResponse] = useState<DebugResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheckConnection = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/fitnesssyncer/check-connection');
      const data = await response.json();
      setResponse({ message: 'Connection check complete', data });
    } catch (err) {
      const error = err as Error;
      setResponse({ message: 'Error checking connection', error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h1 className="text-2xl font-bold mb-4">Debug FitnessSyncer Connection</h1>
          
          <button
            onClick={handleCheckConnection}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check Connection'}
          </button>

          {response && (
            <div className="mt-4">
              <h2 className="text-lg font-semibold mb-2">Response:</h2>
              <pre className="bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </main>
    </>
  );
} 