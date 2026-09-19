# Stage 3 계획: PortalDataContext 파사드(Facade) 적용

**Status:** 계획 수립 완료 — **구현 착수는 HJ 별도 승인 대기 (미승인 상태)**
**Date:** 2026-09-17
**선행 문서:** [`domain-boundary-hmi-cmms-vs-lng-process.md`](./domain-boundary-hmi-cmms-vs-lng-process.md) (ADR, Stage 2),
[`lng-process-data-map.md`](./lng-process-data-map.md) (PRE-FLIGHT II), Stage 1 `useNiasPowerThermalStorage`
추출 (commit `7d42a2a`)

> 이 문서는 **계획 + 구현 프롬프트**만 제공한다. `PortalDataContext.tsx` 자체는 물론, 32개
> 소비자 파일 중 단 한 줄도 이 문서 작성 과정에서 수정하지 않았다. §1의 승인 게이트를
> 통과하기 전에는 §6의 구현 프롬프트를 실행에 옮기지 않는다.

---

## 0. TL;DR

- `PortalDataContext.tsx`(447줄)는 무수정 유지. 대신 그 위에 도메인별 **얇은 selector
  훅(파사드) 5개**를 새로 추가해, 32개 소비자 파일이 `usePortalData()`를 직접 호출하는
  대신 자신의 도메인에 맞는 파사드 훅만 호출하도록 단계적으로 전환한다.
- 파사드는 내부적으로 여전히 `usePortalData()`를 호출한다 — **저장 매체(localStorage)나
  데이터 흐름은 전혀 바뀌지 않는다.** 오직 "이 화면이 실제로 쓰는 슬라이스가 무엇인가"를
  명시적 경계로 드러내는 것이 목적이다.
- 32개 참조 파일 중 실제로 `usePortalData()`를 **호출**하는 파일은 21개뿐이다. 나머지는
  배럴 재노출 1개(`CmmsAwarePortalProvider.tsx`)와, 타입/주석/테스트로만 참조하는 10개다
  (§2 참조). 마이그레이션 대상은 21개 + 배럴 1개, 총 22개다.

---

## 1. 승인 게이트 재확인 (먼저 읽을 것)

ADR §3은 명시적으로 다음을 요구한다:

> "Any future stage that wants to migrate an *existing* `PortalDataContext` consumer
> off localStorage ... requires an explicit, separately-scoped HJ decision before any
> code is written."

이번 Stage 3 파사드 작업은 저장소(localStorage) 자체를 옮기지 않지만, **21개 기존 소비자
파일의 import/구조 분해 경로를 일괄 변경**한다는 점에서 ADR §3이 말하는 "기존 소비자
마이그레이션"의 범주에 든다. 따라서:

1. `PortalDataContext.tsx`는 손대지 않으므로 ADR §4의 "파일 자체를 건드리지 말 것" 조건은
   충족한다.
2. 그러나 **21개 소비자 파일을 일괄 수정하는 착수 자체는 별도 HJ 승인 대상**이다
   (AGENTS.md §2 Architecture-First Gate와 동일한 이유 — 구조 제안 → 승인 대기 → 구현).
3. 이 문서(§2~§6)는 그 승인을 받기 위한 산출물이다. **§6 구현 프롬프트는 HJ가 "Wave 1
   진행" 등으로 명시적으로 승인하기 전까지 실행하지 않는다.**

---

## 2. 현황 조사 (2026-09-17 재검증)

ADR §3이 인용한 "32개 소비자" 수치를 재검증(`grep -rln "PortalDataContext" src`, 자기
자신 제외)한 결과 **여전히 32개**로 일치했다. 다만 그중 실제로 `usePortalData()`를
**호출**하는 파일만 골라내면 다음과 같이 나뉜다.

### 2-A. 실제 훅 호출자 — 21개 (파사드 마이그레이션 대상)

