// src/cmms-daily-ops/hmi-overview/HmiOverviewView.tsx
//
// PURPOSE
//   Phase 12 Daily Ops HMI Overview — Sub-stage A top-level composition.
//   Pure presentation: all data arrives via the `data` prop (OverviewHmiData,
//   hmiOverviewTypes.ts) so a later sub-stage can wire `useOverviewHmiData()`
//   without touching this file's internals. No data fetching, no store
//   subscriptions — the only hook used is local `useState` for the selected
//   unit (detail-panel placeholder).
//
//   Units are grouped by `unit.domain` (DOMAIN_GROUP_ORDER,
//   domainGroupLabels.ts) and rendered with `.map()` — group/grid sizing
//   comes entirely from `data.units.length`, never a hardcoded unit count.
//   NOT wired into any nav tab / route in this sub-stage (see Sub-stage A
//   commit scope).

'use client';

import { useState } from 'react';
import { RAISED_PANEL, TITLE_BAR } from '../../components/cmms/scadaStyles';
import type { OverviewHmiData, OverviewHmiUnit } from './hmiOverviewTypes';
import { DOMAIN_GROUP_LABEL, DOMAIN_GROUP_ORDER } from './domainGroupLabels';
import { OverviewUnitBadge } from './OverviewUnitBadge';
import { NgBufferTankGauge } from './NgBufferTankGauge';
import { ShiftInputStatusStrip } from './ShiftInputStatusStrip';

interface HmiOverviewViewProps {
  data: OverviewHmiData;
}

function groupByDomain(units: OverviewHmiUnit[]): Map<string, OverviewHmiUnit[]> {
  const groups = new Map<string, OverviewHmiUnit[]>();
  for (const unit of units) {
    const bucket = groups.get(unit.domain);
    if (bucket) bucket.push(unit);
    else groups.set(unit.domain, [unit]);
  }
  return groups;
}

export function HmiOverviewView({ data }: HmiOverviewViewProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const groups = groupByDomain(data.units);
  const selectedUnit = data.units.find((u) => u.equipmentTag === selectedTag) ?? null;

  return (
    <div className="space-y-3">
      <div className={TITLE_BAR}>
        HMI OVERVIEW — {data.units.length} UNITS — generated {data.generatedAt}
      </div>

      <div className={`${RAISED_PANEL} p-2`}>
        <ShiftInputStatusStrip />
      </div>

      {DOMAIN_GROUP_ORDER.filter((domain) => groups.has(domain)).map((domain) => (
        <div key={domain} className={`${RAISED_PANEL} p-3`}>
          <div className="text-[11px] font-bold text-slate-700 uppercase mb-2">{DOMAIN_GROUP_LABEL[domain]}</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {groups.get(domain)!.map((unit) => (
              <OverviewUnitBadge key={unit.equipmentTag} unit={unit} onSelect={setSelectedTag}>
                {domain === 'ng_buffer_tank' && <NgBufferTankGauge pressureBarg={unit.primaryValue} />}
              </OverviewUnitBadge>
            ))}
          </div>
        </div>
      ))}

      {selectedUnit && (
        <div className={`${RAISED_PANEL} p-2 text-[11px] font-mono text-slate-700`}>
          Selected: {selectedUnit.label} ({selectedUnit.equipmentTag}) — status {selectedUnit.status}
        </div>
      )}
    </div>
  );
}
