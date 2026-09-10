// src/batch/isoTankLegacyDataSource.ts
//
// PURPOSE
//   실제 NIAS CSV 2개를 읽어 ISO Tank를 CMMS 자산(LegacyAssetSourceRow)으로
//   편입하는 LegacyDataSource 구현체.
//
//   소스 파일:
//     1) "NIAS - ISO TANK Status, Location.csv" — 전체 함대 로스터(120대,
//        각 태그 유일). 이게 "자산이 존재한다"는 사실의 기준(source of truth for
//        existence)이다. 컬럼: No, ISO Tk No., Serial No., Location, Position, REMARKS
//     2) "NIAS - ISO Tank Master DB.csv" — 일부 탱크(전체 120대 중 11대만)의
//        시계열 텔레메트리(Level/Pressure/Temp 등). 자산 존재 여부와 무관하게
//        "최근 운용 이력이 있는 탱크"를 보여주는 보조 데이터.
//        컬럼: Report Date, Serial No., ISO Tk No., ..., Level(%), Pressure(MPa), Temp(°C), ...
//
//   CMMS 필드 매핑 정책 (사용자 확정):
//     - criticality: 원본에 없음 → null로 두어 assetAdapter의 기존 fallback
//       (DEFAULT_CRITICALITY='MEDIUM')이 자동 적용되게 한다.
//     - manufacturer: 원본에 없음 → null (assets.manufacturer는 NULL 허용).
//     - iso14224Class: 'ISO_TANK'로 명시 지정 (fallback 아님 — proposedIso14224Class에
//       직접 값을 채워 resolveIso14224Class가 그대로 통과시키도록 함).
//     - System Code: ISO Tank는 이동식 자산이므로 location 텍스트("Ship"/"Aceh" 등)
//       대신 tagNormalizationService의 이동식 자산 규칙(prefix="ISOT")으로 System 10 고정.

import { readFileSync } from 'node:fs';
import { parseCsv } from '../utils/CsvUtils';
import { normalizeTagFormat } from '../adapters/tagNormalizationService';
import type { LegacyAssetSourceRow, LegacyPermitSourceRow, LegacyDataSource } from './legacyDataSource';

interface StatusLocationRow {
  isoTkNo: string; // 정규화됨 (예: "ISOT-1")
  serialNo: string;
  location: string;
  position: string;
  remarks: string;
}

interface MasterDbLatestRow {
  isoTkNo: string;
  reportDate: string;
  levelPct?: string;
  pressureMPa?: string;
  tempC?: string;
}

function parseStatusLocationCsv(csvText: string): StatusLocationRow[] {
  const rows = parseCsv(csvText);
  return rows
    .filter((r) => (r['ISO Tk No.'] ?? '').trim().length > 0)
    .map((r) => ({
      isoTkNo: normalizeTagFormat(r['ISO Tk No.']),
      serialNo: (r['Serial No.'] ?? '').trim(),
      location: (r['Location'] ?? '').trim(),
      position: (r['Position'] ?? '').trim(),
      remarks: (r['REMARKS'] ?? '').trim(),
    }));
}

/** Master DB는 탱크당 여러 날짜 행이 있으므로, Report Date 기준 최신 1건만 남긴다. */
function parseMasterDbLatestPerTank(csvText: string): Map<string, MasterDbLatestRow> {
  const rows = parseCsv(csvText);
  const latestByTag = new Map<string, MasterDbLatestRow>();

  for (const r of rows) {
    const rawTag = r['ISO Tk No.'];
    if (!rawTag || rawTag.trim().length === 0) continue;
    const isoTkNo = normalizeTagFormat(rawTag);
    const reportDate = (r['Report Date'] ?? '').trim();

    const existing = latestByTag.get(isoTkNo);
    if (!existing || reportDate > existing.reportDate) {
      latestByTag.set(isoTkNo, {
        isoTkNo,
        reportDate,
        levelPct: r['Level (%)'],
        pressureMPa: r['Pressure (MPa)'],
        tempC: r['Temp (°C)'],
      });
    }
  }
  return latestByTag;
}

/**
 * Status/Location 텍스트("Ship" + "MV. SAVIOUR" 등)를 사람이 읽을 legacyLocationRaw
 * 문자열로 합성한다. System Code 결정에는 쓰이지 않는다(태그 prefix로 결정됨) —
 * 순수 정보 표시/검토용.
 */
function composeLocationText(row: StatusLocationRow): string {
  if (row.position && row.position !== row.location) {
    return `${row.location} (${row.position})`;
  }
  return row.location || 'Unknown';
}

export class IsoTankLegacyDataSource implements LegacyDataSource {
  constructor(
    private readonly statusLocationCsvPath: string,
    private readonly masterDbCsvPath?: string // optional — 텔레메트리 없어도 로스터만으로 동작 가능
  ) {}

  fetchAssets(): LegacyAssetSourceRow[] {
    const statusText = readFileSync(this.statusLocationCsvPath, 'utf8');
    const roster = parseStatusLocationCsv(statusText);

    const telemetryByTag = this.masterDbCsvPath
      ? parseMasterDbLatestPerTank(readFileSync(this.masterDbCsvPath, 'utf8'))
      : new Map<string, MasterDbLatestRow>();

    return roster.map((row) => {
      const telemetry = telemetryByTag.get(row.isoTkNo);
      const remarksNote = telemetry
        ? ` [최근 텔레메트리 ${telemetry.reportDate}: Level ${telemetry.levelPct ?? 'N/A'}%, ${telemetry.tempC ?? 'N/A'}°C]`
        : '';

      const legacyRow: LegacyAssetSourceRow = {
        legacyTag: row.isoTkNo,
        legacyName: `ISO Tank ${row.isoTkNo} (S/N ${row.serialNo})${remarksNote}`,
        legacyLocationRaw: composeLocationText(row),
        legacyMaker: null, // 원본 데이터에 제조사 정보 없음
        legacyCriticalityRaw: null,
        proposedCriticality: 'MEDIUM', // 확정값(정책) — 원본에 criticality 개념 자체가 없어 fallback이 아닌 명시적 기본값으로 지정
        legacyStatusRaw: null, // fallback -> OUT_OF_SERVICE (보수적 기본값). 원본에 가동상태 개념이 없어 이 필드는 의도적으로 PENDING_REVIEW를 유지시킨다 (사람이 실제 가동상태를 확인해야 함)
        legacyTypeFilter: 'PLANT',
        legacyImpaCodeRaw: null,
        proposedIso14224Class: 'ISO_TANK', // 확정값 — fallback 아님
        sourceFileKey: 'iso_tank_status_location_csv',
      };
      return legacyRow;
    });
  }

  fetchPermits(): LegacyPermitSourceRow[] {
    // ISO Tank CSV들은 PTW/허가서 데이터를 포함하지 않는다.
    return [];
  }
}
