# CMMS_Architecher.md: NIAS LNG CMMS & e-PTW 통합 아키텍처 및 기술 명세서

본 문서는 인도네시아 NIAS LNG 재기화 시설(Regasification Plant) 및 관련 해양/육상 자산(Jetty, M/V Saviour, LNG ISO Tank) 관리를 위한 컴퓨터화 정비 관리 시스템(CMMS) 및 전자 작업 허가서(e-PTW)의 단일 마스터 기술 아키텍처 명세서(Single Source of Truth)입니다.

---

## 제1장: 서론 및 ISO 14224 / KKS 기반 자산 데이터 아키텍처

### 1.1 글로벌 벤치마킹 정합성 및 학술적·실무적 타당성
NIAS LNG CMMS는 글로벌 석유·가스(Oil & Gas) 및 해양 엔지니어링 표준(IBM Maximo for Oil & Gas, SAP EAM WCM, ABS Nautical Systems, Yokogawa OpreX Control of Work)과 국제 오프쇼어 안전 규정(IOGP Report 454, Shell DEP, Equinor, Chevron CoW)을 완벽히 충족합니다 [1, 2, 3].

자산 관리 아키텍처 측면에서 ISO 14224(석유, 석유화학 및 천연가스 산업의 장비 신뢰성 및 정비 데이터 수집·교환 표준)와 KKS(발전소 표기 시스템)를 유기적으로 결합한 다단계 계층 구조(Plant -> System -> Equipment/Skid -> Tag No. -> Component)는 IBM Maximo 및 SAP EAM의 표준 데이터 모델 가이드라인을 충족하며, 장비의 신뢰성 데이터 분석(MTBF, MTTR) 및 고장 모드 영향 분석(FMEA)을 위한 기초 데이터베이스 구축의 핵심 필수 전제 조건으로 작동합니다 [4].

특히 LNG 재기화 터미널과 해상 운송 선박이 결합된 NIAS 시설의 특성에 맞춰 한국선급(KR)의 연속기계검사(Continuous Machinery Survey, CMS) 항목 및 IMPA(국제선박공급품협회) 코드를 자산 데이터베이스와 직접 연계한 설계는 기술 자산의 물리적 계층구조(KKS/ISO 14224)와 법적/행정적 검사 체계(KR CMS), 그리고 자재 공급망(IMPA/ISSA)이 단일 설비 태그(`equipmentTag`)를 매개로 상호 트래킹되는 데이터 통합 체계를 완성합니다 [4].

---

### 1.2 ISO 14224 및 KKS 표준 기반 5단계 자산 계층 체계
- **Level 1: Plant (사업소/플랜트)**: 최상위 사업장 단위 (`NIAS` - NIAS LNG Terminal) [4].
- **Level 2: System (공정/계통)**: 기능별 주요 공정 계통 (`10` Jetty & Offloading, `20` Regasification & BOG Compression, `30` Gas Metering & Distribution, `40` Seawater Utility) [4].
- **Level 3: Equipment / Skid (설비/패키지 스키드)**: 독립적 기능 모듈 (`VP` Vaporizer, `CP` Compressor, `RC` Recondenser, `TK` ISO Tank, `JT` Jetty Equipment, `PU` Pump) [4].
- **Level 4: Tag No. (개별 태그/계측기/밸브)**: 고유 식별 번호를 가진 개별 자산 (`NIAS-20-VP-001A`, `NIAS-20-CP-001A`, `NIAS-30-FT-010A`) [4].
- **Level 5: Component (세부 부품/구성품)**: 분해 및 정밀 교체 최하위 부품 (Mechanical Seal, Impeller, Sensor Probe) [4].

**태깅 규칙 포맷**: `[Plant Code]-[System Code]-[Equipment Category]-[Sequence No][Train/Branch]` (예: `NIAS-20-VP-001A`) [4].

---

### 1.3 실제 LNG 재기화 설비 ISO 14224 Taxonomy 매핑 데이터 표

| No | Equipment Tag | Equipment Name | Level 1 (Plant) | Level 2 (System) | ISO 14224 Class | ISO 14224 Subunit | KKS Code | Criticality |
|---|---|---|---|---|---|---|---|---|
| 1 | NIAS-20-VP-001A | Open Rack Vaporizer A | NIAS LNG | Regasification System | Heat Exchanger | Tube Bundle / Panel | 20VP001A | HIGH |
| 2 | NIAS-20-VP-002B | Submerged Combustion Vaporizer | NIAS LNG | Regasification System | Heat Exchanger | Burner / Coil Unit | 20VP002B | HIGH |
| 3 | NIAS-20-CP-001A | BOG Compressor 1st Stage | NIAS LNG | BOG Compression System | Compressor | Cylinder / Piston | 20CP001A | CRITICAL |
| 4 | NIAS-20-CP-002B | Boil-Off Gas Re-Compressor | NIAS LNG | BOG Compression System | Compressor | Drive Motor / Shaft | 20CP002B | CRITICAL |
| 5 | NIAS-20-RC-001 | LNG Recondenser Column | NIAS LNG | Recondenser System | Pressure Vessel | Packing / Dist. Tray | 20RC001 | HIGH |
| 6 | NIAS-30-FT-010A | Gas Metering Ultrasonic Flowmeter | NIAS LNG | Gas Metering System | Instrument | Flow Sensor Probe | 30FT010A | MEDIUM |
| 7 | NIAS-10-TK-001 | Marine LNG ISO Tank Container | NIAS LNG | Jetty & Tank System | Tank Container | Valve Manifold / Shell | 10TK001 | MEDIUM |
| 8 | NIAS-10-JT-LA01 | Marine LNG Loading Arm 01 | NIAS LNG | Jetty Offloading System | Loading Arm | Swivel Joint / ERS | 10JTLA01 | CRITICAL |
| 9 | NIAS-40-PU-001A | Seawater Intake Pump A | NIAS LNG | Seawater Utility System | Pump | Impeller / Casing | 40PU001A | HIGH |
| 10 | NIAS-20-PT-012 | Vaporizer Outlet Pressure Xmtr | NIAS LNG | Regasification System | Instrument | Pressure Diaphragm | 20PT012 | HIGH |
| 11 | NIAS-30-MOV-101 | Main Gas Export Emergency Valve | NIAS LNG | Gas Metering System | Valve | Actuator / Valve Body | 30MOV101 | CRITICAL |

---

### 1.4 자산 마스터, KR CMS 및 IMPA 연동 데이터베이스 DDL 명세

