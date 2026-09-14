// src/cmms-environment/db/environmentSchema.ts
//
// PURPOSE
//   NP-10 환경관리/폐기물관리 모듈 전용 DDL. src/adapters/db/cmmsDbSingleton.ts와
//   동일한 "CREATE TABLE IF NOT EXISTS + executor.raw.exec()" 컨벤션을 따르되,
//   싱글턴 파일 자체는 건드리지 않는다 (Phase 11a Stage 1에서 트럭킹 모듈에
//   적용된 것과 동일한 하드 바운더리 원칙 — src/cmms-trucking/db/truckingSchema.ts
//   참고).
//
//   Chapter 1(환경 모니터링 4개 테이블) + Chapter 2(폐기물 관리 2개 테이블).
//   NP10-01~04 양식(Aspect 식별/개선계획/Aspect 보고/마스터 체크리스트)은
//   Stage 1 범위 밖이며 이 파일에 스키마를 추가하지 않는다.
//
//   회귀 규제기준값(오탈황 등)은 여기 스키마에 포함하지 않는다 — standard_ref는
//   표시용 참조 문자열일 뿐, PASS/FAIL 자동판정 엔진은 이 Stage에서 만들지
//   않는다 (Global Constraint #6).

import type { DatabaseSync } from 'node:sqlite';

// --- Chapter 1: Environmental Monitoring ---------------------------------

export const ENV_AIR_QUALITY_LOGS_DDL = `
  CREATE TABLE IF NOT EXISTS env_air_quality_logs (
      log_id       INTEGER PRIMARY KEY AUTOINCREMENT,
      log_date     TEXT NOT NULL,
      so2_ugm3     REAL,
      nox_ugm3     REAL,
      co_ugm3      REAL,
      pm10_ugm3    REAL,
      status       TEXT CHECK (status IN ('PASS', 'FAIL', 'PENDING_REVIEW')),
      recorded_by  TEXT,
      created_at   TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE INDEX IF NOT EXISTS idx_env_air_date ON env_air_quality_logs(log_date DESC);
`;

export const ENV_WASTEWATER_LOGS_DDL = `
  CREATE TABLE IF NOT EXISTS env_wastewater_logs (
      log_id           INTEGER PRIMARY KEY AUTOINCREMENT,
      log_date         TEXT NOT NULL,
      sample_point     TEXT NOT NULL,
      parameter        TEXT NOT NULL,
      unit             TEXT NOT NULL,
      standard_ref     TEXT,
      measured_result  REAL NOT NULL,
      status           TEXT CHECK (status IN ('PASS', 'FAIL', 'PENDING_REVIEW')),
      recorded_by      TEXT,
      created_at       TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE INDEX IF NOT EXISTS idx_env_wastewater_date ON env_wastewater_logs(log_date DESC, sample_point);
`;

export const ENV_NOISE_LOGS_DDL = `
  CREATE TABLE IF NOT EXISTS env_noise_logs (
      log_id       INTEGER PRIMARY KEY AUTOINCREMENT,
      log_date     TEXT NOT NULL,
      location     TEXT NOT NULL,
      reading_dba  REAL NOT NULL,
      status       TEXT CHECK (status IN ('PASS', 'FAIL', 'PENDING_REVIEW')),
      recorded_by  TEXT,
      created_at   TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE INDEX IF NOT EXISTS idx_env_noise_date ON env_noise_logs(log_date DESC, location);
`;

export const ENV_SEAWATER_LOGS_DDL = `
  CREATE TABLE IF NOT EXISTS env_seawater_logs (
      log_id         INTEGER PRIMARY KEY AUTOINCREMENT,
      log_date       TEXT NOT NULL,
      location       TEXT NOT NULL,
      do_mgl         REAL,
      salinity_ppt   REAL,
      turbidity_ntu  REAL,
      recorded_by    TEXT,
      created_at     TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE INDEX IF NOT EXISTS idx_env_seawater_date ON env_seawater_logs(log_date DESC, location);
`;

// --- Chapter 2: Waste Management ------------------------------------------

export const ENV_WASTE_TRANSFER_LOGS_DDL = `
  CREATE TABLE IF NOT EXISTS env_waste_transfer_logs (
      transfer_id        INTEGER PRIMARY KEY AUTOINCREMENT,
      transfer_date      TEXT NOT NULL,
      waste_category     TEXT NOT NULL CHECK (waste_category IN ('HAZARDOUS', 'NON_HAZARDOUS')),
      waste_type         TEXT NOT NULL,
      source_department  TEXT NOT NULL,
      quantity_kg        REAL NOT NULL,
      disposal_method    TEXT NOT NULL,
      transported_to     TEXT,
      pic_signature      TEXT,
      created_at         TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE INDEX IF NOT EXISTS idx_env_waste_transfer_date ON env_waste_transfer_logs(transfer_date DESC, waste_category);
`;

export const ENV_THWS_INVENTORY_DDL = `
  CREATE TABLE IF NOT EXISTS env_thws_inventory (
      thws_id            INTEGER PRIMARY KEY AUTOINCREMENT,
      waste_code         TEXT NOT NULL,
      waste_description  TEXT NOT NULL,
      quantity_kg        REAL NOT NULL,
      storage_in_date    TEXT NOT NULL,
      disposal_due_date  TEXT NOT NULL,
      status             TEXT NOT NULL DEFAULT 'IN_STORAGE' CHECK (status IN ('IN_STORAGE', 'DISPOSED', 'OVERDUE')),
      handler_pic        TEXT,
      created_at         TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE INDEX IF NOT EXISTS idx_env_thws_due ON env_thws_inventory(disposal_due_date, status);
`;

/**
 * NP-10 환경/폐기물 모듈 6개 테이블을 멱등(idempotent)하게 보강한다.
 * 호출부: environmentDbSingleton.ts의 getEnvironmentDb()에서만 호출된다.
 * cmmsDbSingleton.ts는 이 함수를 알지 못하며 수정되지 않는다.
 */
export function ensureEnvironmentSchema(raw: DatabaseSync): void {
  raw.exec(ENV_AIR_QUALITY_LOGS_DDL);
  raw.exec(ENV_WASTEWATER_LOGS_DDL);
  raw.exec(ENV_NOISE_LOGS_DDL);
  raw.exec(ENV_SEAWATER_LOGS_DDL);
  raw.exec(ENV_WASTE_TRANSFER_LOGS_DDL);
  raw.exec(ENV_THWS_INVENTORY_DDL);
}
