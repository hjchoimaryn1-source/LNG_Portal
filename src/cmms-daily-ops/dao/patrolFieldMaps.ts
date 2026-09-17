// src/cmms-daily-ops/dao/patrolFieldMaps.ts
//
// PURPOSE
//   PatrolDomain별 daily_ops_patrol_entries 컬럼 매니페스트 (config, DAO 로직 아님).
//   B1 폼 컴포넌트가 컬럼 목록을 하드코딩하지 않고 이 파일만 참조하도록 해서,
//   현물 서식 재검증 시 한 곳만 고치면 되게 한다. 컬럼명은
//   dailyOpsPatrolSchema.ts DDL과 정확히 일치해야 한다.

import type { PatrolDomain } from '../types/patrolLog';

export interface PatrolFieldSpec {
  /** daily_ops_patrol_entries 실제 컬럼명 */
  columnName: string;
  /** 인쇄본(FORM-NP-08-33-N, PrintFieldGrid)이 그대로 사용하는 라벨 — 원본 확인된
   *  필드는 스캔 원문 영문 wording, 미확인(GAP/AMBIGUOUS) 필드는 기존 한국어 유지. */
  label: string;
  /** B1 입력 폼 전용 한국어 축약 라벨 — 없으면 PatrolFieldInput이 label로 폴백.
   *  인쇄본은 절대 참조하지 않음(UI는 한국어, 인쇄는 영문 원본을 유지하기 위한 분리). */
  shortLabel?: string;
  /** 단위 표기 — 텍스트/상태 필드는 빈 문자열 */
  unit: string;
  /** DDL 컬럼 타입(REAL→'number', TEXT→'text') — B1 폼의 입력 컨트롤 선택에 사용 */
  type: 'number' | 'text';
  /** true면 인쇄본(PrintFieldGrid)에서만 제외 — B1 폼 입력은 그대로 유지.
   *  스캔 원문에 대응 행이 없는 필드(예: metering line_dens_kg_m3/ghv)에 사용. */
  printExclude?: boolean;
}

