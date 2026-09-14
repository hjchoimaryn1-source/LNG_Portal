# Phase 11 Final QA Closure Report

Non-code / verification-only report. No fixes applied in this pass — findings below are
scoping input for Phase 12 or a dedicated remediation stage, per HJ's instructions.

## Task 1 — SOP Viewer Full Integration Pass (NP-01 ~ NP-12)

**Blocker**: Live browser verification via the `claude-in-chrome` tooling could not run —
the Chrome extension is not installed/connected in this session
(remedy: connect at https://claude.ai/chrome). Per instructions, no result was fabricated;
every live-UI row below is marked `UNABLE TO VERIFY` rather than guessed.

**Fallback performed**: dev server confirmed running (`localhost:3000`, HTTP 200) and a
read-only static check cross-referenced every anchor entry in `src/data/sopIndex.json`
against its corresponding `{#anchor-id}` kramdown tag in `public/docs/sop/NP-XX.md`.

| NP doc # | renders | anchors work | print OK | notes |
|---|---|---|---|---|
| NP-01 | UNABLE TO VERIFY (no browser) | UNABLE TO VERIFY (no browser) | UNABLE TO VERIFY (no browser) | Static check: .md exists (23.7KB), 7/7 top-level anchors resolve |
| NP-02 | UNABLE TO VERIFY | UNABLE TO VERIFY | UNABLE TO VERIFY | .md exists (39.6KB), 7/7 anchors resolve |
| NP-03 | UNABLE TO VERIFY | UNABLE TO VERIFY | UNABLE TO VERIFY | .md exists (59.2KB), 9/9 anchors resolve |
| NP-04 | UNABLE TO VERIFY | UNABLE TO VERIFY | UNABLE TO VERIFY | .md exists (42.9KB), 20/20 anchors resolve |
| NP-05 | UNABLE TO VERIFY | UNABLE TO VERIFY | UNABLE TO VERIFY | .md exists (132KB), 16/16 anchors resolve; 34 checklist tables |
| NP-06 | UNABLE TO VERIFY | UNABLE TO VERIFY | UNABLE TO VERIFY | .md exists (79.7KB), 67/67 anchors resolve |
| NP-07 | UNABLE TO VERIFY | UNABLE TO VERIFY | UNABLE TO VERIFY | .md exists (27.8KB), 19/19 anchors resolve |
| NP-08 | UNABLE TO VERIFY | UNABLE TO VERIFY | UNABLE TO VERIFY | .md exists (40.4KB), 16/16 anchors resolve |
| NP-09 | UNABLE TO VERIFY | UNABLE TO VERIFY | UNABLE TO VERIFY | .md exists (67.8KB), 8/8 anchors resolve |
| NP-10 | UNABLE TO VERIFY | UNABLE TO VERIFY | UNABLE TO VERIFY | .md exists (47.2KB), 10/10 anchors resolve |
| NP-11 | UNABLE TO VERIFY | UNABLE TO VERIFY | UNABLE TO VERIFY | .md exists (127KB), 20/20 anchors resolve; 19 checklist tables |
| NP-12 | UNABLE TO VERIFY | UNABLE TO VERIFY | UNABLE TO VERIFY | .md exists (14.7KB), 20/20 anchors resolve |

**Summary**: 0/12 fully pass, 0/12 fail, 12/12 unable-to-verify live (browser tool
unavailable this session). Static wiring check found **no anchor/file mismatches** in any
of the 12 documents — every `sopIndex.json` anchor entry has a matching `{#id}` tag in its
source markdown. Actual render/scroll/print-preview behavior remains unverified and should
be re-run once `claude-in-chrome` is connected.

## Task 2 — NP-08 Cargo Lifecycle Cross-Check (read-only)

**Premise correction**: `public/docs/sop/NP-08.md` does not itself document a "5-chapter
cargo lifecycle" — it has **10 chapters** covering distinct operational procedures (ISO
Tank Yard Management, Lifting, General Regasification, Unloading Skid, ISO Tank
Management/Emergency, Hose/QCC Maintenance, AAV Operation, AAV Environmental/Safety, Gas
Sales Metering, STS Transfer). The actual **5-stage** `DRAFT → PREPARED → APPROVED →
ACTIVE → CLOSED` PTW lifecycle (cross-referencing NP08-xx sections/forms) is documented in
`src/data/02_specifications/safety-ptw-rules.md` (lines 44-49) — this is also the file
`ptwCargoHandlingRules.ts`'s own header comment cites as its source ("Source:
safety-ptw-rules.md"), not NP-08.md directly. This cross-check compares the code against
both documents.

Files reviewed: `src/data/ptwCargoHandlingRules.ts`, `ptwCargoHandlingTransitions.ts`,
`ptwCargoHandlingValidators.ts` (all three are hard-block/restricted paths — **read only**,
no edits made).

