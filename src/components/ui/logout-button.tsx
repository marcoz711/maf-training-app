"use client";

import { Button } from "./button";
import { useAuth } from "@/contexts/auth-context"; 
import { useState } from "react";

export function LogoutButton() {
  const { signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      // Use the signOut function from auth context
      await signOut();
      
      // Force a complete refresh of the application state
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
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