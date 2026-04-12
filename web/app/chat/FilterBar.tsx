"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type Filters = {
  minPrice: number | null;
  maxPrice: number | null;
  minRating: number | null;
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
  { label: "$ · Budget", min: 0, max: 1 },
  { label: "$$ · Moderate", min: 1, max: 2 },
  { label: "$$$ · Upscale", min: 2, max: 3 },
  { label: "$$$$ · Fine Dining", min: 3, max: 4 },
];

const RATING_OPTIONS = [
  { label: "Any rating", value: null },
  { label: "2.0+ ⭐", value: 2.0 },
  { label: "2.5+ ⭐", value: 2.5 },
  { label: "3.0+ ⭐", value: 3.0 },
  { label: "3.5+ ⭐", value: 3.5 },
  { label: "4.0+ ⭐", value: 4.0 },
  { label: "4.5+ ⭐", value: 4.5 },
];

const CUISINES = [
  "Any cuisine", "American", "Barbecue", "Chinese", "French",
  "Indian", "Italian", "Japanese", "Mediterranean", "Mexican",
  "Pizza", "Seafood", "Steak", "Sushi", "Thai", "Vietnamese",
];

const HOURS_OPTIONS: { label: string; value: Filters["hours"] }[] = [
  { label: "Any time", value: "any" },
  { label: "Open now 🟢", value: "open_now" },
  { label: "Open 24 hours", value: "open_24h" },
];

function activeCount(f: Filters) {
  let n = 0;
  if (f.minPrice !== null || f.maxPrice !== null) n++;
  if (f.minRating !== null) n++;
  if (f.cuisine !== null) n++;
  if (f.hours !== "any") n++;
  return n;
}

// ── Portal dropdown — renders at document.body so overflow never clips it ──
function PortalDropdown({
  anchorEl,
  onClose,
  children,
  wide,
}: {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    setPos({ top: rect.bottom + window.scrollY + 6, left: rect.left + window.scrollX });
  }, [anchorEl]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        anchorEl && !anchorEl.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    // Small delay so the opening click doesn't immediately close the dropdown
    const timer = setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => { clearTimeout(timer); document.removeEventListener("mousedown", handler); };
  }, [onClose, anchorEl]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: pos.top,
        left: pos.left,
        zIndex: 9999,
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 8px 30px rgba(0,0,0,0.14)",
        border: "1px solid #f3f4f6",
        minWidth: wide ? 280 : 200,
        overflow: "hidden",
      }}
    >
      {children}
    </div>,
    document.body
  );
}

function Chip({
  label,
  active,
  onClick,
  btnRef,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  btnRef?: React.RefObject<HTMLButtonElement>;
}) {
  return (
    <button
      ref={btnRef}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "8px 14px", borderRadius: 20,
        border: active ? "1.5px solid #f97316" : "1.5px solid #e5e7eb",
        background: active ? "#f97316" : "#fff",
        color: active ? "#fff" : "#374151",
        fontSize: 13, fontWeight: 500, cursor: "pointer",
        whiteSpace: "nowrap", transition: "all 0.15s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
      }}
    >
      {label} <span style={{ fontSize: 10, opacity: 0.7 }}>▾</span>
    </button>
  );
}

