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
  /** 폼 라벨 (한국어) — 인쇄본(FORM-NP-08-33-N, PrintFieldGrid)이 그대로 사용 */
  label: string;
  /** B1 입력 폼 전용 축약 라벨 — 없으면 PatrolFieldInput이 label로 폴백. 인쇄본은 절대 참조하지 않음. */
  shortLabel?: string;
  /** 단위 표기 — 텍스트/상태 필드는 빈 문자열 */
  unit: string;
  /** DDL 컬럼 타입(REAL→'number', TEXT→'text') — B1 폼의 입력 컨트롤 선택에 사용 */
  type: 'number' | 'text';
}

export const PATROL_FIELD_MAP: Record<PatrolDomain, PatrolFieldSpec[]> = {
  metering_train_a: [
    { columnName: 'press_barg', label: '압력', unit: 'barg', type: 'number' },
    { columnName: 'temp_c', label: '온도', unit: '°C', type: 'number' },
    { columnName: 'line_dens_kg_m3', label: '라인 밀도', shortLabel: '밀도', unit: 'kg/m³', type: 'number' },
    { columnName: 'ghv', label: 'GHV', unit: 'BTU/SCF', type: 'number' },
    { columnName: 'diff_pressure_transmitter_inh2o', label: '차압 트랜스미터', shortLabel: '차압', unit: 'inH2O', type: 'number' },
    { columnName: 'volume_flowrate_mmscfd', label: '체적 유량', unit: 'MMSCFD', type: 'number' },
    { columnName: 'energy_flowrate_mmbtud', label: '에너지 유량', unit: 'MMBTUD', type: 'number' },
    { columnName: 'volume_total_mmcf', label: '누적 체적', unit: 'MMCF', type: 'number' },
    { columnName: 'energy_total_mmbtu', label: '누적 에너지', unit: 'MMBTU', type: 'number' },
  ],
  metering_train_b: [
    { columnName: 'press_barg', label: '압력', unit: 'barg', type: 'number' },
    { columnName: 'temp_c', label: '온도', unit: '°C', type: 'number' },
    { columnName: 'line_dens_kg_m3', label: '라인 밀도', shortLabel: '밀도', unit: 'kg/m³', type: 'number' },
    { columnName: 'ghv', label: 'GHV', unit: 'BTU/SCF', type: 'number' },
    { columnName: 'diff_pressure_transmitter_inh2o', label: '차압 트랜스미터', shortLabel: '차압', unit: 'inH2O', type: 'number' },
    { columnName: 'volume_flowrate_mmscfd', label: '체적 유량', unit: 'MMSCFD', type: 'number' },
    { columnName: 'energy_flowrate_mmbtud', label: '에너지 유량', unit: 'MMBTUD', type: 'number' },
    { columnName: 'volume_total_mmcf', label: '누적 체적', unit: 'MMCF', type: 'number' },
    { columnName: 'energy_total_mmbtu', label: '누적 에너지', unit: 'MMBTU', type: 'number' },
  ],
  aav: [
    { columnName: 'pressure_gauge_us_bar', label: '압력계 (US)', shortLabel: 'US 압력', unit: 'bar', type: 'number' },
    { columnName: 'pressure_transmitter_us_bar', label: '압력 트랜스미터 (US)', shortLabel: 'US 트랜스미터', unit: 'bar', type: 'number' },
    { columnName: 'temperature_gauge_us_c', label: '온도계 (US)', shortLabel: 'US 온도', unit: '°C', type: 'number' },
    { columnName: 'temperature_transmitter_us_c', label: '온도 트랜스미터 (US)', shortLabel: 'US 온도(TX)', unit: '°C', type: 'number' },
    { columnName: 'pressure_gauge_ds_bar', label: '압력계 (DS)', shortLabel: 'DS 압력', unit: 'bar', type: 'number' },
    { columnName: 'pressure_transmitter_ds_bar', label: '압력 트랜스미터 (DS)', shortLabel: 'DS 트랜스미터', unit: 'bar', type: 'number' },
    { columnName: 'temperature_gauge_ds_c', label: '온도계 (DS)', shortLabel: 'DS 온도', unit: '°C', type: 'number' },
    { columnName: 'temperature_transmitter_ds_c', label: '온도 트랜스미터 (DS)', shortLabel: 'DS 온도(TX)', unit: '°C', type: 'number' },
    // Stage E-4 — Inlet Vaporizer DP (DPIA-01C/D, DPI-01E/F), 순수 append.
    { columnName: 'differential_pressure_us_barg', label: '차압 (Inlet)', shortLabel: '차압', unit: 'barg', type: 'number' },
  ],
  n2_skid: [
    { columnName: 'cylinder_pressure_bar', label: '실린더 압력', shortLabel: '압력', unit: 'bar', type: 'number' },
    { columnName: 'cylinder_status', label: '상태', unit: '', type: 'text' },
  ],
  gc: [
    { columnName: 'gc_analyzer_status', label: '분석기 상태', shortLabel: '상태', unit: '', type: 'text' },
    { columnName: 'active_alarm', label: '활성 알람', shortLabel: '알람', unit: '', type: 'text' },
    { columnName: 'calibration_gas_cylinder_id', label: '교정 가스 실린더 ID', shortLabel: 'GASCAL ID', unit: '', type: 'text' },
    { columnName: 'last_calibration_at', label: '최근 교정 일시', shortLabel: '교정 일시', unit: '', type: 'text' },
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
    { columnName: 'gascal_pressure_bar', label: 'GASCAL 압력 (Current)', shortLabel: 'GASCAL 압력', unit: 'bar', type: 'number' },
    { columnName: 'gascal_consumption_bar_day', label: 'GASCAL 소비량 (Daily)', shortLabel: 'GASCAL 사용량', unit: 'bar/day', type: 'number' },
    { columnName: 'gascal_cylinder_online', label: 'GASCAL 실린더 #1 (Online)', shortLabel: 'GASCAL 실린더(Online)', unit: '', type: 'text' },
    { columnName: 'gascal_cylinder_spare', label: 'GASCAL 실린더 (Spare)', shortLabel: 'GASCAL 실린더(Spare)', unit: '', type: 'text' },
    { columnName: 'helium_pressure_bar', label: 'Helium 압력 (Current)', shortLabel: 'He 압력', unit: 'bar', type: 'number' },
    { columnName: 'helium_consumption_bar_day', label: 'Helium 소비량 (Daily)', shortLabel: 'He 사용량', unit: 'bar/day', type: 'number' },
    { columnName: 'helium_cylinder_online', label: 'Helium 실린더 (Online)', shortLabel: 'He 실린더(Online)', unit: '', type: 'text' },
    { columnName: 'helium_cylinder_spare', label: 'Helium 실린더 (Spare)', shortLabel: 'He 실린더(Spare)', unit: '', type: 'text' },
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
    { columnName: 'level_iot_pct', label: 'IoT 레벨', unit: '%', type: 'number' },
    { columnName: 'level_gauge_mmh2o', label: '게이지 레벨', unit: 'mmH2O', type: 'number' },
    { columnName: 'volume_m3', label: '체적', unit: 'm³', type: 'number' },
    { columnName: 'battery_iot_pct', label: 'IoT 배터리', unit: '%', type: 'number' },
    { columnName: 'pressure_mpa', label: '압력', unit: 'MPa', type: 'number' },
    { columnName: 'temperature_c', label: '온도', unit: '°C', type: 'number' },
  ],
  iso_tank_cargo: [
    { columnName: 'level_iot_pct', label: 'IoT 레벨', unit: '%', type: 'number' },
    { columnName: 'level_gauge_mmh2o', label: '게이지 레벨', unit: 'mmH2O', type: 'number' },
    { columnName: 'volume_m3', label: '체적', unit: 'm³', type: 'number' },
    { columnName: 'battery_iot_pct', label: 'IoT 배터리', unit: '%', type: 'number' },
    { columnName: 'pressure_mpa', label: '압력', unit: 'MPa', type: 'number' },
    { columnName: 'temperature_c', label: '온도', unit: '°C', type: 'number' },
  ],
  // NG Buffer Tank V-101 (2 fields, FORM-NP-08-40 NP08-40-3 매핑) — 현장 게이지(PI-07A)와
  // 제어실 트랜스미터(PT-07A) 1페어. pms-master-specification.md §NG Buffer Tank가 두
  // 계기를 상호 대조 검증 대상으로 명시 — PT-07B 등 2번째 트랜스미터는 근거자료에 없다.
  ng_buffer_tank: [
    { columnName: 'pressure_gauge_barg', label: '압력계 (PI-07A)', unit: 'barg', type: 'number' },
    { columnName: 'pressure_transmitter_barg', label: '압력 트랜스미터 (PT-07A)', unit: 'barg', type: 'number' },
  ],
};
