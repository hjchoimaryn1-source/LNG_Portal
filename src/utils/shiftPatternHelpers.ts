// src/utils/shiftPatternHelpers.ts
//
// PURPOSE
//   3:1 rotation shift-pattern lookup and rotation-personnel-list sorting — 순수 함수
//   (React 미의존, AGENTS.md §3 Logic/Data Layer 컨벤션). Phase 13 Target B Sub-stage C:
//   extracted verbatim from cycleEngine.ts (250-line cap cleanup, logic move only, no
//   behavior change).

import { StaffPersonnel, ShiftCode } from '../types/lng';

/**
 * 3:1 Rotation Pattern Helper (2D-2N-2Off 6-day cycle from COD date)
 */
export function get3to1Shift(
  staff: StaffPersonnel,
  dateStr: string,
  codDate: string = '2026-09-15'
): ShiftCode {
  const isResident = staff.department === 'HR_GA';
  if (isResident) {
    const d = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
    return dayOfWeek === 0 || dayOfWeek === 6 ? 'Off' : 'D';
  }

  // Management / Site Manager
  if (staff.department === 'MANAGEMENT' && staff.id === 'EMP-001') {
    return 'D';
  }

  // Support teams: Maintenance, HSSE, Logistics
  if (
    staff.department === 'MAINTENANCE' ||
    staff.department === 'HSSE' ||
    staff.department === 'LOGISTICS'
  ) {
    return 'D';
  }

  // Operations Teams (OP_ALPHA, OP_BRAVO, OP_CHARLIE)
  const d1 = new Date(dateStr + 'T00:00:00');
  const d0 = new Date(codDate + 'T00:00:00');
  const diffDays = Math.floor((d1.getTime() - d0.getTime()) / (1000 * 60 * 60 * 24));
  const phase = ((diffDays % 6) + 6) % 6; // 0, 1, 2, 3, 4, 5

  // Team-A: Days 0,1: D | Days 2,3: N | Days 4,5: Off
  if (staff.department === 'OP_ALPHA' || staff.id === 'EMP-002') {
    if (phase === 0 || phase === 1) return 'D';
    if (phase === 2 || phase === 3) return 'N';
    return 'Off';
  }

  // Team-C: Days 0,1: N | Days 2,3: Off | Days 4,5: D
  if (staff.department === 'OP_CHARLIE') {
    if (phase === 0 || phase === 1) return 'N';
    if (phase === 2 || phase === 3) return 'Off';
    return 'D';
  }

  // Team-B: Days 0,1: Off | Days 2,3: D | Days 4,5: N
  if (staff.department === 'OP_BRAVO') {
    if (phase === 0 || phase === 1) return 'Off';
    if (phase === 2 || phase === 3) return 'D';
    return 'N';
  }

  return 'D';
}

/**
 * Sort rotation personnel list according to statusSortMode
 */
export function sortRotationPersonnelList(
  list: StaffPersonnel[],
  statusSortMode: 'DEFAULT' | 'OFF_FIRST' | 'ONSITE_FIRST'
): StaffPersonnel[] {
  const result = [...list];

  if (statusSortMode === 'DEFAULT') {
    return result.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  }

  const getStatusWeight = (staff: StaffPersonnel) => {
    const s = String(staff.currentStatus || '').toUpperCase();
    const isOffDuty = s.includes('OFF') || s.includes('LEAVE') || s.includes('REST');

    if (statusSortMode === 'OFF_FIRST') {
      return isOffDuty ? 1 : 2;
    }
    return isOffDuty ? 2 : 1;
  };

  result.sort((a, b) => {
    const wa = getStatusWeight(a);
    const wb = getStatusWeight(b);
    if (wa !== wb) return wa - wb;
    return a.id.localeCompare(b.id, undefined, { numeric: true });
  });

  return result;
}
