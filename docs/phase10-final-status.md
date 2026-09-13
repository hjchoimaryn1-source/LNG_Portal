# Phase 10 — Final Status Snapshot (Phase 11 Handoff Gate)

## 1. 커밋 목록 (시간순)
```
3639074 Phase10-Stage1A: additive MRO/PM schema (asset_parts_impa/inventory_items/inventory_ledgers/external_overhauls/pm_schedules, work_orders columns)
25247c2 Phase10-Stage1B: legacy MRO crosswalk builder (report-only, no stock migration)
6022ecb Phase10-Stage1C: evaluateSafetyGateRules isolated implementation + unit tests
705e307 Phase10-Stage1D: NP-05 PM mapping proposal (no DB writes)
f8f6219 docs: save Phase 10 Stage 1 completion and Stage 2 planning status
4894225 Phase10-Stage2C: VALIDITY_EXPIRY interval type + system-level safety asset nodes
68ffceb Phase10-Stage2D: final NP-05 PM mapping (pending HJ approval, no DB writes)
5669833 Phase10-Stage3B: ROP auto-calc trigger (isolated, synthetic-data tested)
ff63b8d Phase10-Stage3C: external_overhauls state machine (NP-06 Ch.6 decoupled)
2b188c9 Phase10-Stage3D: summary report
820db9d Phase10-Stage4A: Stage2C DROP/CREATE remediation note + ALTER-only guardrail
24b32e4 Phase10-Stage4B: IMPA scope whitelist registered (ingestion deferred)
0786ff8 Phase10-Stage4D: summary report
0872be3 Phase10-Stage4-SubstageC: explicitly skipped, pending HJ written approval
```

## 2. 현재값

| 항목 | 값 |
| --- | --- |
| `impa_catalog` row 수 | 0 (실데이터 없음 — IMPA_Store_Code.xlsx 미배치) |
| `asset_parts_impa` row 수 | 0 |
| `pm_schedules` row 수 | 0 |
| `pm_schedules.interval_type` VALIDITY_EXPIRY 포함 | true |
| `pm_schedules.expiry_date` 컬럼 존재 | true |
| `external_overhauls` row 수 | 0 (state machine 로직만 존재, DB row 없음) |
| `external_overhauls` 로직 파일 | `src/cmms-mro-bridge/overhaul/overhaulStateMachine.ts` — 존재 |
| `calculateReorderPoint.ts` | `src/cmms-mro-bridge/rop/calculateReorderPoint.ts` — 존재 |
| `evaluateSafetyGateRules.ts` | `src/cmms-mro-bridge/safetyGate/evaluateSafetyGateRules.ts` — 존재 |
| 전체 테스트 | 108/108 PASS (vitest run) |
| tsc --noEmit | PASS |
| CLAUDE.md ALTER-ONLY 가이드라인 | 반영됨 (§5 "DB Schema Change Policy (ALTER-only)", Stage4A에서 추가) |

## 3. 하드 블록 / mro_parts·mro_stock_transactions 누적 확인 (Phase 10 전 기간)

기준: `abaf87e`(Phase 10 시작 직전 마지막 커밋, Phase9-StageD) → `HEAD`(`0872be3`)

대상 파일:
- `src/data/ptwCargoHandlingRules.ts`
- `src/data/ptwCargoHandlingTransitions.ts`
- `src/data/ptwCargoHandlingValidators.ts`
- `src/adapters/ptwStatusMapper.ts`
- `src/adapters/gasSafetyAdapter.ts`
- `src/adapters/db/gasTestDao.ts`
- `src/adapters/mroInventoryDbAdapter.ts` (mro_parts/mro_stock_transactions)
- `src/adapters/db/mroInventoryDao.ts` (mro_parts/mro_stock_transactions)

`git diff abaf87e..HEAD --stat -- <위 8개 파일>` 결과: **0 touches** (diff 출력 없음).

## 4. Sub-stage C (NP-05 PM 최종 매핑 승인 게이트) 상태
**SKIPPED — HJ 서면 승인 미확인.** `docs/phase10-stage2d-np05-pm-final-mapping.md`는 원문 그대로 보존되어 있으며 상단에 "APPROVED BY HJ CHOI <날짜>" 라인 없음. `pm_schedules` INSERT 미실행, row 수 0 유지. Phase 11 진입 후에도 이 승인 게이트는 별도로 재확인 필요.

## 5. Phase 11 핸드오프 결론
- 하드 블록 파일 및 mro_parts/mro_stock_transactions: Phase 10 전 기간 0 touches.
- 스키마 변경: 전부 additive(ALTER/CREATE IF NOT EXISTS/INSERT OR IGNORE), 단 Stage2C 1건 DROP/CREATE 재생성 발생(Stage4A에서 원인 규명 및 재발 방지 가드레일 반영 완료).
- 미완료 항목: IMPA 실데이터 ingestion(소스 파일 부재), NP-05 PM 최종 매핑 HJ 승인(Sub-stage C).
