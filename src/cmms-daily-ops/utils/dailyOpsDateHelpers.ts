// src/cmms-daily-ops/utils/dailyOpsDateHelpers.ts
//
// PURPOSE
//   Daily Ops Sub-stage C. 순수 함수 — React 미의존(AGENTS.md §3 Logic/Data Layer 컨벤션).
//
//   Stage 3 Step 2 (field-guard follow-up): today() above is plain UTC — no
//   WIB (Asia/Jakarta, UTC+7) conversion. todayWib() below mirrors the +7h
//   offset technique already used by src/utils/manningCompliance.ts's
//   getWibDate (reimplemented here rather than imported, since that file is
//   manpower-domain-specific and cmms-daily-ops/** shouldn't depend on it
//   for an unrelated date utility). Not yet wired into any reportDate call
//   site — see useOverviewHmiData.ts's header note on its unused param.

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/** WIB (UTC+7) -correct "today", as an ISO YYYY-MM-DD string. */
export function todayWib(): string {
  return new Date(Date.now() + WIB_OFFSET_MS).toISOString().slice(0, 10);
}
