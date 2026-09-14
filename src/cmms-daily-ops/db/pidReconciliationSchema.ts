// src/cmms-daily-ops/db/pidReconciliationSchema.ts
//
// PURPOSE
//   Phase 12 Stage A — (1) Live P&ID 태그 좌표/별칭 2개 테이블 +
//   (2) 월간 ISO Tank 재고정산(data map Answer C, 신규 도메인) 1개 테이블 DDL.
//   truckingSchema.ts와 동일한 컨벤션.
//
//   SEED DATA 보류: 원본 지시는 AAV-102/103/105/106 좌표 시딩을 요구했으나,
//   JSK concept diagram 원본 이미지(1316x924px)가 저장소에 없어 실제 픽셀
//   좌표를 알 수 없다 — 값을 지어내면(fabricate) 잘못된 위치가 "calibrated"
//   여부와 무관하게 화면에 그려져 현장 오인으로 이어질 수 있으므로, 이 커밋은
//   테이블 구조만 생성하고 INSERT 시드는 넣지 않는다. HJ가 다이어그램 파일 또는
//   실제 x,y 값을 제공하면 별도 커밋으로 시딩한다(lng-process-data-map.md §5
//   미해결 항목과 동일한 성격의 보류).
//
//   pid_tag_aliases.source_document는 원 지시에서 "e.g." 예시로만 주어져
//   전체 값 목록이 아니므로 CHECK 제약을 걸지 않았다 — 향후 다른 출처 문서명이
//   추가되어도 스키마 변경 없이 수용하기 위함.

import type { DatabaseSync } from 'node:sqlite';

export const PID_TAG_COORDINATES_DDL = `
  CREATE TABLE IF NOT EXISTS pid_tag_coordinates (
      tag_id       TEXT PRIMARY KEY,
      x            REAL NOT NULL,
      y            REAL NOT NULL,
      calibrated   INTEGER NOT NULL DEFAULT 0,
      notes        TEXT
  );
`;

export const PID_TAG_ALIASES_DDL = `
  CREATE TABLE IF NOT EXISTS pid_tag_aliases (
      canonical_tag_id   TEXT NOT NULL,
      alias_tag_id       TEXT NOT NULL,
      source_document    TEXT NOT NULL,
      PRIMARY KEY (canonical_tag_id, alias_tag_id)
  );
`;

// data map Answer C: Stock Awal/Akhir/Balance 개념은 SettlementLedgerEntry에도
// 없는 신규 도메인 — ALTER 대상 없음. 필드명은 SettlementLedgerEntry의 기존
// 영문 컨벤션(delivered/consumed/losses)을 따르고 xlsx 원문의 인도네시아어
// 용어(Awal/Akhir)는 컬럼명에 쓰지 않는다(data map §5 항목 #7).
export const MONTHLY_ISOTANK_RECONCILIATION_DDL = `
  CREATE TABLE IF NOT EXISTS monthly_isotank_reconciliation (
      id                     INTEGER PRIMARY KEY AUTOINCREMENT,
      iso_tank_no            TEXT NOT NULL,
      serial_no              TEXT NOT NULL,
      shipment               TEXT NOT NULL,
      report_month           TEXT NOT NULL,
      opening_weight_kg      REAL,
      heating_value_btu_kg   REAL,
      opening_stock_m3       REAL,
      opening_stock_kg       REAL,
      closing_stock_m3       REAL,
      closing_stock_kg       REAL,
      net_consumed_m3        REAL,
      consumed_kg            REAL,
      consumed_mmbtu         REAL,
      closing_weight_kg      REAL,
      density_kg_m3          REAL,
      losses_kg              REAL,
      losses_pct             REAL,
      stock_balance_m3       REAL,
      remarks                TEXT,
      UNIQUE(iso_tank_no, report_month)
  );
  CREATE INDEX IF NOT EXISTS idx_monthly_isotank_recon_tank_month ON monthly_isotank_reconciliation(iso_tank_no, report_month DESC);
`;

/** pid_tag_coordinates + pid_tag_aliases + monthly_isotank_reconciliation을 멱등 보강한다. */
export function ensurePidReconciliationSchema(raw: DatabaseSync): void {
  raw.exec(PID_TAG_COORDINATES_DDL);
  raw.exec(PID_TAG_ALIASES_DDL);
  raw.exec(MONTHLY_ISOTANK_RECONCILIATION_DDL);
}
