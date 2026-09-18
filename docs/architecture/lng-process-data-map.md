# LNG-Process Sector — Full Data Map & Integration Audit (PRE-FLIGHT II)

Read-only investigation. No code/DDL changes. Scope: full LNG-Process sector nav
(via `getInitialNav.ts` + `SidebarNav.tsx`) plus `GlobalFleetHubView.tsx` and
`src/cmms-trucking/*` for cross-reference. ZERO-TOUCH files were read-only reference
points during this audit (never edited): `ptwStatusMapper.ts`, `gasSafetyAdapter.ts`,
`ptwCargoHandlingRules.ts`, `Transitions.ts`, `Validators.ts`, `permit_gas_tests` logic,
`PortalDataContext.tsx`, `cmmsDbSingleton.ts`.

---

## 1. Tab-by-Tab Inventory

### LNG-Process top-level nav (`SidebarNav.tsx` L157-178)

| Nav Label | SubProcessKey | Component | Lines | Write path | Granularity (as stored) |
|---|---|---|---|---|---|
| Overview | `LNG_PROCESS_OVERVIEW` | `NiasOperationalOverviewTab.tsx` | 1341 | read-only (no writes) | n/a — live snapshot render |
| PAGT (Arun) | `ARUN_LOADING_COQ` (+3 sibling tabs) | `arun/ArunLoadingTab.tsx` | 601 | `batchTransitionTanks`, `addDeliveredMeasurement` (PortalDataContext / ZERO-TOUCH) | per-event (delivery) |
| PAGT (Arun) | — | `arun/ArunLoadingCoqTab.tsx` | 1409 | `fleetTanks`, `batchTransitionTanks` (ZERO-TOUCH) | per-event |
| PAGT (Arun) | — | `arun/ArunMasterHistoryTab.tsx` | 920 | `fleetTanks`, `settlementRecords` (ZERO-TOUCH, read) | per-voyage |
| PAGT (Arun) | — | `arun/ArunHeelBogLossView.tsx` | 634 | `fleetTanks`, `settlementRecords` (ZERO-TOUCH) | per-event |
| PAGT (Arun) | — | `arun/ArunCustodyCoqTab.tsx` | 8 | stub, unrouted | n/a |
| Marine Transit | `SAVIOUR_VOYAGE_MONITORING` | `MvSaviourView.tsx` | 947 | `batchTransitionTanks`, `updateTankLog`, `markTankForMaintenance`, `addDailyMasterLog` (ZERO-TOUCH → `DailyMasterRecord`) | per-day (`logDate`), no shift-slot field |
| Marine Transit | — | `saviour/SaviorStowageTab.tsx` | 1318 | **none** — prop-drilled from `MvSaviourView.tsx`, not an independent data consumer | n/a |
| Maintenance & Depot | `MAINTENANCE_MRO_HUB` | `MaintenanceHubView.tsx` | 433 | `markTankForMaintenance`, `releaseTankFromMaintenance` (ZERO-TOUCH) | event-driven flag toggle, no time-series |

### Nias Regas Unit sub-tabs (confirmed via `NiasSubTabsNavPanel.tsx` / `NiasDomainContentRouter.tsx`)

**Domain: ISO_TANK_MGMT**

| UI Label | subTab key | Component | Lines | Write path | Granularity |
|---|---|---|---|---|---|
| ISO TK Position | `TANK_OVERVIEW` | `tabs/NiasTankOverviewTab.tsx` | 1304 | ZERO-TOUCH (`fleetTanks`) | live snapshot |
| ISO TK - LOG | `LAYDOWN_1_2_LOG` | `tabs/NiasLaydownLogTab.tsx` | 1111 | ZERO-TOUCH | per-event |
| ORU (ISO TK - SKID) | `ACTIVE_BAY_TANKS` | `NiasActiveBayWorkspace.tsx` | 927 | `batchUpdateDailyMasterRecords` → `DailyMasterRecord.remarks` (ZERO-TOUCH); 4-hr patrol fields flattened into free text, **no dedicated patrol table/DAO/store exists** | patrol UI offers 6 shift slots, but each submit writes **one flattened text row**, not a structured per-slot record |
| ORU (LD-2) | `LAYDOWN_3_HEEL` | `tabs/NiasLd2BackhaulTab.tsx` | 863 | ZERO-TOUCH | per-event |
| Mass Balance | `TANK_MASS_BALANCE` | `NiasTankMassBalanceTab.tsx` | 852 | read-only, `settlementRecords` (ZERO-TOUCH) | per-settlement |

