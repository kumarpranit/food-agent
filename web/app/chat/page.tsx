"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Restaurant = {
  name: string;
  address?: string;
  rating?: number;
  open_now?: boolean | null;
  maps_url: string;
  distance_miles?: number;
  match_reasons?: string[];
  score?: number;
};

const quickSuggestions = [
  "Pizza nearby",
  "Healthy lunch",
  "Cheap dinner",
  "Mexican food",
  "Coffee shops",
  "Open now",
];

function scoreRestaurant(r: Restaurant) {
  let score = 0;
  const reasons: string[] = [];

  if (r.open_now === true) {
    score += 3;
    reasons.push("Open now");
  }

  const rating = r.rating ?? 0;
  if (rating >= 4.5) {
    score += 3;
    reasons.push("Highly rated");
  } else if (rating >= 4.0) {
    score += 2;
    reasons.push("Good rating");
  }

  const distance = r.distance_miles ?? 999;
  if (distance <= 1) {
    score += 3;
    reasons.push("Very close");
  } else if (distance <= 2) {
    score += 2;
    reasons.push("Nearby");
  } else if (distance <= 5) {
    score += 1;
    reasons.push("Within range");
  }

  return {
    ...r,
    score,
    match_reasons: r.match_reasons?.length ? r.match_reasons : reasons,
  };
}

