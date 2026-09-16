// src/components/locations/NiasRegasGasProcessView.tsx
//
// Nias sub-tab flattening (2026-09-16) — isolated top-level view for the
// "Regas & Gas Process" second-row tab. MONTHLY REPORT (CUSTODY_HEAT_SETTLEMENT)
// lives here per HJ's 2026-09-16 placement decision (its content spans ISO tank
// unloading + gas custody metering + PLTMG fuel-gas acceptance, so it does
// not belong exclusively under PLTMG Power).
// PLTMG Power fold-back (2026-09-16): PLTMG Power was briefly split into its
// own second-row tab (see NiasPltmgPowerView.tsx) then folded back in as a
// first-level sub-tab here. `regasScope` is intentionally omitted (not
// "GAS_PROCESS") so NiasSubTabsNavPanel shows all 5 first-level buttons —
// GAS PROCESS / GAS METERING - LOG / GAS METERING (LEDGER) / PLTMG POWER /
// MONTHLY REPORT — instead of filtering PLTMG POWER out.
"use client";

import React from 'react';
import NiasTerminalView from './NiasTerminalView';

interface NiasRegasGasProcessViewProps {
  initialSubTab?: string;
}

export default function NiasRegasGasProcessView({
  initialSubTab = 'GAS_PROCESS_TELEMETRY',
}: NiasRegasGasProcessViewProps) {
  return (
    <NiasTerminalView
      initialDomain="REGAS_SYSTEM"
      initialSubTab={initialSubTab}
      hideDomainSwitcher
    />
  );
}
