// src/utils/rollingManningForecast.ts
//
// PURPOSE
//   WIB date helpers + 7-day rolling manning-risk forecast — 순수 함수 (React 미의존,
//   AGENTS.md §3 Logic/Data Layer 컨벤션). Phase 13 Target B Sub-stage C: extracted
//   verbatim from manningCompliance.ts (250-line cap cleanup, logic move only, no
//   behavior change).
//
//   getWibDate has no direct external consumers today (dailyOpsDateHelpers.ts
//   re-implements the same +7h offset rather than importing it — see that file's header
//   comment) but remains re-exported via manningCompliance.ts's barrel so any future
//   consumer of the old path keeps working.

import { StaffPersonnel, ShiftCode } from '../types/lng';
import type { ERTSummaryResult } from './ertSummary';

/**
 * Get current date adjusted for Western Indonesia Time (WIB, UTC+7)
 */
export const getWibDate = (): Date => {
  const now = new Date();
  return new Date(now.getTime() + 7 * 60 * 60 * 1000);
};

/**
 * Format Date instance to ISO YYYY-MM-DD string
 */
export const formatIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

export interface RollingHorizonDay {
  dateStr: string;
  dayLabel: string;
  dayNum: number;
  month: number;
  year: number;
  isToday: boolean;
  availableHeadcount: number;
  status: 'OK' | 'WARNING' | 'DANGER';
  badgeText: string;
  detailText: string;
}

/**
 * 7-Day Rolling Horizon Risk Strip Forecast Calculator
 */
export function calculateRolling7Days(
  manpowerData: StaffPersonnel[],
  dailyStaffStatus: Record<string, { status: string; replacementId?: string }>,
  ertSummary: ERTSummaryResult,
  has154hViolation: boolean,
  exceededPersonnelCount: number,
  getStaffRosterFn: (staff: StaffPersonnel) => ShiftCode[],
  codBaselineDate: string = '2026-09-15'
): RollingHorizonDay[] {
  const days: RollingHorizonDay[] = [];

  const wibToday = getWibDate();
  const baseYear = wibToday.getUTCFullYear();
  const baseMonth = wibToday.getUTCMonth() + 1;
  const startDay = wibToday.getUTCDate();

  for (let offset = 0; offset < 7; offset++) {
    const horizonDate = new Date(Date.UTC(baseYear, baseMonth - 1, startDay + offset));
    const currentDayNum = horizonDate.getUTCDate();
    const isToday = offset === 0;
    const dateStr = formatIsoDate(horizonDate);
    const monthLabel = String(horizonDate.getUTCMonth() + 1).padStart(2, '0');
    const dayLabel = isToday
      ? `${monthLabel}/${String(currentDayNum).padStart(2, '0')} (TODAY)`
      : `${monthLabel}/${String(currentDayNum).padStart(2, '0')} (+${offset}D)`;

    if (isToday) {
      const totalPlanned = 16;
      const unreplacedAbsence = Object.values(dailyStaffStatus).filter(
        (s) => s.status !== 'PRESENT' && !s.replacementId
      ).length;
      const activeHeadcount = totalPlanned - unreplacedAbsence;

      let status: 'OK' | 'WARNING' | 'DANGER' = 'OK';
      let badgeText = `${activeHeadcount}p OK`;
      let detailText = '100% Manning Cleared';

      if (!ertSummary.isAllERTMet || unreplacedAbsence > 0) {
        status = 'DANGER';
        badgeText = unreplacedAbsence > 0 ? `${activeHeadcount}p Shortage` : 'ERT Deficit';
        detailText = !ertSummary.isAllERTMet
          ? `ERT Deficit (Gas:${ertSummary.gasResponseCount}/2)`
          : `${unreplacedAbsence}p Unreplaced`;
      } else if (has154hViolation) {
        status = 'WARNING';
        badgeText = `${activeHeadcount}p Fatigue Alert`;
        detailText = `154h Risk (${exceededPersonnelCount} staff)`;
      }

      days.push({
        dateStr,
        dayLabel,
        dayNum: currentDayNum,
        month: horizonDate.getUTCMonth() + 1,
        year: horizonDate.getUTCFullYear(),
        isToday,
        availableHeadcount: activeHeadcount,
        status,
        badgeText,
        detailText,
      });
    } else {
      let onDutyCount = 0;
      let hasRotationRisk = false;

      manpowerData.forEach((m) => {
        const roster = getStaffRosterFn(m);
        const shift = roster[currentDayNum - 1];
        if (shift === 'D' || shift === 'N') {
          onDutyCount++;
        }
        if (dateStr < codBaselineDate) {
          if (m.id === 'EMP-010' && currentDayNum >= 3) {
            hasRotationRisk = true;
          }
          if (m.id === 'EMP-004' && currentDayNum >= 4) {
            hasRotationRisk = true;
          }
        }
      });

      let status: 'OK' | 'WARNING' | 'DANGER' = 'OK';
      let badgeText = `${onDutyCount}p OK`;
      let detailText = 'Normal Operations';

      if (onDutyCount < 13) {
        status = 'DANGER';
        badgeText = `${onDutyCount}p Shortage`;
        detailText = 'Deficit Below Threshold';
      } else if (hasRotationRisk) {
        status = 'WARNING';
        badgeText = `${onDutyCount}p Fatigue / AL Due`;
        detailText = 'Rotation Overdue Risk';
      }

      days.push({
        dateStr,
        dayLabel,
        dayNum: currentDayNum,
        month: horizonDate.getUTCMonth() + 1,
        year: horizonDate.getUTCFullYear(),
        isToday,
        availableHeadcount: onDutyCount,
        status,
        badgeText,
        detailText,
      });
    }
  }

  return days;
}
