// src/components/locations/NiasRegasGasProcessView.tsx
//
// Nias sub-tab flattening (2026-09-16) — isolated top-level view for the
// "Regas & Gas Process" second-row tab. MONTHLY REPORT (CUSTODY_HEAT_SETTLEMENT)
// lives here per HJ's 2026-09-16 placement decision (its content spans ISO tank
// unloading + gas custody metering + PLTMG fuel-gas acceptance).
// PLTMG Power relocation (2026-09-18): PLTMG Power (formerly the
// PLTMG_POWER_OUTPUT first-level sub-tab here) moved out entirely to the
// "Electrical System" tab (see ElectricalSystemView.tsx) — it is no longer
// part of this view or its sub-tab row. `regasScope` remains omitted so
// NiasSubTabsNavPanel shows its (now 6-item) Regas & Gas Process row.
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
