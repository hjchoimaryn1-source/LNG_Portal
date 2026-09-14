// src/cmms-daily-ops/dao/dailyReportSnapshotDao.ts
//
// PURPOSE
//   daily_report_snapshots 조회(Stage B0 스텁) + 생성/확정(Stage C1) DAO.
//
//   generateSnapshot: 8개 PatrolDomain 중 iso_tank_cargo를 뺀 7개
//   (PATROL_EQUIPMENT_TAGS_BY_DOMAIN — iso_tank_cargo는 순찰 폼이 없어
//   태그를 알 수 없으므로 지어내지 않고 제외, deviation note 참고)의
//   장비 태그마다 getLatestPatrolValue()로 "가장 최신 타임슬롯" 값을 가져와
//   도메인의 전체 필드(대표 컬럼 1개가 아니라 PATROL_FIELD_MAP 전체)를
//   snapshot_payload JSON에 얼린다. STATION TOTAL은 Metering Train A/B
//   합산값(PDF p1 규칙)이며, MSCF 표시가 필요한 값은 unitConversion.ts의
//   mscfFromMmcf()로 변환한다. report_date는 UNIQUE라 ON CONFLICT upsert가
//   안전하다(pid_tag_coordinates와 동일한 이유 — ALTER-only 정책과 무관).
//   is_finalized=true인 리포트는 재생성을 거부하고 명시적 에러 결과를
//   반환한다(서명 완료본을 조용히 덮어쓰지 않기 위함) — UI가 이 결과를
//   확인 프롬프트로 보여줄 수 있게 throw 대신 result 타입을 쓴다.
//
//   Phase 12 Pre-Flight III 결정(옵션 a): DRAFT -> SUBMITTED -> APPROVED
//   status 컬럼(dailyReportSchema.ts, ALTER TABLE) 도입에 따라 isFinalized는
//   더 이상 raw is_finalized 컬럼을 신뢰하지 않고 `status === 'APPROVED'`의
//   계산된 값으로 취급한다(rowToSnapshot 참고) — is_finalized 물리 컬럼은
//   ALTER-only 정책상 제거하지 않고 레거시로 남긴다.
//   finalizeSnapshot()은 기존 호출부(daily-report-signatures/route.ts,
//   "양쪽 서명 완료" 트리거)를 그대로 유지하되, 의미가 DRAFT->SUBMITTED로
//   바뀐다 — 최종 승인(APPROVED)은 dailyReportApprovalDao.ts의
//   approveSnapshot()(Site Manager 전용)이 별도로 수행한다. Stage C 기존
//   동작(양쪽 서명 = 최종 잠금)을 변경하는 deviation이며 HJ 승인 하에 진행.

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import { getLatestPatrolValue, type PatrolValues } from './dailyOpsPatrolDao';
import { PATROL_EQUIPMENT_TAGS_BY_DOMAIN, METERING_EQUIPMENT_TAGS } from './patrolEquipmentTags';
import { mscfFromMmcf } from './unitConversion';
import type { PatrolDomain } from '../types/patrolLog';

export type DailyReportStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED';

export interface DailyReportSnapshot {
  id: number;
  reportDate: string;
  generatedAt: string;
  generatedBy: string;
  snapshotPayload: string;
  status: DailyReportStatus;
  /** Computed alias of `status === 'APPROVED'` — does not read the legacy is_finalized column. */
  isFinalized: boolean;
}

/** domains[domain][equipmentTag] — 해당 태그의 최신 순찰값 전체 필드, 기록이 없으면 null. */
export type SnapshotDomainValues = Partial<Record<PatrolDomain, Record<string, PatrolValues | null>>>;

export interface DailyReportStationTotal {
  volumeFlowrateMmscfd: number;
  energyFlowrateMmbtud: number;
  volumeTotalMmcf: number;
  volumeTotalMscf: number;
  energyTotalMmbtu: number;
}

export interface DailyReportSnapshotPayload {
  reportDate: string;
  generatedAt: string;
  generatedBy: string;
  domains: SnapshotDomainValues;
  stationTotal: DailyReportStationTotal;
}

export type GenerateSnapshotResult =
  | { success: true; snapshot: DailyReportSnapshot; payload: DailyReportSnapshotPayload }
  | { success: false; error: string; existing: DailyReportSnapshot };

interface DailyReportSnapshotRow {
  id: number;
  report_date: string;
  generated_at: string;
  generated_by: string;
  snapshot_payload: string;
  is_finalized: number;
  status: DailyReportStatus;
}

const SELECT_BY_DATE_SQL = `SELECT * FROM daily_report_snapshots WHERE report_date = @reportDate`;
const SELECT_RECENT_SQL = `SELECT * FROM daily_report_snapshots ORDER BY report_date DESC LIMIT @limit`;