**Domain: REGAS_SYSTEM**

| UI Label | subTab key | Component | Lines | Write path | Granularity |
|---|---|---|---|---|---|
| GAS PROCESS | `GAS_PROCESS_TELEMETRY` | `NiasProcessPIDDiagram.tsx` | 655 | read-only P&ID display | live |
| GAS METERING - LOG | `GC_GAS_QUALITY` | `NiasGasQualityTab.tsx` | 1134 | `saveGasQualityRecord` → `gasQualityRecords: GasQualityMasterRecord[]` (ZERO-TOUCH, `src/types/gasQuality.ts`) | **one record per `date`** — daily only, no 4-hr-slot dimension |
| GAS METERING (LEDGER) | `GAS_METERING_LEDGER` | `NiasGasQualityLedgerTab.tsx` | 766 | read-only, same `gasQualityRecords` | daily |
| ~~PLTMG POWER~~ | ~~`PLTMG_POWER_OUTPUT`~~ | `NiasPowerThermalTab.tsx` | 808 | **Relocated 2026-09-18**: no longer a REGAS_SYSTEM sub-tab — now mounted as a stacked section inside `ElectricalSystemView.tsx` ("Electrical System" tab, `DAILY_OPS_ELECTRICAL_SYSTEM`). Data source unchanged: local `useState` only (engines/engineSpec, localStorage-seeded via `useNiasPowerThermalStorage.ts`); reads `fleetTanks`/`activeBays` from ZERO-TOUCH, writes nothing centrally | n/a (local only) |
| MONTHLY REPORT | `CUSTODY_HEAT_SETTLEMENT` | `NiasCustodySettlementTab.tsx` | 751 | read-only `useMemo` aggregation over `settlementRecords`/`fleetTanks` (ZERO-TOUCH) — **not** a separately maintained monthly table/xlsx. Caveat: trend-chart panel uses a synthetic `generateMonthlyTrendData()` generator, not real records | computed monthly from underlying per-event records |

### Equipment & Asset cross-reference

| Component | Lines | Notes |
|---|---|---|
| `GlobalFleetHubView.tsx` | **253** | **Already over the 250-line hard cap (AGENTS.md), zero headroom.** Drag-and-drop bucket board over 5 static `NodeState` buckets. Calls `batchTransitionTanks` (ZERO-TOUCH) → `applyBatchTransitionTanks` in `src/services/tankOperationsService.ts:253-273`, which **only overwrites `location`/`position` string fields in place** — no timestamp, no history append, no dwell-time field anywhere on `FleetTankItem` (`src/types/lng.ts:139-164`). |

### `src/cmms-trucking/*` cross-reference (confirmed: no overlap)

Tables: `truck_inspections`, `truck_inspection_items`, `truck_incident_log`
(`truckingSchema.ts`) — vehicle/checklist domain only. No ISO tank position or
round-trip concept anywhere in this module. Prior finding stands.

---

## 2. Field-Level Data Map

`GAP` = no existing field anywhere in code. `NEAR` = concept exists, name/unit differs.
`EXACT` = same name and meaning already in code.

*Daily Report PDF fields below are limited to what was explicitly enumerated in the
Stage 12 prompt (the full field list is only in the physical PDF — see Reconciliation
Answer E). Monthly xlsx fields are as named in the Stage 12 / PRE-FLIGHT II prompts.*

