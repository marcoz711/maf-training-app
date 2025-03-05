import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { getAuthState } from "@/lib/supabase/db";
import { 
  generateSessionId, 
  logOAuthStep, 
  logOAuthError, 
  logApiRequest,
  logApiResponse,
  OAuthStage, 
  isDebuggingEnabled 
} from "@/utils/fitnesssyncer-debug";
import { v4 as uuidv4 } from 'uuid';

/**
 * FitnessSyncer connection endpoint
 * 
 * This route:
 * 1. Verifies the authorization code from the client
 * 2. Exchanges it for an access token with FitnessSyncer API
 * 3. Saves the token to the database
 * 
 * The client must provide:
 * - code: The authorization code from FitnessSyncer
 * - state: The state parameter from the original authorization request
 */
export async function POST(request: NextRequest) {
  const debugSessionId = generateSessionId();
  const debugEnabled = isDebuggingEnabled();
  
  if (debugEnabled) {
    logOAuthStep(
      debugSessionId,
      OAuthStage.TOKEN_EXCHANGE,
      "Connection endpoint called"
    );
  }
  
  try {
    // Parse the request JSON
    const requestData = await request.json();
    const { code, state } = requestData;
    
    if (debugEnabled) {
      logOAuthStep(
        debugSessionId,
        OAuthStage.TOKEN_EXCHANGE,
        `Request received with ${code ? 'code' : 'no code'} and ${state ? 'state' : 'no state'}`
      );
    }
    
    // Verify required parameters
    if (!code) {
      if (debugEnabled) {
        logOAuthError(
          debugSessionId,
          OAuthStage.TOKEN_EXCHANGE,
          new Error("Missing authorization code"),
          "Required parameter 'code' is missing from the request"
        );
      }
      
      return NextResponse.json(
        { error: "Missing authorization code" },
        { status: 400 }
      );
    }
    
    if (!state) {
      if (debugEnabled) {
        logOAuthError(
          debugSessionId,
          OAuthStage.TOKEN_EXCHANGE,
          new Error("Missing state parameter"),
          "Required parameter 'state' is missing from the request"
        );
      }
      
      return NextResponse.json(
        { error: "Missing state parameter" },
        { status: 400 }
      );
    }
    
    // Get the FitnessSyncer configuration from environment variables
    const clientId = process.env.NEXT_PUBLIC_FITNESSSYNCER_CLIENT_ID;
    const clientSecret = process.env.FITNESSSYNCER_CLIENT_SECRET;
    const tokenUrl = process.env.FITNESSSYNCER_TOKEN_URL;
    const redirectUri = process.env.NEXT_PUBLIC_FITNESSSYNCER_REDIRECT_URI;
    
    if (!clientId || !clientSecret || !tokenUrl || !redirectUri) {
      const missingVars = [
        !clientId ? 'NEXT_PUBLIC_FITNESSSYNCER_CLIENT_ID' : null,
        !clientSecret ? 'FITNESSSYNCER_CLIENT_SECRET' : null,
        !tokenUrl ? 'FITNESSSYNCER_TOKEN_URL' : null,
        !redirectUri ? 'NEXT_PUBLIC_FITNESSSYNCER_REDIRECT_URI' : null
      ].filter(Boolean).join(', ');
      
      if (debugEnabled) {
        logOAuthError(
          debugSessionId,
          OAuthStage.TOKEN_EXCHANGE,
          new Error("FitnessSyncer configuration is missing"),
          `Missing environment variables: ${missingVars}`
        );
      }
      
      return NextResponse.json(
        { error: "FitnessSyncer configuration is missing" },
        { status: 500 }
      );
    }

    // Get the Supabase client and user session
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    // Generate a UUID for user_id regardless of authentication status
    let userId = session?.user?.id || uuidv4();
    let isAuthenticated = !!session?.user;
    
    // Check if user is authenticated but make it optional
    if (isAuthenticated) {
      if (debugEnabled) {
        logOAuthStep(
          debugSessionId,
          OAuthStage.TOKEN_EXCHANGE,
          `User authenticated with ID: ${userId}`
        );
      }
    } else {
      if (debugEnabled) {
        logOAuthStep(
          debugSessionId,
          OAuthStage.TOKEN_EXCHANGE,
          `No authenticated user session found, using generated UUID: ${userId}`
        );
      }
    }
    
    // If user is authenticated, verify the state parameter against the stored state
    let shouldVerifyState = false;
    if (isAuthenticated) {
      const storedState = await getAuthState(userId, "fitnesssyncer");
      
      // If we have a stored state in the database, verify it matches
      if (storedState && storedState !== state) {
        if (debugEnabled) {
          logOAuthError(
            debugSessionId,
            OAuthStage.TOKEN_EXCHANGE,
            new Error("Invalid state parameter"),
            `State mismatch: received '${state}', expected '${storedState}'`
          );
        }
        
        return NextResponse.json(
          { error: "Invalid state parameter" },
          { status: 400 }
        );
      }
      
      shouldVerifyState = !!storedState;
    }
    
    if (debugEnabled) {
      if (shouldVerifyState) {
        logOAuthStep(
          debugSessionId,
          OAuthStage.TOKEN_EXCHANGE,
          "State parameter validated successfully"
        );
      } else {
        logOAuthStep(
          debugSessionId,
          OAuthStage.TOKEN_EXCHANGE,
          `Using client-provided state: ${state} without database verification`
        );
      }
    }
    
    // Prepare the token exchange request
    const tokenRequestBody = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: redirectUri,
    });
    
    const tokenRequestHeaders = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    
    if (debugEnabled) {
      logApiRequest(
        debugSessionId,
        OAuthStage.TOKEN_EXCHANGE,
        tokenUrl,
        "POST",
        tokenRequestHeaders,
        Object.fromEntries(tokenRequestBody.entries()),
        "Token exchange request"
      );
    }
    
    // Exchange the authorization code for an access token
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: tokenRequestHeaders,
      body: tokenRequestBody,
    });
    
    // Parse the token response
    const tokenData = await tokenResponse.json();
    
    if (debugEnabled) {
      logApiResponse(
        debugSessionId,
        OAuthStage.TOKEN_EXCHANGE,
        tokenData,
        `Token exchange response (${tokenResponse.status})`
      );
      
      // Additional debugging for scopes
      console.log("Token data:", {
        hasScope: !!tokenData.scope,
        scopeType: tokenData.scope ? typeof tokenData.scope : 'undefined',
        scopeValue: tokenData.scope,
      });
    }
    
    // Check if the token request was successful
    if (!tokenResponse.ok || !tokenData.access_token) {
      if (debugEnabled) {
        logOAuthError(
          debugSessionId,
          OAuthStage.TOKEN_EXCHANGE,
          new Error(`Token exchange failed: ${tokenResponse.status}`),
          tokenData.error 
            ? `Error: ${tokenData.error}, Description: ${tokenData.error_description || 'None'}`
            : "No error details provided"
        );
      }
      
      return NextResponse.json(
        { 
          error: "Failed to exchange authorization code for token",
          details: tokenData.error_description || tokenData.error || "Unknown error"
        },
        { status: tokenResponse.status }
      );
    }
    
    // Update user authentication info if needed
    if (debugEnabled) {
      logOAuthStep(
        debugSessionId,
        OAuthStage.TOKEN_EXCHANGE,
        isAuthenticated 
          ? `User is authenticated with ID: ${userId.substring(0, 8)}...`
          : "No authenticated user found"
      );
    }

    // Token exchange successful - return the tokens
    return NextResponse.json({
      success: true,
      message: "FitnessSyncer connection established successfully",
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      token_expiry: tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null,
      provider: "fitnesssyncer",
      scopes: tokenData.scope || "",
      authenticated: isAuthenticated,
      user_id: userId,
      debug_session_id: debugEnabled ? debugSessionId : undefined,
    });
  } catch (error) {
    if (debugEnabled) {
      logOAuthError(
        debugSessionId,
        OAuthStage.ERROR,
        error instanceof Error ? error : new Error("Unknown error occurred"),
        "Unexpected error in connection endpoint"
      );
    }
    
    console.error("Error connecting to FitnessSyncer:", error);
    return NextResponse.json(
      { error: "Failed to establish connection" },
      { status: 500 }
    );
  }
}

