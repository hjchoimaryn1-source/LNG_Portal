// src/components/locations/nias/tabs/NiasTankOverviewKpiStrip.tsx
//
// PURPOSE
//   Top 3-Card KPI strip for "ISO TK Position" (NiasTankOverviewTab) — live
//   read-only snapshot, replacing the previous zoneStats/activeBays-derived
//   mock strip (Yard Map / ORU Dashboard live DB rewiring, Part 2). The
//   3-column DnD Yard Map below this strip is unrelated and untouched.
//
//   ORU(LD-1)/ORU(LD-2): iso_tank_daily_readings latest-per-tank grouped by
//   `position`. `position` is not yet populated by any live entry (100%
//   NULL as of this stage) — both cards show "no recent reading" until
//   ISO TK - LOG starts saving it. Not a bug; expected pre-rollout state.
//   ORU(ISO TK-Skid): daily_ops_patrol_entries latest-per-tag, T-201~204.

'use client';

import { useYardMapKpiData } from '../hooks/useYardMapKpiData';
import { summarizeByPosition, matchSkidLatestReadings, type PositionSummary, type SkidTagReading } from '../utils/yardMapKpiCalculations';
import { ISO_TANK_UNLOADING_SKID_TAGS } from '../../../../cmms-daily-ops/dao/patrolEquipmentTags';

const CARD_SHELL = 'win-panel overflow-hidden border border-slate-300 flex flex-col justify-between';
const CARD_HEADER = 'bg-[#002b4d] px-3 py-2 flex justify-between items-center text-white border-b border-blue-900/60';
const CARD_TITLE = 'text-slate-100 font-bold text-xs sm:text-sm tracking-wider uppercase flex-1 text-center';
const ROW = 'flex items-center justify-between w-full border-b border-slate-100 py-1.5';
const LABEL = 'text-slate-500 font-medium text-xs whitespace-nowrap shrink-0';
const VALUE = 'text-slate-900 font-bold text-xs text-right truncate pl-2 font-mono';

function fmt(n: number | null, digits = 1): string {
  return n === null ? '—' : n.toFixed(digits);
}

function PositionCard({ title, summary }: { title: string; summary: PositionSummary }) {
  return (
    <div className={CARD_SHELL}>
      <div className={CARD_HEADER}>
        <span className={CARD_TITLE}>{title}</span>
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${summary.tankCount > 0 ? 'bg-[#10b981]' : 'bg-slate-400'}`} />
      </div>
      <div className="p-3 space-y-1.5 font-mono text-xs sm:text-sm text-slate-800 bg-white">
        {summary.tankCount === 0 ? (
          <div className="py-4 text-center text-[11px] font-bold text-slate-500">최근 판독값 없음 (Position 미기록)</div>
        ) : (
          <>
            <div className={ROW}>
              <span className={LABEL}>Tanks (Recent Reading):</span>
              <strong className={VALUE}>{summary.tankCount}</strong>
            </div>
            <div className={ROW}>
              <span className={LABEL}>Avg Pressure:</span>
              <strong className={VALUE}>{fmt(summary.avgPressureMpa, 2)} MPa</strong>
            </div>
            <div className={ROW}>
              <span className={LABEL}>Avg Temp:</span>
              <strong className={VALUE}>{fmt(summary.avgTempC, 1)} °C</strong>
            </div>
            <div className="flex items-center justify-between w-full pt-1">
              <span className={LABEL}>Total Est. Mass:</span>
              <strong className="text-[#0284c7] font-extrabold text-sm font-mono text-right truncate pl-2">
                {summary.totalMassKg === null ? '—' : summary.totalMassKg.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg
              </strong>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SkidCard({ readings }: { readings: SkidTagReading[] }) {
  const anyReading = readings.some((r) => r.reportDate !== null);
  return (
    <div className={CARD_SHELL}>
      <div className={CARD_HEADER}>
        <span className={CARD_TITLE}>ORU ( ISO TK - Skid )</span>
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${anyReading ? 'bg-[#10b981]' : 'bg-slate-400'}`} />
      </div>
      <div className="p-2.5 font-mono text-[10.5px] text-slate-800 bg-white space-y-1">
        {readings.map((r) => (
          <div key={r.tag} className="flex items-center justify-between border-b border-slate-100 py-1 last:border-b-0">
            <span className="font-bold text-[#002b4d]">{r.tag}</span>
            {r.reportDate === null ? (
              <span className="text-slate-500 font-bold">최근 판독값 없음</span>
            ) : (
              <span className="text-slate-700">
                {fmt(r.pressureMpa, 2)} MPa / {fmt(r.tempC, 1)}°C / {fmt(r.levelPct, 0)}%
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function NiasTankOverviewKpiStrip() {
  const { latestReadings, latestPatrolEntries, isLoading, error } = useYardMapKpiData();

  if (error) {
    return <div className="p-2 text-xs font-mono text-red-700 font-bold">Yard Map KPI 로드 실패: {error}</div>;
  }
  if (isLoading) {
    return <div className="p-2 text-xs font-mono text-slate-500">Loading...</div>;
  }

  const ld1 = summarizeByPosition(latestReadings, 'LD-1');
  const ld2 = summarizeByPosition(latestReadings, 'LD-2');
  const skidReadings = matchSkidLatestReadings(latestPatrolEntries, ISO_TANK_UNLOADING_SKID_TAGS);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 select-none">
      <PositionCard title="ORU ( LD - 1 )" summary={ld1} />
      <SkidCard readings={skidReadings} />
      <PositionCard title="ORU ( LD - 2 )" summary={ld2} />
    </div>
  );
}
