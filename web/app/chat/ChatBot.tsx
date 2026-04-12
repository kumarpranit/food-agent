"use client";

import { useEffect, useRef, useState } from "react";

type Restaurant = {
  name: string;
  address?: string;
  rating?: number;
  price_level?: number;
  open_now?: boolean | null;
  maps_url: string;
  place_id: string;
  distance_miles?: number;
  estimated_wait_minutes?: number | null;
};

type Message = {
  id: string;
  role: "user" | "bot";
  text: string;
  topPick?: Restaurant | null;
  alternatives?: Restaurant[];
  timestamp: Date;
};

function avgSpend(level?: number | null): string | null {
  switch (level) {
    case 0: return "Under $10";
    case 1: return "$10–$25";
    case 2: return "$25–$60";
    case 3: return "$60–$120";
    case 4: return "$120+";
    default: return null;
  }
}

const QUICK_PROMPTS = [
  "🍕 Pizza nearby",
  "☕ Coffee shops",
  "🍣 Sushi",
  "🌮 Mexican food",
  "🍺 Pubs & bars",
  "🥗 Healthy lunch",
];

export default function ChatBot({ lat, lng, onSearch }: { lat: number | null; lng: number | null; onSearch?: (q: string) => void }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      text: "Hey! 👋 What are you in the mood for today? Tell me what you're craving and I'll find the best spots near you.",
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [lastKeyword, setLastKeyword] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    if (lat === null || lng === null) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setTimeout(() => inputRef.current?.focus(), 0);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bot/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "super-secret-food-agent-key",
        },
        body: JSON.stringify({
          message: text.trim(),
          lat,
          lng,
          last_keyword: lastKeyword,
        }),
      });

      const data = await res.json();

      if (data.keyword_used) {
        setLastKeyword(data.keyword_used);
        onSearch?.(data.keyword_used);
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        text: data.reply,
        topPick: data.top_pick ?? null,
        alternatives: data.alternatives ?? [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);
      if (!open) setUnread((n) => n + 1);
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "bot",
          text: "Sorry, something went wrong. Please try again! 🙏",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Floating button ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 50,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #f97316, #f59e0b)",
          border: "none",
          boxShadow: "0 4px 20px rgba(249,115,22,0.45)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          transition: "transform 0.2s",
        }}
        title="Chat with Food Bot"
      >
        {open ? "✕" : "🍽️"}
        {!open && unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              background: "#ef4444",
              color: "#fff",
              borderRadius: "50%",
              width: 18,
              height: 18,
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {unread}
          </span>
        )}
      </button>

      {/* ── Chat panel ── */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 90,
            right: 24,
            zIndex: 50,
            width: 360,
            maxWidth: "calc(100vw - 32px)",
            height: 520,
            maxHeight: "calc(100vh - 120px)",
            borderRadius: 20,
            background: "#fff",
            boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #f97316, #f59e0b)",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              🍽️
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Food Bot</div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>
                {loading ? "Searching..." : "Ask me anything 🍴"}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px 12px 4px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {messages.map((msg) => (
              <div key={msg.id}>
                {/* Bubble */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "82%",
                      padding: "9px 13px",
                      borderRadius:
                        msg.role === "user"
                          ? "18px 18px 4px 18px"
                          : "18px 18px 18px 4px",
                      background:
                        msg.role === "user"
                          ? "linear-gradient(135deg, #f97316, #f59e0b)"
                          : "#f3f4f6",
                      color: msg.role === "user" ? "#fff" : "#111827",
                      fontSize: 13,
                      lineHeight: 1.5,
                      whiteSpace: "pre-line",
                    }}
                  >
                    {msg.text}
                  </div>
                </div>

                {/* Restaurant cards inside bot messages */}
                {msg.role === "bot" && msg.topPick && (
                  <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                    {/* Top pick */}
                    <RestaurantCard place={msg.topPick} isTop />
                    {/* Alternatives */}
                    {msg.alternatives?.map((r, i) => (
                      <RestaurantCard key={i} place={r} />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: "flex", gap: 4, padding: "8px 12px" }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#d1d5db",
                      animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
                    }}
                  />
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick prompts (show only at start) */}
          {messages.length <= 1 && (
            <div
              style={{
                padding: "4px 12px 8px",
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p.replace(/^[^ ]+ /, ""))}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 20,
                    border: "1px solid #fed7aa",
                    background: "#fff7ed",
                    color: "#c2410c",
                    fontSize: 12,
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div
            style={{
              padding: "10px 12px",
              borderTop: "1px solid #f3f4f6",
              display: "flex",
              gap: 8,
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="What are you craving?"
              style={{
                flex: 1,
                padding: "9px 14px",
                borderRadius: 20,
                border: "1.5px solid #e5e7eb",
                fontSize: 13,
                outline: "none",
                background: "#f9fafb",
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: input.trim()
                  ? "linear-gradient(135deg, #f97316, #f59e0b)"
                  : "#e5e7eb",
                border: "none",
                cursor: input.trim() ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                flexShrink: 0,
                transition: "background 0.2s",
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </>
  );
}

function RestaurantCard({ place, isTop }: { place: Restaurant; isTop?: boolean }) {
  return (
    <a
      href={place.maps_url}
      target="_blank"
      rel="noreferrer"
      style={{
        display: "block",
        borderRadius: 12,
        border: isTop ? "1.5px solid #fdba74" : "1px solid #e5e7eb",
        background: isTop ? "#fff7ed" : "#fff",
        padding: "10px 12px",
        textDecoration: "none",
        transition: "box-shadow 0.15s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: 4 }}>
            {isTop && <span>⭐</span>}
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {place.name}
            </span>
          </div>
          {place.address && (
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {place.address}
            </div>
          )}
        </div>
        <div style={{ fontSize: 11, color: "#ea580c", fontWeight: 600, flexShrink: 0 }}>
          {place.distance_miles ?? "?"} mi
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginTop: 7, flexWrap: "wrap" }}>
        {place.rating && (
          <span style={{ fontSize: 11, background: "#fefce8", color: "#a16207", padding: "2px 7px", borderRadius: 20, fontWeight: 500 }}>
            ⭐ {place.rating}
          </span>
        )}
        {avgSpend(place.price_level) && (
          <span style={{ fontSize: 11, background: "#f0fdf4", color: "#15803d", padding: "2px 7px", borderRadius: 20, fontWeight: 500 }}>
            💰 {avgSpend(place.price_level)}
          </span>
        )}
        <span style={{
          fontSize: 11,
          padding: "2px 7px",
          borderRadius: 20,
          fontWeight: 500,
          background: place.open_now === true ? "#f0fdf4" : place.open_now === false ? "#fef2f2" : "#f3f4f6",
          color: place.open_now === true ? "#15803d" : place.open_now === false ? "#dc2626" : "#6b7280",
        }}>
          {place.open_now === true ? "Open" : place.open_now === false ? "Closed" : "Hours unknown"}
        </span>
        {place.estimated_wait_minutes != null && (
          <span style={{ fontSize: 11, background: "#faf5ff", color: "#7e22ce", padding: "2px 7px", borderRadius: 20, fontWeight: 500 }}>
            ⏱ {place.estimated_wait_minutes} min
          </span>
        )}
      </div>
    </a>
  );
}
