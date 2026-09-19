// src/cmms-monthly-report/print/sheets/GrafikPrintView.tsx
//
// PURPOSE
//   Print page for Grafik — the source sheet's native chart object series
//   references Gas Consumption P3 directly (verified via xlsx formula
//   inspection: ='Gas Consumption P3'!$L$15:$L$45), which is itself derived
//   from gas_metering_ledger_daily — so this reuses the same FlobossDailyRow
//   data the Floboss sheet already fetches (useFlobossLedger), no new DAO.
//   recharts (already installed, same pattern as FaceplateSparkline.tsx).

'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts';
import type { FlobossDailyRow } from '../../../gas-metering/dao/gasMeteringLedgerDao';
import { fmtNum } from '../../../components/locations/nias/monthlyReport/utils/monthlyReportFormat';

export interface GrafikPrintViewProps {
  records: FlobossDailyRow[];
}

export function GrafikPrintView({ records }: GrafikPrintViewProps) {
  const ghvValues = records.map((r) => r.ghvStation).filter((v): v is number => v !== null);
  const avgGhv = ghvValues.length ? ghvValues.reduce((a, b) => a + b, 0) / ghvValues.length : null;
  const totalEnergy = useMemo(
    () => records.reduce((sum, r) => sum + (r.dailyMmbtuStation ?? 0), 0),
    [records]
  );

  return (
    <div className="print-page landscape">
      <div className="print-section-header">GRAFIK</div>
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          <LineChart data={records} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="reportDate" tick={{ fontSize: 8 }} />
            <YAxis yAxisId="vol" tick={{ fontSize: 8 }} />
            <YAxis yAxisId="ghv" orientation="right" tick={{ fontSize: 8 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 9 }} />
            <Line yAxisId="vol" type="monotone" dataKey="dailyCvolMmcfStation" name="Station Volume (MMCF)" stroke="#1976D2" dot={false} />
            <Line yAxisId="ghv" type="monotone" dataKey="ghvStation" name="Station GHV (BTU/SCF)" stroke="#D32F2F" dot={false} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <table className="print-field-grid">
        <caption>Monthly Summary</caption>
        <tbody>
          <tr>
            <td>Average GHV (BTU/SCF)</td>
            <td>{fmtNum(avgGhv, 3)}</td>
          </tr>
          <tr>
            <td>Total Energy (MMBTU)</td>
            <td>{fmtNum(totalEnergy)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
