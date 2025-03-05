import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { isDebuggingEnabled } from "@/utils/fitnesssyncer-debug";

/**
 * Get the current debugging status
 */
export async function GET(request: NextRequest) {
  // Check if user is authenticated and authorized to access debugging
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return NextResponse.json(
      { error: "Not authorized" },
      { status: 401 }
    );
  }
  
  // Check if the user is an admin
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", session.user.id)
    .eq("role", "admin")
    .maybeSingle();
  
  const isAdmin = !!userRoles;
  
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Not authorized to access debugging features" },
      { status: 403 }
    );
  }
  
  // Check the current debug status
  const enabled = isDebuggingEnabled();
  
  return NextResponse.json({ 
    enabled,
    message: "Debugging can only be enabled by setting the FITNESSSYNCER_DEBUG=true environment variable"
  });
}

/**
 * This endpoint is for informational purposes only
 * Debugging can only be enabled by setting the FITNESSSYNCER_DEBUG=true environment variable
 */
export async function POST(request: NextRequest) {
  // Check if user is authenticated and authorized
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return NextResponse.json(
      { error: "Not authorized" },
      { status: 401 }
    );
  }
  
  // Check if the user is an admin
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", session.user.id)
    .eq("role", "admin")
    .maybeSingle();
  
  const isAdmin = !!userRoles;
  
  if (!isAdmin) {
    return NextResponse.json(
      { error: "Not authorized to access debugging features" },
      { status: 403 }
    );
  }
  
  // Return the current status with an informational message
  const enabled = isDebuggingEnabled();
  
  return NextResponse.json({
    enabled,
    message: "Debugging can only be enabled by setting the FITNESSSYNCER_DEBUG=true environment variable"
  });
} 