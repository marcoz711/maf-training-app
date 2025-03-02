"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LogoutButton } from "@/components/ui/logout-button";

console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    }

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

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
              <Link 
                href="/profile" 
                className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                Your Profile
              </Link>
              <LogoutButton />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-amber-600">You are not currently logged in.</p>
            <Link 
              href="/login" 
              className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Go to Login
            </Link>
          </div>
        )}
      </div>
      
      <p className="text-gray-700">
        This is the main page of your application. The content here will change based on whether you're logged in or not.
      </p>
    </main>
  );
}
