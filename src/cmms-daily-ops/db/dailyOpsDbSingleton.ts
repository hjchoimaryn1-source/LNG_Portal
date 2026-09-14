// src/cmms-daily-ops/db/dailyOpsDbSingleton.ts
//
// PURPOSE
//   getCmmsDb()가 반환하는 공유 SQLite 연결을 재사용하되(새 연결을 열지 않음),
//   Daily Ops 모듈 8개 테이블(daily_ops_patrol_entries, daily_report_snapshots
//   + 3개 child, pid_tag_coordinates, pid_tag_aliases,
//   monthly_isotank_reconciliation)만 이 모듈 자신의 책임으로 최초 1회 보강한다.
//
//   src/cmms-trucking/db/truckingDbSingleton.ts와 동일한 패턴 — cmmsDbSingleton.ts
//   자체는 수정하지 않는다(하드 바운더리).

import type { DatabaseSync } from 'node:sqlite';
import { getCmmsDb } from '../../adapters/db/cmmsDbSingleton';
import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import { ensureDailyOpsPatrolSchema } from './dailyOpsPatrolSchema';
import { ensureDailyReportSchema } from './dailyReportSchema';
import { ensurePidReconciliationSchema } from './pidReconciliationSchema';

let dailyOpsSchemaEnsured = false;

/** CMMS 공유 연결 + Daily Ops 8개 테이블이 보강된 SqlExecutor를 반환한다. */
export function getDailyOpsDb(): SqlExecutor {
  const db = getCmmsDb();
  if (!dailyOpsSchemaEnsured) {
    const raw = (db as SqlExecutor & { raw: DatabaseSync }).raw;
    ensureDailyOpsPatrolSchema(raw);
    ensureDailyReportSchema(raw);
    ensurePidReconciliationSchema(raw);
    dailyOpsSchemaEnsured = true;
  }
  return db;
}
