// src/components/locations/nias/monthlyReport/NiasMonthlyReportPlnEpiTab.tsx
//
// PURPOSE
//   "MONTHLY REPORT (PLN EPI)" tab container — real 13-sheet-derived rebuild
//   replacing the deleted NiasCustodySettlementTab.tsx mock. Stage 1 scope
//   only: Floboss P1-P8 + the two ISO Tank monthly sheets. Out of scope
//   (HJ-confirmed): Statement of Delivery, Berita Acara Validasi, Grafik,
//   Monthly Report Ops. dashboard.

'use client';

import { useState } from 'react';
import { RAISED_PANEL, SUNKEN_INPUT } from '../../../cmms/scadaStyles';
import FlobossMeteringView from './FlobossMeteringView';
import GasAnalysisPanel from './GasAnalysisPanel';
import GasDeliverySummaryForm from './GasDeliverySummaryForm';
import IsoTankConsumptionView from './IsoTankConsumptionView';
import IsoTankDailyReadingsView from './IsoTankDailyReadingsView';

type SubView = 'FLOBOSS' | 'GAS_ANALYSIS' | 'GAS_DELIVERY' | 'ISO_TANK_CONSUMPTION' | 'ISO_TANK_DAILY';

const SUB_VIEWS: Array<{ key: SubView; label: string }> = [
  { key: 'FLOBOSS', label: 'Floboss Metering (P1-P4)' },
  { key: 'GAS_ANALYSIS', label: 'Gas Analysis (P8)' },
  { key: 'GAS_DELIVERY', label: 'Gas Delivery Summary (P5)' },
  { key: 'ISO_TANK_CONSUMPTION', label: 'ISO Tank Consumption' },
  { key: 'ISO_TANK_DAILY', label: 'ISO Tank Daily Readings' },
];

export default function NiasMonthlyReportPlnEpiTab() {
  const [reportMonth, setReportMonth] = useState('2026-07');
  const [subView, setSubView] = useState<SubView>('FLOBOSS');

  return (
    <div className="w-full space-y-3 font-sans pb-10">
      <div className={`${RAISED_PANEL} p-2 flex flex-wrap items-center gap-2`}>
        <span className="text-xs font-mono font-bold text-slate-700">MONTHLY REPORT (PLN EPI)</span>
        <span className="text-[10px] font-mono text-slate-500">Month:</span>
        <input
          type="month"
          value={reportMonth}
          onChange={(e) => setReportMonth(e.target.value)}
          className={`${SUNKEN_INPUT} w-36`}
        />
        <div className="flex flex-wrap gap-1 ml-auto">
          {SUB_VIEWS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSubView(key)}
              className={`px-2.5 py-1 text-[10px] font-bold font-mono cursor-pointer border ${
                subView === key
                  ? 'bg-[#0284c7] text-white border-[#0369a1]'
                  : 'bg-[#e2e8f0] hover:bg-slate-300 text-slate-900 border-slate-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {subView === 'FLOBOSS' && <FlobossMeteringView reportMonth={reportMonth} />}
      {subView === 'GAS_ANALYSIS' && <GasAnalysisPanel reportMonth={reportMonth} />}
      {subView === 'GAS_DELIVERY' && <GasDeliverySummaryForm reportMonth={reportMonth} />}
      {subView === 'ISO_TANK_CONSUMPTION' && <IsoTankConsumptionView reportMonth={reportMonth} />}
      {subView === 'ISO_TANK_DAILY' && <IsoTankDailyReadingsView reportMonth={reportMonth} />}
    </div>
  );
}