| 파일 | 줄 수 | `usePortalData()`에서 구조 분해하는 필드(대표 확인분) |
|---|---|---|
| `src/components/SidebarNav.tsx` | 333 | `fleetTanks` |
| `src/components/DataIngestionHub.tsx` | 186 | `ingestionStatuses, uploadCustomCSV, reloadAllData, exportAllLogsToExcel, isLoading` |
| `src/components/GlobalFleetHubView.tsx` | 253 (cap 초과, 여유 0) | `fleetTanks, batchTransitionTanks` |
| `src/components/dashboard/JakartaHQDashboard.tsx` | 73 | `fleetTanks, settlementRecords` |
| `src/components/SettlementAuditView.tsx` | 807 | `settlementRecords, gasCompositions, addFlobossAndGCLog` (+추가 필드 가능성, 재확인 필요) |
| `src/components/portal/LNGPortalInner.tsx` | 113 | `isLoading` |
| `src/components/MaintenanceHubView.tsx` | 433 | `fleetTanks` 외 다수(구조 분해 블록 재확인 필요) |
| `src/components/locations/NiasTerminalView.tsx` | 708 | 구조 분해 블록이 큼 (181행 종료 — 재확인 필요, 다수 슬라이스 혼합 예상) |
| `src/components/locations/MvSaviourView.tsx` | 947 | `batchTransitionTanks, updateTankLog, markTankForMaintenance, addDailyMasterLog` (data map 근거) |
| `src/components/locations/arun/ArunLoadingTab.tsx` | 601 | `batchTransitionTanks, addDeliveredMeasurement` |
| `src/components/locations/arun/ArunLoadingCoqTab.tsx` | 1409 (cap 초과) | `fleetTanks, batchTransitionTanks` |
| `src/components/locations/arun/ArunMasterHistoryTab.tsx` | 920 | `fleetTanks, settlementRecords` (read-only) |
| `src/components/locations/arun/ArunHeelBogLossView.tsx` | 634 | `fleetTanks, settlementRecords` |
| `src/components/locations/nias/NiasActiveBayWorkspace.tsx` | 927 | `activeBays, toggleBayRunning, unmountBay, batchUpdateDailyMasterRecords` |
| `src/components/locations/nias/NiasOperationalOverviewTab.tsx` | 1341 (cap 초과) | read-only 스냅샷 (data map 근거) |
| `src/components/locations/nias/NiasProcessPIDDiagram.tsx` | 655 | read-only |
| `src/components/locations/nias/NiasTankMassBalanceTab.tsx` | 852 | `settlementRecords` (read-only) |
| `src/components/locations/nias/NiasCustodySettlementTab.tsx` | 751 | `settlementRecords, fleetTanks` (read-only `useMemo` 집계) |
| `src/components/locations/nias/NiasPowerThermalTab.tsx` | 927 | `fleetTanks, activeBays` (읽기만, 자체 상태는 Stage 1 훅으로 이미 분리됨) |
| `src/hooks/useArunLogistics.ts` | 433 | `fleetTanks, batchTransitionTanks, settlementRecords`(폴백) |
| `src/context/CmmsAwarePortalProvider.tsx` | 173 | 직접 호출 없음 — `export { usePortalData }` 배럴 재노출만 수행 (아래 2-B로 재분류) |

> `CmmsAwarePortalProvider.tsx`는 `usePortalData` 문자열이 코드에 등장해 위 grep에는
> 잡히지만, 실제로는 훅을 **호출**하지 않고 **재노출(re-export)**만 한다. 소비자가 아니라
> "진입점" 역할이므로 아래 2-B로 옮겨 별도 취급한다.

### 2-B. 배럴 재노출 — 1개

| 파일 | 역할 |
|---|---|
| `src/context/CmmsAwarePortalProvider.tsx` | `PortalDataProvider`를 무수정으로 감싸고 `usePortalData`를 그대로 재노출. Stage 3에서는 여기에 파사드 훅 재노출을 **추가**할 수 있는 후보 지점(선택 사항, §4-4 참조). 재노출 로직 자체는 변경 없음. |

### 2-C. 타입/주석/테스트로만 참조 — 실질 결합 없음, 마이그레이션 불필요 (10개)

재확인 결과 아래 10개 파일은 `usePortalData()`를 호출하지 않는다. `PortalDataContextType`
타입만 prop 타이핑에 쓰거나, 순수 주석 참조("~를 건드리지 않는다"류)에 불과하다:

