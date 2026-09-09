// src/components/manpower/modals/ptw/GasTestGateSection.tsx
"use client";

import React from 'react';
import { PTWType, PTWPermit } from '../../../../types/lng';
import { isGasMeasurementApplicable, validatePTWGasSafety } from '../../../../data/ptwMasterData';

export interface GasTestGateSectionProps {
  type: PTWType;
  lelPercent: number;
  o2Percent: number;
  h2sPpm: number;
  onLelChange: (value: number) => void;
  onO2Change: (value: number) => void;
  onH2sChange: (value: number) => void;
}

// Cargo Handling has its own multi-point AGT gate (T-201..T-204, NP08-15) —
// see src/data/ptwCargoHandlingValidators.ts. This section never applies to
// it, to avoid duplicating that gate here.
function isSectionApplicable(type: PTWType): boolean {
  return isGasMeasurementApplicable(type) && type !== 'CARGO_HANDLING';
}

export default function GasTestGateSection({
  type,
  lelPercent,
  o2Percent,
  h2sPpm,
  onLelChange,
  onO2Change,
  onH2sChange,
}: GasTestGateSectionProps) {
  if (!isSectionApplicable(type)) {
    return null;
  }

  const gasReadings: PTWPermit['gasReadings'] = {
    lelPercent,
    o2Percent,
    h2sPpm,
    coPpm: 0,
    testedAt: '',
    isSafeForWork: false,
  };
  const gateResult = validatePTWGasSafety(type, gasReadings);

  return (
    <div className="bg-slate-50 p-4 sm:p-5 rounded-lg border border-slate-300 space-y-3">
      <div className="font-bold text-slate-800 text-xs sm:text-sm">
        6. Initial Gas Test Reading (Pre-Work Verification):
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div>
          <label className="block text-slate-600 text-xs mb-1">LEL (%):</label>
          <input
            type="number"
            step="0.1"
            value={lelPercent}
            onChange={(e) => onLelChange(parseFloat(e.target.value) || 0)}
            className="w-full h-9 px-3 border border-slate-300 rounded bg-white text-sm"
          />
        </div>
        <div>
          <label className="block text-slate-600 text-xs mb-1">O2 (%):</label>
          <input
            type="number"
            step="0.1"
            value={o2Percent}
            onChange={(e) => onO2Change(parseFloat(e.target.value) || 0)}
            className="w-full h-9 px-3 border border-slate-300 rounded bg-white text-sm"
          />
        </div>
        <div>
          <label className="block text-slate-600 text-xs mb-1">H2S (ppm):</label>
          <input
            type="number"
            step="0.1"
            value={h2sPpm}
            onChange={(e) => onH2sChange(parseFloat(e.target.value) || 0)}
            className="w-full h-9 px-3 border border-slate-300 rounded bg-white text-sm"
          />
        </div>
      </div>
      <div
        className={`text-xs font-bold px-3 py-2 rounded ${
          gateResult.isSafe ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
        }`}
      >
        {gateResult.isSafe ? 'PASS — Gas readings within SOP safe band.' : `FAIL — ${gateResult.blockReason}`}
      </div>
    </div>
  );
}
