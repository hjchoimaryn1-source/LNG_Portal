// src/components/manpower/tabs/GasTestingLogTab.tsx
"use client";

import React, { useMemo } from 'react';
import { Wind, ShieldCheck, ShieldAlert, Clock } from 'lucide-react';
import {
  MOCK_GAS_TEST_READINGS,
  GAS_TEST_ZONE_LABEL,
  evaluateGasTestReading,
  computeGasTestingStats,
  GasTestSeverity,
} from '../../../data/gasTestingLogData';

const SEVERITY_BADGE: Record<GasTestSeverity, string> = {
  SAFE: 'bg-emerald-800 text-white',
  CAUTION: 'bg-amber-600 text-white',
  DANGER: 'bg-red-700 text-white animate-pulse',
};

const SEVERITY_LABEL: Record<GasTestSeverity, string> = {
  SAFE: 'SAFE',
  CAUTION: 'CAUTION',
  DANGER: 'DANGER',
};

function cellTone(isSafe: boolean): string {
  return isSafe ? 'text-emerald-800' : 'text-red-700 font-bold';
}

export default function GasTestingLogTab() {
  const readings = MOCK_GAS_TEST_READINGS;
  const stats = useMemo(() => computeGasTestingStats(readings), [readings]);

  return (
    <div className="space-y-3 font-sans">
      {/* KPI Summary */}
      <div className="bg-[#e9e6df] border border-slate-400 p-2.5 flex items-center justify-between gap-3 flex-wrap text-xs shadow-sm">
        <div className="flex items-center gap-1.5 font-bold text-slate-900">
          <Wind className="w-4 h-4 text-cyan-700" />
          <span className="text-sm">Gas Testing Log (SOP NP08-15) — Unloading &amp; Vaporizer AGT Register</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-blue-900 text-white font-mono font-bold px-2 py-0.5 rounded text-[11px]">
            {stats.total} Readings Logged
          </span>
          <span className="bg-emerald-800 text-white font-mono font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> {stats.safeCount} Safe
          </span>
          <span className="bg-amber-600 text-white font-mono font-bold px-2 py-0.5 rounded text-[11px]">
            {stats.cautionCount} Caution
          </span>
          <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1 ${
            stats.dangerCount > 0 ? 'bg-red-700 text-white animate-pulse' : 'bg-slate-500 text-white'
          }`}>
            <ShieldAlert className="w-3.5 h-3.5" /> {stats.dangerCount} Danger
          </span>
          {stats.lastTestedAt && (
            <span className="flex items-center gap-1 text-[11px] font-mono text-slate-700">
              <Clock className="w-3.5 h-3.5" /> Last Test: {stats.lastTestedAt.slice(11, 16)}
            </span>
          )}
        </div>
      </div>

      {/* Data Grid */}
      <div className="win-panel border-2 border-slate-400 bg-white overflow-x-auto">
        <table className="w-full text-xs font-mono border-collapse">
          <thead>
            <tr className="bg-slate-800 text-white text-[10px] uppercase">
              <th className="px-2 py-1.5 text-left">Zone</th>
              <th className="px-2 py-1.5 text-left">Tag</th>
              <th className="px-2 py-1.5 text-center">Cycle</th>
              <th className="px-2 py-1.5 text-right">LEL %</th>
              <th className="px-2 py-1.5 text-right">O2 %</th>
              <th className="px-2 py-1.5 text-right">H2S ppm</th>
              <th className="px-2 py-1.5 text-right">CO ppm</th>
              <th className="px-2 py-1.5 text-center">Atmosphere</th>
              <th className="px-2 py-1.5 text-left">Tested By</th>
            </tr>
          </thead>
          <tbody>
            {readings.map((r) => {
              const evalResult = evaluateGasTestReading(r);
              return (
                <tr key={r.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-2 py-1.5 text-slate-800">{GAS_TEST_ZONE_LABEL[r.zone]}</td>
                  <td className="px-2 py-1.5 font-bold text-blue-950">{r.tagId}</td>
                  <td className="px-2 py-1.5 text-center text-slate-600">{r.cycleTime}</td>
                  <td className={`px-2 py-1.5 text-right ${cellTone(evalResult.lelSeverity === 'SAFE')}`}>
                    {r.lelPercent.toFixed(1)}
                  </td>
                  <td className={`px-2 py-1.5 text-right ${cellTone(evalResult.o2Safe)}`}>
                    {r.o2Percent.toFixed(1)}
                  </td>
                  <td className={`px-2 py-1.5 text-right ${cellTone(evalResult.h2sSafe)}`}>{r.h2sPpm}</td>
                  <td className={`px-2 py-1.5 text-right ${cellTone(evalResult.coSafe)}`}>{r.coPpm}</td>
                  <td className="px-2 py-1.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${SEVERITY_BADGE[evalResult.overallSeverity]}`}>
                      {SEVERITY_LABEL[evalResult.overallSeverity]}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-slate-600">{r.testedBy}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