| Current Code Field (file:location) | Daily Report PDF Field | Monthly Report xlsx Field | Match |
|---|---|---|---|
| `GasQualityMasterRecord.conditionMeterA/B.pressBarg` (`types/gasQuality.ts`) | — | Pressure Supply (Barg) | **EXACT** |
| `GasQualityMasterRecord.conditionMeterA/B.tempC` | temperature_gauge_us (partial concept) | Temperature (Deg.C) | **EXACT** (monthly) / **NEAR** (daily — daily wants gauge+transmitter split, code has one `tempC`) |
| `GasQualityMasterRecord.conditionMeterA/B.lineDens` | — | Density (Kg/m3) | **NEAR** (name differs: `lineDens` vs Density) |
| `GasQualityMasterRecord.conditionMeterA/B.ghv` | — | GHV | **EXACT** |
| `GasQualityMasterRecord.cumMeter*/dailyMeter*.uvol/cvol` | — | Nett Volume Daily/Cumulative (MSCF) | **NEAR** — code stores volume in **MMCF**, form/xlsx names **MSCF**; unit reconciliation needed |
| `GasQualityMasterRecord.cumMeter*/dailyMeter*.mmbtu` | — | Totalizer Energy Flow (MMBTU) | **EXACT** |
| `GasQualityMasterRecord.cumMeter*/dailyMeter*.massTonne` | — | (no direct xlsx field named) | n/a |
| `GasQualityMasterRecord.conditionMeterA/B.lineZf` | — | (no direct xlsx field named) | n/a |
| `GasQualityMasterRecord.gcActiveTank/MeterA/B` (molecular %) | — | (GC composition — relates to `gc` patrol domain, not a named monthly field) | n/a |
| — | — | Differential Pressure (inH2O) | **GAP** — not present in any schema found |
| — | — | Totalizer Flow Consumption (MSCF) | **NEAR** (see uvol/cvol above, same unit gap) |
| — | — | Flowrate Variance (Highest/Lowest/Average) | **GAP** — not present anywhere |
| `SettlementLedgerEntry.deliveredWeightKg/VolumeM3/Density/TempC/GHV/MMBtu` (`settlementService.ts`) | — | Weight Awal / Stock Awal (concept) | **NEAR** — per-delivery-event, not a rolling stock figure |
| `SettlementLedgerEntry.consumedWeightKg/VolumeM3/MMBtu/Density` | — | Net Consumed | **NEAR** (name differs, concept matches) |
| `SettlementLedgerEntry.lossesKg/lossesPercent` | — | Losses (Kg/%) | **EXACT** |
| `SettlementLedgerEntry.varianceMMBtu` | — | (no direct xlsx field named) | n/a |
| — | — | Stock Awal/Akhir, Stock Balance (rolling monthly stock) | **GAP** — no rolling stock-balance field anywhere |
| `DailyMasterRecord.{level,levelM3,levelMmH2O,pressureMPa,tempC,remarks}` (`types/lng.ts:232-251`) | pressure_gauge_us, pressure_transmitter_us, temperature_gauge_us (examples only) | — | **NEAR** — daily-report wants gauge/transmitter split per-slot; existing record has single flattened value + free-text remarks, no per-slot structure |
| — | reading_status text values (`Progress Order`, `Low pressure warning`, `Belum terbaca di panel`) | — | **GAP** — no such enum/status field exists in code anywhere; UI only has icing state (`NORMAL/MODERATE/SEVERE`) and a free gas-leak text dropdown, unrelated |
| `FleetTankItem` node/position fields (`types/lng.ts:139-164`) | — | (ISO Tank Logistics round-trip flow) | **NEAR** — current-state only, no transition history/dwell-time/direction/cycle-count (see Answer D) |
| — | Prepared by / Acknowledged by signature block | — | **GAP** in this domain, but see Answer F — `moc_plan_of_change` DAO has a directly reusable text+timestamp pattern from a different module |

---

## 3. Reconciliation Answers

**A. Metering A/B field overlap** — Real overlap exists in `GasQualityMasterRecord`
(`src/types/gasQuality.ts`, written via `PortalDataContext.saveGasQualityRecord`,
ZERO-TOUCH): Pressure (Barg), Temp (°C), Density (`lineDens`), GHV, and Energy
(`mmbtu`) all already exist — **daily granularity only** (one row per `date`, no
shift-slot dimension). Differential Pressure (inH2O) and Flowrate Variance
(Highest/Lowest/Average) are **true gaps** — absent from this schema and everywhere
else searched. Volume fields exist but in **MMCF**, not the requested **MSCF**.
→ A 4-hour-shift patrol reading is a genuinely different granularity/use case from
this daily ledger, so it is not a duplicate — but new patrol fields should reuse the
existing field names/units where they overlap (`pressBarg`, `tempC`, `lineDens`,
`ghv`, `mmbtu`) for consistency rather than reinventing naming.

**B. Monthly Report data lineage** — `NiasCustodySettlementTab.tsx` ("MONTHLY REPORT")
computes its figures via a live `useMemo` aggregation directly over `settlementRecords`
/ `fleetTanks` from `PortalDataContext` (ZERO-TOUCH) — **not** a separately maintained
monthly table or xlsx import path. A Daily→Monthly rollup for the new domains can
follow this same pattern as a pure aggregation query. Caveat: the tab's trend-chart
sub-panel uses a synthetic `generateMonthlyTrendData()` generator, not real records —
do not treat that sub-panel as a real data source if referencing this file further.

