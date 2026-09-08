# PTW & Safety 모듈 데이터 정합성 감사 보고서 (2026-09-08)

본 보고서는 코드 수정 없이 진행된 조사 결과만을 담는다. 모든 항목은 코드에서 직접 확인한 사실과 문서에서 직접 인용한 근거로만 작성했다.

---

## 0. src/data 신규 문서 식별 (1단계)

`SSHQE_MASTER_SPECIFICATION.md` 외에 이번 세션에서 새로 추가된(git 미추적, `??`) 문서 3건:

| 파일 | 성격 | 서명/승인 주체 명시 |
| :--- | :--- | :--- |
| `pms-master-specification.md` | PMS(설비 예방정비) 마스터 스펙 | 있음 — Rev.0(2025.08.08), 작성 Juli Surungan Aprianto Simanjuntak(OTL)/Shadiq Muhammad(SOML)/Susilo, 최종 승인 Edi Hermawan(Site Manager)/Daniel Kweon(SML) |
| `ptw-form-requirements.md` | NP08 계열 실물 서식(체크리스트) 항목 추출본 | **없음** — 문서 어디에도 Site Manager/최종 승인자 서명 블록이 없음. 문서 자체가 "NP07 계열 허가서 본문은 소스에 없다"고 자기 한계를 명시(11행) |
| `safety-ptw-rules.md` | PTW 분류/라이프사이클/가스기준/LOTO 규칙 정의서 | 있음 — 말미에 SSHQE와 동일한 Rev.0(2025.08.08), Juli Surungan 검토, Edi Hermawan/Daniel Kweon 최종 승인 명시 |

(`LNG Nias 및 BSGL 현장 운영 및 인사 규정 분석서.md`는 git log 상 이전 커밋(a1f5057)에 이미 포함된 기존 파일이며 이번 세션 신규 문서 아님.)

**우선순위 판단**: `SSHQE_MASTER_SPECIFICATION.md`와 `safety-ptw-rules.md`는 동일한 승인 체인(Edi Hermawan/Daniel Kweon, Rev.0)을 명시하여 SSOT로서의 권위가 동등하다. `ptw-form-requirements.md`는 승인 서명 블록이 없고, 문제가 되는 NP07 매핑 문장 자체를 "사용자가 질의하신"이라는 표현으로 인용하며 "문서 내 확인 불가"라고 스스로 한정하고 있어 권위가 약하다. → 이 근거로 아래 상충 항목은 "판단 불가"가 아니라 "SSHQE 4.1이 상대적으로 더 권위 있는 SSOT"로 판단했다(프롬프트 지시대로 상충 사실은 별도 보고).

### 상충 발견: `ptw-form-requirements.md` line 11 vs SSHQE 4.1

| NP07 코드 | SSHQE_MASTER_SPECIFICATION.md §4.1 (승인 서명 존재) | ptw-form-requirements.md line 11 (승인 서명 없음, 자기-한정 문구 포함) |
| :--- | :--- | :--- |
| NP07-10 | Cold Work | Cold Work Permit (일치) |
| NP07-11 | **Confined Space Entry** | **Hot Work Permit** (상충) |
| NP07-12 | **Electrical** | **Confined Space Entry Permit** (상충) |
| NP07-13 | **Excavation** | **Electrical / LOTO Permit** (상충) |
| NP07-14 | **Hot Work** | **Excavation Permit** (상충) |
| NP07-15 | Radiography | Radiography Permit (일치) |

이 프롬프트에서는 지시에 따라 SSHQE §4.1 매핑(Cold=10, Confined=11, Electrical=12, Excavation=13, Hot Work=14, Radiography=15)을 잠정 기준으로 계속 진행한다.

`safety-ptw-rules.md`는 PTW 6대 분류표(§1)에서 NP07-xx 번호를 전혀 쓰지 않고 별도 SOP(NP08-06, HSG253 등)만 인용하므로 이 상충에 직접 관여하지 않는다.

---

## 1. 요약

- NP07 매핑 오류가 실제로 영향을 미치는 파일: **7개** (`ptwMasterData.ts`, `usePTWPermits.ts`, `safetyOverviewData.ts`, `PermitTicketCard.tsx`, `PTWPermitDetailPanel.tsx`, `PTWStatusActions.tsx`, `NewPTWPermitModal.tsx`)
- 표 2(NP07 매핑 오류) 행 수: **17행**
- 표 3(가스 임계값 불일치) 행 수: **7행**
- 표 4(서명 체계 불일치) 행 수: **4행**
- TODO(ptw-form-verify) 마커 7개 중 해소 가능 **1건**, 추가 확인 필요 **6건**

