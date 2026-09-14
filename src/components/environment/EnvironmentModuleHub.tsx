// src/components/environment/EnvironmentModuleHub.tsx
//
// Phase 11b Stage 2-E — SCADA tab shell for the NP-10 Environment & Waste module.
// Mounts the Stage 2-C/D pure display components fed by EnvironmentDataContext.

'use client';

import { useState } from 'react';
import { WIN_TAB_ACTIVE, WIN_TAB_INACTIVE } from '../portal/utils/portalTabStyles';
import { useEnvironmentData } from '../../context/EnvironmentDataContext';
import AirQualityLogTable from './AirQualityLogTable';
import WastewaterLogTable from './WastewaterLogTable';
import NoiseLogTable from './NoiseLogTable';
import SeawaterLogTable from './SeawaterLogTable';
import WasteTransferLogTable from './WasteTransferLogTable';
import ThwsInventoryTable from './ThwsInventoryTable';

type EnvironmentHubTab = 'AIR_WATER_NOISE' | 'WASTE_TRANSFER' | 'THWS_INVENTORY';

const TABS: { key: EnvironmentHubTab; label: string }[] = [
  { key: 'AIR_WATER_NOISE', label: 'Air / Water / Noise' },
  { key: 'WASTE_TRANSFER', label: 'Waste Transfer' },
  { key: 'THWS_INVENTORY', label: 'THWS Inventory' },
];

export default function EnvironmentModuleHub() {
  const [activeTab, setActiveTab] = useState<EnvironmentHubTab>('AIR_WATER_NOISE');
  const { airQuality, wastewater, noise, seawater, wasteTransfers, thwsInventory, isLoading } = useEnvironmentData();

  return (
    <div className="flex-1 h-full flex flex-col min-h-0 w-full overflow-hidden">
      <div className="win-panel px-2 py-1.5 flex items-center justify-between shrink-0">
        <span className="text-xs font-mono font-bold text-slate-800 tracking-wide">NP-10 ENVIRONMENT &amp; WASTE</span>
        <span className="text-[10px] font-mono text-slate-600">
          {isLoading
            ? 'LOADING...'
            : `LOGGED: ${airQuality.length + wastewater.length + noise.length + seawater.length}`}
        </span>
      </div>

      <div className="flex gap-1 px-2 pt-2 shrink-0 flex-wrap">
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={activeTab === tab.key ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto win-sunken m-2 p-2">
        {activeTab === 'AIR_WATER_NOISE' && (
          <div className="flex flex-col gap-3">
            <AirQualityLogTable records={airQuality} />
            <WastewaterLogTable records={wastewater} />
            <NoiseLogTable records={noise} />
            <SeawaterLogTable records={seawater} />
          </div>
        )}
        {activeTab === 'WASTE_TRANSFER' && <WasteTransferLogTable records={wasteTransfers} />}
        {activeTab === 'THWS_INVENTORY' && <ThwsInventoryTable records={thwsInventory} />}
      </div>
    </div>
  );
}
