// src/cmms-field-guard/core/FieldGuardContext.tsx
"use client";

import React, { createContext, useContext, useMemo } from 'react';
import type { FieldMode } from './fieldModeFlag';

interface FieldGuardValue {
  mode: FieldMode;
  isField: boolean;
}

const FieldGuardContext = createContext<FieldGuardValue | undefined>(undefined);

interface FieldGuardProviderProps {
  mode: FieldMode;
  children: React.ReactNode;
}

// mode is resolved server-side (see fieldModeFlag.ts) and passed in as a
// prop — this client component never calls resolveFieldMode() itself.
export function FieldGuardProvider({ mode, children }: FieldGuardProviderProps) {
  const value = useMemo<FieldGuardValue>(
    () => ({ mode, isField: mode === 'FIELD_CLIENT' }),
    [mode],
  );

  return <FieldGuardContext.Provider value={value}>{children}</FieldGuardContext.Provider>;
}

export function useFieldGuard(): FieldGuardValue {
  const ctx = useContext(FieldGuardContext);
  if (!ctx) {
    throw new Error('useFieldGuard must be used within a FieldGuardProvider');
  }
  return ctx;
}
