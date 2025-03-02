"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ProfilePage() {
  const [age, setAge] = useState("");
  const [hasMajorIllness, setHasMajorIllness] = useState(false);
  const [hasInjury, setHasInjury] = useState(false);
  const [hasConsistentTraining, setHasConsistentTraining] = useState(false);
  const [hasAdvancedTraining, setHasAdvancedTraining] = useState(false);
  const [mafHR, setMafHR] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  // Create a ref for supabase to avoid dependency issues
  const supabaseRef = useRef(createClient());
  // Track if initial data has been loaded
  const [dataLoaded, setDataLoaded] = useState(false);

  // Handle age input change
  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAge = e.target.value;
    console.log("Setting age to:", newAge);
    setAge(newAge);
  };

  // Handle toggle functions with better logging
  const toggleMajorIllness = (value: boolean) => {
    console.log("Setting hasMajorIllness to:", value);
    setHasMajorIllness(value);
    if (value) {
      setHasConsistentTraining(false);
      setHasAdvancedTraining(false);
    }
  };

  const toggleInjury = (value: boolean) => {
    console.log("Setting hasInjury to:", value);
    setHasInjury(value);
    if (value) {
      setHasConsistentTraining(false);
      setHasAdvancedTraining(false);
    }
  };

  const toggleConsistentTraining = (value: boolean) => {
    console.log("Setting hasConsistentTraining to:", value);
    if (!hasMajorIllness && !hasInjury) {
      setHasConsistentTraining(value);
    }
  };

  const toggleAdvancedTraining = (value: boolean) => {
    console.log("Setting hasAdvancedTraining to:", value);
    if (!hasMajorIllness && !hasInjury) {
      setHasAdvancedTraining(value);
    }
  };

  // Only fetch profile data once on component mount
  useEffect(() => {
    // Skip if data has already been loaded
    if (dataLoaded) return;
    
    const supabase = supabaseRef.current;
    console.log("Initial profile data fetch");

    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        setError("You must be logged in to view your profile");
        return null;
      }
      setUserId(user.id);
      return user.id;
    }

    async function fetchProfile(uid: string) {
      console.log("Fetching profile for user:", uid);
      const { data, error } = await supabase
        .from("profiles")
        .select("age, has_major_illness, has_injury, has_consistent_training, has_advanced_training, maf_hr")
        .eq("id", uid)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        setError("Failed to load profile data");
      }

      if (data) {
        console.log("Profile data loaded:", data);
        setAge(data.age?.toString() || "");
        setHasMajorIllness(data.has_major_illness || false);
        setHasInjury(data.has_injury || false);
        setHasConsistentTraining(data.has_consistent_training || false);
        setHasAdvancedTraining(data.has_advanced_training || false);
        setMafHR(data.maf_hr);
      } else {
        console.log("No profile data found");
      }
      setLoading(false);
      setDataLoaded(true);
    }

    fetchUser().then(uid => {
      if (uid) fetchProfile(uid);
    });
    
    // Empty dependency array ensures this only runs once on mount
  }, []);

  function calculateMafHR(age: number) {
    if (age < 16) return 165; // Rule for users under 16

    let baseHR = 180 - age;
    if (hasMajorIllness) baseHR -= 10;
    if (hasInjury) baseHR -= 5;
    if (hasConsistentTraining) baseHR += 0; // No change
    if (hasAdvancedTraining) baseHR += 5;

    return baseHR;
  }

  function validateSelections() {
    if ((hasMajorIllness || hasInjury) && (hasConsistentTraining || hasAdvancedTraining)) {
      return "You cannot select 'Yes' for both training consistently/advanced training and having an illness or injury.";
    }
    return null;
  }

  async function handleSave() {
    try {
      setSaveStatus("Saving...");

      if (!userId) {
        setError("You must be logged in to save your profile");
        setSaveStatus(null);
        return;
      }

      const validationError = validateSelections();
      if (validationError) {
        setError(validationError);
        setSaveStatus(null);
        return;
      }

      setError(null);
      const userAge = Number(age);
      const maf = calculateMafHR(userAge);
      setMafHR(maf);

      // Show warning for users over 65
      if (userAge >= 65) {
        setWarning(
          "Warning: The MAF 180 Formula may need further adjustment for athletes over 65. Please assess your situation or contact support."
        );
      } else {
        setWarning(null);
      }

      console.log("Saving profile with data:", {
        id: userId,
        age: userAge,
        has_major_illness: hasMajorIllness,
        has_injury: hasInjury,
        has_consistent_training: hasConsistentTraining,
        has_advanced_training: hasAdvancedTraining,
        maf_hr: maf,
      });

      const { error: saveError } = await supabaseRef.current.from("profiles").upsert({
        id: userId,
        age: userAge,
        has_major_illness: hasMajorIllness,
        has_injury: hasInjury,
        has_consistent_training: hasConsistentTraining,
        has_advanced_training: hasAdvancedTraining,
        maf_hr: maf,
      }, { onConflict: "id" });

      if (saveError) {
        console.error("Error saving profile:", saveError);
        setError("Error saving profile: " + saveError.message);
        setSaveStatus(null);
      } else {
        console.log("Profile saved successfully");
        setSaveStatus("Saved successfully!");
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (err) {
      console.error("Unexpected error during save:", err);
      setError("An unexpected error occurred. Please try again.");
      setSaveStatus(null);
    }
  }

  if (loading) return <p>Loading...</p>;
  
  if (error && error.includes("logged in")) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <p className="text-red-500">{error}</p>
        <a href="/login" className="text-blue-500 underline">Go to login page</a>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Profile</h1>
        <Link 
          href="/" 
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition flex items-center"
        >
          <span>← Back to Home</span>
        </Link>
      </div>
      
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {saveStatus && <p className="text-green-500 mb-4">{saveStatus}</p>}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
        <input
          type="number"
          value={age}
          onChange={handleAgeChange}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {Number(age) >= 65 && <p className="text-yellow-500 mb-4">{warning}</p>}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Are you recovering from a major illness (heart disease, any operation or hospital stay, etc.), are in rehabilitation, are on any regular medication, or are in Stage 3 (chronic) overtraining (burnout)?</label>
        <div className="flex gap-4">
          <Button 
            variant={hasMajorIllness ? "default" : "outline"} 
            onClick={() => toggleMajorIllness(true)}
          >
            Yes
          </Button>
          <Button 
            variant={!hasMajorIllness ? "default" : "outline"} 
            onClick={() => toggleMajorIllness(false)}
          >
            No
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Are you injured, have regressed or not improved in training (such as poor MAF Tests) or competition, get more than two colds, flu or other infections per year, have seasonal allergies or asthma, are overfat, are in Stage 1 or 2 of overtraining, or if you have been inconsistent, just starting, or just getting back into training?</label>
        <div className="flex gap-4">
          <Button 
            variant={hasInjury ? "default" : "outline"} 
            onClick={() => toggleInjury(true)}
          >
            Yes
          </Button>
          <Button 
            variant={!hasInjury ? "default" : "outline"} 
            onClick={() => toggleInjury(false)}
          >
            No
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Have you been training consistently (4+ times per week) for <b>up to 2 years</b> without any of the problems mentioned above?</label>
        <div className="flex gap-4">
          <Button 
            variant={hasConsistentTraining ? "default" : "outline"} 
            onClick={() => toggleConsistentTraining(true)}
            disabled={hasMajorIllness || hasInjury}
          >
            Yes
          </Button>
          <Button 
            variant={!hasConsistentTraining ? "default" : "outline"} 
            onClick={() => toggleConsistentTraining(false)}
          >
            No
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Have you been training for <b>more than 2 years</b> without any of the problems listed above, have made progress in your MAF Tests, improved competitively and are without injury?</label>
        <div className="flex gap-4">
          <Button 
            variant={hasAdvancedTraining ? "default" : "outline"} 
            onClick={() => toggleAdvancedTraining(true)}
            disabled={hasMajorIllness || hasInjury}
          >
            Yes
          </Button>
          <Button 
            variant={!hasAdvancedTraining ? "default" : "outline"} 
            onClick={() => toggleAdvancedTraining(false)}
          >
            No
          </Button>
        </div>
      </div>

      <Button 
        onClick={handleSave} 
        className="w-full py-2 mt-6 bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        disabled={saveStatus === "Saving..."}
      >
        {saveStatus === "Saving..." ? "Saving..." : "Save Profile"}
      </Button>

      {mafHR !== null && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-lg text-green-800">
            Your MAF HR: <strong>{mafHR} BPM</strong>
          </p>
        </div>
      )}
    </div>
  );
}