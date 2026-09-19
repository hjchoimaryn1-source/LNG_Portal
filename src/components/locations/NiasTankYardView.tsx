// src/components/locations/NiasTankYardView.tsx
//
// Nias sub-tab flattening (2026-09-16) — isolated top-level view for the
// former "Nias Regas Unit > ISO Tank Management" toggle branch. Wraps
// NiasTerminalView (unmodified widgets/hooks) locked to the ISO_TANK_MGMT
// domain with its internal domain switcher hidden, since domain selection
// now happens one level up via the LNG-Process sub-tab row.
"use client";

import React from 'react';
import NiasTerminalView from './NiasTerminalView';

interface NiasTankYardViewProps {
  initialSubTab?: string;
}

export default function NiasTankYardView({ initialSubTab = 'TANK_OVERVIEW' }: NiasTankYardViewProps) {
  return (
    <NiasTerminalView
      initialDomain="ISO_TANK_MGMT"
      initialSubTab={initialSubTab}
      hideDomainSwitcher
    />
  );
}
