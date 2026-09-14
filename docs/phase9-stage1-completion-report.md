# Phase 9 — Stage 1 Completion Report

Date: 2026-09-12
Branch: `feat/phase7-ptw-safety-gates`
Commits: `49e1a85` (Stage A) → `6872659` (Stage B) → `6032676` (Stage C) → `abaf87e` (Stage D)

Strangler Fig discipline was followed throughout: every existing file was edited in place with targeted, minimal diffs (no wholesale rewrites), each sub-stage is its own independent commit, and `npx tsc --noEmit` was run and confirmed clean (0 errors) after every commit.

---

## Sub-stage A — NP-08.md Script-Header Cleanup

**Commit:** `49e1a85`

Removed the leftover Python-generation residue from the top of `public/docs/sop/NP-08.md`. Diff summary (verified line-by-line, `git diff` shows exactly 6 lines removed / 1 line added, confined to the original lines 1–6):

| Line | Content | Disposition |
| :--- | :--- | :--- |
| 1 | `import re` | Removed — script residue |
| 2 | (blank) | Removed — script residue |
| 3 | `# We will construct a comprehensive Markdown document...` | Removed — generator comment, not a real SOP heading |
| 4 | `# following the exact anchor format: {#np-08-...}` | Removed — generator comment, not a real SOP heading |
| 5 | (blank) | Removed — script residue |
| 6 | `content = """# NIAS Onshore LNG Regasification Terminal - SOP Master Document (NP-08) {#np-08-master-document}` | `content = """` prefix stripped; heading text and `{#np-08-master-document}` anchor left byte-for-byte unchanged |

No procedural content, heading text, or anchor ID elsewhere in the 510→505-line file was touched. No line was ambiguous between residue and real content — nothing was flagged as "UNCERTAIN — needs human review."

A side effect worth noting for Stage 2 planning: because the real H1 title was previously glued onto a `content = """`-prefixed line, it did not match a plain `^#{1,6}\s` heading-line scan at all (even though its anchor tag was still individually detectable). Post-cleanup, NP-08.md's real heading count as measured by that scan rose from 67 to 68 — the title is now visible to any tooling that scans for heading lines, not just tooling that scans for `{#...}` tags anywhere in the file.

`npx tsc --noEmit`: 0 errors (expected no-op for a content-only file).

---

## Sub-stage B — Missing Anchor ID Repair (NP-01–09)

**Commit:** `6872659`

Stage 0 flagged 12 missing-anchor headings total, but 2 of those (NP-08 lines 3–4) were the Python-comment false positives already deleted in Sub-stage A — they were never real headings, so no anchor was added for them. The remaining **10 real missing anchors** were repaired:

| File | Heading | New anchor |
| :--- | :--- | :--- |
| NP-01.md:1 | H1 title | `{#np-01-title}` |
| NP-03.md:1 | H1 title | `{#np-03-title}` |
| NP-04.md:1 | H1 title | `{#np-04-title}` |
| NP-04.md:60 | `### In Scope` | `{#np-04-1-2-1-in-scope}` |
| NP-05.md:1 | H1 title | `{#np-05-title}` |
| NP-06.md:1 | H1 title | `{#np-06-title}` |
| NP-07.md:1 | H1 title | `{#np-07-title}` |
| NP-07.md:302 | `### Legal Framework` | `{#np-07-app-04-legal-framework}` |
| NP-09.md:1 | H1 title | `{#np-09-title}` |
| NP-09.md:294 | `##### Common LNG Hazards` | `{#np-09-2-2-1-common-lng-hazards}` |

Slug convention: title anchors follow the `np-XX-title` pattern already used by NP-02 and NP-11 (the only two files with a pre-existing anchored H1); the two in-body headings extend their parent section's numeric anchor prefix, mirroring the pattern every other numbered sub-heading in these files already uses (e.g. NP-04's "In Scope" mirrors NP-06's pre-existing `{#np-06-1-2-1-in-scope}` for the structurally identical heading). All 10 proposed IDs were checked against the full pre-existing 2,291-anchor set before being applied; none collided. No heading text was changed anywhere — only a trailing `{#...}` tag was appended.

