# Phase 11 Stage 0 — 투자조사 보고서 (읽기 전용)

- 조사일: 2026-09-13
- 범위: NP-03(트럭킹), NP-10(환경관리), NP-12(MOC) — 코드/스키마 실체 유무 확정
- 방법: `src/` 전체 grep, `src/db`·`schema` 내 모든 `.sql` DDL 스캔, `src/data/sopIndex.json`(SOP 문서 인덱스) 및 관련 렌더러 코드 조사. 코드/DB 변경 없음.

---

## 조사 A — NP-03 트럭킹 검사 체크리스트 (Vehicle/Trailer Inspection)

**판정: NOT-EXISTS** (운영 가능한 UI/데이터 모델 기준)

근거:
- DB 스키마(`src/db/schema/cmms_schema.sql`, `schema/cmms_schema.sqlite.sql`, `src/db/migrations/*.sql`, `src/db/seeds/*.sql`) 전체에 `vehicle_inspections`, `trailer_inspections`, `gate_pass` 유사 테이블 없음 (`CREATE TABLE` 전수 목록 확인, 해당 테이블 0건).
- `src/` 내 "vehicle/trailer/VehicleRelease/trucking/reach stacker" 실사용 코드 매칭 0건 (히트는 `src/data/02_specifications/*.md` 명세서 텍스트, `src/data/sopIndex.json` SOP 문서 인덱스, `manpowerCalculations.ts`의 무관한 문자열뿐).
- NP-03 §7-12 "Vehicle Release Authorization Form"과 NP-05-43/44 "Trailer/Reach Stacker Inspection"은 둘 다 `src/data/sopIndex.json`에 **문서 텍스트 인덱스**로만 존재 (`np-03-...`, `checklistId: NP05-43/44` 등, L1724/L3471/L3476/L7426-7427/L7673-7674). 이 인덱스는 `src/components/sop/hooks/useSopIndex.ts`가 로드해 `SopStructuredCard.tsx`(순수 렌더 카드, `useState`/`onSubmit`/API 호출 전무 확인됨)로 뿌리는 **SOP 문서 열람용 참조 데이터**일 뿐, 실제 차량 반출입 검사를 기록/제출/승인하는 운영 워크플로우가 아님.

발견된 갭:
- 차량/트레일러 점검 기록을 저장할 DB 테이블 없음.
- 검사 항목 입력 폼, 반출입 승인(Vehicle Release) 상태 전이 로직 없음.
- Gate Pass/출입 기록 연동 없음.

---

## 조사 B — NP-10 환경관리 모듈 (Environmental Monitoring / Waste Management)

**판정: NOT-EXISTS** (운영 가능한 UI/데이터 모델 기준)

근거:
- DB 스키마 전체에 `environmental_aspects`, `waste_transfers`, `monitoring_logs` 유사 테이블 없음.
- `src/` 실사용 코드에 "environmental/waste/THWS/wastewater/AMDAL" 매칭 없음. 유일한 다량 히트는 `src/data/sopIndex.json` 한 파일로, NP-10 Chapter 1(환경 모니터링)·Chapter 2(폐기물 관리/THWS) 전체 본문과 Form NP10-01~04, Appendix 1~6이 텍스트 인덱스로 들어 있음(L13379-14927). `src/data/02_specifications/ptw-form-requirements.md`의 "Waste Handling" 항목은 NP08-21(PTW 관련 체크박스 1개) 참조일 뿐 NP-10 자체 모듈이 아님.
- `src/types/sop.ts`에 `SOPCategory` 타입으로 `'ENVIRONMENTAL'`이 존재(L11)하지만, 이는 SOP 문서 뷰어의 분류 태그일 뿐 운영 데이터 모델이 아님.
- Chapter 1(환경 모니터링)과 Chapter 2(폐기물 관리/THWS)는 코드베이스에 어느 쪽도 근거 데이터가 없으므로 **통합/분리 여부 판정 불가 → "신규 설계 필요"**로 표기.

발견된 갭:
- 대기질/수질/소음 모니터링 로그, 폐기물 이송 폼(NP10 Appendix 1/2), THWS 점검 체크리스트(Appendix 4) 저장·조회 기능 전무.
- Form NP10-01~04(환경 측면 식별/개선/보고/마스터 체크리스트) 데이터 입력 UI 전무.

---

## 조사 C — NP-12 변경관리(MOC) 워크플로우 + NP-07 Element 5/7 중복 여부

**판정: NOT-EXISTS** (운영 워크플로우 기준) / 정책 레벨 언급만 EXISTS-PARTIAL

