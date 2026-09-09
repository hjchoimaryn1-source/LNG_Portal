// src/adapters/db/sqlExecutor.ts
//
// PURPOSE
//   gasSafetyAdapter.ts / permitPersistenceAdapter.ts가 공통으로 사용하는
//   최소 DB 실행 인터페이스. 특정 드라이버(better-sqlite3, node:sqlite,
//   Prisma 등)에 종속되지 않도록 추상화한다.
//
//   실제 프로젝트에서는 이 인터페이스를 만족하는 어댑터를 한 번만 구현해서
//   주입하면 된다. 예:
//
//     import Database from 'better-sqlite3';
//     const raw = new Database('nias_cmms.db');
//     const db: SqlExecutor = {
//       run: (sql, params) => { raw.prepare(sql).run(params ?? {}); },
//       get: (sql, params) => raw.prepare(sql).get(params ?? {}) as any,
//       all: (sql, params) => raw.prepare(sql).all(params ?? {}) as any,
//     };
//
//   테스트/샌드박스 환경에서는 이 파일 하단의 createInMemoryFakeExecutor()로
//   대체해 로직만 검증할 수 있다 (프로덕션 사용 금지 — 영속성 없음).

export interface SqlExecutor {
  /** INSERT/UPDATE/DELETE 등 결과 row를 반환하지 않는 쓰기 실행 */
  run(sql: string, params?: Record<string, unknown>): void;
  /** 단일 row 조회 */
  get<T = Record<string, unknown>>(sql: string, params?: Record<string, unknown>): T | undefined;
  /** 다중 row 조회 */
  all<T = Record<string, unknown>>(sql: string, params?: Record<string, unknown>): T[];
}

/**
 * 순수 인메모리 Fake 구현체 — 단위테스트/로직 검증 전용.
 * 실제 SQL을 파싱하지 않고, 테이블별 배열에 단순 저장만 한다.
 * gasSafetyAdapter.ts / permitPersistenceAdapter.ts의 자체 테스트에서만 사용한다.
 */
export function createInMemoryFakeExecutor() {
  const tables: Record<string, Record<string, unknown>[]> = {};

  function tableNameFromInsert(sql: string): string | null {
    const m = /INSERT\s+INTO\s+(\w+)/i.exec(sql);
    return m ? m[1] : null;
  }

  const executor: SqlExecutor & { _tables: typeof tables } = {
    _tables: tables,
    run(sql, params = {}) {
      const table = tableNameFromInsert(sql);
      if (!table) return; // UPSERT/UPDATE 등은 이 fake에서는 no-op (permitPersistenceAdapter 테스트에서 별도 처리)
      if (!tables[table]) tables[table] = [];
      tables[table].push({ ...params });
    },
    get(sql, params = {}) {
      const table = /FROM\s+(\w+)/i.exec(sql)?.[1];
      if (!table || !tables[table]) return undefined;
      return tables[table][tables[table].length - 1] as any;
    },
    all(sql, params = {}) {
      const table = /FROM\s+(\w+)/i.exec(sql)?.[1];
      if (!table || !tables[table]) return [];
      return tables[table] as any[];
    },
  };
  return executor;
}
