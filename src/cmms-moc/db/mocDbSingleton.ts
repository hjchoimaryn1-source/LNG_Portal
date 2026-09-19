// src/cmms-moc/db/mocDbSingleton.ts
//
// PURPOSE
//   getCmmsDb()가 반환하는 공유 SQLite 연결을 재사용하되(새 연결을 열지 않음),
//   NP-12 MOC 모듈 2개 테이블(moc_plan_of_change/moc_completion_report)만 이
//   모듈 자신의 책임으로 최초 1회 보강한다.
//
//   src/adapters/db/cmmsDbSingleton.ts에는 외부 모듈이 자기 DDL을 등록할
//   확장 지점이 없어 그 파일 자체는 수정하지 않는다 — src/cmms-environment/db/
//   environmentDbSingleton.ts / src/cmms-trucking/db/truckingDbSingleton.ts와
//   동일한 병렬 싱글턴 패턴을 그대로 재사용한다. schema.sql 로딩 방식은
//   src/cmms-mro-bridge/crosswalkDb.ts의 ensureCrosswalkSchema()를 따른다.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCmmsDb } from '../../adapters/db/cmmsDbSingleton';
import type { SqlExecutor } from '../../adapters/db/sqlExecutor';

let mocSchemaEnsured = false;

function ensureMocSchema(db: SqlExecutor): void {
  const here = dirname(fileURLToPath(import.meta.url));
  const sql = readFileSync(join(here, 'schema.sql'), 'utf8');
  const statements = sql
    .replace(/--.*$/gm, '')
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  for (const stmt of statements) db.run(stmt);
}

/** CMMS 공유 연결 + MOC 2개 테이블이 보강된 SqlExecutor를 반환한다. */
export function getMocDb(): SqlExecutor {
  const db = getCmmsDb();
  if (!mocSchemaEnsured) {
    ensureMocSchema(db);
    mocSchemaEnsured = true;
  }
  return db;
}