근거:
- DB 스키마에 `change_requests`, `moc_approvals` 유사 테이블 없음.
- `src/` 전체에서 정확한 단어경계 검색(`\bMOC\b`) 결과, 실제 코드 로직은 0건. 히트는 전부 (1) `src/data/sopIndex.json`의 NP-12 문서 텍스트(Form NP12-01/NP12-02, L17315-17575 등), (2) `NIAS_NP_09_...md` 리스크관리 명세서 내 "MOC" 정책 언급, (3) `PastDateLockModal.tsx:50`의 UI 안내 문구("...공식 management change request (MOC)와 HQ 승인이 필요합니다")뿐 — 이 마지막 것도 실제 MOC 워크플로우를 호출하지 않는 정적 경고 텍스트임.
- `src/types/sop.ts`에 `SOPCategory` 타입 `'MANAGEMENT_OF_CHANGE'`가 존재(L13)하지만 이 역시 SOP 문서 뷰어 분류 태그.
- **NP-07 Element 5/7 대응**: `public/docs/sop/NP-07.md:206,208`에 "Element 5: New Projects & Modifications - ... MOC, HAZOP, PSUR" 및 "Element 7: Management of Change (MOC) - ..." 문구가 존재하나, 이는 SSHQE 정책 프레임워크 상의 **선언적 언급**일 뿐이다. e-PTW 코드(`src/data/ptwMasterData.ts`)의 실제 permit 타입은 NP07-10/11/12/13/14/15(Cold Work/Confined Space/Electrical/Excavation/Hot Work/Radiography) 6종뿐이며 MOC 관련 permit 타입이나 로직은 전무함을 확인.
- 참고: 기존 범용 승인 워크플로우 테이블 `approval_documents`(`src/db/seeds/004_rbac_approval_schema.sql:50`)의 `document_type` CHECK 제약은 `('PTW','WORK_ORDER','SHIFT_OVERRIDE','MRO_REQ')`로 한정되어 있어 **MOC를 추가하려면 CHECK 제약 확장이 필요** — 이는 SQLite 특성상 단순 `ALTER TABLE ADD COLUMN`으로 불가하고 12-step 테이블 재생성이 필요한 변경(CLAUDE.md §5 DB Schema Change Policy 대상)이므로, Stage 1 설계 시 HJ 사전 승인이 필요한 항목으로 별도 플래그.

**결론**: NP-12는 NP-07 정책 문서가 "존재를 예고"만 해둔 상태이며, 실제 코드/DB 어느 쪽에도 구현되어 있지 않다. → **완전 신규 워크플로우 구축 필요**.

---

## 중복/상충 사항

### NP-03 ↔ NP-05 (차량 점검)
- NP-03 §5 "Inspection Truck and Trailer Procedure" / §7-12 "Vehicle Release Authorization Form" (문서: `NP-03.md`)와 NP-05-43 "Trailer Inspection" / NP-05-44 "Reach Stacker Inspection" (문서: `NP-05.md`, 인덱스: `sopIndex.json` L3471/L3476, L7426-7427/L7673-7674)는 **서로 다른 절차서에서 유사한 차량/장비 점검 항목을 별도로 정의**하고 있음.
- 둘 다 코드베이스에 구현이 없으므로 이는 "코드 중복"이 아니라 **원본 SOP 문서 간 정책 중복**이다. Stage 1에서 신규 모듈을 설계할 경우, NP-03(트럭킹 반출입 시점의 차량/트레일러 점검)과 NP-05(현장 리프팅/자재 취급 장비로서의 트레일러·리치스태커 점검)를 **단일 공용 "Vehicle/Equipment Inspection" 체크리스트 컴포넌트로 통합**하고, 상위 워크플로우(반출입 승인 vs 작업 전 장비 점검)만 분리하는 설계를 권고.

### NP-12 ↔ NP-07 (MOC)
- NP-07 Element 5/7은 MOC를 정책적으로 "참조"만 하고 있고, 실질 절차·서식(NP12-01 Plan of Change, NP12-02 Completion/Request for Extension)은 NP-12에 전담되어 있음. 코드 레벨 중복은 없음(둘 다 미구현).
- Stage 1에서 NP-12 MOC 모듈을 신규 구축할 경우, NP-07 e-PTW 게이트키핑 로직(예: PSSR/HAZOP 선행 여부 체크)과의 **연동 지점**(예: Hot Work/Excavation 등 특정 permit 승인 전 관련 MOC 승인 여부 확인)을 설계에 포함할지 여부를 HJ와 별도 확인 필요 — 현재 코드에는 그런 연동 포인트가 전혀 없음.

---

## Phase 11 Stage 1 범위 제안

| 항목 | 스코프 포함 여부 | 근거 |
|---|---|---|
| NP-03 차량/트레일러 반출입 검사 + Vehicle Release Authorization | **포함** (신규 구축) | DB/UI 전무 확인 |
| NP-05-43/44 Trailer/Reach Stacker Inspection | **포함하되 NP-03과 통합 설계** | 별도 구현 시 중복 발생 우려, 공용 컴포넌트 권고 |
| NP-10 Chapter 1 환경 모니터링 (대기/수질/소음) | **포함** (신규 구축) | DB/UI 전무 확인 |
| NP-10 Chapter 2 폐기물관리/THWS | **포함** (신규 구축, 통합/분리는 Stage 1 설계 단계에서 HJ와 재확인) | DB/UI 전무, 근거 데이터 부재로 자동 판정 불가 |
| NP-12 MOC 워크플로우 (Plan of Change/Completion/Extension) | **포함** (신규 구축) | DB/UI 전무 확인, NP-07 정책 언급은 실체 아님 |
| `approval_documents` CHECK 제약에 MOC 타입 추가 | **스코프 포함하되 별도 승인 게이트** | SQLite 테이블 재생성 필요 사안 — CLAUDE.md §5 정책상 커밋 전 HJ 서면 승인 필수 |
| SOP 문서 인덱스(`sopIndex.json`) 자체 확장 | **스코프 제외** | 이미 NP-03/NP-10/NP-12 텍스트가 인덱싱되어 있어 열람 기능은 충족됨. 신규 운영 워크플로우만 구축하면 됨 |

---

## 최종 요약 (조사 A/B/C 판정)

- 조사 A (NP-03 차량 검사): **NOT-EXISTS**
- 조사 B (NP-10 환경관리): **NOT-EXISTS**
- 조사 C (NP-12 MOC): **NOT-EXISTS** (NP-07 정책 언급만 EXISTS-PARTIAL, 워크플로우 자체는 NOT-EXISTS)

리포트 경로: `docs/phase11-stage0-investigation-report.md`
