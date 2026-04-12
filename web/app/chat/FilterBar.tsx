"use client";

import { useEffect, useRef, useState } from "react";

export type Filters = {
  minPrice: number | null;   // 0–4
  maxPrice: number | null;   // 0–4
  minRating: number | null;  // 3.0 / 3.5 / 4.0 / 4.5
  cuisine: string | null;
  hours: "any" | "open_now" | "open_24h";
};

export const DEFAULT_FILTERS: Filters = {
  minPrice: null,
  maxPrice: null,
  minRating: null,
  cuisine: null,
  hours: "any",
};

const PRICE_OPTIONS = [
  { label: "Any price", min: null, max: null },
  { label: "$", min: 0, max: 1 },
  { label: "$$", min: 1, max: 2 },
  { label: "$$$", min: 2, max: 3 },
  { label: "$$$$", min: 3, max: 4 },
];

const RATING_OPTIONS = [
  { label: "Any rating", value: null },
  { label: "2.0+", value: 2.0 },
  { label: "2.5+", value: 2.5 },
  { label: "3.0+", value: 3.0 },
  { label: "3.5+", value: 3.5 },
  { label: "4.0+", value: 4.0 },
  { label: "4.5+", value: 4.5 },
];

const CUISINES = [
  "Any cuisine", "American", "Barbecue", "Chinese", "French",
  "Indian", "Italian", "Japanese", "Mediterranean", "Mexican",
  "Pizza", "Seafood", "Steak", "Sushi", "Thai", "Vietnamese",
];

const HOURS_OPTIONS: { label: string; value: Filters["hours"] }[] = [
  { label: "Any time", value: "any" },
  { label: "Open now", value: "open_now" },
  { label: "Open 24 hours", value: "open_24h" },
];

