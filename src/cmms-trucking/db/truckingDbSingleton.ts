// src/cmms-trucking/db/truckingDbSingleton.ts
//
// PURPOSE
//   getCmmsDb()가 반환하는 공유 SQLite 연결을 재사용하되(새 연결을 열지 않음),
//   트럭킹 모듈 3개 테이블(truck_inspections/truck_inspection_items/
//   truck_incident_log)만 이 모듈 자신의 책임으로 최초 1회 보강한다.
//
//   src/adapters/db/cmmsDbSingleton.ts에는 외부 모듈이 자기 DDL을 등록할
//   확장 지점이 없어(truckingSchema.ts 헤더 참고) 그 파일 자체는 수정하지
//   않는다 — 대신 이 파일이 "같은 연결 위에 우리 테이블만 추가로 보강"하는
//   방식으로 하드 바운더리(싱글턴 무수정)를 지킨다.
//
//   getCmmsDb()의 선언 반환 타입은 SqlExecutor(raw 없음)이지만 실제 구현체
//   (nodeSqliteExecutor.ts)는 항상 raw: DatabaseSync를 갖는다 — 그 계약에만
//   의존해 좁게 캐스팅한다.

import type { DatabaseSync } from 'node:sqlite';
import { getCmmsDb } from '../../adapters/db/cmmsDbSingleton';
import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import { ensureTruckingSchema } from './truckingSchema';

let truckingSchemaEnsured = false;

/** CMMS 공유 연결 + 트럭킹 3개 테이블이 보강된 SqlExecutor를 반환한다. */
export function getTruckingDb(): SqlExecutor {
  const db = getCmmsDb();
  if (!truckingSchemaEnsured) {
    const raw = (db as SqlExecutor & { raw: DatabaseSync }).raw;
    ensureTruckingSchema(raw);
    truckingSchemaEnsured = true;
  }
  return db;
}