---

## 2. NP07 매핑 오류 상세 표

기준(SSHQE §4.1): NP07-10=Cold Work, NP07-11=Confined Space, NP07-12=Electrical, NP07-13=Excavation, NP07-14=Hot Work, NP07-15=Radiography

| # | 파일:라인 | 현재 코드 값 | 올바른 값(SSHQE §4.1 기준) |
| :-- | :--- | :--- | :--- |
| 1 | `ptwMasterData.ts:49,51` | `HOT_WORK.formNumber = 'NP07-11'`, `shortTitle: 'Hot Work (NP07-11)'` | NP07-14 |
| 2 | `ptwMasterData.ts:74,76` | `CONFINED_SPACE.formNumber = 'NP07-12'`, `shortTitle: 'Confined Space (NP07-12)'` | NP07-11 |
| 3 | `ptwMasterData.ts:99,101` | `ELECTRICAL.formNumber = 'NP07-13'`, `shortTitle: 'Electrical Isolation (NP07-13)'` | NP07-12 |
| 4 | `ptwMasterData.ts:124,126` | `EXCAVATION.formNumber = 'NP07-14'`, `shortTitle: 'Excavation (NP07-14)'` | NP07-13 |
| 5 | `ptwMasterData.ts:29,31` | `COLD_WORK.formNumber = 'NP07-10'` | NP07-10 (일치, 문제 없음) |
| 6 | `ptwMasterData.ts:148,150` | `RADIOGRAPHY.formNumber = 'NP07-15'` | NP07-15 (일치, 문제 없음) |
| 7 | `ptwMasterData.ts:200` | `INITIAL_PTW_PERMITS[0].formNumber = 'NP07-11'` (type: HOT_WORK) | NP07-14 |
| 8 | `ptwMasterData.ts:235` | `INITIAL_PTW_PERMITS[1].formNumber = 'NP07-11'` (type: HOT_WORK) | NP07-14 |
| 9 | `ptwMasterData.ts:270` | `INITIAL_PTW_PERMITS[2].formNumber = 'NP07-12'` (type: CONFINED_SPACE) | NP07-11 |
| 10 | `ptwMasterData.ts:305` | `INITIAL_PTW_PERMITS[3].formNumber = 'NP07-13'` (type: ELECTRICAL) | NP07-12 |
| 11 | `usePTWPermits.ts:47` | `alert(... "SOP NP07-12 mandates safe atmospheric oxygen band" ...)` (CONFINED_SPACE 게이트 문구) | NP07-11 |
| 12 | `usePTWPermits.ts:55` | `alert(... "SOP NP07-11 strictly requires 0.0% LEL" ...)` (HOT_WORK 게이트 문구) | NP07-14 |
| 13 | `safetyOverviewData.ts:31` | `note: 'Hot Work active (NP07-11) — LEL 0.0% enforced'` | NP07-14 |
| 14 | `PTWPermitDetailPanel.tsx:51` | `{activePermit.formNumber} ({activePermit.type})` — 상세 패널 헤더 배지에 formNumber 원문 직접 노출 (기존 TODO에 없던 신규 노출점) | 위 오류 값을 그대로 렌더링함 |
| 15 | `PTWStatusActions.tsx:23` | `Form: <strong>{activePermit.formNumber}</strong>` — 상태 액션 바 하단에 formNumber 직접 노출 (신규 노출점) | 위 오류 값을 그대로 렌더링함 |
| 16 | `NewPTWPermitModal.tsx:92` | `hazardDescription: \`${formDef.category} protocol active under SOP ${formDef.formNumber}.\`` — 신규 허가서 생성 시 잘못된 SOP 번호가 hazardDescription 문자열에 영구 각인됨 | 위 오류 값을 그대로 상속함 |
| 17 | `NewPTWPermitModal.tsx:127` | `{def.formNumber}: {def.title}` — PTW 발행 드롭다운 선택지에 formNumber 원문 노출 | 위 오류 값을 그대로 렌더링함 |

**주의**: `PermitTicketCard.tsx`는 이미 지난 세션에서 TODO 마커(20~23행)로 이 상충을 인지하고 `ACTIVITY_BADGE_LABEL`(활동유형 배지)로 formNumber 노출을 우회 처리해 두었다(54행: `isVerifiedFormBadge`가 `CARGO_HANDLING`일 때만 formNumber 사용). 따라서 이 파일은 표 2에 오류 행으로 잡히지 않으며, 오히려 우회 처리의 근거였던 상충 사실이 본 조사로 재확인됐다.

