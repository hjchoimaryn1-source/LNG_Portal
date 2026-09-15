// src/cmms-daily-ops/hmi-overview/NgBufferTankGauge.tsx
//
// PURPOSE
//   Normal-range indicator for domain === 'ng_buffer_tank' units. Reads its
//   bands exclusively from hmiOverviewConstants.ts (no inline magic
//   numbers) and derives in/out-of-range styling from a plain comparison —
//   never hardcodes "LOW"/"HIGH" text, per the sidebar-derivation rule
//   confirmed for this module.

'use client';

import {
  NG_BUFFER_TANK_NORMAL_MAX_BARG,
  NG_BUFFER_TANK_NORMAL_MIN_BARG,
  NG_BUFFER_TANK_TYPICAL_MAX_BARG,
  NG_BUFFER_TANK_TYPICAL_MIN_BARG,
} from './hmiOverviewConstants';

interface NgBufferTankGaugeProps {
  pressureBarg: number | null;
}

function pct(value: number): number {
  const span = NG_BUFFER_TANK_NORMAL_MAX_BARG - NG_BUFFER_TANK_NORMAL_MIN_BARG;
  return Math.min(100, Math.max(0, ((value - NG_BUFFER_TANK_NORMAL_MIN_BARG) / span) * 100));
}

export function NgBufferTankGauge({ pressureBarg }: NgBufferTankGaugeProps) {
  if (pressureBarg === null) return null;

  const inNormalBand = pressureBarg >= NG_BUFFER_TANK_NORMAL_MIN_BARG && pressureBarg <= NG_BUFFER_TANK_NORMAL_MAX_BARG;
  const inTypicalBand = pressureBarg >= NG_BUFFER_TANK_TYPICAL_MIN_BARG && pressureBarg <= NG_BUFFER_TANK_TYPICAL_MAX_BARG;
  const markerColor = !inNormalBand
    ? 'var(--hmi-alarm-critical, #EF4444)'
    : inTypicalBand
      ? 'var(--hmi-alarm-normal, #94a3b8)'
      : 'var(--hmi-alarm-high, #F97316)';

  const typicalLeftPct = pct(NG_BUFFER_TANK_TYPICAL_MIN_BARG);
  const typicalWidthPct = pct(NG_BUFFER_TANK_TYPICAL_MAX_BARG) - typicalLeftPct;

  return (
    <div className="mt-1">
      <div className="relative h-2 bg-slate-200 rounded-sm overflow-hidden">
        <div
          className="absolute inset-y-0 bg-slate-300"
          style={{ left: `${typicalLeftPct}%`, width: `${typicalWidthPct}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-[3px]"
          style={{ left: `calc(${pct(pressureBarg)}% - 1.5px)`, backgroundColor: markerColor }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
        <span>{NG_BUFFER_TANK_NORMAL_MIN_BARG}</span>
        <span>{NG_BUFFER_TANK_NORMAL_MAX_BARG} barg</span>
      </div>
    </div>
  );
}