function buildRecommendation(items: Restaurant[]) {
  const scored = items.map(scoreRestaurant).sort((a, b) => {
    const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
    if (scoreDiff !== 0) return scoreDiff;

    const ratingA = a.rating ?? 0;
    const ratingB = b.rating ?? 0;
    if (ratingB !== ratingA) return ratingB - ratingA;

    const distA = a.distance_miles ?? 999;
    const distB = b.distance_miles ?? 999;
    return distA - distB;
  });

  return {
    topPick: scored[0] ?? null,
    alternatives: scored.slice(1, 3),
    summary:
      scored.length > 0
        ? "Best match based on rating, distance, and availability."
        : "",
  };
}

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
  const [topPick, setTopPick] = useState<Restaurant | null>(null);
  const [alternatives, setAlternatives] = useState<Restaurant[]>([]);
  const [summary, setSummary] = useState("");

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

  const filteredResults = useMemo(() => {
    if (!openOnly) return rawResults;
    return rawResults.filter((r) => r.open_now !== false);
  }, [rawResults, openOnly]);

  useEffect(() => {
    const built = buildRecommendation(filteredResults);
    setTopPick(built.topPick);
    setAlternatives(built.alternatives);

    if (filteredResults.length === 0) {
      setSummary("");
    } else if (openOnly) {
      setSummary("Best open options based on rating, distance, and availability.");
    } else {
      setSummary(built.summary);
    }
  }, [filteredResults, openOnly]);

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

      const results: Restaurant[] = Array.isArray(data.results) ? data.results : [];
      setRawResults(results);

      if (data.top_pick || data.alternatives || data.summary) {
        const backendTopPick: Restaurant | null = data.top_pick ?? null;
        const backendAlternatives: Restaurant[] = Array.isArray(data.alternatives)
          ? data.alternatives
          : [];
        const backendSummary: string = data.summary ?? "";

        if (!openOnly) {
          setTopPick(backendTopPick);
          setAlternatives(backendAlternatives);
          setSummary(backendSummary);
        }
      }

      setQuery(finalQuery);
    } catch (error) {
      console.error("Search failed:", error);
      setRawResults([]);
      setTopPick(null);
      setAlternatives([]);
      setSummary("");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSuggestion = (item: string) => {
    if (item.toLowerCase() === "open now") {
      setOpenOnly(true);
      if (query.trim()) {
        handleSearch(query);
      } else {
        handleSearch("Open restaurants");
      }
      return;
    }

    setQuery(item);
    handleSearch(item);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

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
              Find nearby places to eat with smarter recommendations, not just a long list.
            </p>
            <p className="mt-4 text-sm text-gray-500">
              {locationReady ? "📍 Location detected" : "📍 Getting your location..."}
            </p>
          </div>

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
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
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
                onClick={() => handleQuickSuggestion(item)}
                className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm text-orange-700 transition hover:bg-orange-100"
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="animate-pulse rounded-2xl border border-white/60 bg-white/70 p-5 shadow-md"
                >
                  <div className="h-5 w-2/3 rounded bg-gray-200" />
                  <div className="mt-3 h-4 w-4/5 rounded bg-gray-200" />
                  <div className="mt-4 h-4 w-1/3 rounded bg-gray-200" />
                  <div className="mt-5 h-4 w-24 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : topPick ? (
            <>
              <div className="mb-6 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-orange-800">
                🤖 {summary}
              </div>

              <div className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    ⭐ Best Pick For You
                  </h2>
                  <span className="text-sm text-gray-500">
                    {filteredResults.length} match{filteredResults.length !== 1 ? "es" : ""}
                  </span>
                </div>

                <div className="rounded-3xl border-2 border-orange-300 bg-white p-6 shadow-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{topPick.name}</h3>
                      <p className="mt-1 text-gray-600">
                        {topPick.address || "Address unavailable"}
                      </p>
                    </div>

                    <div className="rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-700">
                      📍 {topPick.distance_miles ?? "N/A"} mi
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                    <span className="rounded-full bg-yellow-50 px-3 py-1 text-yellow-700">
                      ⭐ {topPick.rating ?? "N/A"}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 font-medium ${
                        topPick.open_now === true
                          ? "bg-green-50 text-green-700"
                          : topPick.open_now === false
                          ? "bg-red-50 text-red-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {topPick.open_now === true
                        ? "Open now"
                        : topPick.open_now === false
                        ? "Closed"
                        : "Hours unavailable"}
                    </span>
                    {typeof topPick.score === "number" && (
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-orange-700">
                        Match score: {topPick.score}
                      </span>
                    )}
                  </div>

                  {topPick.match_reasons && topPick.match_reasons.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {topPick.match_reasons.map((reason, i) => (
                        <span
                          key={`${reason}-${i}`}
                          className="rounded-full bg-orange-100 px-3 py-1 text-xs text-orange-700"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}

                  <a
                    href={topPick.maps_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-block text-sm font-medium text-orange-600 transition hover:text-orange-700 hover:underline"
                  >
                    View on Maps →
                  </a>
                </div>
              </div>

              {alternatives.length > 0 && (
                <div>
                  <h2 className="mb-4 text-xl font-semibold text-gray-900">
                    Other good options
                  </h2>

                  <div className="grid gap-5 md:grid-cols-2">
                    {alternatives.map((r, i) => (
                      <div
                        key={`${r.name}-${i}`}
                        className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-md backdrop-blur transition hover:-translate-y-1 hover:shadow-xl"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{r.name}</h3>
                            <p className="mt-1 text-sm text-gray-600">
                              {r.address || "Address unavailable"}
                            </p>
                          </div>
                          <div className="rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-700">
                            📍 {r.distance_miles ?? "N/A"} mi
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                          <span className="rounded-full bg-yellow-50 px-3 py-1 text-yellow-700">
                            ⭐ {r.rating ?? "N/A"}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 font-medium ${
                              r.open_now === true
                                ? "bg-green-50 text-green-700"
                                : r.open_now === false
                                ? "bg-red-50 text-red-600"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {r.open_now === true
                              ? "Open now"
                              : r.open_now === false
                              ? "Closed"
                              : "Hours unavailable"}
                          </span>
                        </div>

                        {r.match_reasons && r.match_reasons.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {r.match_reasons.map((reason, idx) => (
                              <span
                                key={`${reason}-${idx}`}
                                className="rounded-full bg-orange-100 px-3 py-1 text-xs text-orange-700"
                              >
                                {reason}
                              </span>
                            ))}
                          </div>
                        )}

                        <a
                          href={r.maps_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-5 inline-block text-sm font-medium text-orange-600 transition hover:text-orange-700 hover:underline"
                        >
                          View on Maps →
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-orange-200 bg-white/60 px-8 py-14 text-center shadow-sm backdrop-blur">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-3xl">
                🍜
              </div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Ready to find something good?
              </h2>
              <p className="mt-2 text-gray-600">
                Search for cuisines, meals, or cravings like sushi, burgers, healthy
                lunch, or coffee nearby.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}