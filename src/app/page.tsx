"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/ui/logout-button";
import { useAuth } from "@/contexts/auth-context";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="max-w-4xl mx-auto mt-10 p-6">Loading...</div>;
  }

  return (
    <main className="max-w-4xl mx-auto mt-10 p-6 border rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6">Welcome to Our App</h1>
      
      <div className="p-4 bg-gray-100 rounded-lg mb-6">
        {user ? (
          <div className="space-y-4">
            <p className="text-green-600 font-medium">
              You are logged in as: <span className="font-bold">{user.email}</span>
            </p>
            <div className="flex gap-4">
              <Button asChild>
                <Link href="/profile">Your Profile</Link>
              </Button>
              <LogoutButton />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-amber-600">You are not currently logged in.</p>
            <Button asChild>
              <Link href="/login">Go to Login</Link>
            </Button>
          </div>
        )}
      </div>
      
      <p className="text-gray-700">
        This is the main page of your application. The content here will change based on whether you&apos;re logged in or not.
      </p>
    </main>
  );
}
