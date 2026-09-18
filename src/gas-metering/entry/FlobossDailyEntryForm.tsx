// src/gas-metering/entry/FlobossDailyEntryForm.tsx
//
// PURPOSE
//   Live daily entry for gas_metering_ledger_daily — Floboss Meter A/B/
//   Station volumes+energy+process params (GC_REPORT row) and GC mol%
//   composition A/B (GC_COMPOSITION row), each with its own Save (two
//   independent rows, may be entered at different times per the Floboss
//   vs. GC-composition device split). Date defaults to today; back-dating
//   allowed for same-day correction or backfilling the pre-mid-September
//   seed gap — this is a correction capability, not an overwrite-on-load.

'use client';

import { useEffect, useState } from 'react';
import { RAISED_PANEL, SUNKEN_INPUT, TITLE_BAR, BEVEL_BUTTON } from '../../components/cmms/scadaStyles';
import { useGasMeteringDailyEntry } from '../hooks/useGasMeteringLedger';
import { FlobossEntryFieldGrid } from './FlobossEntryFieldGrid';
import { METER_A_FIELDS, METER_B_FIELDS, STATION_FIELDS, compositionFields } from './flobossEntryFieldMaps';
import type { GcReportEntryRow, GcCompositionEntryRow } from '../dao/gasMeteringLedgerEntryDao';

const COMPOSITION_A_FIELDS = compositionFields('A');
const COMPOSITION_B_FIELDS = compositionFields('B');
const REPORT_FIELD_KEYS = [...METER_A_FIELDS, ...METER_B_FIELDS, ...STATION_FIELDS].map((f) => f.key);
const COMPOSITION_FIELD_KEYS = [...COMPOSITION_A_FIELDS, ...COMPOSITION_B_FIELDS].map((f) => f.key);

function emptyGcReport(reportDate: string): GcReportEntryRow {
  const row = { reportDate } as GcReportEntryRow;
  for (const key of REPORT_FIELD_KEYS) (row as unknown as Record<string, null>)[key] = null;
  return row;
}

function emptyGcComposition(reportDate: string): GcCompositionEntryRow {
  const row = { reportDate } as GcCompositionEntryRow;
  for (const key of COMPOSITION_FIELD_KEYS) (row as unknown as Record<string, null>)[key] = null;
  return row;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function FlobossDailyEntryForm() {
  const [reportDate, setReportDate] = useState(todayIso());
  const { gcReport, gcComposition, isLoading, error, saveGcReport, saveGcComposition } =
    useGasMeteringDailyEntry(reportDate);
  const [reportDraft, setReportDraft] = useState<GcReportEntryRow>(() => emptyGcReport(reportDate));
  const [compositionDraft, setCompositionDraft] = useState<GcCompositionEntryRow>(() => emptyGcComposition(reportDate));
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    setReportDraft(gcReport ?? emptyGcReport(reportDate));
  }, [gcReport, reportDate]);

  useEffect(() => {
    setCompositionDraft(gcComposition ?? emptyGcComposition(reportDate));
  }, [gcComposition, reportDate]);

  async function handleSaveReport() {
    const ok = await saveGcReport(reportDraft);
    setSaveMessage(ok ? `Saved Floboss reading for ${reportDate}.` : 'Save failed.');
    setTimeout(() => setSaveMessage(null), 3000);
  }

  async function handleSaveComposition() {
    const ok = await saveGcComposition(compositionDraft);
    setSaveMessage(ok ? `Saved GC composition for ${reportDate}.` : 'Save failed.');
    setTimeout(() => setSaveMessage(null), 3000);
  }

  const reportValues = reportDraft as unknown as Record<string, number | null>;
  const compositionValues = compositionDraft as unknown as Record<string, number | null>;

  return (
    <div className="space-y-3">
      <div className={TITLE_BAR}>FLOBOSS DAILY ENTRY — gas_metering_ledger_daily (GC_REPORT / GC_COMPOSITION)</div>
      <div className={`${RAISED_PANEL} p-2 flex items-center gap-2`}>
        <span className="text-[10px] font-bold text-slate-600 uppercase">Date:</span>
        <input
          type="date"
          value={reportDate}
          onChange={(e) => setReportDate(e.target.value)}
          className={`${SUNKEN_INPUT} w-40`}
        />
        <span className="text-[11px] text-slate-500 ml-auto">{isLoading ? 'Loading…' : null}</span>
      </div>
      {error && <div className="p-2 text-[11px] text-red-700 font-bold">{error}</div>}
      {saveMessage && <div className="p-2 text-[11px] text-emerald-700 font-bold">{saveMessage}</div>}

      <div className={`${RAISED_PANEL} p-3 space-y-3`}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-600 uppercase">Floboss Reading (GC_REPORT)</span>
          <button type="button" onClick={handleSaveReport} className={`${BEVEL_BUTTON} ml-auto`}>
            Save Floboss Reading
          </button>
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-500 mb-1">Meter A</div>
          <FlobossEntryFieldGrid
            fields={METER_A_FIELDS}
            values={reportValues}
            onChange={(k, v) => setReportDraft((p) => ({ ...p, [k]: v }))}
          />
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-500 mb-1">Meter B</div>
          <FlobossEntryFieldGrid
            fields={METER_B_FIELDS}
            values={reportValues}
            onChange={(k, v) => setReportDraft((p) => ({ ...p, [k]: v }))}
          />
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-500 mb-1">Station Total / Manual Sample</div>
          <FlobossEntryFieldGrid
            fields={STATION_FIELDS}
            values={reportValues}
            onChange={(k, v) => setReportDraft((p) => ({ ...p, [k]: v }))}
          />
        </div>
      </div>

      <div className={`${RAISED_PANEL} p-3 space-y-3`}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-600 uppercase">GC Composition (GC_COMPOSITION)</span>
          <button type="button" onClick={handleSaveComposition} className={`${BEVEL_BUTTON} ml-auto`}>
            Save GC Composition
          </button>
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-500 mb-1">Meter A</div>
          <FlobossEntryFieldGrid
            fields={COMPOSITION_A_FIELDS}
            values={compositionValues}
            onChange={(k, v) => setCompositionDraft((p) => ({ ...p, [k]: v }))}
          />
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-500 mb-1">Meter B</div>
          <FlobossEntryFieldGrid
            fields={COMPOSITION_B_FIELDS}
            values={compositionValues}
            onChange={(k, v) => setCompositionDraft((p) => ({ ...p, [k]: v }))}
          />
        </div>
      </div>
    </div>
  );
}
