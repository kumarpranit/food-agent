"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Restaurant = {
  name: string;
  address?: string;
  rating?: number;
  open_now?: boolean | null;
  maps_url: string;
  distance_miles?: number;
};

const quickSuggestions = [
  "Pizza nearby",
  "Healthy lunch",
  "Cheap dinner",
  "Mexican food",
  "Coffee shops",
  "Open now",
];

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [lat, setLat] = useState<number | null>(34.0522);
  const [lng, setLng] = useState<number | null>(-118.2437);
  const [locationReady, setLocationReady] = useState(false);
  const [radius, setRadius] = useState(3218);
  const [openOnly, setOpenOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rawResults, setRawResults] = useState<Restaurant[]>([]);
  const [results, setResults] = useState<Restaurant[]>([]);

  // ── Auth check ───────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.href = "/login";
      } else {
        setUser(session.user);
        setAuthLoading(false);
      }
    });
  }, []);

  // ── Geolocation ──────────────────────────────────────────────
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocationReady(true);
      },
      () => setLocationReady(true)
    );
  }, []);

  const applyFilters = (items: Restaurant[], openFilter: boolean) => {
    if (openFilter) return items.filter((r) => r.open_now !== false);
    return items;
  };

  useEffect(() => {
    setResults(applyFilters(rawResults, openOnly));
  }, [rawResults, openOnly]);

  const handleSearch = async (preset?: string) => {
    if (lat === null || lng === null) return;
    const finalQuery = preset ?? query;
    if (!finalQuery.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/restaurants/nearby`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lat,
            lng,
            radius,
            keyword: finalQuery,
          }),
        }
      );
      const data = await res.json();
      setRawResults(data.results || []);
      setQuery(finalQuery);
    } catch (error) {
      console.error("Search failed:", error);
      setRawResults([]);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // ── Show nothing while checking auth ────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-orange-400 text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-100 relative overflow-hidden">
      <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-orange-200/30 blur-3xl" />
      <div className="absolute top-40 right-0 h-80 w-80 rounded-full bg-pink-200/20 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-yellow-200/30 blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-6 py-10">

        {/* ── Top bar with user info + logout ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm text-gray-700 shadow-sm ring-1 ring-black/5 backdrop-blur">
              <span>🍴</span>
              <span>AI-powered food discovery</span>
            </div>
            <h1 className="mt-5 text-5xl font-bold tracking-tight text-gray-900">
              Food Agent
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-gray-600">
              Find nearby places to eat with smart filters and a cleaner, faster search experience.
            </p>
            <p className="mt-4 text-sm text-gray-500">
              {locationReady ? "📍 Location detected" : "📍 Getting your location..."}
            </p>
          </div>

          {/* User + logout */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs text-gray-500">Signed in as</span>
              <span className="text-sm font-medium text-gray-800 max-w-[180px] truncate">
                {user?.email ?? user?.phone ?? "User"}
              </span>
            </div>
            <div className="h-9 w-9 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-semibold uppercase">
              {(user?.email ?? user?.phone ?? "U")[0]}
            </div>
            <button
              onClick={handleLogout}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* ── Search panel ── */}
        <section className="rounded-3xl border border-white/60 bg-white/65 p-5 shadow-xl shadow-orange-100/50 backdrop-blur-xl">
          <div className="flex flex-wrap gap-3 mb-4">
            <select
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:ring-2 focus:ring-orange-300"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
            >
              <option value={1609}>1 mile</option>
              <option value={3218}>2 miles</option>
              <option value={8047}>5 miles</option>
            </select>

            <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm cursor-pointer">
              <input
                type="checkbox"
                checked={openOnly}
                onChange={(e) => setOpenOnly(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-gray-700">Open Now</span>
            </label>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <input
              className="flex-1 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-base shadow-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-orange-300"
              placeholder="Try: cheap healthy dinner, sushi, coffee, tacos..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            />
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-7 py-4 font-semibold text-white shadow-lg shadow-orange-200 transition hover:scale-[1.02] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {quickSuggestions.map((item) => (
              <button
                key={item}
                onClick={() => {
                  if (item.toLowerCase() === "open now") {
                    setOpenOnly(true);
                    return;
                  }
                  handleSearch(item);
                }}
                className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm text-orange-700 transition hover:bg-orange-100"
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {/* ── Results ── */}
        <section className="mt-8">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="animate-pulse rounded-2xl border border-white/60 bg-white/70 p-5 shadow-md">
                  <div className="h-5 w-2/3 rounded bg-gray-200" />
                  <div className="mt-3 h-4 w-4/5 rounded bg-gray-200" />
                  <div className="mt-4 h-4 w-1/3 rounded bg-gray-200" />
                  <div className="mt-5 h-4 w-24 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900">Top picks for you</h2>
                <span className="text-sm text-gray-500">
                  {results.length} result{results.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {results.map((r, i) => (
                  <div key={i} className="group rounded-2xl border border-white/60 bg-white/80 p-5 shadow-md backdrop-blur transition hover:-translate-y-1 hover:shadow-xl">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{r.name}</h3>
                        <p className="mt-1 text-sm text-gray-600">{r.address || "Address unavailable"}</p>
                      </div>
                      <div className="rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-700">
                        📍 {r.distance_miles ?? "N/A"} mi
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                      <span className="rounded-full bg-yellow-50 px-3 py-1 text-yellow-700">
                        ⭐ {r.rating ?? "N/A"}
                      </span>
                      <span className={`rounded-full px-3 py-1 font-medium ${
                        r.open_now === true ? "bg-green-50 text-green-700"
                        : r.open_now === false ? "bg-red-50 text-red-600"
                        : "bg-gray-100 text-gray-600"
                      }`}>
                        {r.open_now === true ? "Open now" : r.open_now === false ? "Closed" : "Hours unavailable"}
                      </span>
                    </div>
                    <a href={r.maps_url} target="_blank" rel="noreferrer"
                      className="mt-5 inline-block text-sm font-medium text-orange-600 transition hover:text-orange-700 hover:underline">
                      View on Maps →
                    </a>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-orange-200 bg-white/60 px-8 py-14 text-center shadow-sm backdrop-blur">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-3xl">🍜</div>
              <h2 className="text-2xl font-semibold text-gray-900">Ready to find something good?</h2>
              <p className="mt-2 text-gray-600">
                Search for cuisines, meals, or cravings like sushi, burgers, healthy lunch, or coffee nearby.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
