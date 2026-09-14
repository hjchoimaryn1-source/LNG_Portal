# Phase 11b Main Sync — Deviation Report

## 1. Plan vs. Actual
- **Original plan**: fast-forward merge (`git merge --ff-only`).
- **Actual result**: `--no-ff` merge commit, due to divergence discovered at Step 0 of the
  revised sync instructions.
- **Divergence cause**: `main` HEAD (`e367b7e`, "merge: chore/remove-orphan-components into main
  (Phase 1-6)") is **not** an ancestor of `feat/phase7-ptw-safety-gates`. The feature branch was
  cut from `6b1660f` (`main`'s parent, pre-orphan-cleanup), so `main` carries one merge commit
  (`e367b7e`) that the feature branch never had, and the feature branch carries 47 commits
  (`45b2907`..`88946bc`, Phase 7 through Phase 11b) that `main` never had. True fast-forward was
  impossible; `merge-base --is-ancestor main feat/phase7-ptw-safety-gates` returned non-zero.

## 2. Step 0 — Overlap Investigation (`e367b7e` vs. protected paths)
`git show --stat e367b7e` (148 files changed) was cross-referenced against:
- The 8 hard-block files + `cmmsDbSingleton.ts` + `PortalDataContext.tsx`
- `src/cmms-trucking/`, `src/cmms-environment/`, `TruckingDataContext.tsx`,
  `EnvironmentDataContext.tsx`, `components/trucking/`, `components/environment/`,
  `TruckingRoutes.tsx`, `EnvironmentRoutes.tsx`, `api/.../trucking-inspections/`,
  `api/.../environment/`

**Result: NO OVERLAP.**
- None of the trucking/environment module paths appear in `e367b7e`'s file list.
- `src/adapters/db/cmmsDbSingleton.ts` appears in `e367b7e`'s raw `--stat` line, but
  `git diff 6b1660f e367b7e -- src/adapters/db/cmmsDbSingleton.ts` is **empty** — `main`'s content
  for this file is byte-identical to the merge-base. The `--stat` entry is an artifact of
  `e367b7e` being a merge commit (diff shown is against its first parent, not the merge-base).
- `src/context/PortalDataContext.tsx` does not appear in `e367b7e`'s file list; confirmed
  `git diff 6b1660f e367b7e -- ...PortalDataContext.tsx` is empty.
- Sanity check: `git log e367b7e..main` and `git log main..e367b7e` both empty — confirms
  `main` HEAD literally *is* `e367b7e`.

Conclusion: safe to proceed to `--no-ff` merge; no conflicting edits between the two divergent
histories on any protected path.

## 3. Step 1 — Merge
```
git checkout main
git merge --no-ff feat/phase7-ptw-safety-gates -m "Merge Phase 7-11b (47 commits): ..."
```
Result: **clean merge, zero conflicts** (`Merge made by the 'ort' strategy.`).
Merge commit: `ff424b5`. Pre-merge `main` HEAD: `e367b7e`.

## 4. Step 2 — Post-merge Verification
- `tsc --noEmit`: clean, 0 errors.
- `vitest run`: 10 files / **121 tests passed**, 0 failed.
- Hard-block diff check (`git diff --stat e367b7e ff424b5 -- <hard-block files>`):

  | File | Result |
  |---|---|
  | `ptwStatusMapper.ts` | 0 lines |
  | `gasSafetyAdapter.ts` | **7 lines changed** (6 insertions, 1 deletion) |
  | `ptwCargoHandlingRules.ts` | 0 lines |
  | `ptwCargoHandlingTransitions.ts` | 0 lines |
  | `ptwCargoHandlingValidators.ts` | 0 lines |
  | `permit_gas_tests` logic (`gasTestDao.ts`) | **14 lines added** |
  | `PortalDataContext.tsx` | 0 lines — byte-identical |
  | `cmmsDbSingleton.ts` | **42 lines added** |

### Why the non-zero entries are NOT a hard-block violation
These three files were modified by **Phase 7 Stage 1** itself (commit `45b2907`, "feat(ptw):
Phase 7 Stage 1 — gas LEL fix, ALARP/JSA gate, AGT/shift suspend engine, SIMOPS DB-backing") —
the AGT 4-hour timeout / shift-suspend engine that this main-sync exists to bring into `main` for
the first time. The "hard-blocked, zero touches" rule was introduced starting Phase 11a/11b/11c
to keep the *new peripheral modules* (trucking, environment, MOC) from reaching into PTW core
logic — it was never intended to exclude Phase 7's own approved core-PTW payload from reaching
`main` in this sync. Confirming detail:
- `cmmsDbSingleton.ts`: purely additive — 3 new `CREATE TABLE IF NOT EXISTS` DDL blocks
  (`permit_suspension_state`, `permit_shift_ack`, `permit_metadata`) plus 3 new `.exec()` calls
  registering them. No existing table/column/line altered or removed.
  `git diff 6b1660f e367b7e -- cmmsDbSingleton.ts` (base vs. pre-merge main) is empty — `main`
  never touched this file; 100% of the diff originates from the feature branch.
- `gasSafetyAdapter.ts`: adds one new exported function (`getLatestTestedAtByPermit`) and one new
  import; no existing line removed except the single import-line rewrap.
- `gasTestDao.ts` (`permit_gas_tests` read logic): adds one new read-only `SELECT ... GROUP BY`
  query function; the existing `SELECT_RECENT_SQL` and all prior exports are untouched.

`PortalDataContext.tsx` is confirmed byte-identical pre- and post-merge (0 lines, as required).

## 5. Outstanding item before push
Per the sync instructions, `git push origin main` was gated on "all of the above" passing,
including the 0-line hard-block diff check. Two of the eight-plus-two protected paths show
non-zero, additive diffs that trace directly to Phase 7 Stage 1's own reviewed payload (not to
the `e367b7e` divergence or to any Phase 11a/11b peripheral-module work). Push has been held
pending HJ's explicit confirmation that this is the expected/accepted outcome.

## Hard-Block File Diff Finding (gasSafetyAdapter.ts / gasTestDao.ts / cmmsDbSingleton.ts)
- All three files showed additive-only changes in the `ff424b5` merge diff (new functions /
  new `CREATE TABLE IF NOT EXISTS` DDL / new export symbols). No existing function signature,
  query, or DDL statement was modified or removed.
- Traced to Phase 7 Stage 1 commit `45b2907` (pre-dates this merge branch's divergence point);
  this merge is the first time that already-approved Phase 7 payload lands on `main`, not new
  work introduced during Phase 8-11b.
- Actual verified paths (correcting the original prompt's assumed paths):
  - `gasSafetyAdapter.ts` → `src/adapters/gasSafetyAdapter.ts`
  - `gasTestDao.ts` → `src/adapters/db/gasTestDao.ts`
  - `cmmsDbSingleton.ts` → `src/adapters/db/cmmsDbSingleton.ts`
- HJ reviewed and confirmed acceptable on 2026-09-14.