| Stage / Rule | SOP source | Code behavior | Match? |
|---|---|---|---|
| LEL < 10%, O₂ 19.5%-23.5% (AGT gate) | NP-08 Ch5 §1, Form NP08-15, safety-ptw-rules.md line 72-73 | `UNLOADING_LEL_MAX_PERCENT=10`, `UNLOADING_O2_MIN/MAX_PERCENT=19.5/23.5` in `evaluateAgtGate()` | Match |
| SCBA required below 19.5% O₂ | NP-08 Ch8 §1 | `SCBA_REQUIRED_BELOW_O2_PERCENT=19.5` | Match |
| Grounding resistance < 5 Ω | NP-08 Ch5 §1, Form NP08-10, safety-ptw-rules.md line 96 | `GROUNDING_RESISTANCE_MAX_OHM=5` in `evaluateGroundingGate()` | Match |
| Barricade radius: Unloading ≥25m, Lifting 50-100m | NP-08 Ch5 §2 / Ch8 §2, safety-ptw-rules.md line 92 | `BARRICADE_RADIUS_UNLOADING_MIN_M=25`, `..._LIFTING_MIN_M=50`, `..._LIFTING_MAX_M=100` in `validateBarricadeRadius()` | Match (note: NP-08.md itself documents these numbers as *emergency evacuation* radii for leak scenarios, not a routine pre-lift barricade spec; the code faithfully follows safety-ptw-rules.md's framing of them as barricade minimums instead — a documentation-lineage nuance, not a code defect) |
| Critical High Risk: ≥25t lifted load, active-flow hose disconnection, confined space, Zone-1 hot work → Site Manager final approval + ESDV 3-stage isolation | safety-ptw-rules.md lines 24-29 | `CRITICAL_HIGH_RISK_WEIGHT_TON=25`; `evaluateCriticalHighRiskEscalation()` checks weight + active-flow/hose-disconnection combo; `canApproveCargoHandlingPermit()` requires `esdvThreeStageIsolationConfirmed` when critical | Match (confined-space and Zone-1-hot-work triggers from the spec are not modeled in `evaluateCriticalHighRiskEscalation()` — likely out of scope for the Cargo Handling category specifically, but flagged for confirmation) |
| Depressurization targets: 0.4 MPa default, 0.1 MPa for T-203, 0.0 MPa before hose/QCC disconnect | safety-ptw-rules.md lines 147-150 | `DEPRESSURIZATION_TARGET_MPA_DEFAULT=0.4`, `_T203=0.1`, `_HOSE=0.0` in `evaluateDepressurizationGate()` | Match vs. safety-ptw-rules.md. **Note**: NP-08.md's own Ch4 §2 text states only "0.4 MPa (or < 0.05 MPa before hose disconnection)" and does not name T-203 specifically for the 0.1 MPa figure — the 0.1/T-203 pairing traces only to safety-ptw-rules.md, not verbatim to NP-08.md. Flagged as a documentation-lineage gap between the two source docs, not a code bug. |
| CLOSED stage: Work Leader + HSE Officer + Site Manager triple sign-off, LOTO removed, leak test passed | safety-ptw-rules.md line 49 | `canCloseCargoHandlingPermit()` requires exactly these 5 conditions | Match |
| **Site Manager delegation to Sr. O&M Leader (Acting) requires a delegation memo** | safety-ptw-rules.md line 47 — stated as a **general** APPROVED-stage rule, not limited to Critical High Risk permits | `canApproveCargoHandlingPermit()` (`ptwCargoHandlingTransitions.ts:21-41`) only evaluates `siteManagerAvailable` / delegation-memo requirement **when `isCriticalHighRisk === true`**. For a non-critical, routine cargo handling permit, `requiredApproverRole` is hardcoded to `'SITE_MANAGER'` and `siteManagerAvailable` is never consulted — the function returns `canTransition: true` with zero block reasons even if the Site Manager is absent and no delegation memo exists. | **MISMATCH** — routine (non-critical) approvals have no delegation-memo gate at all in code, contradicting the SOP's general delegation rule. |
| "Atmosphere safe / fully degassed" certification band: LEL 0%, O₂ 20.9% ± 0.4% | Not found verbatim in NP-08.md or safety-ptw-rules.md (both only state the *working* band of LEL<10%/O₂ 19.5-23.5%, not this tighter certification band) | `ATMOSPHERE_SAFE_LEL_MAX_PERCENT=0`, `ATMOSPHERE_SAFE_O2_TARGET_PERCENT=20.9`, `ATMOSPHERE_SAFE_O2_TOLERANCE_PERCENT=0.4` used in `evaluateAgtGate()`'s `isAtmosphereSafeCertifiable` | **UNTRACEABLE** — plausible (20.9% ≈ standard ambient air O₂), but not confirmed against either reviewed SOP source. Recommend confirming provenance before relying on it for a hard gate. |

### Findings Summary (plain list)

1. **Chapter/Stage → Code → Match/Mismatch**: APPROVED-stage delegation memo gate (spec:
   general rule) → code: only enforced for Critical High Risk permits → **Mismatch**.
   Routine permits can transition PREPARED→APPROVED with `canTransition: true` while the
   Site Manager is unavailable and no delegation memo exists.
2. **Depressurization T-203 target (0.1 MPa)** → code matches `safety-ptw-rules.md` exactly
   but does not appear verbatim in `NP-08.md` Ch4 §2's own text → **documentation-lineage
   gap** between the two source docs (not a code defect against its cited source).
3. **Confined-space / Zone-1 hot-work Critical-High-Risk triggers** (spec lines 24-29) are
   not modeled in `evaluateCriticalHighRiskEscalation()` (only weight and active-flow/hose
   scenarios are) → flagged for confirmation of intended scope (Cargo Handling category may
   legitimately exclude these, since they belong to Confined Space Entry / Hot Work permit
   categories instead).
4. **`ATMOSPHERE_SAFE_O2_TARGET_PERCENT`/tolerance** values have no traceable source in
   either document reviewed → flagged for provenance confirmation.

No files were modified to "fix" any of the above — decision and remediation scope belong
to HJ / the Phase 12 original-code-review process, per instructions.