- `src/components/CmmsEquipmentRegistryView.tsx` — 주석 참조만
- `src/components/dashboard/panels/HqSettlementDisputePanel.tsx` — 주석 참조만
- `src/components/locations/nias/hooks/useNiasPowerThermalStorage.ts` — Stage 1 산출물, 무관
- `src/components/locations/nias/panels/NiasModalsPanel.tsx` — `PortalDataContextType['mountTankToBay']` 등 **prop 타입**만 참조 (부모가 값을 내려줌, 자체 호출 없음)
- `src/components/locations/NiasTerminalView.test.tsx` — 테스트 파일
- `src/context/DailyOpsDataContext.tsx` / `EnvironmentDataContext.tsx` / `MocDataContext.tsx` / `TruckingDataContext.tsx` — 각자 "Does NOT touch PortalDataContext.tsx" 주석만 존재 (병렬·격리된 독립 컨텍스트)
- `src/data/legacyDataSource.ts` — 주석 참조만
- `src/scripts/exportCmmsAssetSnapshot.ts` — 주석 참조만
- `src/data/02_specifications/CMMS_Architecture.md` — 문서 파일, 코드 아님

**결론: Stage 3 마이그레이션 실작업 대상은 21개 파일 + 배럴 1개(선택) = 최대 22개다.**
ADR이 인용한 "32개"는 여전히 정확한 grep 결과이지만, 실질 파사드 전환이 필요한 범위는
그보다 작다.

---

## 3. Facade 설계

### 3-1. 원칙

1. **Zero-touch 불변**: `PortalDataContext.tsx`, `tankOperationsService.ts`,
   `settlementService.ts`, `usePortalStorageSync.ts` — 원본 파일과 그 내부 로직은
   한 글자도 수정하지 않는다.
2. **파사드 = 얇은 selector, 새 상태 없음**: 각 파사드 훅은 내부에서
   `const ctx = usePortalData();` 한 줄을 호출하고, 필요한 필드만 추려 반환한다.
   새로운 `useState`/`useEffect`를 추가하지 않는다 — 동작 동등성이 생명이다.
3. **도메인 경계는 `PortalDataContextType`의 기존 필드 그룹을 그대로 따른다** — 새로운
   데이터 모델을 만들지 않고, 기존 7개 상태 슬라이스 + ~20개 액션을 재배치만 한다.
4. AGENTS.md §3 State Layer 규칙(`hooks/use*.ts`)을 따라 `src/hooks/` 아래에 배치하고,
   파일당 250줄 캡을 지킨다 (각 파사드는 실제로는 20~60줄 내외로 예상되어 여유가 크다).

### 3-2. 디렉터리 구조 (신규 생성만, 기존 파일 무수정)

```
src/hooks/portalDataFacade/
  useFleetTankFacade.ts        # fleetTanks, activeBays(읽기) + 탱크·베이 액션
  useDailyMasterFacade.ts      # dailyMasterRecords + 일일 마스터 액션
  useSettlementFacade.ts       # settlementRecords, gasCompositions + 정산 액션
  useGasQualityFacade.ts       # gasQualityRecords + saveGasQualityRecord
  usePortalSystemFacade.ts     # ingestionStatuses, isLoading, error + 업로드/리로드/엑셀
  index.ts                     # 배럴 재노출 (선택)
```

### 3-3. 필드 매핑

| 파사드 훅 | 상태 슬라이스 | 액션 |
|---|---|---|
| `useFleetTankFacade` | `fleetTanks`, `activeBays` | `updateTankLog`, `moveTankLocation`, `batchTransitionTanks`, `mountTankToBay`, `unmountBay`, `toggleBayRunning`, `markTankForMaintenance`, `releaseTankFromMaintenance`, `recordPostRegasOffload`, `authorizeBackhaulClearance` |
| `useDailyMasterFacade` | `dailyMasterRecords` | `addDailyMasterLog`, `saveDailyInspectionRecord`, `batchUpdateDailyMasterRecords`, `addDepressurizationLog` |
| `useSettlementFacade` | `settlementRecords`, `gasCompositions` | `addDeliveredMeasurement`, `addConsumptionRecord`, `addFlobossAndGCLog` |
| `useGasQualityFacade` | `gasQualityRecords` | `saveGasQualityRecord` |
| `usePortalSystemFacade` | `ingestionStatuses`, `isLoading`, `error` | `uploadCustomCSV`, `reloadAllData`, `exportAllLogsToExcel` |

`NiasActiveBayWorkspace.tsx`처럼 `activeBays`(Fleet) + `batchUpdateDailyMasterRecords`
(DailyMaster)를 동시에 쓰는 화면은 **두 파사드를 함께 호출**한다 (컴포지션, 새 통합 훅을
만들지 않음 — 훅은 자유롭게 조합 가능하므로 추가 추상화가 불필요).

