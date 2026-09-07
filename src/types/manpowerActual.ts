import { ShiftCode } from './lng';

export interface DailyActualLog {
  id: string; // `${staffId}_${dateKey}`
  staffId: string;
  dateKey: string; // YYYY-MM-DD
  actualShift: 'D' | 'N' | 'R' | 'OFF';
  actualStatus: 'ON_SITE' | 'OFF_DUTY' | 'RESIDENT';
  source: 'DAILY_HANDOVER' | 'MANAGER_OVERRIDE' | 'AUTO_BASELINE';
  signedBy?: string;
  lockedAt: string;
}

export type ShiftLayerType = 'ACTUAL' | 'OVERRIDE' | 'PLAN';

export interface ResolvedCellShift {
  shift: ShiftCode;
  layer: ShiftLayerType;
  log?: DailyActualLog;
}

/**
 * 3-Tier Layer Resolution:
 * Priority 1: Actual Operational Timesheet (Locked past or handed-over daily actuals)
 * Priority 2: Site Manager Approved Overrides (14-day extensions, force shifts)
 * Priority 3: Mathematical Cycle Plan Projections (22-day cycle & 90:30 rules)
 */
export function resolveCellShift(
  dateKey: string,
  todayStr: string,
  actualMap: Record<string, DailyActualLog>,
  overrideMap: Record<string, any>,
  projectedShift: ShiftCode,
  staffId: string
): ResolvedCellShift {
  const cellKey = `${staffId}_${dateKey}`;

  // Priority 1: Actual Logged Duty
  const actual = actualMap[cellKey];
  if (actual) {
    return {
      shift: actual.actualShift,
      layer: 'ACTUAL',
      log: actual,
    };
  }

  // Priority 2: Site Manager Override
  const override = overrideMap[cellKey];
  if (override && override.assignedShift) {
    return {
      shift: override.assignedShift,
      layer: 'OVERRIDE',
    };
  }

  // Priority 3: Forward Plan Projection
  return {
    shift: projectedShift,
    layer: 'PLAN',
  };
}
