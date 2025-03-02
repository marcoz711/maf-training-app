"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "./button";
import { useState } from "react";
import { signOut } from "@/lib/supabase/auth";

export function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      console.log("Starting logout process...");
      
      let logoutSuccessful = false;
      
      // Try using the custom signOut function if it exists
      try {
        await signOut();
        console.log("Custom signOut successful");
        logoutSuccessful = true;
      } catch (signOutError) {
        console.warn("Custom signOut failed or not available:", signOutError);
        
        // Fallback to direct Supabase client
        try {
          const supabase = createClient();
          const { error } = await supabase.auth.signOut();
          
          if (error) {
            throw error;
          }
          
          console.log("Direct Supabase signOut successful");
          logoutSuccessful = true;
        } catch (supabaseError) {
          console.error("Supabase signOut error:", supabaseError);
          throw supabaseError;
        }
      }
      
      if (logoutSuccessful) {
        // Clear any localStorage items to be safe
        localStorage.removeItem("supabase.auth.token");
        
        // Force a complete reload after a short delay
        console.log("Redirecting to home page...");
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
      }
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to log out. Please try again or refresh the page.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Button 
      onClick={handleLogout} 
      variant="destructive"
      disabled={isLoggingOut}
    >
      {isLoggingOut ? "Logging out..." : "Logout"}
    </Button>
  );
}