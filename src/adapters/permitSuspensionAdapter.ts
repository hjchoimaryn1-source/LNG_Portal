// src/adapters/permitSuspensionAdapter.ts
//
// PURPOSE
//   CMMS_Architecture.md §5.3 (AGT 가스 측정 4시간 타임아웃 & 시프트 교대 경계
//   자동 Suspended 엔진)의 on-demand 이식. SSOT 원본은 node-cron 기반 상시
//   백그라운드 프로세스지만, 이 앱에는 장기 실행 서버 프로세스가 없으므로
//   (Next.js 요청/응답 모델) 대신 읽기/쓰기 경로가 호출될 때마다 그 시점
//   기준으로 판정을 다시 계산하고 permit_suspension_state에 반영한다.
//
// NON-GOALS
//   - 실제 legacy status를 SUSPENDED로 바꾸지 않는다 — ptw_permits.status의
//     CHECK 제약(DRAFT/PREPARED/APPROVED/ACTIVE/CLOSED)은 그대로 둔다.
//     정지 여부는 이 파일이 관리하는 별도 축(permit_suspension_state)이며,
//     ptwStatusMapper.ts가 이미 예견한 "레거시엔 없는 축" 설계와 일치한다.
//   - 정지 해제(clear)는 이 파일이 자동으로 하지 않는다 — AGT_GAS_TIMEOUT은
//     새로운 가스 측정이 기록되는 순간 자연히 해소되고(다음 평가 시 최신
//     tested_at이 4시간 이내가 됨), SHIFT_CHANGE는 명시적 인수인계 확인
//     (acknowledgeShiftHandover)을 통해서만 해제된다.

import type { SqlExecutor } from './db/sqlExecutor';
import { getCmmsDb } from './db/cmmsDbSingleton';
import { selectAllPermitLifecycle } from './db/ptwPermitDao';
import {
  selectActiveSuspensions,
  upsertActiveSuspension,
  clearSuspension,
  type PermitSuspensionReason,
  type PermitSuspensionRow,
} from './db/permitSuspensionDao';
import { upsertShiftAck, selectAllShiftAcks } from './db/permitShiftAckDao';
import { getLatestTestedAtByPermit } from './gasSafetyAdapter';

const AGT_TIMEOUT_HOURS = 4;
const SHIFT_BOUNDARY_HOURS = [7, 19]; // 07:00 / 19:00 local-equivalent (ISO UTC 기준 그대로 비교)

/** now 이하의 가장 최근 시프트 경계 시각(ISO)을 계산한다. */
function latestShiftBoundaryAtOrBefore(now: Date): Date {
  const boundary = new Date(now);
  const candidates = SHIFT_BOUNDARY_HOURS.map((h) => {
    const d = new Date(now);
    d.setUTCHours(h, 0, 0, 0);
    return d;
  }).filter((d) => d.getTime() <= now.getTime());

  if (candidates.length > 0) {
    return candidates.reduce((latest, d) => (d.getTime() > latest.getTime() ? d : latest));
  }
  // now가 오늘의 첫 경계(07:00)보다 이르면 어제 19:00이 가장 최근 경계다.
  boundary.setUTCDate(boundary.getUTCDate() - 1);
  boundary.setUTCHours(19, 0, 0, 0);
  return boundary;
}

export interface SuspensionDecision {
  shouldBeSuspended: boolean;
  reason: PermitSuspensionReason | null;
}

/**
 * 순수 판정 함수 — §5.3 규칙 그대로:
 *   1) 마지막 가스 측정(latestGasTestAt)이 4시간 이상 경과(또는 측정 기록 자체가
 *      없음) -> AGT_GAS_TIMEOUT.
 *   2) 가장 최근 시프트 경계(07:00/19:00)가 이 permit의 마지막 확인(lastShiftAckAt)
 *      이후에 지났음 -> SHIFT_CHANGE.
 * 이미 활성 정지 중이면(activeSuspension) 같은 사유가 여전히 유효한지만 재확인한다.
 */
