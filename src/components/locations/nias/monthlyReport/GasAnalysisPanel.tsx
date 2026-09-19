// src/components/locations/nias/monthlyReport/GasAnalysisPanel.tsx
//
// PURPOSE
//   "Gas Analysis P8" read-only view — single monthly composition snapshot
//   (confirmed grain via direct cell/formula inspection, Monthly Report
//   Step 0: no formulas, no per-day dimension on the source sheet).

'use client';

import { RAISED_PANEL, TITLE_BAR } from '../../../cmms/scadaStyles';
import { useGasCompositionSnapshot } from './hooks/useMonthlyReportData';
import { fmtNum, fmtText } from './utils/monthlyReportFormat';

export interface GasAnalysisPanelProps {
  reportMonth: string;
}

const COMPONENT_ROWS: Array<{ label: string; key: 'molMethane' | 'molEthane' | 'molPropane' | 'molIbutane' | 'molNbutane' | 'molIpentane' | 'molNpentane' | 'molHexanePlus' | 'molNitrogen' | 'molCo2' }> = [
  { label: 'Methane', key: 'molMethane' },
  { label: 'Ethane', key: 'molEthane' },
  { label: 'Propane', key: 'molPropane' },
  { label: 'i-Butane', key: 'molIbutane' },
  { label: 'n-Butane', key: 'molNbutane' },
  { label: 'i-Pentane', key: 'molIpentane' },
  { label: 'n-Pentane', key: 'molNpentane' },
  { label: 'Hexane+', key: 'molHexanePlus' },
  { label: 'Nitrogen', key: 'molNitrogen' },
  { label: 'Carbon Dioxide', key: 'molCo2' },
];

export default function GasAnalysisPanel({ reportMonth }: GasAnalysisPanelProps) {
  const { snapshot, isLoading, error } = useGasCompositionSnapshot(reportMonth);

  return (
    <div className="space-y-2">
      <div className={TITLE_BAR}>GAS ANALYSIS (P8) — Monthly Composition Snapshot</div>

      {error && <div className="p-2 text-[11px] text-red-700 font-bold">Failed to load gas analysis: {error}</div>}

      {!isLoading && !snapshot && (
        <div className={`${RAISED_PANEL} p-4 text-center text-[11px] text-slate-500`}>
          No gas composition snapshot found for {reportMonth}.
        </div>
      )}

      {snapshot && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className={`${RAISED_PANEL} p-3`}>
            <div className="text-[10px] font-bold text-slate-600 uppercase mb-2">
              Component / Mol Fraction (%) — Method: {fmtText(snapshot.method)}
            </div>
            <table className="w-full text-[11px] font-mono">
              <tbody>
                {COMPONENT_ROWS.map(({ label, key }) => (
                  <tr key={key} className="border-b border-slate-100">
                    <td className="p-1.5">{label}</td>
                    <td className="p-1.5 text-right font-bold">{fmtNum(snapshot[key])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={`${RAISED_PANEL} p-3 space-y-2`}>
            <div className="text-[10px] font-bold text-slate-600 uppercase">Derived Values</div>
            <div className="flex justify-between text-[11px] font-mono border-b border-slate-100 p-1.5">
              <span>Mix Gas Heating Value</span>
              <span className="font-bold">{fmtNum(snapshot.ghvBtuScf, 3)} BTU/SCF</span>
            </div>
            <div className="flex justify-between text-[11px] font-mono border-b border-slate-100 p-1.5">
              <span>Specific Gravity</span>
              <span className="font-bold">{fmtNum(snapshot.specificGravity)}</span>
            </div>
            <div className="flex justify-between text-[11px] font-mono p-1.5">
              <span>As-Of Date</span>
              <span className="font-bold">{fmtText(snapshot.asOfDate)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
