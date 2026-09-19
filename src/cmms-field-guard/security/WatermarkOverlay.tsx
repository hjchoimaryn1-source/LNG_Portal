// src/cmms-field-guard/security/WatermarkOverlay.tsx
"use client";

import { useEffect, useState } from 'react';

interface WatermarkOverlayProps {
  ip: string;
}

// ip is resolved server-side and passed in as a prop — this component
// never attempts client-side IP detection.

// Fixed, locale-independent English format ("YYYY-MM-DD HH:MM:SS") — no
// toLocaleString() (Korean-locale "오후/오전" on this host) and no locale arg
// left implicit, since the wall-clock value itself must never be computed at
// render time either way (see the null-initial-state comment below).
function formatTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function WatermarkOverlay({ ip }: WatermarkOverlayProps) {
  // null on both the server render and the client's first render (hydration
  // match) — the real clock value is only ever read inside useEffect, i.e.
  // strictly after mount, so server HTML and the first client paint are
  // byte-identical. Do NOT seed this from new Date() in useState's initializer
  // (that reintroduces the mismatch) and do NOT paper over it with
  // suppressHydrationWarning (that hides the symptom, not the cause).
  const [timestamp, setTimestamp] = useState<string | null>(null);

  useEffect(() => {
    setTimestamp(formatTimestamp(new Date()));
    const intervalId = window.setInterval(() => {
      setTimestamp(formatTimestamp(new Date()));
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div
      data-testid="field-guard-watermark"
      className="pointer-events-none fixed inset-0 z-[9997] flex items-end justify-end p-4 select-none"
      aria-hidden="true"
    >
      <span className="text-xs text-black/10 font-mono">
        {ip} · {timestamp ?? ''}
      </span>
    </div>
  );
}