```sql
-- PostgreSQL / SQLite Compatible Asset Master Table
CREATE TABLE assets (
    equipment_tag       VARCHAR(64) PRIMARY KEY,
    asset_name          VARCHAR(255) NOT NULL,
    iso_14224_class     VARCHAR(100) NOT NULL,
    kks_code            VARCHAR(64) NOT NULL UNIQUE,
    criticality         VARCHAR(20) NOT NULL CHECK (criticality IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    location_area       VARCHAR(100) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'OPERATIONAL' CHECK (status IN ('OPERATIONAL', 'MAINTENANCE', 'STANDBY', 'OUT_OF_SERVICE')),
    parent_tag          VARCHAR(64),
    manufacturer        VARCHAR(150),
    model_no            VARCHAR(100),
    serial_no           VARCHAR(100),
    design_pressure_bar NUMERIC(10, 2),
    design_temp_celsius NUMERIC(10, 2),
    installation_date   DATE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_assets_parent FOREIGN KEY (parent_tag) 
        REFERENCES assets(equipment_tag) ON DELETE SET NULL
);

-- 한국선급(KR CMS) 연동 테이블
CREATE TABLE kr_cms_items (
    cms_code            VARCHAR(64) PRIMARY KEY,
    item_name           VARCHAR(255) NOT NULL,
    survey_category     VARCHAR(100) NOT NULL,
    survey_interval_m   INT NOT NULL DEFAULT 60,
    last_survey_date    DATE NOT NULL,
    next_survey_date    DATE NOT NULL,
    d_day_status        VARCHAR(20) GENERATED ALWAYS AS (
        CASE 
            WHEN (next_survey_date - CURRENT_DATE) < 0 THEN 'OVERDUE'
            WHEN (next_survey_date - CURRENT_DATE) <= 60 THEN 'DUE_SOON'
            ELSE 'NORMAL'
        END
    ) STORED,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE asset_kr_cms_mapping (
    mapping_id          BIGSERIAL PRIMARY KEY,
    equipment_tag       VARCHAR(64) NOT NULL,
    cms_code            VARCHAR(64) NOT NULL,
    remarks             TEXT,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cms_map_asset FOREIGN KEY (equipment_tag) 
        REFERENCES assets(equipment_tag) ON DELETE CASCADE,
    CONSTRAINT fk_cms_map_item FOREIGN KEY (cms_code) 
        REFERENCES kr_cms_items(cms_code) ON DELETE CASCADE,
    CONSTRAINT uq_asset_cms UNIQUE (equipment_tag, cms_code)
);

CREATE TABLE impa_catalog (
    impa_code           VARCHAR(12) PRIMARY KEY,
    part_name           VARCHAR(255) NOT NULL,
    specification       TEXT,
    unit                VARCHAR(20) NOT NULL DEFAULT 'PCS',
    unit_price_usd      NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE asset_parts_impa (
    part_mapping_id     BIGSERIAL PRIMARY KEY,
    equipment_tag       VARCHAR(64) NOT NULL,
    impa_code           VARCHAR(12) NOT NULL,
    current_stock       INT NOT NULL DEFAULT 0,
    reorder_level       INT NOT NULL DEFAULT 5,
    min_order_qty       INT NOT NULL DEFAULT 1,
    storage_location    VARCHAR(100),
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_parts_asset FOREIGN KEY (equipment_tag) 
        REFERENCES assets(equipment_tag) ON DELETE CASCADE,
    CONSTRAINT fk_parts_impa FOREIGN KEY (impa_code) 
        REFERENCES impa_catalog(impa_code) ON DELETE RESTRICT,
    CONSTRAINT uq_asset_part UNIQUE (equipment_tag, impa_code)
);

CREATE INDEX idx_assets_parent_tag ON assets(parent_tag);
CREATE INDEX idx_assets_location_area ON assets(location_area);
CREATE INDEX idx_assets_class_status ON assets(iso_14224_class, status);
CREATE INDEX idx_assets_criticality ON assets(criticality);
CREATE INDEX idx_kr_cms_next_date ON kr_cms_items(next_survey_date);
CREATE INDEX idx_parts_stock_reorder ON asset_parts_impa(equipment_tag) WHERE current_stock <= reorder_level;
```

---

### 1.5 TypeScript Interface 명세 (`types/asset.ts`)

```typescript
export type CriticalityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type AssetStatus = 'OPERATIONAL' | 'MAINTENANCE' | 'STANDBY' | 'OUT_OF_SERVICE';
export type CmsDDayStatus = 'NORMAL' | 'DUE_SOON' | 'OVERDUE';

export interface KRCmsItem {
  cmsCode: string;
  itemName: string;
  surveyCategory: string;
  surveyIntervalMonths: number;
  lastSurveyDate: string;
  nextSurveyDate: string;
  dDayStatus: CmsDDayStatus;
}

export interface ImpaPart {
  impaCode: string;
  partName: string;
  specification: string;
  currentStock: number;
  reorderLevel: number;
  unit: string;
  unitPriceUsd: number;
  storageLocation: string;
}

export interface AssetMasterNode {
  equipmentTag: string;
  assetName: string;
  iso14224Class: string;
  kksCode: string;
  criticality: CriticalityLevel;
  locationArea: string;
  status: AssetStatus;
  parentTag: string | null;
  hasChildren: boolean;
  children?: AssetMasterNode[];
  specifications?: {
    manufacturer?: string;
    modelNo?: string;
    serialNo?: string;
    designPressureBar?: number;
    designTempCelsius?: number;
    installationDate?: string;
  };
  krCmsItems?: KRCmsItem[];
  impaParts?: ImpaPart[];
}
```

---

## 제2장: e-PTW 5단계 라이프사이클 및 안전 워크플로우

### 2.1 e-PTW 5단계 라이프사이클 및 인원 배정 시점의 오프쇼어 부합성
NIAS NP-09 규정 및 IOGP Report 454 / Chevron CoW 표준에 기반한 e-PTW 라이프사이클은 5단계 승인 및 집행 프로세스로 분리됩니다.

| Stage Code | Stage 명칭 | 담당 역할 | 핵심 기입 및 통제 항목 | IOGP CoW / 오프쇼어 표준 정합성 |
|---|---|---|---|---|
| `STAGE_1_DRAFT` | Originator Draft | Originator | Ref ID 부여, 설비 위치, PPE Zone 선택, PRAC/JSA 평가. **(인원 배정란 전면 배제)** | 내재 위험 정의 집중. 현장 투입 인원 지정 배제로 POB 동적 변동성 흡수. |
| `STAGE_2_HSSE_VERIFY` | HSSE Verification & AGT | HSSE Team & AGT | LOTO 격리 상태 현장 점검, 1차 가스 측정값(LEL, O2, H2S) 입력 및 AGT 서명. | 물리적 에너지 격리 및 무가스(Gas-Free) 환경 입증. |
| `STAGE_3_APPROVAL` | Final Approval & Issuance | Site Manager / 대행자 | 안전 대책 최종 검토, 가스 PASS 자동 검증, 서명 및 허가서 공식 발급. | Plant Authority의 공식 작업 구역 승인 및 허가서 활성화. |
| `STAGE_4_EXECUTION` | Execution & TBM | Work Leader & Workforce | 당일 투입 인원 배정, Module 6 Training Matrix 자격 검증, TBM/PJSM 실시 및 서명 후 착수. | IOGP Start-Work Checks(SWC) 원칙 준수 및 현장 직전 위험 공유 완료. |
| `STAGE_5_CLOSEOUT` | Monitoring & Close-out | HSSE Team & Work Leader | 시간별 가스 재측정, 작업 완료/중단 보고, LOTO De-isolation 검증 및 최종 Close-out. | 작업 지속 조건 유지 통제 및 동적 가스 재검정, 안전한 원상복구. |

---

### 2.2 PRAC 및 ALARP Soft Escalation 매커니즘
Stage 1 작성 시 PRAC Column 3 "잔여 위험이 ALARP 수준인가?" 질의에 `No` 체크 시, 제출을 차단하지 않고 시각적 경고(`⚠ Additional Detailed JSA Required`)를 표출하며 `is_alarp_yes = false` 플래그를 설정합니다. Stage 2~3 승인 단계에서 '추가 JSA 문서 첨부'를 필수 검증 조건(Mandatory Gate)으로 강제 에스컬레이션합니다.

---

### 2.3 LOTO 에너지 격리 (LOTOTO) 및 가스 검정 (AGT) 데이터 아키텍처
1. **LOTO 양방향 절차**:
   - **Isolation**: Tag 발행 -> 물리적 잠금(Padlock) 및 Tag 부착 -> 비통전/압력 방출 입증 (Tryout) -> 서명 (`ISOLATED`).
   - **De-isolation**: 작업 완료 확인 -> 잠금 해제 및 Tag 회수 -> 원상 복구 -> 서명 (`DE_ISOLATED`).
