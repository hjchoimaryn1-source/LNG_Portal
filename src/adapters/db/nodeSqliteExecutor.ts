// src/adapters/db/nodeSqliteExecutor.ts
//
// PURPOSE
//   SqlExecutor 인터페이스의 레퍼런스 구현체. Node.js 22+ 내장
//   `node:sqlite`(DatabaseSync)를 사용하므로 별도 npm 의존성(better-sqlite3 등)
//   없이 바로 동작한다. Phase 1 검증/로컬 개발용으로 우선 제공하며,
//   프로덕션 배포 환경의 Node 버전 정책에 따라 better-sqlite3 등으로
//   교체해도 SqlExecutor 인터페이스만 만족하면 나머지 어댑터 코드는 무수정이다.
//
// 주의: node:sqlite는 아직 Experimental API다 (Node 22 기준). 안정화 전까지는
//       프로덕션에서 이 파일 대신 better-sqlite3 기반 구현체 사용을 권장한다.

import { DatabaseSync } from 'node:sqlite';
import type { SqlExecutor } from './sqlExecutor';

export function createNodeSqliteExecutor(dbPath: string): SqlExecutor & { close(): void; raw: DatabaseSync } {
  const raw = new DatabaseSync(dbPath);
  raw.exec('PRAGMA foreign_keys = ON;');

  return {
    raw,
    run(sql, params = {}) {
      raw.prepare(sql).run(params as Record<string, unknown>);
    },
    get<T = Record<string, unknown>>(sql: string, params: Record<string, unknown> = {}): T | undefined {
      return raw.prepare(sql).get(params) as T | undefined;
    },
    all<T = Record<string, unknown>>(sql: string, params: Record<string, unknown> = {}): T[] {
      return raw.prepare(sql).all(params) as T[];
    },
    close() {
      raw.close();
    },
  };
}

/** 스키마 파일(schema/cmms_schema.sqlite.sql) 전체를 그대로 실행하는 헬퍼 */
export function loadSchema(raw: DatabaseSync, schemaSql: string): void {
  raw.exec(schemaSql);
}
