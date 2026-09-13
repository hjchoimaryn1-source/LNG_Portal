// src/adapters/guardrailUiAdapter.ts
//
// Phase 3 (MOD_1~5 가드레일 UI 확산) 공용 진입점. blockIfAuditorMode(항상 우선 체크)와
// checkFatigueBlock(userId+targetDate가 있는 지점에서만)을 하나의 판정으로 통합한다.
// PTW의 validatePtwSelfApproval처럼 이 유틸로 대체할 수 없는 모듈 고유 체크는 각
// 호출부에서 별도로 병행 호출한다 (이 어댑터는 그 자리를 대신하지 않음).

import type { RoleCode } from '../types/rbac';
import { blockIfAuditorMode } from '../lib/rbac/guardrails';
import { checkFatigueBlock } from '../lib/rbac/fatigueGuardrail';

export interface GuardrailMutationContext {
  roleCode: RoleCode;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE';
  fatigueCheck?: { userId: string; targetDate: string };
}

export function evaluateMutationGuardrails(
  ctx: GuardrailMutationContext
): { allowed: boolean; reason?: string; warning?: string } {
  const auditorGuard = blockIfAuditorMode(ctx.roleCode, ctx.action);
  if (!auditorGuard.allowed) {
    return auditorGuard;
  }

  if (ctx.fatigueCheck) {
    const fatigueGuard = checkFatigueBlock(ctx.fatigueCheck.userId, ctx.fatigueCheck.targetDate);
    if (fatigueGuard.blocked) {
      return { allowed: false, reason: fatigueGuard.reason };
    }
    // No shift history (new onboarding) — allowed (fail-open), but surfaced to
    // the caller so the UI can show a non-blocking onboarding notice.
    if (fatigueGuard.warning) {
      return { allowed: true, warning: fatigueGuard.warning };
    }
  }

  return { allowed: true };
}
