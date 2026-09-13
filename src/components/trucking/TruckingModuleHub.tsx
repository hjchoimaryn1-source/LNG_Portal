// src/components/trucking/TruckingModuleHub.tsx
//
// Phase 11a Stage 2-C — SCADA tab shell for the NP-03 Trucking module.
// Mounts the Stage 1 components only (import + render, no logic duplication).
// TruckingDataContext consumption is deferred to Stage 2-D (context created there).

'use client';

import { useState } from 'react';
import { WIN_TAB_ACTIVE, WIN_TAB_INACTIVE } from '../portal/utils/portalTabStyles';
import { useTruckingData } from '../../context/TruckingDataContext';
import { PreOperationChecklist } from '../../cmms-trucking/components/PreOperationChecklist';
import { VehicleSecurityChecklist } from '../../cmms-trucking/components/VehicleSecurityChecklist';
import { PreOpsTruckIsoTankChecklist } from '../../cmms-trucking/components/PreOpsTruckIsoTankChecklist';
import { PeriodicInspectionLog } from '../../cmms-trucking/components/PeriodicInspectionLog';
import { TrafficMgmtVerificationSection } from '../../cmms-trucking/components/TrafficMgmtVerificationSection';
import { PostTransitConditionReport } from '../../cmms-trucking/components/PostTransitConditionReport';

type TruckingHubTab = 'PRE_OP' | 'PERIODIC' | 'TRAFFIC_MGMT' | 'POST_TRANSIT';

const TABS: { key: TruckingHubTab; label: string }[] = [
  { key: 'PRE_OP', label: 'Pre-Op Checklist' },
  { key: 'PERIODIC', label: 'Periodic Inspection' },
  { key: 'TRAFFIC_MGMT', label: 'Traffic Mgmt Verification' },
  { key: 'POST_TRANSIT', label: 'Post-Transit' },
];

interface TruckingModuleHubProps {
  onOpenSopReference?: (target: string) => void;
}

export default function TruckingModuleHub({ onOpenSopReference }: TruckingModuleHubProps) {
  const [activeTab, setActiveTab] = useState<TruckingHubTab>('PRE_OP');
  const { inspections, isLoading } = useTruckingData();

  return (
    <div className="flex-1 h-full flex flex-col min-h-0 w-full overflow-hidden">
      <div className="win-panel px-2 py-1.5 flex items-center justify-between shrink-0">
        <span className="text-xs font-mono font-bold text-slate-800 tracking-wide">NP-03 TRUCKING &amp; LOGISTICS</span>
        <span className="text-[10px] font-mono text-slate-600">
          {isLoading ? 'LOADING...' : `LOGGED: ${inspections.length}`}
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
        {activeTab === 'PRE_OP' && (
          <div className="flex flex-col gap-3">
            <PreOperationChecklist />
            <VehicleSecurityChecklist />
            <PreOpsTruckIsoTankChecklist />
          </div>
        )}
        {activeTab === 'PERIODIC' && <PeriodicInspectionLog />}
        {activeTab === 'TRAFFIC_MGMT' && <TrafficMgmtVerificationSection onOpenSopReference={onOpenSopReference} />}
        {activeTab === 'POST_TRANSIT' && <PostTransitConditionReport onOpenSopReference={onOpenSopReference} />}
      </div>
    </div>
  );
}
