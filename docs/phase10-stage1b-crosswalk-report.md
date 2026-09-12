# Phase 10 — Stage 1B Legacy MRO Crosswalk Report

Generated: 2026-09-12T12:51:33.154Z

**No stock quantities were migrated in this stage.** This report is for human review only — inventory_items stubs below were created with current_stock = 0 regardless of match status.

## Summary

- Total mro_parts scanned: **10**
- impa_catalog rows available for matching: **0**
- AUTO_MATCHED: **0**
- NEEDS_REVIEW: **0**
- UNMATCHED: **10**
- inventory_items stub rows created this run: **0**

> **impa_catalog has 0 rows.** Per docs/phase10-stage0-investigation-report.md Task 2, no `IMPA_Store_Code` source file exists anywhere in the repo, so there is nothing for the crosswalk builder to compare part names against. Every mro_parts row below is UNMATCHED by construction, not because of a bug in the matcher — this is expected given current data and is not fixable at the application layer. Populating impa_catalog with real IMPA store-code data is a prerequisite for any AUTO_MATCHED/NEEDS_REVIEW result.

## NEEDS_REVIEW — full list

(none)

## UNMATCHED — full list

| legacy_part_id | reason |
| --- | --- |
| MRO-BRG-040 | impa_catalog has 0 rows — no candidates exist to compare against. |
| MRO-FLT-020 | impa_catalog has 0 rows — no candidates exist to compare against. |
| MRO-GSK-001 | impa_catalog has 0 rows — no candidates exist to compare against. |
| MRO-GSK-002 | impa_catalog has 0 rows — no candidates exist to compare against. |
| MRO-INS-050 | impa_catalog has 0 rows — no candidates exist to compare against. |
| MRO-INST-060 | impa_catalog has 0 rows — no candidates exist to compare against. |
| MRO-LUBE-070 | impa_catalog has 0 rows — no candidates exist to compare against. |
| MRO-SEAL-010 | impa_catalog has 0 rows — no candidates exist to compare against. |
| MRO-VLV-030 | impa_catalog has 0 rows — no candidates exist to compare against. |
| MRO-VLV-031 | impa_catalog has 0 rows — no candidates exist to compare against. |
