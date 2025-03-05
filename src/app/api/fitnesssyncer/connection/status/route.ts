import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

/**
 * FitnessSyncer Connection Status Endpoint
 * 
 * This endpoint checks if the current user has a valid FitnessSyncer connection
 * by looking for active connections in the api_connections table.
 */
export async function GET() {
  try {
    // Initialize Supabase client
    const supabase = createClient();
    
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    // Check if the user has an active FitnessSyncer connection
    const { data, error } = await supabase
      .from("api_connections")
      .select("access_token, expires_at, status, updated_at")
      .eq("user_id", session.user.id)
      .eq("provider", "fitnesssyncer")
      .maybeSingle();
    
    if (error) {
      console.error("Error checking connection status:", error);
      return NextResponse.json(
        { error: "Database error", details: error.message },
        { status: 500 }
      );
    }
    
    // Check if connection exists, is active, and tokens are valid
    let isConnected = false;
    
    if (data && 
        data.status === 'active' && 
        data.access_token && 
        data.expires_at) {
      try {
        // Safely convert the expires_at string to a Date
        const expiryDate = new Date(data.expires_at as string);
        isConnected = expiryDate > new Date();
      } catch (e) {
        console.error("Invalid expires_at date format:", e);
        isConnected = false;
      }
    }
    
    // Return connection status details
    return NextResponse.json({
      connected: isConnected,
      status: data?.status || 'disconnected',
      expires_at: data?.expires_at || null,
      last_updated: data?.updated_at || null,
    });
  } catch (error) {
    console.error("Error in connection status endpoint:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 