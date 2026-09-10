// src/components/manpower/cargoHandling/hooks/useCargoHandlingLifecycle.ts
//
// PURPOSE
//   DRAFT -> PREPARED -> APPROVED -> ACTIVE -> CLOSED transition function for
//   CARGO_HANDLING (NP08) permits, mirroring usePTWPermits().transitionStatus
//   but gated by the NP08 wrappers (ptwCargoHandlingTransitions.ts) instead of
//   the NP07 O2/LEL/ERT checks. Takes `permits`/`setPermits` from the caller
//   (usePTWPermitsContext()) rather than owning state — CARGO_HANDLING permits
//   must stay in the SAME array PTWMasterRegisterTab/usePTWPermits manage, only
//   the transition function differs.

import { Dispatch, SetStateAction } from 'react';
import { PTWPermit, PTWWorkflowStatus } from '../../../../types/lng';
import { PTW_SIGNATURE_ROLE_LABELS } from '../../../../data/ptwSignatureRoles';
import { evaluateSignatureGate } from '../../../../adapters/ptwSignatureGate';
import { evaluateCriticalHighRiskEscalation } from '../../../../data/ptwCargoHandlingValidators';
import {
  canPrepareCargoHandlingPermit,
  canApproveCargoHandlingPermit,
  canActivateCargoHandlingPermit,
  canCloseCargoHandlingPermit,
} from '../../../../data/ptwCargoHandlingTransitions';

export function useCargoHandlingLifecycle(
  permits: PTWPermit[],
  setPermits: Dispatch<SetStateAction<PTWPermit[]>>,
  persistStatusChange: (permitId: string, status: PTWWorkflowStatus, closedAt: string | null) => void
) {
  const transitionCargoHandlingStatus = (permitId: string, nextStatus: PTWWorkflowStatus) => {
    const target = permits.find((p) => p.id === permitId);
    if (!target || target.type !== 'CARGO_HANDLING') return;

    // Gate 0: SSHQE §4.2 electronic signature completeness — same rule as
    // usePTWPermits.transitionStatus, type-agnostic.
    const signatureGate = evaluateSignatureGate(target, nextStatus);
    if (!signatureGate.allowed) {
      const missingLabels = signatureGate.missingRoles.map((r) => PTW_SIGNATURE_ROLE_LABELS[r]).join('\n - ');
      alert(`⚠️ [MISSING REQUIRED SIGNATURES]\nCannot transition to ${nextStatus} — outstanding signatures:\n - ${missingLabels}`);
      return;
    }

    const details = target.cargoHandling;

    if (nextStatus === 'PREPARED') {
      const gate = canPrepareCargoHandlingPermit(details);
      if (!gate.canTransition) {
        alert(`⚠️ [CARGO HANDLING PREPARE BLOCKED]\n - ${gate.blockReasons.join('\n - ')}`);
        return;
      }
    } else if (nextStatus === 'APPROVED') {
      const criticalRisk = evaluateCriticalHighRiskEscalation(details);
      const gate = canApproveCargoHandlingPermit({ isCriticalHighRisk: criticalRisk.isCriticalHighRisk, ...details });
      if (!gate.canTransition) {
        alert(`⚠️ [CARGO HANDLING APPROVAL BLOCKED]\n - ${gate.blockReasons.join('\n - ')}`);
        return;
      }
    } else if (nextStatus === 'ACTIVE') {
      const gate = canActivateCargoHandlingPermit(details);
      if (!gate.canTransition) {
        alert(`⚠️ [CARGO HANDLING ACTIVATION BLOCKED]\n - ${gate.blockReasons.join('\n - ')}`);
        return;
      }
    } else if (nextStatus === 'CLOSED') {
      const gate = canCloseCargoHandlingPermit(details);
      if (!gate.canTransition) {
        alert(`⚠️ [CARGO HANDLING CLOSE BLOCKED]\n - ${gate.incompleteItems.join('\n - ')}`);
        return;
      }
    }

    const closedAt = nextStatus === 'CLOSED' ? '2026-09-01 18:00' : target.closedAt ?? null;

    setPermits((prev) =>
      prev.map((p) => {
        if (p.id !== permitId) return p;
        return {
          ...p,
          status: nextStatus,
          closedAt: closedAt ?? undefined,
        };
      })
    );

    // Fire-and-forget audit persistence into the SAME ptw_permits row usePTWPermits
    // writes to — see usePTWPermitSync.ts header (mirrors usePTWPermits.transitionStatus).
    persistStatusChange(permitId, nextStatus, closedAt);
  };

  return { transitionCargoHandlingStatus };
}
