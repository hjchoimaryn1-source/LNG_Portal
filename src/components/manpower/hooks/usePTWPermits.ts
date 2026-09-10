// src/components/manpower/hooks/usePTWPermits.ts
import { useEffect, useMemo, useState } from 'react';
import { GasTestLogEntry, GasTestLogEntryInput, PTWPermit, PTWSignatureRole, PTWWorkflowStatus } from '../../../types/lng';
import { INITIAL_PTW_PERMITS, validatePTWGasSafety } from '../../../data/ptwMasterData';
import { PTW_SIGNATURE_ROLE_LABELS } from '../../../data/ptwSignatureRoles';
import { evaluateSignatureGate } from '../../../adapters/ptwSignatureGate';
import { usePTWPermitSync } from './usePTWPermitSync';
import { applyLifecycleToPermit } from '../../../utils/ptwPermitRecordMapper';

/**
 * Shared PTW permit register state (Master Register 소유, 향후 Gas Testing Log /
 * ERT Readiness 탭이 읽기 전용으로 참조할 수 있도록 셸 레벨에서 관리한다).
 */
export function usePTWPermits() {
  const [permits, setPermits] = useState<PTWPermit[]>(INITIAL_PTW_PERMITS);

  // SQLite ptw_permits/ptw_signatures 영속화(usePTWPermitSync.ts) — status/
  // closedAt/signatures만 DB에서 병합한다. 게이트 판정(SSOT)은 여전히 아래
  // client-side 로직이며, DB 쓰기는 fire-and-forget 감사/영속화 목적이다.
  const permitSync = usePTWPermitSync(permits);

  // 최초 시딩/로드가 끝난 직후 딱 한 번만 DB 상태를 permits에 병합한다 — 이후
  // transitionStatus/addSignature가 만드는 로컬 갱신을 되돌아가 덮어쓰지 않기
  // 위함(그 로직들은 이미 자신의 persist* 호출로 lifecycleByPermit/
  // signaturesByPermit도 함께 갱신해 둔다).
  useEffect(() => {
    if (!permitSync.synced) return;
    setPermits((prev) =>
      prev.map((p) => applyLifecycleToPermit(p, permitSync.lifecycleByPermit.get(p.id), permitSync.signaturesByPermit.get(p.id)))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permitSync.synced]);

  const addPermit = (permit: PTWPermit) => {
    setPermits((prev) => [permit, ...prev]);
  };

  // NOTE(redundancy): no call site actually invokes this anymore — the prop is
  // still threaded through PTWPermitDetailPanel/PTWGasSafetyGate but never
  // called from their JSX (superseded by addGasTestLogEntry below, which also
  // writes gasTestHistory). Kept as-is per task instructions; not removed here.
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

  // Single-point re-test entry (Hot Work / Confined Space / etc). CARGO_HANDLING
  // is explicitly rejected — that category has its own multi-point AGT update
  // path (src/data/ptwCargoHandlingValidators.ts) and must not go through here.
  const addGasTestLogEntry = (permitId: string, entryInput: GasTestLogEntryInput) => {
    const target = permits.find((p) => p.id === permitId);
    if (!target) return;

    if (target.type === 'CARGO_HANDLING') {
      console.error(
        `[usePTWPermits] addGasTestLogEntry rejected for ${permitId}: CARGO_HANDLING permits must use the dedicated Cargo Handling gas-reading update path, not the single-point re-test flow.`
      );
      return;
    }

    // isSafeForWork is computed here, from the real validatePTWGasSafety() gate —
    // it is never accepted from entryInput (GasTestLogEntryInput omits it entirely).
    const safety = validatePTWGasSafety(target.type, {
      ...target.gasReadings,
      lelPercent: entryInput.lelPercent,
      o2Percent: entryInput.o2Percent,
      h2sPpm: entryInput.h2sPpm,
    });

    const newEntry: GasTestLogEntry = {
      ...entryInput,
      isSafeForWork: safety.isSafe,
    };

    setPermits((prev) =>
      prev.map((p) => {
        if (p.id !== permitId) return p;
        return {
          ...p,
          gasTestHistory: [...(p.gasTestHistory || []), newEntry],
          gasReadings: {
            ...p.gasReadings,
            lelPercent: newEntry.lelPercent,
            o2Percent: newEntry.o2Percent,
            h2sPpm: newEntry.h2sPpm,
            testedAt: newEntry.testedAt,
            isSafeForWork: newEntry.isSafeForWork,
          },
        };
      })
    );
  };

  // Electronic signature capture (SSHQE §4.2 PART C/D/E). A role may only be
  // signed once per permit — re-signing an already-signed role is a no-op
  // (append-only log, see PTWSignatureEntry doc comment in types/lng.ts).
  const addSignature = (permitId: string, role: PTWSignatureRole, staffId: string, staffName: string) => {
    const target = permits.find((p) => p.id === permitId);
    if (!target || (target.signatures || []).some((s) => s.role === role)) return;

    const newEntry = {
      role,
      staffId,
      staffName,
      signedAt: `2026-09-01 ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`,
    };

    setPermits((prev) =>
      prev.map((p) => (p.id === permitId ? { ...p, signatures: [...(p.signatures || []), newEntry] } : p))
    );

    // Fire-and-forget audit persistence — never re-validated, never blocks the
    // local signature state above (see usePTWPermitSync.ts header).
    permitSync.persistSignature(permitId, newEntry);
  };

  // Workflow State Transition (Draft -> Prepared -> Approved -> Active -> Closed)
  const transitionStatus = (permitId: string, nextStatus: PTWWorkflowStatus, isERTMet: boolean) => {
    const target = permits.find((p) => p.id === permitId);
    if (!target) return;

    // Gate 0: SSHQE §4.2 electronic signature completeness (PART C/D/E)
    const signatureGate = evaluateSignatureGate(target, nextStatus);
    if (!signatureGate.allowed) {
      const missingLabels = signatureGate.missingRoles.map((r) => PTW_SIGNATURE_ROLE_LABELS[r]).join('\n - ');
      alert(`⚠️ [MISSING REQUIRED SIGNATURES]\nCannot transition to ${nextStatus} — outstanding signatures:\n - ${missingLabels}`);
      return;
    }

    // Gate 1: Confined Space O2 band check for Approval / Activation
    if (target.type === 'CONFINED_SPACE' && (nextStatus === 'APPROVED' || nextStatus === 'ACTIVE')) {
      if (target.gasReadings.o2Percent < 19.5 || target.gasReadings.o2Percent > 23.5) {
        alert(`⚠️ [CONFINED SPACE ENTRY BLOCKED]\nO2 concentration is ${target.gasReadings.o2Percent}%.\nSOP NP07-11 mandates safe atmospheric oxygen band of 19.5% ~ 23.5%.`);
        return;
      }
    }

    // Gate 2: Hot Work LEL 0.0% check for Activation
    if (target.type === 'HOT_WORK' && nextStatus === 'ACTIVE') {
      if (target.gasReadings.lelPercent > 0) {
        alert(`⚠️ [HOT WORK ACTIVATION BLOCKED]\nHydrocarbon gas reading is ${target.gasReadings.lelPercent}% LEL.\nSOP NP07-14 strictly requires 0.0% LEL in cryogenic gas zones.`);
        return;
      }
    }

    // Gate 3: ERT Minimum Manning Check for High Risk Activation
    if ((target.type === 'HOT_WORK' || target.type === 'CONFINED_SPACE') && nextStatus === 'ACTIVE' && !isERTMet) {
      alert(`⚠️ [CRITICAL ERT DEFICIT]\nCannot activate high-risk ${target.type} permit.\nERT minimum manning is not met (19 Direct personnel standard required).`);
      return;
    }

    const closedAt = nextStatus === 'CLOSED' ? '2026-09-01 18:00' : target.closedAt ?? null;

    setPermits((prev) =>
      prev.map((p) => {
        if (p.id !== permitId) return p;
        return { ...p, status: nextStatus, closedAt: closedAt ?? undefined };
      })
    );

    // Fire-and-forget audit persistence — never re-validated, never blocks the
    // local status state above (see usePTWPermitSync.ts header).
    permitSync.persistStatusChange(permitId, nextStatus, closedAt);
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

  // Exposed so useCargoHandlingLifecycle (NP08) can write into this exact same
  // array — permits must have a single source of truth regardless of which
  // transition function (NP07 transitionStatus vs NP08 lifecycle gates) moved it.
  // persistStatusChange is also exposed directly so the NP08 lifecycle hook can
  // persist its own transitions to the same ptw_permits row (no type gate).
  return {
    permits,
    setPermits,
    addPermit,
    updateGasReadings,
    addGasTestLogEntry,
    addSignature,
    transitionStatus,
    persistStatusChange: permitSync.persistStatusChange,
    stats,
  };
}
