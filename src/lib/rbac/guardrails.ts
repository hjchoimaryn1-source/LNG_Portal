import type { RBACSessionGuard } from '../../types/rbac';

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
  // PART A re-verification (this session) confirmed: no `daily_shift_assignments` table
  // exists anywhere in src/ or the SQL schema files (src/db/schema/cmms_schema.sql,
  // schema/cmms_schema.sqlite.sql). `StaffPersonnel.todayShift` (src/types/lng.ts:316)
  // exists only as a frontend TypeScript field populated from generated mock data
  // (src/data/manpowerMasterData.ts) — it has no backing column/table in either real SQL
  // schema file, so there is nothing for the `db` client here to query. Querying a
  // nonexistent `staff_personnel`/shift table would mean fabricating schema, which is
  // explicitly out of scope. Left as a no-op pending a real daily_shift_assignments
  // (or equivalent) table.
  // TODO(fatigue-block): no shift-assignment schema found — see PART A findings, needs
  // real table before this check can be enforced.

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
