"use client";

import { useEffect, useState } from "react";

type Restaurant = {
  name: string;
  address?: string;
  rating?: number;
  open_now?: boolean | null;
  maps_url: string;
  distance_miles?: number;
};

export default function ChatPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Restaurant[]>([]);
  const [lat, setLat] = useState<number | null>(34.0522);
  const [lng, setLng] = useState<number | null>(-118.2437);
  const [locationReady, setLocationReady] = useState(false);
  const [radius, setRadius] = useState(3218);
  const [openOnly, setOpenOnly] = useState(false);

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

  const handleSearch = async () => {
    if (!lat || !lng) return;

    const res = await fetch("http://127.0.0.1:8000/restaurants/nearby", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lat, lng, radius, keyword: query }),
    });

    const data = await res.json();

    let filtered = data.results || [];
    if (openOnly) filtered = filtered.filter((r: Restaurant) => r.open_now);

    setResults(filtered);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <h1 className="text-4xl font-bold mb-2">🍽️ Food Agent</h1>
        <p className="text-gray-500 mb-6">
          {locationReady
            ? `📍 ${lat?.toFixed(3)}, ${lng?.toFixed(3)}`
            : "Getting your location..."}
        </p>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            className="border rounded-lg px-3 py-2 shadow-sm"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
          >
            <option value={1609}>1 mile</option>
            <option value={3218}>2 miles</option>
            <option value={8047}>5 miles</option>
          </select>

          <label className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border">
            <input
              type="checkbox"
              checked={openOnly}
              onChange={(e) => setOpenOnly(e.target.checked)}
            />
            Open Now
          </label>
        </div>

        {/* Search */}
        <div className="flex gap-2 mb-8">
          <input
            className="flex-1 border rounded-xl px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="What do you want to eat?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={handleSearch}
            className="bg-black text-white px-6 py-3 rounded-xl hover:opacity-90 transition"
          >
            Search
          </button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {results.map((r, i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-xl shadow hover:shadow-md transition"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">{r.name}</h2>
                <span className="text-sm text-gray-500">
                  📍 {r.distance_miles ?? "N/A"} mi
                </span>
              </div>

              <p className="text-gray-600 text-sm">{r.address}</p>

              <div className="flex items-center gap-4 mt-2 text-sm">
                <span>⭐ {r.rating ?? "N/A"}</span>
                <span
                  className={
                    r.open_now
                      ? "text-green-600 font-medium"
                      : "text-red-500 font-medium"
                  }
                >
                  {r.open_now ? "Open" : "Closed"}
                </span>
              </div>

              <a
                href={r.maps_url}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-3 text-blue-600 text-sm hover:underline"
              >
                View on Maps →
              </a>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}