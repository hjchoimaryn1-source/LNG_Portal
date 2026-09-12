// src/adapters/simopsDbAdapter.ts
//
// PURPOSE
//   CMMS_Architecture.md §5.2 (SIMOPS 공간 간섭 제어 알고리즘)의 실제 DB-backed
//   이식. src/hooks/useSIMOPSCheck.ts(evaluateSimopsDryRun)는 호출한 브라우저
//   탭에 이미 로드된 permits[] 배열만 스캔하는 in-memory dry run이라, 다른
//   세션/기기에서 만들어진 permit은 보이지 않는다 — 이 어댑터는 permit_metadata
//   + ptw_permits.status + permit_suspension_state를 실제로 조회해 그 한계를
//   보완하는 두 번째(권위 있는) 판정 소스를 제공한다.
//
// NON-GOALS
//   - 기존 client-side dry run(useNewPTWPermitForm.ts의 제출 게이트)을
//     대체하지 않는다 — 그 게이트는 오프라인/즉시성 우선의 UX 안전장치로
//     그대로 둔다. 이 어댑터는 /api/v1/cmms/simops-check를 통해 별도로
//     조회 가능한 진짜 DB 소스일 뿐이다.
//   - 매트릭스/별칭 규칙을 다시 정의하지 않는다 — useSIMOPSCheck.ts에서 그대로
//     import해 재사용한다(세 번째 사본을 만들지 않기 위함).

import type { SqlExecutor } from './db/sqlExecutor';
import { getCmmsDb } from './db/cmmsDbSingleton';
import { selectAllPermitMetadata } from './db/permitMetadataDao';
import { selectAllPermitLifecycle } from './db/ptwPermitDao';
import { selectActiveSuspensions } from './db/permitSuspensionDao';
import {
  SIMOPS_INTERACTION_MATRIX,
  ACTIVE_LEGACY_STATUSES,
  toMatrixCategory,
  type SimopsRiskLevel,
  type SimopsAction,
} from '../hooks/useSIMOPSCheck';
import type { PTWType } from '../types/lng';

export interface SimopsDbCheckResult {
  hasConflict: boolean;
  riskLevel: SimopsRiskLevel;
  actionRequired: SimopsAction;
  message?: string;
  /** DB-backed 실 조회 결과임을 명시 — useSIMOPSCheck.ts의 isDryRun:true와 대비. */
  isDryRun: false;
}

/**
 * 실제 permit_metadata + ptw_permits.status(+정지 상태 제외)를 조회해 SIMOPS
 * 간섭을 판정한다. evaluateSimopsDryRun과 동일한 매트릭스/후보 규칙을
 * 재사용하되, 소스가 "이 브라우저의 메모리"가 아니라 DB 전체다.
 */
export function evaluateSimopsInterferenceDb(
  newType: PTWType,
  workArea: string,
  equipmentTag: string,
  db: SqlExecutor = getCmmsDb()
): SimopsDbCheckResult {
  const metadata = selectAllPermitMetadata(db);
  const lifecycleByPermit = new Map(selectAllPermitLifecycle(db).map((p) => [p.permitId, p]));
  const suspendedPermitIds = new Set(selectActiveSuspensions(db).map((s) => s.permitRefNo));

  const newCategory = toMatrixCategory(newType);

  const candidates = metadata.filter((m) => {
    const lifecycle = lifecycleByPermit.get(m.permitRefNo);
    if (!lifecycle || suspendedPermitIds.has(m.permitRefNo)) return false;
    if (!ACTIVE_LEGACY_STATUSES.includes(lifecycle.status)) return false;
    return (!!workArea && m.workArea === workArea) || (!!equipmentTag && m.equipmentTag === equipmentTag);
  });

  for (const active of candidates) {
    const activeCategory = toMatrixCategory(active.ptwType as PTWType);
    const risk: SimopsRiskLevel = SIMOPS_INTERACTION_MATRIX[newCategory]?.[activeCategory] ?? 'GREEN';

    if (risk === 'RED') {
      return {
        hasConflict: true,
        riskLevel: 'RED',
        actionRequired: 'HARD_BLOCK',
        message: `SIMOPS Violation: ${newType} conflicts with active ${active.ptwType} (${active.permitRefNo}).`,
        isDryRun: false,
      };
    }
    if (risk === 'AMBER') {
      return {
        hasConflict: true,
        riskLevel: 'AMBER',
        actionRequired: 'SOFT_ESCALATE',
        message: `SIMOPS Warning: Secondary JSA and Site Manager approval required (conflicts with active ${active.ptwType} ${active.permitRefNo}).`,
        isDryRun: false,
      };
    }
  }

  return { hasConflict: false, riskLevel: 'GREEN', actionRequired: 'PROCEED', isDryRun: false };
}
