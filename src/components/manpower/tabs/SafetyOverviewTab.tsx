// src/components/manpower/tabs/SafetyOverviewTab.tsx
"use client";

import React, { useMemo } from 'react';
import { ShieldAlert, Activity, Radio, Siren, Clock, AlertTriangle } from 'lucide-react';
import {
  MOCK_PLANT_SAFETY_ZONES,
  MOCK_SAFETY_ACTIONS,
  computeSafetyOverviewKpis,
  ZoneSafetyStatus,
  ActionUrgency,
} from '../../../data/safetyOverviewData';

const ZONE_BADGE: Record<ZoneSafetyStatus, string> = {
  SAFE: 'bg-emerald-800 text-white',
  CAUTION: 'bg-amber-600 text-white',
  ALERT: 'bg-red-700 text-white animate-pulse',
};

const ZONE_BORDER: Record<ZoneSafetyStatus, string> = {
  SAFE: 'border-emerald-400 bg-emerald-50/40',
  CAUTION: 'border-amber-400 bg-amber-50/50',
  ALERT: 'border-red-500 bg-red-50/60',
};

const ACTION_ICON: Record<ActionUrgency, string> = {
  RETEST_DUE: 'bg-cyan-700 text-white',
  EXPIRY_IMMINENT: 'bg-amber-600 text-white',
};

const ACTION_LABEL: Record<ActionUrgency, string> = {
  RETEST_DUE: 'RETEST DUE',
  EXPIRY_IMMINENT: 'EXPIRY IMMINENT',
};

export default function SafetyOverviewTab() {
  const kpis = useMemo(() => computeSafetyOverviewKpis(), []);

  return (
    <div className="space-y-3 font-sans">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="win-panel border-2 border-red-500 bg-red-50/60 rounded p-2.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-red-800 mb-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Active High Risk
          </div>
          <div className="text-2xl font-black text-red-900 font-mono">{kpis.activeHighRiskCount}</div>
          <div className="text-[10px] text-slate-600">Hot Work / Confined Space (ACTIVE)</div>
        </div>

        <div className="win-panel border-2 border-cyan-600 bg-cyan-50/50 rounded p-2.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-cyan-800 mb-1">
            <Activity className="w-3.5 h-3.5" /> AGT Atmosphere Safe
          </div>
          <div className="text-2xl font-black text-cyan-900 font-mono">{kpis.agtSafeRatePercent}%</div>
          <div className="text-[10px] text-slate-600">Gas Testing Log Safe Rate</div>
        </div>

        <div className={`win-panel border-2 rounded p-2.5 ${kpis.simopsAlertCount > 0 ? 'border-amber-500 bg-amber-50/60' : 'border-slate-400 bg-slate-50'}`}>
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-amber-800 mb-1">
            <Siren className="w-3.5 h-3.5" /> SIMOPS Alerts
          </div>
          <div className="text-2xl font-black text-amber-900 font-mono">{kpis.simopsAlertCount}</div>
          <div className="text-[10px] text-slate-600">Zones w/ 2+ Concurrent Works</div>
        </div>

        <div className="win-panel border-2 border-emerald-500 bg-emerald-50/50 rounded p-2.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-emerald-800 mb-1">
            <Radio className="w-3.5 h-3.5" /> ERT Dispatch Ready
          </div>
          <div className="text-2xl font-black text-emerald-900 font-mono">{kpis.ertDispatchReadyRatePercent}%</div>
          <div className="text-[10px] text-slate-600">ERT Position Coverage</div>
        </div>
      </div>

      {/* Plant Safety Zone Matrix */}
      <div className="win-panel border-2 border-slate-400 bg-white p-2.5">
        <div className="text-[11px] font-bold text-slate-800 mb-2 font-mono">Plant Safety Zone Matrix</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {MOCK_PLANT_SAFETY_ZONES.map((zone) => (
            <div key={zone.id} className={`border-2 rounded p-2.5 ${ZONE_BORDER[zone.status]}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-slate-900">{zone.name}</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${ZONE_BADGE[zone.status]}`}>{zone.status}</span>
              </div>
              <div className="text-[11px] font-mono text-slate-700 mb-1">Ongoing Work: {zone.ongoingWorkCount}</div>
              <div className="text-[10px] text-slate-600">{zone.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions Needed */}
      <div className="win-panel border-2 border-slate-400 bg-white p-2.5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 mb-2 font-mono">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-700" /> Actions Needed
        </div>
        <div className="space-y-1.5">
          {MOCK_SAFETY_ACTIONS.map((action) => (
            <div key={action.id} className="flex items-center justify-between gap-2 border border-slate-200 rounded px-2 py-1.5 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold ${ACTION_ICON[action.urgency]}`}>
                  {ACTION_LABEL[action.urgency]}
                </span>
                <span className="font-bold text-blue-950 font-mono shrink-0">{action.permitId}</span>
                <span className="text-slate-700 truncate">{action.description}</span>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-mono text-slate-500 shrink-0">
                <Clock className="w-3 h-3" /> {action.dueAt}
              </span>
            </div>
          ))}
          {MOCK_SAFETY_ACTIONS.length === 0 && (
            <div className="text-center text-slate-500 text-xs py-3">No pending safety actions.</div>
          )}
        </div>
      </div>
    </div>
  );
}
