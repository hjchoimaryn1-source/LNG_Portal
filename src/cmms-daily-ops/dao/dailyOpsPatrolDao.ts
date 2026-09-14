// src/cmms-daily-ops/dao/dailyOpsPatrolDao.ts
//
// PURPOSE
//   daily_ops_patrol_entries에 대한 도메인-비특정(domain-agnostic) 순수 DAO.
//   SqlExecutor에만 의존하며 React/Next 바인딩이 없다 (truckInspectionDao.ts와 동일 패턴).
//
//   UPSERT 주의: Stage A DDL(dailyOpsPatrolSchema.ts)에는 (domain, equipment_tag,
//   report_date, shift_time_slot) UNIQUE 제약이 없다(인덱스만 존재) — SQLite
//   ON CONFLICT를 쓰려면 스키마에 UNIQUE 제약을 추가해야 하는데, 이는 CLAUDE.md
//   §5 ALTER-only 정책상 12-step rebuild가 필요해 HJ 확인 없이는 불가하다.
//   따라서 이 DAO는 SELECT로 기존 행을 먼저 찾고 UPDATE/INSERT를 분기하는
//   앱 레벨 upsert로 구현한다.
//
//   컬럼 화이트리스트: values의 키(컬럼명)는 동적 SQL 텍스트에 그대로
//   들어가므로, patrolFieldMaps.ts의 PATROL_FIELD_MAP에 없는 키는 즉시 거부한다.

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import type { PatrolDomain, ReadingStatus, ShiftTimeSlot } from '../types/patrolLog';
import { PATROL_FIELD_MAP } from './patrolFieldMaps';

export type PatrolFieldValue = number | string | null;
export type PatrolValues = Record<string, PatrolFieldValue>;

export interface PatrolEntry {
  id: number;
  domain: PatrolDomain;
  equipmentTag: string;
  reportDate: string;
  shiftTimeSlot: ShiftTimeSlot;
  readingStatus: ReadingStatus;
  remarkText: string | null;
  recordedBy: string;
  recordedAt: string;
  values: PatrolValues;
}

interface PatrolEntryRow {
  id: number;
  domain: PatrolDomain;
  equipment_tag: string;
  report_date: string;
  shift_time_slot: ShiftTimeSlot;
  reading_status: ReadingStatus;
  remark_text: string | null;
  recorded_by: string;
  recorded_at: string;
  [column: string]: unknown;
}

const SELECT_ID_SQL = `
  SELECT id FROM daily_ops_patrol_entries
  WHERE domain = @domain AND equipment_tag = @equipmentTag
    AND report_date = @reportDate AND shift_time_slot = @shiftTimeSlot
`;

const SELECT_ENTRIES_SQL = `
  SELECT * FROM daily_ops_patrol_entries
  WHERE domain = @domain AND equipment_tag = @equipmentTag AND report_date = @reportDate
  ORDER BY shift_time_slot ASC
`;

const SELECT_LATEST_SQL = `
  SELECT * FROM daily_ops_patrol_entries
  WHERE domain = @domain AND equipment_tag = @equipmentTag
  ORDER BY report_date DESC, shift_time_slot DESC
  LIMIT 1
`;

// (domain, equipment_tag)별 최신 1행만 — B3(DailyOpsDataContext)가 마운트 시
// Live P&ID 스토어(B2)를 DB의 마지막 저장값으로 채우는 데 쓴다.
const SELECT_ALL_LATEST_SQL = `
  SELECT * FROM (
    SELECT *, ROW_NUMBER() OVER (
      PARTITION BY domain, equipment_tag
      ORDER BY report_date DESC, shift_time_slot DESC
    ) AS rn
    FROM daily_ops_patrol_entries
  ) WHERE rn = 1
`;

function assertKnownColumns(domain: PatrolDomain, values: PatrolValues): void {
  const known = new Set(PATROL_FIELD_MAP[domain].map((f) => f.columnName));
  for (const columnName of Object.keys(values)) {
    if (!known.has(columnName)) {
      throw new Error(`Unknown patrol column "${columnName}" for domain "${domain}"`);
    }
  }
}

