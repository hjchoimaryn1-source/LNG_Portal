# Phase 10 — Stage 0 Investigation Report (Read-Only)

Date: 2026-09-12
Scope: Reconnaissance only, `asset_parts_impa` / `work_orders` / `pm_schedules` / `inventory_ledgers`. No source files were created, edited, or scaffolded during this investigation. `evaluateSafetyGateRules` was read only (as it appears — see Task 4); it was not modified.

---

## Task 1 — Current State of the Four Target Domains

**Finding: none of the four named domains exist as the task describes them. There are three divergent, non-overlapping inventory/PM designs in this repo, and only one of the three is actually wired to a live DB + UI.**

| Domain named in scope | Real-vs-mock | Where |
| --- | --- | --- |
| `work_orders` | **Real, DB-backed, but a heavily collapsed subset of the spec.** | `schema/cmms_schema.sqlite.sql:246-260`, DAO `src/adapters/db/workOrderDao.ts`, adapter `src/adapters/workOrderDbAdapter.ts`, route `src/app/api/v1/cmms/work-orders/route.ts`, hook `src/components/workorder/hooks/useWorkOrders.ts` |
| `pm_schedules` | **Does not exist as a table.** Explicitly collapsed into `work_orders.pm_cycle_days` by design (see comment at `schema/cmms_schema.sqlite.sql:238-244`). | n/a |
| `asset_parts_impa` | **Exists as DDL only — zero code references anywhere in `src/`.** Pure dead schema. | `schema/cmms_schema.sqlite.sql:164-179` |
| `inventory_ledgers` | **Does not exist anywhere** — not in either schema file, not in any TypeScript file. Zero hits repo-wide. | n/a |

**Schema drift vs. `CMMS_Architecture.md` §4.1/§4.4 — `work_orders`:**

Spec (`CMMS_Architecture.md:708-729`) defines `work_orders` with `wo_number`, `equipment_tag`, `wo_type` (PM/CM/CBM), `priority` (EMERGENCY/HIGH/MEDIUM/LOW), `status` (DRAFT/APPROVED_SCHEDULED/WAITING_PTW/IN_PROGRESS/COMPLETED/CANCELLED), `is_ptw_required`, `permit_id` (FK to `permits`), `running_hours_at_creation`, scheduled/actual start-end dates, `assigned_leader_id`.

Runtime (`schema/cmms_schema.sqlite.sql:246-260`) only has: `work_order_id`, `asset_tag`, `title`, `pm_cycle_days`, `last_performed_at`, `next_due_date`, `status` (`SCHEDULED`/`IN_PROGRESS`/`PARTS_PENDING`/`COMPLETED` — a completely different, shorter enum with no `CANCELLED` and no `WAITING_PTW`), `created_at`.

**Missing entirely from the runtime table: `wo_type`, `priority`, `is_ptw_required`, `permit_id`, `running_hours_at_creation`, `assigned_leader_id`, scheduled/actual dates.** This is not a naming difference — it means the DB has no column to persist a PTW-required flag or a permit linkage even if `evaluateSafetyGateRules` were wired up (see Task 4).

**The actual work-order UI is a two-source hybrid, not purely mocked or purely real:**
- `mockWorkOrderGenerator.ts` (`src/components/cmms/mockWorkOrderGenerator.ts`) derives `category`/`priority`/`tech`/`permitRefNo`/`desc` (`"[MOCK] {assetName} — routine inspection"`) **in-memory on every render** from real `CmmsAssetRow[]` + `PTWPermit[]` — nothing here is persisted.
- `useWorkOrders.ts` merges that decorative array with the **real** `status`/`next_due_date` fields fetched from the SQLite `work_orders` table (fetch-then-seed-once pattern: GET, and only if empty, POST the decorative items in as a one-time seed).
- `workOrderRecordMapper.ts` explicitly documents this split ("DB가 SSOT인 status/next_due_date만 WOItem에 덮어쓴다").

So: WO **identity, title, and asset linkage** are DB-backed and real; WO **category/priority/technician/permit-link display** is synthetic and regenerated every render, never persisted, and has no DB column to persist into even if it were.

