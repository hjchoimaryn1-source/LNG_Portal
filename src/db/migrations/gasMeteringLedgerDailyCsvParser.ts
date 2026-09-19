// src/db/migrations/gasMeteringLedgerDailyCsvParser.ts
//
// PURPOSE
//   Pure, framework-agnostic CSV parsing for gasMeteringLedgerDailyRunner.ts.
//   Handles RFC4180 quoted fields with embedded newlines (NIAS - G.C Report .csv's
//   header wraps each column name across 2 lines inside quotes) — a plain
//   String.split('\n') would break on that file. Column mapping is positional
//   (index-based), not header-text lookup, because the G.C Report header's
//   whitespace/newline layout is inconsistent between columns (see fixture note
//   in gasMeteringLedgerDailyRunner.ts).

export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c === '\r') {
      // skip — \r\n line endings, bare \n handled above
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function cleanNumber(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const trimmed = raw.replace(/^﻿/, '').trim();
  if (trimmed === '' || trimmed === '-') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export interface GcReportRow {
  reportDate: string;
  cumUvolMmcfA: number | null; cumCvolMmcfA: number | null; cumMassTonneA: number | null; cumMmbtuA: number | null;
  cumUvolMmcfB: number | null; cumCvolMmcfB: number | null; cumMassTonneB: number | null; cumMmbtuB: number | null;
  cumUvolMmcfStation: number | null; cumCvolMmcfStation: number | null; cumMassTonneStation: number | null; cumMmbtuStation: number | null;
  dailyUvolMmcfA: number | null; dailyCvolMmcfA: number | null; dailyMassTonneA: number | null; dailyMmbtuA: number | null;
  dailyUvolMmcfB: number | null; dailyCvolMmcfB: number | null; dailyMassTonneB: number | null; dailyMmbtuB: number | null;
  dailyUvolMmcfStation: number | null; dailyCvolMmcfStation: number | null; dailyMassTonneStation: number | null; dailyMmbtuStation: number | null;
  pressBargA: number | null; tempCA: number | null; lineDensKgM3A: number | null; lineCompressZfA: number | null; ghvA: number | null;
  pressBargB: number | null; tempCB: number | null; lineDensKgM3B: number | null; lineCompressZfB: number | null; ghvB: number | null;
}

/** Column indices per NIAS - G.C Report .csv header (verified against public/data/ fixture, 2026-09-16). */
export function mapGcReportRow(cells: string[]): GcReportRow | null {
  const reportDate = cells[0]?.trim();
  if (!reportDate || !/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) return null;
  const n = (i: number) => cleanNumber(cells[i]);
  return {
    reportDate,
    cumUvolMmcfA: n(1), cumCvolMmcfA: n(2), cumMassTonneA: n(3), cumMmbtuA: n(4),
    cumUvolMmcfB: n(5), cumCvolMmcfB: n(6), cumMassTonneB: n(7), cumMmbtuB: n(8),
    cumUvolMmcfStation: n(9), cumCvolMmcfStation: n(10), cumMassTonneStation: n(11), cumMmbtuStation: n(12),
    dailyUvolMmcfA: n(13), dailyCvolMmcfA: n(14), dailyMassTonneA: n(15), dailyMmbtuA: n(16),
    dailyUvolMmcfB: n(17), dailyCvolMmcfB: n(18), dailyMassTonneB: n(19), dailyMmbtuB: n(20),
    dailyUvolMmcfStation: n(21), dailyCvolMmcfStation: n(22), dailyMassTonneStation: n(23), dailyMmbtuStation: n(24),
    pressBargA: n(25), tempCA: n(26), lineDensKgM3A: n(27), lineCompressZfA: n(28), ghvA: n(29),
    pressBargB: n(30), tempCB: n(31), lineDensKgM3B: n(32), lineCompressZfB: n(33), ghvB: n(34),
  };
}

export interface GcCompositionRow {
  reportDate: string;
  molNitrogenA: number | null; molNitrogenB: number | null;
  molCo2A: number | null; molCo2B: number | null;
  molH2sA: number | null; molH2sB: number | null;
  molH2oA: number | null; molH2oB: number | null;
  molMethaneA: number | null; molMethaneB: number | null;
  molEthaneA: number | null; molEthaneB: number | null;
  molPropaneA: number | null; molPropaneB: number | null;
  molNbutaneA: number | null; molNbutaneB: number | null;
  molIbutaneA: number | null; molIbutaneB: number | null;
  molNpentaneA: number | null; molNpentaneB: number | null;
  molIpentaneA: number | null; molIpentaneB: number | null;
  molHexaneA: number | null; molHexaneB: number | null;
  molHeptaneA: number | null; molHeptaneB: number | null;
  molOctaneA: number | null; molOctaneB: number | null;
  molNonaneA: number | null; molNonaneB: number | null;
  molDecaneA: number | null; molDecaneB: number | null;
}

/** Column indices per NIAS - GC composion.csv header (single-line, verified 2026-09-16). */
export function mapGcCompositionRow(cells: string[]): GcCompositionRow | null {
  const reportDate = cells[0]?.trim();
  if (!reportDate || !/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) return null;
  const n = (i: number) => cleanNumber(cells[i]);
  return {
    reportDate,
    molNitrogenA: n(1), molNitrogenB: n(2),
    molCo2A: n(3), molCo2B: n(4),
    molH2sA: n(5), molH2sB: n(6),
    molH2oA: n(7), molH2oB: n(8),
    molMethaneA: n(9), molMethaneB: n(10),
    molEthaneA: n(11), molEthaneB: n(12),
    molPropaneA: n(13), molPropaneB: n(14),
    molNbutaneA: n(15), molNbutaneB: n(16),
    molIbutaneA: n(17), molIbutaneB: n(18),
    molNpentaneA: n(19), molNpentaneB: n(20),
    molIpentaneA: n(21), molIpentaneB: n(22),
    molHexaneA: n(23), molHexaneB: n(24),
    molHeptaneA: n(25), molHeptaneB: n(26),
    molOctaneA: n(27), molOctaneB: n(28),
    molNonaneA: n(29), molNonaneB: n(30),
    molDecaneA: n(31), molDecaneB: n(32),
  };
}
