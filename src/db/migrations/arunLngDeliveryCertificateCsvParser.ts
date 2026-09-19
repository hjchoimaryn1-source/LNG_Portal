// src/db/migrations/arunLngDeliveryCertificateCsvParser.ts
//
// PURPOSE
//   Pure CSV row mapping for "NIAS - Cert. of LNG Delivered Measuremen.csv".
//   Reuses parseCsvRows() from gasMeteringLedgerDailyCsvParser.ts (RFC4180
//   quoted fields — this source quotes every thousands-comma numeric like
//   "28,720"). The file itself is cp949-encoded (Korean Windows codepage —
//   verified by direct byte inspection this session; NOT cp1252 as
//   originally assumed), so the caller must decode with
//   `new TextDecoder('euc-kr').decode(buffer)` before calling parseCsvRows,
//   not `readFileSync(path, 'utf8')` like the other seed parsers.

import { parseCsvRows } from './gasMeteringLedgerDailyCsvParser';
import type { ArunLngDeliveryCertificateRow } from '../../cmms-monthly-report/dao/arunLngDeliveryCertificateDao';

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

/** Column indices per the certificate CSV header (verified 2026-09-18, 20 columns). */
export function mapArunLngDeliveryCertificateRow(cells: string[]): ArunLngDeliveryCertificateRow | null {
  const isoTankNo = cells[1]?.trim();
  const shipment = cells[3]?.trim();
  if (!isoTankNo || !shipment) return null;
  return {
    shipment,
    isoTankNo,
    serialNo: cleanText(cells[0]),
    certDate: cleanText(cells[2]),
    weightBeforeKg: cleanNumber(cells[4]),
    weightAfterKg: cleanNumber(cells[5]),
    loadedLngWeightKg: cleanNumber(cells[6]),
    densityKgM3: cleanNumber(cells[7]),
    liquidTempC: cleanNumber(cells[8]),
    ghvBtuKg: cleanNumber(cells[9]),
    gassingUpVolM3: cleanNumber(cells[10]),
    gassingUpEnergyMmbtu: cleanNumber(cells[11]),
    coolingDownTempC: cleanNumber(cells[12]),
    coolingDownVolM3: cleanNumber(cells[13]),
    coolingDownEnergyMmbtu: cleanNumber(cells[14]),
    btuLoadedBtu: cleanNumber(cells[15]),
    btuLoadedMmbtu: cleanNumber(cells[16]),
    volumeLoadedM3: cleanNumber(cells[17]),
    totalDeliveredVolM3: cleanNumber(cells[18]),
    totalEnergyDeliveredMmbtu: cleanNumber(cells[19]),
  };
}
