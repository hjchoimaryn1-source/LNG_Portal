// src/types/node-sqlite.d.ts
//
// PURPOSE
//   현재 설치된 @types/node(^20)에는 Node.js 22+에서 추가된 내장 모듈
//   'node:sqlite'의 타입 선언이 없다. 이 파일이 최소 필요한 범위만
//   앰비언트로 선언해서 tsc/Next.js 빌드 타입체크를 통과시킨다.
//
//   나중에 @types/node를 22 이상으로 업그레이드하면 이 파일은 삭제해도 된다
//   (공식 타입 선언과 충돌 방지를 위해 그때는 꼭 지울 것).

declare module 'node:sqlite' {
  export class DatabaseSync {
    constructor(path: string, options?: { readOnly?: boolean });
    exec(sql: string): void;
    prepare(sql: string): {
      run(params?: Record<string, unknown>): { changes: number; lastInsertRowid: number | bigint };
      get(params?: Record<string, unknown>): Record<string, unknown> | undefined;
      all(params?: Record<string, unknown>): Record<string, unknown>[];
    };
    close(): void;
  }
}
