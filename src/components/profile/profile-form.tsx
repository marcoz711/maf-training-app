"use client";

import { useEffect, useReducer, useState, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-profile";
import { Profile } from "@/types";
import Link from "next/link";
import { profileFormReducer } from "./profile-form-reducer";
import { 
  calculateMafHR, 
  validateProfileSelections, 
  getAgeWarning 
} from "@/utils/maf-calculations";
import { ErrorBoundary, DefaultErrorFallback } from "@/components/error-boundary";

// Memoized MAF Heart Rate display component
const MAFDisplay = memo(function MAFDisplay({ mafHR }: { mafHR: number | null }) {
  if (mafHR === null) return null;
  
  return (
    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
      <p className="text-lg text-green-800">
        Your MAF HR: <strong>{mafHR} BPM</strong>
      </p>
    </div>
  );
});

export function ProfileForm() {
  const { profile, loading, error: apiError, saveProfile, saveStatus } = useProfile();
  const [state, dispatch] = useReducer(profileFormReducer, {
    age: "",
    hasMajorIllness: false,
    hasInjury: false,
    hasConsistentTraining: false,
    hasAdvancedTraining: false,
    mafHR: null
  });
  const [warning, setWarning] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [formInitialized, setFormInitialized] = useState(false);

  // Initialize form state from profile data when profile changes
  useEffect(() => {
    if (profile && !formInitialized) {
      console.log("Initializing form with profile data:", profile);
      dispatch({ type: 'INITIALIZE', profile });
      setFormInitialized(true);
    }
  }, [profile, formInitialized]);

  // Calculate MAF HR (memoized to prevent unnecessary recalculations)
  const calculateMafValue = useCallback((age: number) => {
    return calculateMafHR(age, {
      hasMajorIllness: state.hasMajorIllness,
      hasInjury: state.hasInjury,
      hasConsistentTraining: state.hasConsistentTraining,
      hasAdvancedTraining: state.hasAdvancedTraining
    });
  }, [state.hasMajorIllness, state.hasInjury, state.hasConsistentTraining, state.hasAdvancedTraining]);

  // Handler functions
  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAge = e.target.value;
    console.log("Setting age to:", newAge);
    dispatch({ type: 'SET_AGE', value: newAge });
    
    // Update age warning if needed
    if (newAge) {
      const ageWarning = getAgeWarning(Number(newAge));
      setWarning(ageWarning);
    } else {
      setWarning(null);
    }
  };

  async function handleSave() {
    try {
      // Validate inputs
      const userAge = Number(state.age);
      if (isNaN(userAge) || userAge <= 0) {
        setValidationError("Please enter a valid age");
        return;
      }
      
      const validationMessage = validateProfileSelections({
        hasMajorIllness: state.hasMajorIllness,
        hasInjury: state.hasInjury,
        hasConsistentTraining: state.hasConsistentTraining,
        hasAdvancedTraining: state.hasAdvancedTraining
      });
      
      if (validationMessage) {
        setValidationError(validationMessage);
        return;
      }
      
      setValidationError(null);

      // Calculate MAF HR
      const maf = calculateMafValue(userAge);
      dispatch({ type: 'SET_MAF_HR', value: maf });

      // Prepare profile update
      const updatedProfile: Partial<Profile> = {
        age: userAge,
        has_major_illness: state.hasMajorIllness,
        has_injury: state.hasInjury,
        has_consistent_training: state.hasConsistentTraining,
        has_advanced_training: state.hasAdvancedTraining,
        maf_hr: maf,
      };

      console.log("Saving profile:", updatedProfile);

      // Save profile
      await saveProfile(updatedProfile);
    } catch (err) {
      console.error("Error in profile save:", err);
      setValidationError("An unexpected error occurred while saving your profile");
    }
  }

  if (loading) return <p>Loading profile data...</p>;

  if (!profile) return <p>No profile data available. Please log in.</p>;

  return (
    <ErrorBoundary fallback={
      <DefaultErrorFallback resetError={() => window.location.reload()} />
    }>
      <div className="max-w-md mx-auto mt-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Your Profile</h1>
          <Button 
            variant="outline" 
            size="sm" 
            asChild
          >
            <Link href="/">
              <span>← Back to Home</span>
            </Link>
          </Button>
        </div>
        
        {apiError && <p className="text-red-500 mb-4">{apiError}</p>}
        {validationError && <p className="text-red-500 mb-4">{validationError}</p>}
        {saveStatus === "success" && <p className="text-green-500 mb-4">Profile saved successfully!</p>}
        {saveStatus === "error" && <p className="text-red-500 mb-4">Error saving profile. Please try again.</p>}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
          <input
            type="number"
            value={state.age}
            onChange={handleAgeChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="1"
            max="120"
          />
        </div>

        {warning && <p className="text-yellow-500 mb-4">{warning}</p>}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Are you recovering from a major illness (heart disease, any operation or hospital stay, etc.), are in rehabilitation, are on any regular medication, or are in Stage 3 (chronic) overtraining (burnout)?</label>
          <div className="flex gap-4">
            <Button 
              variant={state.hasMajorIllness ? "default" : "outline"} 
              onClick={() => dispatch({ type: 'SET_MAJOR_ILLNESS', value: true })}
            >
              Yes
            </Button>
            <Button 
              variant={!state.hasMajorIllness ? "default" : "outline"} 
              onClick={() => dispatch({ type: 'SET_MAJOR_ILLNESS', value: false })}
            >
              No
            </Button>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Are you injured, have regressed or not improved in training (such as poor MAF Tests) or competition, get more than two colds, flu or other infections per year, have seasonal allergies or asthma, are overfat, are in Stage 1 or 2 of overtraining, or if you have been inconsistent, just starting, or just getting back into training?</label>
          <div className="flex gap-4">
            <Button 
              variant={state.hasInjury ? "default" : "outline"} 
              onClick={() => dispatch({ type: 'SET_INJURY', value: true })}
            >
              Yes
            </Button>
            <Button 
              variant={!state.hasInjury ? "default" : "outline"} 
              onClick={() => dispatch({ type: 'SET_INJURY', value: false })}
            >
              No
            </Button>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Have you been training consistently (4+ times per week) for <b>up to 2 years</b> without any of the problems mentioned above?</label>
          <div className="flex gap-4">
            <Button 
              variant={state.hasConsistentTraining ? "default" : "outline"} 
              onClick={() => dispatch({ type: 'SET_CONSISTENT_TRAINING', value: true })}
              disabled={state.hasMajorIllness || state.hasInjury}
            >
              Yes
            </Button>
            <Button 
              variant={!state.hasConsistentTraining ? "default" : "outline"} 
              onClick={() => dispatch({ type: 'SET_CONSISTENT_TRAINING', value: false })}
            >
              No
            </Button>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Have you been training for <b>more than 2 years</b> without any of the problems listed above, have made progress in your MAF Tests, improved competitively and are without injury?</label>
          <div className="flex gap-4">
            <Button 
              variant={state.hasAdvancedTraining ? "default" : "outline"} 
              onClick={() => dispatch({ type: 'SET_ADVANCED_TRAINING', value: true })}
              disabled={state.hasMajorIllness || state.hasInjury}
            >
              Yes
            </Button>
            <Button 
              variant={!state.hasAdvancedTraining ? "default" : "outline"} 
              onClick={() => dispatch({ type: 'SET_ADVANCED_TRAINING', value: false })}
            >
              No
            </Button>
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={saveStatus === "saving"}
          size="lg"
          className="w-full mt-6"
        >
          {saveStatus === "saving" ? "Saving..." : "Save Profile"}
        </Button>

        <MAFDisplay mafHR={state.mafHR} />
      </div>
    </ErrorBoundary>
  );
} 