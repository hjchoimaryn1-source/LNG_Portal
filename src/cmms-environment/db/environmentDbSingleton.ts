// src/cmms-environment/db/environmentDbSingleton.ts
//
// PURPOSE
//   getCmmsDb()가 반환하는 공유 SQLite 연결을 재사용하되(새 연결을 열지 않음),
//   NP-10 환경/폐기물 모듈 6개 테이블(env_air_quality_logs/env_wastewater_logs/
//   env_noise_logs/env_seawater_logs/env_waste_transfer_logs/env_thws_inventory)만
//   이 모듈 자신의 책임으로 최초 1회 보강한다.
//
//   src/adapters/db/cmmsDbSingleton.ts에는 외부 모듈이 자기 DDL을 등록할
//   확장 지점이 없어(environmentSchema.ts 헤더 참고) 그 파일 자체는 수정하지
//   않는다 — src/cmms-trucking/db/truckingDbSingleton.ts와 동일한 병렬 싱글턴
//   패턴을 그대로 재사용한다.

import type { DatabaseSync } from 'node:sqlite';
import { getCmmsDb } from '../../adapters/db/cmmsDbSingleton';
import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import { ensureEnvironmentSchema } from './environmentSchema';

let environmentSchemaEnsured = false;

/** CMMS 공유 연결 + 환경/폐기물 6개 테이블이 보강된 SqlExecutor를 반환한다. */
export function getEnvironmentDb(): SqlExecutor {
  const db = getCmmsDb();
  if (!environmentSchemaEnsured) {
    const raw = (db as SqlExecutor & { raw: DatabaseSync }).raw;
    ensureEnvironmentSchema(raw);
    environmentSchemaEnsured = true;
  }
  return db;
}
