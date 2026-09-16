// src/cmms-field-guard/security/FieldSecurityGuard.tsx
"use client";

import { useEffect } from 'react';
import { useFieldGuard } from '../core/FieldGuardContext';
import { DevToolsGuard } from './DevToolsGuard';
import { CaptureGuard } from './CaptureGuard';
import { WatermarkOverlay } from './WatermarkOverlay';
import { installFieldStorageGuard } from '../storage/StorageInterceptor';

interface FieldSecurityGuardProps {
  ip: string;
}

// Root-layout mount point (Sub-stage D). Composes the field deployment-mode
// deterrent layer — none of this is a security boundary, see each guard's
// own file for its specific bypass caveats.
export function FieldSecurityGuard({ ip }: FieldSecurityGuardProps) {
  const { isField } = useFieldGuard();

  useEffect(() => {
    if (isField) {
      installFieldStorageGuard();
    }
  }, [isField]);

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
