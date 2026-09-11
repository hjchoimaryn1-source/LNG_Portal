// src/components/portal/EquipmentRegistryView.tsx
"use client";

import React from 'react';
import { ClipboardList } from 'lucide-react';

export function EquipmentRegistryView({ filter = 'ALL' }: { filter?: string }) {
  const allAssets = [
    { tag: 'AAV-101', type: 'PLANT', name: 'Ambient Air Vaporizer Train 1 (Duty A)', loc: 'Nias Regas Unit', maker: 'Cryonorm B.V.', crit: 'Class A (Critical)', lastMaint: '2026-06-15', status: 'RUNNING' },
    { tag: 'AAV-102', type: 'PLANT', name: 'Ambient Air Vaporizer Train 1 (Duty B)', loc: 'Nias Regas Unit', maker: 'Cryonorm B.V.', crit: 'Class A (Critical)', lastMaint: '2026-06-15', status: 'RUNNING' },
    { tag: 'AAV-103', type: 'PLANT', name: 'Ambient Air Vaporizer Train 2 (Duty A)', loc: 'Nias Regas Unit', maker: 'Cryonorm B.V.', crit: 'Class A (Critical)', lastMaint: '2026-07-02', status: 'RUNNING' },
    { tag: 'AAV-104', type: 'PLANT', name: 'Ambient Air Vaporizer Train 2 (Duty B)', loc: 'Nias Regas Unit', maker: 'Cryonorm B.V.', crit: 'Class A (Critical)', lastMaint: '2026-07-02', status: 'RUNNING' },
    { tag: 'PRSS-01', type: 'PLANT', name: 'Pressure Reduction & Metering Skid (0.35 MPa)', loc: 'Nias Regas Unit', maker: 'Emerson Process', crit: 'Class A (Critical)', lastMaint: '2026-05-20', status: 'RUNNING' },
    { tag: 'GC-ABB-01', type: 'INSTRUMENTS', name: 'Process Gas Chromatograph (C1-C6+ GHV)', loc: 'Nias Regas Unit', maker: 'ABB Danalyzer', crit: 'Class B (Major)', lastMaint: '2026-07-25', status: 'CALIBRATED' },
    { tag: 'GEN-01..05', type: 'PLANT', name: 'MAN 7L 51/60 DF Gas Engines (5 x 7.35MW)', loc: 'PLTMG Nias Power Hall', maker: 'MAN Energy Solutions', crit: 'Class A (Critical)', lastMaint: '2026-07-10', status: 'DISPATCHED' },
    { tag: 'ISO-FLEET-120', type: 'ISO_TANK', name: '20ft T75 Cryogenic ISO Containers (120 Units)', loc: 'Virtual Pipeline Fleet', maker: 'CIMC / U-LBC', crit: 'Class A (Critical)', lastMaint: 'Continuous', status: 'ACTIVE' },
    { tag: 'PT-101..104', type: 'INSTRUMENTS', name: 'Cryogenic Pressure Transmitters (0-1.6 MPa)', loc: '4-Bay Vaporizer Header', maker: 'Yokogawa EJX', crit: 'Class B (Major)', lastMaint: '2026-06-20', status: 'VERIFIED' },
  ];

  const assets = filter === 'ALL' ? allAssets : allAssets.filter((a) => a.type === filter);

  return (
    <div className="h-full flex flex-col min-h-0 gap-1.5 w-full win-panel p-2 overflow-hidden">
      <div className="win-titlebar px-2 py-1">
        <span className="text-xs font-bold text-white flex items-center gap-1.5">
          <ClipboardList className="w-3.5 h-3.5" />
          Equipment & Asset Registry - Plant Master Asset Hierarchy (NIAS CMMS)
        </span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto win-sunken">
        <table className="w-full text-left border-collapse font-mono text-[11px] win-grid">
          <thead>
            <tr className="bg-slate-200 border-b border-slate-400">
              <th className="p-1.5 border-r border-slate-300">Asset Tag</th>
              <th className="p-1.5 border-r border-slate-300">Equipment Description</th>
              <th className="p-1.5 border-r border-slate-300">Operational Site</th>
              <th className="p-1.5 border-r border-slate-300">OEM Manufacturer</th>
              <th className="p-1.5 border-r border-slate-300">Criticality</th>
              <th className="p-1.5 border-r border-slate-300">Last Overhaul</th>
              <th className="p-1.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((a, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white hover:bg-slate-100' : 'bg-slate-50 hover:bg-slate-100'}>
                <td className="p-1.5 font-bold border-r border-slate-300 text-blue-950">{a.tag}</td>
                <td className="p-1.5 font-medium border-r border-slate-300">{a.name}</td>
                <td className="p-1.5 border-r border-slate-300">{a.loc}</td>
                <td className="p-1.5 border-r border-slate-300">{a.maker}</td>
                <td className="p-1.5 border-r border-slate-300 font-bold text-slate-800">{a.crit}</td>
                <td className="p-1.5 border-r border-slate-300">{a.lastMaint}</td>
                <td className="p-1.5 text-center font-bold text-emerald-800 bg-emerald-50">{a.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