2. **AGT 가스 검정 자동 판정 임계값 (SSHQE §4.3)**:
   - **LEL**: `0.0%` ~ `4.9%` -> **PASS** / `>= 5.0%` -> **FAIL** *(Hot Work 화기 작업은 엄격히 `0.0% LEL` 필수)*.
   - **O2**: `19.5%` ~ `23.5%` -> **PASS** / 이탈 시 **FAIL**.
   - **H2S**: `0.0 ppm` ~ `9.9 ppm` -> **PASS** / `>= 10.0 ppm` -> **FAIL**.
   - **CO**: `0.0 ppm` ~ `24.9 ppm` -> **PASS** / `>= 25.0 ppm` -> **FAIL**.

---

### 2.4 e-PTW 마스터, LOTO, AGT 및 TBM 서명 데이터베이스 DDL 명세

```sql
CREATE TABLE permits (
    permit_id           BIGSERIAL PRIMARY KEY,
    ref_no              VARCHAR(64) NOT NULL UNIQUE,
    equipment_tag       VARCHAR(64) NOT NULL,
    stage_code          VARCHAR(32) NOT NULL DEFAULT 'STAGE_1_DRAFT' 
                        CHECK (stage_code IN ('STAGE_1_DRAFT', 'STAGE_2_HSSE_VERIFY', 'STAGE_3_APPROVAL', 'STAGE_4_EXECUTION', 'STAGE_5_CLOSEOUT', 'CLOSED', 'CANCELLED')),
    status              VARCHAR(32) NOT NULL DEFAULT 'DRAFT'
                        CHECK (status IN ('DRAFT', 'PENDING_VERIFICATION', 'APPROVED_ISSUED', 'IN_PROGRESS', 'SUSPENDED', 'CLOSED', 'REJECTED', 'CANCELLED')),
    work_title          VARCHAR(255) NOT NULL,
    work_area           VARCHAR(100) NOT NULL,
    ppe_zone_code       VARCHAR(50) NOT NULL,
    prac_risk_level     VARCHAR(20) NOT NULL CHECK (prac_risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'EXTREME')),
    is_alarp_yes        BOOLEAN NOT NULL DEFAULT TRUE,
    version             INT NOT NULL DEFAULT 1,
    payload_hash        VARCHAR(64),
    originator_id       VARCHAR(64) NOT NULL,
    site_manager_id     VARCHAR(64),
    valid_from          TIMESTAMP WITH TIME ZONE,
    valid_until         TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_permits_asset FOREIGN KEY (equipment_tag) REFERENCES assets(equipment_tag) ON DELETE RESTRICT
);

CREATE TABLE permit_loto_mappings (
    loto_mapping_id     BIGSERIAL PRIMARY KEY,
    permit_id           BIGINT NOT NULL,
    isolation_point_tag VARCHAR(64) NOT NULL,
    isolation_type      VARCHAR(32) NOT NULL CHECK (isolation_type IN ('ELECTRICAL', 'MECHANICAL_VALVE', 'HYDRAULIC', 'PNEUMATIC')),
    loto_tag_no         VARCHAR(64) NOT NULL UNIQUE,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ISOLATED', 'DE_ISOLATED')),
    isolated_by         VARCHAR(64),
    isolated_at         TIMESTAMP WITH TIME ZONE,
    deisolated_by       VARCHAR(64),
    deisolated_at       TIMESTAMP WITH TIME ZONE,
    verifier_signature  TEXT,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_loto_permit FOREIGN KEY (permit_id) REFERENCES permits(permit_id) ON DELETE CASCADE
);

CREATE TABLE permit_gas_tests (
    gas_test_id         BIGSERIAL PRIMARY KEY,
    permit_id           BIGINT NOT NULL,
    test_type           VARCHAR(20) NOT NULL CHECK (test_type IN ('INITIAL', 'RETEST', 'CONTINUOUS')),
    lel_percent         NUMERIC(4, 1) NOT NULL,
    o2_percent          NUMERIC(4, 1) NOT NULL,
    h2s_ppm             NUMERIC(5, 1) NOT NULL,
    co_ppm              NUMERIC(5, 1) DEFAULT 0.0,
    result_status       VARCHAR(10) NOT NULL CHECK (result_status IN ('PASS', 'FAIL')),
    tested_by_agt       VARCHAR(64) NOT NULL,
    agt_signature       TEXT NOT NULL,
    tested_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_gastest_permit FOREIGN KEY (permit_id) REFERENCES permits(permit_id) ON DELETE CASCADE
);

CREATE TABLE permit_tbm_signatures (
    tbm_sign_id         BIGSERIAL PRIMARY KEY,
    permit_id           BIGINT NOT NULL,
    work_leader_id      VARCHAR(64) NOT NULL,
    worker_id           VARCHAR(64) NOT NULL,
    training_verified   BOOLEAN NOT NULL DEFAULT FALSE,
    worker_signature    TEXT NOT NULL,
    signed_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tbm_permit FOREIGN KEY (permit_id) REFERENCES permits(permit_id) ON DELETE CASCADE,
    CONSTRAINT uq_permit_worker UNIQUE (permit_id, worker_id)
);

CREATE INDEX idx_permits_stage_status ON permits(stage_code, status);
CREATE INDEX idx_permits_equipment_tag ON permits(equipment_tag);
CREATE INDEX idx_loto_permit_status ON permit_loto_mappings(permit_id, status);
CREATE INDEX idx_gastest_permit_time ON permit_gas_tests(permit_id, tested_at DESC);
```

---

### 2.5 TypeScript Interface 명세 (`types/ptw.ts`)

```typescript
export type PTWStageEnum = 
  | 'STAGE_1_DRAFT' | 'STAGE_2_HSSE_VERIFY' | 'STAGE_3_APPROVAL' 
  | 'STAGE_4_EXECUTION' | 'STAGE_5_CLOSEOUT' | 'CLOSED' | 'CANCELLED';

export type PTWStatusEnum = 
  | 'DRAFT' | 'PENDING_VERIFICATION' | 'APPROVED_ISSUED' 
  | 'IN_PROGRESS' | 'SUSPENDED' | 'CLOSED' | 'REJECTED' | 'CANCELLED';

export interface LotoMapping {
  lotoMappingId: number;
  permitId: number;
  isolationPointTag: string;
  isolationType: 'ELECTRICAL' | 'MECHANICAL_VALVE' | 'HYDRAULIC' | 'PNEUMATIC';
  lotoTagNo: string;
  status: 'PENDING' | 'ISOLATED' | 'DE_ISOLATED';
  isolatedBy?: string;
  isolatedAt?: string;
  verifierSignature?: string;
}

export interface GasTestRecord {
  gasTestId: number;
  permitId: number;
  testType: 'INITIAL' | 'RETEST' | 'CONTINUOUS';
  lelPercent: number;
  o2Percent: number;
  h2sPpm: number;
  coPpm?: number;
  resultStatus: 'PASS' | 'FAIL';
  testedByAgt: string;
  agtSignature: string;
  testedAt: string;
}

export interface PermitMaster {
  permitId: number;
  refNo: string;
  equipmentTag: string;
  stageCode: PTWStageEnum;
  status: PTWStatusEnum;
  workTitle: string;
  workArea: string;
  ppeZoneCode: string;
  pracRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  isAlarpYes: boolean;
  version: number;
  payloadHash?: string;
  originatorId: string;
  siteManagerId?: string;
  validFrom?: string;
  validUntil?: string;
  lotoMappings?: LotoMapping[];
  gasTests?: GasTestRecord[];
}
```

