import { createClient } from "./client";
import { UserProfile } from "@/types";

/**
 * Fetch user profile by user ID
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) {
    console.error("getUserProfile called with empty userId");
    return null;
  }
  
  const supabase = createClient();
  console.log("Fetching profile for user ID:", userId);
  
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
      
    if (error) {
      console.error("Error fetching profile:", error);
      throw error;
    }
    
    console.log("Profile fetch result:", data);
    return data as UserProfile | null;
  } catch (err) {
    console.error("Unexpected error in getUserProfile:", err);
    throw err;
  }
}

/**
 * Save or update a user profile
 */
export async function saveUserProfile(profile: UserProfile) {
  if (!profile || !profile.id) {
    console.error("saveUserProfile called with invalid profile data", profile);
    throw new Error("Invalid profile data");
  }
  
  const supabase = createClient();
  console.log("Saving profile for user ID:", profile.id);
  
  try {
    // Using type assertion to work around TypeScript constraints
    const profileData = { ...profile } as Record<string, unknown>;
    
    const { data, error } = await supabase
      .from("profiles")
      .upsert(profileData, { onConflict: "id" });
      
    if (error) {
      console.error("Error saving profile:", error);
      throw error;
    }
    
    console.log("Profile save successful");
    return data;
  } catch (err) {
    console.error("Unexpected error in saveUserProfile:", err);
    throw err;
  }
}

/**
 * Initialize an empty profile for a new user
 */
export function createEmptyProfile(userId: string): UserProfile {
  if (!userId) {
    console.error("createEmptyProfile called with empty userId");
    throw new Error("User ID is required");
  }
  
  console.log("Creating empty profile for user ID:", userId);
  return {
    id: userId,
    has_major_illness: false,
    has_injury: false,
    has_consistent_training: false,
    has_advanced_training: false
  };
}

/**
 * Insert new activity log
 */
export async function logActivity(userId: string, activity: Record<string, unknown>) {
  if (!userId) {
    console.error("logActivity called with empty userId");
    throw new Error("User ID is required");
  }
  
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from("activities")
      .insert([{ user_id: userId, ...activity }]);
      
    if (error) {
      console.error("Error logging activity:", error);
      throw error;
    }
    
    console.log("Activity logged successfully");
  } catch (err) {
    console.error("Unexpected error in logActivity:", err);
    throw err;
  }
}