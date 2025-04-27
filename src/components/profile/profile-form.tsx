"use client";

import { useEffect, useReducer, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-profile";
import { Profile } from "@/types";
import Link from "next/link";
import { profileFormReducer } from "./profile-form-reducer";
import { 
  calculateMafHR, 
  validateProfileSelections
} from "@/utils/maf-calculations";
import { ErrorBoundary, DefaultErrorFallback } from "@/components/error-boundary";
import { AgeSection } from "./sections/AgeSection";
import { HealthSection } from "./sections/HealthSection";
import { TrainingSection } from "./sections/TrainingSection";
import { MAFDisplay } from "./sections/MAFDisplay";

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

        <AgeSection
          age={state.age}
          warning={warning}
          onAgeChange={(value) => dispatch({ type: 'SET_AGE', value })}
          onWarningChange={setWarning}
        />

        <HealthSection
          hasMajorIllness={state.hasMajorIllness}
          hasInjury={state.hasInjury}
          onMajorIllnessChange={(value) => dispatch({ type: 'SET_MAJOR_ILLNESS', value })}
          onInjuryChange={(value) => dispatch({ type: 'SET_INJURY', value })}
        />

        <TrainingSection
          hasConsistentTraining={state.hasConsistentTraining}
          hasAdvancedTraining={state.hasAdvancedTraining}
          hasMajorIllness={state.hasMajorIllness}
          hasInjury={state.hasInjury}
          onConsistentTrainingChange={(value) => dispatch({ type: 'SET_CONSISTENT_TRAINING', value })}
          onAdvancedTrainingChange={(value) => dispatch({ type: 'SET_ADVANCED_TRAINING', value })}
        />

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