---

## 제3장: 이원화 관제(Dual-Control) UI/UX 및 위치/PPE Zone 연동 아키텍처

### 3.1 본사 총괄(HQ Overview) vs 현장 승인 관제(Site Approval Hub) 이원화 아키텍처
1. **HQ Overview Dashboard (본사/총괄 전용)**: 전체 공정 가동률, MRO 자원 보급, Overhaul 진행률, POB 현황, MTBF/MTTR 거시 지표 수집 및 실시간 관제.
2. **Site Approval Hub (현장 최종 승인권자 - Site Manager Pak Edi 전용)**: e-PTW Stage 3 최종 발급, 긴급 WO 결재, Shift Override 대행 결재 등 타임 크리티컬 1-Click 승인 센터.

#### 3.1.1 HQ Overview Dashboard 컴포넌트 구조 및 Sector 6 라우팅 (이력 및 현황)

| 항목 | 내용 |
|---|---|
| 개념 정의 위치 | §3.1 HQ Overview Dashboard (본사/총괄 전용) |
| 과거 구현 파일 | `src/components/JakartaHQDashboard.tsx` |
| 현재 상태 | **삭제됨** — 커밋 `73c096c` (`chore: remove confirmed dead code files`)에서 미사용(orphan) 컴포넌트로 확인되어 저장소에서 제거 |
| 삭제 전 라우팅 연결 | 없음 — 삭제 이전에도 앱 내 어떤 진입점에서도 import되지 않았음 |
| Sector 6 진입점 | **미확정** — 신규 Sector 버튼으로 재도입할지, 기존 Sector에 흡수할지 결정되지 않음. 재구현 시 별도 승인 절차를 거쳐 본 문서에 반영 예정 |

> **Gap Note**: HQ Overview Dashboard는 §3.1에 개념상 정의되어 있으나, 실제 구현체(`JakartaHQDashboard.tsx`)는 dead code 정리 과정에서 이미 제거되었습니다. 따라서 "라우팅 미연결" 상태가 아니라 "구현체 없음" 상태이며, Sector 6 라우팅 여부는 재구현 결정과 함께 별도로 논의되어야 합니다.

---

### 3.2 Dynamic Cascade Select 기반 Plant Location 및 NP-09 PPE Zone 자동 필터링

```typescript
export const LOCATION_TO_PPE_ZONES: Record<string, string[]> = {
  'Vaporizer Area': ['Air Ambient Vaporizer & BOG Compressor Area', 'All Site Areas'],
  'BOG Compressor Area': ['Air Ambient Vaporizer & BOG Compressor Area', 'All Site Areas'],
  'LNG ISO Tank Storage Area': ['ISO Tank & Buffer Tank Storage Area', 'All Site Areas'],
  'LNG ISO Tank Unloading Area': ['ISO Tank Movement & Unloading Area', 'LNG Cryogenic Pump & Piping Area', 'All Site Areas'],
  'Gas Metering Area': ['Control Valve & Instrumentation Area', 'All Site Areas'],
  'Electrical MCC & Substation': ['Electrical System (MCC, Panels)', 'All Site Areas'],
  'Jetty Area': ['LNG Cryogenic Pump & Piping Area', 'All Site Areas'],
};
```

---

### 3.3 RBAC & 통합 결재 데이터베이스 DDL 명세

```sql
CREATE TABLE approval_documents (
    approval_id         BIGSERIAL PRIMARY KEY,
    document_type       VARCHAR(32) NOT NULL CHECK (document_type IN ('PTW', 'WORK_ORDER', 'SHIFT_OVERRIDE', 'MRO_REQ')),
    reference_id        VARCHAR(64) NOT NULL,
    current_step        INT NOT NULL DEFAULT 1,
    total_steps         INT NOT NULL DEFAULT 3,
    overall_status      VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (overall_status IN ('PENDING', 'APPROVED', 'REJECTED', 'DELEGATED', 'CANCELLED')),
    requester_id        VARCHAR(64) NOT NULL,
    title               VARCHAR(255) NOT NULL,
    urgency_level       VARCHAR(20) NOT NULL DEFAULT 'NORMAL' CHECK (urgency_level IN ('NORMAL', 'HIGH', 'CRITICAL_TIME_SENSITIVE')),
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE approval_line_histories (
    history_id             BIGSERIAL PRIMARY KEY,
    approval_id            BIGINT NOT NULL,
    step_number            INT NOT NULL,
    approver_role          VARCHAR(32) NOT NULL CHECK (approver_role IN ('ORIGINATOR', 'HSSE_OFFICER', 'SITE_MANAGER', 'DELEGATED_APPROVER')),
    approver_person_id     VARCHAR(64) NOT NULL,
    action_type            VARCHAR(20) NOT NULL CHECK (action_type IN ('APPROVE', 'REJECT', 'DELEGATE', 'OVERRIDE')),
    digital_signature_hash TEXT NOT NULL,
    ip_address             VARCHAR(45),
    comments               TEXT,
    action_timestamp       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_hist_approval FOREIGN KEY (approval_id) REFERENCES approval_documents(approval_id) ON DELETE RESTRICT
);

CREATE TABLE approval_delegations (
    delegation_id        BIGSERIAL PRIMARY KEY,
    original_approver_id VARCHAR(64) NOT NULL,
    delegate_approver_id VARCHAR(64) NOT NULL,
    start_date           TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date             TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active            BOOLEAN NOT NULL DEFAULT TRUE,
    reason               TEXT NOT NULL,
    created_at           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_delegation_dates CHECK (end_date > start_date)
);

CREATE INDEX idx_app_docs_type_status ON approval_documents(document_type, overall_status);
CREATE INDEX idx_app_hist_app_id ON approval_line_histories(approval_id);
```

---

### 3.3.3 RBAC Session Guard (Auditor Mode) 타입 명세 (`types/rbac.ts`)

> 본 절은 타입 명세만 정의하며, 권한 판정 로직(`resolveEffectivePermission`, `validateApprovalGuardrails`)과 Sector 6 진입점 연동은 별도 승인 후 구현 예정입니다 (§3.1.1 참조).

```typescript
export type RBACRole =
  | 'ORIGINATOR'
  | 'HSSE_OFFICER'
  | 'SITE_MANAGER'
  | 'DELEGATED_APPROVER'
  | 'AUDITOR';

export type SessionAccessMode = 'INTERACTIVE' | 'READ_ONLY_AUDIT';

export interface RBACSessionGuard {
  sessionId: string;
  personId: string;
  role: RBACRole;
  accessMode: SessionAccessMode;
  isAuditorMode: boolean;
  grantedScopes: string[];
  sessionIssuedAt: string;
  sessionExpiresAt: string;
  delegatedFromPersonId?: string | null;
}
```

---

### 3.3.4 role_permissions Seed 데이터 및 Row-Level 제약 한계

role_permissions 테이블은 모듈 단위 최상위 접근 게이트(module-level gate)만 담당한다. 아래 역할은
boolean 컬럼만으로 표현 불가능한 row-level 제약을 가지므로, 애플리케이션 쿼리 레벨에서 별도 필터링이
반드시 병행되어야 한다:
- SITE_MANAGER / ACTING_SITE_MANAGER: can_update=TRUE이나 실제로는 본인이 작성한 건(row)에 한함
  (e.g. `WHERE requester_id = :userId` 이중 검증 필요).
- WORK_LEADER_TECH: can_read=TRUE(WORK_ORDER_DIRECTORY)이나 실제로는 본인에게 할당된 WO(row)에
  한함 (e.g. `WHERE assigned_to = :userId` 이중 검증 필요).

