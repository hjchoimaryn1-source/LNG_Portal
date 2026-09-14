# Phase 11a Stage 1 — NP-03 Trucking/Vehicle Inspection Module Sign-off

- 범위: NP-03 트럭킹/차량 검사 모듈 그린필드 구축 (Stage 0 조사에서 NOT-EXISTS 확정)
- 방식: Strangler Fig — 신규 모듈 `src/cmms-trucking/` 격리, 기존 파일은 additive 변경(barrel/설정 맵 추가)만 허용
- 기준 커밋(Stage 0 investigation report): `0ee5005`

## 서브스테이지별 커밋 + 게이트 결과

| Sub-stage | 내용 | 커밋 | tsc --noEmit | vitest |
|---|---|---|---|---|
| A | 스키마 DDL + 도메인 타입 + DAO + 빈 barrel | `d158927` | clean | - |
| B | NP03-02 Pre-Op / NP03-06 Vehicle & Security 체크리스트 + API 라우트 + 트럭킹 전용 DB 싱글턴 | `16aeea7` | clean | - |
| C | NP03-11 Periodic Inspection / NP03-13 Pre-Ops Truck & ISO Tank 체크리스트 (기존 훅·API 재사용) | `e507f22` | clean | - |
| D | NP03-15 Post-Transit Report / NP03-08 Verification Section(표시 전용) + SOP 퀵링크 등록 | `d6b40e4` | clean | **8 files / 108 tests 전부 통과** |

## Git diff 확인 — 하드 블록 파일 0건 터치

기준 커밋(`0ee5005`, Stage 0 리포트) 대비 `d6b40e4`(Stage 1 최종)까지 아래 8개 파일/패턴에 대한 diff가 **0건**임을 확인:

```
ptwStatusMapper.ts, gasSafetyAdapter.ts, ptwCargoHandlingRules.ts, Transitions.ts,
Validators.ts, permit_gas_tests*, PortalDataContext.tsx, delegationAdapter.ts, guardrails.ts
```

전체 변경 파일 목록(16개, 1224 insertions / 1 deletion)은 전부 `src/cmms-trucking/**`, 신규 API 라우트 `src/app/api/v1/cmms/trucking-inspections/route.ts`, 그리고 `src/components/sop/constants/sopQuickLinkMap.ts`(순수 추가 diff, 기존 키 무변경 — 아래 참고)뿐이다.

## Sub-stage D — PTW/가스 테스트 읽기 인터페이스에 대한 명시적 노트

지시사항: "wiring to `permit_gas_tests` or PTW status is required to populate this, STOP and flag for HJ decision rather than reaching into those safety modules directly."

- **조사 결과**: `getGasTestRecordsForPermit(permitRefNo)` / `getAllGasTestRecords()` (`src/adapters/gasSafetyAdapter.ts`, 하드 블록 파일)와 `selectPermitLifecycle(db, permitId)` (`src/adapters/db/ptwPermitDao.ts`, 하드 블록 아님)라는 기존 공개 read 함수는 존재한다.
- **STOP한 이유**: 이 함수들은 모두 `permitRefNo`/`permitId`를 입력으로 요구하는데, `truck_inspections` 테이블(Sub-stage A 스키마)에는 "이 트럭킹 작업이 어떤 PTW 허가서에 종속되는가"를 나타내는 컬럼이 전혀 없다. 그 매핑을 새로 정의하는 것 자체가 지시사항이 명시한 "새로운 통합 지점"에 해당하므로, 임의로 컬럼을 추가하거나 매핑 규칙을 추정하지 않고 멈췄다.
- **실제 구현**: `TrafficMgmtVerificationSection.tsx`는 `values?: Partial<TrafficMgmtVerificationValues>` prop을 받는 순수 표시 컴포넌트로만 구현했다. prop 미전달 시 4개 항목(Work Permit Hot/Cold, Gas Test Result, PPE Inspection, Environmental Check) 모두 `PENDING`으로 표시되며, `gasSafetyAdapter.ts`/`ptwStatusMapper.ts`/`ptwPermitDao.ts`를 이 컴포넌트가 직접 호출하지 않는다.
- **HJ 결정 필요 항목**: (1) 트럭킹 검사와 PTW 허가서를 연결할 식별자(예: `truck_inspections.permit_ref_no` 추가)를 둘 것인지, (2) 둔다면 어느 시점(반출입 승인/NP03-08 체크포인트)에 어떤 허가서를 매핑할지 — 이 두 가지가 정해진 뒤에야 실제 adapter 연동이 가능하다.

## 기타 HJ 결정 필요 항목 (Sub-stage A에서 이미 플래그)

- `src/adapters/db/cmmsDbSingleton.ts`에는 외부 모듈이 자기 DDL을 등록할 확장 지점이 없다. `src/cmms-trucking/db/truckingSchema.ts`의 `ensureTruckingSchema()`는 작성되었으나 그 싱글턴에 배선되어 있지 않다.
- 대신 `src/cmms-trucking/db/truckingDbSingleton.ts`가 `getCmmsDb()`(무수정, 읽기 전용 재사용)를 감싸 트럭킹 3개 테이블만 자체적으로 최초 1회 보강하는 방식으로 실제 저장을 동작시켰다 — `cmmsDbSingleton.ts` 자체는 0건 터치.
- CLAUDE.md §5(ALTER-only 정책)와는 무관(신규 테이블 CREATE뿐, 기존 테이블 재생성 없음)이지만, cmmsDbSingleton.ts에 정식 확장 지점을 만들지 이 wrapper 패턴을 계속 쓸지는 HJ 판단이 필요하다.

## 신규 파일 목록

```
src/cmms-trucking/types.ts
src/cmms-trucking/index.ts
src/cmms-trucking/db/truckingSchema.ts
src/cmms-trucking/db/truckingDbSingleton.ts
src/cmms-trucking/db/truckInspectionDao.ts
src/cmms-trucking/db/truckIncidentLogDao.ts
src/cmms-trucking/hooks/useTruckChecklistForm.ts
src/cmms-trucking/components/ChecklistItemRow.tsx
src/cmms-trucking/components/PreOperationChecklist.tsx        (NP03-02)
src/cmms-trucking/components/VehicleSecurityChecklist.tsx     (NP03-06)
src/cmms-trucking/components/PeriodicInspectionLog.tsx        (NP03-11)
src/cmms-trucking/components/PreOpsTruckIsoTankChecklist.tsx  (NP03-13)
src/cmms-trucking/components/PostTransitConditionReport.tsx   (NP03-15)
src/cmms-trucking/components/TrafficMgmtVerificationSection.tsx (NP03-08, 표시 전용)
src/app/api/v1/cmms/trucking-inspections/route.ts
```

기존 파일 additive 변경 1건: `src/components/sop/constants/sopQuickLinkMap.ts` (신규 컨텍스트 2개 추가, 기존 항목 무변경).

## 미배선 항목 (엔트리 포인트)

`TruckInspectionType`/컴포넌트 자체는 완성되었으나, 이 모듈을 실제 내비게이션/탭에 마운트하는 작업(예: LNGPortalApp.tsx 라우트 등록)은 지시사항의 "barrel re-export만" 제약과 "минимal entry-point" 범위를 넘어서는 판단(어느 메뉴/탭 아래 배치할지)이 필요해 이번 Stage 1에는 포함하지 않았다. 현재는 `src/cmms-trucking`에서 barrel import만으로 사용 가능한 상태이며, 실제 화면 배치는 별도 요청 시 진행한다.