function rowToSnapshot(row: DailyReportSnapshotRow): DailyReportSnapshot {
  return {
    id: row.id,
    reportDate: row.report_date,
    generatedAt: row.generated_at,
    generatedBy: row.generated_by,
    snapshotPayload: row.snapshot_payload,
    status: row.status,
    isFinalized: row.status === 'APPROVED',
  };
}

/** report_date 1건 조회 — 존재 여부로 "이미 확정된 리포트인지" 판단에 사용 */
export function getSnapshot(db: SqlExecutor, reportDate: string): DailyReportSnapshot | undefined {
  const row = db.get<DailyReportSnapshotRow>(SELECT_BY_DATE_SQL, { reportDate });
  return row ? rowToSnapshot(row) : undefined;
}

/** 최근 N건 조회 (기본 10건) */
export function listRecentSnapshots(db: SqlExecutor, limit = 10): DailyReportSnapshot[] {
  return db.all<DailyReportSnapshotRow>(SELECT_RECENT_SQL, { limit }).map(rowToSnapshot);
}

const UPSERT_SNAPSHOT_SQL = `
  INSERT INTO daily_report_snapshots (report_date, generated_at, generated_by, snapshot_payload, is_finalized)
  VALUES (@reportDate, @generatedAt, @generatedBy, @snapshotPayload, 0)
  ON CONFLICT(report_date) DO UPDATE SET
    generated_at = @generatedAt, generated_by = @generatedBy, snapshot_payload = @snapshotPayload
`;

// "Finalize" here means both signatures complete -> ready for Site Manager review
// (DRAFT -> SUBMITTED), not final approval. See file header comment.
const FINALIZE_SQL = `UPDATE daily_report_snapshots SET status = 'SUBMITTED' WHERE id = @id AND status = 'DRAFT'`;

function numericValue(values: PatrolValues | null, columnName: string): number {
  if (!values) return 0;
  const v = values[columnName];
  return typeof v === 'number' ? v : 0;
}

function buildStationTotal(domains: SnapshotDomainValues): DailyReportStationTotal {
  const trainA = domains.metering_train_a?.[METERING_EQUIPMENT_TAGS[0]] ?? null;
  const trainB = domains.metering_train_b?.[METERING_EQUIPMENT_TAGS[1]] ?? null;

  const volumeTotalMmcf =
    numericValue(trainA, 'volume_total_mmcf') + numericValue(trainB, 'volume_total_mmcf');

  return {
    volumeFlowrateMmscfd:
      numericValue(trainA, 'volume_flowrate_mmscfd') + numericValue(trainB, 'volume_flowrate_mmscfd'),
    energyFlowrateMmbtud:
      numericValue(trainA, 'energy_flowrate_mmbtud') + numericValue(trainB, 'energy_flowrate_mmbtud'),
    volumeTotalMmcf,
    volumeTotalMscf: mscfFromMmcf(volumeTotalMmcf),
    energyTotalMmbtu: numericValue(trainA, 'energy_total_mmbtu') + numericValue(trainB, 'energy_total_mmbtu'),
  };
}

function collectDomainValues(db: SqlExecutor): SnapshotDomainValues {
  const domains: SnapshotDomainValues = {};
  for (const [domain, tags] of Object.entries(PATROL_EQUIPMENT_TAGS_BY_DOMAIN) as Array<
    [PatrolDomain, string[]]
  >) {
    const byTag: Record<string, PatrolValues | null> = {};
    for (const tag of tags) {
      const entry = getLatestPatrolValue(db, domain, tag);
      byTag[tag] = entry ? entry.values : null;
    }
    domains[domain] = byTag;
  }
  return domains;
}

/**
 * report_date의 스냅샷을 (재)생성한다. is_finalized=true인 기존 스냅샷은
 * 덮어쓰지 않고 명시적 실패 결과를 반환한다 — 서명 완료본 보호.
 */
export function generateSnapshot(db: SqlExecutor, reportDate: string, generatedBy: string): GenerateSnapshotResult {
  const existing = getSnapshot(db, reportDate);
  if (existing?.isFinalized) {
    return {
      success: false,
      error: `report_date ${reportDate} is already finalized; regeneration is blocked.`,
      existing,
    };
  }

  const domains = collectDomainValues(db);
  const payload: DailyReportSnapshotPayload = {
    reportDate,
    generatedAt: new Date().toISOString(),
    generatedBy,
    domains,
    stationTotal: buildStationTotal(domains),
  };
  const snapshotPayload = JSON.stringify(payload);

  db.run(UPSERT_SNAPSHOT_SQL, {
    reportDate,
    generatedAt: payload.generatedAt,
    generatedBy,
    snapshotPayload,
  });

  const snapshot = getSnapshot(db, reportDate)!;
  return { success: true, snapshot, payload };
}

/** 양쪽 서명(prepared_by/acknowledged_by) 저장 후 호출 — DRAFT -> SUBMITTED로 전이한다. */
export function finalizeSnapshot(db: SqlExecutor, snapshotId: number): void {
  db.run(FINALIZE_SQL, { id: snapshotId });
}
