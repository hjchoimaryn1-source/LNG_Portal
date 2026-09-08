// src/components/manpower/tabs/ptw/PTWPermitDetailPanel.tsx
"use client";

import React, { useMemo } from 'react';
import { PTWPermit, PTWWorkflowStatus, StaffPersonnel } from '../../../../types/lng';
import { PTW_SOP_FORMS, validatePTWGasSafety } from '../../../../data/ptwMasterData';
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
      <div className="win-panel p-3 border-2 border-slate-400 bg-white space-y-3">
        {/* Header: Permit Summary */}
        <div className="win-titlebar bg-blue-950 text-white p-2 px-3 flex justify-between items-center rounded-t">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${PTW_SOP_FORMS[activePermit.type].colorBg} ${PTW_SOP_FORMS[activePermit.type].colorText}`}>
              {activePermit.formNumber} ({activePermit.type})
            </span>
            <span className="font-bold text-sm">{activePermit.id}</span>
          </div>
          <div className="text-xs font-mono font-bold bg-white text-blue-950 px-2 py-0.5 rounded">
            STATUS: [{activePermit.status}]
          </div>
        </div>

        <PTWWorkflowPipeline currentStatus={activePermit.status} />

        {/* Work Details & Location */}
        <div className="p-2.5 bg-slate-50 border border-slate-300 rounded space-y-1 text-xs">
          <div className="font-bold text-sm text-blue-950">{activePermit.title}</div>
          <div className="text-slate-700 font-mono text-[11px] flex justify-between">
            <span>Location: <strong>{activePermit.location}</strong></span>
            <span>Validity: {activePermit.validFrom} ~ {activePermit.validTo}</span>
          </div>
          <div className="text-slate-600 text-[11px] pt-1">
            <strong>Hazard Scope:</strong> {activePermit.hazardDescription}
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
