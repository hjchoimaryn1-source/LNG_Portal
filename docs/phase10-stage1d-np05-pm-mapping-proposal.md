# Phase 10 — Stage 1D: NP-05 PM Mapping Proposal

**확정 아님 — HJ 검토 필요.** This document is a candidate mapping only. No row was
inserted into `pm_schedules` (or anywhere else) as part of producing this file —
verified via `git diff` and a direct row-count check against `nias_cmms.db`
before/after (see Stage 1D commit message). Insertion requires an explicit HJ
approval comment on this document, per a later stage's scope.

Source of the 9-item gap list: `docs/phase10-stage0-investigation-report.md`
Task 5 (NP-05 Ch.2 §2.1 object list + Ch.7 §7.4 calibration object). Candidate
`equipment_tag` values below were read directly from the live `assets` table in
`nias_cmms.db` (127 rows: 120 `ISO_TANK`-class rows `NIAS-10-TK-1`..`NIAS-10-TK-120`,
plus 7 `[MOCK]` fixed-equipment rows pending the real `FIXED_EQUIPMENT_CSV`
per `scripts/run-cmms-bootstrap.ps1`) — not guessed.

**Unit convention (needs HJ confirmation)**: `CMMS_Architecture.md` §4.4 does not
state units for `pm_schedules.interval_value`. This proposal follows the
existing `work_orders.pm_cycle_days` convention (`src/utils/pmScheduleCalculator.ts`)
and expresses every `CALENDAR` interval in **days** (Weekly=7, Monthly=30,
Quarterly=90, Semi-annually=180, Annually=365, Biennial=730, Every 3 years=1095,
Every 5 years=1825). No `RUNNING_HOURS` candidate is proposed below — NP-05 does
not express any of these 9 items' intervals in running hours anywhere in the
document.

---

## Summary Table

| # | NP-05 item | Candidate `equipment_tag` | Candidate `interval_type` / `interval_value` | NP-05 citation |
| --- | --- | --- | --- | --- |
| 1 | LNG ISO Tank | `NIAS-10-TK-1` .. `NIAS-10-TK-120` (all 120, class-level template) | Multiple concurrent schedules — see Item 1 detail | Ch.8 §8.7/§8.8/§8.9/§8.10 |
| 2 | Ambient Air Vaporizer (AAV) | `NIAS-20-VP-101` (`[MOCK]`) | `CALENDAR` / 30 (Monthly PM); see detail for Weekly/Daily/Annual | App 02.7, App 02.9, App 01.1 |
| 3 | NG Buffer Tank | **No candidate found** | — | — |
| 4 | NG Metering Skid | `NIAS-30-FE-401` (`[MOCK]`) | `CALENDAR` / 365 (Annual loop check/calibration) | App 01.1 (Instrumentation row); App 03/04 (no fixed interval stated) |
| 5 | Vent Stack | `NIAS-30-VT-501` (`[MOCK]`) | **No interval stated anywhere in NP-05** | — |
| 6 | Pressure Safety Valves (PSV) | **No standalone asset row** — see detail | `CALENDAR` / 30 (visual) + `CALENDAR` / 365 (popping test/recert) | App 01.1 (PSVs row); Ch.8 §8.9 (ISO-tank PSVs S-1/S-2/S-3/A-13, every 2 yrs) |
| 7 | Emergency Shutdown (ESD) Valves | **No standalone asset row** — see detail | `CALENDAR` / 90 (alarm/interlock test) + `CALENDAR` / 365 (functional test/backup) | App 01.1 (DCS & ESD Systems row) |
| 8 | Fire & Gas Detection System | **No standalone asset row** — see detail | `CALENDAR` / 30 (bump test) + `CALENDAR` / 180 (full calibration/loop test) | App 01.1 (Fire & Gas System row) |
| 9 | Tube-type gas detectors (calibration) | **No standalone asset row** — see detail | **Not a CALENDAR/RUNNING_HOURS interval** — see detail | Ch.7 §7.4 |

