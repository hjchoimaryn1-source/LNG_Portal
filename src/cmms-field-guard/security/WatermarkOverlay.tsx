// src/cmms-field-guard/security/WatermarkOverlay.tsx
"use client";

import { useEffect, useState } from 'react';

interface WatermarkOverlayProps {
  ip: string;
}

// ip is resolved server-side and passed in as a prop — this component
// never attempts client-side IP detection.
export function WatermarkOverlay({ ip }: WatermarkOverlayProps) {
  const [timestamp, setTimestamp] = useState(() => new Date().toLocaleString());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTimestamp(new Date().toLocaleString());
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
        {ip} · {timestamp}
      </span>
    </div>
  );
}