**게이트키핑 로직 자체는 formNumber 문자열이 아니라 `PTWType` enum으로 분기한다** (`validatePTWGasSafety`, `usePTWPermits.transitionStatus` 모두 `type === 'HOT_WORK'` / `type === 'CONFINED_SPACE'` 식으로 검사). 즉 "Hot Work일 때 LEL 0% 강제" 같은 안전 로직 자체는 실제 작업유형(HOT_WORK) 기준으로 정확히 동작하며, 잘못된 SOP 코드-작업유형 매핑을 전제로 게이트 분기가 짜여 있지는 않다. 문제는 순수하게 **표시/텍스트 레이어**(formNumber 문자열 값과 그것을 노출하는 지점들)에 국한된다.

---

## 3. 가스 임계값 불일치 상세 표

기준(SSHQE §4.3): O2 19.5~23.5%, LEL 일반/밀폐공간 <5%, 화기작업 LEL 0%, H2S <10ppm(전 유형 공통), CO <25ppm(전 유형 공통), Hg는 수치 미명시("가스상 노출 수치 제한 요건 준수"만 기술).

| # | 항목 | 코드 현재값 (`ptwMasterData.ts`) | SSHQE §4.3 기준 | 판정 |
| :-- | :--- | :--- | :--- | :--- |
| 1 | `COLD_WORK.gasRestrictions.maxLelPercent` (39행) | 10 | 5 (일반 작업) | 불일치 |
| 2 | `HOT_WORK.gasRestrictions.maxH2sPpm` (62행) | 5 | 10 (전 유형 공통) | 불일치 |
| 3 | `CONFINED_SPACE.gasRestrictions.maxLelPercent` (84행) | 0 | 5 (밀폐공간은 일반 기준, 0%는 화기작업 전용) | 불일치 — 게이트키핑 값 자체 문제 |
| 4 | `CONFINED_SPACE.gasRestrictions.maxH2sPpm` (87행) | 5 | 10 (전 유형 공통) | 불일치 |
| 5 | `CARGO_HANDLING.gasRestrictions.maxLelPercent` (183행) | 10 | 해당 없음 — Cargo Handling(NP08 계열)은 SSHQE §4.3의 NP07 6대 고위험 작업 범위 밖. §4.3이 이 유형에도 적용되는지 문서상 판단 불가 | 판단 불가 |
| 6 | `gasReadings.h2sPpm` / `gasReadings.coPpm` 필드 자체 | 스키마(`types/lng.ts:357-360`)에 존재하고 모든 permit 레코드에 값이 채워짐 | 존재 필요(§4.3에 H2S/CO 기준치 명시) | 필드는 존재 — 단, 아래 #7 참조 |
| 7 | H2S/CO 게이트 검증 로직 | `validatePTWGasSafety()`(`ptwMasterData.ts:461-500`)는 `maxLelPercent`와 `CONFINED_SPACE` 전용 O2 밴드만 검사한다. `maxH2sPpm`/`maxCoPpm`/`minO2Percent`/`maxO2Percent`(HOT_WORK·COLD_WORK·ELECTRICAL 등)는 코드베이스 전체에서 **정의만 되고 실제로 어디에서도 참조(소비)되지 않음** — grep 결과 정의부(6곳) 외 사용처 0건 | §4.3은 O2/LEL/H2S/CO/Hg 모두를 "PTW 모듈 가스 입력 필드에 내장"하도록 요구 | 불일치 — 게이트키핑 로직 자체의 공백(Dead Data) |

**Hg(수은) 필드**: `gasReadings` 타입(`types/lng.ts:357-360`, `ptwMasterData.ts` 내 동일 구조)에 `hgLevel`/`mercury` 등 어떤 형태의 필드도 존재하지 않는다. `hgPpm`, `hg`, `mercury` 키워드로 전체 검색해도 0건. SSHQE §4.3이 명시한 5개 계측 항목(O2/LEL/H2S/CO/Hg) 중 Hg는 스키마 자체에서 누락되어 있다.

---

## 4. 서명 체계 불일치 상세 표