### 3-4. 참조 구현 (`useFleetTankFacade.ts` 예시, ~30줄)

```ts
// src/hooks/portalDataFacade/useFleetTankFacade.ts
"use client";

import { usePortalData } from '../../context/PortalDataContext';

export function useFleetTankFacade() {
  const {
    fleetTanks,
    activeBays,
    updateTankLog,
    moveTankLocation,
    batchTransitionTanks,
    mountTankToBay,
    unmountBay,
    toggleBayRunning,
    markTankForMaintenance,
    releaseTankFromMaintenance,
    recordPostRegasOffload,
    authorizeBackhaulClearance,
  } = usePortalData();

  return {
    fleetTanks,
    activeBays,
    updateTankLog,
    moveTankLocation,
    batchTransitionTanks,
    mountTankToBay,
    unmountBay,
    toggleBayRunning,
    markTankForMaintenance,
    releaseTankFromMaintenance,
    recordPostRegasOffload,
    authorizeBackhaulClearance,
  };
}
```

새 메모이제이션(`useMemo`)은 넣지 않는다 — `usePortalData()`가 오늘 반환하는 참조 안정성
특성을 그대로 통과시켜야, 파사드 도입만으로 리렌더링 패턴이 바뀌는 부작용을 피할 수 있다.

---

## 4. 마이그레이션 순서 (Wave)

파일 크기·구조 분해 필드 수·안전 영향도를 기준으로 4개 웨이브로 나눈다. **각 웨이브는
독립적으로 승인·중단 가능**하며, 웨이브 사이에 `tsc --noEmit` + 관련 테스트 통과를
확인한다.

| Wave | 대상 | 근거 |
|---|---|---|
| **Wave 1 (최저 위험)** | `SidebarNav.tsx`, `JakartaHQDashboard.tsx`, `LNGPortalInner.tsx`, `DataIngestionHub.tsx` | 구조 분해 필드 1~5개, read-only 위주, 라우팅/셸 레벨 — 실패해도 즉시 눈에 띔 |
| **Wave 2** | `GlobalFleetHubView.tsx`, `ArunMasterHistoryTab.tsx`, `ArunHeelBogLossView.tsx`, `NiasTankMassBalanceTab.tsx`, `NiasCustodySettlementTab.tsx`, `NiasProcessPIDDiagram.tsx`, `NiasOperationalOverviewTab.tsx` | 대부분 read-only 또는 단일 액션(`batchTransitionTanks`) |
| **Wave 3** | `MaintenanceHubView.tsx`, `SettlementAuditView.tsx`, `ArunLoadingTab.tsx`, `ArunLoadingCoqTab.tsx`, `useArunLogistics.ts`, `NiasPowerThermalTab.tsx` | 뮤테이션 액션 다수, 일부 대형 파일(1400줄급) — 파사드 교체 diff만 국한, 내부 로직 무수정 |
| **Wave 4 (최고 위험, 최후)** | `NiasActiveBayWorkspace.tsx`, `MvSaviourView.tsx`, `NiasTerminalView.tsx` | 다중 도메인 파사드 조합 필요, 라이프사이클 중심 뷰(패트롤/항해/게이트 라우팅) — 실제 운영 화면 영향도 최대 |

배럴 재노출(`CmmsAwarePortalProvider.tsx`)에 파사드 재노출을 추가하는 작업은 선택 사항이며
Wave 1 이후 아무 때나 독립적으로 진행 가능 (기존 `export { usePortalData }`를 건드리지
않고 라인만 추가).

---

## 5. 안전장치 & Definition of Done

1. **동작 동등성**: 각 파일에서 바뀌는 것은 오직 (a) import 경로, (b) 구조 분해 소스
   (`usePortalData()` → `useXxxFacade()`) 뿐이어야 한다. JSX, 핸들러 바디, 조건문은
   무수정.
2. **파일당 1커밋 또는 Wave당 1커밋** — 문제 발생 시 격리된 `git revert`가 가능하도록.
3. 파일 수정 후 즉시 `node_modules/typescript/bin/tsc --noEmit` 실행, 0 에러 확인
   (AGENTS.md §4).
4. `NiasTerminalView.test.tsx`처럼 기존 테스트가 있는 파일은 수정 후 해당 테스트 재실행.
5. 각 Wave 완료 시 브라우저에서 골든 패스 1회 수동 확인 (해당 화면 진입 → 대표 뮤테이션
   1건 실행 → 값 반영 확인).
