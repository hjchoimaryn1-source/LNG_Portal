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

**Session-expiry UX (Stage 3 Step 3, this session)**: `activeSession` can go `null` mid-use without a
full page remount — `LNGPortalApp.tsx`'s `isAuthenticated` is a separate local `useState`, decoupled
from `activeSessionStore`, so the only organic trigger for this is something that resets the
`activeSessionStore` module singleton (e.g. a Next.js dev Fast Refresh) while the already-mounted app
tree keeps its React state. Before this session, 8 UI entry points had no re-login prompt for that case:
`OverviewCalibrationRoutes.tsx` silently substituted a `FALLBACK_SESSION` (`DEV_HQ_USER`) identity, and
`useWorkOrders.ts`/`useCargoHandlingLifecycle.ts`/`useMroInventory.ts`/`PTWStatusActions.tsx`/
`NiasCustodySettlementTab.tsx`/`SettlementAuditView.tsx`/`useNewPTWPermitForm.ts` all fail-open (skip the
guardrail check and proceed with the mutation) with zero message. Fixed this session — see the fix
commit for exact diffs. `usePatrolSaveHandler.ts`, `useAlarmActionLog.ts`, `useDailyReportApproval.ts`,
and `useHqEditWindow.ts` already showed a clear message and needed no change.

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
`resolveEffectivePermission`, `checkFatigueBlock` — none of these appear in the files below).
`auth/login/route.ts` is excluded — it is the pre-authentication login endpoint itself, so a role check
there is not applicable by definition.

**Priority rule**: HIGH = write-capable AND reachable today by any non-auditor role (client-side
`evaluateMutationGuardrails` only blocks AUDITOR-mode/fatigued callers — it does **not** check role at
all, so it does not restrict *which* roles reach these routes; several routes below have no client-side
check whatsoever). MEDIUM = write-capable but low blast-radius (idempotent seed-if-empty, or explicitly
documented audit-only/non-authoritative writes). LOW = read-only (GET only).

