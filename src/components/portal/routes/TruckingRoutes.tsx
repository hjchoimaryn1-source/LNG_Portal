// src/components/portal/routes/TruckingRoutes.tsx
//
// Phase 11a Stage 2-C — isolated route group for the NP-03 Trucking module,
// mirroring the LngProcessRoutes.tsx `{activeKey === 'X' && (<Component />)}` pattern.

'use client';

import { SubProcessKey } from '../../../types/lng';
import TruckingModuleHub from '../../trucking/TruckingModuleHub';

interface TruckingRoutesProps {
  activeKey: SubProcessKey;
  handleSelectSubProcess: (key: SubProcessKey, focusId?: string) => void;
}

export default function TruckingRoutes({ activeKey, handleSelectSubProcess }: TruckingRoutesProps) {
  return (
    <>
      {activeKey.startsWith('TRUCKING') && (
        <TruckingModuleHub onOpenSopReference={(target) => handleSelectSubProcess('SAFETY_SOP_REFERENCE', target)} />
      )}
    </>
  );
}
