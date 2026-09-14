# Phase 11b Stage 2 — NP-10 Environmental & Waste Management Frontend Navigation & Tab Integration Sign-off

- 범위: NP-10 환경/폐기물 모듈을 실제 내비게이션(사이드바/섹터 런처/탭)에 연결
- 기준: Stage 1 커밋 `9326742`(A)/`c70ab86`(B)/`afa9c74`(C)/`c36ae29`(sign-off), 이번 Stage에서 재수정 없음
- 브랜치: `feat/phase7-ptw-safety-gates` (유지, 신규 브랜치 없음)
- **origin에 push하지 않음** — 로컬 커밋만 존재, HJ 리뷰 대기

## STEP 0 — 사전 조사 결과

- `git show --stat c36ae29` → sign-off 문서(`docs/phase11b-stage1-signoff-summary.md`) 106줄 추가만 포함. **실제 Stage 1 구현은 단일 커밋이 아니라 이미 A(`9326742`)/B(`c70ab86`)/C(`afa9c74`)/sign-off(`c36ae29`) 4개 커밋으로 분리되어 있었다** — 프롬프트가 "Stage 1이 단일 커밋으로 전달되었을 것"이라 가정한 것과 달리 실제로는 원래 계획대로 서브스테이지별 커밋이 유지되어 있었다(편차이자 오히려 더 나은 상태).
- `find src/cmms-environment -type f` → 10개 파일 확인: `index.ts`, `db/environmentSchema.ts`, `db/environmentDbSingleton.ts`, `types/environment.ts`, `dao/environmentMonitoringDao.ts`, `dao/environmentWasteDao.ts`, `services/environmentMonitoringService.ts`(+`.test.ts`), `services/environmentWasteService.ts`(+`.test.ts`).
- `src/cmms-environment/index.ts` 배럴을 직접 열어 실제 export 심볼을 확인한 결과, Stage 1 프롬프트가 가정했던 이름과 **완전히 일치**함을 확인:
  - 타입: `AirQualityLog`, `WastewaterLog`, `NoiseLog`, `SeawaterLog`, `WasteTransferLog`, `ThwsInventoryItem` (+ Input/Status 보조 타입)
  - DAO: `environmentMonitoringDao.ts`(insertAirQualityLog/selectAllAirQualityLogs 등 4쌍), `environmentWasteDao.ts`(insertWasteTransferLog/selectAllWasteTransferLogs, insertThwsInventoryItem/selectAllThwsInventory/updateThwsStatus)
  - 서비스: `environmentMonitoringService.ts`(`getThwsDaysRemaining`, `flagPendingReview`), `environmentWasteService.ts`(`computeThwsStatus`, `aggregateWasteByCategory`)
  - 싱글턴: `db/environmentDbSingleton.ts`(`getEnvironmentDb`)
  - → **갭 없음, 추측 없이 그대로 사용**. 단, Stage 1은 DAO/서비스까지만 만들었고 **API 라우트는 없었다**(트럭킹 Stage1-B와 달리) — 이 차이는 Sub-stage E에서 새 라우트 1개 추가로 해소함(아래 편차 참고).

## 서브스테이지별 커밋 + 게이트 결과

| Sub-stage | 내용 | 커밋 | tsc --noEmit |
|---|---|---|---|
| A | SubProcessKey 4개 추가 + getInitialNav/usePortalNavigation/SUBPROCESS_TITLES 추가 | `72ffe75` | pass |
| B | SidebarNav 신규 섹션(7. Environment & Waste) + SectorLauncherHub 신규 버튼(MOD_9) | `c31b460` | pass |
| C | Ch.1 모니터링 순수 표시 컴포넌트 4개(Air/Wastewater/Noise/Seawater) | `db98377` | pass |
| D | Ch.2 폐기물 순수 표시 컴포넌트 2개(WasteTransfer/ThwsInventory, 카운트다운 표시) | `e4a8161` | pass |
| E | EnvironmentDataContext(병렬 provider) + 신규 API 라우트 + EnvironmentModuleHub 탭 조립 + 라우트 배선 + vitest 그린 | `b1b2ba6` | pass |