**Before/after anchor count per file** (all 12 files, full re-scan):

| File | Headings | Before (with anchor) | After (with anchor) |
| :--- | ---: | ---: | ---: |
| NP-01.md | 66 | 65 | **66** |
| NP-02.md | 74 | 74 | 74 (unchanged) |
| NP-03.md | 109 | 108 | **109** |
| NP-04.md | 49 | 47 | **49** |
| NP-05.md | 173 | 172 | **173** |
| NP-06.md | 182 | 181 | **182** |
| NP-07.md | 47 | 45 | **47** |
| NP-08.md | 68 (was 69 incl. 2 fake) | 67 | **68** (post Stage A cleanup) |
| NP-09.md | 69 | 67 | **69** |
| NP-10.md | 101 | 101 | 101 (unchanged) |
| NP-11.md | 144 | 144 | 144 (unchanged) |
| NP-12.md | 30 | 30 | 30 (unchanged) |
| **Total** | **1,112** | **1,201*** | **1,112** |

\* the "before" total in the Stage 0 report (1,201/1,213) included NP-08's 2 fake headings in its denominator; comparing like-for-like post-Stage-A, the true before/after is 1,102 → 1,112 real headings with anchors.

**Re-scan confirmation (all 12 files):** Total headings 1,112, headings with anchor **1,112**, missing anchors **0**, duplicate anchors (within-file or cross-file) **0**.

`npx tsc --noEmit`: 0 errors.

---

## Sub-stage C — Quick-Link Payload Repair

**Commit:** `6032676`

**Diagnosis:** every `SopQuickLinkBar` consumer called `onSelect={() => onOpenSopReference?.()}`, discarding the `link: SopQuickLink` (npCode + anchorId) argument. `onOpenSopReference`/`onNavigateToSopReference` were typed `() => void` end-to-end through `PTWMasterRegisterTab → PTWManagementView / WorkOrderRoutes → ManpowerSafetyRoutes / PortalRouteView`, terminating in `() => handleSelectSubProcess('SAFETY_SOP_REFERENCE')` with no payload, and `SopReferenceViewer` had no prop to receive a target — so every quick-link click landed on the blank "SELECT AN SOP" state regardless of which button was clicked.

**Fix (payload-passing only, no dispatch/architecture change):**
- Reused the pre-existing `handleSelectSubProcess(key, focusId?: string)` channel (already used today for WO-row and PTW-permit deep-linking) instead of introducing a new dispatch mechanism.
- Added `src/components/sop/utils/sopQuickLinkTarget.ts` — `encodeSopQuickLinkTarget`/`decodeSopQuickLinkTarget`, encoding `{npCode, anchorId}` as `"<npCode>|<anchorId>"` into that same `focusId` string slot.
- Widened `onOpenSopReference?: () => void` → `(target?: string) => void` at every existing hop (no hop added or removed).
- The 3 quick-link call sites (`NewPTWPermitModal`, `CargoHandlingPermitForm` ×2, `WorkOrderListView`) now build the payload: `onSelect={(link) => onOpenSopReference?.(encodeSopQuickLinkTarget(link))}`.
- Terminus (`ManpowerSafetyRoutes.tsx`, `PortalRouteView.tsx`): `() => handleSelectSubProcess('SAFETY_SOP_REFERENCE')` → `(target) => handleSelectSubProcess('SAFETY_SOP_REFERENCE', target)`.
- `SopReferenceViewer` gained one optional prop, `initialTarget`, seeding (and re-syncing via `useEffect`) its pre-existing `rawTarget` state — its own rendering logic is otherwise untouched.

