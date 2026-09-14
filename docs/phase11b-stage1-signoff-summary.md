# Phase 11b Stage 1 — NP-10 Environmental & Waste Management Module Sign-off

- 범위: NP-10 환경관리/폐기물관리 모듈 그린필드 백엔드 스캐폴딩(DDL + DAO + 순수 계산 서비스). 프런트엔드 내비게이션/탭 배선은 Stage 2(추후)로 이연.
- 방식: Strangler Fig — 신규 모듈 `src/cmms-environment/` 격리, 기존 파일은 전혀 수정하지 않음(barrel export도 신규 파일).
- 브랜치: `feat/phase7-ptw-safety-gates` (유지, 신규 브랜치 없음)
- **origin에 push하지 않음** — 로컬 커밋만 존재, HJ 리뷰 대기

## Precondition 확인

Phase 11a Stage 2 커밋 5개가 이 브랜치 HEAD의 조상(ancestor)인지 `git merge-base --is-ancestor`로 확인:

```
c42b2fc: OK
674c85f: OK
f9c32c9: OK
c3a0166: OK
3fd1b7a: OK
```

→ 전부 존재 확인, Stage 1 착수.

`find src -iname "*environment*" -o -iname "*np10*"` 실행 결과: **출력 없음** (그린필드 확정, 기존 코드 가정 없이 신규 스캐폴딩 진행).

## 서브스테이지별 커밋 + 게이트 결과

| Sub-stage | 내용 | 커밋 | tsc --noEmit | vitest |
|---|---|---|---|---|
| A | DDL 스키마(6개 테이블, Ch1×4 + Ch2×2) + cmms-environment 도메인 타입 + barrel | `9326742` | pass | - |
| B | Chapter 1(모니터링) DAO + 순수 계산 서비스(getThwsDaysRemaining/flagPendingReview) | `c70ab86` | pass | - |
| C | Chapter 2(폐기물관리) DAO + 순수 계산 서비스(computeThwsStatus/aggregateWasteByCategory) + vitest(양쪽 서비스 파일 커버) | `afa9c74` | pass | 10 files / 121 tests 전부 통과 |

최종 `tsc --noEmit`: **pass (0 errors)** / 최종 `vitest run`: **10 files / 121 tests passed**

## 하드 블록 확인 — 0건 터치

프롬프트가 지정한 8개 항목의 실제 저장소 경로(Phase 11a에서 이미 확인된 매핑 + 이번 Stage에서 신규 추가된 `cmmsDbSingleton.ts`)를 기준으로, A~C 3개 서브스테이지 커밋 각각에서 `git diff --stat`를 실행:

```
src/adapters/ptwStatusMapper.ts
src/adapters/gasSafetyAdapter.ts
src/data/ptwCargoHandlingRules.ts
src/data/ptwCargoHandlingTransitions.ts
src/data/ptwCargoHandlingValidators.ts
src/data/ptwGasSafetyRules.ts          (gas-test threshold constants)
src/adapters/db/gasTestDao.ts          (permit_gas_tests DAO)
src/adapters/simopsDbAdapter.ts + src/hooks/useSIMOPSCheck.ts   (SIMOPS HARD_BLOCK)
src/context/PortalDataContext.tsx
src/adapters/db/cmmsDbSingleton.ts     (이번 Stage에서 명시적으로 하드블록 추가된 항목)
```

→ 3개 커밋 전부에서 **diff --stat 출력 0줄** (touch 없음). `cmmsDbSingleton.ts`는 `environmentDbSingleton.ts`가 `getCmmsDb()`를 무수정 재사용만 하고, 자체 연결 위에서 `ensureEnvironmentSchema()`로 신규 6개 테이블만 보강한다(Phase 11a에서 트럭킹 모듈에 적용한 것과 동일한 병렬 싱글턴 패턴).

## ALTER-only 원칙 준수

이번 Stage에서 생성한 6개 테이블(`env_air_quality_logs`, `env_wastewater_logs`, `env_noise_logs`, `env_seawater_logs`, `env_waste_transfer_logs`, `env_thws_inventory`)은 전부 신규 테이블이며 `CREATE TABLE IF NOT EXISTS`로만 정의했다. 기존 테이블(`pm_schedules`, `assets`, `permits`, `permit_gas_tests` 등) 에 대한 DROP/CREATE/ALTER는 전혀 수행하지 않았다.

## NP10-01~04 관리 양식 — Stage 1 범위 제외 확인

프롬프트 지시대로 Aspect 식별/개선계획/Aspect 보고/마스터 체크리스트(NP10-01~04)는 이번 Stage에서 스캐폴딩하지 않았다. `src/cmms-environment/` 어디에도 이 4개 양식에 대응하는 테이블/타입/DAO가 없다 — 운영 로그 테이블(Ch1/Ch2) 검증 이후 별도 서브스테이지로 이연.

## 규제 기준값 — 참조 전용, 미적용 확인

NP-10 Appendix 3 기준값(Oil & Grease ≤10 mg/L, BOD ≤30 mg/L, COD ≤100 mg/L, TSS ≤50 mg/L 등, PermenLHK 68/2016 근거)은 원문상 샘플 참조행일 뿐 검증된 전체 규제표가 아니다. 이를 반영해:

