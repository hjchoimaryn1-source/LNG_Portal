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
  /** 폼 라벨 (한국어) */
  label: string;
  /** 단위 표기 — 텍스트/상태 필드는 빈 문자열 */
  unit: string;
}

export const PATROL_FIELD_MAP: Record<PatrolDomain, PatrolFieldSpec[]> = {
  metering_train_a: [
    { columnName: 'press_barg', label: '압력', unit: 'barg' },
    { columnName: 'temp_c', label: '온도', unit: '°C' },
    { columnName: 'line_dens_kg_m3', label: '라인 밀도', unit: 'kg/m³' },
    { columnName: 'ghv', label: 'GHV', unit: 'BTU/SCF' },
    { columnName: 'diff_pressure_transmitter_inh2o', label: '차압 트랜스미터', unit: 'inH2O' },
    { columnName: 'volume_flowrate_mmscfd', label: '체적 유량', unit: 'MMSCFD' },
    { columnName: 'energy_flowrate_mmbtud', label: '에너지 유량', unit: 'MMBTUD' },
    { columnName: 'volume_total_mmcf', label: '누적 체적', unit: 'MMCF' },
    { columnName: 'energy_total_mmbtu', label: '누적 에너지', unit: 'MMBTU' },
  ],
  metering_train_b: [
    { columnName: 'press_barg', label: '압력', unit: 'barg' },
    { columnName: 'temp_c', label: '온도', unit: '°C' },
    { columnName: 'line_dens_kg_m3', label: '라인 밀도', unit: 'kg/m³' },
    { columnName: 'ghv', label: 'GHV', unit: 'BTU/SCF' },
    { columnName: 'diff_pressure_transmitter_inh2o', label: '차압 트랜스미터', unit: 'inH2O' },
    { columnName: 'volume_flowrate_mmscfd', label: '체적 유량', unit: 'MMSCFD' },
    { columnName: 'energy_flowrate_mmbtud', label: '에너지 유량', unit: 'MMBTUD' },
    { columnName: 'volume_total_mmcf', label: '누적 체적', unit: 'MMCF' },
    { columnName: 'energy_total_mmbtu', label: '누적 에너지', unit: 'MMBTU' },
  ],
  aav: [
    { columnName: 'pressure_gauge_us_bar', label: '압력계 (US)', unit: 'bar' },
    { columnName: 'pressure_transmitter_us_bar', label: '압력 트랜스미터 (US)', unit: 'bar' },
    { columnName: 'temperature_gauge_us_c', label: '온도계 (US)', unit: '°C' },
    { columnName: 'temperature_transmitter_us_c', label: '온도 트랜스미터 (US)', unit: '°C' },
    { columnName: 'pressure_gauge_ds_bar', label: '압력계 (DS)', unit: 'bar' },
    { columnName: 'pressure_transmitter_ds_bar', label: '압력 트랜스미터 (DS)', unit: 'bar' },
    { columnName: 'temperature_gauge_ds_c', label: '온도계 (DS)', unit: '°C' },
    { columnName: 'temperature_transmitter_ds_c', label: '온도 트랜스미터 (DS)', unit: '°C' },
  ],
  n2_skid: [
    { columnName: 'cylinder_pressure_bar', label: '실린더 압력', unit: 'bar' },
    { columnName: 'cylinder_status', label: '상태', unit: '' },
  ],
  gc: [
    { columnName: 'gc_analyzer_status', label: '분석기 상태', unit: '' },
    { columnName: 'active_alarm', label: '활성 알람', unit: '' },
    { columnName: 'calibration_gas_cylinder_id', label: '교정 가스 실린더 ID', unit: '' },
    { columnName: 'last_calibration_at', label: '최근 교정 일시', unit: '' },
    { columnName: 'mol_methane', label: 'Methane', unit: '% mol' },
    { columnName: 'mol_ethane', label: 'Ethane', unit: '% mol' },
    { columnName: 'mol_propane', label: 'Propane', unit: '% mol' },
    { columnName: 'mol_ibutane', label: 'i-Butane', unit: '% mol' },
    { columnName: 'mol_nbutane', label: 'n-Butane', unit: '% mol' },
    { columnName: 'mol_ipentane', label: 'i-Pentane', unit: '% mol' },
    { columnName: 'mol_npentane', label: 'n-Pentane', unit: '% mol' },
    { columnName: 'mol_hexane', label: 'Hexane', unit: '% mol' },
    { columnName: 'mol_nitrogen', label: 'Nitrogen', unit: '% mol' },
    { columnName: 'mol_h2o_ppm', label: 'H2O', unit: 'ppm' },
    { columnName: 'mol_h2s_ppm', label: 'H2S', unit: 'ppm' },
  ],
  electrical: [
    { columnName: 'status_text', label: '상태', unit: '' },
    { columnName: 'bus_voltage', label: '모선 전압', unit: 'V' },
    { columnName: 'total_load_current_a', label: '전체 부하 전류', unit: 'A' },
    { columnName: 'room_temperature_c', label: '실내 온도', unit: '°C' },
    { columnName: 'oil_temperature_c', label: '유온', unit: '°C' },
    { columnName: 'winding_temperature_c', label: '권선 온도', unit: '°C' },
    { columnName: 'oil_level_text', label: '유면', unit: '' },
    { columnName: 'battery_capacity_pct', label: '배터리 용량', unit: '%' },
    { columnName: 'ups_load_pct', label: 'UPS 부하율', unit: '%' },
  ],
  // ISO Tank UI는 Stage B 범위 밖(NiasActiveBayWorkspace.tsx 기존 구현 유지) —
  // 매니페스트는 완전성을 위해 스키마 컬럼만 등록해 둔다.
  iso_tank_unloading_skid: [
    { columnName: 'level_iot_pct', label: 'IoT 레벨', unit: '%' },
    { columnName: 'level_gauge_mmh2o', label: '게이지 레벨', unit: 'mmH2O' },
    { columnName: 'volume_m3', label: '체적', unit: 'm³' },
    { columnName: 'battery_iot_pct', label: 'IoT 배터리', unit: '%' },
    { columnName: 'pressure_mpa', label: '압력', unit: 'MPa' },
    { columnName: 'temperature_c', label: '온도', unit: '°C' },
  ],
  iso_tank_cargo: [
    { columnName: 'level_iot_pct', label: 'IoT 레벨', unit: '%' },
    { columnName: 'level_gauge_mmh2o', label: '게이지 레벨', unit: 'mmH2O' },
    { columnName: 'volume_m3', label: '체적', unit: 'm³' },
    { columnName: 'battery_iot_pct', label: 'IoT 배터리', unit: '%' },
    { columnName: 'pressure_mpa', label: '압력', unit: 'MPa' },
    { columnName: 'temperature_c', label: '온도', unit: '°C' },
  ],
};
