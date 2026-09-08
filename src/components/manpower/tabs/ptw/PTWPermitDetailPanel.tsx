// src/components/manpower/tabs/ptw/PTWPermitDetailPanel.tsx
"use client";

import React, { useMemo } from 'react';
import { PTWPermit, PTWWorkflowStatus, StaffPersonnel } from '../../../../types/lng';
import { validatePTWGasSafety } from '../../../../data/ptwMasterData';
import PTWWorkflowPipeline from './PTWWorkflowPipeline';
import PTWGasSafetyGate from './PTWGasSafetyGate';
import PTWCompetencyGate from './PTWCompetencyGate';
import PTWSafetyChecklist from './PTWSafetyChecklist';
import PTWStatusActions from './PTWStatusActions';
import CargoHandlingDetailSection from '../../cargoHandling/CargoHandlingDetailSection';

export interface PTWPermitDetailPanelProps {
  activePermit: PTWPermit | null;
  personnelList: StaffPersonnel[];
  isERTMet: boolean;
  onNavigateToMatrix?: (empId: string) => void;
  onUpdateGasReadings: (permitId: string, lel: number, o2: number) => void;
  onTransitionStatus: (permitId: string, nextStatus: PTWWorkflowStatus) => void;
}

export default function PTWPermitDetailPanel({
  activePermit,
  personnelList,
  isERTMet,
  onNavigateToMatrix,
  onUpdateGasReadings,
  onTransitionStatus,
}: PTWPermitDetailPanelProps) {
  const currentGasSafety = useMemo(() => {
    if (!activePermit) return { isSafe: true, blockReason: null };
    return validatePTWGasSafety(activePermit.type, activePermit.gasReadings);
  }, [activePermit]);

  if (!activePermit) {
    return (
      <div className="lg:col-span-7">
        <div className="p-8 text-center text-slate-500 font-mono">No permit selected.</div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-7">
      <div className="win-panel p-2.5 border-2 border-neutral-400 bg-white space-y-2 rounded-none font-mono">
        {/* Header: Permit Summary */}
        <div className="win-titlebar bg-[#0B192C] text-white p-1.5 px-3 flex justify-between items-center rounded-none font-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs tracking-wide">
              [{activePermit.type.replace(/_/g, ' ')} PERMIT] {activePermit.id}
            </span>
          </div>
          <div className="text-[11px] font-mono font-bold bg-[#d4d0c8] text-black px-2 py-0.5 border border-[#808080] rounded-none">
            STATUS: [{activePermit.status}]
          </div>
        </div>

        <PTWWorkflowPipeline currentStatus={activePermit.status} />

        {/* Work Details & Location */}
        <div className="p-2 bg-neutral-50 border border-neutral-300 rounded-none space-y-1 text-xs font-mono">
          <div className="font-bold text-sm text-blue-950">{activePermit.title}</div>
          <div className="text-slate-700 text-[11px] flex justify-between">
            <span>LOC: <strong>{activePermit.location}</strong></span>
            <span>VALID: {activePermit.validFrom} ~ {activePermit.validTo}</span>
          </div>
          <div className="text-slate-600 text-[11px] pt-0.5">
            <strong>HAZARD:</strong> {activePermit.hazardDescription}
          </div>
        </div>

        <PTWGasSafetyGate
          activePermit={activePermit}
          isSafe={currentGasSafety.isSafe}
          blockReason={currentGasSafety.blockReason}
          onUpdateGasReadings={onUpdateGasReadings}
        />

        <PTWCompetencyGate activePermit={activePermit} personnelList={personnelList} onNavigateToMatrix={onNavigateToMatrix} />

        <PTWSafetyChecklist checklist={activePermit.safetyChecklist} />

        {activePermit.cargoHandling && <CargoHandlingDetailSection cargoHandling={activePermit.cargoHandling} />}

        <PTWStatusActions
          activePermit={activePermit}
          isERTMet={isERTMet}
          isGasSafe={currentGasSafety.isSafe}
          gasBlockReason={currentGasSafety.blockReason}
          onTransitionStatus={onTransitionStatus}
        />
      </div>
    </div>
  );
}
