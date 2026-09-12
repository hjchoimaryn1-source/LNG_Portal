import type { RBACSessionGuard, RoleCode } from '../../types/rbac';
import { checkFatigueBlock } from './fatigueGuardrail';

export function resolveEffectivePermission(
  homeLocation: 'HQ' | 'SITE',
  viewingLocation: 'HQ' | 'SITE',
  activeDoaDelegation: { delegateApproverId: string; endDate: string } | null,
  userId: string
): { readOnly: boolean; canApprove: boolean } {
  const isCrossContext = homeLocation === 'HQ' && viewingLocation === 'SITE';
  if (!isCrossContext) return { readOnly: false, canApprove: true };
  const hasValidDoa =
    activeDoaDelegation?.delegateApproverId === userId &&
    new Date(activeDoaDelegation.endDate) > new Date();
  return { readOnly: !hasValidDoa, canApprove: hasValidDoa };
}

export async function validateApprovalGuardrails(
  approvalId: number,
  approverId: string,
  db: any
): Promise<{ allowed: boolean; reason?: string }> {
  // C.1 Self-Approval block
  const docResult = await db.query(
    'SELECT requester_id, overall_status FROM approval_documents WHERE approval_id = $1',
    [approvalId]
  );
  const approvalDoc = docResult.rows[0];
  if (approvalDoc?.requester_id === approverId) {
    return { allowed: false, reason: 'SELF_APPROVAL_FORBIDDEN_403' };
  }

  // C.2 Fatigue / Duplicate Shift block
  // daily_shift_assignments now exists (CMMS_Architecture.md §3.4). approval_documents
  // has no per-shift date field, so this evaluates fatigue as of "today" (the date the
  // approval action is taken) against requester_id (the person whose work is being
  // approved) — same requester-as-subject convention as ptwSelfApproval.ts's use of
  // workLeaderId.
  if (approvalDoc?.requester_id) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const fatigueResult = checkFatigueBlock(approvalDoc.requester_id, todayStr);
    if (fatigueResult.blocked) {
      return { allowed: false, reason: fatigueResult.reason };
    }
  }

  // C.3 Unqualified delegate block
  // NOTE: `approval_delegations` (CMMS_Architecture.md §3.3) has no `delegate_role`
  // column — role is only recorded on `user_accounts.role_code` (§3.5). Joining to
  // user_accounts here instead of querying a nonexistent delegate_role column.
  if (approvalDoc?.overall_status === 'DELEGATED') {
    const delegationResult = await db.query(
      `SELECT d.delegate_approver_id, u.role_code FROM approval_delegations d
       JOIN user_accounts u ON u.user_id = d.delegate_approver_id
       WHERE d.delegate_approver_id = $1 AND d.is_active = TRUE
       AND d.start_date <= NOW() AND d.end_date > NOW()`,
      [approverId]
    );
    const delegation = delegationResult.rows[0];
    if (!delegation || delegation.role_code !== 'ACTING_SITE_MANAGER') {
      return { allowed: false, reason: 'UNQUALIFIED_DELEGATE_HARD_BLOCKED' };
    }
  }

  return { allowed: true };
}

// C.4 Auditor Mode hard override — must be called before rolePermissionService's
// getEffectivePermission() is trusted for any mutation. HQ_SUPERVISOR_AUDITOR is
// blocked on all four mutation actions unconditionally, regardless of what a
// role_permissions seed row says (a seed row can be re-authored to grant
// can_update/can_create etc.; this check does not consult that data at all).
export function blockIfAuditorMode(
  roleCode: RoleCode,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE'
): { allowed: boolean; reason?: string } {
  if (roleCode === 'HQ_SUPERVISOR_AUDITOR') {
    return { allowed: false, reason: 'AUDITOR_MODE_MUTATION_BLOCKED' };
  }
  return { allowed: true };
}
