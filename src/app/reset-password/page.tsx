"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import Navigation from "@/components/Navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  const { resetPassword, resetPasswordLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    try {
      await resetPassword(email);
      setIsSubmitted(true);
    } catch {
      // Error is already handled by the auth context
    }
  };

  return (
    <>
      <Navigation />
      <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6">Reset Password</h1>
          
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {isSubmitted ? (
            <div className="text-center">
              <p className="text-green-600 mb-4">
                If an account exists with that email, you will receive a password reset link.
              </p>
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Return to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <button
                type="submit"
                disabled={resetPasswordLoading}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {resetPasswordLoading ? "Sending reset link..." : "Send reset link"}
              </button>
            </form>
          )}

          <p className="mt-4 text-center text-sm text-gray-600">
            Remember your password?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </>
  );
} 