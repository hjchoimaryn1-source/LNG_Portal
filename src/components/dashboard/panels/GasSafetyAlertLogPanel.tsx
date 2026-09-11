// src/components/dashboard/panels/GasSafetyAlertLogPanel.tsx
//
// PURPOSE
//   Overview 대시보드 Panel B. permit_gas_tests(gasTestDao.ts)에서 조회한
//   FAIL 판정 기록(overviewSummaryAdapter.computeRecentGasAlerts)을 실시간
//   로그 형태로 표시한다 — PASS/FAIL 판정(validatePTWGasSafety)은 재구현하지 않는다.

import React from 'react';
import { Flame } from 'lucide-react';
import type { GasTestRecordDraft } from '../../../adapters/ptwFormAdapter';

interface GasSafetyAlertLogPanelProps {
  alerts: GasTestRecordDraft[];
  loading: boolean;
  windowHours: number;
}

export default function GasSafetyAlertLogPanel({ alerts, loading, windowHours }: GasSafetyAlertLogPanelProps) {
  return (
    <div className="win-panel flex flex-col min-h-0 h-full">
      <div className="win-titlebar px-2 py-1 flex items-center gap-1.5">
        <Flame className="w-3.5 h-3.5 text-white" />
        <span className="text-xs font-bold text-white">Real-Time Gas Safety Alert Log (AGT)</span>
        <span className="ml-auto text-[10px] font-mono text-white/80">LAST {windowHours}H</span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto win-sunken">
        <table className="w-full text-left border-collapse font-mono text-[10.5px] win-grid">
          <thead>
            <tr className="bg-slate-200 border-b border-slate-400">
              <th className="p-1.5 border-r border-slate-300">Permit</th>
              <th className="p-1.5 border-r border-slate-300">Type</th>
              <th className="p-1.5 border-r border-slate-300 text-right">LEL%</th>
              <th className="p-1.5 border-r border-slate-300 text-right">O2%</th>
              <th className="p-1.5 border-r border-slate-300 text-right">H2S</th>
              <th className="p-1.5 border-r border-slate-300 text-right">CO</th>
              <th className="p-1.5">Tested At</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="p-3 text-center text-slate-400">로딩 중...</td>
              </tr>
            )}
            {!loading && alerts.length === 0 && (
              <tr>
                <td colSpan={7} className="p-3 text-center text-emerald-700">최근 {windowHours}시간 내 FAIL 기록 없음</td>
              </tr>
            )}
            {!loading &&
              alerts.map((alert, i) => (
                <tr key={`${alert.permitRefNo}-${alert.testedAt}-${i}`} className="border-b border-slate-200 bg-red-50">
                  <td className="p-1.5 font-bold border-r border-slate-300 text-blue-950">{alert.permitRefNo}</td>
                  <td className="p-1.5 border-r border-slate-300">{alert.testType}</td>
                  <td className="p-1.5 border-r border-slate-300 text-right font-bold text-red-700">{alert.lelPercent}</td>
                  <td className="p-1.5 border-r border-slate-300 text-right">{alert.o2Percent}</td>
                  <td className="p-1.5 border-r border-slate-300 text-right">{alert.h2sPpm}</td>
                  <td className="p-1.5 border-r border-slate-300 text-right">{alert.coPpm}</td>
                  <td className="p-1.5 text-slate-600">{alert.testedAt}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
