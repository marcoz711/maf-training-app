"use client";

import { useState, useEffect } from "react";
import { getUserProfile, saveUserProfile, createEmptyProfile } from "@/lib/supabase/db";
import { useAuth } from "@/contexts/auth-context";
import { UserProfile } from "@/types";

/**
 * Custom hook for managing user profile data
 */
export function useProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  // Load profile data when auth state changes
  useEffect(() => {
    // Skip if still loading auth
    if (authLoading) {
      return;
    }

    // If no user, set loading to false and return
    if (!user) {
      setLoading(false);
      setProfile(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    // Fetch profile data
    const loadProfile = async () => {
      try {
        console.log("Loading profile for user:", user.id);
        const data = await getUserProfile(user.id);
        
        // Only update state if component is still mounted
        if (isMounted) {
          if (data) {
            console.log("Profile data loaded:", data);
            setProfile(data);
          } else {
            // Create empty profile if none exists
            console.log("No profile found, creating empty profile");
            const emptyProfile = createEmptyProfile(user.id);
            setProfile(emptyProfile);
          }
          setError(null);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        if (isMounted) {
          setError("Failed to load profile data");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  /**
   * Save profile data
   */
  const saveProfile = async (updatedProfile: Partial<UserProfile>) => {
    if (!user || !profile) {
      setError("You must be logged in to save your profile");
      return false;
    }

    try {
      setSaveStatus("saving");
      
      // Merge current profile with updates
      const newProfile: UserProfile = {
        ...profile,
        ...updatedProfile
      };
      
      console.log("Saving profile to database:", newProfile);
      await saveUserProfile(newProfile);
      
      setProfile(newProfile);
      setSaveStatus("success");
      
      // Reset success status after a delay
      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
      
      return true;
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Failed to save profile");
      setSaveStatus("error");
      return false;
    }
  };

  return { 
    profile, 
    loading, 
    error, 
    saveProfile,
    saveStatus 
  };
} 