| Route | Methods | Read-only / Write-capable | Mutates | Priority |
|---|---|---|---|---|
| `alarm-action-log/route.ts` | GET, POST | write-capable | `alarm_action_log` (acknowledge/suppress an active alarm) — no role or guardrail check at all in the caller (`useAlarmActionLog.ts`) | HIGH |
| `alarm-current-state/route.ts` | GET, POST | write-capable | `alarm_current_state` onset enter/clear — POST payload (`{domain, equipmentTag, columnName, action}`) has no `actorId`/`actorRole` field at all; `alarmCurrentStateCache.ts` fires it automatically the instant a HIGH/CRITICAL threshold is crossed in live telemetry, with no user action or button click involved. There is no "who did this" to gate. | **Reclassified 2026-09-16: N/A — system-generated event, not a role-gated user action.** |
| `alarm-setpoint-overrides/route.ts` | GET | read-only | — | LOW |
| `assets/route.ts` | GET | read-only | — | LOW |
| `bootstrap/route.ts` | POST | write-capable | Full CMMS DB reset + re-seed (`runBootstrap({resetDb:true})`). Only gate is `NODE_ENV!=='development'`, not a role check — the caller (`AdminCmmsResetButton.tsx`, rendered unconditionally in `CmmsEquipmentRegistryView.tsx`) says so in its own header comment. In dev mode any role reaching that view can trigger it. | HIGH |
| `daily-ops-shift-input-status/route.ts` | GET | read-only | — | LOW |
| `daily-report-critical-events/route.ts` | GET, POST, DELETE | write-capable | Daily Report critical-events rows (insert/delete) — unlike sibling `daily-ops-patrol-entries` (Stage 3 Step 1, commit `4c243a9`), this child editor got no RBAC allow-list | HIGH |
| `daily-report-safety-notes/route.ts` | GET, POST | write-capable | Daily Report safety-notes section (upsert) — same gap as above | HIGH |
| `daily-report-signatures/route.ts` | GET, POST | write-capable | Daily Report signature entries; a `prepared_by`+`acknowledged_by` pair auto-triggers `finalizeSnapshot()` — no check that `signerName`/role matches the caller's actual session | HIGH |
| `daily-report-snapshots/route.ts` | POST, GET | write-capable | Generates a report snapshot (`generateSnapshot`); refuses to overwrite an already-finalized one, so blast radius is lower than its child routes above | MEDIUM |
| `daily-report-status-log/route.ts` | GET | read-only | — | LOW |
| `environment/route.ts` | GET | read-only | — | LOW |
| `gas-tests/route.ts` | POST, GET | write-capable | `permit_gas_tests` audit record — file header explicitly documents this as audit-only/non-authoritative for the PTW gate (client-side `validatePTWGasSafety` remains SSOT) | MEDIUM |
| `moc/route.ts` | GET | read-only | — | LOW |
| `mro-inventory/route.ts` | GET, POST | write-capable | `seedPartsIfEmpty` — idempotent, no-ops once parts exist | MEDIUM |
| `mro-inventory/adjustments/route.ts` | GET, POST | write-capable | Real stock RECEIPT/ISSUE/ADJUSTMENT/RETURN/SCRAP via `adjustStock`; caller (`useMroInventory.ts`) only checks auditor/fatigue, not role | HIGH |
| `mro-inventory/requisitions/route.ts` | GET | read-only | — | LOW |
| `overview/summary/route.ts` | GET | read-only | — | LOW |
| `permit-metadata/route.ts` | POST | write-capable | `seedPermitMetadataIfAbsent` — idempotent (only writes if `permit_ref_no` absent); feeds the SIMOPS candidate set but can't overwrite existing rows | MEDIUM |
| `permit-suspensions/route.ts` | GET, PATCH | write-capable (unreachable) | `acknowledgeShiftHandover` lifts a SHIFT_CHANGE PTW suspension. Repo-wide grep (2026-09-16) for `permit-suspensions`, `acknowledgeShiftHandover`, and any `fetch`/hook call site found **no caller anywhere in `src/`** — the PATCH is dead code today. Separately, its own header comment says this should be "Site Manager/HSSE only," but `PTW_PERMITS.canApprove` (the nearest existing field) is also `true` for `ACTING_SITE_MANAGER`/`OPERATION_TEAM_LEADER`/`WORK_LEADER_TECH` — broader than the header's stated intent. Both facts are noted for future cleanup; the route itself was not modified or removed. | **Reclassified 2026-09-16: UNREACHABLE — candidate for removal, not RBAC remediation.** |
| `pid-tag-aliases/route.ts` | GET | read-only | — | LOW |
| `pid-tag-coordinates/route.ts` | GET, POST | write-capable | P&ID overlay calibration coordinates — config/cosmetic, not a safety control value | MEDIUM |
| `ptw-permits/route.ts` | GET, POST, PATCH | write-capable | PATCH drives the 5-stage PTW lifecycle (DRAFT→PREPARED→APPROVED→ACTIVE→CLOSED) + safety-checklist booleans (LOTO/gas detector/PPE/barricade); no server role re-validation. Needs its own dedicated audit of `usePTWPermits.transitionStatus`'s client-side gate — not fully traced this session. | HIGH |
| `ptw-permits/sync-conflicts/route.ts` | GET | read-only | — | LOW |
| `ptw-signatures/route.ts` | GET, POST | write-capable | PTW electronic signatures (Part C/D/E) — no check that `staffId`/role in the payload matches the caller's actual authenticated identity | HIGH |
| `simops-check/route.ts` | GET | read-only | — | LOW |
| `trucking-inspections/route.ts` | GET, POST | write-capable | NP-03 inspection checklist entries — records an inspection result, is not itself a gate/permission decision | MEDIUM |
| `work-orders/route.ts` | GET, POST, PATCH | write-capable | POST is `seedWorkOrdersIfEmpty` (idempotent); PATCH (`markWorkOrderPerformed`) mutates real WO status + recalculates `next_due_date` — caller (`useWorkOrders.ts`) only checks auditor/fatigue, not role | HIGH |

**Count check**: 28 routes total (11 HIGH, 6 MEDIUM, 11 LOW) at original audit time — matches the prior
session's "28 routes" figure exactly; re-verified by direct enumeration this session, not assumed.

**2026-09-16 reclassification** (RBAC audit follow-up, docs-only pass — no code changed in this pass):
`permit-suspensions/route.ts` (confirmed dead code, no call site anywhere in `src/`) and
`alarm-current-state/route.ts` (confirmed system-fired, no actor/role concept in its payload) are pulled
out of the HIGH RBAC-remediation queue for the reasons noted in their rows above. Updated count:
**9 HIGH** (RBAC-remediation-relevant), 6 MEDIUM, 11 LOW, 1 UNREACHABLE, 1 N/A. Of the 9 remaining HIGH
routes, 5 were remediated this same follow-up session (`daily-report-critical-events`,
`daily-report-safety-notes`, `mro-inventory/adjustments`, `ptw-signatures`, `work-orders` — see their
individual commits) and `daily-report-signatures` was remediated via a split-by-signature-type gate;
`ptw-permits/route.ts` PATCH remains confirmed hard-block-adjacent (do not revisit without dedicated
`usePTWPermits.transitionStatus` review); `alarm-action-log/route.ts` and `bootstrap/route.ts` remain
open, pending role-mapping/architecture decisions respectively (see HSSE_OFFICER investigation and
`bootstrap`'s own header comment).

This table was built from each route's actual POST/PATCH/DELETE handler body and its real UI caller
(hook/component), not from a keyword search alone — but "reachable by non-admin roles" reflects what
this session could trace from `useActiveSession()`/`evaluateMutationGuardrails()` call sites in the time
available, not an exhaustive walk of every render path. `ptw-permits/route.ts` PATCH in particular still
needs a deeper look at `usePTWPermits.transitionStatus`'s own gate logic before this can be called
closed.
