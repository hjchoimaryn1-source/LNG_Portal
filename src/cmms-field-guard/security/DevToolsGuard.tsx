// src/cmms-field-guard/security/DevToolsGuard.tsx
"use client";

import { useEffect } from 'react';
import { useFieldGuard } from '../core/FieldGuardContext';

// UI-layer deterrent only, not a real security boundary — trivially
// bypassed via browser extensions, alternate browsers, or OS-level tools.
// Positioned as a first-line deterrent + friction layer, not a guarantee.
export function DevToolsGuard(): null {
  const { isField } = useFieldGuard();

  useEffect(() => {
    if (!isField) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toUpperCase();
      const isF12 = key === 'F12';
      const isDevToolsCombo = event.ctrlKey && event.shiftKey && (key === 'I' || key === 'J' || key === 'C');
      const isViewSource = event.ctrlKey && key === 'U';

      if (isF12 || isDevToolsCombo || isViewSource) {
        event.preventDefault();
      }
    };

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isField]);

  return null;
}