**3 of 9 items have zero usable candidate** (NG Buffer Tank, Vent Stack's interval, and no item 6/7/8/9 has a trackable `equipment_tag` today) — this is a
finding in itself, not just a mapping gap: **the `assets` table has no
component-level rows for PSVs, ESD valves, Fire & Gas detectors, or gas
detector instruments** — only top-level skids/tanks are tracked. `pm_schedules.equipment_tag`
has a `NOT NULL` FK to `assets(equipment_tag)` (see `phase10_stage1a_mro_schema.sql`),
so **none of items 6-9 can be inserted into `pm_schedules` as currently
designed** without either (a) adding component-level asset rows first, or (b)
attaching their PM definition to the nearest parent skid/tank tag as a proxy —
neither decision was made here; it is flagged for HJ.

---

## Item Detail

### 1. LNG ISO Tank

Applies uniformly to all 120 `NIAS-10-TK-*` rows in `assets` (`iso_14224_class = 'ISO_TANK'`).
NP-05 Ch.8 §8.7/§8.8 define **four concurrent** inspection cadences for the
same equipment, not one — a single `pm_schedules` row cannot represent this;
this would need 4 rows per tank (480 rows total) if implemented literally:

| Sub-item | interval_type | interval_value (days) | Citation |
| --- | --- | --- | --- |
| Daily visual (body/frame/valves/gauges) | CALENDAR | 1 | Ch.8 §8.7 Daily Inspection |
| Weekly (ESD valve test A-3/A-5/A-17, VM-1 vacuum check) | CALENDAR | 7 | Ch.8 §8.7 Weekly Inspection |
| Monthly (gauge calibration, S-3/S-6/A-13 functional test, flange leak test) | CALENDAR | 30 | Ch.8 §8.7 Monthly Inspection |
| Annual (UT thickness, vacuum re-check, repaint) | CALENDAR | 365 | Ch.8 §8.7 Annual Inspection |
| Biennial PSV replacement (S-1/S-2/S-3/A-13) | CALENDAR | 730 | Ch.8 §8.9 |
| 5-year full internal/recertification | CALENDAR | 1825 | Ch.8 §8.10 |

Recommendation for HJ decision: whether to (a) create one `pm_schedules` row
per cadence per tank (480+ rows), (b) create one row per cadence as a
tank-class template with a separate mechanism to fan it out per tag, or (c)
start with only the Annual + Biennial rows (the two tied to a hard regulatory
requirement, §8.8/§8.9) and defer Daily/Weekly/Monthly to a lighter-weight
checklist mechanism instead of `pm_schedules`. **Not decided in this stage.**

### 2. Ambient Air Vaporizer (AAV)

Candidate tag: `NIAS-20-VP-101` (`[MOCK]` — real tag pending `FIXED_EQUIPMENT_CSV`,
see `scripts/run-cmms-bootstrap.ps1` comment). Multiple cadences again:

| Sub-item | interval_type | interval_value (days) | Citation |
| --- | --- | --- | --- |
| Daily visual (frost/dust/vibration) | CALENDAR | 1 | App 02.7 Daily Inspection |
| Weekly (fin cleaning, structural check) | CALENDAR | 7 | App 02.7 Weekly Inspection |
| Monthly PM (tube/fin cleaning, torque check, thermal imaging) | CALENDAR | 30 | App 02.7 Monthly PM; App 01.1 row confirms Weekly visual / Quarterly tune-up split differently — **conflict, see below** |
| Annual (NDT, structural/laser alignment, recoating) | CALENDAR | 365 | App 02.9 |

**Internal NP-05 inconsistency flagged, not resolved**: App 01.1's "Vaporizers"
row states *Weekly* visual + *Quarterly* tube/burner work, while App 02
(AAV-specific) states *Weekly* fin cleaning + *Monthly* PM + *Annual* NDT, with
no explicit Quarterly step. These two sections of the same NP-05 document do
not fully agree on AAV cadence. Proposal defaults to App 02 (AAV-specific,
more detailed) as primary source, but this conflict needs HJ resolution before
insertion.

### 3. NG Buffer Tank

**No candidate found.** Not present in `assets` (7 `[MOCK]` non-ISO_TANK rows
checked by name: BOG Compressor, Emergency Generator, LNG Feed Pump, AAV,
Gas Metering Skid, Pressure Regulator Station, Vent Stack — none is a buffer
tank). Not present in NP-05 App 01.1's equipment list either (closest: the
generic "Pressure Vessels" bullet under App 01.2's "Every 3 Years" list, which
names no specific tag or asset). **No mapping possible without new asset data
first.**

### 4. NG Metering Skid

Candidate tag: `NIAS-30-FE-401` (`[MOCK]`). NP-05 has two dedicated procedures
(App 03 general maintenance, App 04 custody-transfer calibration) but **neither
states a numeric interval** — App 03/04 describe procedure steps only. The one
concrete number available is App 01.1's generic "Instrumentation (PT, TT, FT,
LT)" row: Annual loop check / zero-span verification (`ISA-37`). Proposal uses
that as a proxy interval for the metering skid's instrumentation, but this is
a weaker citation than Items 1/2/6/7/8 (App 03/04 give no interval of their
own to confirm or contradict it against).

