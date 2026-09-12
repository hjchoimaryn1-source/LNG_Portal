# Phase 9 — Stage 0 Investigation Report (Read-Only)

Date: 2026-09-12
Scope: Reconnaissance only. No source files were created, edited, or scaffolded during this investigation. `ptwCargoHandlingRules.ts`, `ptwCargoHandlingTransitions.ts` (task referred to it as `Transitions.ts`), `ptwCargoHandlingValidators.ts` (task referred to it as `Validators.ts`), and `ptwStatusMapper.ts` were opened for reading only.

---

## Task 1 — Current State of `src/components/sop/`

**Finding: the SOP module is NOT a stub. It is a complete, already-wired 2-Layer SOP Reference Viewer feature.** This contradicts the framing that Stage 1 is greenfield work — Stage 1 scoping must account for an existing, functioning implementation rather than building from zero.

### Files in `src/components/sop/` (verified by reading, not by filename)

| File | Lines | What it actually does |
| :--- | ---: | :--- |
| `index.ts` | 13 | Barrel export for the whole module (hooks, components, quick-link map/type). |
| `SopReferenceViewer.tsx` | 44 | Top-level 2-pane container: Layer 1 (search + structured cards) on the left, Layer 2 (raw markdown) opens on the right when a card's anchor is clicked. No business logic of its own. |
| `SopSearchPanel.tsx` | 93 | Keyword input + category/importance toggle-chip filters. Pure rendering; delegates filtering to `utils/sopFilter.ts`. |
| `SopStructuredCard.tsx` | 94 | Renders one `SOPDocument`'s `structuredSummary` (purpose/keyRequirements/approvalLine/safetyRules) plus up to 12 level‑≤2 anchor jump-buttons and an "OPEN FULL DOC" button. |
| `SopRawMarkdownViewer.tsx` | 80 | Fetches and renders a raw `.md` file line-by-line, auto-scrolls to and highlights a target anchor line, has PRINT/CLOSE buttons. |
| `sopPrintLayout.tsx` | 134 | A4 print/PDF-style layout (purpose, key requirements, safety rules, approval line, checklists table, then full raw text) toggled from the raw viewer's PRINT button. |
| `SopQuickLinkBar.tsx` | 32 | Renders context-scoped SOP deep-link buttons from `SOP_QUICK_LINK_MAP`; emits `onSelect(link)` only — no side effects of its own. |
| `constants/sopDisplay.ts` | 42 | Category/importance label and badge-color lookup tables. |
| `constants/sopQuickLinkMap.ts` | 53 | Static `SopQuickLinkContext -> SopQuickLink[]` table (9 contexts: 6 PTW hazard types, 2 cargo-handling activity types, 1 work-order context). |
| `utils/sopFilter.ts` | 35 | Pure `filterSopDocuments()` — category/importance/keyword filtering, no React. |
| `utils/sopMarkdownAnchors.ts` | 28 | Pure regex parser: splits raw markdown into lines, extracts trailing `{#anchor-id}` tags, finds the line index for a target anchor. |
| `hooks/useSopIndex.ts` | 29 | Loads `sopIndex.json` once, exposes filtered documents + `findByNpCode`. |
| `hooks/useSopRawMarkdown.ts` | 53 | Fetches a `.md` file from `public/docs/sop/` via `fetch()`, parses it with `sopMarkdownAnchors`. |

All files are within the 250-line hard cap (AGENTS.md §3). No inline modals found; `SopPrintLayout` is a standalone file, correctly separated per the modal/drawer rule.

### `sopIndex.json`

- Found at exactly one location: `src/data/sopIndex.json` (17,637 lines). No other copies exist in the repo.
- Structure: a flat JSON **array** of `SOPDocument` objects (not a keyed map). Verified via direct read (top of file) and `npCode` occurrence scan.
- **Covers all 12 of 12 NP documents** (NP-01 through NP-12), confirmed at these line offsets:
  NP-01:3, NP-02:552, NP-03:1169, NP-04:2146, NP-05:2524, NP-06:8139, NP-07:10477, NP-08:10952, NP-09:12640, NP-10:13343, NP-11:14914, NP-12:17279.
