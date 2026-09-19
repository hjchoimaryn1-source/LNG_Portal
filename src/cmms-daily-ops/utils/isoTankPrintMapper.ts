// src/cmms-daily-ops/utils/isoTankPrintMapper.ts
//
// PURPOSE
//   FORM-NP-08-33-N Section C(UNLOADING SKID T-201~204)/Section D(ISO TANK
//   CARGO UNITS + Laden/Empty 집계)를 위한 순수 매핑 함수. 입력은
//   PortalDataContext 계열 `DailyMasterRecord[]`(NiasActiveBayWorkspace.tsx /
//   NiasLaydownLogTab.tsx가 쓰는 동일 저장소, useDailyMasterFacade로 읽음) —
//   React 바인딩 없는 Logic/Data Layer(AGENTS.md §3).
//
//   Section C — Bay 01~04는 NiasActiveBayWorkspace.tsx의 로컬 formatBayName()
//   과 동일한 매핑을 이 파일에서 독립적으로 재현한다(그 파일은 read-only 대상이라
//   함수를 import할 수 없음). battery_iot_pct는 그 탭의 저장 경로에
//   `battery: 100`이 항상 하드코딩되어 실측 IoT 배터리 입력이 아니므로 null로
//   두어 PrintFieldGrid.tsx의 기존 결측값 표기('-')를 그대로 탄다.
//
//   Section D — "11개 탱크"는 NiasLaydownLogTab.tsx의 zoneFilter==='ALL' 범위와
//   동일하게 position 필터 없이 해당 report_date의 모든 레코드를 포함한다
//   (NiasLaydownLogTab.tsx:130-132의 ld1Count||9 + skidCount||1 + ld2Count||1
//   = 11 기본값 주석 근거 — Skid 탑재 탱크도 "적재 중"이라는 이 총계에 포함됨).
//   Laden/Empty 분류는 useNiasInspectionForm.ts:177이 실제로 쓰는 값
//   `position === 'Laydown 2'`를 그대로 따른다(FleetTankItem.currentZone 조회
//   불필요 — DailyMasterRecord 자체 필드로 충분).

import type { DailyMasterRecord } from '../../types/lng';
import type { PatrolValues } from '../dao/dailyOpsPatrolDao';

const BAY_POSITION_TO_SKID_TAG: Record<string, string> = {
  'Bay 01': 'T-201',
  'Bay 02': 'T-202',
  'Bay 03': 'T-203',
  'Bay 04': 'T-204',
};

const EMPTY_ZONE_POSITION = 'Laydown 2';

function recordsForDate(records: DailyMasterRecord[], reportDate: string): DailyMasterRecord[] {
  return records.filter((r) => r.reportDate === reportDate);
}

/** Section C 필드 6종 — battery_iot_pct는 실측 입력이 없어 항상 null(= '-' 표기). */
function toSkidPatrolValues(record: DailyMasterRecord): PatrolValues {
  return {
    level_iot_pct: record.level,
    level_gauge_mmh2o: record.levelMmH2O,
    volume_m3: record.levelM3,
    battery_iot_pct: null,
    pressure_mpa: record.pressureMPa,
    temperature_c: record.tempC,
  };
}

/** Section D 필드 6종 — 이 탭은 battery가 실측 입력이라 그대로 사용한다. */
function toCargoPatrolValues(record: DailyMasterRecord): PatrolValues {
  return {
    level_iot_pct: record.level,
    level_gauge_mmh2o: record.levelMmH2O,
    volume_m3: record.levelM3,
    battery_iot_pct: record.battery,
    pressure_mpa: record.pressureMPa,
    temperature_c: record.tempC,
  };
}

/** T-201~204 슬롯 4개 고정 — 해당 날짜에 그 Bay 레코드가 없으면 null(= PrintFieldGrid가 '-' 렌더). */
export function buildIsoTankUnloadingSkidDomain(
  records: DailyMasterRecord[],
  reportDate: string
): Record<string, PatrolValues | null> {
  const byPosition = new Map(recordsForDate(records, reportDate).map((r) => [r.position, r]));
  const result: Record<string, PatrolValues | null> = {};
  for (const [position, tag] of Object.entries(BAY_POSITION_TO_SKID_TAG)) {
    const record = byPosition.get(position);
    result[tag] = record ? toSkidPatrolValues(record) : null;
  }
  return result;
}

/** tankNo별 슬롯 — 개수가 가변(그날 실제 저장된 레코드 수)이라 고정 태그 레지스트리를 쓰지 않는다. */
export function buildIsoTankCargoDomain(
  records: DailyMasterRecord[],
  reportDate: string
): Record<string, PatrolValues> {
  const result: Record<string, PatrolValues> = {};
  for (const record of recordsForDate(records, reportDate)) {
    result[record.tankNo] = toCargoPatrolValues(record);
  }
  return result;
}

export interface IsoTankCargoSummaryGroup {
  count: number;
  totalStockM3: number;
  avgPressureMPa: number;
  avgTempC: number;
}

export interface IsoTankCargoSummary {
  laden: IsoTankCargoSummaryGroup;
  empty: IsoTankCargoSummaryGroup;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function summarizeGroup(records: DailyMasterRecord[]): IsoTankCargoSummaryGroup {
  return {
    count: records.length,
    totalStockM3: records.reduce((sum, r) => sum + r.levelM3, 0),
    avgPressureMPa: average(records.map((r) => r.pressureMPa)),
    avgTempC: average(records.map((r) => r.tempC)),
  };
}

/** RECORD OF ISOTANK (LADEN / EMPTY) — 합계는 Stock 볼륨 합산, 압력/온도는 그룹 평균. */
export function buildIsoTankCargoSummary(
  records: DailyMasterRecord[],
  reportDate: string
): IsoTankCargoSummary {
  const dayRecords = recordsForDate(records, reportDate);
  const emptyRecords = dayRecords.filter((r) => r.position === EMPTY_ZONE_POSITION);
  const ladenRecords = dayRecords.filter((r) => r.position !== EMPTY_ZONE_POSITION);
  return {
    laden: summarizeGroup(ladenRecords),
    empty: summarizeGroup(emptyRecords),
  };
}
