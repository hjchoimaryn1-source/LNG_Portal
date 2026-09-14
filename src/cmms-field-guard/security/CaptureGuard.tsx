// src/cmms-field-guard/security/CaptureGuard.tsx
"use client";

import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { useFieldGuard } from '../core/FieldGuardContext';

export function CaptureGuard(): ReactElement | null {
  const { isField } = useFieldGuard();
  const [isBlacked, setIsBlacked] = useState(false);

  useEffect(() => {
    if (!isField) {
      return;
    }

    // PrintScreen cannot be reliably preventDefault'd in most browsers —
    // some browsers fire no keydown event at all for it. This handler is
    // best-effort by nature of the browser API surface, not an implementation gap.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'PrintScreen') {
        event.preventDefault();
      }
    };

    const handleBlur = () => setIsBlacked(true);
    const handleFocus = () => setIsBlacked(false);
    const handleVisibilityChange = () => {
      setIsBlacked(document.visibilityState !== 'visible');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isField]);

  if (!isField || !isBlacked) {
    return null;
  }

  return (
    <div
      data-testid="capture-guard-overlay"
      className="fixed inset-0 z-[9998] bg-black backdrop-blur-2xl"
      aria-hidden="true"
    />
  );
}
