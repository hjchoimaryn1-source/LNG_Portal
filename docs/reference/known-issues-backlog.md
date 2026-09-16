# Known Issues Backlog

Re-created in Stage 3 RE-EXECUTION (2026-09-16) after a prior session's `known-issues-backlog.md`
(commit `afabe93`) was found not to exist in this repo (`LNG_Portal`, branch
`feat/cmms-field-guard-stage1`). Entries below are based only on this repo's actual Step 0 findings,
not on any prior session's unverified claims.

## 1. Timezone/date handling gap — HMI Overview

**Status**: not confirmed as a live bug. A prior session raised a "UTC vs WIB off-by-one" concern for
HMI Overview; that could not be reproduced or confirmed here, because date-scoping isn't functionally
implemented yet — there's nothing for a timezone conversion to be off-by-one *in*.

**Findings**:
- `src/cmms-daily-ops/hmi-overview/useOverviewHmiData.ts` takes a `reportDate` parameter but does not
  use it: `void reportDate; // see header note — the B2 store has no date-scoped query.` The B2 store
  (`useDailyOpsPatrolStore.ts`) only ever holds each `(domain, equipmentTag, columnName)`'s single latest
  value across *all* dates — there is no date-scoped query this store can currently answer.
- `generatedAt` in the same hook uses `new Date().toISOString()` (UTC, no timezone conversion).
- No WIB (UTC+7) / `Asia/Jakarta` specific timezone-handling logic exists anywhere under
  `src/cmms-daily-ops/**` (checked via repo-wide search for `WIB`, `UTC+7`, `Jakarta`, `getTodayDate`).

**Action item**: when date-scoped filtering is eventually implemented for HMI Overview (i.e. when
`reportDate` in `useOverviewHmiData.ts` becomes functionally used), WIB (UTC+7) conversion must be
applied explicitly at that point — there is no existing WIB helper to reuse, so one will need to be
introduced. See `src/cmms-daily-ops/hmi-overview/useOverviewHmiData.ts` for the currently-unused
`reportDate` parameter.

## 2. Session/RBAC gaps

**Session backend**: `src/lib/rbac/activeSessionStore.ts` and `src/cmms-auth/sessionStore.ts` are
dev-only in-memory adapters — session state resets on page refresh and neither backs onto a real
`user_sessions` table or issued token. This is confirmed by the source's own header comments
(`activeSessionStore.ts`: "DEV-ONLY in-memory session bridge... 새로고침 시 초기화되며 user_sessions
테이블/토큰 발급을 대체하지 않는다"). Not a Stage 3 regression — pre-existing, out of scope for this
pass.

**Role checks that DO exist and ARE server-revalidated** (via
`getEffectivePermission()` in `src/lib/rbac/rolePermissionService.ts`):
- `DAILY_OPS_REPORT` (approval/reject/HQ-edit-window flow) —
  `daily-report-approval/route.ts`, `daily-report-reject/route.ts`,
  `daily-report-hq-edit-open/route.ts`, `daily-report-hq-edit-ack/route.ts`,
  `daily-report-hq-edit-close/route.ts`.
- `DAILY_OPS_PATROL_ENTRY` (this session's Stage 3 Step 1, commit `4c243a9`) —
  `daily-ops-patrol-entries/route.ts` (`POST`), gated before the existing APPROVED-lock check.

**Routes under `src/app/api/v1/cmms/**` with NO server-side role re-validation found** (checked this
session via repo-wide search for `getEffectivePermission`, `roleCode`, `evaluateMutationGuardrails`,
`blockIfAuditorMode`, `requireRole`, `validatePtwSelfApproval`, `Authorization`,
`resolveEffectivePermission`, `checkFatigueBlock` — none of these appear in the files below):

- `alarm-action-log/route.ts`
- `alarm-current-state/route.ts`
- `alarm-setpoint-overrides/route.ts`
- `assets/route.ts`
- `bootstrap/route.ts`
- `daily-ops-shift-input-status/route.ts`
- `daily-report-critical-events/route.ts`
- `daily-report-safety-notes/route.ts`
- `daily-report-signatures/route.ts`
- `daily-report-snapshots/route.ts`
- `daily-report-status-log/route.ts`
- `environment/route.ts`
- `gas-tests/route.ts`
- `moc/route.ts`
- `mro-inventory/route.ts`
- `mro-inventory/adjustments/route.ts`
- `mro-inventory/requisitions/route.ts`
- `overview/summary/route.ts`
- `permit-metadata/route.ts`
- `permit-suspensions/route.ts`
- `pid-tag-aliases/route.ts`
- `pid-tag-coordinates/route.ts`
- `ptw-permits/route.ts`
- `ptw-permits/sync-conflicts/route.ts`
- `ptw-signatures/route.ts`
- `simops-check/route.ts`
- `trucking-inspections/route.ts`
- `work-orders/route.ts`

`auth/login/route.ts` is excluded from the list above — it is the pre-authentication login endpoint
itself, so a role check there is not applicable by definition.

This list was produced by a keyword search across this session's known RBAC entry points, not by
reading each route's full body line-by-line — a route could in principle gate on something this search
didn't cover. If any of the above turn out to accept role-sensitive mutations (write/approve/delete),
this should be scoped and re-audited as its own pass rather than assumed safe by omission.
