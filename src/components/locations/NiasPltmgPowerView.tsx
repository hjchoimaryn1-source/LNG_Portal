// src/components/locations/NiasPltmgPowerView.tsx
//
// Nias sub-tab flattening (2026-09-16) — isolated top-level view for the
// power slice of the former "Nias Regas Unit > Regas & Power" toggle
// branch. Single sub-tab (PLTMG POWER); see NiasRegasGasProcessView.tsx for
// the gas-process slice.
"use client";

import React from 'react';
import NiasTerminalView from './NiasTerminalView';

export default function NiasPltmgPowerView() {
  return (
    <NiasTerminalView
      initialDomain="REGAS_SYSTEM"
      initialSubTab="PLTMG_POWER_OUTPUT"
      hideDomainSwitcher
      regasScope="POWER"
    />
  );
}
