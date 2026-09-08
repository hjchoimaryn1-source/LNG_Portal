// src/components/manpower/tabs/ERTReadinessTab.tsx
"use client";

import React, { useMemo } from 'react';
import { ShieldAlert, ShieldCheck, Users, Wind, FlameKindling, Droplets } from 'lucide-react';
import {
  MOCK_ERT_ASSIGNMENTS,
  MOCK_SCBA_SETS,
  MOCK_EXTINGUISHERS,
  MOCK_EMERGENCY_STATIONS,
  ERT_POSITION_LABEL,
  SCBA_MIN_PRESSURE_BAR,
  computeERTReadinessSummary,
  ERTReadinessStatus,
} from '../../../data/ertReadinessData';

const READINESS_BADGE: Record<ERTReadinessStatus, string> = {
  ALL_READY: 'bg-emerald-800 text-white',
  ATTENTION: 'bg-amber-600 text-white',
  STANDBY: 'bg-red-700 text-white animate-pulse',
};

const READINESS_LABEL: Record<ERTReadinessStatus, string> = {
  ALL_READY: 'ALL READY',
  ATTENTION: 'ATTENTION',
  STANDBY: 'STANDBY',
};

export default function ERTReadinessTab() {
  const summary = useMemo(
    () => computeERTReadinessSummary(MOCK_ERT_ASSIGNMENTS, MOCK_SCBA_SETS, MOCK_EXTINGUISHERS, MOCK_EMERGENCY_STATIONS),
    []
  );

  return (
    <div className="space-y-3 font-sans">
      {/* KPI Summary */}
      <div className="bg-[#e9e6df] border border-slate-400 p-2.5 flex items-center justify-between gap-3 flex-wrap text-xs shadow-sm">
        <div className="flex items-center gap-1.5 font-bold text-slate-900">
          <ShieldAlert className="w-4 h-4 text-cyan-700" />
          <span className="text-sm">ERT Readiness (SOP NP08-33 / NP08-37)</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-blue-900 text-white font-mono font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> POB {summary.totalPOB} / ERT {summary.ertAssignedCount}
          </span>
          <span className="bg-slate-700 text-white font-mono font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
            <Wind className="w-3.5 h-3.5" /> SCBA {summary.scbaReadyCount}/{summary.scbaTotalCount}
          </span>
          <span className="bg-slate-700 text-white font-mono font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
            <FlameKindling className="w-3.5 h-3.5" /> DCP/CO2 {summary.extinguisherGreenCount}/{summary.extinguisherTotalCount}
          </span>
          <span className="bg-slate-700 text-white font-mono font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
            <Droplets className="w-3.5 h-3.5" /> Eye Wash {summary.stationsOperationalCount}/{summary.stationsTotalCount}
          </span>
          <span className={`font-mono font-bold px-2.5 py-0.5 rounded text-[11px] flex items-center gap-1 ${READINESS_BADGE[summary.readinessStatus]}`}>
            <ShieldCheck className="w-3.5 h-3.5" /> {READINESS_LABEL[summary.readinessStatus]}
          </span>
        </div>
      </div>

      {/* ERT Team Assignment Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {MOCK_ERT_ASSIGNMENTS.map((a) => (
          <div key={a.position} className={`win-panel border-2 rounded p-2.5 ${a.isOnSite ? 'border-emerald-400 bg-emerald-50/40' : 'border-red-500 bg-red-50/60'}`}>
            <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">{ERT_POSITION_LABEL[a.position]}</div>
            <div className="font-bold text-sm text-slate-900">{a.name}</div>
            <div className="text-[11px] text-slate-600 mb-1.5">{a.jobTitle}</div>
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-600">{a.radioChannel}</span>
              <span className={`px-1.5 py-0.5 rounded font-bold ${a.isOnSite ? 'bg-emerald-800 text-white' : 'bg-red-700 text-white'}`}>
                {a.isOnSite ? 'ON SITE' : 'VACANT'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Emergency Equipment Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="win-panel border-2 border-slate-400 bg-white overflow-x-auto">
          <div className="bg-slate-800 text-white text-[11px] font-bold px-2 py-1.5">SCBA Air Breathing Sets (Min. {SCBA_MIN_PRESSURE_BAR} bar)</div>
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-[10px] uppercase">
                <th className="px-2 py-1 text-left">Set ID</th>
                <th className="px-2 py-1 text-right">Pressure</th>
                <th className="px-2 py-1 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_SCBA_SETS.map((s) => {
                const ready = s.pressureBar >= SCBA_MIN_PRESSURE_BAR;
                return (
                  <tr key={s.id} className="border-b border-slate-200">
                    <td className="px-2 py-1 font-bold text-blue-950">{s.id}</td>
                    <td className={`px-2 py-1 text-right ${ready ? 'text-emerald-800' : 'text-red-700 font-bold'}`}>{s.pressureBar} bar</td>
                    <td className="px-2 py-1 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${ready ? 'bg-emerald-800 text-white' : 'bg-red-700 text-white animate-pulse'}`}>
                        {ready ? 'GREEN' : 'RED'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="win-panel border-2 border-slate-400 bg-white overflow-x-auto">
          <div className="bg-slate-800 text-white text-[11px] font-bold px-2 py-1.5">DCP / CO2 Extinguishers (Unloading Skid &amp; PRSS)</div>
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-[10px] uppercase">
                <th className="px-2 py-1 text-left">Unit</th>
                <th className="px-2 py-1 text-left">Location</th>
                <th className="px-2 py-1 text-center">Type</th>
                <th className="px-2 py-1 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_EXTINGUISHERS.map((e) => (
                <tr key={e.id} className="border-b border-slate-200">
                  <td className="px-2 py-1 font-bold text-blue-950">{e.id}</td>
                  <td className="px-2 py-1 text-slate-700">{e.tagId}</td>
                  <td className="px-2 py-1 text-center text-slate-600">{e.type}</td>
                  <td className="px-2 py-1 text-center">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      e.status === 'GREEN' ? 'bg-emerald-800 text-white' : e.status === 'DUE' ? 'bg-amber-600 text-white' : 'bg-red-700 text-white animate-pulse'
                    }`}>
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Emergency Stations */}
      <div className="win-panel border-2 border-slate-400 bg-white p-2.5">
        <div className="text-[11px] font-bold text-slate-800 mb-1.5">Emergency Eye Wash &amp; Safety Shower</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {MOCK_EMERGENCY_STATIONS.map((s) => (
            <div key={s.id} className="flex items-center justify-between text-xs font-mono border border-slate-200 rounded px-2 py-1.5">
              <span className="text-slate-700">{s.name} — {s.location}</span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${s.isOperational ? 'bg-emerald-800 text-white' : 'bg-red-700 text-white animate-pulse'}`}>
                {s.isOperational ? 'OPERATIONAL' : 'ATTENTION'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