- `env_wastewater_logs.standard_ref`는 표시용 참조 문자열(VARCHAR/TEXT)일 뿐이며, 이 값을 기준으로 PASS/FAIL을 자동 산출하는 로직은 어디에도 구현하지 않았다.
- `flagPendingReview()`(Sub-stage B)는 status가 비어 있는지만 판별하며, 값이 있으면(PASS/FAIL 무엇이든) 그대로 신뢰한다 — 자동 재분류 없음.
- **HJ 확인 대기**: 권위 있는 전체 규제기준표가 확정되기 전까지는 이 reference-only 정책을 유지한다.

## 프롬프트 대비 편차 (deviation) 종합

1. **디렉터리 구조 불일치**: Global Constraint #3은 "types/, dao/, services/, components/" 서브폴더로 트럭킹 모듈과 "동일한 shape"를 요구했으나, 실제 `src/cmms-trucking/`는 `db/`(DAO+DDL+싱글턴 통합) + 플랫 `types.ts` + `services/` 폴더 없음 구조다. 반면 Sub-stage A/B/C 각각의 리터럴 파일 경로 지시(`types/environment.ts`, `dao/*.ts`, `services/*.ts`)는 서로 일관되게 새 폴더 구조를 가리키고 있어, DDL/싱글턴만 트럭킹 패턴(`db/` 폴더, `ensureXSchema(raw)` 함수형)을 그대로 미러링하고 DAO/타입/서비스는 프롬프트가 명시한 `types/`, `dao/`, `services/` 폴더 구조를 채택했다.
2. **getThwsDaysRemaining 배치 위치**: 프롬프트가 이 함수를 Sub-stage B(`environmentMonitoringService.ts`, Chapter 1)에 명시했으나, THWS는 Chapter 2(폐기물) 개념이다. 리터럴 지시를 그대로 따랐고, `environmentWasteService.ts`의 `computeThwsStatus`는 이 함수를 import하지 않고 독립적으로 날짜 차이를 계산해 Ch1→Ch2 서비스 간 결합을 만들지 않았다.
3. **vitest 커버리지 위치**: 프롬프트가 Sub-stage C에서 "cover both service files"라고 명시해, `environmentMonitoringService.test.ts`도 Sub-stage C 커밋에 포함했다(모니터링 서비스 자체는 B에서 이미 구현 완료 상태).
4. **THWS DAO에 UPDATE 추가**: 프롬프트는 "CRUD"라고만 명시했으나, `env_waste_transfer_logs`는 트럭킹 인시던트 로그와 동일하게 불변 기록으로 판단해 insert/select만 두었고, `env_thws_inventory`는 IN_STORAGE→DISPOSED/OVERDUE 상태 전이가 실제로 필요한 레코드이므로 `updateThwsStatus()` 1개 함수를 추가했다(신규 컬럼/신규 상태값 추가 없이 기존 CHECK 제약의 상태값만 사용).

## 신규 파일 목록

```
src/cmms-environment/index.ts
src/cmms-environment/db/environmentSchema.ts
src/cmms-environment/db/environmentDbSingleton.ts
src/cmms-environment/types/environment.ts
src/cmms-environment/dao/environmentMonitoringDao.ts
src/cmms-environment/dao/environmentWasteDao.ts
src/cmms-environment/services/environmentMonitoringService.ts
src/cmms-environment/services/environmentMonitoringService.test.ts
src/cmms-environment/services/environmentWasteService.ts
src/cmms-environment/services/environmentWasteService.test.ts
```

기존 파일 변경: **없음** (신규 모듈 root 밖 파일은 일절 건드리지 않았다 — Global Constraint #5 준수, `SidebarNav.tsx`/`SectorLauncherHub.tsx`/`types/lng.ts`/`PortalDataContext.tsx` 전부 미터치).

## 최종 게이트 결과

- `tsc --noEmit`: **pass (0 errors)**
- `vitest run`: **10 files / 121 tests passed**
- 하드 블록 10개 항목(8개 지정 + `cmmsDbSingleton.ts` + `PortalDataContext.tsx` 재확인): **0 touches**
- ALTER-only 원칙: 신규 테이블 CREATE만 수행, 기존 테이블 무변경
- NP10-01~04: **Stage 1 범위 제외 확인**
- 규제 기준값: **참조 전용, 미적용 — HJ 확인 대기**

## 다음 단계 (HJ 결정 대기, 자동 진행하지 않음)

- NP-10 Appendix 3 규제기준표의 권위 있는 전체 목록 확정 여부 (현재 reference-only 정책 유지 중)
- NP10-01~04 관리 양식의 스캐폴딩 착수 시점/우선순위
- Stage 2(프런트엔드 내비게이션/탭 배선) 착수 여부 및 범위 — Phase 11a Stage 2와 동일한 패턴(SubProcessKey 추가, SidebarNav/SectorLauncherHub additive 배선, 병렬 EnvironmentDataContext) 적용 예정이나 이번 Stage에서는 미착수
