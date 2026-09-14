// src/components/portal/routes/MocRoutes.tsx
//
// Phase 11c Stage 2-D — isolated route group for the NP-12 MOC module,
// mirroring EnvironmentRoutes.tsx's `{activeKey.startsWith('X') && (<Component />)}` pattern.

'use client';

import { SubProcessKey } from '../../../types/lng';

interface MocRoutesProps {
  activeKey: SubProcessKey;
}

// NOTE: MocModuleHub is wired in Stage 2-E (requires MocDataContext, created
// in that same sub-stage) — this placeholder keeps Stage 2-D independently
// compilable/committable.
export default function MocRoutes({ activeKey }: MocRoutesProps) {
  return (
    <>
      {activeKey.startsWith('MOC') && (
        <div className="win-panel p-4 text-xs font-mono text-slate-600">MOC module hub pending (Stage 2-E).</div>
      )}
    </>
  );
}
