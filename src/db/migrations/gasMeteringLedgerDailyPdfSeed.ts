// src/db/migrations/gasMeteringLedgerDailyPdfSeed.ts
//
// PURPOSE
//   Hand-transcribed ground-truth row from the physical Daily Report
//   (FORM-NP-08-33-N, "Daily Report Regasifikasi Nias 15092026.pdf",
//   HJ-confirmed 2026-09-16) — Section A "MONITORING METERING SYSTEM" +
//   "ANALYSIS OF GAS CHROMATOGRAPH (GC)" + NG Buffer Tank pressure.
//
//   Every value below was read directly off the PDF page 1 table, not
//   derived/estimated. Daily Total = Volume/Energy Total row per train
//   (NOT the Cum. columns — the PDF's per-train "Total" figures sum exactly
//   to the highlighted STATION TOTAL: 26.80 + 338.36 = 365.16, confirming
//   these are same-day totals, not cumulative-since-inception values like
//   the CSV's "Cum." columns).
//
//   Fields the PDF reports in a shape gas_metering_ledger_daily's GC_REPORT
//   condition columns don't match (U/S metering gauge, diff-pressure
//   transmitter, pressure transmitter, temp gauge, D/S gauge — per-train
//   instantaneous readings) are intentionally NOT force-mapped here; they
//   belong to daily_ops_patrol_entries.metering_train_a/b (4-hr patrol
//   granularity), a separate seeding task outside this table's scope.
//
//   GC composition is a single station-wide panel reading in the PDF (not
//   split per M-101A/B like NIAS - GC composion.csv), so it is stored in
//   the *_station columns only — not duplicated into _a/_b.

import type { GasMeteringLedgerRow } from './gasMeteringLedgerDailyRunner.types';

export const DAILY_REPORT_PDF_SEED_ROW: GasMeteringLedgerRow = {
  reportDate: '2026-09-15',
  meterSource: 'DAILY_REPORT_PDF',
  sourceDocument: 'FORM-NP-08-33-N(1/5)/0/2025.12.26 — Daily Report Regasifikasi Nias 15092026.pdf',

  dailyUvolMmcfA: null,
  dailyCvolMmcfA: 0,
  dailyMassTonneA: null,
  dailyMmbtuA: 26.80,

  dailyUvolMmcfB: null,
  dailyCvolMmcfB: 0,
  dailyMassTonneB: null,
  dailyMmbtuB: 338.36,

  dailyUvolMmcfStation: null,
  dailyCvolMmcfStation: 0,
  dailyMassTonneStation: null,
  dailyMmbtuStation: 365.16,

  molMethaneStation: 96.6,
  molEthaneStation: 1.88,
  molPropaneStation: 0.42,
  molIbutaneStation: 0.06,
  molNbutaneStation: 0.08,
  molIpentaneStation: 0.01,
  molNpentaneStation: 0.004,
  molHexaneStation: 0.00,
  molNitrogenStation: 0.83,
  molH2oPpmStation: 0.00,
  molH2sPpmStation: 0.00,
  molTotalPctStation: 99.9,

  ngBufferTankPressureBar: 4.2,
};