Seed 데이터는 7개 역할(RoleCode) × 11개 모듈(ModuleCode) = 77행 전체를 명시적으로 정의하며,
신규 모듈 추가 시 반드시 7개 역할 전체에 대한 행을 동시에 추가해야 한다
(UNIQUE(role_code, module_code) 제약 준수).

이 매핑은 원본 벤치마킹 자료의 "모듈군" 단위 설명(예: "안전/PTW 모듈", "현장/운영 모듈")을
개별 module_code로 풀어낸 해석적 매핑이며, 축자적 추출(verbatim extraction)이 아니다.
프로덕션 반영 전 프로젝트 오너의 별도 검토를 권장한다.

---

### 3.5 세션/인증 및 로그인 정책 (user_accounts 스키마)

**⚠ 출처 구분 표기**: 아래 세션/인증 수치는 NotebookLM 소스 문서에 **명시적으로 기록되어 있지 않다**
(CMMS_Missing_Items_Source_Extraction.md §1 확인). 소스에서 확인된 사실은 (a) 이메일/비밀번호 기반
로그인, (b) 서버 측 사용자 식별 후 세션 토큰 발급, (c) 비활성 계정 거부(Inactive-account Refusal)
정책의 존재뿐이다. 아래 구체적 수치(타임아웃 시간, MFA 대상, 잠금 조건, 오프라인 재인증 방식)는
**소스 사실이 아니라 ISA-62443 / OWASP ASVS 표준 관행에 기반한 프로젝트 설계 기본값(Engineering
Default)**이며, 추후 실제 운영 정책 확정 시 수정될 수 있는 잠정안임을 명시한다.

**3.5.1 세션 관리 정책 (설계 기본값)**
| 항목 | 값 | 근거 |
|---|---|---|
| 세션 타임아웃 | 30분 무조작(Inactivity) 시 자동 로그아웃 | OWASP ASVS 3.3 (설계 기본값, 소스 미기재) |
| MFA/2FA | HQ_SUPERVISOR_AUDITOR·SITE_MANAGER·ACTING_SITE_MANAGER 필수, 그 외 역할은 OTP/PIN 선택 | ISA-62443 권한 등급별 인증 강도 원칙 (설계 기본값, 소스 미기재) |
| 계정 잠금 | 비밀번호 5회 연속 오류 시 15분 임시 잠금 (Failed Attempt Counter) | OWASP ASVS 2.2 (설계 기본값, 소스 미기재) |
| 오프라인 재인증 | 방폭 태블릿 로컬 암호화 토큰 + 4자리 PIN 로컬 검증 | ATEX Zone 오프라인 운용 특성 반영 (설계 기본값, 소스 미기재) |

**3.5.2 `user_accounts` DDL (신규 설계 — 소스 미기재, §5.4/§5.1 기존 user_id 참조와의 정합성 위해 신규 제안)**
```sql
CREATE TABLE user_accounts (
    user_id              VARCHAR(64) PRIMARY KEY,
    email                VARCHAR(255) NOT NULL UNIQUE,
    password_hash        TEXT NOT NULL,
    role_code             VARCHAR(32) NOT NULL,
    home_location         VARCHAR(10) NOT NULL CHECK (home_location IN ('HQ', 'SITE')),
    mfa_enabled           BOOLEAN NOT NULL DEFAULT FALSE,
    failed_attempt_count  INT NOT NULL DEFAULT 0,
    locked_until          TIMESTAMP WITH TIME ZONE,
    is_active             BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at         TIMESTAMP WITH TIME ZONE,
    created_at            TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_role_code CHECK (role_code IN (
        'SYSTEM_ADMIN','SITE_MANAGER','ACTING_SITE_MANAGER','OPERATION_TEAM_LEADER',
        'HSSE_OFFICER','WORK_LEADER_TECH','HQ_SUPERVISOR_AUDITOR'
    ))
);

CREATE TABLE user_sessions (
    session_id            VARCHAR(128) PRIMARY KEY,
    user_id                VARCHAR(64) NOT NULL,
    issued_at              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at              TIMESTAMP WITH TIME ZONE NOT NULL,
    device_device_id        VARCHAR(100),
    is_offline_reauth       BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES user_accounts(user_id) ON DELETE CASCADE
);
```

본 테이블은 실무 정책 확정 전까지 **잠정 설계**이며, 현재 프론트엔드 `LoginGateway.tsx`의
`DEV NO-AUTH BYPASS ACTIVE` 상태를 이 스키마로 교체하는 마이그레이션은 별도 승인 후 착수한다.

**3.5.4 Phase 1 Quick-Login 시더 및 세션 연동 (2026-09-11 반영)**

`src/db/schema/cmms_schema.sql` / `schema/cmms_schema.sqlite.sql`에 §3.5.2 DDL을
SQLite 방언으로 이식하고, `password_hash`만 `NOT NULL`에서 nullable로 완화했다(그 외
컬럼/제약은 §3.5.2와 동일). `src/db/seeds/002_user_accounts.sql`(및 런타임에서 실제로
쓰이는 TS 미러 `src/lib/rbac/userAccountsSeed.ts` — §3.5.3 `role_permissions`이
`rolePermissionService.ts`로 미러링되는 것과 동일한 이유: 프로젝트에 SQLite 런타임
드라이버가 없어 이 SQL은 문서로만 반영된 상태)에 아래 3행을 시딩했다:

| user_id | 이름 | role_code | home_location | 근거 |
|---|---|---|---|---|
| `BSG259529` | Edi Hermawan | `SITE_MANAGER` | `SITE` | Operation Manpower Roster.csv 7행 실사 확인 |
| `BSG259524` | Shadiq M. Shalih | `OPERATION_TEAM_LEADER` | `SITE` | Operation Manpower Roster.csv 8행 실사 확인 |
| `DEV-HQ-001` | Choi Hong-joon | `SYSTEM_ADMIN` | `HQ` | **로스터 CSV(22개 인력 행)에 매칭 행 없음** — 현장 인력이 아닌 개발자 계정으로 판단, BSG 포맷 대신 명시적 DEV ID 부여 |

⚠ `email` 컬럼은 로스터 CSV에 이메일 데이터가 없어 `<user_id>@dev.nias-lng.local`
형태의 **DEV-ONLY placeholder**를 사용했다 — 실제 이메일이 아니며 프로덕션 전 교체 필요.

`LoginGateway.tsx`는 이 3행을 Quick-Login 카드로 노출하고, 클릭 시
`password_hash` 검증 없이 `src/lib/rbac/activeSessionStore.ts`(신규, DEV-ONLY
in-memory 세션 브리지)에 `{ userId, roleCode, homeLocation }`을 직접 기록한다.
`OverviewCalibrationRoutes.tsx`의 `HQ_DASHBOARD_SESSION_STUB`(Sector 6 HQ Overview
Dashboard 배선, 이전 세션에서 추가)을 이 실제 세션으로 교체해
`resolveEffectivePermission`/`blockIfAuditorMode`가 하드코딩된 스텁이 아닌 선택된
계정의 실제 role/location을 받는다.

// DEV-ONLY: password verification intentionally skipped per Phase 1 simplification — see CMMS_Architecture.md §3.5

---

### 3.6 ISA-101 / SCADA 기반 UI 색상 체계 (scadaStyles.ts 명세)

