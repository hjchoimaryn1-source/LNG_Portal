// src/cmms-field-guard/security/CaptureGuard.tsx
"use client";

import { useEffect } from 'react';
import { useFieldGuard } from '../core/FieldGuardContext';

// UI-layer deterrent only, not a real security boundary — trivially
// bypassed via browser extensions, alternate browsers, or OS-level tools.
// blur/focus blackout removed (Sub-stage D): it interfered with normal
// worker window/tab switching, so this deterrent is PrintScreen-only now.
export function CaptureGuard(): null {
  const { isField } = useFieldGuard();

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

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isField]);

  return null;
}