- Per-entry schema (matches `SOPDocument` in `src/types/sop.ts` exactly): `npCode`, `title`, `category`, `importanceLevel`, `keywords[]`, `markdownFilePath`, `structuredSummary{purpose, keyRequirements[], approvalLine[], safetyRules[]}`, `anchors[]{anchorId, headingText, level}`, `checklists[]{checklistId, title, formCode?, items[], signers?}`, `relatedNpCodes[]`, `version`, `lastUpdated`.
- Totals across the file: **2,291 anchor entries**, **112 checklist entries**.
- Spot-check (NP-08 entry, line 10952): `markdownFilePath` is `/docs/sop/NP-08.md` (matches the real file under `public/docs/sop/`), and `structuredSummary.keyRequirements` accurately reflects the real document content (grounding <5Ω, LEL/O2 bands, DOA via Form NP08-38, etc.) — the index was not obviously hand-typed independent of the source doc.

### `src/types/sop.ts` (confirmed to exist; full contents verbatim)

```ts
export type SOPCategory =
  | 'MANAGEMENT_RESPONSIBILITY'
  | 'TRAINING_DRILL'
  | 'LOGISTICS_TRANSPORT'
  | 'AUDIT_SURVEY'
  | 'ASSET_MAINTENANCE'
  | 'PROCUREMENT_CONTRACTOR'
  | 'SSHQE_MANAGEMENT_SYSTEM'
  | 'CARGO_HANDLING'
  | 'SAFETY_PTW'
  | 'ENVIRONMENTAL'
  | 'EMERGENCY_RESPONSE'
  | 'MANAGEMENT_OF_CHANGE';

export type ImportanceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface SOPAnchor {
  anchorId: string;
  headingText: string;
  level: number;
}

export interface SOPChecklistItem {
  itemId: string;
  description: string;
  fieldType: 'CHECKBOX' | 'TEXT' | 'NUMBER' | 'SELECT' | 'SIGNATURE';
  passFailCriteria?: string;
  unit?: string;
  minValue?: number;
  maxValue?: number;
  options?: string[];
  required: boolean;
  anchorId?: string;
}

export interface SOPChecklist {
  checklistId: string;
  title: string;
  formCode?: string;
  items: SOPChecklistItem[];
  signers?: string[];
}

export interface SOPStructuredSummary {
  purpose: string;
  keyRequirements: string[];
  approvalLine: string[];
  safetyRules: string[];
}

export interface SOPDocument {
  npCode: string;
  title: string;
  category: SOPCategory;
  importanceLevel: ImportanceLevel;
  keywords: string[];
  markdownFilePath: string;
  structuredSummary: SOPStructuredSummary;
  anchors: SOPAnchor[];
  checklists: SOPChecklist[];
  relatedNpCodes: string[];
  version: string;
  lastUpdated: string;
}

export interface SOPSearchFilters {
  keyword?: string;
  categories?: SOPCategory[];
  importanceLevels?: ImportanceLevel[];
}
```

### `scadaStyles.ts` — path, exports, and a correction to the task's assumption

- Real path: `src/components/cmms/scadaStyles.ts` (90 lines).
- **`WIN_TAB_INACTIVE` is NOT exported from this file.** It only appears here in two comments ("...동일 톤" / tone-matching notes referencing it). The actual export lives at `src/components/portal/utils/portalTabStyles.ts:6`. Any future SOP component that needs `WIN_TAB_INACTIVE` must import it from `portalTabStyles.ts`, not `scadaStyles.ts`.
- Real exports from `scadaStyles.ts` (verified, in file order): `BEVEL_BUTTON`, `BEVEL_BUTTON_PRESSED`, `BEVEL_ICON_BUTTON`, `RAISED_PANEL`, `SUNKEN_PANEL`, `TITLE_BAR`, `SUNKEN_INPUT`, `CRITICALITY_LABEL`, `CRITICALITY_BADGE`, `CRITICALITY_DOT`, `STATUS_BADGE`, `STATUS_LABEL_KO`, `ALARM_COLORS`.
- Note: the existing SOP components do not currently import from `scadaStyles.ts` at all — they use inline Tailwind classes with hardcoded Win98-bevel hex values (`#d4d0c8`, `#808080`, `#2A3B4C`, etc.) directly in JSX, duplicating rather than reusing the token file. Worth a decision for Stage 1: adopt the token constants or leave as-is.

---