| # | 항목 | 현재 코드 (`types/lng.ts:343-369`, `ptwMasterData.ts` 샘플) | SSHQE §4.2 5단계 서명 체계 | ptw-form-requirements.md (NP08-21/31, 별개 서식군) |
| :-- | :--- | :--- | :--- | :--- |
| 1 | 필드/역할 구성 | `workLeaderId/Name`, `agtStaffId`(선택), `approverStaffId`(선택) — 3개 역할만 존재 | Permit Authorizer / Responsible Person / Permit Issuer / Work Leader / Site Checker(FSO) — 5단계 | Operator / Supervisor / HSE Officer / Site Manager — 4단계(AUTHORIZATION 블록) |
| 2 | 역할명 정합성 | `workLeaderId`는 SSHQE의 "Work Leader"와 이름은 일치하나, 나머지 두 필드(`agtStaffId`, `approverStaffId`)는 SSHQE·ptw-form-requirements 어느 쪽 명칭과도 스키마 레벨에서 매칭되지 않음(주석으로만 "HSE / AGT Certified", "Site Manager"라 부연) | Permit Authorizer/Responsible Person/Permit Issuer/Site Checker 4개 역할이 코드에 필드로 아예 존재하지 않음 | Operator/Supervisor/HSE Officer가 코드에 필드로 존재하지 않음 |
| 3 | 결론 | 코드는 3개 필드로 단순화된 자체 모델을 사용 중이며, 세 문서(코드/SSHQE/ptw-form-requirements) 중 어느 것도 서로 일치하지 않음 | — | — |
| 4 | 근거 범위 | SSHQE §4.2는 명시적으로 NP07 계열(PTW) 라이프사이클 서명 체계이고, ptw-form-requirements의 4단계는 NP08-21/NP08-31(AAV 안전조치서/계량교정 준비서) 전용 서식의 서명란으로, 적용 대상 서식군이 다름 | — | — |

---

## 5. TODO(ptw-form-verify) 마커 7개 해소 여부 판정표

| # | 위치 | 내용 요약 | 판정 | 근거 |
| :-- | :--- | :--- | :--- | :--- |
| 1 | `ptwMasterData.ts:509` | `isGasMeasurementApplicable()` — ELECTRICAL/RADIOGRAPHY의 LEL/O2 표시 여부가 실물 서식 미확인으로 보류 중 | **추가 확인 필요** | 이번에 새로 확보한 3개 문서 중 NP07-13(Electrical)/NP07-15(Radiography) 실물 서식 본문을 담은 자료는 없음. `ptw-form-requirements.md` 스스로 "NP07 계열 허가서 본문은 소스에 없다"고 명시(11행) |
| 2 | `ptwMasterData.ts:516` | `isLotoApplicable()` — LOTO 표시 대상이 ELECTRICAL/CARGO_HANDLING만 우선 반영, 나머지 NP07 계열은 실물 서식 미확인 | **추가 확인 필요** | 동일 사유 — NP07 계열 서식 본문 부재 |
| 3 | `ptwMasterData.ts:524` | `isFireWatchApplicable()` — Fire Watch 표시 대상이 HOT_WORK/CARGO_HANDLING만 우선 반영 | **추가 확인 필요** | 동일 사유 |
| 4 | `PermitTicketCard.tsx:20-23` | 활동유형 배지 라벨 — "CLAUDE.md/코드 매핑(NP07-10~15)과 SSHQE §4.1 매핑이 서로 다르다"는 문제를 이미 인지하고 formNumber 배지 대신 활동유형 배지로 우회 | **해소 가능** | 본 조사로 SSHQE §4.1(승인 서명 존재)이 `ptw-form-requirements.md`(승인 서명 없음, 자기-한정 문구)보다 권위 있는 SSOT임을 확인했다. 즉 "어느 매핑이 맞는지"의 판단 근거는 이제 확보됐다 — 실제 코드 반영(`PTW_SOP_FORMS`의 formNumber 값 수정)은 본 프롬프트 범위 밖이므로 후속 작업으로 넘긴다 |
| 5 | `PermitTicketCard.tsx:98` | LEL 표시 — ELECTRICAL/RADIOGRAPHY는 실물 서식 확인 전까지 N/A | **추가 확인 필요** | #1과 동일 사유(NP07 번호 매핑 문제가 아니라 실물 서식 존재 여부 문제) |
| 6 | `PermitTicketCard.tsx:109` | LOTO 표시 — ELECTRICAL(LOTO 실적용)/CARGO_HANDLING 외 NP07 계열은 N/A | **추가 확인 필요** | #2와 동일 사유 |
| 7 | `PermitTicketCard.tsx:113` | Fire Watch 표시 — HOT_WORK/CARGO_HANDLING 외 NP07 계열은 N/A | **추가 확인 필요** | #3과 동일 사유 |

**요약**: 7건 중 1건(NP07 번호 매핑 자체)만 이번 조사로 근거가 보강되어 해소 가능. 나머지 6건은 "NP07-1x 실물 서식 본문"이라는 별도 소스가 여전히 확보되지 않아 미해소 상태로 남는다.

---

## 6. 수정 시 위험도 평가

