// src/components/locations/nias/monthlyReport/GasDeliverySummaryForm.tsx
//
// PURPOSE
//   "Summary Gas Delivery P5" entry form. DCQ/Nom./Prod. Plan auto-fill
//   from gas_delivery_contract_reference (monthly grain) but stay
//   editable/overridable; Delivery Vol/Energy auto-compute at read-time
//   from gas_metering_ledger_daily and are display-only (not part of the
//   editable draft, not persisted — see gasDeliveryComputedDao.ts). Only
//   the 6 exception categories (Off-Spec, Shortfall, Force Majeure,
//   Maintenance Day, Under Take, Excess) plus Avg Temp/Press remain manual
//   entry, unchanged. Plus the sheet's separate end-of-month cumulative
//   block. Two grains, two tables (HJ-confirmed) — see gasDeliveryManualDao.ts.

'use client';

import { useEffect, useMemo, useState } from 'react';
import { RAISED_PANEL, SUNKEN_INPUT, SUNKEN_PANEL, TITLE_BAR, BEVEL_BUTTON } from '../../../cmms/scadaStyles';
import { useGasDeliveryManual } from './hooks/useMonthlyReportData';
import { fmtNum } from './utils/monthlyReportFormat';
import type { GasDeliveryDailyManualRow, GasDeliveryMonthlyManualRow } from '../../../../cmms-monthly-report/dao/gasDeliveryManualDao';
import { mergeGasDeliveryDailyRows } from '../../../../cmms-monthly-report/dao/gasDeliveryMergedView';

export interface GasDeliverySummaryFormProps {
  reportMonth: string;
}

const DAILY_FIELDS: Array<{ key: keyof Omit<GasDeliveryDailyManualRow, 'reportDate'>; label: string }> = [
  { key: 'dcqMmscfd', label: 'DCQ (MMSCFD)' },
  { key: 'nomMmscfd', label: 'Nom. (MMSCFD)' },
  { key: 'prodPlanMmscfd', label: 'Prod. Plan (MMSCFD)' },
  { key: 'offSpecVolMmscf', label: 'Off-Spec Vol (MMSCF)' },
  { key: 'offSpecEnergyMmbtu', label: 'Off-Spec Energy (MMBTU)' },
  { key: 'shortfallVolMmscf', label: 'Shortfall Vol (MMSCF)' },
  { key: 'shortfallEnergyMmbtu', label: 'Shortfall Energy (MMBTU)' },
  { key: 'forceMajeureVolMmscf', label: 'Force Majeure Vol (MMSCF)' },
  { key: 'forceMajeureEnergyMmbtu', label: 'Force Majeure Energy (MMBTU)' },
  { key: 'maintenanceDayVolMmscf', label: 'Maintenance Day Vol (MMSCF)' },
  { key: 'maintenanceDayEnergyMmbtu', label: 'Maintenance Day Energy (MMBTU)' },
  { key: 'underTakeVolMmscf', label: 'Under Take Vol (MMSCF)' },
  { key: 'underTakeEnergyMmbtu', label: 'Under Take Energy (MMBTU)' },
  { key: 'excessVolMmscf', label: 'Excess Vol (MMSCF)' },
  { key: 'excessEnergyMmbtu', label: 'Excess Energy (MMBTU)' },
  { key: 'avgTempC', label: 'Average Temp (°C)' },
  { key: 'avgPressPsig', label: 'Average Press (psig)' },
];

const MONTHLY_FIELDS: Array<{ key: keyof Omit<GasDeliveryMonthlyManualRow, 'reportMonth'>; label: string }> = [
  { key: 'shortfallBeginMonthMmscf', label: 'Shortfall Begin Month (MMSCF)' },
  { key: 'shortfallBeginMonthMmbtu', label: 'Shortfall Begin Month (MMBTU)' },
  { key: 'shortfallThisMonthMmscf', label: 'Shortfall This Month (MMSCF)' },
  { key: 'shortfallThisMonthMmbtu', label: 'Shortfall This Month (MMBTU)' },
  { key: 'undertakeThisMonthMmscf', label: 'Undertake This Month (MMSCF)' },
  { key: 'undertakeThisMonthMmbtu', label: 'Undertake This Month (MMBTU)' },
  { key: 'excessThisMonthMmscf', label: 'Excess This Month (MMSCF)' },
  { key: 'excessThisMonthMmbtu', label: 'Excess This Month (MMBTU)' },
  { key: 'shortfallEndMonthMmscf', label: 'Shortfall End Month (MMSCF)' },
  { key: 'shortfallEndMonthMmbtu', label: 'Shortfall End Month (MMBTU)' },
];

function emptyDailyRow(reportDate: string): GasDeliveryDailyManualRow {
  const row = { reportDate } as GasDeliveryDailyManualRow;
  for (const { key } of DAILY_FIELDS) row[key] = null;
  return row;
}

function emptyMonthlyRow(reportMonth: string): GasDeliveryMonthlyManualRow {
  const row = { reportMonth } as GasDeliveryMonthlyManualRow;
  for (const { key } of MONTHLY_FIELDS) row[key] = null;
  return row;
}

