import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { saveAuthState } from "@/lib/supabase/db";
import crypto from "crypto";
import { 
  generateSessionId, 
  logOAuthStep, 
  logOAuthError, 
  OAuthStage, 
  isDebuggingEnabled 
} from "@/utils/fitnesssyncer-debug";

/**
 * FitnessSyncer authorization endpoint
 * 
 * This route:
 * 1. Generates a secure random state parameter
 * 2. Stores it in the session cookie
 * 3. Redirects to FitnessSyncer's authorization URL
 * 
 * After authorization, the user will need to copy the code from the redirect URL
 * to complete the authorization process.
 */
export async function GET() {
  const debugSessionId = generateSessionId();
  const debugEnabled = isDebuggingEnabled();
  
  if (debugEnabled) {
    logOAuthStep(
      debugSessionId,
      OAuthStage.AUTH_START,
      "Authorization endpoint called"
    );
  }
  
  try {
    // Generate a random state parameter (32 bytes = 64 hex chars)
    const state = crypto.randomBytes(32).toString("hex");
    
    if (debugEnabled) {
      logOAuthStep(
        debugSessionId,
        OAuthStage.AUTH_START,
        `State parameter generated (length: ${state.length})`
      );
    }
    
    // Get the FitnessSyncer configuration from environment variables
    const clientId = process.env.NEXT_PUBLIC_FITNESSSYNCER_CLIENT_ID;
    const authUrl = process.env.NEXT_PUBLIC_FITNESSSYNCER_AUTH_URL;
    const redirectUri = process.env.NEXT_PUBLIC_FITNESSSYNCER_REDIRECT_URI;
    
    if (!clientId || !authUrl || !redirectUri) {
      const missingVars = [
        !clientId ? 'NEXT_PUBLIC_FITNESSSYNCER_CLIENT_ID' : null,
        !authUrl ? 'NEXT_PUBLIC_FITNESSSYNCER_AUTH_URL' : null,
        !redirectUri ? 'NEXT_PUBLIC_FITNESSSYNCER_REDIRECT_URI' : null
      ].filter(Boolean).join(', ');
      
      if (debugEnabled) {
        logOAuthError(
          debugSessionId,
          OAuthStage.AUTH_START,
          new Error("FitnessSyncer configuration is missing"),
          `Missing environment variables: ${missingVars}`
        );
      }
      
      return NextResponse.json(
        { error: "FitnessSyncer configuration is missing" },
        { status: 500 }
      );
    }

    // Also store the state in Supabase for the current user
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    // Authentication is optional - we'll store state in the database if user is authenticated
    // Otherwise, we rely on cookies and sessionStorage
    let isAuthenticated = false;
    let userId = 'anonymous';
    
    if (session?.user) {
      isAuthenticated = true;
      userId = session.user.id;
      
      if (debugEnabled) {
        logOAuthStep(
          debugSessionId,
          OAuthStage.AUTH_START,
          `Storing state for user ${userId} in database`
        );
      }
      
      // Store the state using the utility function
      await saveAuthState(userId, "fitnesssyncer", state);
    } else if (debugEnabled) {
      logOAuthStep(
        debugSessionId,
        OAuthStage.AUTH_START,
        "No user session found, state only stored in cookie and will be returned in response"
      );
    }

    // Build the authorization URL
    const authorizeUrl = new URL(authUrl);
    authorizeUrl.searchParams.append("client_id", clientId);
    authorizeUrl.searchParams.append("redirect_uri", redirectUri);
    authorizeUrl.searchParams.append("response_type", "code");
    authorizeUrl.searchParams.append("state", state);
    authorizeUrl.searchParams.append("scope", "sources");
    
    if (debugEnabled) {
      logOAuthStep(
        debugSessionId,
        OAuthStage.AUTH_REDIRECT,
        `Authorization URL generated: ${authorizeUrl.toString().substring(0, 100)}...`
      );
    }
    
    // Create the response with all data included upfront
    const response = NextResponse.json({
      success: true,
      message: "Authorization started",
      redirect_url: authorizeUrl.toString(),
      debug_session_id: debugEnabled ? debugSessionId : undefined,
      state: state,
      instructions: "Please click the link to authorize with FitnessSyncer. After authorization, you will be redirected to FitnessSyncer's website. Copy the 'code' parameter from the URL and return to this application to complete the connection."
    });

    // Set the state in a cookie using the Response object - this one is secure but inaccessible to JS
    response.cookies.set("fitnesssyncer_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 10, // 10 minutes
      path: "/",
    });

    // Set another cookie that is accessible to JavaScript
    response.cookies.set("fitnesssyncer_state_client", state, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 10, // 10 minutes
      path: "/",
    });
    
    if (debugEnabled) {
      logOAuthStep(
        debugSessionId,
        OAuthStage.AUTH_START,
        "Cookies set with state parameter"
      );
    }

    return response;
  } catch (error) {
    if (debugEnabled) {
      logOAuthError(
        debugSessionId,
        OAuthStage.AUTH_START,
        error instanceof Error ? error : new Error("Unknown error"),
        "Unexpected error in authorization endpoint"
      );
    }
    
    console.error("Error starting FitnessSyncer authorization:", error);
    return NextResponse.json(
      { error: "Failed to start authorization" },
      { status: 500 }
    );
  }
} 