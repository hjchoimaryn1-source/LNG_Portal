// src/components/manpower/hooks/usePTWPermits.ts
import { useMemo, useState } from 'react';
import { PTWPermit, PTWWorkflowStatus } from '../../../types/lng';
import { INITIAL_PTW_PERMITS, validatePTWGasSafety } from '../../../data/ptwMasterData';

/**
 * Shared PTW permit register state (Master Register 소유, 향후 Gas Testing Log /
 * ERT Readiness 탭이 읽기 전용으로 참조할 수 있도록 셸 레벨에서 관리한다).
 */
export function usePTWPermits() {
  const [permits, setPermits] = useState<PTWPermit[]>(INITIAL_PTW_PERMITS);

  const addPermit = (permit: PTWPermit) => {
    setPermits((prev) => [permit, ...prev]);
  };

  const updateGasReadings = (permitId: string, lel: number, o2: number) => {
    setPermits((prev) =>
      prev.map((p) => {
        if (p.id !== permitId) return p;
        const newReadings = {
          ...p.gasReadings,
          lelPercent: lel,
          o2Percent: o2,
          testedAt: `2026-09-01 ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`,
        };
        const safety = validatePTWGasSafety(p.type, newReadings);
        return {
          ...p,
          gasReadings: {
            ...newReadings,
            isSafeForWork: safety.isSafe,
          },
        };
      })
    );
  };

  // Workflow State Transition (Draft -> Prepared -> Approved -> Active -> Closed)
  const transitionStatus = (permitId: string, nextStatus: PTWWorkflowStatus, isERTMet: boolean) => {
    const target = permits.find((p) => p.id === permitId);
    if (!target) return;

    // Gate 1: Confined Space O2 band check for Approval / Activation
    if (target.type === 'CONFINED_SPACE' && (nextStatus === 'APPROVED' || nextStatus === 'ACTIVE')) {
      if (target.gasReadings.o2Percent < 19.5 || target.gasReadings.o2Percent > 23.5) {
        alert(`⚠️ [CONFINED SPACE ENTRY BLOCKED]\nO2 concentration is ${target.gasReadings.o2Percent}%.\nSOP NP07-12 mandates safe atmospheric oxygen band of 19.5% ~ 23.5%.`);
        return;
      }
    }

    // Gate 2: Hot Work LEL 0.0% check for Activation
    if (target.type === 'HOT_WORK' && nextStatus === 'ACTIVE') {
      if (target.gasReadings.lelPercent > 0) {
        alert(`⚠️ [HOT WORK ACTIVATION BLOCKED]\nHydrocarbon gas reading is ${target.gasReadings.lelPercent}% LEL.\nSOP NP07-11 strictly requires 0.0% LEL in cryogenic gas zones.`);
        return;
      }
    }

    // Gate 3: ERT Minimum Manning Check for High Risk Activation
    if ((target.type === 'HOT_WORK' || target.type === 'CONFINED_SPACE') && nextStatus === 'ACTIVE' && !isERTMet) {
      alert(`⚠️ [CRITICAL ERT DEFICIT]\nCannot activate high-risk ${target.type} permit.\nERT minimum manning is not met (19 Direct personnel standard required).`);
      return;
    }

    setPermits((prev) =>
      prev.map((p) => {
        if (p.id !== permitId) return p;
        return {
          ...p,
          status: nextStatus,
          closedAt: nextStatus === 'CLOSED' ? '2026-09-01 18:00' : p.closedAt,
        };
      })
    );
  };

  const stats = useMemo(() => {
    const total = permits.length;
    const activeCount = permits.filter((p) => p.status === 'ACTIVE').length;
    const approvedCount = permits.filter((p) => p.status === 'APPROVED').length;
    const preparedCount = permits.filter((p) => p.status === 'PREPARED').length;
    const draftCount = permits.filter((p) => p.status === 'DRAFT').length;
    const closedCount = permits.filter((p) => p.status === 'CLOSED').length;
    const hotWorkCount = permits.filter((p) => p.type === 'HOT_WORK' && p.status === 'ACTIVE').length;
    const confinedCount = permits.filter((p) => p.type === 'CONFINED_SPACE' && (p.status === 'ACTIVE' || p.status === 'APPROVED')).length;

    return {
      total,
      activeCount,
      approvedCount,
      preparedCount,
      draftCount,
      closedCount,
      hotWorkCount,
      confinedCount,
    };
  }, [permits]);

  return { permits, addPermit, updateGasReadings, transitionStatus, stats };
}
