// Reduced-scope guardrail: self-approval only. approval_documents/approval_delegations
// (CMMS_Architecture.md §3.3) have no real backing table yet, so guardrails.ts's
// validateApprovalGuardrails cannot be used against real PTW data. Fatigue/duplicate-shift
// and unqualified-delegate checks are intentionally excluded here for the same reason
// C.2 was left as a no-op in guardrails.ts — no real underlying table exists for PTW.
// When approval_documents ships for real (separate approval required), this file should
// be deleted and PTW routed through validateApprovalGuardrails instead.
//
// requester comparator: PTWPermitBase has no requesterId/createdBy/authorId field.
// workLeaderId (confirmed by project owner) is the real field identifying who raised/
// leads the work, so it stands in as the requester for this self-approval check.
import type { PTWPermit } from '../../types/lng';

export function validatePtwSelfApproval(
  permit: PTWPermit,
  approverId: string
): { allowed: boolean; reason?: string } {
  if (permit.workLeaderId === approverId) {
    return { allowed: false, reason: 'SELF_APPROVAL_FORBIDDEN_403: Requester cannot approve their own PTW permit.' };
  }
  return { allowed: true };
}
