// src/cmms-daily-ops/hmi-overview/OverviewUnitBadge.tsx
//
// PURPOSE
//   One unit tile in the HMI Overview grid. Status color semantics mirror
//   PidTagBadge.tsx's ALARM_PRIORITY_FILL (same CRITICAL/HIGH/NORMAL hex
//   values via the same var(--token, #hex) fallback pattern) so the two
//   views read as one visual system. HmiOverviewUnitStatus has no existing
//   precedent for OFFLINE (PidTagBadge's AlarmPriority union has no such
//   state) — a new distinct dim/dashed treatment was chosen here rather
//   than reusing NORMAL's gray, so "no data" and "confirmed normal" stay
//   visually distinguishable. Flagged in the Sub-stage A report for HJ
//   awareness, not a blocking decision.
//
//   Pure presentation — no hooks beyond props, label text comes entirely
//   from `unit.label` (never a literal tag string), per the "no hardcoded
//   naming" constraint.
//
//   Stage 1 (site launch readiness) — when unit.isThresholdValidated is
//   false, the WARNING/ALARM band behind this tile's color is a mock
//   PLACEHOLDER (hmiOverviewConstants.ts), not an HJ-confirmed safety
//   threshold. A small "~" marker + tooltip is added so field staff/HJ can
//   tell at a glance; deliberately minimal, no badge redesign.

'use client';

import type { ReactNode } from 'react';
import type { HmiOverviewUnitStatus, OverviewHmiUnit } from './hmiOverviewTypes';

const STATUS_FILL: Record<HmiOverviewUnitStatus, string> = {
  NORMAL: 'var(--hmi-alarm-normal, #94a3b8)',
  WARNING: 'var(--hmi-alarm-high, #F97316)',
  ALARM: 'var(--hmi-alarm-critical, #EF4444)',
  OFFLINE: 'var(--hmi-overview-offline, #475569)',
};

const STATUS_BORDER_STYLE: Record<HmiOverviewUnitStatus, string> = {
  NORMAL: 'solid',
  WARNING: 'solid',
  ALARM: 'solid',
  OFFLINE: 'dashed',
};

interface OverviewUnitBadgeProps {
  unit: OverviewHmiUnit;
  onSelect?: (equipmentTag: string) => void;
  children?: ReactNode;
}

export function OverviewUnitBadge({ unit, onSelect, children }: OverviewUnitBadgeProps) {
  const fill = STATUS_FILL[unit.status];

  return (
    <div
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect ? () => onSelect(unit.equipmentTag) : undefined}
      className="bg-white p-2 flex flex-col gap-1 text-[11px] font-mono"
      style={{
        borderWidth: 2,
        borderStyle: STATUS_BORDER_STYLE[unit.status],
        borderColor: fill,
        cursor: onSelect ? 'pointer' : 'default',
        opacity: unit.status === 'OFFLINE' ? 0.7 : 1,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-slate-700 truncate flex items-center gap-1">
          {unit.label}
          {!unit.isThresholdValidated && (
            <span
              className="text-slate-400 font-normal"
              title="PLACEHOLDER threshold — pending site engineer confirmation"
            >
              ~
            </span>
          )}
        </span>
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: fill }} />
      </div>
      <div className="text-slate-800">
        {unit.primaryValue !== null ? `${unit.primaryValue} ${unit.primaryUnit}` : '— no reading —'}
      </div>
      {unit.secondaryValue !== undefined && unit.secondaryValue !== null && (
        <div className="text-slate-500">
          {unit.secondaryValue} {unit.secondaryUnit}
        </div>
      )}
      {children}
    </div>
  );
}
