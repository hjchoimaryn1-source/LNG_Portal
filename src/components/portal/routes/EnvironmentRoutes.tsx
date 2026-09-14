// src/components/portal/routes/EnvironmentRoutes.tsx
//
// Phase 11b Stage 2-E — isolated route group for the NP-10 Environment module,
// mirroring TruckingRoutes.tsx's `{activeKey === 'X' && (<Component />)}` pattern.

'use client';

import { SubProcessKey } from '../../../types/lng';
import EnvironmentModuleHub from '../../environment/EnvironmentModuleHub';

interface EnvironmentRoutesProps {
  activeKey: SubProcessKey;
}

export default function EnvironmentRoutes({ activeKey }: EnvironmentRoutesProps) {
  return <>{activeKey.startsWith('ENVIRONMENT') && <EnvironmentModuleHub />}</>;
}
