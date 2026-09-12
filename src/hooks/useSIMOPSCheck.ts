// src/hooks/useSIMOPSCheck.ts
//
// PURPOSE
//   CMMS_Architecture.md §5.2 (SIMOPS 공간 간섭 제어 알고리즘)의 클라이언트
//   dry-run 이식. SSOT 원본은 `db`(비동기 쿼리) 기반이지만, 이 프로젝트에는
//   아직 실행 중인 DB 레이어가 없으므로 usePTWPermits() 등에서 이미 로드된
//   인메모리 PTWPermit[]을 대상으로 동기 판정한다.
//
// NON-GOALS
//   - 이 훅은 판정만 한다 — RED(HARD_BLOCK)를 만나도 제출을 강제로 막지
//     않는다. 실제 차단/승인 게이트는 호출자(폼 제출 핸들러)의 책임이다.
//   - DB 기록(activePermits 조회 등)은 하지 않는다 — 순수 인메모리 스캔.

import { useMemo } from 'react';
import { PTWPermit, PTWType, PTWWorkflowStatus } from '../types/lng';

export type SimopsRiskLevel = 'RED' | 'AMBER' | 'GREEN';
export type SimopsAction = 'HARD_BLOCK' | 'SOFT_ESCALATE' | 'PROCEED';

export interface SimopsCheckResult {
  hasConflict: boolean;
  riskLevel: SimopsRiskLevel;
  actionRequired: SimopsAction;
  message?: string;
  /** DB 미기록·즉시 클라이언트 판정임을 명시하는 플래그 */
  isDryRun: true;
}

// SSOT §5.2 원본 매트릭스는 job_category 문자열 키를 사용한다.
// PTWType은 명칭이 일부 다르므로(CARGO_HANDLING vs CARGO_OPERATION) 매트릭스
// 조회 전 별칭 변환만 수행하고, 매트릭스 값 자체는 SSOT 그대로 이식한다.
// HEAVY_LIFTING 및 미정의 카테고리(CONFINED_SPACE/ELECTRICAL/EXCAVATION/
// RADIOGRAPHY)는 매트릭스에 없는 조합이며, SSOT와 동일하게 GREEN으로 기본
// 처리된다(아래 `?? 'GREEN'`).
// Exported (module-private previously) so simopsDbAdapter.ts can reuse the
// exact same matrix/alias/candidate-status rules for its DB-backed evaluation
// instead of duplicating them a third time (spec pseudocode is the second copy).
export const SIMOPS_CATEGORY_ALIAS: Partial<Record<PTWType, string>> = {
  CARGO_HANDLING: 'CARGO_OPERATION',
};

export const SIMOPS_INTERACTION_MATRIX: Record<string, Record<string, SimopsRiskLevel>> = {
  HOT_WORK: { CARGO_OPERATION: 'RED', HOT_WORK: 'AMBER', COLD_WORK: 'GREEN', HEAVY_LIFTING: 'RED' },
  CARGO_OPERATION: { HOT_WORK: 'RED', CARGO_OPERATION: 'AMBER', COLD_WORK: 'AMBER', HEAVY_LIFTING: 'RED' },
  HEAVY_LIFTING: { HOT_WORK: 'RED', CARGO_OPERATION: 'RED', COLD_WORK: 'AMBER', HEAVY_LIFTING: 'RED' },
};

// SSOT `whereIn('status', ['APPROVED_ISSUED', 'IN_PROGRESS'])`의 레거시 축 대응값.
export const ACTIVE_LEGACY_STATUSES: PTWWorkflowStatus[] = ['APPROVED', 'ACTIVE'];

export function toMatrixCategory(type: PTWType): string {
  return SIMOPS_CATEGORY_ALIAS[type] ?? type;
}

/**
 * 순수 함수 버전 — 훅 없이 단독 호출(테스트, 폼 제출 직전 재확인 등)이
 * 필요한 경우 이쪽을 직접 사용해도 된다.
 */
export function evaluateSimopsDryRun(
  newType: PTWType,
  workArea: string,
  equipmentTag: string,
  activePermits: PTWPermit[]
): SimopsCheckResult {
  const newCategory = toMatrixCategory(newType);

  // SSOT: work_area 또는 equipment_tag 중 하나라도 겹치는 활성 permit만 대상.
  const candidates = activePermits.filter(
    (p) =>
      ACTIVE_LEGACY_STATUSES.includes(p.status) &&
      ((!!workArea && p.workArea === workArea) || (!!equipmentTag && p.equipmentTag === equipmentTag))
  );

  for (const active of candidates) {
    const activeCategory = toMatrixCategory(active.type);
    const risk: SimopsRiskLevel = SIMOPS_INTERACTION_MATRIX[newCategory]?.[activeCategory] ?? 'GREEN';

    if (risk === 'RED') {
      return {
        hasConflict: true,
        riskLevel: 'RED',
        actionRequired: 'HARD_BLOCK',
        message: `SIMOPS Violation: ${newType} conflicts with active ${active.type} (${active.id}).`,
        isDryRun: true,
      };
    }
    if (risk === 'AMBER') {
      return {
        hasConflict: true,
        riskLevel: 'AMBER',
        actionRequired: 'SOFT_ESCALATE',
        message: `SIMOPS Warning: Secondary JSA and Site Manager approval required (conflicts with active ${active.type} ${active.id}).`,
        isDryRun: true,
      };
    }
  }

  return { hasConflict: false, riskLevel: 'GREEN', actionRequired: 'PROCEED', isDryRun: true };
}

/**
 * 신규 permit 작성 폼에서 실시간으로 SIMOPS 충돌 여부를 미리 보여주기 위한 훅.
 * activePermits는 호출자가 usePTWPermits().permits 등에서 전달한다.
 */
export function useSIMOPSCheck(
  newType: PTWType,
  workArea: string,
  equipmentTag: string,
  activePermits: PTWPermit[]
): SimopsCheckResult {
  return useMemo(
    () => evaluateSimopsDryRun(newType, workArea, equipmentTag, activePermits),
    [newType, workArea, equipmentTag, activePermits]
  );
}
