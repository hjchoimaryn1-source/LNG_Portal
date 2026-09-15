// src/cmms-daily-ops/utils/dailyOpsDateHelpers.ts
//
// PURPOSE
//   Daily Ops Sub-stage C. 순수 함수 — React 미의존(AGENTS.md §3 Logic/Data Layer 컨벤션).

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
