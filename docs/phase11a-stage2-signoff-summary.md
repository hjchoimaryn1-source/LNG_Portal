# Phase 11a Stage 2 — Frontend Navigation & Tab Integration (Trucking / NP-03) Sign-off

- 범위: NP-03 트럭킹 모듈을 실제 내비게이션(사이드바/섹터 런처/탭)에 연결
- 기준: Stage 1 커밋 `d158927`/`16aeea7`/`e507f22`/`d6b40e4`/`2091242` (origin에 이미 push됨), 이번 Stage에서 재수정 없음
- 브랜치: `feat/phase7-ptw-safety-gates` (유지, 신규 브랜치 없음)
- **origin에 push하지 않음** — 로컬 커밋만 존재, HJ 리뷰 대기

## 서브스테이지별 커밋 + 게이트 결과

| Sub-stage | 내용 | 커밋 | tsc --noEmit |
|---|---|---|---|
| A | SubProcessKey 5개 추가 + getInitialNav/handleSelectSubProcess/SUBPROCESS_TITLES 추가 | `c42b2fc0e0636b07c46584e34b8657c82d9a34a0` | pass |
| B | SidebarNav 신규 섹션 + SectorLauncherHub 신규 버튼 | `674c85f0a599b1799103dfd945421e534cd3faba` | pass |
| C | TruckingModuleHub 탭 조립 + Stage1 컴포넌트 6개 배선 + TruckingRoutes 신규 라우트 파일 | `f9c32c935a4a997ac74ce5f10b4a1dab035d8105` | pass |
| D | TruckingDataContext(병렬 provider) + LNGPortalApp.tsx 추가 래핑 + vitest 그린 | `c3a0166adcfefa9f1d45cb7294ff17aeef2804aa` | pass |

최종 `tsc --noEmit`: **pass (0 errors)** / 최종 `vitest run`: **8 files / 108 tests passed**

## 하드 블록 8개 항목 — 0건 터치 확인

프롬프트가 지정한 경로(`src/services/...`)는 이 저장소에 존재하지 않는다(아래 "프롬프트 대비 편차" 참고). Stage 1에서 이미 확인된 실제 경로 기준으로 A~D 전체 범위에 대해 `git diff --stat`를 재실행해 확인:

```
src/adapters/ptwStatusMapper.ts
src/data/ptwCargoHandlingRules.ts
src/data/ptwCargoHandlingTransitions.ts
src/data/ptwCargoHandlingValidators.ts
src/adapters/gasSafetyAdapter.ts
src/data/ptwGasSafetyRules.ts          (gas-test threshold constants)
src/adapters/db/gasTestDao.ts          (permit_gas_tests DAO)
src/adapters/simopsDbAdapter.ts + src/hooks/useSIMOPSCheck.ts   (SIMOPS HARD_BLOCK)
```

→ 4개 서브스테이지 커밋 전부에서 **diff --stat 출력 0줄** (touch 없음).

## PortalDataContext.tsx — 0건 터치 확인

