# Orphan Component Report — NIAS LNG Portal

**Generated:** 2026-09-11
**Tool:** knip v6.35.1 (`npx knip --reporter json`, `npx knip`)
**Config:** `knip.json` (project root) — `entry: ["src/app/**/{page,layout,route,loading,error,not-found}.tsx", "src/scripts/*.ts"]`, `project: ["src/**/*.{ts,tsx}"]`

## Methodology & a correction to the task framing

The task brief asserted that `CMMS_Architecture.md` documents a "Strangler Fig + Adapter Pattern" and names `CmmsAwarePortalProvider` / `gasSafetyAdapter.ts` as examples of registry-based indirection. **That is not accurate.** `src/data/CMMS_Architecture.md` is a data/API specification (ISO 14224 asset taxonomy, e-PTW DDL, SIMOPS/offline-sync algorithms) — it never mentions an adapter registry, "Strangler Fig," `CmmsAwarePortalProvider`, or `gasSafetyAdapter.ts` anywhere. Both files do exist and are genuinely imported by ~24 files (verified by grep), so the underlying caution — "don't assume adapter/provider files are dead just because they look unreferenced" — is sound, but it rests on the codebase's actual `src/adapters/*.ts` + `src/context/*Provider.tsx` layering convention (observed directly), not on anything written in that document. This report applies that convention-based judgment, not a documented registry mechanism that doesn't exist.

Every file/symbol below was cross-checked by: (1) grepping the filename and every named export as a plain string across `src/` for dynamic/string-based references, (2) checking Next.js App Router convention-file status, (3) for exports specifically, checking whether the symbol is used **within its own declaring file** (many knip "unused export" hits are constants/functions that are consumed internally but needlessly marked `export` — those are not dead code, just over-exported), and (4) `git log -1 --format=%ad` for last-touch date.

**Unused devDependencies** (not file-level, noted for completeness): `headroom-ai`, `tailwindcss` (package.json:31, 33) — not investigated further per task scope (files only).

Raw knip output preserved at `knip-report.json` / `knip-human.txt` in the project root.

---

## High Confidence Dead Code

| File Path | Flagged Symbols | Last Git Modified | Reason |
|---|---|---|---|
| `src/App.tsx` | (whole file) | 2026-09-04 | Legacy CRA-style root wrapping `LNGPortalApp`. Next.js App Router uses `src/app/page.tsx`, which imports `LNGPortalApp` directly — zero references to `App.tsx` anywhere, not even a build config entry. |
| `src/components/FieldDesktopWorkspace.tsx` | (whole file) | 2026-08-27 | No importer anywhere in `src/`; not referenced by any route file under `src/components/portal/routes/*`. |
| `src/components/FleetTrackerView.tsx` | (whole file) | 2026-08-27 | Same as above — no importer, no route wiring. |
| `src/components/JakartaHQDashboard.tsx` | (whole file) | 2026-08-27 | Same as above — no importer, no route wiring. |
| `src/components/locations/arun/ArunLocationView.tsx` | (whole file) | 2026-08-28 | Superseded wrapper. The live Arun route (`src/components/portal/routes/LngProcessRoutes.tsx`) imports `ArunTerminalView.tsx` directly; `ArunLocationView.tsx` (a different, similarly-named wrapper around the same `ArunTerminalView`) has no importer anywhere. |
| `src/components/locations/arun/ArunDispatchTab.tsx` | (whole file) | 2026-08-28 | Not imported by the live `ArunTerminalView.tsx`, which instead wires `ArunLoadingTab`, `ArunCustodyCoqTab`, and `ArunMasterHistoryTab`. Orphaned draft tab. |
| `src/components/locations/arun/ArunLabSpecTab.tsx` | (whole file) | 2026-08-28 | Same as above — not one of the three tabs the live view actually wires in. |
| `src/components/locations/arun/ArunSaviorStowageTab.tsx` | (whole file) | 2026-08-28 | Same as above — not one of the three tabs the live view actually wires in. |
| `src/data/workOrderData.ts` | `ALL_WORK_ORDERS` (whole file) | 2026-09-10 | Self-documented as superseded: `src/components/cmms/mockWorkOrderGenerator.ts`'s header comment states it explicitly "replac[es] the previously hardcoded ALL_WORK_ORDERS mock ledger in WorkOrderListView.tsx." Confirmed zero live importers. |
| `src/components/locations/NiasTerminalView.tsx` | type `NiasSubTab` (line 140) | 2026-09-04 | Type alias declared, never referenced again anywhere in the file or elsewhere. Zero runtime risk to remove. |
| `src/components/manpower/tabs/RotationPlanTab.tsx` | type `RotationFilter` (line 6) | 2026-09-07 | Same — declared, never referenced again anywhere. Zero runtime risk to remove. |

