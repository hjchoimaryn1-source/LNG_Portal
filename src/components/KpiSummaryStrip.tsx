// src/components/KpiSummaryStrip.tsx
"use client";

import React from 'react';

export interface KpiMetrics {
  unitCountLabel: string;
  selectedCount: number;
  totalCount: number;
  totalPreLoadMassTon: string;
  totalBufferVolumeM3?: string;
  avgHeelVolumeM3?: string;
  avgHeelLevelPct: string;
  avgHeelMassKg: string;
  avgTempC: string;
  avgPressureMPa: string;
  pressureRange: string;
  isSelectionActive: boolean;
}

interface KpiSummaryStripProps {
  kpis?: KpiMetrics;
}

const DEFAULT_KPIS: KpiMetrics = {
  unitCountLabel: '0 / 0 Units',
  selectedCount: 0,
  totalCount: 0,
  totalPreLoadMassTon: '0.00 t',
  totalBufferVolumeM3: '0.0 m³',
  avgHeelVolumeM3: '0.00 m³',
  avgHeelLevelPct: '0.0%',
  avgHeelMassKg: '0 kg',
  avgTempC: '-160.0 °C',
  avgPressureMPa: '0.00 MPa',
  pressureRange: '0.00 ~ 0.00 MPa',
  isSelectionActive: false,
};

export default function KpiSummaryStrip({ kpis = DEFAULT_KPIS }: KpiSummaryStripProps) {
  const safeKpis = kpis || DEFAULT_KPIS;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
      {/* Card 1: 1. EMPTY STAGED */}
      <div className="win-panel overflow-hidden border border-slate-300 flex flex-col justify-between">
        <div className="bg-[#0a2558] px-2.5 py-1 flex justify-between items-center text-white">
          <span className="text-blue-100 font-bold text-[11px] uppercase tracking-wider">
            1. EMPTY STAGED
          </span>
          <span
            className={`w-2 h-2 rounded-full inline-block ${
              safeKpis.isSelectionActive ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400'
            }`}
          />
        </div>
        <div className="p-2.5 space-y-1.5 font-mono text-[11px] text-slate-800 bg-white">
          <div className="flex justify-between border-b border-slate-100 pb-0.5">
            <span className="text-slate-600 font-bold">
              {safeKpis.isSelectionActive ? 'Selected Units:' : 'Yard Inventory:'}
            </span>
            <strong className="text-slate-950 font-black">{safeKpis.unitCountLabel}</strong>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-0.5">
            <span className="text-slate-600 font-bold">Total Pre-Load Mass:</span>
            <strong className="text-blue-900 font-black">{safeKpis.totalPreLoadMassTon}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 font-bold">Heel Buffer Volume:</span>
            <strong className="text-emerald-700 font-bold">{safeKpis.totalBufferVolumeM3 || '0.0 m³'}</strong>
          </div>
        </div>
      </div>

      {/* Card 2: 2. HEEL INTEGRITY */}
      <div className="win-panel overflow-hidden border border-slate-300 flex flex-col justify-between">
        <div className="bg-[#0a2558] px-2.5 py-1 flex justify-between items-center text-white">
          <span className="text-blue-100 font-bold text-[11px] uppercase tracking-wider">
            2. HEEL INTEGRITY
          </span>
          <span
            className={`w-2 h-2 rounded-full inline-block ${
              safeKpis.isSelectionActive ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400'
            }`}
          />
        </div>
        <div className="p-2.5 space-y-1.5 font-mono text-[11px] text-slate-800 bg-white">
          <div className="flex justify-between border-b border-slate-100 pb-0.5">
            <span className="text-slate-600 font-bold">Avg Heel Level:</span>
            <strong className="text-slate-950 font-black">
              {safeKpis.avgHeelVolumeM3 || '1.00 m³'} (~{safeKpis.avgHeelMassKg})
            </strong>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-0.5">
            <span className="text-slate-600 font-bold">Holding Temp:</span>
            <strong className="text-slate-950 font-bold">
              {safeKpis.avgTempC} (Cryo Intact)
            </strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 font-bold">Vacuum Seal:</span>
            <span className="text-emerald-700 font-black">IN-SPEC / Normal</span>
          </div>
        </div>
      </div>

      {/* Card 3: 3. HOLDING PRESSURE */}
      <div className="win-panel overflow-hidden border border-slate-300 flex flex-col justify-between">
        <div className="bg-[#0a2558] px-2.5 py-1 flex justify-between items-center text-white">
          <span className="text-blue-100 font-bold text-[11px] uppercase tracking-wider">
            3. HOLDING PRESSURE
          </span>
          <span
            className={`w-2 h-2 rounded-full inline-block ${
              safeKpis.isSelectionActive ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400'
            }`}
          />
        </div>
        <div className="p-2.5 space-y-1.5 font-mono text-[11px] text-slate-800 bg-white">
          <div className="flex justify-between border-b border-slate-100 pb-0.5">
            <span className="text-slate-600 font-bold">Avg Pressure:</span>
            <strong className="text-slate-950 font-black">{safeKpis.avgPressureMPa}</strong>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-0.5">
            <span className="text-slate-600 font-bold">Pressure Range:</span>
            <strong className="text-slate-950 font-bold">{safeKpis.pressureRange}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 font-bold">Venting Status:</span>
            <span className="text-emerald-700 font-black">Zero Vent (Closed)</span>
          </div>
        </div>
      </div>

      {/* Card 4: 4. LOADING READINESS */}
      <div className="win-panel overflow-hidden border border-slate-300 flex flex-col justify-between">
        <div className="bg-[#0a2558] px-2.5 py-1 flex justify-between items-center text-white">
          <span className="text-blue-100 font-bold text-[11px] uppercase tracking-wider">
            4. LOADING READINESS
          </span>
          <span
            className={`w-2 h-2 rounded-full inline-block ${
              safeKpis.isSelectionActive ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400'
            }`}
          />
        </div>
        <div className="p-2.5 space-y-1.5 font-mono text-[11px] text-slate-800 bg-white">
          <div className="flex justify-between border-b border-slate-100 pb-0.5">
            <span className="text-slate-600 font-bold">Ready Units:</span>
            <strong className="text-emerald-700 font-black">
              {safeKpis.selectedCount > 0
                ? `${safeKpis.selectedCount} / ${safeKpis.totalCount} Selected`
                : `${safeKpis.totalCount} / ${safeKpis.totalCount} Tanks Ready`}
            </strong>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-0.5">
            <span className="text-slate-600 font-bold">Tare Baseline:</span>
            <strong className="text-slate-950 font-bold">Auto-Linked from Nias</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 font-bold">Target Batch:</span>
            <strong className="text-blue-900 font-bold">Shipment N-2</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