export default function GasDeliverySummaryForm({ reportMonth }: GasDeliverySummaryFormProps) {
  const { daily, monthly, contractReference, computed, isLoading, error, saveDaily, saveMonthly } =
    useGasDeliveryManual(reportMonth);
  const [selectedDate, setSelectedDate] = useState(`${reportMonth}-01`);
  const [dailyDraft, setDailyDraft] = useState<GasDeliveryDailyManualRow>(() => emptyDailyRow(selectedDate));
  const [monthlyDraft, setMonthlyDraft] = useState<GasDeliveryMonthlyManualRow>(() => emptyMonthlyRow(reportMonth));
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const computedForDate = computed.find((c) => c.reportDate === selectedDate);
  const mergedRows = useMemo(
    () => mergeGasDeliveryDailyRows(daily, computed, contractReference),
    [daily, computed, contractReference]
  );

  useEffect(() => {
    const existing = daily.find((d) => d.reportDate === selectedDate);
    if (existing) {
      setDailyDraft(existing);
    } else {
      const row = emptyDailyRow(selectedDate);
      if (contractReference) {
        row.dcqMmscfd = contractReference.dcqMmscfd;
        row.nomMmscfd = contractReference.nomMmscfd;
        row.prodPlanMmscfd = contractReference.prodPlanMmscfd;
      }
      setDailyDraft(row);
    }
  }, [selectedDate, daily, contractReference]);

  useEffect(() => {
    setMonthlyDraft(monthly ?? emptyMonthlyRow(reportMonth));
  }, [monthly, reportMonth]);

  async function handleSaveDaily() {
    const ok = await saveDaily(dailyDraft);
    setSaveMessage(ok ? `Saved ${selectedDate}.` : 'Save failed.');
    setTimeout(() => setSaveMessage(null), 3000);
  }

  async function handleSaveMonthly() {
    const ok = await saveMonthly(monthlyDraft);
    setSaveMessage(ok ? `Saved monthly summary for ${reportMonth}.` : 'Save failed.');
    setTimeout(() => setSaveMessage(null), 3000);
  }

  return (
    <div className="space-y-3">
      <div className={TITLE_BAR}>SUMMARY GAS DELIVERY (P5) — Manual Entry</div>
      {error && <div className="p-2 text-[11px] text-red-700 font-bold">Failed to load P5 data: {error}</div>}
      {saveMessage && <div className="p-2 text-[11px] text-emerald-700 font-bold">{saveMessage}</div>}

      <div className={`${RAISED_PANEL} p-3 space-y-2`}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-600 uppercase">Daily Fields — Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={`${SUNKEN_INPUT} w-40`}
          />
          <button type="button" onClick={handleSaveDaily} className={`${BEVEL_BUTTON} ml-auto`}>
            Save Day
          </button>
        </div>
        <div className="flex gap-4 text-[10px] font-mono text-slate-600 bg-slate-100 border border-slate-300 p-2">
          <span>
            Delivery Vol (auto, MSCF): <strong>{fmtNum(computedForDate?.deliveryVolMscf)}</strong>
          </span>
          <span>
            Delivery Energy (auto, MMBTU): <strong>{fmtNum(computedForDate?.deliveryEnergyMmbtu)}</strong>
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {DAILY_FIELDS.map(({ key, label }) => (
            <label key={key} className="text-[10px] font-mono text-slate-700 flex flex-col gap-0.5">
              {label}
              <input
                type="number"
                value={dailyDraft[key] ?? ''}
                onChange={(e) =>
                  setDailyDraft((prev) => ({ ...prev, [key]: e.target.value === '' ? null : Number(e.target.value) }))
                }
                className={SUNKEN_INPUT}
              />
            </label>
          ))}
        </div>
      </div>

      <div className={`${RAISED_PANEL} p-3 space-y-2`}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-600 uppercase">Monthly Cumulative Block</span>
          <button type="button" onClick={handleSaveMonthly} className={`${BEVEL_BUTTON} ml-auto`}>
            Save Month
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {MONTHLY_FIELDS.map(({ key, label }) => (
            <label key={key} className="text-[10px] font-mono text-slate-700 flex flex-col gap-0.5">
              {label}
              <input
                type="number"
                value={monthlyDraft[key] ?? ''}
                onChange={(e) =>
                  setMonthlyDraft((prev) => ({ ...prev, [key]: e.target.value === '' ? null : Number(e.target.value) }))
                }
                className={SUNKEN_INPUT}
              />
            </label>
          ))}
        </div>
      </div>

      <div className={`${SUNKEN_PANEL} overflow-x-auto`}>
        <table className="w-full text-[11px] font-mono">
          <thead className="bg-slate-100 border-b border-slate-300">
            <tr>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-right">DCQ</th>
              <th className="p-2 text-right">Delivery Vol</th>
              <th className="p-2 text-right">Delivery Energy</th>
              <th className="p-2 text-right">Shortfall Vol</th>
              <th className="p-2 text-right">Excess Vol</th>
            </tr>
          </thead>
          <tbody>
            {mergedRows.map((r) => (
              <tr key={r.reportDate} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-1.5">{r.reportDate}</td>
                <td className="p-1.5 text-right">{fmtNum(r.dcqMmscfd)}</td>
                <td className="p-1.5 text-right">{fmtNum(r.deliveryVolMmscf)}</td>
                <td className="p-1.5 text-right">{fmtNum(r.deliveryEnergyMmbtu)}</td>
                <td className="p-1.5 text-right">{fmtNum(r.shortfallVolMmscf)}</td>
                <td className="p-1.5 text-right">{fmtNum(r.excessVolMmscf)}</td>
              </tr>
            ))}
            {!isLoading && mergedRows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-slate-500">
                  No P5 data (manual or auto-computed) for {reportMonth}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
