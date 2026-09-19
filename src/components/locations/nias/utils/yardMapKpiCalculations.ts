// src/components/locations/nias/utils/yardMapKpiCalculations.ts
//
// PURPOSE
//   Pure aggregation for the live-DB Yard Map KPI strip (NiasTankOverviewTab
//   "ISO TK Position" — top 3-card summary only, the 3-column DnD workspace
//   below is untouched). No React (AGENTS.md §3 Logic/Data Layer).
//
//   - ORU(LD-1)/ORU(LD-2): groups iso_tank_daily_readings latest-per-tank
//     rows by `position` (LD-1/LD-2). `position` is not yet populated by any
//     live entry (verified: 100% NULL as of this stage), so both summaries
//     are expected to report tankCount: 0 until ISO TK - LOG starts saving
//     position — this is a "no recent reading" state, not a bug.
//   - ORU(ISO TK-Skid): matches daily_ops_patrol_entries latest-per-tag rows
//     (domain iso_tank_unloading_skid) against the fixed T-201~204 tag list.
//   - Mass is not a stored column in either source; estimated via the same
//     (levelPct / 100) * 18200 kg convention already used elsewhere in this
//     tab (40ft ISO tank ~18.2 ton cryo capacity assumption).

import type { IsoTankDailyReadingRow } from '../../../../cmms-monthly-report/dao/isoTankDailyReadingsDao';
import type { PatrolEntry } from '../../../../cmms-daily-ops/dao/dailyOpsPatrolDao';

const FULL_TANK_MASS_KG = 18200;

function estimateMassKg(levelPct: number | null): number | null {
  return levelPct === null ? null : (levelPct / 100) * FULL_TANK_MASS_KG;
}

function avg(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v !== null);
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
}

export interface PositionSummary {
  tankCount: number;
  avgPressureMpa: number | null;
  avgTempC: number | null;
  totalMassKg: number | null;
  latestReportDate: string | null;
}

/** Filters latest-per-tank readings to the given position (LD-1/LD-2) and summarizes. */
export function summarizeByPosition(latestReadings: IsoTankDailyReadingRow[], position: string): PositionSummary {
  const matched = latestReadings.filter((r) => r.position === position);
  if (matched.length === 0) {
    return { tankCount: 0, avgPressureMpa: null, avgTempC: null, totalMassKg: null, latestReportDate: null };
  }

  const masses = matched.map((r) => estimateMassKg(r.levelPct));
  return {
    tankCount: matched.length,
    avgPressureMpa: avg(matched.map((r) => r.pressureMpa)),
    avgTempC: avg(matched.map((r) => r.tempC)),
    totalMassKg: masses.some((m) => m !== null) ? masses.reduce((sum: number, m) => sum + (m ?? 0), 0) : null,
    latestReportDate: matched.reduce<string | null>((latest, r) => (!latest || r.reportDate > latest ? r.reportDate : latest), null),
  };
}

export interface SkidTagReading {
  tag: string;
  pressureMpa: number | null;
  tempC: number | null;
  levelPct: number | null;
  massKg: number | null;
  reportDate: string | null;
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Matches latest-per-tag patrol entries (iso_tank_unloading_skid) against the fixed T-201~204 tag list. */
export function matchSkidLatestReadings(latestEntries: PatrolEntry[], tags: string[]): SkidTagReading[] {
  const byTag = new Map(
    latestEntries.filter((e) => e.domain === 'iso_tank_unloading_skid').map((e) => [e.equipmentTag, e])
  );

  return tags.map((tag) => {
    const entry = byTag.get(tag);
    if (!entry) {
      return { tag, pressureMpa: null, tempC: null, levelPct: null, massKg: null, reportDate: null };
    }
    const levelPct = toNumber(entry.values.level_iot_pct);
    return {
      tag,
      pressureMpa: toNumber(entry.values.pressure_mpa),
      tempC: toNumber(entry.values.temperature_c),
      levelPct,
      massKg: estimateMassKg(levelPct),
      reportDate: entry.reportDate,
    };
  });
}
