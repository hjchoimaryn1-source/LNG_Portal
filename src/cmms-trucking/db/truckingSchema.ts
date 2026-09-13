// src/cmms-trucking/db/truckingSchema.ts
//
// PURPOSE
//   NP-03 트럭킹/차량 검사 모듈 전용 DDL. src/adapters/db/cmmsDbSingleton.ts와
//   동일한 "CREATE TABLE IF NOT EXISTS + executor.raw.exec()" 컨벤션을 따르되,
//   싱글턴 파일 자체는 건드리지 않는다 (Phase 11a Stage 1 하드 바운더리).
//
//   cmmsDbSingleton.ts의 getCmmsDb()는 DDL 상수를 순차 실행하는 고정 목록
//   구조이며, 외부 모듈이 자기 자신을 등록할 수 있는 확장 지점(플러그인 배열 등)이
//   없다. 따라서 이 파일은 getCmmsDb()에서 자동으로 호출되지 않는다 — 실제 배선은
//   HJ 승인 후 별도 커밋으로 진행한다 (phase11a-signoff-summary.md 참조).

import type { DatabaseSync } from 'node:sqlite';

export const TRUCK_INSPECTIONS_DDL = `
  CREATE TABLE IF NOT EXISTS truck_inspections (
      inspection_id    INTEGER PRIMARY KEY AUTOINCREMENT,
      inspection_date  TEXT NOT NULL,
      driver           TEXT NOT NULL,
      vehicle_no       TEXT NOT NULL,
      iso_tank_no      TEXT,
      inspection_type  TEXT NOT NULL CHECK (inspection_type IN ('PRE_OP', 'PERIODIC', 'POST_TRANSIT', 'VEHICLE_SECURITY')),
      form_code        TEXT NOT NULL CHECK (form_code IN ('NP03-02', 'NP03-06', 'NP03-11', 'NP03-13', 'NP03-15')),
      status           TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED')),
      checked_by       TEXT NOT NULL,
      created_at       TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE INDEX IF NOT EXISTS idx_truck_insp_vehicle ON truck_inspections(vehicle_no, inspection_date DESC);
  CREATE INDEX IF NOT EXISTS idx_truck_insp_type ON truck_inspections(inspection_type, created_at DESC);
`;

export const TRUCK_INSPECTION_ITEMS_DDL = `
  CREATE TABLE IF NOT EXISTS truck_inspection_items (
      item_id        INTEGER PRIMARY KEY AUTOINCREMENT,
      inspection_id  INTEGER NOT NULL,
      item_label     TEXT NOT NULL,
      criteria       TEXT,
      status         TEXT NOT NULL CHECK (status IN ('OK', 'NOT_OK', 'NA')),
      remarks        TEXT,
      CONSTRAINT fk_item_inspection FOREIGN KEY (inspection_id) REFERENCES truck_inspections(inspection_id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_truck_item_inspection ON truck_inspection_items(inspection_id);
`;

// NP03-09 Incident & Violation Log. location 컬럼은 NP-03.md 원문 표의 "Location"
// 열을 그대로 반영한 것이며 스펙에 없던 항목을 임의로 추가한 것이 아니다.
export const TRUCK_INCIDENT_LOG_DDL = `
  CREATE TABLE IF NOT EXISTS truck_incident_log (
      incident_id    INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_date  TEXT NOT NULL,
      driver         TEXT NOT NULL,
      vehicle_no     TEXT NOT NULL,
      incident_type  TEXT NOT NULL CHECK (incident_type IN ('Speeding', 'Unsafe Parking', 'Route Deviation', 'Accident', 'Near Miss')),
      description    TEXT NOT NULL,
      location       TEXT,
      action_taken   TEXT NOT NULL,
      follow_up      TEXT NOT NULL,
      verified_by    TEXT NOT NULL,
      created_at     TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE INDEX IF NOT EXISTS idx_truck_incident_vehicle ON truck_incident_log(vehicle_no, incident_date DESC);
`;

/**
 * 트럭킹 모듈 3개 테이블을 멱등(idempotent)하게 보강한다.
 * 호출부: 현재 어디에서도 자동 호출되지 않음. cmmsDbSingleton.ts에 배선하려면
 * getCmmsDb() 안에 `ensureTruckingSchema(executor.raw)` 한 줄을 추가해야 하며,
 * 이는 하드 바운더리 파일 수정이므로 HJ 승인 후 별도 커밋으로 진행한다.
 */
export function ensureTruckingSchema(raw: DatabaseSync): void {
  raw.exec(TRUCK_INSPECTIONS_DDL);
  raw.exec(TRUCK_INSPECTION_ITEMS_DDL);
  raw.exec(TRUCK_INCIDENT_LOG_DDL);
}
