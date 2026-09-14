// src/components/moc/MocModuleHub.tsx
//
// Phase 11c Stage 2-E — SCADA tab shell for the NP-12 Management of Change module.
// Mounts the Stage 2-C pure display components fed by MocDataContext.

'use client';

import { useState } from 'react';
import { WIN_TAB_ACTIVE, WIN_TAB_INACTIVE } from '../portal/utils/portalTabStyles';
import { useMocData } from '../../context/MocDataContext';
import PlanOfChangeTable from './PlanOfChangeTable';
import CompletionReportTable from './CompletionReportTable';

type MocHubTab = 'PLAN_OF_CHANGE' | 'COMPLETION_REPORT';

const TABS: { key: MocHubTab; label: string }[] = [
  { key: 'PLAN_OF_CHANGE', label: 'Plan of Change' },
  { key: 'COMPLETION_REPORT', label: 'Completion Report' },
];

export default function MocModuleHub() {
  const [activeTab, setActiveTab] = useState<MocHubTab>('PLAN_OF_CHANGE');
  const { plansOfChange, completionReports, isLoading } = useMocData();

  return (
    <div className="flex-1 h-full flex flex-col min-h-0 w-full overflow-hidden">
      <div className="win-panel px-2 py-1.5 flex items-center justify-between shrink-0">
        <span className="text-xs font-mono font-bold text-slate-800 tracking-wide">NP-12 MANAGEMENT OF CHANGE</span>
        <span className="text-[10px] font-mono text-slate-600">
          {isLoading ? 'LOADING...' : `LOGGED: ${plansOfChange.length + completionReports.length}`}
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
        {activeTab === 'PLAN_OF_CHANGE' && <PlanOfChangeTable records={plansOfChange} />}
        {activeTab === 'COMPLETION_REPORT' && <CompletionReportTable records={completionReports} />}
      </div>
    </div>
  );
}
