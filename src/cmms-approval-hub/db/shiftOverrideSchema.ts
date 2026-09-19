// src/cmms-approval-hub/db/shiftOverrideSchema.ts
//
// PURPOSE
//   Approval Hub Phase 1 — Stage 1c. Shift Override는 지금까지 DB 테이블/API가
//   전혀 없이 localStorage(NIAS_SITE_MANAGER_OVERRIDES)에만 있었다(Step 0 확인).
//   신규 도메인이므로 src/cmms-daily-ops/db/dailyOpsPatrolSchema.ts와 동일한
//   "CREATE TABLE IF NOT EXISTS + executor.raw.exec()" 컨벤션을 따른다.
//
//   approval_status는 work_orders/mro_purchase_requisitions(approvalHubStage1Runner.ts)
//   와 동일한 3값 체계('PENDING_SITE_APPROVAL','SITE_APPROVED','REJECTED')를 쓴다.
//   단, SiteManagerOverrideModal.tsx의 "Authorize Override" 액션은 Site Manager가
//   직접 승인자로서 즉시 확정하는 흐름이라(approvedBy/approvedAt이 저장 시점에
//   이미 채워짐), 이 테이블에 쓰는 행은 항상 approval_status='SITE_APPROVED'로
//   기록된다 — 별도의 "대기 중 요청" 작성 경로는 이번 범위에 없다.

import type { DatabaseSync } from 'node:sqlite';

export const SHIFT_OVERRIDES_DDL = `
  CREATE TABLE IF NOT EXISTS shift_overrides (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id        TEXT NOT NULL,
      target_date     TEXT NOT NULL,
      override_type   TEXT NOT NULL CHECK (override_type IN ('EXTEND_STAY_14D','FORCE_SHIFT')),
      assigned_shift  TEXT NOT NULL CHECK (assigned_shift IN ('D','N','R','OFF')),
      reason          TEXT NOT NULL,
      requested_by    TEXT NOT NULL,
      approval_status TEXT NOT NULL DEFAULT 'PENDING_SITE_APPROVAL'
          CHECK (approval_status IN ('PENDING_SITE_APPROVAL','SITE_APPROVED','REJECTED')),
      approved_by     TEXT,
      approved_at     TEXT,
      created_at      TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE INDEX IF NOT EXISTS idx_shift_overrides_staff_date ON shift_overrides(staff_id, target_date DESC);
  CREATE INDEX IF NOT EXISTS idx_shift_overrides_status ON shift_overrides(approval_status);
`;

/** shift_overrides 테이블을 멱등(idempotent)하게 보강한다. */
export function ensureShiftOverrideSchema(raw: DatabaseSync): void {
  raw.exec(SHIFT_OVERRIDES_DDL);
}