/**
 * GET handler for FitnessSyncer connection endpoint
 * 
 * Retrieves the current user's FitnessSyncer connection details
 */
export async function GET(request: NextRequest) {
  const debugSessionId = generateSessionId();
  const debugEnabled = isDebuggingEnabled();
  
  if (debugEnabled) {
    logOAuthStep(
      debugSessionId,
      OAuthStage.CONNECTION_CHECK,
      "Fetching connection details"
    );
  }
  
  try {
    // Get the Supabase client with cookies for authentication
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    // Check if user is authenticated
    if (!session?.user) {
      if (debugEnabled) {
        logOAuthError(
          debugSessionId,
          OAuthStage.CONNECTION_CHECK,
          new Error("User not authenticated"),
          "No user session found"
        );
      }
      
      return NextResponse.json(
        { error: "User not authenticated", connected: false },
        { status: 401 }
      );
    }
    
    // Fetch the user's FitnessSyncer connection
    const { data, error } = await supabase
      .from("api_connections")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("provider", "fitnesssyncer")
      .maybeSingle();
    
    if (error) {
      if (debugEnabled) {
        logOAuthError(
          debugSessionId,
          OAuthStage.CONNECTION_CHECK,
          new Error("Database error"),
          `Error fetching connection: ${error.message}`
        );
      }
      
      return NextResponse.json(
        { error: "Failed to fetch connection details", details: error.message, connected: false },
        { status: 500 }
      );
    }
    
    if (!data) {
      if (debugEnabled) {
        logOAuthStep(
          debugSessionId,
          OAuthStage.CONNECTION_CHECK,
          "No connection found for user"
        );
      }
      
      return NextResponse.json({
        connected: false,
        status: "disconnected",
        message: "No FitnessSyncer connection found for this user"
      });
    }
    
    // Check if the connection is valid and active
    let isConnected = false;
    
    if (data.status === 'active' && data.access_token) {
      // Check if token is expired (if expiry is provided)
      if (data.token_expiry && typeof data.token_expiry === 'string') {
        try {
          const expiryDate = new Date(data.token_expiry);
          isConnected = expiryDate > new Date();
        } catch (e) {
          console.error("Invalid token_expiry date format:", e);
        }
      } else {
        // If no expiry date, consider it valid
        isConnected = true;
      }
    }
    
    if (debugEnabled) {
      logOAuthStep(
        debugSessionId,
        OAuthStage.CONNECTION_CHECK,
        `Connection found, status: ${isConnected ? 'active' : 'inactive'}`
      );
    }
    
    // Return connection details
    return NextResponse.json({
      connected: isConnected,
      status: data.status,
      provider: data.provider,
      connection_id: data.id,
      expires_at: data.token_expiry,
      last_updated: data.updated_at,
      created_at: data.created_at,
      scopes: data.scopes,
      debug_session_id: debugEnabled ? debugSessionId : undefined
    });
  } catch (error) {
    if (debugEnabled) {
      logOAuthError(
        debugSessionId,
        OAuthStage.CONNECTION_CHECK,
        error instanceof Error ? error : new Error("Unknown error occurred"),
        "Unexpected error fetching connection details"
      );
    }
    
    console.error("Error fetching FitnessSyncer connection:", error);
    return NextResponse.json(
      { error: "Failed to fetch connection details", connected: false },
      { status: 500 }
    );
  }
} 