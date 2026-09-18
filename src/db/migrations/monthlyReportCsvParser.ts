// src/db/migrations/monthlyReportCsvParser.ts
//
// PURPOSE
//   Pure CSV row mapping for monthlyReportSeedRunner.ts. Reuses
//   parseCsvRows() from gasMeteringLedgerDailyCsvParser.ts (already handles
//   RFC4180 quoted fields, e.g. Consumption CSV's "15,092" thousands-comma)
//   instead of duplicating a CSV tokenizer. Column mapping is positional,
//   verified against the actual public/data/ fixtures (Monthly Report
//   Stage 1/2 investigation, 2026-09-18).

import { parseCsvRows } from './gasMeteringLedgerDailyCsvParser';
import type { IsoTankDailyReadingRow } from '../../cmms-monthly-report/dao/isoTankDailyReadingsDao';
import type { IsoTankConsumptionRow } from '../../cmms-monthly-report/dao/isoTankConsumptionDao';

export { parseCsvRows };

function cleanNumber(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const trimmed = raw.replace(/^﻿/, '').replace(/,/g, '').trim();
  if (trimmed === '' || trimmed === '-') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function cleanText(raw: string | undefined): string | null {
  if (raw === undefined) return null;
  const trimmed = raw.replace(/^﻿/, '').trim();
  return trimmed === '' || trimmed === '-' ? null : trimmed;
}

/** Column indices per `NIAS - ISO Tank Master DB.csv` header (verified 2026-09-18). */
export function mapIsoTankMasterDbRow(cells: string[]): IsoTankDailyReadingRow | null {
  const reportDate = cells[0]?.trim();
  if (!reportDate || !/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) return null;
  const isoTankNo = cells[2]?.trim();
  if (!isoTankNo) return null;
  return {
    reportDate,
    isoTankNo,
    serialNo: cleanText(cells[1]),
    shipment: cleanText(cells[3]),
    levelPct: cleanNumber(cells[4]),
    levelM3: cleanNumber(cells[5]),
    levelMmh2o: cleanNumber(cells[6]),
    batteryPct: cleanNumber(cells[7]),
    pressureMpa: cleanNumber(cells[8]),
    tempC: cleanNumber(cells[9]),
    depressFlag: cleanText(cells[10]),
    pressBeforeMpa: cleanNumber(cells[11]),
    pressAfterMpa: cleanNumber(cells[12]),
    remarks: cleanText(cells[13]),
  };
}

const MONTH_ABBR: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

/** 'NIAS - ISO Tank Consumption.csv' Report Date is 'DD-Mon' with no year (e.g. '26-Jul'). */
function resolveConsumptionReportDate(raw: string | undefined, year: number): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  const m = /^(\d{1,2})-([A-Za-z]{3})$/.exec(trimmed);
  if (!m) return null;
  const month = MONTH_ABBR[m[2]];
  if (!month) return null;
  return `${year}-${month}-${m[1].padStart(2, '0')}`;
}

/** Column indices per `NIAS - ISO Tank Consumption.csv` header (verified 2026-09-18). */
export function mapIsoTankConsumptionRow(cells: string[], year: number): IsoTankConsumptionRow | null {
  const reportDate = resolveConsumptionReportDate(cells[3], year);
  const isoTankNo = cells[1]?.trim();
  if (!reportDate || !isoTankNo) return null;
  return {
    reportDate,
    isoTankNo,
    serialNo: cleanText(cells[0]),
    shipment: cleanText(cells[2]),
    weightAwalKg: cleanNumber(cells[4]),
    heatingValueBtuKg: cleanNumber(cells[5]),
    stockAwalM3: cleanNumber(cells[6]),
    stockAwalKg: cleanNumber(cells[7]),
    stockAkhirM3: cleanNumber(cells[8]),
    stockAkhirKg: cleanNumber(cells[9]),
    netConsumedM3: cleanNumber(cells[10]),
    consumedKg: cleanNumber(cells[11]),
    consumedMmbtu: cleanNumber(cells[12]),
    densityKgM3: cleanNumber(cells[13]),
    lossesKg: cleanNumber(cells[14]),
    lossesPct: cleanNumber(cells[15]),
    remarks: cleanText(cells[16]),
  };
}