| Sub-item | interval_type | interval_value (days) | Citation |
| --- | --- | --- | --- |
| Instrument loop check / calibration (proxy) | CALENDAR | 365 | App 01.1 Instrumentation row |

### 5. Vent Stack

Candidate tag: `NIAS-30-VT-501` (`[MOCK]`). **No interval, procedure, or
maintenance mention of "Vent Stack" appears anywhere in NP-05.md** (checked
App 01.1's equipment list and all appendix headings — not present). It only
appears in NP-05 Ch.2 §2.1's object list as part of "Regasification System".
**No interval candidate can be proposed from this document.**

### 6. Pressure Safety Valves (PSV)

No standalone `assets` row exists for any PSV. NP-05 Ch.8 §8.9 names specific
ISO-tank PSV tags (`S-1`, `S-2`, `S-3`, `A-13`) but these are components of
each ISO tank, not separate `assets.equipment_tag` rows, and App 01.1's "PSVs"
row is generic (no tag). Two candidate cadences, sourced from two different
NP-05 sections that roughly agree:

| Sub-item | interval_type | interval_value (days) | Citation |
| --- | --- | --- | --- |
| Visual inspection | CALENDAR | 30 | App 01.1 PSVs row ("Monthly") |
| Popping test & recertification | CALENDAR | 365 | App 01.1 PSVs row ("Annually") |
| Full replacement (ISO-tank PSVs specifically) | CALENDAR | 730 | Ch.8 §8.9 (every 2 years) |

HJ decision needed: attach to the parent ISO tank tag (`NIAS-10-TK-*`) as a
proxy, since no PSV-specific tag exists in `assets` today, or defer until
component-level asset rows are added.

### 7. Emergency Shutdown (ESD) Valves

No standalone `assets` row. Ch.8 §8.7/§8.11 name ISO-tank-specific ESD/shutoff
tags (`A-3`, `A-5`, `A-17`), again components, not top-level assets. App 01.1's
"DCS & ESD Systems" row is generic:

| Sub-item | interval_type | interval_value (days) | Citation |
| --- | --- | --- | --- |
| Alarm & interlock test | CALENDAR | 90 | App 01.1 DCS & ESD Systems row ("Quarterly") |
| Functional test & software backup | CALENDAR | 365 | App 01.1 DCS & ESD Systems row ("Annually") |
| Weekly function test (ISO-tank-specific A-3/A-5/A-17) | CALENDAR | 7 | Ch.8 §8.7 Weekly Inspection |

Same proxy-tag question as Item 6.

### 8. Fire & Gas Detection System

No standalone `assets` row.

| Sub-item | interval_type | interval_value (days) | Citation |
| --- | --- | --- | --- |
| Detector bump test | CALENDAR | 30 | App 01.1 Fire & Gas System row ("Monthly") |
| Full calibration & loop test | CALENDAR | 180 | App 01.1 Fire & Gas System row ("Semi-annually") |

### 9. Tube-type gas detectors (Ch.7 §7.4 calibration object)

No standalone `assets` row. **This item does not fit the `pm_schedules.interval_type`
CHECK constraint (`RUNNING_HOURS`/`CALENDAR`) at all**: NP-05 Ch.7 §7.4 states
the calibration interval "applies to outfitting validity" — i.e., tied to the
manufacturer's sensor/cartridge expiry/validity date printed on the unit, not
a fixed calendar cycle from last-performed date, and §7.4's second bullet
triggers calibration reactively ("when conspicuous error is found ... report
... for calibration request") rather than on any schedule at all. Neither
`CALENDAR` (fixed days-from-last-performed) nor `RUNNING_HOURS` correctly
models "expires on a printed validity date" or "on-demand upon defect report."
**No interval_type/interval_value is proposed for this item** — it needs either
a schema extension (a third interval type, or an expiry-date field) or a
decision to track it outside `pm_schedules` entirely. Flagged for HJ, not
resolved here.

---

## What this document does NOT do

- No row was written to `pm_schedules`, `assets`, or any other table.
- No `pm_code` values were minted (real IDs should be assigned at insertion
  time, once approved, not guessed here).
- No decision was made on the four open HJ questions raised above (Item 1's
  480-row-vs-template question, Item 2's App01/App02 conflict, Items 6-8's
  proxy-tag question, Item 9's interval-type gap).