**C. ISO Tank consumption/loss fields** — "Awal"/"Akhir" terminology does not exist
anywhere in code (grep hits were unrelated substrings). The closest existing analogue
is `SettlementLedgerEntry` (`src/services/settlementService.ts`): delivered/consumed
weight, volume, density, temp, GHV, MMBtu, plus `lossesKg`/`lossesPercent` and
`varianceMMBtu` — but this is a **per-delivery-event ledger**, not a **rolling monthly
Stock Balance**. No Stock Awal/Akhir or rolling Stock Balance field exists anywhere.
**Confirmed: this monthly reconciliation view is a genuinely new domain — no ALTER
target exists.** Field naming should follow `SettlementLedgerEntry`'s existing English
convention rather than introducing literal Indonesian field names into TS types.

**D. ISO Tank Logistics tab overlap** —
- *(a) Already covered by `GlobalFleetHubView.tsx`*: current node/bucket membership
  (5 static buckets mapped 1:1 to `NodeState`, L19-55), per-tank identity (`tankNo`,
  `serialNo`), a live snapshot of `level`/`pressureMPa` per card (L141-151), manual
  re-bucketing via drag-drop or dropdown (L106-126) — both paths call
  `batchTransitionTanks`.
- *(b) Gaps*: no transition history/audit log (`applyBatchTransitionTanks`,
  `tankOperationsService.ts:258-273`, is a pure field overwrite with no timestamp), no
  dwell-time field, no direction-of-travel indicator (outbound vs. return use identical
  node values), no cycle/trip-count concept, and `tempC`/heel-backhaul sub-objects
  exist on the type but aren't rendered in this view.
- *(c) Recommendation*: **build a new parallel view; do not extend
  `GlobalFleetHubView.tsx` in place.** Reasoning: the file is already at 253 lines —
  over the 250-line hard cap with zero headroom, so any in-place addition would force
  a mandatory Boy-Scout-rule refactor of a stable, working file outside this task's
  scope. It is also architecturally a **static bucket board** (current-state snapshot)
  while "Logistics" needs a **timeline/history view** (transitions, dwell, direction,
  cycle count) — a different concern, not a mode toggle on the same screen. Both views
  can safely read the same `fleetTanks` array from `usePortalData()` with zero
  conflict; a new transition-log table (if pursued) would be populated by the new
  view's own boundary, not by modifying `tankOperationsService.ts`.

**E. FORM-NP-08-33-N canonical field spec** — Re-confirmed clean negative across the
entire repo (src/, docs/, public/docs/, data/, root): no hits for `NP-08-33`,
`FORM-NP-08`, `08-33-N`, `Progress Order`, `Low pressure warning`, or
`Belum terbaca`. One incidental hit for "Critical Event" in `public/docs/sop/NP-03.md`
is unrelated trucking/traffic SOP content. **No in-repo canonical spec exists.**
Per the task instructions, this is accepted as a risk rather than a blocker since HJ
has reviewed the physical PDF directly — but the exact field list for `field_values`
per domain and for `daily_report_critical_events` still needs HJ's direct
enumeration before DDL is finalized (only 3 example field names were given in the
Stage 12 prompt).

**F. Signature capture mechanism** — No image/canvas-based signature capture exists
anywhere in the repository (searched `type="file"`, `<canvas`, `SignaturePad`,
`signature_image`, `base64`, `toDataURL`, `FileReader` — no genuine hits). Two
text-attestation precedents exist:
- **Best reuse candidate**: `src/cmms-moc/dao/mocPlanDao.ts:68-92` and
  `mocCompletionDao.ts:69-125` — a DB-persisted approval chain in table
  `moc_plan_of_change` with columns `drawn_up_by`, `reviewed_by`, `approved_by`,
  `approved_at` (name string + timestamp, no image), backed by `src/types/moc.ts`.
- Weaker precedent: `ShiftHandoverModal.tsx:31-56` — in-memory-only click-to-sign
  boolean+timestamp pattern (`offGoingSigned`/`incomingSigned` + `*SignedAt`), discarded
  on reset, not DB-persisted — reusable for the *UI interaction* only.
- Minor precedents: `signedBy`/`approvedBy` plain string fields in
  `manpowerActual.ts`/`manpowerOverride.ts`.
→ If HJ confirms name+timestamp attestation is acceptable (no image), the
`moc_plan_of_change` DAO shape is the direct model to follow.

---