6. **PortalDataContext.tsx의 diff는 이 Stage 전체에서 0줄이어야 한다** — 이것이 Stage 3
   전체의 성공 기준이다.
7. Wave 4까지 완료 후, `grep -rln "usePortalData()" src`가 파사드 5개 파일 내부 호출
   지점(5건)으로만 수렴하는지 확인 (21개 소비자가 모두 파사드 경유로 전환됐는지의
   최종 검증).

Stage 3의 "완료" 정의는 **21개 소비자가 파사드를 경유**하고 **PortalDataContext.tsx가
무수정**인 상태다. 슬라이스별 실제 저장소 분리(SQLite DAO 전환 등)는 Stage 3의 범위가
아니며, ADR §3에 따라 각 슬라이스별로 별도 HJ 승인이 필요한 차후 Stage다.

---

## 6. 구현 프롬프트 (HJ 승인 후 그대로 사용)

> 아래 프롬프트는 self-contained하게 작성했다 — 별도 세션/에이전트에 그대로 투입 가능.
> **HJ가 "Wave N 진행 승인"을 명시하기 전에는 실행하지 않는다.**

```
[Stage 3 — PortalDataContext Facade Migration, Wave <N>]

배경: docs/architecture/portal-data-context-stage3-facade-plan.md 를 먼저 읽어라.
이 작업의 유일한 목표는 Wave <N>에 속한 파일들이 `usePortalData()`를 직접 호출하는
대신, src/hooks/portalDataFacade/ 아래의 해당 파사드 훅을 호출하도록 바꾸는 것이다.

절대 규칙:
1. src/context/PortalDataContext.tsx는 1바이트도 수정하지 않는다. import만 한다.
2. src/services/tankOperationsService.ts, settlementService.ts,
   hooks/usePortalStorageSync.ts도 무수정.
3. 대상 파일에서 바꾸는 것은 오직: (a) usePortalData import를 해당 파사드 훅 import로
   교체, (b) `= usePortalData();` 호출을 `= useXxxFacade();` (필요시 여러 개 조합)로
   교체. 그 외 JSX/로직/변수명은 절대 건드리지 않는다 — Strict Minimal Diff.
4. 파사드가 아직 없는 슬라이스/액션 조합이 필요하면, 기존 5개 파사드 파일에 필드를
   "추가"하는 것은 허용하되(PortalDataContextType에 실제로 존재하는 필드에 한함),
   새 파사드 파일을 임의로 만들지 말고 먼저 계획 문서의 §3-3 표와 대조해 보고하라.
5. 파일 수정 직후 `npx tsc --noEmit` 실행, 에러 0건 확인 후 다음 파일로 진행.
6. 파일당 최소 1커밋. 커밋 메시지는 "Stage 3 Wave <N> — <파일명> PortalDataContext
   facade 전환" 형식.
7. Wave 전체 완료 후 계획 문서 §5의 Definition of Done 체크리스트를 그대로 보고하라.
8. 하나라도 애매하면(특히 Wave 4의 다중 도메인 조합 파일) 코드를 쓰기 전에 멈추고
   HJ에게 질문하라 — 이 파일들은 실제 운영 게이트/라이프사이클 화면이다.

이번 실행 범위(Wave <N>) 파일 목록:
<계획 문서 §4의 해당 Wave 표를 그대로 복사>

작업 순서: Wave <N> 목록을 위에서부터 순서대로, 한 파일씩 진행 → tsc 확인 → 커밋 →
다음 파일. 중간에 계획에 없던 파일에서 usePortalData 호출을 추가로 발견하면 멈추고
보고만 하라(수정하지 말 것 — §2 조사 결과와 어긋나는 신규 발견은 범위 확장이 아니라
계획 갱신 대상이다).
```

---

## 7. 다음 단계

이 문서는 계획 + 프롬프트 제공까지가 범위다. HJ가 다음 중 하나를 결정해야 Stage 3
구현이 시작된다:

- [ ] Wave 1부터 순차 진행 승인
- [ ] 특정 Wave만 우선 승인 (예: Wave 1~2만, Wave 3~4는 보류)
- [ ] 파사드 설계(§3) 자체에 대한 수정 요청 (디렉터리 위치, 그룹핑 기준 등)
- [ ] 전면 보류

승인 전까지 `src/hooks/portalDataFacade/`는 생성하지 않는다.