최종 `tsc --noEmit`: **pass (0 errors)** / 최종 `vitest run`: **10 files / 121 tests passed** (Stage 1과 동일 — 이번 Stage에서 신규 vitest 대상 로직 없음, UI 배선뿐)

## 하드 블록 8개 항목 — 0건 터치 확인

Stage 1에서 확인된 실제 경로 + `cmmsDbSingleton.ts`/`PortalDataContext.tsx` 기준으로 A~E 5개 서브스테이지 커밋 각각에서 `git diff --stat` 실행:

```
src/adapters/ptwStatusMapper.ts
src/adapters/gasSafetyAdapter.ts
src/data/ptwCargoHandlingRules.ts
src/data/ptwCargoHandlingTransitions.ts
src/data/ptwCargoHandlingValidators.ts
src/data/ptwGasSafetyRules.ts
src/adapters/db/gasTestDao.ts
src/adapters/simopsDbAdapter.ts + src/hooks/useSIMOPSCheck.ts
```

→ 5개 커밋 전부에서 **diff --stat 출력 0줄**(touch 없음).

## PortalDataContext.tsx — 0건 터치 확인

`git diff --stat -- src/context/PortalDataContext.tsx`(Stage 1 종료 `c36ae29` 대비 최종 `b1b2ba6`까지) → **출력 없음**. 환경 모듈 상태/액션/임포트를 이 파일에 추가하지 않았으며, 대신 `src/context/EnvironmentDataContext.tsx`를 신규 생성하고 `LNGPortalApp.tsx`에서 `<TruckingDataProvider>`·`<CmmsAwarePortalProvider>`와 나란히 **형제(sibling) 레벨 wrap**으로만 마운트했다(제약 #2 준수, 트럭킹 provider도 재구조화하지 않음).

## UI 레이어 PASS/FAIL 미발명 확인

- `AirQualityLogTable`/`WastewaterLogTable`/`NoiseLogTable`/`ThwsInventoryTable`의 상태 배지(`StatusBadge`)는 저장된 `status` 문자열을 **그대로** 렌더링하며, `PENDING_REVIEW`도 실제 표시 상태로 노출된다. 색상 매핑(`STATUS_BADGE` record)은 순수 CSS 스타일 선택일 뿐 값 자체를 계산/추론하지 않는다.
- `WastewaterLogTable`의 `standardRef`는 "Standard Ref (display only)" 헤더로 표시만 하며, `measuredResult`와 비교해 PASS/FAIL을 계산하는 로직은 어디에도 없다.
- `ThwsInventoryTable`은 `getThwsDaysRemaining()`(Stage 1 순수함수)을 "Days Left" 컬럼에만 사용하고, `status` 컬럼은 DB에 저장된 값을 그대로 출력한다 — 카운트다운 값으로 status를 재계산하지 않는다.
- → Global Constraint #4(Display honesty) 준수 확인.

## 프롬프트 대비 편차 (deviation) 종합

1. **Stage 1 커밋 구조 재확인**: STEP 0에서 이미 기술 — 단일 커밋 가정과 달리 4개 서브스테이지 커밋이 그대로 존재했다.
2. **SectorLauncherHub id 충돌**: 프롬프트 지시 `id: 'MOD_7'`은 이미 'Jakarta HQ Overview'가 사용 중이고(`MOD_8`은 Trucking), 중복 React key를 피하기 위해 `id: 'MOD_9'`를 사용했다(Phase11a Stage2-B와 동일 유형의 편차).
3. **API 라우트 신규 추가**: `environmentDbSingleton.ts`/DAO는 `node:sqlite`를 전이적으로 임포트하는 서버 전용 모듈이라 `"use client"` 컨텍스트에 직접 임포트할 수 없다. 트럭킹 Stage1-B는 이 문제를 이미 API 라우트로 해결해뒀지만, 환경 모듈 Stage 1은 DAO/서비스까지만 스캐폴딩했다(API 라우트 없음). 따라서 Sub-stage E에서 `src/app/api/v1/cmms/environment/route.ts`(GET 전용, 6개 로그 타입 일괄 반환)를 신규 추가해 이 경계를 해소했다 — 기존 파일이 아닌 완전히 새로운 파일이므로 하드 바운더리/Strangler Fig 제약과 무관.
4. **라우트 배선 방식**: "LNGPortalInner 렌더 트리에 직접 조건부 블록 추가"라는 지시 대신, Phase11a Stage2에서 이미 확립된 패턴(신규 `EnvironmentRoutes.tsx` + `PortalRouteView.tsx`에 import 1줄 + JSX 형제 1블록 추가)을 그대로 재사용했다 — `TruckingRoutes.tsx`와 동일 구조.
5. **THWS write 액션 미노출**: 프롬프트가 "read-only selectors for now"라고 명시했으므로, Stage 1 DAO에 이미 존재하는 `updateThwsStatus`/`insert*` 함수들은 신규 API 라우트에 GET만 노출하고 POST/PATCH는 추가하지 않았다.

## 신규 파일 목록

```
src/components/portal/utils/subProcessTitlesEnvironment.tsx
src/components/environment/AirQualityLogTable.tsx
src/components/environment/WastewaterLogTable.tsx
src/components/environment/NoiseLogTable.tsx
src/components/environment/SeawaterLogTable.tsx
src/components/environment/WasteTransferLogTable.tsx
src/components/environment/ThwsInventoryTable.tsx
src/components/environment/EnvironmentModuleHub.tsx
src/components/portal/routes/EnvironmentRoutes.tsx
src/context/EnvironmentDataContext.tsx
src/app/api/v1/cmms/environment/route.ts
```

## 기존 파일 additive 변경 목록

```
src/types/lng.ts                                   (+6 lines, union 멤버 추가)
src/components/portal/utils/getInitialNav.ts        (+3 lines, if 분기 추가)
src/components/portal/hooks/usePortalNavigation.tsx (+3 lines, else-if 분기 추가)
src/components/portal/utils/subProcessTitles.tsx    (+2 lines, import+spread)
src/components/SidebarNav.tsx                       (+11 lines, 섹션 블록 추가)
src/components/launcher/SectorLauncherHub.tsx        (+1 line, 버튼 추가)
src/components/portal/routes/PortalRouteView.tsx    (+2 lines, import+JSX 추가)
src/components/LNGPortalApp.tsx                     (+2 lines net, sibling wrap — 내부 JSX 재들여쓰기만 발생, 로직/순서 무변경)
```

## 최종 게이트 결과

- `tsc --noEmit`: **pass (0 errors)**
- `vitest run`: **10 files / 121 tests passed**
- 하드 블록 8개 항목: **0 touches**
- `src/context/PortalDataContext.tsx`: **0 touches**
- UI 레이어 PASS/FAIL 자동판정: **미발명 확인** (status는 항상 저장값 그대로 표시)

## 다음 단계 (HJ 결정 대기, 자동 진행하지 않음)

- 이번 Stage에서 새로 발생한 HJ 결정 필요 항목: 신규 API 라우트(`src/app/api/v1/cmms/environment/route.ts`)에 THWS 상태 업데이트(`updateThwsStatus`) 및 로그 입력(`insert*`)용 POST/PATCH를 언제 노출할지.
- Stage 1에서 이미 플래그된 두 항목(NP-10 Appendix 3 규제기준표 확정 여부, NP10-01~04 관리 양식 착수 시점)은 이번 Stage에서도 변경 없이 유지된다.
