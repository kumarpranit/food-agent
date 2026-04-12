"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type AuthMode = "options" | "email";

const FOOD_FACTS = [
  "🍕 Naples, Italy invented pizza in the 18th century",
  "🍣 Sushi originally meant 'sour-tasting' in Japanese",
  "🌮 Tacos date back to Mexican silver mines in the 1700s",
  "🍜 Ramen was introduced to Japan from China in the 1800s",
  "🥐 The croissant was actually invented in Austria, not France",
  "🍔 The hamburger gets its name from Hamburg, Germany",
  "☕ Coffee was discovered by Ethiopian goat herders",
  "🍦 Ice cream was a luxury only royalty could afford in the 1600s",
];

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("options");
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [factIdx] = useState(() => Math.floor(Math.random() * FOOD_FACTS.length));

  const clearState = () => { setError(null); setMessage(null); };

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
    <div className="min-h-screen flex">

      {/* ── Left panel: Hero ── */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative flex-col justify-between p-12"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=80")',
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.30) 50%, rgba(234,88,12,0.60) 100%)",
          }}
        />

        {/* Top: Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-500 text-lg shadow-lg">
            🍽️
          </div>
          <span className="text-white text-lg font-semibold tracking-tight">Food Agent</span>
        </div>

        {/* Middle: Big headline */}
        <div className="relative z-10">
          <h1 className="text-5xl xl:text-6xl font-bold text-white leading-tight">
            Find your next<br />
            <span className="text-orange-400">favourite meal</span>
          </h1>
          <p className="mt-4 text-white/70 text-lg max-w-md">
            AI-powered restaurant discovery. Get personalised picks based on your location, mood, and budget — instantly.
          </p>
        </div>

        {/* Bottom: Food fact card */}
        <div className="relative z-10">
          <div
            className="rounded-2xl px-5 py-4 max-w-sm"
            style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.20)" }}
          >
            <p className="text-white/50 text-xs font-medium uppercase tracking-widest mb-1">Did you know?</p>
            <p className="text-white text-sm leading-relaxed">{FOOD_FACTS[factIdx]}</p>
          </div>
        </div>
      </div>

      {/* ── Right panel: Login form ── */}
      <div
        className="w-full lg:w-1/2 xl:w-2/5 flex flex-col items-center justify-center px-6 py-12 relative"
        style={{ background: "linear-gradient(160deg, #fff9f5 0%, #ffffff 60%, #fff3e0 100%)" }}
      >
        {/* Subtle decorative blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-orange-100/60 blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-amber-100/60 blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

        {/* Mobile-only logo */}
        <div className="lg:hidden text-center mb-8 relative z-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-500 mb-3 text-2xl shadow-lg">
            🍽️
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Food Agent</h1>
          <p className="text-sm text-gray-500 mt-1">Discover restaurants with AI</p>
        </div>

        <div className="w-full max-w-sm relative z-10">

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === "email" ? (isSignUp ? "Create account" : "Welcome back") : "Sign in"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {mode === "email"
                ? isSignUp ? "Start discovering great food near you." : "Good to see you again 👋"
                : "Choose how you'd like to continue."}
            </p>
          </div>

          {/* ── Options mode ── */}
          {mode === "options" && (
            <div className="space-y-3">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 transition-all text-sm font-medium text-gray-700 shadow-sm disabled:opacity-40"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <button
                onClick={() => { clearState(); setMode("email"); setIsSignUp(false); }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 transition-all text-sm font-semibold text-white shadow-md shadow-orange-200"
              >
                <EmailIcon />
                Continue with Email
              </button>

              <p className="text-center text-sm text-gray-500 pt-1">
                No account?{" "}
                <button
                  onClick={() => { clearState(); setMode("email"); setIsSignUp(true); }}
                  className="text-orange-500 hover:text-orange-600 font-semibold"
                >
                  Sign up free
                </button>
              </p>
            </div>
          )}

          {/* ── Email mode ── */}
          {mode === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all shadow-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all shadow-sm"
                />
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                  {error}
                </div>
              )}
              {message && (
                <div className="px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-all shadow-md shadow-orange-200 disabled:opacity-40"
              >
                {loading ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
              </button>

              <div className="flex items-center justify-between pt-1 text-sm">
                <button
                  type="button"
                  onClick={() => { clearState(); setMode("options"); }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => { clearState(); setIsSignUp(!isSignUp); }}
                  className="text-orange-500 hover:text-orange-600 font-semibold"
                >
                  {isSignUp ? "Sign in instead" : "Create account"}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="relative z-10 text-center text-xs text-gray-400 mt-10">
          By continuing you agree to our Terms & Privacy Policy
        </p>
      </div>
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
