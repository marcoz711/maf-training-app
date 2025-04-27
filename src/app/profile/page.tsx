"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import type { Profile, ProfileError } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ProfileError | null>(null);
  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Load user profile data
  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      setError(null);

      try {
        const { data, error: supabaseError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (supabaseError) throw supabaseError;
        setProfileData(data);
      } catch (err) {
        const error = err as Error;
        console.error('Error loading profile:', error);
        setError({ message: error.message });
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  const handlePasswordChange = async () => {
    if (!user) return;
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return;
    }

    try {
      const { error: supabaseError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (supabaseError) throw supabaseError;

      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const error = err as Error;
      console.error('Error updating password:', error);
      setPasswordError(error.message);
    }
  };

  if (!user) {
    return (
      <>
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <p className="text-center text-gray-600">Please log in to view your profile.</p>
            <div className="mt-4 text-center">
              <Link
                href="/login"
                className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Login
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error.message}</p>
            </div>
          )}

          {/* MAF Heart Rate Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your MAF Heart Rate</h2>
            {loading ? (
              <p className="text-gray-600">Loading...</p>
            ) : profileData?.maf_hr ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <p className="text-3xl font-bold text-green-800 mb-2">
                    {profileData.maf_hr} BPM
                  </p>
                  <p className="text-green-700">
                    Train at or below this heart rate to build your aerobic base.
                  </p>
                </div>
                <Link
                  href="/profile/maf-questionnaire"
                  className="inline-block text-blue-500 hover:text-blue-600"
                >
                  Update your MAF data →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Complete the MAF questionnaire to calculate your Maximum Aerobic Heart Rate.
                </p>
                <Link
                  href="/profile/maf-questionnaire"
                  className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Complete MAF Questionnaire
                </Link>
              </div>
            )}
          </div>

          {/* Account Management Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Settings</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-gray-900">{user.email}</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
                {passwordError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-600">{passwordError}</p>
                  </div>
                )}
                {passwordSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-green-600">Password updated successfully!</p>
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button
                    onClick={handlePasswordChange}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}