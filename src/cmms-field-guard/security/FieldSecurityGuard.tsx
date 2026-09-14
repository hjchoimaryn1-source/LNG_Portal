// src/cmms-field-guard/security/FieldSecurityGuard.tsx
"use client";

import { useFieldGuard } from '../core/FieldGuardContext';
import { DevToolsGuard } from './DevToolsGuard';
import { CaptureGuard } from './CaptureGuard';
import { WatermarkOverlay } from './WatermarkOverlay';

interface FieldSecurityGuardProps {
  ip: string;
}

// The only component intended for later mounting at the root layout.
// Not wired into any existing layout in this task — see Sub-stage D.
export function FieldSecurityGuard({ ip }: FieldSecurityGuardProps) {
  const { isField } = useFieldGuard();

  if (!isField) {
    return null;
  }

  return (
    <>
      <DevToolsGuard />
      <CaptureGuard />
      <WatermarkOverlay ip={ip} />
    </>
  );
}
