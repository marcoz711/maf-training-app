import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

/**
 * FitnessSyncer Connection Status Endpoint
 * 
 * This endpoint checks if the current user has a valid FitnessSyncer connection
 * by looking for active connections in the api_connections table.
 */
export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client with cookies for authentication
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated", connected: false },
        { status: 401 }
      );
    }
    
    // Check if the user has an active FitnessSyncer connection
    const { data, error } = await supabase
      .from("api_connections")
      .select("*") // Select all fields to ensure we have everything we need
      .eq("user_id", session.user.id)
      .eq("provider", "fitnesssyncer")
      .maybeSingle();
    
    if (error) {
      console.error("Error checking connection status:", error);
      return NextResponse.json(
        { error: "Database error", details: error.message, connected: false },
        { status: 500 }
      );
    }
    
    // If no connection exists, return appropriate response
    if (!data) {
      return NextResponse.json({
        connected: false,
        status: 'disconnected',
        message: 'No FitnessSyncer connection found'
      });
    }
    
    // Check if connection exists, is active, and tokens are valid
    let isConnected = false;
    
    if (data.status === 'active' && data.access_token) {
      try {
        // Check if token is expired (if expiry is provided)
        if (data.token_expiry && typeof data.token_expiry === 'string') {
          // Safely convert the token_expiry string to a Date
          const expiryDate = new Date(data.token_expiry);
          isConnected = expiryDate > new Date();
        } else {
          // If no expiry date is set, consider it valid
          isConnected = true;
        }
      } catch (e) {
        console.error("Invalid token_expiry date format:", e);
        isConnected = false;
      }
    }
    
    // Return connection status details with all relevant fields
    return NextResponse.json({
      connected: isConnected,
      status: data.status || 'disconnected',
      expires_at: data.token_expiry || null,
      last_updated: data.updated_at || null,
      connection_id: data.id,
      provider: data.provider,
      scopes: data.scopes || [],
      created_at: data.created_at,
    });
  } catch (error) {
    console.error("Error in connection status endpoint:", error);
    const errorMessage = error instanceof Error ? error.message : "Server error";
    
    return NextResponse.json(
      { error: errorMessage, connected: false },
      { status: 500 }
    );
  }
} 