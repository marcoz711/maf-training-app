"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import type { ProfileError } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function MAFQuestionnaire() {
  const { user } = useAuth();
  const [age, setAge] = useState('');
  const [hasMajorIllness, setHasMajorIllness] = useState<boolean | null>(null);
  const [hasInjury, setHasInjury] = useState<boolean | null>(null);
  const [hasConsistentTraining, setHasConsistentTraining] = useState<boolean | null>(null);
  const [hasAdvancedTraining, setHasAdvancedTraining] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ProfileError | null>(null);

  // Load user data
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

        if (data) {
          setAge(data.age?.toString() || '');
          setHasMajorIllness(data.has_major_illness);
          setHasInjury(data.has_injury);
          setHasConsistentTraining(data.has_consistent_training);
          setHasAdvancedTraining(data.has_advanced_training);
        }
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

  // Calculate MAF HR
  const calculateMAFHR = () => {
    if (!age) return null;
    
    const baseHR = 180 - parseInt(age);
    let modifiedHR = baseHR;

    if (hasMajorIllness) modifiedHR -= 10;
    else if (hasInjury) modifiedHR -= 5;
    else if (hasConsistentTraining) modifiedHR += 5;
    else if (hasAdvancedTraining) modifiedHR += 10;

    return modifiedHR;
  };

  // Save user data
  const saveProfile = async () => {
    if (!user) return;
    setError(null);

    try {
      setSaving(true);
      const { error: supabaseError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          age: age ? parseInt(age) : null,
          has_major_illness: hasMajorIllness,
          has_injury: hasInjury,
          has_consistent_training: hasConsistentTraining,
          has_advanced_training: hasAdvancedTraining,
          maf_hr: calculateMAFHR()
        });

      if (supabaseError) throw supabaseError;
    } catch (err) {
      const error = err as Error;
      console.error('Error saving profile:', error);
      setError({ message: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <>
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <p className="text-center text-gray-600">Please log in to access this page.</p>
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
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold">MAF Heart Rate Questionnaire</h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error.message}</p>
            </div>
          )}

          {loading ? (
            <p className="text-center text-gray-600">Loading...</p>
          ) : (
            <form onSubmit={(e) => {
              e.preventDefault();
              saveProfile();
            }} className="space-y-8">
              <div className="space-y-4">
                <label className="block text-lg font-medium text-gray-700">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="block w-full sm:w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Age"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-lg font-medium text-gray-700">
                  Are you recovering from a major illness (heart disease, any operation or hospital stay, etc.), 
                  are in rehabilitation, are on any regular medication, or are in Stage 3 (chronic) overtraining (burnout)?
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setHasMajorIllness(true)}
                    className={`px-6 py-2 rounded-md ${
                      hasMajorIllness === true
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasMajorIllness(false)}
                    className={`px-6 py-2 rounded-md ${
                      hasMajorIllness === false
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-lg font-medium text-gray-700">
                  Are you injured, have regressed or not improved in training (such as poor MAF Tests) or competition, 
                  get more than two colds, flu or other infections per year, have seasonal allergies or asthma, 
                  are overfat, are in Stage 1 or 2 of overtraining, or if you have been inconsistent, just starting, 
                  or just getting back into training?
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setHasInjury(true)}
                    className={`px-6 py-2 rounded-md ${
                      hasInjury === true
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasInjury(false)}
                    className={`px-6 py-2 rounded-md ${
                      hasInjury === false
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-lg font-medium text-gray-700">
                  Have you been training consistently (4+ times per week) for up to 2 years without any of the problems mentioned above?
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setHasConsistentTraining(true)}
                    className={`px-6 py-2 rounded-md ${
                      hasConsistentTraining === true
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasConsistentTraining(false)}
                    className={`px-6 py-2 rounded-md ${
                      hasConsistentTraining === false
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-lg font-medium text-gray-700">
                  Have you been training for more than 2 years without any of the problems listed above, 
                  have made progress in your MAF Tests, improved competitively and are without injury?
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setHasAdvancedTraining(true)}
                    className={`px-6 py-2 rounded-md ${
                      hasAdvancedTraining === true
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasAdvancedTraining(false)}
                    className={`px-6 py-2 rounded-md ${
                      hasAdvancedTraining === false
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                <Link
                  href="/profile"
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Back
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Update'}
                </button>
              </div>

              {saving && (
                <p className="text-sm text-gray-500 italic text-right">Saving changes...</p>
              )}
            </form>
          )}
        </div>
      </main>
    </>
  );
} 