// src/cmms-daily-ops/dao/dailyOpsShiftStatusDao.ts
//
// PURPOSE
//   HMI Overview (Sub-stage B) shift-input-status marker, split into its own
//   file rather than appended to dailyOpsPatrolDao.ts — that file was
//   already at 244/250 lines (AGENTS.md hard cap), so this follows the same
//   "one concern, one file" convention as pidCoordinatesDao.ts /
//   pidTagAliasesDao.ts (both pid_tag_* concerns split out of
//   dailyOpsPatrolDao.ts's neighborhood rather than piled into one file).
//
//   Read-only — never writes to daily_ops_patrol_entries. `ShiftTimeSlot` is
//   imported from patrolLog.ts, not redefined (single source of truth, same
//   rule hmiOverviewTypes.ts follows for PatrolDomain).

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import type { ShiftTimeSlot } from '../types/patrolLog';

// dailyOpsPatrolSchema.ts's shift_time_slot CHECK constraint, verbatim.
const ALL_SHIFT_TIME_SLOTS: ShiftTimeSlot[] = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];

const SELECT_DISTINCT_SHIFT_SLOTS_SQL = `
  SELECT DISTINCT shift_time_slot FROM daily_ops_patrol_entries WHERE report_date = @reportDate
`;

interface ShiftSlotRow {
  shift_time_slot: ShiftTimeSlot;
}

/**
 * reportDate에 최소 1건 이상 입력된 shift_time_slot을 true로 표시한다.
 * 읽기 전용 — daily_ops_patrol_entries에 쓰지 않는다.
 */
export function getShiftInputStatus(db: SqlExecutor, reportDate: string): Record<ShiftTimeSlot, boolean> {
  const submittedSlots = new Set(
    db.all<ShiftSlotRow>(SELECT_DISTINCT_SHIFT_SLOTS_SQL, { reportDate }).map((row) => row.shift_time_slot)
  );
  const status = {} as Record<ShiftTimeSlot, boolean>;
  for (const slot of ALL_SHIFT_TIME_SLOTS) {
    status[slot] = submittedSlots.has(slot);
  }
  return status;
}
