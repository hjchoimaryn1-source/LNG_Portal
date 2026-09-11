// src/components/dashboard/panels/GasSafetyAlertLogPanel.tsx
//
// PURPOSE
//   Overview 대시보드 Panel B. permit_gas_tests(gasTestDao.ts)에서 조회한 최근
//   windowHours 내 측정 기록(overviewSummaryAdapter.computeRecentGasAlerts, PASS/FAIL
//   모두 포함)을 실시간 로그 형태로 표시한다 — useOverviewSummary.ts가 10초 간격으로
//   재조회하므로 이 패널은 받은 alerts를 그대로 렌더링만 한다. PASS/FAIL 판정
//   (validatePTWGasSafety)은 재구현하지 않으며, 컬럼별 임계치 강조는 순수 분류 함수
//   gasThresholdSeverity.ts에 위임한다.

import React, { useMemo, useState } from 'react';
import { Flame } from 'lucide-react';
import type { GasTestRecordDraft } from '../../../adapters/ptwFormAdapter';
import { classifyGasThresholdBreach } from '../../../utils/gasThresholdSeverity';
import { BEVEL_BUTTON, BEVEL_BUTTON_PRESSED } from '../../cmms/scadaStyles';

interface GasSafetyAlertLogPanelProps {
  alerts: GasTestRecordDraft[];
  loading: boolean;
  windowHours: number;
}

type LogFilterMode = 'LAST_24H' | 'CRITICAL_ONLY';

const BREACH_CELL = 'text-red-700 font-bold bg-red-100 animate-pulse';

export default function GasSafetyAlertLogPanel({ alerts, loading, windowHours }: GasSafetyAlertLogPanelProps) {
  const [filterMode, setFilterMode] = useState<LogFilterMode>('LAST_24H');

  const visibleAlerts = useMemo(() => {
    if (filterMode !== 'CRITICAL_ONLY') return alerts;
    return alerts.filter((alert) => classifyGasThresholdBreach(alert).isCritical);
  }, [alerts, filterMode]);

  return (
    <div className="win-panel flex flex-col min-h-0 h-full">
      <div className="win-titlebar px-2 py-1 flex items-center gap-1.5">
        <Flame className="w-3.5 h-3.5 text-white" />
        <span className="text-xs font-bold text-white">Real-Time Gas Safety Alert Log (AGT)</span>
        <span className="ml-auto text-[10px] font-mono text-white/80">LAST {windowHours}H</span>
      </div>
      <div className="flex items-center gap-1.5 px-1.5 py-1 border-b border-slate-300 bg-[#d4d0c8]">
        <button
          onClick={() => setFilterMode('LAST_24H')}
          className={`${filterMode === 'LAST_24H' ? BEVEL_BUTTON_PRESSED : BEVEL_BUTTON} !text-[10px] !py-0.5`}
        >
          Last 24 Hours
        </button>
        <button
          onClick={() => setFilterMode('CRITICAL_ONLY')}
          className={`${filterMode === 'CRITICAL_ONLY' ? BEVEL_BUTTON_PRESSED : BEVEL_BUTTON} !text-[10px] !py-0.5`}
        >
          Critical Non-Conformances Only
        </button>
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
            {!loading && visibleAlerts.length === 0 && (
              <tr>
                <td colSpan={7} className="p-3 text-center text-emerald-700">
                  {filterMode === 'CRITICAL_ONLY'
                    ? `최근 ${windowHours}시간 내 임계치 초과 기록 없음`
                    : `최근 ${windowHours}시간 내 측정 기록 없음`}
                </td>
              </tr>
            )}
            {!loading &&
              visibleAlerts.map((alert, i) => {
                const breach = classifyGasThresholdBreach(alert);
                return (
                  <tr
                    key={`${alert.permitRefNo}-${alert.testedAt}-${i}`}
                    className={`border-b border-slate-200 ${breach.isCritical ? 'bg-red-50' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                  >
                    <td className="p-1.5 font-bold border-r border-slate-300 text-blue-950">{alert.permitRefNo}</td>
                    <td className="p-1.5 border-r border-slate-300">{alert.testType}</td>
                    <td className={`p-1.5 border-r border-slate-300 text-right ${breach.lelBreach ? BREACH_CELL : ''}`}>
                      {alert.lelPercent}
                    </td>
                    <td className={`p-1.5 border-r border-slate-300 text-right ${breach.o2Breach ? BREACH_CELL : ''}`}>
                      {alert.o2Percent}
                    </td>
                    <td className={`p-1.5 border-r border-slate-300 text-right ${breach.h2sBreach ? BREACH_CELL : ''}`}>
                      {alert.h2sPpm}
                    </td>
                    <td className={`p-1.5 border-r border-slate-300 text-right ${breach.coBreach ? BREACH_CELL : ''}`}>
                      {alert.coPpm}
                    </td>
                    <td className="p-1.5 text-slate-600">{alert.testedAt}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
