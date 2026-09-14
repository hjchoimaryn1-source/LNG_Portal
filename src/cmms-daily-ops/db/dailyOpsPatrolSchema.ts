// src/cmms-daily-ops/db/dailyOpsPatrolSchema.ts
//
// PURPOSE
//   Phase 12 Stage A — daily_ops_patrol_entries 단일 테이블 DDL.
//   src/cmms-trucking/db/truckingSchema.ts와 동일한
//   "CREATE TABLE IF NOT EXISTS + executor.raw.exec()" 컨벤션을 따르되,
//   cmmsDbSingleton.ts 자체는 건드리지 않는다(하드 바운더리, dailyOpsDbSingleton.ts
//   에서 같은 연결 위에 보강한다).
//
//   컬럼 설계: 도메인(PatrolDomain)당 필드 수가 적고(≤15) 고정적이라는
//   lng-process-data-map.md §4 판단에 따라 JSON 대신 nullable 정규화 컬럼을
//   선택했다 — DAO 조회/타입을 단순하게 유지하기 위함. 각 도메인은 자신의
//   컬럼 그룹만 채우고 나머지는 NULL로 남긴다.

import type { DatabaseSync } from 'node:sqlite';

export const DAILY_OPS_PATROL_ENTRIES_DDL = `
  CREATE TABLE IF NOT EXISTS daily_ops_patrol_entries (
      id                                INTEGER PRIMARY KEY AUTOINCREMENT,
      domain                            TEXT NOT NULL CHECK (domain IN (
          'metering_train_a', 'metering_train_b', 'aav', 'n2_skid', 'gc',
          'electrical', 'iso_tank_unloading_skid', 'iso_tank_cargo'
      )),
      equipment_tag                     TEXT NOT NULL,
      report_date                       TEXT NOT NULL,
      shift_time_slot                   TEXT NOT NULL CHECK (shift_time_slot IN (
          '00:00', '04:00', '08:00', '12:00', '16:00', '20:00'
      )),
      reading_status                    TEXT NOT NULL DEFAULT 'normal' CHECK (reading_status IN (
          'normal', 'no_reading', 'progress_order', 'low_pressure_warning', 'other'
      )),
      remark_text                       TEXT,
      recorded_by                       TEXT NOT NULL,
      recorded_at                       TEXT NOT NULL,
      created_at                        TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now')),

      -- AAV (8 fields, FORM-NP-08-33-N p2 매핑)
      pressure_gauge_us_bar             REAL,
      pressure_transmitter_us_bar       REAL,
      temperature_gauge_us_c            REAL,
      temperature_transmitter_us_c      REAL,
      pressure_gauge_ds_bar             REAL,
      pressure_transmitter_ds_bar       REAL,
      temperature_gauge_ds_c            REAL,
      temperature_transmitter_ds_c      REAL,

      -- Metering Train A/B (11 fields, FORM-NP-08-33-N p1 매핑 — 필드명/단위는
      -- data map Answer A에 따라 GasQualityMasterRecord 컨벤션을 재사용)
      diff_pressure_transmitter_inh2o   REAL,
      pressure_transmitter_bar          REAL,
      temperature_gauge_c               REAL,
      press_barg                        REAL,
      temp_c                            REAL,
      line_dens_kg_m3                   REAL,
      ghv                               REAL,
      volume_flowrate_mmscfd            REAL,
      energy_flowrate_mmbtud            REAL,
      volume_total_mmcf                 REAL,
      energy_total_mmbtu                REAL,

      -- N2 Skid (2 fields, FORM-NP-08-33-N p4 매핑)
      cylinder_pressure_bar             REAL,
      cylinder_status                   TEXT,

      -- ISO Tank Unloading Skid + Cargo (6 fields, FORM-NP-08-33-N p2/p3 매핑)
      level_iot_pct                     REAL,
      level_gauge_mmh2o                 REAL,
      volume_m3                         REAL,
      battery_iot_pct                   REAL,
      pressure_mpa                      REAL,
      temperature_c                     REAL,

      -- Electrical (9 fields, FORM-NP-08-33-N p4 매핑)
      status_text                       TEXT,
      bus_voltage                       REAL,
      total_load_current_a              REAL,
      room_temperature_c                REAL,
      oil_temperature_c                 REAL,
      winding_temperature_c             REAL,
      oil_level_text                    TEXT,
      battery_capacity_pct              REAL,
      ups_load_pct                      REAL,

      -- GC (15 fields, FORM-NP-08-33-N p1 매핑)
      gc_analyzer_status                TEXT,
      active_alarm                      TEXT,
      calibration_gas_cylinder_id       TEXT,
      last_calibration_at               TEXT,
      mol_methane                       REAL,
      mol_ethane                        REAL,
      mol_propane                       REAL,
      mol_ibutane                       REAL,
      mol_nbutane                       REAL,
      mol_ipentane                      REAL,
      mol_npentane                      REAL,
      mol_hexane                        REAL,
      mol_nitrogen                      REAL,
      mol_h2o_ppm                       REAL,
      mol_h2s_ppm                       REAL
  );
  CREATE INDEX IF NOT EXISTS idx_daily_ops_patrol_domain_tag_date
      ON daily_ops_patrol_entries(domain, equipment_tag, report_date DESC, shift_time_slot DESC);

  -- Phase 12 Addendum 1: Stage B 배포 당시 이 UNIQUE 인덱스가 없어
  -- dailyOpsPatrolDao.ts가 SELECT→UPDATE/INSERT 앱 레벨 upsert로 우회했다
  -- (deviation #1). CREATE TABLE 컬럼 정의는 건드리지 않는 순수 추가 문이며
  -- 테이블 재생성이 필요 없다 — ALTER-only 정책과 무관.
  CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_ops_patrol_unique
      ON daily_ops_patrol_entries(domain, equipment_tag, report_date, shift_time_slot);
`;

/** daily_ops_patrol_entries 테이블을 멱등(idempotent)하게 보강한다. */
export function ensureDailyOpsPatrolSchema(raw: DatabaseSync): void {
  raw.exec(DAILY_OPS_PATROL_ENTRIES_DDL);
}