**3.6.1 확인된 기존 팔레트 (소스 확인됨 — `NIAS_Portal_Full_Context.md`, `LoginGateway.tsx`)**
| 용도 | 값 |
|---|---|
| Time-Critical 경고 / Red Warning | `#EF4444` (Flashing Border) |
| Industrial Classic Gray (프레임) | `#c0c7d0` |
| 타이틀 바 그라데이션 | `linear-gradient(90deg, #002244, #0052a3)` |
| Monitor Box / Sunken Panel | `#d8dee9` |
| Status Badge (Blue) | `#0284c7` |
| Highlight Text (Blue) | `#0369a1` |
| Bevel Button | `#d1d7e0` (Hover `#dbe1ea` / Active `#c3cad4`) |
| Ready Indicator (Green) | `#047857` |

**3.6.2 방폭 태블릿 가독성 기준 (소스 확인됨)**
- 디스플레이 8.0인치 이상, 고휘도(Sunlight-readable)
- Glove-touch / Wet-touch 지원
- 기본 해상도 1920×1065, 반응형 레이아웃
- 다크 모드 제공

**3.6.3 ISA-101 알람 4단계 색상 — ⚠ 설계 기본값 (소스 미기재, 3개 색상은 프로젝트 신규 도입)**
소스에서는 Red(`#EF4444`)만 확인되었고, 나머지 3단계는 ISA-101 표준 관행에 따른 설계 기본값이다.

| Priority | 의미 | 색상 |
|---|---|---|
| 1 (Critical) | 즉시 대응 — LOTO 위반, AGT FAIL, SIMOPS RED | `#EF4444` (소스 확인, 기존 유지) |
| 2 (High) | 긴급 대응 — ALARP No 에스컬레이션, 4hr 가스 타임아웃 | `#F97316` (설계 기본값) |
| 3 (Medium) | 주의 — PM 지연, ROP 미달 발주 | `#EAB308` (설계 기본값) |
| 4 (Low) | 정보성 — 일반 알림 | `#3B82F6` (설계 기본값) |

> **⚠ 설계 충돌 주의**: Priority 4용으로 제안된 `#3B82F6`은 기존 확인된 Status Badge `#0284c7` /
> Highlight `#0369a1`과 같은 계열의 파란색이라 시각적으로 구분이 약할 수 있다. `scadaStyles.ts` 실제
> 반영 시 Priority 4를 기존 Status Badge 색상과 동일 톤으로 통합할지, 별도 색상으로 분리할지는
> **구현 전 추가 확인이 필요**하다 — 이번 라운드에서는 문서에만 반영하고 실제 파일 수정은 보류한다.

---

## 제4장: 정비(Work Order) 관리 및 MRO 공급망 아키텍처

### 4.1 정비 유형 체계 및 PM 스케줄러 엔진
1. **정비 유형**: 예방정비 (PM), 사후/긴급정비 (CM), 상태기반정비 (CBM).
2. **PM 스케줄러 엔진**: Running Hours 누적 또는 Calendar 주기 도달 시 중복 여부 확인 후 자동 WO 발행.

---

### 4.2 CM 결함 보고 및 e-PTW 필수 연동 분기 알고리즘 (Safety Gate)

```typescript
export function evaluateSafetyGateRules(woInput: {
  jobCategories: string[];
  workAreaZone: string;
  equipmentCriticality: string;
  priority: string;
}): { isPtwRequired: boolean; reason: string } {
  const highRiskJobTypes = ['HOT_WORK', 'CONFINED_SPACE', 'HIGH_VOLTAGE', 'CRYOGENIC_LINE_OPENING'];
  const highRiskZones = ['NP09-ZONE-01-ATEX', 'NP09-ZONE-02-FLAMMABLE'];

  if (woInput.jobCategories.some(cat => highRiskJobTypes.includes(cat))) {
    return { isPtwRequired: true, reason: 'Mandatory e-PTW: High-risk job type detected.' };
  }
  if (highRiskZones.includes(woInput.workAreaZone)) {
    return { isPtwRequired: true, reason: 'Mandatory e-PTW: Hazardous ATEX/Flammable area entry.' };
  }
  if (woInput.equipmentCriticality === 'CRITICAL' && (woInput.priority === 'EMERGENCY' || woInput.priority === 'HIGH')) {
    return { isPtwRequired: true, reason: 'Mandatory e-PTW: High priority work on CRITICAL asset.' };
  }
  return { isPtwRequired: false, reason: 'Standard maintenance work. e-PTW not mandatory.' };
}
```

---

### 4.3 MRO 자재 코드 체계 및 Reorder Point (ROP) 자동 계산 알고리즘
- **안전 재고 (SS)**: $SS = Z \times \sigma_d \times \sqrt{LT}$ ($Z = 2.33$)
- **재발주 시점 (ROP)**: $ROP = (D_{avg} \times LT) + SS$
- **트리거**: $(Current Stock + Pending PO) - Reserved WO \le ROP$

---

### 4.4 정비 관리 및 MRO 공급망 데이터베이스 DDL 명세

```sql
CREATE TABLE work_orders (
    wo_number                   VARCHAR(64) PRIMARY KEY,
    equipment_tag               VARCHAR(64) NOT NULL,
    wo_type                     VARCHAR(20) NOT NULL CHECK (wo_type IN ('PM', 'CM', 'CBM')),
    priority                    VARCHAR(20) NOT NULL CHECK (priority IN ('EMERGENCY', 'HIGH', 'MEDIUM', 'LOW')),
    status                      VARCHAR(32) NOT NULL DEFAULT 'DRAFT'
                                CHECK (status IN ('DRAFT', 'APPROVED_SCHEDULED', 'WAITING_PTW', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    title                       VARCHAR(255) NOT NULL,
    description                 TEXT,
    is_ptw_required             BOOLEAN NOT NULL DEFAULT FALSE,
    permit_id                   BIGINT,
    running_hours_at_creation   NUMERIC(12, 2) DEFAULT 0.00,
    scheduled_start_date        TIMESTAMP WITH TIME ZONE,
    scheduled_end_date          TIMESTAMP WITH TIME ZONE,
    actual_start_date           TIMESTAMP WITH TIME ZONE,
    actual_end_date             TIMESTAMP WITH TIME ZONE,
    assigned_leader_id          VARCHAR(64),
    created_at                  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wo_asset FOREIGN KEY (equipment_tag) REFERENCES assets(equipment_tag) ON DELETE RESTRICT,
    CONSTRAINT fk_wo_permit FOREIGN KEY (permit_id) REFERENCES permits(permit_id) ON DELETE RESTRICT
);

CREATE TABLE pm_schedules (
    pm_id                       BIGSERIAL PRIMARY KEY,
    pm_code                     VARCHAR(64) NOT NULL UNIQUE,
    equipment_tag               VARCHAR(64) NOT NULL,
    title                       VARCHAR(255) NOT NULL,
    interval_type               VARCHAR(20) NOT NULL CHECK (interval_type IN ('RUNNING_HOURS', 'CALENDAR')),
    interval_value              INT NOT NULL,
    last_performed_hours        NUMERIC(12, 2) DEFAULT 0.00,
    last_performed_date         DATE,
    next_due_date               DATE,
    is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
    auto_generate_wo            BOOLEAN NOT NULL DEFAULT TRUE,
    created_at                  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pm_asset FOREIGN KEY (equipment_tag) REFERENCES assets(equipment_tag) ON DELETE RESTRICT
);

CREATE TABLE inventory_items (
    impa_code           VARCHAR(12) PRIMARY KEY,
    item_name_en        VARCHAR(255) NOT NULL,
    specification       TEXT,
    unit_of_measure     VARCHAR(20) NOT NULL DEFAULT 'PCS',
    min_stock_level     INT NOT NULL DEFAULT 0,
    reorder_point       INT NOT NULL DEFAULT 5,
    safety_stock        INT NOT NULL DEFAULT 2,
    current_stock       INT NOT NULL DEFAULT 0,
    reserved_stock      INT NOT NULL DEFAULT 0,
    unit_price_usd      NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    storage_location    VARCHAR(100) NOT NULL,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory_ledgers (
    ledger_id           BIGSERIAL PRIMARY KEY,
    impa_code           VARCHAR(12) NOT NULL,
    transaction_type    VARCHAR(20) NOT NULL CHECK (transaction_type IN ('ISSUE', 'RECEIPT', 'ADJUSTMENT', 'RETURN')),
    quantity            INT NOT NULL,
    balance_after       INT NOT NULL,
    reference_wo_number VARCHAR(64),
    unit_price_usd      NUMERIC(12, 2) NOT NULL,
    total_price_usd     NUMERIC(12, 2) GENERATED ALWAYS AS (quantity * unit_price_usd) STORED,
    performed_by        VARCHAR(64) NOT NULL,
    remarks             TEXT,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ledger_item FOREIGN KEY (impa_code) REFERENCES inventory_items(impa_code) ON DELETE RESTRICT
);

CREATE TABLE external_overhauls (
    overhaul_id         BIGSERIAL PRIMARY KEY,
    overhaul_ref_no     VARCHAR(64) NOT NULL UNIQUE,
    equipment_tag       VARCHAR(64) NOT NULL,
    impa_code           VARCHAR(12),
    vendor_name         VARCHAR(150) NOT NULL,
    status              VARCHAR(32) NOT NULL DEFAULT 'DISPATCH_PENDING'
                        CHECK (status IN ('DISPATCH_PENDING', 'IN_TRANSIT_OUT', 'UNDER_REPAIR', 'TESTING_INSPECTION', 'IN_TRANSIT_IN', 'RETURNED_INSTALLED', 'CANCELLED')),
    dispatched_date     DATE NOT NULL,
    expected_return_date DATE NOT NULL,
    actual_return_date  DATE,
    repair_cost_usd     NUMERIC(12, 2) DEFAULT 0.00,
    transport_cost_usd  NUMERIC(12, 2) DEFAULT 0.00,
    scope_of_work       TEXT NOT NULL,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_overhaul_asset FOREIGN KEY (equipment_tag) REFERENCES assets(equipment_tag) ON DELETE RESTRICT
);

CREATE INDEX idx_wo_type_status ON work_orders(wo_type, status);
CREATE INDEX idx_pm_next_due ON pm_schedules(next_due_date) WHERE is_active = TRUE;
CREATE INDEX idx_ledger_impa_created ON inventory_ledgers(impa_code, created_at DESC);
```