**MRO/parts domain: a *third*, entirely separate schema exists that is not named anywhere in this task's scope, and it is the one actually wired end-to-end:** `mro_parts` / `mro_stock_transactions` / `mro_purchase_requisitions` (DDL added in `src/adapters/db/cmmsDbSingleton.ts:96-143`, DAO `src/adapters/db/mroInventoryDao.ts` + `purchaseRequisitionDao.ts`, adapters `mroInventoryDbAdapter.ts` / `purchaseRequisitionDbAdapter.ts`, API routes under `/api/v1/cmms/mro-inventory*`, hooks `useMroInventory.ts` / `usePurchaseRequisitions.ts`, UI `MroInventoryView.tsx`). This is real, DB-backed, fetch-then-seed-once (mock seed data in `src/data/01_raw_docs/mockMroInventoryGenerator.ts`), and is the live inventory system today.

This does **not** correspond to the spec's `inventory_items`/`inventory_ledgers` (`CMMS_Architecture.md:747-777`, `impa_code` PK, IMPA-catalog-keyed) nor to the SQLite DDL's `impa_catalog`/`asset_parts_impa` (equipment↔IMPA-part mapping). `mro_parts.part_no` uses an unrelated `MRO-XXX-###` numbering scheme with **no `equipment_tag` column at all** — the live inventory table has no linkage to assets, IMPA codes, or work orders' asset field whatsoever (only an optional free-text `work_order_id` on the transaction log).

**Net effect: there are three non-interoperable inventory designs in this codebase** (spec's `inventory_items`/`inventory_ledgers`, SQLite DDL's `impa_catalog`/`asset_parts_impa`, and the actually-live `mro_parts`/`mro_stock_transactions`/`mro_purchase_requisitions`), and Phase 10's stated scope (`asset_parts_impa`, `inventory_ledgers`) names the two that are **not** in use.

---

## Task 2 — IMPA Catalog Integration State

- **`IMPA_Store_Code` reference file: not found anywhere in the repo** (checked `data/`, `public/`, `src/`, repo root — no CSV/JSON/MD file with that name or IMPA store-code content exists).
- **`impa_catalog` and `asset_parts_impa`: zero code references.** `grep -rl "asset_parts_impa\|impa_catalog" src` returns nothing. These tables exist only as `CREATE TABLE` statements in `schema/cmms_schema.sqlite.sql`; nothing in `src/` ever inserts into, selects from, or even imports a type referencing them. They are not wired into `cmmsDbSingleton.ts`'s runtime bootstrap DDL either — only the offline schema file mentions them.
- **The `impaCode` that *is* wired up (`src/adapters/assetAdapter.ts:118-121`, `resolveImpaCode`) is a different concept entirely**: it's a per-asset legacy classification field carried through the staging pipeline (`legacyImpaCodeRaw` → `proposedImpaCode` → `SafeAssetView.impaCode`, falling back to the sentinel `UNMAPPED-IMPA` when blank). It is **not** a foreign key into any parts catalog and has no relationship to `asset_parts_impa`/`impa_catalog`.
- **Cross-reference requested by the task (does the mock-WO legacy-tag mismatch pattern also affect parts linkage?): the premise doesn't apply, because there is no WO↔part linkage of any kind in the current implementation.**
  - `WOItem` (`src/types/lng.ts:551-566`) has no parts/part-reference field at all — only `wo`, `cat`, `tag`, `type`, `desc`, `priority`, `due`, `tech`, `status`, `permitRefNo`.
  - The live inventory table `mro_parts` has no `equipment_tag`/asset FK column; `mro_stock_transactions.work_order_id` is a nullable free-text field with no FK constraint and is never populated from the WO UI today (`grep` shows no caller passing `workOrderId` into `adjustStock`).
  - So the specific failure mode the task hypothesized (mock WO part references using a legacy tag format incompatible with real `asset_parts_impa` keys) cannot occur today, because no code path produces a WO→part reference to compare in the first place. The relevant risk is broader: **when parts linkage is eventually built, it will have to be built from scratch against whichever of the three schemas (Task 1) is chosen as SSOT** — there is no existing linkage logic to inherit a tag-format bug from.
  - Separately, confirmed the actual `WOItem.tag` value **is** the real, normalized `equipmentTag` from `CmmsAssetRow` (`mockWorkOrderGenerator.ts:88`), i.e. already in the same tag format `asset_parts_impa.equipment_tag` would expect if that table were ever wired up. The known LINKED=0 issue is specifically a **WO↔PTW-permit** tag mismatch (`INITIAL_PTW_PERMITS` mock data using its own unrelated equipment tags), not a WO↔asset or WO↔part mismatch.

