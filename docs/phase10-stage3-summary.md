# Phase 10 — Stage 3 Summary

## Sub-stage A
IMPA_Store_Code.xlsx 미발견 (/data/imports/, /docs/reference/, 루트 확인). Stage2A/B 보류 지속. 커밋 없음.

## Sub-stage B
파일: `src/cmms-mro-bridge/rop/calculateReorderPoint.ts`, `calculateReorderPoint.test.ts`
커밋: `5669833` — Phase10-Stage3B: ROP auto-calc trigger (isolated, synthetic-data tested)
tsc --noEmit: PASS
test: 5/5 (신규), 전체 103/103

## Sub-stage C
파일: `src/cmms-mro-bridge/overhaul/overhaulStateMachine.ts`, `overhaulStateMachine.test.ts`
커밋: `ff63b8d` — Phase10-Stage3C: external_overhauls state machine (NP-06 Ch.6 decoupled)
tsc --noEmit: PASS
test: 5/5 (신규), 전체 108/108

## Stage2C pm_schedules "rebuild" 방식 확인

`git show 4894225 -- src/db/migrations/phase10Stage2CRunner.ts` 발췌:

```
CREATE TABLE pm_schedules_new ( ... CHECK (interval_type IN ('RUNNING_HOURS','CALENDAR','VALIDITY_EXPIRY')) ... )
INSERT INTO pm_schedules_new (...) SELECT (...) FROM pm_schedules
DROP TABLE pm_schedules
ALTER TABLE pm_schedules_new RENAME TO pm_schedules
CREATE INDEX IF NOT EXISTS idx_pm_next_due ...
```

방식: **DROP/CREATE(RENAME) 방식** — 단순 `ALTER TABLE ... ALTER COLUMN`이 아님. SQLite가 기존 컬럼의 CHECK 제약 변경을 지원하지 않아 표준 12-step 재생성 절차(신규 테이블 생성 → 데이터 복사 → 원본 DROP → RENAME)를 사용. Stage2C 적용 시점 `pm_schedules` 0 rows였고, INSERT...SELECT는 컬럼 전체를 제네릭하게 복사하도록 작성되어 재실행 안전성 확인됨(재실행 시 `rebuild needed: false`).

## 하드 블록 / mro_parts 원본 최종 확인

`git diff f8f6219..HEAD` (Phase10-Stage3 시작 지점 대비 현재) 대상:
- `ptwCargoHandlingRules.ts`, `ptwCargoHandlingTransitions.ts`, `ptwCargoHandlingValidators.ts`
- `ptwStatusMapper.ts`, `gasSafetyAdapter.ts`
- `gasTestDao.ts`(permit_gas_tests 관련), `mroInventoryDbAdapter.ts`, `mroInventoryDao.ts`(mro_parts/mro_stock_transactions)

결과: **0 touches** (diff 0 lines).

## Stage 3 커밋 목록
```
4894225 Phase10-Stage2C: VALIDITY_EXPIRY interval type + system-level safety asset nodes
68ffceb Phase10-Stage2D: final NP-05 PM mapping (pending HJ approval, no DB writes)
5669833 Phase10-Stage3B: ROP auto-calc trigger (isolated, synthetic-data tested)
ff63b8d Phase10-Stage3C: external_overhauls state machine (NP-06 Ch.6 decoupled)
```