`git diff --stat -- src/context/PortalDataContext.tsx` (기준 커밋 `2091242` 대비 `c3a0166`까지) → **출력 없음**. 트럭킹 상태/액션/임포트를 이 파일에 추가하지 않았으며, 대신 `src/context/TruckingDataContext.tsx`를 신규 생성하고 `LNGPortalApp.tsx`에서 `<CmmsAwarePortalProvider>`를 감싸는 **형제(sibling) 레벨 wrap**으로만 마운트했다(제약 #2 준수).

## NP03-08 PTW 연동 — PENDING 유지 확인

`TrafficMgmtVerificationSection.tsx`는 Stage 1에서 이미 순수 표시 컴포넌트로 구현되어 있었고, Stage 2에서는 `onOpenSopReference` prop 1개만 추가로 배선했을 뿐 **PTW 허가서 테이블/식별자에 대한 조회를 전혀 추가하지 않았다**. `values` prop 미전달 시 4개 항목 모두 여전히 `PENDING`으로 표시된다. `gasSafetyAdapter.ts`/`ptwStatusMapper.ts`/PTW 허가서 스키마에 대한 fetch/query 코드는 이 Stage의 어떤 파일에도 없다.

## 프롬프트 대비 편차 (deviation) 종합

1. **하드 블록 경로 불일치**: 프롬프트는 `src/services/ptwStatusMapper.ts` 등을 지정했으나 실제 경로는 `src/adapters/`·`src/data/` 하위. Stage 1에서 이미 확인된 실제 경로로 대체 검증(위 목록 참고).
2. **SidebarNav.tsx 구조 불일치**: "'nias-terminal'/'arun-terminal' 그룹의 정확한 JSX 패턴을 복사"하라는 지시였으나, 실제 파일은 그런 메뉴 키 그룹이 아니라 `SECTION_HEADER_BEVEL` + `renderNavItem()` 헬퍼 기반 섹션 블록 구조다. 그 실제 패턴을 그대로 복사해 "6. TRUCKING & LOGISTICS" 섹션을 추가했다.
3. **SECTOR_BUTTONS id 충돌**: 지시된 `id: 'MOD_6'`은 이미 'CMMS Overview Dashboard' 항목이 사용 중이었다(추측 금지 원칙에 따라 사전 확인). 중복 React key를 피하기 위해 `id: 'MOD_8'`을 사용했다.
4. **scadaStyles.ts 경로 불일치**: `WIN_TAB_ACTIVE`/`WIN_TAB_INACTIVE` 토큰은 실제로는 `src/components/cmms/scadaStyles.ts`가 아니라 `src/components/portal/utils/portalTabStyles.ts`에 정의되어 있다(`WorkOrderSubTabs.tsx` 등 기존 탭 컴포넌트가 실사용 중인 것과 동일한 정확한 소스). 그 실제 소스에서 그대로 재사용했다.
5. **Sub-stage C/D 순서 의존성**: 프롬프트의 C 항목이 "이 서브스테이지에서 만들어질 TruckingDataContext를 소비"하라고 되어 있었으나, TruckingDataContext는 D에서 생성된다. 각 서브스테이지가 독립적으로 `tsc --noEmit` 게이트를 통과해야 하므로, C는 컨텍스트 소비 없이 탭 셸 + Stage1 컴포넌트 마운트만 수행했고, D에서 context 생성과 동시에 `TruckingModuleHub.tsx`에 `useTruckingData()` 소비(헤더의 "LOGGED: N" 카운트 표시)를 추가했다.
6. **4탭 vs 6개 Stage-1 컴포넌트**: 프롬프트가 지정한 4개 탭(Pre-Op / Periodic / Traffic Mgmt / Post-Transit)에 NP03-06(Vehicle & Security)과 NP03-13(Pre-Ops Truck & ISO Tank)의 소속이 명시되어 있지 않았다. 라이프사이클상 모두 "출발 전" 계열이므로 "Pre-Op Checklist" 탭 하나에 NP03-02+06+13 세 컴포넌트를 함께 마운트해 6개 Stage-1 컴포넌트를 전부 정확히 1회씩 사용했다.
7. **TruckingDataContext 데이터 소스**: `truckingDbSingleton.ts`/DAO는 `node:sqlite`를 전이적으로 임포트하는 서버 전용 모듈이라 `"use client"` 컨텍스트에 직접 임포트할 수 없다. 기존 Stage 1 API 라우트(`/api/v1/cmms/trucking-inspections`, 내부적으로 동일 DAO/싱글턴 재사용)를 통해 간접적으로 "sourced from truckingDbSingleton.ts" 요건을 충족했다 — `useWorkOrders.ts`가 이미 쓰는 것과 동일한 클라이언트/서버 경계 패턴.
8. **라우트 배선 방식**: "ArunTerminalView 마운트 패턴을 따르는 하나의 additive conditional block"을 `PortalRouteView.tsx`에 직접 추가하는 대신, Strangler Fig 격리를 우선해 새 파일 `TruckingRoutes.tsx`(내부에 `LngProcessRoutes.tsx`와 동일한 `{activeKey === ... && <Component/>}` 패턴 적용)를 만들고, `PortalRouteView.tsx`에는 import 1줄 + JSX 형제 1블록만 추가했다.

## 신규 파일 목록

```
src/components/portal/utils/subProcessTitlesTrucking.tsx
src/components/portal/routes/TruckingRoutes.tsx
src/components/trucking/TruckingModuleHub.tsx
src/context/TruckingDataContext.tsx
```

## 기존 파일 additive 변경 목록

```
src/types/lng.ts                                   (+6 lines, union 멤버 추가)
src/components/portal/utils/getInitialNav.ts        (+3 lines, if 분기 추가)
src/components/portal/hooks/usePortalNavigation.tsx (+3 lines, else-if 분기 추가)
src/components/portal/utils/subProcessTitles.tsx    (+2 lines, import+spread)
src/components/SidebarNav.tsx                       (+11 lines, 섹션 블록 추가)
src/components/launcher/SectorLauncherHub.tsx       (+1 line, 버튼 추가)
src/components/portal/routes/PortalRouteView.tsx    (+5 lines, import+JSX 추가)
src/components/LNGPortalApp.tsx                     (+2 lines net, sibling wrap — 내부 JSX 재들여쓰기만 발생, 로직/순서 무변경)
src/components/trucking/TruckingModuleHub.tsx       (Sub-stage D에서 useTruckingData() 소비 1곳 추가)
```

## 최종 게이트 결과

- `tsc --noEmit`: **pass (0 errors)**
- `vitest run`: **8 files / 108 tests passed**
- 하드 블록 8개 항목: **0 touches**
- `src/context/PortalDataContext.tsx`: **0 touches**
- NP03-08 PTW 연동: **여전히 PENDING** (신규 DB read 없음)

## 다음 단계 (HJ 결정 대기, 자동 진행하지 않음)

이번 Stage에서 새로 발생한 HJ 결정 필요 항목은 없다 — Stage 1에서 이미 플래그된 두 항목(① `cmmsDbSingleton.ts` 확장 지점 부재, ② NP03-08 PTW 연동을 위한 permit_ref_no 매핑 결정)은 이번 Stage에서도 그대로 유지되며 변경되지 않았다.
