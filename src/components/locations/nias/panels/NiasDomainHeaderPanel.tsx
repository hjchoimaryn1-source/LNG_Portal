// src/components/locations/nias/panels/NiasDomainHeaderPanel.tsx
import React from 'react';
import { ActiveBayState } from '../../../../types/lng';
import { NiasDomain } from '../../NiasTerminalView';
import type { useNiasZoneTankViews } from '../hooks/useNiasZoneTankViews';

type ZoneStats = ReturnType<typeof useNiasZoneTankViews>['zoneStats'];

export interface NiasDomainHeaderPanelProps {
  activeDomain: NiasDomain;
  setActiveDomain: React.Dispatch<React.SetStateAction<NiasDomain>>;
  zoneStats: ZoneStats;
  activeBays: ActiveBayState[];
}

/**
 * Top Header & Operational Domain Navigation (PAGT Arun Matching Industrial Style).
 * Pure presentational panel — extracted verbatim from NiasTerminalView (lines 927-965).
 */
export default function NiasDomainHeaderPanel({
  activeDomain,
  setActiveDomain,
  zoneStats,
  activeBays,
}: NiasDomainHeaderPanelProps) {
  return (
    <section className="shrink-0 win-panel px-3 py-1.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 select-none">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-black text-blue-950 tracking-tight">
            NIAS Regas Unit Process
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="bg-[#002b4d] text-white text-[11px] font-mono font-bold px-2.5 py-0.5 border border-slate-700 shadow-sm">
            NIAS Inventory: {zoneStats.yard1.tanks.length + activeBays.filter((b) => b.tankNo).length + zoneStats.yard2.tanks.length} Tanks
          </span>
        </div>
      </div>

      {/* 2-Domain Switcher Navigation (PAGT Arun Style SCADA Tabs) */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setActiveDomain('ISO_TANK_MGMT')}
          className={`px-3 py-1 text-xs font-bold font-mono transition-all cursor-pointer ${activeDomain === 'ISO_TANK_MGMT'
            ? 'win-tab-active text-blue-900'
            : 'win-tab-inactive'
            }`}
        >
          ISO Tank Management
        </button>
        <button
          type="button"
          onClick={() => setActiveDomain('REGAS_SYSTEM')}
          className={`px-3 py-1 text-xs font-bold font-mono transition-all cursor-pointer ${activeDomain === 'REGAS_SYSTEM'
            ? 'win-tab-active text-blue-900'
            : 'win-tab-inactive'
            }`}
        >
          Regas &amp; Power
        </button>
      </div>
    </section>
  );
}
