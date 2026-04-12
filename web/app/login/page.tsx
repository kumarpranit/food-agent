"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type AuthMode = "options" | "email";

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("options");
  const [isSignUp, setIsSignUp] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const clearState = () => {
    setError(null);
    setMessage(null);
  };

  // ── Gmail OAuth ──────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    clearState();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/chat` },
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  // ── Email + Password ─────────────────────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearState();
    setLoading(true);
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage("Check your email to confirm your account!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else window.location.href = "/chat";
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      {/* Card */}
      <div className="w-full max-w-md">

        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-500 mb-4 text-2xl">
            🍽️
          </div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)] tracking-tight">
            Food Agent
          </h1>
          <p className="text-sm text-[var(--foreground)] opacity-50 mt-1">
            Discover restaurants with AI
          </p>
        </div>

        {/* Panel */}
        <div className="rounded-2xl border border-[var(--foreground)]/10 bg-[var(--foreground)]/[0.03] p-8 backdrop-blur-sm">

          {/* ── Mode: Options ── */}
          {mode === "options" && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-[var(--foreground)] opacity-40 uppercase tracking-widest mb-5 text-center">
                Sign in to continue
              </p>

              {/* Google */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-[var(--foreground)]/10 bg-[var(--background)] hover:bg-[var(--foreground)]/5 transition-all duration-150 text-sm font-medium text-[var(--foreground)] disabled:opacity-40"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-[var(--foreground)]/10" />
                <span className="text-xs text-[var(--foreground)] opacity-30">or</span>
                <div className="flex-1 h-px bg-[var(--foreground)]/10" />
              </div>

              {/* Email */}
              <button
                onClick={() => { clearState(); setMode("email"); setIsSignUp(false); }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 transition-all duration-150 text-sm font-medium text-white"
              >
                <EmailIcon />
                Continue with Email
              </button>

              <p className="text-center text-xs text-[var(--foreground)] opacity-30 pt-2">
                No account yet?{" "}
                <button
                  onClick={() => { clearState(); setMode("email"); setIsSignUp(true); }}
                  className="text-orange-500 hover:text-orange-400 font-medium opacity-100"
                >
                  Sign up
                </button>
              </p>
            </div>
          )}

          {/* ── Mode: Email ── */}
          {mode === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="flex items-center gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => { clearState(); setMode("options"); }}
                  className="text-[var(--foreground)] opacity-40 hover:opacity-70 transition-opacity"
                >
                  ←
                </button>
                <h2 className="text-base font-semibold text-[var(--foreground)]">
                  {isSignUp ? "Create account" : "Welcome back"}
                </h2>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] opacity-50 block mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@gmail.com"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[var(--foreground)]/10 bg-[var(--background)] text-[var(--foreground)] text-sm placeholder:text-[var(--foreground)]/25 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--foreground)] opacity-50 block mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--foreground)]/10 bg-[var(--background)] text-[var(--foreground)] text-sm placeholder:text-[var(--foreground)]/25 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30 transition-all"
                  />
                </div>
              </div>

              {error && <ErrorBox message={error} />}
              {message && <SuccessBox message={message} />}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-all duration-150 disabled:opacity-40 mt-2"
              >
                {loading ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
              </button>

              <p className="text-center text-xs text-[var(--foreground)] opacity-30 pt-1">
                {isSignUp ? "Already have an account? " : "No account? "}
                <button
                  type="button"
                  onClick={() => { clearState(); setIsSignUp(!isSignUp); }}
                  className="text-orange-500 hover:text-orange-400 font-medium opacity-100"
                >
                  {isSignUp ? "Sign in" : "Sign up"}
                </button>
              </p>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-[var(--foreground)] opacity-20 mt-6">
          By continuing you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}

// ── Small reusable components ────────────────────────────────────

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
      {message}
    </div>
  );
}

function SuccessBox({ message }: { message: string }) {
  return (
    <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs">
      {message}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  );
}
