"use client";
import { useState } from "react";
import { signIn, signUp } from "@/lib/supabase/auth";
import { Button } from "@/components/ui/button";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");

  async function handleAuth() {
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
      window.location.href = "/"; // Redirect after login
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">{isSignUp ? "Sign Up" : "Login"}</h1>
      {error && <p className="text-red-500">{error}</p>}
      <input
        type="email"
        placeholder="Email"
        className="w-full p-2 border mb-2"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        className="w-full p-2 border mb-2"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button onClick={handleAuth}>{isSignUp ? "Sign Up" : "Login"}</Button>
      <p className="mt-2">
        {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
        <button className="text-blue-500" onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? "Login" : "Sign Up"}
        </button>
      </p>
    </div>
  );
}