**Verification method and result:**
1. Added `src/components/sop/utils/__tests__/sopQuickLinkTarget.test.ts` — round-trips **every real entry** in `SOP_QUICK_LINK_MAP` (the actual links rendered on the PTW and Work Order screens) through encode → decode and asserts the recovered `{npCode, anchorId}` is identical to the source link; also covers null/undefined/empty input and an npCode-only (no anchor) input. **Result: 3/3 new tests pass.**
2. `npx tsc --noEmit`: 0 errors.
3. `npx vitest run`: **5 test files, 91 tests passed** (88 pre-existing + 3 new; zero regressions).
4. Hand-traced the full call chain for both entry points (a PTW-screen quick-link via `NewPTWPermitModal`/`CargoHandlingPermitForm`, and the WO-screen quick-link via `WorkOrderListView`), confirming each now reaches `SopReferenceViewer` with a non-null `initialTarget` carrying the correct `npCode`/`anchorId`.
5. **Not done:** a real headless-browser click-through. The existing test suite is Vitest/unit-level only (no component-rendering or e2e harness is configured in this repo — `package.json`'s only test script is `vitest run`), so "manually verify" was satisfied via the code-level trace plus the encode/decode round-trip test in (1)/(4) rather than an actual UI interaction. Flagging this so a human can do a real click-through before this ships.

---

## Sub-stage D — SOP Viewer Refinement and Type Reconciliation

**Commit:** `abaf87e`

Re-read all 13 files in `src/components/sop/` in full (not assumed from the Stage 0 report) and checked each against `src/types/sop.ts`'s `SOPDocument`/`SOPAnchor`/`SOPChecklist(Item)` shapes field-by-field.

**What was reconciled:**
- `relatedNpCodes: string[]` is populated in `sopIndex.json` for 7 of 12 NP docs (e.g. NP-07 → `["NP-06","NP-09"]`) but was read by **zero** components. Extended `SopStructuredCard.tsx` with a "RELATED SOPs" chip row, reusing the exact existing `onOpenRaw(npCode, anchorId?)` callback every other jump-link in the card already uses. No new prop, no new callback shape.
- `version`, `lastUpdated` (consumed by `sopPrintLayout.tsx`), `keywords` (consumed by `sopFilter.ts`), and `checklists` (consumed by `sopPrintLayout.tsx`) were already wired correctly — no action needed there.
- `scadaStyles.ts` token usage: grepped the whole `sop/` directory for every real export name and for `WIN_TAB_INACTIVE` (the name Stage 0 flagged as actually belonging to `portalTabStyles.ts`). **Zero matches** — no sop component references `scadaStyles.ts` at all (all styling is inline Tailwind), so there was no invented-token-name defect to fix in this stage.

**Two-layer render verification**, run against the real production parser (`parseMarkdownLines`/`findAnchorLineIndex` imported directly from `sopMarkdownAnchors.ts`, not reimplemented) over the actual files:

| Doc | Anchor | Raw-file line | Resolves | In `sopIndex.json` `anchors[]` |
| :--- | :--- | ---: | :---: | :---: |
| NP-08 (post-cleanup) | `np-08-master-document` | 0 | ✅ clean title text, no residue | ✅ |
| NP-08 | `np-08-ch04-unloading-skid-operation` | 191 | ✅ | ✅ |
| NP-04 (Stage B repair) | `np-04-title` | 0 | ✅ | ✅ (added this stage) |
| NP-04 | `np-04-1-2-1-in-scope` | 59 | ✅ | ✅ (added this stage) |
| NP-07 (Stage B repair) | `np-07-title` | 0 | ✅ | ✅ (added this stage) |
| NP-07 | `np-07-app-04-legal-framework` | 301 | ✅ | ✅ (added this stage) |
| NP-09 (Stage B repair) | `np-09-title` | 0 | ✅ | ✅ (added this stage) |
| NP-09 | `np-09-2-2-1-common-lng-hazards` | 293 | ✅ | ✅ (added this stage) |

This check surfaced a real gap: **`sopIndex.json` is a pre-generated snapshot that predates Sub-stage B**, so it did not yet contain the 6 anchors Sub-stage B added to NP-04/07/09 (`np-04-title`, `np-04-1-2-1-in-scope`, `np-07-title`, `np-07-app-04-legal-framework`, `np-09-title`, `np-09-2-2-1-common-lng-hazards`). That meant Layer 1's `SopStructuredCard` jump-link buttons — driven by `sopIndex.json`, not by re-parsing the `.md` file — would not have offered them, even though Layer 2 (the raw viewer) already resolved them correctly. Per "extend, do not regenerate," the 17k-line `sopIndex.json` was **not** rebuilt; instead the 6 missing `SOPAnchor` objects were added by hand, in their correct document position, in the exact `{anchorId, headingText, level}` shape every other entry already uses (`git diff`: 30 insertions / 0 deletions; `JSON.parse` confirmed the file is still valid). Re-running the same check post-edit shows all 6 now present. NP-08 needed no such fix — Sub-stage A did not add a new anchor, it only cleaned an already-anchored line, so NP-08's `sopIndex.json` entry was never stale.

Note: `np-04-1-2-1-in-scope` (level 3), `np-07-app-04-legal-framework` (level 3) and `np-09-2-2-1-common-lng-hazards` (level 5) still will not render as Layer-1 card buttons — `SopStructuredCard`'s existing `level <= 2` filter is a deliberate, pre-existing design choice (avoid flooding the card with every sub-heading) unrelated to this fix. The 3 new level-1 **title** anchors do now qualify and will render.

**File line counts after Stage D** (all within the 250-line cap; no extraction into `.types.ts`/`.utils.ts` was needed):

| File | Lines |
| :--- | ---: |
| `index.ts` | 13 |
| `sopPrintLayout.tsx` | 134 |
| `SopQuickLinkBar.tsx` | 32 |
| `SopRawMarkdownViewer.tsx` | 80 |
| `SopReferenceViewer.tsx` | 59 |
| `SopSearchPanel.tsx` | 93 |
| `SopStructuredCard.tsx` | 116 |
| `constants/sopDisplay.ts` | 42 |
| `constants/sopQuickLinkMap.ts` | 53 |
| `utils/sopFilter.ts` | 35 |
| `utils/sopMarkdownAnchors.ts` | 28 |
| `utils/sopQuickLinkTarget.ts` | 27 |
| `hooks/useSopIndex.ts` | 29 |
| `hooks/useSopRawMarkdown.ts` | 53 |

`npx tsc --noEmit`: 0 errors. `npx vitest run`: 5 files / 91 tests passed (no regressions vs. Stage C). The end-to-end anchor-resolution checks above were run via a throwaway `tsx` script that imported the real sop module code directly; it was deleted before committing and never entered the tree.

---

## Out-of-Scope Addendum: `safety-ptw-rules.md` vs. NP-08.md Discrepancy (flagged only, unresolved)

Per the task's explicit instruction, **neither file was edited to reconcile this** — it is reported here for a human decision, exactly as Stage 0 found it (re-verified against the current, post-cleanup NP-08.md):

1. **The "5-phase PTW lifecycle" is not an NP-08 structural feature.** `safety-ptw-rules.md` §2 (lines 33–49) defines `DRAFT → PREPARED/VERIFIED → APPROVED/AUTHORIZED → ACTIVE/VALID → CLOSED/SURRENDERED` and cross-references it to NP-08 chapters as follows — but the mapping spans four non-contiguous chapters, and DRAFT and CLOSED both cite the same narrow, single-activity Chapter 9 (Gas Sales Metering):

   | Phase | `safety-ptw-rules.md` citation | NP-08.md chapter (current line numbers) |
   | :--- | :--- | :--- |
   | DRAFT | `NP08-09 Gas Sales Metering Procedure` Section 5 `[396, 398]` | Chapter 9 §2 step 1 "Preparation" (line 280) |
   | PREPARED/VERIFIED | `NP08-05 ISO Tank Management Procedure` Pre-Unloading `[11, 291]` | Chapter 5 §1 (lines 216–220) |
   | APPROVED/AUTHORIZED | `NP08-03 General Operational Regasification` Section 3 `[117, 134, 135]` | Chapter 3 §3 (lines 181–187) |
   | ACTIVE/VALID | `NP08-04 LNG ISO Tank Unloading Skid Procedure` `[191, 200]` | Chapter 4 (lines 191–210) |
   | CLOSED/SURRENDERED | `NP08-09 Gas Sales Metering Procedure` Line Reinstatement `[408, 410]` | Chapter 9 §2 step 5 "Reinstatement" (line 284) |

2. **The bracketed source-citation numbers in `safety-ptw-rules.md` do not match current NP-08.md line numbers.** E.g. it cites `[74, 78]` for the Crane Operator/Rigger certification requirement, but that text is actually at NP-08.md lines 156–157 (post-cleanup numbering; was 157–158 before Sub-stage A's 1-line net removal). This is true for essentially every citation checked — the two documents have drifted (or `safety-ptw-rules.md` was built from a different revision/pagination). Sub-stage A's cleanup shifted every subsequent line number in NP-08.md by exactly -5, which makes the pre-existing mismatch *marginally* worse in absolute terms, though it was already unusable for direct navigation before this stage.

3. **Numeric-value disagreements** (unchanged by this stage, still present):
   - `CRITICAL_HIGH_RISK_WEIGHT_TON = 25` (in `ptwCargoHandlingRules.ts`, untouched) has no source anywhere in NP-08.md — the only weight figures there are unrelated PBU/liquid-supply switching thresholds (15.151t, 13.222t/12.33t). The 25-ton figure exists only in `safety-ptw-rules.md` line 28.
   - `DEPRESSURIZATION_TARGET_MPA_HOSE = 0.0` (exact-equality gate, in `ptwCargoHandlingValidators.ts`, untouched) sides with NP-08.md line 210's second sentence ("ensure 0.0 MPa on hose gauges") but conflicts with the same line's first clause ("< 0.05 MPa before hose disconnection") — NP-08.md's own text is internally inconsistent on this threshold, independent of `safety-ptw-rules.md`.
   - `DEPRESSURIZATION_TARGET_MPA_T203 = 0.1` (tag-specific target) has no corresponding explicit statement in NP-08.md at all.

No code or content change was made for any of the above in this stage — they are reported for a human to decide whether `safety-ptw-rules.md`'s citations should be re-pointed at current NP-08.md line numbers, whether NP-08.md's own internal 0.4/<0.05/0.0 MPa inconsistency should be clarified with the SOP owner, and whether the 25-ton and T-203-0.1-MPa thresholds should be traced to their actual source document.

---

## Hard-Boundary File Confirmation

The following files were required to show **zero diffs** across all four commits in this stage. Verified via `git hash-object` after every commit and via a single combined `git diff <pre-stage-commit>..HEAD -- <files>` (empty output, exit code 0) at the end of the stage:

| File | Status |
| :--- | :--- |
| `src/data/ptwCargoHandlingRules.ts` | ✅ unchanged |
| `src/data/ptwCargoHandlingTransitions.ts` | ✅ unchanged |
| `src/data/ptwCargoHandlingValidators.ts` | ✅ unchanged |
| `src/adapters/ptwStatusMapper.ts` | ✅ unchanged |
| `src/adapters/gasSafetyAdapter.ts` | ✅ unchanged |
| `src/data/02_specifications/safety-ptw-rules.md` | ✅ unchanged |

None of these six files were opened for writing at any point in Sub-stages A–D.