---

## Task 3 — ROP (Reorder Point) Trigger Logic

**Finding: real, working, event-driven ROP logic exists — but it lives entirely inside the `mro_*` schema (Task 1), not `inventory_ledgers`, and it implements a simplified rule, not the spec's statistical formula.**

- Location: `mroInventoryDbAdapter.adjustStock()` (`src/adapters/mroInventoryDbAdapter.ts:53-69`), calling `adjustPartStock()` (`src/adapters/db/mroInventoryDao.ts:173-202`) and `ensureOpenRequisition()` (`src/adapters/purchaseRequisitionDbAdapter.ts:30-35`).
- **Trigger condition**: after every stock adjustment (RECEIPT/ISSUE/ADJUSTMENT/RETURN/SCRAP), if `result.part.currentStockQty < result.part.minStockQty`, a purchase requisition is auto-created with `triggerReason: 'AUTO_LOW_STOCK'`.
- **Dedup guarded**: `ensureOpenRequisition` checks for an existing OPEN PR for that part first and returns it instead of creating a duplicate (`selectOpenRequisitionByPart`) — matches the DDL comment's "부품당 OPEN 상태 PR은 항상 최대 1건만" invariant.
- **Fires against live data**: this is event-driven (fires synchronously inside the same request that mutates stock), not a polling/cron job, and it reads the current row in the real `mro_parts` table at the moment of adjustment — i.e., live once past the one-time mock seed (`useMroInventory.ts` seeds `buildMockMroParts()` only if the table is empty on first load; every mutation after that is a real DB write via `/api/v1/cmms/mro-inventory/adjustments`).
- **Drift vs. spec**: `CMMS_Architecture.md` §4.3 specifies `ROP = (D_avg × LT) + SS` with `SS = Z × σ_d × √LT` (Z=2.33) and a trigger of `(Current Stock + Pending PO) − Reserved WO ≤ ROP`. The implemented rule is a flat `current_stock_qty < min_stock_qty` comparison with no lead-time, demand-variance, pending-PO, or WO-reservation terms — a materially simpler rule than the spec describes.
- The dormant `asset_parts_impa` table also has a reorder index (`idx_parts_stock_reorder ... WHERE current_stock <= reorder_level`, `schema/cmms_schema.sqlite.sql:179`) but, per Task 1/2, nothing ever queries it — it's inert.

---

## Task 4 — Safety Gate Adjacency Check (`evaluateSafetyGateRules`)

**Finding: this function is not implemented anywhere in the codebase. It exists only as a spec code-block.**

