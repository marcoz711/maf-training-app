import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { verifyAuthState } from "@/lib/supabase/db";

/**
 * FitnessSyncer callback handler
 * 
 * This route:
 * 1. Receives the code and state from FitnessSyncer
 * 2. Verifies the state parameter matches what was stored
 * 3. Returns the code for the client to use
 * 
 * Note: The user needs to manually copy the code from the redirect URL
 * since FitnessSyncer requires a specific redirect URI.
 */
export async function GET(request: NextRequest) {
  // Get code and state from URL parameters
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle errors from FitnessSyncer
  if (error) {
    return NextResponse.json({
      success: false,
      error,
      message: errorDescription || "Authorization failed",
    }, { status: 400 });
  }

  // Check if code and state are present
  if (!code || !state) {
    return NextResponse.json({
      success: false,
      error: "missing_parameters",
      message: "Code or state parameter is missing",
    }, { status: 400 });
  }

  // Get state from cookie for verification
  const stateCookie = request.cookies.get("fitnesssyncer_state");
  
  if (!stateCookie || stateCookie.value !== state) {
    return NextResponse.json({
      success: false,
      error: "invalid_state",
      message: "State parameter doesn't match",
    }, { status: 400 });
  }

  // Get the user
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return NextResponse.json({
      success: false,
      error: "not_authenticated",
      message: "User is not authenticated",
    }, { status: 401 });
  }

  // Verify the state in the database
  const isStateValid = await verifyAuthState(session.user.id, "fitnesssyncer", state);
  
  if (!isStateValid) {
    return NextResponse.json({
      success: false,
      error: "invalid_state",
      message: "State parameter verification failed",
    }, { status: 400 });
  }

  // Return success with the code
  // Note: In a real-world application, you would use this code to obtain access tokens
  // However, per requirements, we're instructing the user to copy the code
  const response = NextResponse.json({
    success: true,
    message: "Authorization successful",
    code,
    instructions: "Please copy this code and return to the main application to complete the connection.",
  });

  // Clear the state cookie as it's no longer needed
  response.cookies.set("fitnesssyncer_state", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0, // Expire immediately
    path: "/",
  });

  return response;
} 