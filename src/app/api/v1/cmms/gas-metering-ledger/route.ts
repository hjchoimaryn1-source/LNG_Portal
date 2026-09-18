// src/app/api/v1/cmms/gas-metering-ledger/route.ts
//
// PURPOSE
//   Client/server boundary for gas_metering_ledger_daily (gasMeteringLedgerDao.ts
//   imports node:sqlite indirectly, can't be called from 'use client' components
//   — same reason as daily-ops-patrol-entries/route.ts).
//
//   GET                    -> recent daily ledger rows (GasMeteringDailyTab)
//   GET + ?snapshot=1       -> latest composition + meter-stream GHV
//                              (SettlementAuditView's weathering comparison,
//                              replaces the old client-side CSV fetch)
//   GET + ?entryDate=YYYY-MM-DD -> { gcReport, gcComposition } raw rows for
//                              that date, for FlobossDailyEntryForm's pre-fill
//   POST { kind: 'gc_report' | 'gc_composition', row } -> upsert one row,
//   keyed (report_date, meter_source) — live daily entry (HJ decision, this
//   session, reversing the 2026-09-16 "no manual entry" stance). Same table
//   the CSV seed runner (gasMeteringLedgerDailyRunner.ts) populated — no
//   separate live table, this simply extends it going forward.

import { NextRequest, NextResponse } from 'next/server';
import { getGasMeteringDb } from '../../../../../gas-metering/db/gasMeteringDbSingleton';
import { getRecentGasMeteringLedger, getLatestGasMeteringSnapshot } from '../../../../../gas-metering/dao/gasMeteringLedgerDao';
import {
  getGcReportEntryForDate,
  getGcCompositionEntryForDate,
  upsertGcReportEntry,
  upsertGcCompositionEntry,
  type GcReportEntryRow,
  type GcCompositionEntryRow,
} from '../../../../../gas-metering/dao/gasMeteringLedgerEntryDao';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const db = getGasMeteringDb();

  if (params.get('snapshot') === '1') {
    const snapshot = getLatestGasMeteringSnapshot(db);
    return NextResponse.json({ success: true, snapshot });
  }

  const entryDate = params.get('entryDate');
  if (entryDate) {
    const gcReport = getGcReportEntryForDate(db, entryDate) ?? null;
    const gcComposition = getGcCompositionEntryForDate(db, entryDate) ?? null;
    return NextResponse.json({ success: true, gcReport, gcComposition });
  }

  const limitParam = Number(params.get('limit'));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 60;
  const records = getRecentGasMeteringLedger(db, limit);
  return NextResponse.json({ success: true, records });
}

interface PostBody {
  kind: 'gc_report' | 'gc_composition';
  row: GcReportEntryRow | GcCompositionEntryRow;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as PostBody;
  if (body.kind !== 'gc_report' && body.kind !== 'gc_composition') {
    return NextResponse.json({ success: false, error: '"kind" must be "gc_report" or "gc_composition".' }, { status: 400 });
  }
  if (!body.row?.reportDate) {
    return NextResponse.json({ success: false, error: 'row.reportDate is required.' }, { status: 400 });
  }
  const db = getGasMeteringDb();
  if (body.kind === 'gc_report') {
    upsertGcReportEntry(db, body.row as GcReportEntryRow);
  } else {
    upsertGcCompositionEntry(db, body.row as GcCompositionEntryRow);
  }
  return NextResponse.json({ success: true });
}
