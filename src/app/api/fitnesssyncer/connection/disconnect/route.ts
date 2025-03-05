import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

/**
 * FitnessSyncer Disconnect Endpoint
 * 
 * This endpoint allows users to disconnect their FitnessSyncer account by:
 * 1. Setting the connection status to 'disconnected'
 * 2. Clearing the tokens
 */
export async function POST() {
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
    
    // Update the connection record to disconnected
    const { error } = await supabase
      .from("api_connections")
      .update({
        status: "disconnected",
        access_token: null,
        refresh_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", session.user.id)
      .eq("provider", "fitnesssyncer");
    
    if (error) {
      console.error("Error disconnecting FitnessSyncer:", error);
      return NextResponse.json(
        { 
          success: false,
          error: "Database error", 
          message: "Failed to disconnect FitnessSyncer",
          details: error.message 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: "Successfully disconnected from FitnessSyncer"
    });
  } catch (error) {
    console.error("Error in disconnect endpoint:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    
    return NextResponse.json(
      { 
        success: false,
        error: "server_error",
        message: errorMessage 
      },
      { status: 500 }
    );
  }
} 