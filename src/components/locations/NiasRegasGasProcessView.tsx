// src/components/locations/NiasRegasGasProcessView.tsx
//
// Nias sub-tab flattening (2026-09-16) — isolated top-level view for the
// gas-process slice of the former "Nias Regas Unit > Regas & Power" toggle
// branch (PLTMG Power was split out into its own tab — see
// NiasPltmgPowerView.tsx). MONTHLY REPORT (CUSTODY_HEAT_SETTLEMENT) lives
// here per HJ's 2026-09-16 placement decision (its content spans ISO tank
// unloading + gas custody metering + PLTMG fuel-gas acceptance, so it does
// not belong exclusively under PLTMG Power).
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
      regasScope="GAS_PROCESS"
    />
  );
}
