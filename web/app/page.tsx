"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    window.location.href = "/login";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50">
      <div className="text-orange-400 text-sm animate-pulse">Redirecting...</div>
    </div>
  );
}
