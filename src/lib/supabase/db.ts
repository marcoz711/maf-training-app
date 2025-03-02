import { supabase } from "./supabase";

// Fetch user profile by auth_id
export async function getUserProfile(authId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", authId)
    .single();

  if (error) throw error;
  return data;
}

// Insert new activity log
export async function logActivity(userId: string, activity: any) {
  const { error } = await supabase.from("activities").insert([{ user_id: userId, ...activity }]);
  if (error) throw error;
}