| 영역 | 분류 | 사유 |
| :--- | :--- | :--- |
| 표 2의 모든 NP07 매핑 오류(#1~17) | **단순 표시 텍스트 수정** | 게이트키핑 로직이 `PTWType` enum 기반으로 동작하므로, `PTW_SOP_FORMS`의 `formNumber`/`shortTitle` 값과 이를 그대로 참조하는 문자열들만 SSHQE §4.1 값으로 교체하면 됨. 로직 분기 재작성 불필요 |
| 표 3 #1~4 (LEL/H2S 임계값 자체 오기재) | **비즈니스 로직/게이트키핑 값 수정 필요** | `maxLelPercent`/`maxH2sPpm` 수치가 §4.3과 다르며, 이 값이 `validatePTWGasSafety()`의 실제 판정 조건(`gasReadings.lelPercent > formDef.gasRestrictions.maxLelPercent`)에 쓰이므로 값 변경이 곧 게이트 통과/차단 기준 변경으로 직결됨 |
| 표 3 #7 (H2S/CO/O2 검증 로직 부재) | **비즈니스 로직/게이트키핑 재작성 필요 (최우선)** | 단순 값 수정이 아니라 `validatePTWGasSafety()`에 H2S/CO 상한 검사와, 모든 유형에 대한 O2 밴드 검사(현재 CONFINED_SPACE 하드코딩 리터럴만 존재)를 신규로 추가해야 함. 현재는 §4.3이 요구하는 검증 중 상당 부분이 데이터만 있고 로직이 없는 상태 |
| Hg 필드 부재 | **비즈니스 로직/게이트키핑 재작성 필요 + 스키마 변경** | `gasReadings` 타입 자체에 필드 추가가 선행되어야 하므로 표시 텍스트 수정 범위를 넘어섬. 단, SSHQE §4.3도 Hg의 구체적 수치 기준을 제시하지 않아 임계값 정의는 별도 확인 필요 |
| 표 4의 서명 체계 불일치 | **비즈니스 로직/게이트키핑 재작성 필요** | `PTWPermit` 인터페이스에 필드 3개(현재) → 5개(SSHQE §4.2) 구조 변경이 필요하며, 이는 워크플로우 전환 로직(`transitionStatus`)의 서명자 검증 지점에도 영향을 줌 |
| TODO #1~3, #5~7 (실물 서식 미확인 항목) | **판단 보류(추가 조사 우선)** | 위험도 평가 이전에 실물 NP07 서식 본문 확보가 선행되어야 수정 방향(표시 텍스트 vs 로직)을 정할 수 있음 |

---

## 7. 권장 수정 순서 제안 (실제 수정은 본 작업 범위 밖)

1. **NP07 매핑 정정** (표 2, 저위험·고신뢰도) — `PTW_SOP_FORMS`의 `formNumber`/`shortTitle`을 SSHQE §4.1 기준으로 일괄 정정하고, 이를 참조하는 6개 파일(표 2 #7~17)에 자동 전파되는지 확인. `PermitTicketCard.tsx`의 우회 로직(TODO #4)은 이 시점에 제거 가능.
2. **가스 임계값 값 보정** (표 3 #1~4) — COLD_WORK LEL 10→5, HOT_WORK/CONFINED_SPACE H2S 5→10, CONFINED_SPACE LEL 0→5로 수정. CARGO_HANDLING(표 3 #5)은 적용 기준 문서가 불명확하므로 사용자 확인 후 진행.
3. **가스 게이트 로직 보강** (표 3 #7, 최우선 안전 이슈) — H2S/CO 상한 검사 및 전 유형 O2 밴드 검사를 `validatePTWGasSafety()`에 추가. 이 항목은 안전 게이트키핑의 실질적 공백이므로 우선순위를 표 2보다 높게 두는 것을 권장.
4. **Hg 필드 스키마 추가 여부 결정** — SSHQE §4.3이 수치 기준을 제시하지 않으므로, 실물 서식 확보 또는 사용자 확인 후 필드 추가/임계값 정의를 함께 진행.
5. **서명 체계 재설계** (표 4) — SSHQE §4.2의 5단계 서명 체계로 `PTWPermit` 인터페이스를 확장할지, 현재의 3필드 단순 모델을 유지할지 사용자 의사결정 필요. 영향 범위가 넓어(타입 정의 + 워크플로우 전환 로직 + UI 폼) 가장 마지막 순서로 권장.
6. **잔여 TODO(ptw-form-verify) 6건** — NP07-1x 실물 서식 본문 확보가 선행 조건. 새 소스 문서가 들어오기 전까지는 현행 N/A 우회 처리를 유지.