- The only place `evaluateSafetyGateRules` appears in the entire repo is as a TypeScript snippet inside `CMMS_Architecture.md` §4.2 (`src/data/02_specifications/CMMS_Architecture.md:671-694`) — pure documentation, never imported or executed.
- The one hit inside `src/` is a **comment**, not code: `src/adapters/ptwStatusMapper.ts:13` — `// (전이 게이트는 evaluateSafetyGateRules 등 기존/SIMOPS 로직의 몫)` — explicitly noting that this state-transition gate logic is *not* this file's responsibility, and referencing the function by name only.
- **Work-order creation/update flow (`route.ts` → `workOrderDbAdapter.ts` → `workOrderDao.ts`) never calls it**, directly or indirectly. Confirmed by reading the full POST/PATCH handlers in `src/app/api/v1/cmms/work-orders/route.ts` — they validate `workOrderId`/`assetTag`/`title`/`lastPerformedAt`/`status` only; there is no `isPtwRequired`, `permitId`, `jobCategories`, or `workAreaZone` field anywhere in the request/response shapes.
- **This is also structurally impossible to wire up today without a schema change**: the spec's `evaluateSafetyGateRules` writes to `work_orders.is_ptw_required` / `permit_id`, and neither column exists in the runtime `work_orders` table (Task 1). Implementing the function alone would have nowhere to persist its result.
- **Boundary-adjacency flag for Phase 10 Stage 1**: Phase 10's planned parts/PM wiring work is expected to touch `src/adapters/db/workOrderDao.ts`, `src/adapters/workOrderDbAdapter.ts`, and possibly `schema/cmms_schema.sqlite.sql`'s `work_orders` definition (e.g., to add PM-cycle/parts-linkage columns). **None of those files currently contain or call `evaluateSafetyGateRules`** (it doesn't exist in code), so there is no live function boundary to carve out yet. However, if Stage 1 also adds `wo_type`/`is_ptw_required`/`permit_id` columns to `work_orders` to close the Task 1 schema-drift gap, that change would land in the exact same table/DAO/adapter files where `evaluateSafetyGateRules` would eventually need to read/write — **recommend Phase 10 Stage 1 explicitly scope whether it is also introducing those columns, since that decision (not the Phase 7-9 hard-boundary list) is what would make `workOrderDao.ts`/`workOrderDbAdapter.ts` safety-adjacent going forward.** No modification was made to any file in this investigation.

---

## Task 5 — NP-05 Inspection/Calibration Gap Analysis

NP-05 Chapter 2 (`public/docs/sop/NP-05.md:172-203`) and Chapter 7 (`:364-391`) are **process/policy chapters, not itemized checklists** — they describe who decides intervals and how records are handled, and name only a small number of concrete object categories:

| # | NP-05 item (Ch.2 §2.1 / Ch.7 §7.4) | Corresponding `pm_schedules`/`work_orders` entry? |
| --- | --- | --- |
| 1 | LNG ISO Tank | **Gap** — no dedicated PM entry; only appears as a generic asset row if present in `CmmsAssetRow[]` |
| 2 | Regasification System — Ambient Air Vaporizer (AAV) | **Gap** |
| 3 | Regasification System — NG Buffer Tank | **Gap** |
| 4 | Regasification System — NG Metering Skid | **Gap** |
| 5 | Regasification System — Vent Stack | **Gap** |
| 6 | Pressure Safety Valves (PSV) | **Gap** |
| 7 | Emergency Shutdown (ESD) Valves | **Gap** |
| 8 | Fire & Gas Detection System | **Gap** |
| 9 | Tube-type gas detectors (calibration object, Ch.7 §7.4) | **Gap** |

**All nine are gaps, for a structural reason, not a data-entry oversight**: since `pm_schedules` doesn't exist as a table (Task 1) and `work_orders` rows are generated by `mockWorkOrderGenerator.ts` with a single generic, deterministic template (`"[MOCK] {assetName} — routine inspection"`, `cat` derived only from criticality tier, `pm_cycle_days` always `null` on seed per `workOrderRecordMapper.toNewWorkOrderInput`), **there is no code path capable of producing an NP-05-item-specific, calendar-or-running-hours PM definition at all** — not just for these 9 items, but for any equipment class. `computeNextDueDate()` (`pmScheduleCalculator.ts`) only supports a flat day-count cycle seeded manually; nothing in the seeding path distinguishes "PSV proof-test interval" from "AAV routine check." (DB row contents were not queried directly — no `sqlite3`/`better-sqlite3`/`node:sqlite`-capable shell was available in this session — but the seeding code path is deterministic and was read in full, so this conclusion holds regardless of current row contents.)

---

## Task 6 — External Overhaul Flow vs NP-06 Ch.6

**Finding: the task's premise doesn't hold. NP-06 Chapter 6 ("Vendor And Subcontractor Maintenance Procedures", `public/docs/sop/NP-06.md:549-1345`) does not describe a physical equipment dispatch/repair/return cycle at all** — it is vendor pre-qualification, contract lifecycle (Drafting → Negotiation → Signing → Implementation → Monitoring → Amendment → Closure), SLA/KPI scoring, and RACI tables for procurement governance. The word "overhaul" does not appear anywhere in `NP-06.md` (repo-wide grep for `overhaul|dispatch|in transit|return.*install` inside NP-06.md returns exactly one unrelated hit — a stores-requisition fax-lead-time clause at line 287).

- The physical dispatch → repair → return sequence the task expected instead lives (partially) in **`CMMS_Architecture.md` §4.4's `external_overhauls` table spec** (`status` CHECK: `DISPATCH_PENDING → IN_TRANSIT_OUT → UNDER_REPAIR → TESTING_INSPECTION → IN_TRANSIT_IN → RETURNED_INSTALLED`, or `CANCELLED`) — but **this table does not exist in the runtime schema, in `cmmsDbSingleton.ts`'s DDL, or anywhere in `src/`.** Zero implementation.
- The closest *implemented-adjacent* SOP text to "external maintenance order" is actually **NP-05 Chapter 6 ("Maintenance by Subcontractors", `public/docs/sop/NP-05.md:329-363`)**, which describes an on-site (not dispatch-away) subcontractor repair order: Requisition (§6.2) → Approval & Ordering (§6.3) → Notification (§6.4) → Implementation: Preparation/Safety Practice/Supervising/Confirming Result (§6.5) → Closing (§6.6). This still doesn't match the spec's ship-away/ship-back cycle (it's subcontractors coming to site, not equipment going to a vendor), but it's the nearest real procedural analog in the SOP corpus.
- **`work_orders.status` comparison**: the runtime enum (`SCHEDULED`/`IN_PROGRESS`/`PARTS_PENDING`/`COMPLETED`) has no state resembling any of NP-06 Ch.6's contract stages, the spec's `external_overhauls` states, or NP-05 Ch.6's Requisition/Approval/Notification/Implementation/Closing stages. **There is no implemented external-overhaul or subcontractor-maintenance status flow to compare against NP-06 Ch.6 — nothing to flag a mismatch in beyond "not built."**

---

## Summary of Key Flags (for Stage 1 re-scoping decision)

1. **The task's named domains (`asset_parts_impa`, `inventory_ledgers`) are dead/nonexistent, and the domain that's actually live in the DB and UI is a third, unnamed schema (`mro_parts`/`mro_stock_transactions`/`mro_purchase_requisitions`)** that has zero linkage to assets or IMPA codes. Stage 1 needs to explicitly decide which of the three inventory designs is SSOT going forward before writing any wiring code — extending the dead `asset_parts_impa` table would create a *fourth* parallel design rather than fixing the gap.
2. **`work_orders` is missing the columns (`wo_type`, `priority`, `is_ptw_required`, `permit_id`, `running_hours_at_creation`) that `evaluateSafetyGateRules` would need to write to, and that function itself doesn't exist in code anywhere — only as a spec snippet.** If Stage 1's parts/PM wiring also touches the `work_orders` schema (likely, since PM-cycle and parts-linkage both live on that table today), it should decide up front whether it is also adding the PTW-gate columns, since that's what would turn `workOrderDao.ts`/`workOrderDbAdapter.ts` into genuinely safety-adjacent files rather than merely comment-adjacent ones.
3. **NP-05 Ch.2/Ch.7 and NP-06 Ch.6 don't map onto the current implementation the way the task assumed**: NP-05's 9 inspection/calibration object categories have zero corresponding PM entries (structural gap, since `pm_schedules` doesn't exist), and NP-06 Ch.6 turned out to be vendor/contract governance, not an equipment-overhaul procedure — the real analog for that is NP-05 Ch.6, and even that doesn't match the spec's `external_overhauls` DISPATCH→REPAIR→RETURN cycle, which is entirely unimplemented.

No files other than this report were created or modified. No `tsc`/`next build` was run.