function MenuItem({
  label, selected, onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", textAlign: "left",
        padding: "11px 16px", fontSize: 13,
        background: selected ? "#fff7ed" : "transparent",
        color: selected ? "#ea580c" : "#374151",
        fontWeight: selected ? 600 : 400,
        border: "none", cursor: "pointer",
        transition: "background 0.1s",
      }}
      onMouseEnter={e => { if (!selected) (e.target as HTMLElement).style.background = "#f9fafb"; }}
      onMouseLeave={e => { if (!selected) (e.target as HTMLElement).style.background = "transparent"; }}
    >
      {label}
    </button>
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
  const [mounted, setMounted] = useState(false);

  const priceBtn = useRef<HTMLButtonElement>(null!);
  const ratingBtn = useRef<HTMLButtonElement>(null!);
  const cuisineBtn = useRef<HTMLButtonElement>(null!);
  const hoursBtn = useRef<HTMLButtonElement>(null!);
  const allBtn = useRef<HTMLButtonElement>(null!);

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => setOpen(null), []);
  const toggle = (key: typeof open) => setOpen(o => o === key ? null : key);
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  const priceLabel = PRICE_OPTIONS.find(o => o.min === filters.minPrice && o.max === filters.maxPrice)?.label ?? "Price";
  const finalPriceLabel = priceLabel === "Any price" ? "Price" : priceLabel.split(" ·")[0];
  const ratingLabel = filters.minRating !== null ? `${filters.minRating}+ ⭐` : "Rating";
  const cuisineLabel = filters.cuisine ?? "Cuisine";
  const hoursLabel = filters.hours === "open_now" ? "Open now" : filters.hours === "open_24h" ? "Open 24h" : "Hours";
  const count = activeCount(filters);

  const anchor = (key: typeof open) => {
    const map = { price: priceBtn, rating: ratingBtn, cuisine: cuisineBtn, hours: hoursBtn, all: allBtn };
    return key ? map[key]?.current : null;
  };

  if (!mounted) return null;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Chip btnRef={priceBtn} label={finalPriceLabel} active={filters.minPrice !== null || filters.maxPrice !== null} onClick={() => toggle("price")} />
        <Chip btnRef={ratingBtn} label={ratingLabel} active={filters.minRating !== null} onClick={() => toggle("rating")} />
        <Chip btnRef={cuisineBtn} label={cuisineLabel} active={filters.cuisine !== null} onClick={() => toggle("cuisine")} />
        <Chip btnRef={hoursBtn} label={hoursLabel} active={filters.hours !== "any"} onClick={() => toggle("hours")} />

        {/* All filters */}
        <button
          ref={allBtn}
          onClick={() => toggle("all")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 20,
            border: count > 0 ? "1.5px solid #f97316" : "1.5px solid #e5e7eb",
            background: count > 0 ? "#f97316" : "#fff",
            color: count > 0 ? "#fff" : "#374151",
            fontSize: 13, fontWeight: 500, cursor: "pointer",
            boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
            transition: "all 0.15s",
          }}
        >
          ☰ All filters{count > 0 ? ` (${count})` : ""}
        </button>
      </div>

      {/* ── Price dropdown ── */}
      {open === "price" && (
        <PortalDropdown anchorEl={anchor("price")} onClose={close}>
          {PRICE_OPTIONS.map(opt => (
            <MenuItem key={opt.label} label={opt.label}
              selected={filters.minPrice === opt.min && filters.maxPrice === opt.max}
              onClick={() => { set({ minPrice: opt.min, maxPrice: opt.max }); close(); }} />
          ))}
        </PortalDropdown>
      )}

      {/* ── Rating dropdown ── */}
      {open === "rating" && (
        <PortalDropdown anchorEl={anchor("rating")} onClose={close}>
          {RATING_OPTIONS.map(opt => (
            <MenuItem key={opt.label} label={opt.label}
              selected={filters.minRating === opt.value}
              onClick={() => { set({ minRating: opt.value }); close(); }} />
          ))}
        </PortalDropdown>
      )}

      {/* ── Cuisine dropdown ── */}
      {open === "cuisine" && (
        <PortalDropdown anchorEl={anchor("cuisine")} onClose={close}>
          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {CUISINES.map(c => (
              <MenuItem key={c} label={c}
                selected={(filters.cuisine === null && c === "Any cuisine") || filters.cuisine === c}
                onClick={() => { set({ cuisine: c === "Any cuisine" ? null : c }); close(); }} />
            ))}
          </div>
        </PortalDropdown>
      )}

      {/* ── Hours dropdown ── */}
      {open === "hours" && (
        <PortalDropdown anchorEl={anchor("hours")} onClose={close}>
          {HOURS_OPTIONS.map(opt => (
            <MenuItem key={opt.value} label={opt.label}
              selected={filters.hours === opt.value}
              onClick={() => { set({ hours: opt.value }); close(); }} />
          ))}
        </PortalDropdown>
      )}

      {/* ── All filters panel ── */}
      {open === "all" && (
        <PortalDropdown anchorEl={anchor("all")} onClose={close} wide>
          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>All filters</span>
              <button onClick={() => { onChange(DEFAULT_FILTERS); close(); }}
                style={{ fontSize: 12, color: "#f97316", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
                Clear all
              </button>
            </div>

            {[
              { title: "Price", opts: PRICE_OPTIONS.map(o => ({ label: o.label, active: filters.minPrice === o.min && filters.maxPrice === o.max, onClick: () => set({ minPrice: o.min, maxPrice: o.max }) })) },
              { title: "Rating", opts: RATING_OPTIONS.map(o => ({ label: o.label, active: filters.minRating === o.value, onClick: () => set({ minRating: o.value }) })) },
              { title: "Hours", opts: HOURS_OPTIONS.map(o => ({ label: o.label, active: filters.hours === o.value, onClick: () => set({ hours: o.value }) })) },
            ].map(section => (
              <div key={section.title} style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{section.title}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {section.opts.map(opt => (
                    <button key={opt.label} onClick={opt.onClick}
                      style={{ padding: "6px 12px", borderRadius: 12, border: opt.active ? "1.5px solid #f97316" : "1.5px solid #e5e7eb", background: opt.active ? "#f97316" : "#fff", color: opt.active ? "#fff" : "#374151", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Cuisine</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 120, overflowY: "auto" }}>
                {CUISINES.map(c => (
                  <button key={c} onClick={() => set({ cuisine: c === "Any cuisine" ? null : c })}
                    style={{ padding: "6px 12px", borderRadius: 12, border: (filters.cuisine === null && c === "Any cuisine") || filters.cuisine === c ? "1.5px solid #f97316" : "1.5px solid #e5e7eb", background: (filters.cuisine === null && c === "Any cuisine") || filters.cuisine === c ? "#f97316" : "#fff", color: (filters.cuisine === null && c === "Any cuisine") || filters.cuisine === c ? "#fff" : "#374151", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={close}
              style={{ width: "100%", padding: "10px", borderRadius: 12, background: "#f97316", border: "none", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              Apply
            </button>
          </div>
        </PortalDropdown>
      )}
    </>
  );
}