export const PATROL_FIELD_MAP: Record<PatrolDomain, PatrolFieldSpec[]> = {
  metering_train_a: [
    { columnName: 'press_barg', label: 'Pressure Gauge U/S Metering', shortLabel: '압력', unit: 'barg', type: 'number' },
    { columnName: 'temp_c', label: 'Temperature Gauge', shortLabel: '온도', unit: '°C', type: 'number' },
    // GAP: FORM-NP-08-33-N Metering Train A/B 섹션 스캔 원문에 Line Density 행 없음 — 한국어
    // 라벨 유지 + printExclude(HJ 승인, 인쇄 제외/폼 입력은 그대로 유지).
    { columnName: 'line_dens_kg_m3', label: '라인 밀도', shortLabel: '밀도', unit: 'kg/m³', type: 'number', printExclude: true },
    // GAP: 동일 스캔 섹션에 GHV 행 없음(NP-08 SOP 텍스트에는 개념 언급 있으나 이 서식엔 없음)
    // — 한국어 라벨 유지 + printExclude(HJ 승인, 인쇄 제외/폼 입력은 그대로 유지).
    { columnName: 'ghv', label: 'GHV', unit: 'BTU/SCF', type: 'number', printExclude: true },
    { columnName: 'diff_pressure_transmitter_inh2o', label: 'Diff. Pressure Transmitter', shortLabel: '차압', unit: 'inH2O', type: 'number' },
    { columnName: 'volume_flowrate_mmscfd', label: 'Volume Flowrate', shortLabel: '체적 유량', unit: 'MMSCFD', type: 'number' },
    { columnName: 'energy_flowrate_mmbtud', label: 'Energy Flowrate', shortLabel: '에너지 유량', unit: 'MMBTUD', type: 'number' },
    { columnName: 'volume_total_mmcf', label: 'Volume Total', shortLabel: '누적 체적', unit: 'MMCF', type: 'number' },
    { columnName: 'energy_total_mmbtu', label: 'Energy Total', shortLabel: '누적 에너지', unit: 'MMBTU', type: 'number' },
  ],
  metering_train_b: [
    { columnName: 'press_barg', label: 'Pressure Gauge U/S Metering', shortLabel: '압력', unit: 'barg', type: 'number' },
    { columnName: 'temp_c', label: 'Temperature Gauge', shortLabel: '온도', unit: '°C', type: 'number' },
    // GAP: FORM-NP-08-33-N Metering Train A/B 섹션 스캔 원문에 Line Density 행 없음 — 한국어
    // 라벨 유지 + printExclude(HJ 승인, 인쇄 제외/폼 입력은 그대로 유지).
    { columnName: 'line_dens_kg_m3', label: '라인 밀도', shortLabel: '밀도', unit: 'kg/m³', type: 'number', printExclude: true },
    // GAP: 동일 스캔 섹션에 GHV 행 없음(NP-08 SOP 텍스트에는 개념 언급 있으나 이 서식엔 없음)
    // — 한국어 라벨 유지 + printExclude(HJ 승인, 인쇄 제외/폼 입력은 그대로 유지).
    { columnName: 'ghv', label: 'GHV', unit: 'BTU/SCF', type: 'number', printExclude: true },
    { columnName: 'diff_pressure_transmitter_inh2o', label: 'Diff. Pressure Transmitter', shortLabel: '차압', unit: 'inH2O', type: 'number' },
    { columnName: 'volume_flowrate_mmscfd', label: 'Volume Flowrate', shortLabel: '체적 유량', unit: 'MMSCFD', type: 'number' },
    { columnName: 'energy_flowrate_mmbtud', label: 'Energy Flowrate', shortLabel: '에너지 유량', unit: 'MMBTUD', type: 'number' },
    { columnName: 'volume_total_mmcf', label: 'Volume Total', shortLabel: '누적 체적', unit: 'MMCF', type: 'number' },
    { columnName: 'energy_total_mmbtu', label: 'Energy Total', shortLabel: '누적 에너지', unit: 'MMBTU', type: 'number' },
  ],
  aav: [
    { columnName: 'pressure_gauge_us_bar', label: 'Pressure Gauge U/S', shortLabel: 'US 압력', unit: 'bar', type: 'number' },
    { columnName: 'pressure_transmitter_us_bar', label: 'Pressure Transmitter U/S', shortLabel: 'US 트랜스미터', unit: 'bar', type: 'number' },
    { columnName: 'temperature_gauge_us_c', label: 'Temperature Gauge U/S', shortLabel: 'US 온도', unit: '°C', type: 'number' },
    { columnName: 'temperature_transmitter_us_c', label: 'Temperature Transmitter U/S', shortLabel: 'US 온도(TX)', unit: '°C', type: 'number' },
    { columnName: 'pressure_gauge_ds_bar', label: 'Pressure Gauge D/S', shortLabel: 'DS 압력', unit: 'bar', type: 'number' },
    { columnName: 'pressure_transmitter_ds_bar', label: 'Pressure Transmitter D/S', shortLabel: 'DS 트랜스미터', unit: 'bar', type: 'number' },
    { columnName: 'temperature_gauge_ds_c', label: 'Temperature Gauge D/S', shortLabel: 'DS 온도', unit: '°C', type: 'number' },
    { columnName: 'temperature_transmitter_ds_c', label: 'Temperature Transmitter D/S', shortLabel: 'DS 온도(TX)', unit: '°C', type: 'number' },
    // Stage E-4 — Inlet Vaporizer DP (DPIA-01C/D, DPI-01E/F), 순수 append.
    // FORM-NP-08-33-N 스캔 원문 AAV 섹션엔 없는 필드(원본 8필드 밖 추가)이나, HJ 승인으로
    // 인쇄에 포함한다 — label은 원문 대응 없어 주변 AAV 8필드 명명 규칙("Pressure/Temperature
    // Gauge|Transmitter U/S|D/S")에 맞춰 제안한 표기.
    { columnName: 'differential_pressure_us_barg', label: 'Differential Pressure U/S', shortLabel: '차압', unit: 'barg', type: 'number' },
  ],
  n2_skid: [
    { columnName: 'cylinder_pressure_bar', label: 'Pressure Cylinder', shortLabel: '압력', unit: 'bar', type: 'number' },
    { columnName: 'cylinder_status', label: 'Status', shortLabel: '상태', unit: '', type: 'text' },
  ],
  gc: [
    { columnName: 'gc_analyzer_status', label: 'GC Analyzer Status', shortLabel: '상태', unit: '', type: 'text' },
    { columnName: 'active_alarm', label: 'Active Alarm / Warning', shortLabel: '알람', unit: '', type: 'text' },
    { columnName: 'calibration_gas_cylinder_id', label: 'Calibration Gas Cylinder ID', shortLabel: 'GASCAL ID', unit: '', type: 'text' },
    { columnName: 'last_calibration_at', label: 'Last Calibration', shortLabel: '교정 일시', unit: '', type: 'text' },
    { columnName: 'mol_methane', label: 'Methane', unit: '% mol', type: 'number' },
    { columnName: 'mol_ethane', label: 'Ethane', unit: '% mol', type: 'number' },
    { columnName: 'mol_propane', label: 'Propane', unit: '% mol', type: 'number' },
    { columnName: 'mol_ibutane', label: 'i-Butane', unit: '% mol', type: 'number' },
    { columnName: 'mol_nbutane', label: 'n-Butane', unit: '% mol', type: 'number' },
    { columnName: 'mol_ipentane', label: 'i-Pentane', unit: '% mol', type: 'number' },
    { columnName: 'mol_npentane', label: 'n-Pentane', unit: '% mol', type: 'number' },
    { columnName: 'mol_hexane', label: 'Hexane', unit: '% mol', type: 'number' },
    { columnName: 'mol_nitrogen', label: 'Nitrogen', unit: '% mol', type: 'number' },
    { columnName: 'mol_h2o_ppm', label: 'H2O', unit: 'ppm', type: 'number' },
    { columnName: 'mol_h2s_ppm', label: 'H2S', unit: 'ppm', type: 'number' },
    // Stage E-5 — Calibration Gas(GASCAL) + Carrier Gas(Helium), 순수 append.
    { columnName: 'gascal_pressure_bar', label: 'Cal. Gas Pressure (Current)', shortLabel: 'GASCAL 압력', unit: 'bar', type: 'number' },
    { columnName: 'gascal_consumption_bar_day', label: 'Cal. Gas Consumption (Daily)', shortLabel: 'GASCAL 사용량', unit: 'bar/day', type: 'number' },
    { columnName: 'gascal_cylinder_online', label: 'Gascal Cylinder #1 (Online)', shortLabel: 'GASCAL 실린더(Online)', unit: '', type: 'text' },
    { columnName: 'gascal_cylinder_spare', label: 'Gascal Cylinder (Spare)', shortLabel: 'GASCAL 실린더(Spare)', unit: '', type: 'text' },
    { columnName: 'helium_pressure_bar', label: 'Helium Gas Pressure (Current)', shortLabel: 'He 압력', unit: 'bar', type: 'number' },
    { columnName: 'helium_consumption_bar_day', label: 'Helium Gas Consumption (Daily)', shortLabel: 'He 사용량', unit: 'bar/day', type: 'number' },
    { columnName: 'helium_cylinder_online', label: 'Helium Cylinder (Online)', shortLabel: 'He 실린더(Online)', unit: '', type: 'text' },
    { columnName: 'helium_cylinder_spare', label: 'Helium Cylinder (Spare)', shortLabel: 'He 실린더(Spare)', unit: '', type: 'text' },
  ],
  electrical: [
    { columnName: 'status_text', label: '상태', unit: '', type: 'text' },
    { columnName: 'bus_voltage', label: '모선 전압', unit: 'V', type: 'number' },
    { columnName: 'total_load_current_a', label: '전체 부하 전류', unit: 'A', type: 'number' },
    { columnName: 'room_temperature_c', label: '실내 온도', unit: '°C', type: 'number' },
    { columnName: 'oil_temperature_c', label: '유온', unit: '°C', type: 'number' },
    { columnName: 'winding_temperature_c', label: '권선 온도', unit: '°C', type: 'number' },
    { columnName: 'oil_level_text', label: '유면', unit: '', type: 'text' },
    { columnName: 'battery_capacity_pct', label: '배터리 용량', unit: '%', type: 'number' },
    { columnName: 'ups_load_pct', label: 'UPS 부하율', unit: '%', type: 'number' },
  ],
  // Unloading Skid(T-201~204)는 IsoTankUnloadingSkidPatrolForm.tsx(4-HR PATROL LOG
  // 4번째 서브탭)로 라이브 저장 연결됨 — NiasActiveBayWorkspace.tsx는 별개
  // PortalDataContext/DailyMasterRecord 기반 탱크야드 워크플로우라 이 도메인과 무관.
  // iso_tank_cargo(하기 항목)는 여전히 폼 미구현 상태.
  iso_tank_unloading_skid: [
    { columnName: 'level_iot_pct', label: 'Level IOT', shortLabel: 'IoT 레벨', unit: '%', type: 'number' },
    { columnName: 'level_gauge_mmh2o', label: 'Level Gauge', shortLabel: '게이지 레벨', unit: 'mmH2O', type: 'number' },
    { columnName: 'volume_m3', label: 'Volume', shortLabel: '체적', unit: 'm³', type: 'number' },
    { columnName: 'battery_iot_pct', label: 'Battery IOT', shortLabel: 'IoT 배터리', unit: '%', type: 'number' },
    { columnName: 'pressure_mpa', label: 'Pressure', shortLabel: '압력', unit: 'MPa', type: 'number' },
    { columnName: 'temperature_c', label: 'Temperature', shortLabel: '온도', unit: '°C', type: 'number' },
  ],
  iso_tank_cargo: [
    { columnName: 'level_iot_pct', label: 'Level IOT', shortLabel: 'IoT 레벨', unit: '%', type: 'number' },
    { columnName: 'level_gauge_mmh2o', label: 'Level Gauge', shortLabel: '게이지 레벨', unit: 'mmH2O', type: 'number' },
    { columnName: 'volume_m3', label: 'Volume', shortLabel: '체적', unit: 'm³', type: 'number' },
    { columnName: 'battery_iot_pct', label: 'Battery IOT', shortLabel: 'IoT 배터리', unit: '%', type: 'number' },
    { columnName: 'pressure_mpa', label: 'Pressure', shortLabel: '압력', unit: 'MPa', type: 'number' },
    { columnName: 'temperature_c', label: 'Temperature', shortLabel: '온도', unit: '°C', type: 'number' },
  ],
  // NG Buffer Tank V-101 (2 fields, FORM-NP-08-40 NP08-40-3 매핑) — 현장 게이지(PI-07A)와
  // 제어실 트랜스미터(PT-07A) 1페어. pms-master-specification.md §NG Buffer Tank가 두
  // 계기를 상호 대조 검증 대상으로 명시 — PT-07B 등 2번째 트랜스미터는 근거자료에 없다.
  // 스캔 원문엔 "Pressure" 1행만 있으나(HJ 승인) 현장 게이지 판독값(PI-07A)에 매핑하고,
  // 두 번째 계기(PT-07A)는 AAV/Metering의 "Pressure Transmitter" 명명 규칙을 따라 확장.
  ng_buffer_tank: [
    { columnName: 'pressure_gauge_barg', label: 'Pressure', shortLabel: '압력계 (PI-07A)', unit: 'barg', type: 'number' },
    { columnName: 'pressure_transmitter_barg', label: 'Pressure Transmitter', shortLabel: '압력 트랜스미터 (PT-07A)', unit: 'barg', type: 'number' },
  ],
};