export function deriveSuspensionDecision(
  nowIso: string,
  latestGasTestAt: string | undefined,
  lastShiftAckAt: string | undefined,
  activeSuspension: PermitSuspensionRow | undefined
): SuspensionDecision {
  const now = new Date(nowIso);

  const gasStale =
    !latestGasTestAt || now.getTime() - new Date(latestGasTestAt).getTime() > AGT_TIMEOUT_HOURS * 60 * 60 * 1000;

  const latestBoundary = latestShiftBoundaryAtOrBefore(now);
  const shiftStale = !lastShiftAckAt || new Date(lastShiftAckAt).getTime() < latestBoundary.getTime();

  if (!gasStale && !shiftStale) {
    return { shouldBeSuspended: false, reason: null };
  }

  // 이미 특정 사유로 활성 정지 중이면 그 사유를 유지한다(사유가 둘 다 유효해도
  // 임의로 갈아치우지 않음 — 정지 해제는 각 사유별 별도 경로로만 일어난다).
  if (activeSuspension && ((activeSuspension.reason === 'AGT_GAS_TIMEOUT' && gasStale) || (activeSuspension.reason === 'SHIFT_CHANGE' && shiftStale))) {
    return { shouldBeSuspended: true, reason: activeSuspension.reason };
  }

  return { shouldBeSuspended: true, reason: gasStale ? 'AGT_GAS_TIMEOUT' : 'SHIFT_CHANGE' };
}

/**
 * status='ACTIVE'인 모든 permit에 대해 정지 여부를 재평가하고
 * permit_suspension_state를 갱신한 뒤, 현재 활성 정지 집합을 반환한다.
 * 읽기 경로(GET /ptw-permits)와 쓰기 경로(applyPermitUpdateWithConflictCheck)
 * 양쪽에서 호출된다 — 타이머 없이 호출 시점 기준으로만 판정한다.
 */
export function evaluateAndSyncSuspensions(db: SqlExecutor = getCmmsDb(), nowIso: string = new Date().toISOString()): PermitSuspensionRow[] {
  const activePermits = selectAllPermitLifecycle(db).filter((p) => p.status === 'ACTIVE');
  const latestGasTestByPermit = getLatestTestedAtByPermit();
  const shiftAckByPermit = selectAllShiftAcks(db);
  const activeSuspensionsByPermit = new Map(selectActiveSuspensions(db).map((s) => [s.permitRefNo, s]));

  for (const permit of activePermits) {
    const existing = activeSuspensionsByPermit.get(permit.permitId);
    const decision = deriveSuspensionDecision(
      nowIso,
      latestGasTestByPermit.get(permit.permitId),
      shiftAckByPermit.get(permit.permitId),
      existing
    );

    if (decision.shouldBeSuspended && decision.reason) {
      if (!existing || existing.reason !== decision.reason) {
        upsertActiveSuspension(db, { permitRefNo: permit.permitId, reason: decision.reason, suspendedAt: nowIso });
      }
    } else if (existing) {
      clearSuspension(db, permit.permitId, nowIso);
    }
  }

  return selectActiveSuspensions(db);
}

/**
 * Site Manager/HSSE가 시프트 인수인계를 확인했음을 기록 — SHIFT_CHANGE 정지의
 * 유일한 해제 경로. permit_shift_ack에 확인 시각을 남겨 다음 평가에서 같은
 * 경계로 즉시 재정지되지 않도록 하고, 현재 활성 정지가 SHIFT_CHANGE라면 함께 해제한다.
 */
export function acknowledgeShiftHandover(permitId: string, ackIso: string = new Date().toISOString()): void {
  const db = getCmmsDb();
  upsertShiftAck(db, permitId, ackIso);
  const existing = selectActiveSuspensions(db).find((s) => s.permitRefNo === permitId);
  if (existing?.reason === 'SHIFT_CHANGE') {
    clearSuspension(db, permitId, ackIso);
  }
}