## 4. Recommended ALTER-vs-CREATE Decision Per Domain

| Domain | Decision | Justification (file/table cited) |
|---|---|---|
| Metering (Train A/B, 4-hr patrol) | **CREATE** (`daily_ops_patrol_entries`) | `GasQualityMasterRecord`/`gasQualityRecords` (ZERO-TOUCH, `PortalDataContext`) is daily-only with no shift-slot dimension and must not be altered; reuse its field names/units for consistency instead. |
| ISO Tank (4-hr patrol, ORU domain) | **CREATE** (parallel row, `domain='iso_tank'`) | `NiasActiveBayWorkspace.tsx` has no dedicated table at all — patrol values are flattened into `DailyMasterRecord.remarks` via ZERO-TOUCH `batchUpdateDailyMasterRecords`; nothing to ALTER, matches the original Stage A fallback rule. |
| AAV / N2 Skid / GC / Electrical | **CREATE** (`daily_ops_patrol_entries`, new domains) | No existing schema/table of any kind found for these equipment classes anywhere in the repo. |
| ISO Tank Logistics (round-trip / dwell / history) | **CREATE**, if pursued | `GlobalFleetHubView.tsx` (253 lines, over cap) + `tankOperationsService.ts:258-273` only overwrite `location`/`node` in place — no timestamp/history concept exists anywhere (`FleetTankItem`, `types/lng.ts:139-164`), so no ALTER target exists; scope decision flagged to HJ below. |
| Monthly reconciliation / Consumption ISOTank (Stock Awal/Akhir, Stock Balance) | **CREATE** | `SettlementLedgerEntry` (`settlementService.ts`) covers per-event delivered/consumed/loss but has no rolling stock-balance field; genuinely new domain, should follow its English naming convention. |
| Daily report snapshot / critical events / signatures | **CREATE** (`daily_report_snapshots`, `daily_report_critical_events`, `daily_report_signatures`) | No existing snapshot-freeze or signature-persistence pattern in the daily-ops domain; nearest analogue is `moc_plan_of_change` (`mocPlanDao.ts:68-92`) for the signature column shape only. |
| `pid_tag_coordinates` | **CREATE** | No existing P&ID coordinate/tag-position table anywhere in the repo. |

**Net result: every new domain in Stage A is a CREATE, not an ALTER.** No existing
shared/ZERO-TOUCH table needs schema modification — this audit found no ALTER target
for any of the 7 planned domains, which simplifies Stage A's DDL risk (no ALTER-only
policy tension) but confirms the volume of genuinely new schema is larger than
originally assumed.

---

## 5. Open Items Requiring HJ Decision Before Stage A DDL

1. Confirm ISO Tank Logistics is built as a **new parallel view**, not an in-place
   extension of `GlobalFleetHubView.tsx` (already at 253 lines, over the 250-line cap
   with zero headroom).
2. Confirm whether tank transition history / dwell-time / direction-of-travel /
   cycle-count tracking is **in-scope for Stage A** (requires a brand-new CREATE table,
   since no such concept exists anywhere today) or deferred to a later phase.
3. Confirm signature capture mode: **name+timestamp** (reusing the
   `moc_plan_of_change` DAO pattern — the only precedent in the repo) vs. **image
   upload** (would be entirely greenfield, zero in-repo precedent).
4. Full field list for `daily_ops_patrol_entries.field_values` per domain and for
   `daily_report_critical_events` — only 3 example field names were given in the
   Stage 12 prompt; the complete list exists only in the physical PDF HJ has reviewed.
5. Unit reconciliation: existing metering volume fields (`uvol`/`cvol`) are stored in
   **MMCF**; the daily/monthly report fields are named in **MSCF**. Confirm whether new
   patrol/report fields should adopt MSCF literally or continue the codebase's MMCF
   convention with a documented conversion.
6. Confirm Differential Pressure (inH2O) and Flowrate Variance (Highest/Lowest/Average)
   are genuinely new fields to add (confirmed absent from all existing metering
   schemas in this audit).
7. Confirm field-naming convention for the new Consumption/Stock-Balance domain:
   follow `SettlementLedgerEntry`'s existing English convention vs. literal
   Indonesian terms from the source xlsx (Awal/Akhir/Stock).
8. Note (not a blocker): `saviour/SaviorStowageTab.tsx` has no independent data path
   (prop-drilled from `MvSaviourView.tsx`) — flag if any new Marine Transit
   integration is planned to touch this tab.