function rowToEntry(row: PatrolEntryRow, domain: PatrolDomain): PatrolEntry {
  const values: PatrolValues = {};
  for (const field of PATROL_FIELD_MAP[domain]) {
    values[field.columnName] = (row[field.columnName] as PatrolFieldValue) ?? null;
  }
  return {
    id: row.id,
    domain: row.domain,
    equipmentTag: row.equipment_tag,
    reportDate: row.report_date,
    shiftTimeSlot: row.shift_time_slot,
    readingStatus: row.reading_status,
    remarkText: row.remark_text,
    recordedBy: row.recorded_by,
    recordedAt: row.recorded_at,
    values,
  };
}

/** (domain, equipmentTag, reportDate, shiftTimeSlot) 키로 upsert한다. */
export function insertPatrolEntry(
  db: SqlExecutor,
  domain: PatrolDomain,
  equipmentTag: string,
  reportDate: string,
  shiftTimeSlot: ShiftTimeSlot,
  values: PatrolValues,
  readingStatus: ReadingStatus,
  remarkText: string | null,
  recordedBy: string
): void {
  assertKnownColumns(domain, values);
  const recordedAt = new Date().toISOString();
  const keyParams = { domain, equipmentTag, reportDate, shiftTimeSlot };
  const existing = db.get<{ id: number }>(SELECT_ID_SQL, keyParams);
  const columnNames = Object.keys(values);

  if (existing) {
    const valueSetClause = columnNames.map((c) => `${c} = @${c}`).join(', ');
    const sql = `
      UPDATE daily_ops_patrol_entries
      SET reading_status = @readingStatus, remark_text = @remarkText,
          recorded_by = @recordedBy, recorded_at = @recordedAt
          ${valueSetClause ? ', ' + valueSetClause : ''}
      WHERE id = @id
    `;
    db.run(sql, { ...values, id: existing.id, readingStatus, remarkText, recordedBy, recordedAt });
    return;
  }

  const insertColumns = [
    'domain',
    'equipment_tag',
    'report_date',
    'shift_time_slot',
    'reading_status',
    'remark_text',
    'recorded_by',
    'recorded_at',
    ...columnNames,
  ];
  const insertPlaceholders = [
    '@domain',
    '@equipmentTag',
    '@reportDate',
    '@shiftTimeSlot',
    '@readingStatus',
    '@remarkText',
    '@recordedBy',
    '@recordedAt',
    ...columnNames.map((c) => `@${c}`),
  ];
  const sql = `
    INSERT INTO daily_ops_patrol_entries (${insertColumns.join(', ')})
    VALUES (${insertPlaceholders.join(', ')})
  `;
  db.run(sql, {
    ...values,
    domain,
    equipmentTag,
    reportDate,
    shiftTimeSlot,
    readingStatus,
    remarkText,
    recordedBy,
    recordedAt,
  });
}

/** 특정 (domain, equipmentTag, reportDate)의 전체 슬롯(최대 6개) 조회 */
export function getPatrolEntries(
  db: SqlExecutor,
  domain: PatrolDomain,
  equipmentTag: string,
  reportDate: string
): PatrolEntry[] {
  return db
    .all<PatrolEntryRow>(SELECT_ENTRIES_SQL, { domain, equipmentTag, reportDate })
    .map((row) => rowToEntry(row, domain));
}

/** 전체 날짜/슬롯을 통틀어 가장 최근 값 1건 — Live P&ID(B2)와 Stage C 스냅샷이 사용 */
export function getLatestPatrolValue(
  db: SqlExecutor,
  domain: PatrolDomain,
  equipmentTag: string
): PatrolEntry | undefined {
  const row = db.get<PatrolEntryRow>(SELECT_LATEST_SQL, { domain, equipmentTag });
  return row ? rowToEntry(row, domain) : undefined;
}

/** (domain, equipmentTag)마다 가장 최근 값 1건씩, 테이블 전체 — B3 초기 로드가 사용 */
export function getAllLatestPatrolValues(db: SqlExecutor): PatrolEntry[] {
  return db.all<PatrolEntryRow>(SELECT_ALL_LATEST_SQL).map((row) => rowToEntry(row, row.domain));
}