function activeCount(filters: Filters): number {
  let n = 0;
  if (filters.minPrice !== null || filters.maxPrice !== null) n++;
  if (filters.minRating !== null) n++;
  if (filters.cuisine !== null) n++;
  if (filters.hours !== "any") n++;
  return n;
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-sm font-medium whitespace-nowrap transition-all ${
        active
          ? "bg-orange-500 border-orange-500 text-white shadow-sm"
          : "bg-white border-gray-200 text-gray-700 hover:border-orange-300 hover:text-orange-600"
      }`}
    >
      {label}
      <span className="text-xs opacity-70">▾</span>
    </button>
  );
}

function Dropdown({
  anchorRef,
  onClose,
  children,
}: {
  anchorRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, anchorRef]);

  return (
    <div
      ref={ref}
      className="absolute top-full mt-2 left-0 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 min-w-[200px] overflow-hidden"
    >
      {children}
    </div>
  );
}

export default function FilterBar({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  const [open, setOpen] = useState<"price" | "rating" | "cuisine" | "hours" | "all" | null>(null);

  const priceRef = useRef<HTMLDivElement>(null!);
  const ratingRef = useRef<HTMLDivElement>(null!);
  const cuisineRef = useRef<HTMLDivElement>(null!);
  const hoursRef = useRef<HTMLDivElement>(null!);
  const allRef = useRef<HTMLDivElement>(null!);

  const toggle = (key: typeof open) => setOpen((o) => (o === key ? null : key));
  const close = () => setOpen(null);

  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  const priceLabel = () => {
    const opt = PRICE_OPTIONS.find(
      (o) => o.min === filters.minPrice && o.max === filters.maxPrice
    );
    return opt ? (opt.label === "Any price" ? "Price" : opt.label) : "Price";
  };

  const ratingLabel = () =>
    filters.minRating !== null ? `${filters.minRating}+ ⭐` : "Rating";

  const cuisineLabel = () => filters.cuisine ?? "Cuisine";

  const hoursLabel = () => {
    if (filters.hours === "open_now") return "Open now";
    if (filters.hours === "open_24h") return "Open 24h";
    return "Hours";
  };

  const count = activeCount(filters);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">

      {/* Price */}
      <div ref={priceRef} className="relative shrink-0">
        <Chip
          label={priceLabel()}
          active={filters.minPrice !== null || filters.maxPrice !== null}
          onClick={() => toggle("price")}
        />
        {open === "price" && (
          <Dropdown anchorRef={priceRef} onClose={close}>
            {PRICE_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => { set({ minPrice: opt.min, maxPrice: opt.max }); close(); }}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-orange-50 transition-colors ${
                  filters.minPrice === opt.min && filters.maxPrice === opt.max
                    ? "text-orange-600 font-semibold bg-orange-50"
                    : "text-gray-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </Dropdown>
        )}
      </div>

      {/* Rating */}
      <div ref={ratingRef} className="relative shrink-0">
        <Chip
          label={ratingLabel()}
          active={filters.minRating !== null}
          onClick={() => toggle("rating")}
        />
        {open === "rating" && (
          <Dropdown anchorRef={ratingRef} onClose={close}>
            {RATING_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => { set({ minRating: opt.value }); close(); }}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-orange-50 transition-colors ${
                  filters.minRating === opt.value
                    ? "text-orange-600 font-semibold bg-orange-50"
                    : "text-gray-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </Dropdown>
        )}
      </div>

      {/* Cuisine */}
      <div ref={cuisineRef} className="relative shrink-0">
        <Chip
          label={cuisineLabel()}
          active={filters.cuisine !== null}
          onClick={() => toggle("cuisine")}
        />
        {open === "cuisine" && (
          <Dropdown anchorRef={cuisineRef} onClose={close}>
            <div className="max-h-64 overflow-y-auto">
              {CUISINES.map((c) => (
                <button
                  key={c}
                  onClick={() => { set({ cuisine: c === "Any cuisine" ? null : c }); close(); }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-orange-50 transition-colors ${
                    (filters.cuisine === null && c === "Any cuisine") || filters.cuisine === c
                      ? "text-orange-600 font-semibold bg-orange-50"
                      : "text-gray-700"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </Dropdown>
        )}
      </div>

      {/* Hours */}
      <div ref={hoursRef} className="relative shrink-0">
        <Chip
          label={hoursLabel()}
          active={filters.hours !== "any"}
          onClick={() => toggle("hours")}
        />
        {open === "hours" && (
          <Dropdown anchorRef={hoursRef} onClose={close}>
            {HOURS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { set({ hours: opt.value }); close(); }}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-orange-50 transition-colors flex items-center gap-2 ${
                  filters.hours === opt.value
                    ? "text-orange-600 font-semibold bg-orange-50"
                    : "text-gray-700"
                }`}
              >
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  filters.hours === opt.value ? "border-orange-500" : "border-gray-300"
                }`}>
                  {filters.hours === opt.value && (
                    <span className="w-2 h-2 rounded-full bg-orange-500 block" />
                  )}
                </span>
                {opt.label}
              </button>
            ))}
          </Dropdown>
        )}
      </div>

      {/* All filters */}
      <div ref={allRef} className="relative shrink-0">
        <button
          onClick={() => toggle("all")}
          className={`flex items-center gap-2 px-3 py-2 rounded-2xl border text-sm font-medium transition-all ${
            count > 0
              ? "bg-orange-500 border-orange-500 text-white"
              : "bg-white border-gray-200 text-gray-700 hover:border-orange-300"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
            <circle cx="9" cy="6" r="2" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="2" fill="currentColor" stroke="none"/>
          </svg>
          All filters{count > 0 ? ` (${count})` : ""}
        </button>

        {open === "all" && (
          <Dropdown anchorRef={allRef} onClose={close}>
            <div className="p-4 w-72">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">All filters</h3>
                <button
                  onClick={() => { onChange(DEFAULT_FILTERS); close(); }}
                  className="text-xs text-orange-500 hover:text-orange-600 font-medium"
                >
                  Clear all
                </button>
              </div>

              {/* Price section */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Price</p>
                <div className="flex flex-wrap gap-2">
                  {PRICE_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => set({ minPrice: opt.min, maxPrice: opt.max })}
                      className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${
                        filters.minPrice === opt.min && filters.maxPrice === opt.max
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "border-gray-200 text-gray-600 hover:border-orange-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating section */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Rating at least</p>
                <div className="flex flex-wrap gap-2">
                  {RATING_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => set({ minRating: opt.value })}
                      className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${
                        filters.minRating === opt.value
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "border-gray-200 text-gray-600 hover:border-orange-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hours section */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Hours</p>
                <div className="flex flex-wrap gap-2">
                  {HOURS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => set({ hours: opt.value })}
                      className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${
                        filters.hours === opt.value
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "border-gray-200 text-gray-600 hover:border-orange-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cuisine section */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cuisine</p>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                  {CUISINES.map((c) => (
                    <button
                      key={c}
                      onClick={() => set({ cuisine: c === "Any cuisine" ? null : c })}
                      className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${
                        (filters.cuisine === null && c === "Any cuisine") || filters.cuisine === c
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "border-gray-200 text-gray-600 hover:border-orange-300"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={close}
                className="mt-4 w-full py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-all"
              >
                Apply
              </button>
            </div>
          </Dropdown>
        )}
      </div>
    </div>
  );
}
