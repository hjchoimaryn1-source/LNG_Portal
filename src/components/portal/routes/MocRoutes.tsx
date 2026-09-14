// src/components/portal/routes/MocRoutes.tsx
//
// Phase 11c Stage 2-D — isolated route group for the NP-12 MOC module,
// mirroring EnvironmentRoutes.tsx's `{activeKey.startsWith('X') && (<Component />)}` pattern.

'use client';

import { SubProcessKey } from '../../../types/lng';
import MocModuleHub from '../../moc/MocModuleHub';

interface MocRoutesProps {
  activeKey: SubProcessKey;
}

export default function MocRoutes({ activeKey }: MocRoutesProps) {
  return <>{activeKey.startsWith('MOC') && <MocModuleHub />}</>;
}
