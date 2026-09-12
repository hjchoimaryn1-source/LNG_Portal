// src/components/locations/nias/panels/NiasSubTabsNavPanel.tsx
import React from 'react';
import { NiasDomain, NiasTankSubTab, NiasRegasSubTab } from '../../NiasTerminalView';

export interface NiasSubTabsNavPanelProps {
  activeDomain: NiasDomain;
  tankSubTab: NiasTankSubTab;
  setTankSubTab: React.Dispatch<React.SetStateAction<NiasTankSubTab>>;
  regasSubTab: NiasRegasSubTab;
  setRegasSubTab: React.Dispatch<React.SetStateAction<NiasRegasSubTab>>;
  disputeCount: number;
}

/**
 * Sub-Tabs Bar (Contextual to Selected Domain).
 * Pure presentational panel — extracted verbatim from NiasTerminalView (lines 967-1069).
 */
export default function NiasSubTabsNavPanel({
  activeDomain,
  tankSubTab,
  setTankSubTab,
  regasSubTab,
  setRegasSubTab,
  disputeCount,
}: NiasSubTabsNavPanelProps) {
  return (
    <div className="shrink-0 win-panel px-2 py-1 flex items-center justify-between border-t-0 border-[#808080] overflow-x-auto">
      {activeDomain === 'ISO_TANK_MGMT' ? (
        <div className="flex items-center gap-1 text-xs font-bold overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setTankSubTab('TANK_OVERVIEW')}
            className={`px-2.5 py-1 text-xs font-bold font-mono cursor-pointer ${tankSubTab === 'TANK_OVERVIEW' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'
              }`}
          >
            ISO TK Position
          </button>

          <button
            type="button"
            onClick={() => setTankSubTab('LAYDOWN_1_2_LOG')}
            className={`px-2.5 py-1 text-xs font-bold font-mono cursor-pointer ${tankSubTab === 'LAYDOWN_1_2_LOG' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'
              }`}
          >
            ISO TK - LOG
          </button>

          <button
            type="button"
            onClick={() => setTankSubTab('ACTIVE_BAY_TANKS')}
            className={`px-2.5 py-1 text-xs font-bold font-mono cursor-pointer ${tankSubTab === 'ACTIVE_BAY_TANKS' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'
              }`}
          >
            ORU ( ISO TK - SKID )
          </button>

          <button
            type="button"
            onClick={() => setTankSubTab('LAYDOWN_3_HEEL')}
            className={`px-2.5 py-1 text-xs font-bold font-mono cursor-pointer ${tankSubTab === 'LAYDOWN_3_HEEL' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'
              }`}
          >
            ORU ( LD - 2 )
          </button>

          <button
            type="button"
            onClick={() => setTankSubTab('TANK_MASS_BALANCE')}
            className={`px-2.5 py-1 text-xs font-bold font-mono cursor-pointer ${tankSubTab === 'TANK_MASS_BALANCE' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'
              }`}
          >
            Mass Balance
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-xs font-bold overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setRegasSubTab('GAS_PROCESS_TELEMETRY')}
            className={`px-2.5 py-1 text-xs font-bold font-mono cursor-pointer ${regasSubTab === 'GAS_PROCESS_TELEMETRY' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'
              }`}
          >
            GAS PROCESS
          </button>

          <button
            type="button"
            onClick={() => setRegasSubTab('GC_GAS_QUALITY')}
            className={`px-2.5 py-1 text-xs font-bold font-mono cursor-pointer ${regasSubTab === 'GC_GAS_QUALITY' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'
              }`}
          >
            GAS METERING - LOG
          </button>

          <button
            type="button"
            onClick={() => setRegasSubTab('GAS_METERING_LEDGER')}
            className={`px-2.5 py-1 text-xs font-bold font-mono cursor-pointer ${regasSubTab === 'GAS_METERING_LEDGER' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'
              }`}
          >
            GAS METERING (LEDGER)
          </button>

          <button
            type="button"
            onClick={() => setRegasSubTab('PLTMG_POWER_OUTPUT')}
            className={`px-2.5 py-1 text-xs font-bold font-mono cursor-pointer ${regasSubTab === 'PLTMG_POWER_OUTPUT' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'
              }`}
          >
            PLTMG POWER
          </button>

          <button
            type="button"
            onClick={() => setRegasSubTab('CUSTODY_HEAT_SETTLEMENT')}
            className={`px-2.5 py-1 text-xs font-bold font-mono cursor-pointer ${regasSubTab === 'CUSTODY_HEAT_SETTLEMENT' ? 'win-tab-active text-blue-950' : 'win-tab-inactive'
              }`}
          >
            MONTHLY REPORT
            {disputeCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-red-600 text-white font-mono text-[9px] font-bold">
                {disputeCount} Alert
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
