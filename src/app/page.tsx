"use client";

import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import React, { useState } from 'react';

export default function Home() {
  const { user, signOut, loading } = useAuth();

  return (
    <>
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6">Welcome to MAF Training</h1>
          
          <div className="bg-gray-50 p-4 sm:p-6 rounded-lg mb-8">
            {loading ? (
              <p className="text-gray-600">Loading...</p>
            ) : user ? (
              <div className="space-y-4">
                <p className="text-green-600 font-medium">
                  You are logged in as: <br />
                  <span className="text-gray-900">{user.email}</span>
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link 
                    href="/profile" 
                    className="w-full sm:w-auto text-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Your Profile
                  </Link>
                  <Link 
                    href="/connect/fitnesssyncer" 
                    className="w-full sm:w-auto text-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Manage FitnessSyncer
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="w-full sm:w-auto px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600">Please log in to access the application.</p>
                <Link
                  href="/login"
                  className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Login
                </Link>
              </div>
            )}
          </div>

          <div className="prose max-w-none">
            <p className="text-gray-600">
              This is the main page of your application. The content here will change based on whether you&apos;re logged in or not.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