---

## 제5장: 시스템 아키텍처, 오프라인 동기화, 시프트 이관 및 고도화 명세

### 5.1 ATEX Zone 1/Zone 2 방폭 태블릿 및 현장 물리 검증 (Physical Proximity Verification)
LOTO 패드락/밸브 부착 방폭 NFC 태그(13.56MHz)를 태깅하고, Haversine GPS Geofencing(허용 반경 < 15m)을 만족해야만 Stage 2/4 진행을 시스템적으로 허용함.

```sql
CREATE TABLE loto_nfc_tags (
    tag_uid             VARCHAR(64) PRIMARY KEY,
    isolation_point_tag VARCHAR(64) NOT NULL,
    tag_type            VARCHAR(20) NOT NULL CHECK (tag_type IN ('NFC_TAG', 'QR_CODE', 'DUAL_NFC_QR')),
    nfc_payload_hash    VARCHAR(128) NOT NULL,
    installed_location  VARCHAR(100) NOT NULL,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_physical_tag_asset FOREIGN KEY (isolation_point_tag) REFERENCES assets(equipment_tag) ON DELETE RESTRICT
);

CREATE TABLE proximity_verification_logs (
    verification_id     BIGSERIAL PRIMARY KEY,
    permit_id           BIGINT NOT NULL,
    loto_mapping_id     BIGINT,
    tag_uid             VARCHAR(64) NOT NULL,
    verifier_id         VARCHAR(64) NOT NULL,
    stage_code          VARCHAR(32) NOT NULL,
    gps_latitude        NUMERIC(10, 8) NOT NULL,
    gps_longitude       NUMERIC(11, 8) NOT NULL,
    distance_to_asset_m NUMERIC(6, 2),
    verification_status VARCHAR(20) NOT NULL CHECK (verification_status IN ('SUCCESS_PASS', 'TAG_MISMATCH', 'GEOFENCE_FAILED', 'INVALID_SIGNATURE')),
    device_device_id    VARCHAR(100) NOT NULL,
    scanned_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_prox_log_permit FOREIGN KEY (permit_id) REFERENCES permits(permit_id) ON DELETE CASCADE
);
```

```typescript
export async function verifyPhysicalProximityGate(payload: {
  permitId: number; tagUid: string; verifierId: string; stageCode: string;
  gpsCoordinates: { latitude: number; longitude: number }; deviceId: string;
}, db: any) {
  const MAX_ALLOWABLE_GEOFENCE_METERS = 15.0;
  const tagRecord = await db.query(
    `SELECT t.isolation_point_tag, a.gps_coordinates FROM loto_nfc_tags t JOIN assets a ON t.isolation_point_tag = a.equipment_tag WHERE t.tag_uid = $1 AND t.is_active = TRUE`,
    [payload.tagUid]
  );
  if (!tagRecord.rows.length) return { status: 'TAG_MISMATCH', message: 'Unregistered NFC tag.' };

  const { isolation_point_tag, gps_coordinates } = tagRecord.rows;
  const [assetLat, assetLon] = gps_coordinates.split(',').map((v: string) => parseFloat(v.trim()));
  
  const R = 6371e3;
  const rad = Math.PI / 180;
  const dLat = (assetLat - payload.gpsCoordinates.latitude) * rad;
  const dLon = (assetLon - payload.gpsCoordinates.longitude) * rad;
  const a = Math.sin(dLat/2)**2 + Math.cos(payload.gpsCoordinates.latitude*rad) * Math.cos(assetLat*rad) * Math.sin(dLon/2)**2;
  const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  if (distance > MAX_ALLOWABLE_GEOFENCE_METERS) {
    return { status: 'GEOFENCE_FAILED', distanceToAssetMeters: distance, message: `Geofence Violation (${distance.toFixed(1)}m > 15m)` };
  }
  return { status: 'SUCCESS_PASS', isolationPointTag: isolation_point_tag, distanceToAssetMeters: distance };
}
```

---

### 5.2 SIMOPS 공간 간섭 제어 알고리즘 (Activity Interaction Matrix)

```typescript
const SIMOPS_INTERACTION_MATRIX: Record<string, Record<string, 'RED' | 'AMBER' | 'GREEN'>> = {
  HOT_WORK: { CARGO_OPERATION: 'RED', HOT_WORK: 'AMBER', COLD_WORK: 'GREEN', HEAVY_LIFTING: 'RED' },
  CARGO_OPERATION: { HOT_WORK: 'RED', CARGO_OPERATION: 'AMBER', COLD_WORK: 'AMBER', HEAVY_LIFTING: 'RED' },
  HEAVY_LIFTING: { HOT_WORK: 'RED', CARGO_OPERATION: 'RED', COLD_WORK: 'AMBER', HEAVY_LIFTING: 'RED' }
};

export async function evaluateSimopsInterference(newCategory: string, workArea: string, equipmentTag: string, db: any) {
  const activePermits = await db('permits')
    .select('ref_no', 'job_category')
    .whereIn('status', ['APPROVED_ISSUED', 'IN_PROGRESS'])
    .andWhere(b => b.where('work_area', workArea).orWhere('equipment_tag', equipmentTag));

  for (const active of activePermits) {
    const risk = SIMOPS_INTERACTION_MATRIX[newCategory]?.[active.job_category] || 'GREEN';
    if (risk === 'RED') {
      return { hasConflict: true, riskLevel: 'RED', actionRequired: 'HARD_BLOCK', message: `SIMOPS Violation: ${newCategory} conflicts with active ${active.job_category} (${active.ref_no}).` };
    }
    if (risk === 'AMBER') {
      return { hasConflict: true, riskLevel: 'AMBER', actionRequired: 'SOFT_ESCALATE', message: `SIMOPS Warning: Secondary JSA and Site Manager approval required.` };
    }
  }
  return { hasConflict: false, riskLevel: 'GREEN', actionRequired: 'PROCEED' };
}
```

