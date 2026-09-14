# Phase 11c Stage 1 — MOC (NP-12) Sign-off Summary

## Commits
| Sub-stage | Commit | Message |
|---|---|---|
| A | `8abf9f5` | Phase11c Stage1-A: DDL schema + cmms-moc types |
| B | `042c71e` | Phase11c Stage1-B: MOC DAO + pure risk classification service + vitest |

Branch: `feat/phase11c-moc-safety-gates`, cut from `main` @ `2bf43a6` (post Phase 7-11b sync merge).

## Step 0 Investigation Results
- `find src -iname "*moc*" -o -iname "*change*"`: no pre-existing MOC module. The only `*moc*`
  matches were `mock*.ts` generators (substring collision, not MOC-related).
- `grep -n "MOD_" src/components/launcher/SectorLauncherHub.tsx`:
  `MOD_1`..`MOD_9` are already sequentially assigned (1 LNG-Process, 2 Equipment & Asset,
  3 Maintenance & Work Orders, 4 Site Manning & Roster, 5 Safety & PTW, 6 CMMS Overview Dashboard,
  7 Jakarta HQ Overview, 8 Trucking & Logistics (NP-03), 9 Environment & Waste (NP-10)). **No gap
  exists** — the previously-suspected MOD_9-vs-MOD_7 gap does not exist post-merge; the next free
  sector number for MOC (Stage 2) is **`MOD_10`**.
- Confirmed GET-route + DAO-wrapping pattern via `environment/route.ts` and
  `trucking-inspections/route.ts`, and the `routes/EnvironmentRoutes.tsx` mounting pattern
  (`{activeKey.startsWith('X') && <ModuleHub />}`) — for Stage 2 reference only; not used this
  stage (backend-only).
- Hard-block file paths reconfirmed via `find`: `src/adapters/gasSafetyAdapter.ts`,
  `src/adapters/db/gasTestDao.ts`, `src/adapters/db/cmmsDbSingleton.ts` — single location each,
  no duplicates.

## Deviation from Sub-stage B Plan
The plan named a single `src/cmms-moc/dao/mocDao.ts`. The combined draft (both tables' CRUD)
measured 281 lines, over the 250-line/file hard cap (AGENTS.md §3/§4). Split immediately
(Boy Scout Rule) into:
- `src/cmms-moc/dao/mocPlanDao.ts` (145 lines) — NP12-01 CRUD
- `src/cmms-moc/dao/mocCompletionDao.ts` (140 lines) — NP12-02 CRUD

No behavioral difference from the plan; same exported functions, just across two files.

## Hard-Block Diff (0 touches, verified paths)
`git diff --stat main HEAD -- <hard-block files>` — **empty output** for all of:
`ptwStatusMapper.ts`, `src/adapters/gasSafetyAdapter.ts`, `ptwCargoHandlingRules.ts`,
`ptwCargoHandlingTransitions.ts`, `ptwCargoHandlingValidators.ts`, `src/adapters/db/gasTestDao.ts`,
`src/adapters/db/cmmsDbSingleton.ts`, `src/context/PortalDataContext.tsx`.

## Scope Confirmation — Backend/Domain Only
`git diff --stat main HEAD -- src/app/api src/components/portal/routes src/components/launcher/SectorLauncherHub.tsx src/types/lng.ts`
— **empty output**. No API route, no navigation/SubProcessKey extension, no `routes/` component
added this stage, as required.

## Full File List (this branch vs. main)
```
 src/cmms-moc/dao/mocCompletionDao.ts         | 140 ++++++++++++++++++++++++++
 src/cmms-moc/dao/mocPlanDao.ts               | 145 +++++++++++++++++++++++++++
 src/cmms-moc/db/mocDbSingleton.ts            |  40 ++++++++
 src/cmms-moc/db/schema.sql                   |  80 +++++++++++++++
 src/cmms-moc/services/mocRiskService.test.ts |  36 +++++++
 src/cmms-moc/services/mocRiskService.ts      |  24 +++++
 src/cmms-moc/types/moc.ts                    | 128 +++++++++++++++++++++++
 7 files changed, 593 insertions(+)
```
`cmmsDbSingleton.ts` was never touched — `mocDbSingleton.ts` is a parallel singleton that calls
`getCmmsDb()` for the shared connection and layers its own `CREATE TABLE IF NOT EXISTS` DDL on
top, identical in shape to `environmentDbSingleton.ts` / `truckingDbSingleton.ts`.

## Verification
- `tsc --noEmit`: clean, 0 errors.
- `vitest run`: 11 files / **129 tests passed** (121 pre-existing + 8 new `mocRiskService.test.ts`
  boundary cases: 1, 2, 3, 4, 5, 0, 6, non-integer).

## Not Done This Stage (by design)
- No API route (`src/app/api/v1/cmms/moc/...`).
- No `SubProcessKey` extension, no sidebar/launcher entry, no `routes/MocRoutes.tsx`.
- `classifyRiskRating()` is exported but not wired into any save/submit path — informational only,
  per NP-12 §2.1 (Site Manager holds approval authority, not the system).

**Not pushed.** Local commits only on `feat/phase11c-moc-safety-gates`, awaiting HJ review.