## Task 2 — Anchor-ID Consistency Audit (NP-01 through NP-12)

Method: automated scan (not manual eyeballing) of all 12 files in `public/docs/sop/`, matching every `^#{1,6}\s` heading line and checking for a trailing `` {#anchor-id} `` tag, then checking for duplicate anchor IDs within each file and across all 12 files combined.

| File | Total headings | With valid anchor | Flagged issues |
| :--- | ---: | ---: | :--- |
| NP-01.md | 66 | 65 | H1 title line missing anchor |
| NP-02.md | 74 | 74 | None |
| NP-03.md | 109 | 108 | H1 title line missing anchor |
| NP-04.md | 49 | 47 | H1 title missing anchor; **`### In Scope` (line 60) missing anchor** — the parallel heading in NP-06 (`In Scope`, line 60) *does* have one (`{#np-06-1-2-1-in-scope}`), so this is an inconsistency versus an established pattern, not a one-off style choice |
| NP-05.md | 173 | 172 | H1 title line missing anchor |
| NP-06.md | 182 | 181 | H1 title line missing anchor |
| NP-07.md | 47 | 45 | H1 title missing anchor; **`### Legal Framework` (line 302) missing anchor** |
| NP-08.md | 69 | 67 | **Contamination, not a content gap** — see callout below. Lines 3–4 are leftover Python-generator comment lines that happen to start with `# ` and get matched by a naive heading regex; they are not real SOP headings. All genuine content headings in this file have anchors. |
| NP-09.md | 69 | 67 | H1 title missing anchor; **`##### Common LNG Hazards` (line 294) missing anchor** |
| NP-10.md | 101 | 101 | None |
| NP-11.md | 144 | 144 | None |
| NP-12.md | 30 | 30 | None |
| **Total** | **1,213** | **1,201** | 12 missing-anchor headings total |

**Duplicate check result: zero duplicate anchor IDs found, both within any single file and across all 12 files combined** (verified programmatically over all 1,201 anchor strings). Anchor-ID prefixes are consistent — every anchor in `NP-0N.md` correctly starts with `np-0N-`; no cross-file prefix leakage was found.

**Critical contamination finding (NP-08.md, not a heading/anchor defect — a document-integrity defect):**
`public/docs/sop/NP-08.md` is not a clean markdown file. Its first 6 lines are:
```
import re

# We will construct a comprehensive Markdown document containing all SOPs and Forms for NP-08
# following the exact anchor format: {#np-08-{section-dots-to-dashes}-{slug}}

content = """# NIAS Onshore LNG Regasification Terminal - SOP Master Document (NP-08) {#np-08-master-document}
```
This is leftover Python source (`import re`, generator comments, and a `content = """` triple-quote opener) from whatever script originally produced the document — it was saved into the `.md` file instead of only the string's contents. Consequences:
- Lines 1–5 are garbage that will render literally in `SopRawMarkdownViewer`/`SopPrintLayout` above the real title whenever a user opens "OPEN FULL DOC" for NP-08.
- The real H1 title and its anchor (`{#np-08-master-document}`) are both present, but glued onto the same line as `content = """`, so the anchor still resolves correctly today — but the visible line text a user jumps to will read `content = """# NIAS Onshore LNG Regasification Terminal...` instead of a clean title.
- The file has **no closing `"""`** at the end (verified: last real lines are a `---` divider and an end-of-document italic note), so it is not even syntactically closed as a Python string — this is unambiguously stray content, not an intentional format.
- Recommend a **content-only fix (delete lines 1–5, and strip the `content = """` prefix from line 6)** before Stage 1 builds new UI on top of this file, but that fix is explicitly out of scope for this investigation.

---

## Task 3 — NP-08 Cargo Lifecycle Cross-Check

**Premise correction:** the task asked to extract "the 5 lifecycle chapters/phases as described in NP-08.md." **NP-08.md does not organize itself into 5 lifecycle phases** — it has **10 operational chapters** organized by physical process area (Ch1 Yard Mgmt, Ch2 Lifting, Ch3 General Operational Regas, Ch4 Unloading Skid, Ch5 ISO Tank Mgmt, Ch6 Hose/QCC Maintenance, Ch7 AAV Operating, Ch8 AAV Environmental/Safety, Ch9 Gas Sales Metering, Ch10 STS Transfer). None of them are named or structured as a "DRAFT/PREPARED/APPROVED/ACTIVE/CLOSED"-style lifecycle.

The actual 5-phase `DRAFT -> PREPARED/VERIFIED -> APPROVED/AUTHORIZED -> ACTIVE/VALID -> CLOSED/SURRENDERED` table is **not** in NP-08.md — it lives in a separate distilled spec, `src/data/02_specifications/safety-ptw-rules.md` (§2, lines 33–49), which is the document `ptwCargoHandlingRules.ts`'s file header actually cites as its source ("Source: safety-ptw-rules.md"), not NP-08.md directly. That spec's phase table cross-references NP-08 chapters as follows:

| Phase (per `safety-ptw-rules.md`) | Cited NP-08 source | Chapter in current NP-08.md |
| :--- | :--- | :--- |
| DRAFT | `NP08-09 Gas Sales Metering Procedure` Section 5 | Chapter 9, §2 Line Switching & Calibration Sequence, step 1 "Preparation" (line 281) |
| PREPARED/VERIFIED | `NP08-05 ISO Tank Management Procedure` Pre-Unloading | Chapter 5, §1 Pre-Unloading Safety Controls (lines 217–221) |
| APPROVED/AUTHORIZED | `NP08-03 General Operational Regasification` Section 3 | Chapter 3, §3 Work Management & Authority (lines 187–193) |
| ACTIVE/VALID | `NP08-04 LNG ISO Tank Unloading Skid Procedure` | Chapter 4 (lines 197–211) |
| CLOSED/SURRENDERED | `NP08-09 Gas Sales Metering Procedure` Line Reinstatement | Chapter 9, §2, step 5 "Reinstatement" (line 285) |

**Flag:** this mapping draws the 5 generic PTW states from *four different, non-contiguous* NP-08 chapters (9, 5, 3, 4, 9 again) rather than any single self-contained "lifecycle" section — DRAFT and CLOSED both cite Chapter 9 (Gas Sales Metering), which is a narrow, single-activity procedure, not a general cargo-handling admissions/close-out process. Treat this table as a curated cross-reference, not a literal NP-08 structural feature, when Stage 1 documents "where this comes from" for users.

**Flag — stale citations:** `safety-ptw-rules.md` cites bracketed line/paragraph numbers (e.g. `[74, 78]`, `[126, 133]`, `[396, 398]`) as its source-traceability anchors, and states in its own header that "모든 규정과 데이터 항목은 100% 사실(Ground Truth)에 기반" (all rules are 100% Ground-Truth-based with mapped source citations). **These bracketed numbers do not correspond to actual line numbers in the current `public/docs/sop/NP-08.md`** — e.g. it cites `[74, 78]` for the Crane Operator/Rigger certification requirement, but that content is actually at NP-08.md lines 157–158; it cites `[396, 398]` for the DRAFT-phase JSA/tag-number registration step, but Chapter 9 (Gas Sales Metering) is at line 273 with no JSA/tag-registration content resembling "DRAFT" at all in this file today. This means the two documents have drifted relative to each other (or `safety-ptw-rules.md` was built from a different revision/pagination of the source), and the citations cannot be used as-is to jump to the right spot in the current `.md` files.

**Direct rule-value comparison (code vs. NP-08.md text), flagged discrepancies only:**

| Code constant / gate | Code value | NP-08.md text | Verdict |
| :--- | :--- | :--- | :--- |
| `UNLOADING_LEL_MAX_PERCENT` / `UNLOADING_O2_MIN/MAX_PERCENT` | LEL<10%, O2 19.5–23.5% | Ch5 line 219 and Form NP08-15 (lines 425–428): identical figures, same 4 tag IDs (T-201..T-204) as `CARGO_HANDLING_AGT_MANDATORY_POINTS` | **Match** |
| `GROUNDING_RESISTANCE_MAX_OHM = 5` | <5Ω | Ch5 line 221 and Form NP08-10 line 388: "Target < 5 Ohm" | **Match** |
| `BARRICADE_RADIUS_UNLOADING_MIN_M = 25` | ≥25m | Ch5 line 268 (minor-leak barricade, 25m) | **Match**, but sourced from an *emergency-response* clause, not a routine pre-activation barricade requirement — worth confirming with SME that reuse is intentional |
| `BARRICADE_RADIUS_LIFTING_MIN_M/MAX_M = 50/100` | 50–100m | No explicit "Lifting operation requires 50–100m barricade" statement exists in Ch2 (Lifting, lines 140–166). The only 50–100m figure in the file is Ch5's "Major LNG Leak / Rupture: evacuate personnel (50–100 m radius)" (line 225) — an emergency-evacuation clause for the yard, not a Chapter‑2 lifting-activation precondition. | **Not directly traceable** — code appears to repurpose an unrelated emergency-radius figure as the Lifting activity's standing barricade minimum. Needs SME confirmation. |
| `DEPRESSURIZATION_TARGET_MPA_HOSE = 0.0` (exact-equality gate) | requires `currentPressureMPa === 0.0` | Ch4 line 210: "...**< 0.05 MPa** before hose disconnection." Ch4 line 211 (next sentence): "...ensure **0.0 MPa** on hose gauges..." | **Internally inconsistent SOP text** (line 210 allows up to <0.05 MPa, line 211 says exactly 0.0) — the code sides with the stricter 0.0 reading, meaning a real-world 0.02–0.04 MPa gauge reading would pass the SOP's own line 210 language but fail the code's exact-equality check. |
| `DEPRESSURIZATION_TARGET_MPA_T203 = 0.1` (tag-specific) | 0.1 MPa for tag `T-203` | No NP-08.md text found calling out a distinct 0.1 MPa target specific to gauge/tag T-203; the only stated target in Ch4 is the general 0.4 MPa / <0.05 MPa figure (line 210) | **Not traceable in NP-08.md** — value's origin could not be confirmed from this document. |
| `CRITICAL_HIGH_RISK_WEIGHT_TON = 25` | ≥25t triggers Critical High Risk (Sr. O&M Leader acting-approval + delegation memo + ESDV 3-stage isolation gate) | **Not present anywhere in NP-08.md.** The only weight figures in NP-08.md are unrelated PBU/liquid-supply *switching* thresholds (15.151t, 13.222t/12.33t, Ch4 lines 208–209). The 25-ton figure is instead defined in `safety-ptw-rules.md` §1 (line 28): "25톤 이상 중량물(Loaded LNG ISO Tank, 약 30~34톤 상당)...Lifting 작업" citing its own `[79]` reference (itself one of the stale citations noted above). | **Sourced from `safety-ptw-rules.md`, not from NP-08.md.** Any future NP-08 SOP Viewer page that claims this 25-ton rule "comes from NP-08" would misattribute it. |
| `fireWatchAssigned` mandatory control (applied to both UNLOADING and LIFTING activation) | required for both activity types | "Fire watch stationed" text only found in the STS Transfer form area (line 478, Form NP08-32 area, Chapter 10) — not in Ch2 (Lifting) or Ch4 (Unloading) main procedure text | **Weak traceability** — requirement is real in NP-08 but attached to a third activity (STS) the code doesn't model as its own `CargoHandlingActivityType`, not to Unloading/Lifting directly. |
| `ertStandbyReady` mandatory control | required for activation | "Emergency Response Team (ERT): Standby..." appears in Ch1 (Yard Mgmt / mobilization, line 82); SCBA requirement appears in Ch8 (AAV Environmental/Safety, line 264) — neither is in Ch2 or Ch4 | **Weak traceability** — same pattern as Fire Watch: a real requirement, but pulled from chapters other than the ones governing the activity type it's gating. |

No fixes were made for any of the above — flagging only, per task scope.

---

## Task 4 — SOP Quick-Link Wiring Check

**The wiring exists and resolves to real files/anchors — but the deep-link payload is silently discarded on click, so it degrades to a generic "open SOP tab" action.**

- `SOP_QUICK_LINK_MAP` (`src/components/sop/constants/sopQuickLinkMap.ts`) is consumed via `<SopQuickLinkBar>` in three real, live screens:
  - `src/components/manpower/modals/NewPTWPermitModal.tsx` (line 83–86) — for the 6 non-cargo PTW hazard types (`PTW_COLD_WORK`, `PTW_HOT_WORK`, `PTW_CONFINED_SPACE`, `PTW_ELECTRICAL`, `PTW_EXCAVATION`, `PTW_RADIOGRAPHY`).
  - `src/components/manpower/cargoHandling/CargoHandlingPermitForm.tsx` (lines 59–60) — for `PTW_CARGO_HANDLING_UNLOADING` / `PTW_CARGO_HANDLING_LIFTING`.
  - `src/components/workorder/WorkOrderListView.tsx` (line 53) — for `WORK_ORDER_MAINTENANCE`.
- Every `npCode`+`anchorId` pair inside `SOP_QUICK_LINK_MAP` was checked against the real, extracted anchor list from Task 2 and **all 5 resolve to real, existing headings** in `public/docs/sop/`:
  - `np-07-10-to-15-ptw-forms` → exists (NP-07.md line 356)
  - `np-08-ch04-unloading-skid-operation` → exists (NP-08.md line 197)
  - `np-08-ch05-iso-tank-management` → exists (NP-08.md line 215)
  - `np-08-ch02-lifting-lng-iso-tank` → exists (NP-08.md line 140)
  - `np-09-np09-01-risk-assessment-procedure` → exists (NP-09.md line 35)
  - No dead/placeholder paths found — everything points at a real file under `public/docs/sop/` via `sopIndex.json`'s `markdownFilePath`.
- **However**, in all three consumer screens the click handler is `onSelect={() => onOpenSopReference?.()}` — the `link: SopQuickLink` argument passed by `SopQuickLinkBar.onSelect(link)` (which carries `npCode`/`anchorId`/`label`) **is discarded**. `onOpenSopReference` is typed as `() => void` end-to-end, all the way up through `PTWMasterRegisterTab` → `PTWManagementView` → `ManpowerSafetyRoutes`/`PortalRouteView`, terminating in `onNavigateToSopReference={() => handleSelectSubProcess('SAFETY_SOP_REFERENCE')}`.
- Net effect: clicking, e.g., the "NP07-14 Hot Work" quick-link button inside the New PTW modal does **not** open NP-07 scrolled to the Hot Work section — it just switches the Manpower/Safety sub-tab to the generic, unfiltered `SopReferenceViewer`, which opens with no document selected ("SELECT AN SOP TO VIEW RAW DOCUMENT" placeholder state, per `SopReferenceViewer.tsx` line 37–39).
- Recommendation for Stage 1 scoping (not implemented here): thread the `SopQuickLink` payload through `onOpenSopReference` (change its signature to accept `{npCode, anchorId}` and have it call `useSopIndex().findByNpCode` + set the raw-viewer target) so the existing deep-link data actually deep-links.

---

## Summary of Key Flags (for Stage 1 re-scoping decision)

1. **`src/components/sop/` is already fully built and wired**, not a blank slate — Stage 1 should be scoped as *extending/fixing* an existing feature, not building one from scratch.
2. **NP-08.md is contaminated with leftover Python generator code** (`import re`, comment lines, an unclosed `content = """` wrapper) in its first 6 lines — a document-integrity bug that will surface as garbage text in the raw viewer/print layout for NP-08's full-document view.
3. **12 headings across NP-01, 03, 04, 05, 06, 07, 09 are missing anchor tags** (mostly H1 document titles, plus two isolated in-body headings in NP-04 and NP-07, and one in NP-09) — no duplicates found anywhere.
4. **NP-08 has no native "5 lifecycle phases" section** — the task's premise conflated NP-08's 10 operational chapters with a generic DRAFT→CLOSED PTW pipeline table that actually lives in a separate `safety-ptw-rules.md` spec, whose own source-line citations no longer match the current NP-08.md.
5. **Several safety-critical numeric constants in the Cargo Handling code (25-ton Critical High Risk threshold, T-203's 0.1 MPa depressurization target, and the exact-0.0-MPa hose-disconnection gate) either come from `safety-ptw-rules.md` rather than NP-08.md, or conflict with NP-08.md's own internally inconsistent text (0.4/<0.05 MPa vs. 0.0 MPa)** — these are pre-existing discrepancies in safety-critical, hard-boundary files and were flagged only, not touched.
6. **SOP quick-link buttons are wired into 3 real screens and point at real, existing anchors — but the click handler throws away the npCode/anchorId payload**, so today they only open a generic, empty SOP tab rather than deep-linking to the specific section.

No files other than this report were created or modified. No `tsc`/`next build` was run.