---

### 5.3 AGT 가스 측정 4시간 타임아웃 & 시프트 교대 경계 자동 Suspended 엔진

```typescript
import cron from 'node-cron';

cron.schedule('*/5 * * * *', async () => {
  const expired = await db('permits as p')
    .join(db('permit_gas_tests').select('permit_id', db.raw('MAX(tested_at) as tested_at')).groupBy('permit_id').as('g'), 'p.permit_id', 'g.permit_id')
    .where('p.status', 'IN_PROGRESS')
    .andWhere('g.tested_at', '<', db.raw("NOW() - INTERVAL '4 HOURS'"));

  for (const p of expired) {
    await db('permits').where('permit_id', p.permit_id).update({ status: 'SUSPENDED', updated_at: db.fn.now() });
  }
});

cron.schedule('0 7,19 * * *', async () => {
  await db('permits').where('status', 'IN_PROGRESS').update({ status: 'SUSPENDED', updated_at: db.fn.now() });
});
```

---

### 5.4 시프트 교대 이관 (Shift Handover) 워크플로우 & DDL

```sql
CREATE TABLE permit_shift_handovers (
    handover_id             BIGSERIAL PRIMARY KEY,
    permit_id               BIGINT NOT NULL,
    handover_type           VARCHAR(20) NOT NULL CHECK (handover_type IN ('INDIVIDUAL', 'BATCH_SHIFT')),
    authority_type          VARCHAR(30) NOT NULL CHECK (authority_type IN ('ISSUING_AUTHORITY', 'PERFORMING_AUTHORITY', 'BOTH')),
    outgoing_user_id        VARCHAR(64) NOT NULL,
    incoming_user_id        VARCHAR(64) NOT NULL,
    status                  VARCHAR(32) NOT NULL DEFAULT 'HANDOVER_INITIATED'
                            CHECK (status IN ('HANDOVER_INITIATED', 'HANDOVER_VERIFYING', 'HANDOVER_COMPLETED', 'HANDOVER_REJECTED')),
    outgoing_signature      TEXT NOT NULL,
    incoming_signature      TEXT,
    handover_completed_at   TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_handover_permit FOREIGN KEY (permit_id) REFERENCES permits(permit_id) ON DELETE CASCADE
);
```

---

### 5.5 오프라인 우선(Local-First) 동기화 & SHA-256 낙관적 잠금 (Optimistic Locking)

```typescript
import crypto from 'crypto';

export async function processOfflineOptimisticSync(payload: {
  permitId: number; baseVersion: number; localChanges: any; clientDeviceId: string;
}, db: any) {
  return await db.transaction(async (trx) => {
    const server = await trx('permits').where('permit_id', payload.permitId).first();
    
    if (payload.baseVersion === server.version) {
      const nextVer = server.version + 1;
      await trx('permits').where('permit_id', payload.permitId).update({ ...payload.localChanges, version: nextVer, updated_at: db.fn.now() });
      return { success: true, actionTaken: 'APPLIED_CLEAN', newVersion: nextVer };
    }

    const isSafetyOverlap = payload.localChanges.lotoMappings || payload.localChanges.gasTestRecord;
    if (isSafetyOverlap) {
      await trx('permit_sync_conflicts').insert({
        permit_id: payload.permitId, server_version: server.version, client_base_version: payload.baseVersion,
        conflict_payload: JSON.stringify({ server, local: payload.localChanges }), status: 'REQUIRES_SITE_MANAGER_REVIEW'
      });
      return { success: false, actionTaken: 'HUMAN_INTERVENTION_REQUIRED', message: 'Safety-critical overlap detected. Escalated to Site Manager.' };
    }

    const mergedVer = server.version + 1;
    await trx('permits').where('permit_id', payload.permitId).update({ ...server, ...payload.localChanges, version: mergedVer, updated_at: db.fn.now() });
    return { success: true, actionTaken: 'AUTO_MERGED', newVersion: mergedVer };
  });
}
```

---

### 5.6 인도네시아 노동부(Kemnaker K3) / SKK Migas 규정 및 다국어(i18n) DB 아키텍처

```sql
CREATE TABLE i18n_lexicons (
    lexicon_key         VARCHAR(100) PRIMARY KEY,
    category            VARCHAR(50) NOT NULL CHECK (category IN ('FORM_FIELD', 'PPE', 'PRECAUTION', 'RISK_LEVEL', 'STATUS')),
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE i18n_translations (
    translation_id      BIGSERIAL PRIMARY KEY,
    lexicon_key         VARCHAR(100) NOT NULL,
    lang_code           VARCHAR(5) NOT NULL CHECK (lang_code IN ('id', 'en', 'ko')),
    translation_text    TEXT NOT NULL,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_trans_lexicon FOREIGN KEY (lexicon_key) REFERENCES i18n_lexicons(lexicon_key) ON DELETE CASCADE,
    CONSTRAINT uq_lexicon_lang UNIQUE (lexicon_key, lang_code)
);

CREATE TABLE ppe_items (
    ppe_code            VARCHAR(50) PRIMARY KEY,
    lexicon_key         VARCHAR(100) NOT NULL,
    is_mandatory_global BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_ppe_lexicon FOREIGN KEY (lexicon_key) REFERENCES i18n_lexicons(lexicon_key)
);

CREATE TABLE permit_ppe_mappings (
    mapping_id          BIGSERIAL PRIMARY KEY,
    permit_id           BIGINT NOT NULL,
    ppe_code            VARCHAR(50) NOT NULL,
    is_checked          BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_perm_ppe_permit FOREIGN KEY (permit_id) REFERENCES permits(permit_id) ON DELETE CASCADE,
    CONSTRAINT fk_perm_ppe_item FOREIGN KEY (ppe_code) REFERENCES ppe_items(ppe_code)
);
```

```json
{
  "\$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "MultilingualPermitDocument",
  "type": "object",
  "required": ["permitId", "refNo", "equipmentTag", "workTitleI18n", "ppeItems"],
  "properties": {
    "permitId": { "type": "integer" },
    "refNo": { "type": "string" },
    "equipmentTag": { "type": "string" },
    "workTitleI18n": {
      "type": "object",
      "required": ["id", "en", "ko"],
      "properties": {
        "id": { "type": "string" },
        "en": { "type": "string" },
        "ko": { "type": "string" }
      }
    },
    "ppeItems": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["ppeCode", "isChecked", "labelI18n"],
        "properties": {
          "ppeCode": { "type": "string" },
          "isChecked": { "type": "boolean" },
          "labelI18n": {
            "type": "object",
            "required": ["id", "en", "ko"],
            "properties": { "id": { "type": "string" }, "en": { "type": "string" }, "ko": { "type": "string" } }
          }
        }
      }
    }
  }
}
```