Dates are the file's last-modified date, not necessarily the flagged symbol's — get per-symbol history with `git log -p -- <file>` if needed.

---

## Needs Manual Review

| File Path | Flagged Symbols | Last Git Modified | Reason |
|---|---|---|---|
| `src/components/manpower/modals/OperationsOverrideModal.tsx` | (whole file) | 2026-09-08 | Fully-formed modal (exports `OperationsOverrideModalProps` + default component) with zero importers anywhere. Modified 3 days before this scan — likely a Boy-Scout-Rule extraction (per `AGENTS.md` §3, modals live in standalone files) awaiting a trigger button/handler that hasn't landed yet, rather than abandoned code. Needs a human check of in-flight branches/tickets before removal. |
| `src/components/manpower/modals/ptw/GasTestGateSection.tsx` | (whole file) | 2026-09-09 | Same pattern — standalone, fully-formed, zero importers, modified 2 days before this scan. Likely mid-integration into the PTW gas-test flow. |
| `src/adapters/ptwStatusMapper.ts` | `cmmsStageToLegacyStatus`, `safeTransition`, `InvalidStageStatusError`, `UnmappedLegacyStatusError`, `ConcurrentModificationError`, `validateStageStatusPair`, `assertValidStageStatusPair`, `verifyPayloadHash`, `assertPayloadHashMatches`, `SafeTransitionInput`, `SafeTransitionResult` | 2026-09-09 | **Safety-relevant.** Only `CmmsStageStatus`, `computePayloadHash`, and `legacyStatusToCmmsStage` from this file are imported anywhere (single consumer: `src/hooks/useCMMSPTWForm.ts`). The `safeTransition` guard function and its supporting error classes/hash-verification helpers — which look like the intended optimistic-locking/stage-transition gate described in `CMMS_Architecture.md` §5.5 — are never called from any PTW UI flow. Either this gate is enforced elsewhere by different code, or the PTW stage-transition safety check is not currently wired in. Recommend a human (not this scan) confirm which. |
| `src/adapters/db/workOrderDao.ts` | `updateWorkOrder`, `deleteWorkOrder`, `selectWorkOrderById`, `selectWorkOrdersByAsset`, `selectWorkOrdersByStatus`, type `WorkOrderUpdateInput` | 2026-09-10 | DAO exposes a full CRUD surface; only some methods (create/list, per sibling usage) are currently called. Consistent with the project's adapter-layer convention of exposing the complete data-access surface ahead of UI need — plausibly near-term (WO edit/delete UI not yet built) rather than dead. |
| `src/adapters/assetDbAdapter.ts` | `getAssetRecordByTag` | 2026-09-10 | Same DAO-completeness pattern as above. |
| `src/adapters/db/mroInventoryDao.ts` | `selectPartByNo` | 2026-09-11 | Same DAO-completeness pattern. |
| `src/adapters/db/ptwPermitDao.ts` | `selectPermitLifecycle` | 2026-09-10 | Same DAO-completeness pattern. |
| `src/adapters/promoteStagingAssetToAssets.ts` | `getStagingStatsSummary` | 2026-09-10 | Same DAO-completeness pattern — a summary/reporting helper with no current caller. |
| `src/adapters/assetAdapter.ts` | `toSafeAssetViewList`, `filterNeedsReview` | 2026-09-09 | Adapter helper functions with no current caller; sibling resolvers in the same file are actively used elsewhere. |
| `src/adapters/ptwFormAdapter.ts` | `toGasTestRecordDraftList` | 2026-09-09 | Same pattern — form-adapter helper with no current caller. |
| `src/adapters/tagNormalizationService.ts` | `normalizeTagsBatch` | 2026-09-10 | Batch-normalization helper with no current caller; singular `normalizeEquipmentTag`-style helpers in the same file are used elsewhere. |
| `src/adapters/db/sqlExecutor.ts` | `createInMemoryFakeExecutor` | 2026-09-10 | Test/sandbox scaffold per its own header comment ("테스트/샌드박스 환경에서는 이 파일 하단의 createInMemoryFakeExecutor()로…") but not referenced by either existing test file (`src/data/__tests__/ptwCargoHandlingValidators.test.ts`, `ptwGasSafetyRules.test.ts`). Likely intended for future DB-layer tests. |
| `src/data/manpowerMasterData.ts` | `generateMonthlyRoster`, `getStaffExpiryStatusForMonth`, `HSSE_OFFICER_OPTIONS`, `DAILY_REST_REASONS` | 2026-09-07 | No caller anywhere, including internally. `generateMonthlyRoster` is also duplicated (same name, different implementation) in `src/utils/manpowerCalculations.ts`, which **is** used — this file's copy looks superseded but should be confirmed by whoever owns the roster feature before deleting. |
| `src/utils/pmScheduleCalculator.ts` | `isPmOverdue` | 2026-09-10 | No caller anywhere; PM-overdue logic may be duplicated inline elsewhere (not confirmed) rather than dead. |
| `src/utils/CsvUtils.ts` | `parseNumericField` | 2026-09-10 | No caller anywhere. Note a near-duplicate `cleanNumber` exists in `src/utils/csvParser.ts` (also separately flagged as unused) — two parallel CSV utility modules, possibly one superseding the other. |
| `src/utils/excelExporter.ts` | `exportDatasetToCSV`, type `ExportColumn` | 2026-08-26 | No caller anywhere; the file may be mid-build for an export feature not yet wired to a UI button. |
| `src/components/manpower/ManpowerRosterView.tsx` | `MANPOWER_DIRECTORY` (re-export) | 2026-09-07 | This is a **re-export** of `INITIAL_MANPOWER_MASTER_RECORDS` from `manpowerMasterData.ts` under a local alias — the underlying data is used elsewhere via the original name; this specific re-exported alias has no consumer. Safe to drop the re-export, but touches a live file. |
| `src/services/rosterPlanEngine.ts` | `calculateRotationStatus` | 2026-09-07 | No caller anywhere; sibling `getShiftForDay` in the same file is also flagged (see false-positives note below — it's used internally). Possibly an older rotation-status calculation superseded by logic in `manpowerCalculations.ts`. |
| `src/utils/scadaCalculations.ts` | `calculatePreLoadTare`, `calculateEnergyMMBtu` | 2026-08-28 | No caller anywhere; SCADA calculation helpers possibly superseded by `src/utils/tankPhysicsCalculations.ts` / `src/lib/*-engine.ts` modules. |
| `src/data/ptwCargoHandlingRules.ts` | `BARRICADE_RADIUS_LIFTING_MAX_M` | 2026-09-08 | Not a bug: the file's own comment states "the lifting max is the SOP's documented upper reference band, not an additional block" — i.e., intentionally a reference-only constant, not meant to gate anything. Low priority, informational only. |
| `src/lib/tank-thermo-engine.ts` | `NOMINAL_WATER_CAPACITY_L` | 2026-08-27 | Declared alongside `NOMINAL_MAX_LADEN_MASS_KG` (which **is** used in the mass-balance calc at lines 60/111), but the water-capacity constant itself is never consumed by any calculation in this engine. Possibly an incomplete cross-check (e.g., a volume-vs-mass sanity check) that was never implemented — worth a domain-owner look given this is a cryogenic tank physics module. |

---

## False Positives (Framework/Adapter Convention)

These files/symbols were flagged by knip but are **not dead** — the underlying implementation is live; only the static-analysis signal (or the `export` keyword itself) is misleading.

| File Path | Flagged Symbols | Last Git Modified | Reason |
|---|---|---|---|
| `src/app/**/page.tsx`, `layout.tsx`, `route.ts` (all API routes under `src/app/api/**`) | n/a | — | Next.js App Router convention files — loaded by the framework via file-system routing, never via explicit `import`. Correctly excluded via the `entry` patterns in `knip.json`; not present in knip's unused-file output, confirming the config is working as intended. |
| `src/context/CmmsAwarePortalProvider.tsx`, `src/adapters/gasSafetyAdapter.ts` | n/a | — | Not flagged by knip at all (confirmed live, ~24 importers each via grep). Included here only to record that the task brief's specific examples were checked and found to be correctly *not* flagged — i.e., knip is not producing false negatives for these two. |
| 119 of the 149 "unused export"/"unused exported type" hits (all files not listed in the two tables above) | Every named constant/function/type in: `src/adapters/assetAdapter.ts` (partial), `assetAdapter.ts` resolvers, `src/adapters/db/*.ts` (partial), `src/adapters/locationToSystemCode.ts`, `src/adapters/ptwSignatureGate.ts`, `src/adapters/ptwStatusMapper.ts` (partial — see Manual Review for the rest), `src/components/locations/nias/**` (modal/tab Props interfaces), `src/components/manpower/**` (Props interfaces, roster helpers), `src/data/ertReadinessData.ts`, `src/data/legacyDataSource.ts`, `src/data/ptwGasSafetyRules.ts` (`CO_MAX_PPM`), `src/data/safetyOverviewData.ts` (`HIGH_RISK_PTW_TYPES`), `src/hooks/usePortalStorageSync.ts`, `src/hooks/useSIMOPSCheck.ts`, `src/lib/iso6976-engine.ts`, `src/lib/mass-balance-engine.ts`, `src/services/tankOperationsService.ts`, `src/types/*.ts`, `src/utils/csvParser.ts` (partial), `src/utils/manpowerCalculations.ts`, `src/utils/tankPhysicsCalculations.ts` (partial) | — | Verified programmatically: the flagged symbol appears **more than once** in its own declaring file, meaning it's consumed internally by other code in that same module (e.g. `CO_MAX_PPM` gates a comparison two lines below its declaration; `HIGH_RISK_PTW_TYPES` filters an array in the same file). knip's "unused export" only means "not imported by a *different* file" — the `export` keyword is superfluous here, but the value/function itself is live and load-bearing. **Do not delete these declarations; at most, drop the unnecessary `export` keyword.** Full per-symbol list available in `knip-report.json` (149 total; 30 had zero internal use and are itemized individually above). |
| `src/components/locations/nias/modals/NiasBayMountModal.tsx`, `NiasMroModal.tsx`, `NiasQuickMountModal.tsx`, `NiasSkidSendoutHeelModal.tsx`, `NiasTankDetailModal.tsx`, `NiasTankTrendModal.tsx`, `src/components/locations/nias/hooks/useNiasCalendar.ts`, `src/components/locations/nias/tabs/NiasLd2BackhaulTab.tsx` | duplicate `default` + named export (8 flagged pairs) | 2026-09-04 (all) | All confirmed live and imported by `NiasTerminalView.tsx` (directly, or nested one level via `NiasTankDetailModal.tsx` for `NiasSkidSendoutHeelModal`). The files export the same component both as `default` and as a named export — redundant but harmless; a minor lint cleanup, not dead code. |

---

## Summary Counts

| Bucket | File-level rows | Export/type-level rows |
|---|---|---|
| High Confidence Dead Code | 9 | 2 |
| Needs Manual Review | 2 | 28 (across 19 files) |
| False Positives (Framework/Adapter Convention) | 10 (2 convention notes + 8 duplicate-export files) | 119 |
| **Total flagged by knip (reference)** | **11 unused files** | **106 unused exports + 44 unused exported types + 8 duplicate exports = 158** |

No files were modified, moved, or deleted in producing this report. `knip` and `knip.json` were added to the project (devDependency + config) per the task instructions; `knip-report.json` and `knip-human.txt` (raw output) remain in the project root alongside this report.
