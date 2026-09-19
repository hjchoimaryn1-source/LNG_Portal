// src/utils/ertSummary.ts
//
// PURPOSE
//   ERT (Emergency Response Team) manning-gate compliance calculation — 순수 함수
//   (React 미의존, AGENTS.md §3 Logic/Data Layer 컨벤션). Phase 13 Target B Sub-stage C:
//   extracted verbatim from manningCompliance.ts (250-line cap cleanup, logic move only,
//   no behavior change).

import { StaffPersonnel } from '../types/lng';
import { getStaffCompetencyStatus } from '../data/manpowerMasterData';

export interface ERTSummaryResult {
  icCount: number;
  fireChiefCount: number;
  firstAiderCount: number;
  gasResponseCount: number;
  isICMet: boolean;
  isFireChiefMet: boolean;
  isFirstAiderMet: boolean;
  isGasResponseMet: boolean;
  isAllERTMet: boolean;
}

/**
 * 3. ERT Manning & Compliance Gate Calculation (Dynamic with Inline Absences & Standby Replacements)
 */
export function calculateERTSummary(
  manpowerData: StaffPersonnel[],
  dailyStaffStatus: Record<string, { status: string; replacementId?: string }>,
  dailyRestAssignments: Record<string, { coveringStaffId?: string }>
): ERTSummaryResult {
  const activeStaffIds = new Set<string>();

  manpowerData.forEach((m) => {
    if (m.currentStatus === 'OFF_DUTY' || m.department === 'OP_ALPHA') return;
    const st = dailyStaffStatus[m.id];
    const isRestLegacy = !!dailyRestAssignments[m.id];
    if ((!st || st.status === 'PRESENT') && !isRestLegacy) {
      activeStaffIds.add(m.id);
    }
  });

  Object.values(dailyStaffStatus).forEach((st) => {
    if (st.status !== 'PRESENT' && st.replacementId) {
      activeStaffIds.add(st.replacementId);
    }
  });

  Object.values(dailyRestAssignments).forEach((assign) => {
    if (assign.coveringStaffId) {
      activeStaffIds.add(assign.coveringStaffId);
    }
  });

  const activeCertifiedPersonnel = manpowerData.filter(
    (m) => activeStaffIds.has(m.id) && !getStaffCompetencyStatus(m).hasExpired
  );

  const icCount = activeCertifiedPersonnel.filter((m) => m.ertRole === 'Incident Commander').length;
  const fireChiefCount = activeCertifiedPersonnel.filter((m) => m.ertRole === 'Fire Chief').length;
  const firstAiderCount = activeCertifiedPersonnel.filter((m) => m.ertRole === 'First Aider').length;
  const gasResponseCount = activeCertifiedPersonnel.filter((m) => m.ertRole === 'Gas Leak Response').length;

  const isICMet = icCount >= 1;
  const isFireChiefMet = fireChiefCount >= 1;
  const isFirstAiderMet = firstAiderCount >= 1;
  const isGasResponseMet = gasResponseCount >= 2;

  const isAllERTMet = isICMet && isFireChiefMet && isFirstAiderMet && isGasResponseMet;

  return {
    icCount,
    fireChiefCount,
    firstAiderCount,
    gasResponseCount,
    isICMet,
    isFireChiefMet,
    isFirstAiderMet,
    isGasResponseMet,
    isAllERTMet,
  };
}
