// src/components/manpower/tabs/ptw/PTWPermitDetailPanel.tsx
"use client";

import React, { useMemo } from 'react';
import { GasTestLogEntryInput, PTWPermit, PTWSignatureRole, PTWWorkflowStatus, StaffPersonnel } from '../../../../types/lng';
import { PTW_SOP_FORMS, validatePTWGasSafety } from '../../../../data/ptwMasterData';
import { getCargoHandlingSOPInfo } from '../../../../data/ptwCargoHandlingRules';
import PTWWorkflowPipeline from './PTWWorkflowPipeline';
import PTWGasSafetyGate from './PTWGasSafetyGate';
import PTWCompetencyGate from './PTWCompetencyGate';
import PTWSafetyChecklist from './PTWSafetyChecklist';
import PTWSignatureStatusPanel from './PTWSignatureStatusPanel';
import PTWStatusActions from './PTWStatusActions';
import CargoHandlingDetailSection from '../../cargoHandling/CargoHandlingDetailSection';

export interface PTWPermitDetailPanelProps {
  activePermit: PTWPermit | null;
  personnelList: StaffPersonnel[];
  isERTMet: boolean;
  onNavigateToMatrix?: (empId: string) => void;
  onUpdateGasReadings: (permitId: string, lel: number, o2: number) => void;
  onAddGasTestLogEntry: (permitId: string, entryInput: GasTestLogEntryInput) => void;
  onAddSignature: (permitId: string, role: PTWSignatureRole, staffId: string, staffName: string) => void;
  onTransitionStatus: (permitId: string, nextStatus: PTWWorkflowStatus) => void;
}

export default function PTWPermitDetailPanel({
  activePermit,
  personnelList,
  isERTMet,
  onNavigateToMatrix,
  onUpdateGasReadings,
  onAddGasTestLogEntry,
  onAddSignature,
  onTransitionStatus,
}: PTWPermitDetailPanelProps) {
  const currentGasSafety = useMemo(() => {
    if (!activePermit) return { isSafe: true, blockReason: null };
    return validatePTWGasSafety(activePermit.type, activePermit.gasReadings);
  }, [activePermit]);

  const sopFormBadge = useMemo(() => {
    if (!activePermit) return '';
    if (activePermit.type === 'CARGO_HANDLING') {
      const activityType = activePermit.cargoHandling?.activityType ?? 'COMBINED';
      return getCargoHandlingSOPInfo(activityType)
        .map((f) => f.formNumber)
        .join(' / ');
    }
    return PTW_SOP_FORMS[activePermit.type].formNumber;
  }, [activePermit]);

  if (!activePermit) {
    return (
      <div className="lg:col-span-7">
        <div className="bg-neutral-200/60 border border-neutral-400 p-8 text-center text-slate-500 font-mono rounded-none">
          No permit selected.
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-7">
      <div className="bg-neutral-200/60 border border-neutral-400 p-2 space-y-2 rounded-none font-mono">
        {/* Header: Permit Summary */}
        <div className="bg-[#2A3B4C] text-white p-2 px-3 flex justify-between items-center rounded-none font-mono border border-[#2A3B4C]">
          <span className="w-20 hidden sm:inline-block" />
          <span className="font-bold text-xs tracking-wider text-center text-white font-mono flex-1">
            [{activePermit.type.replace(/_/g, ' ')} PERMIT] {activePermit.id}
          </span>
          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-[11px] font-mono font-bold bg-amber-300 text-black px-2 py-0.5 border border-[#808080] rounded-none shrink-0">
              SOP [{sopFormBadge}]
            </span>
            <span className="text-[11px] font-mono font-bold bg-[#d4d0c8] text-black px-2 py-0.5 border border-[#808080] rounded-none shrink-0">
              STATUS: [{activePermit.status}]
            </span>
          </div>
        </div>

        <PTWWorkflowPipeline currentStatus={activePermit.status} />

        {/* Block 1: Work Details & Location Table */}
        <div className="border border-neutral-300 bg-white rounded-none overflow-hidden font-mono text-xs">
          <table className="table-fixed w-full border-collapse">
            <thead className="bg-[#8A9EA7] text-slate-900 font-bold text-xs h-7 uppercase tracking-wider border-b border-neutral-300">
              <tr>
                <th className="w-28 text-center py-1 px-2 border-r border-neutral-300">PARAMETER</th>
                <th className="text-left py-1 px-2">VALUE / SPECIFICATION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-300">
              <tr className="bg-[#ebe7df]">
                <td className="w-28 text-center font-bold text-slate-900 py-1 px-2 border-r border-neutral-300">[TASK]</td>
                <td className="py-1 px-2 font-bold text-blue-950 truncate" title={activePermit.title}>{activePermit.title}</td>
              </tr>
              <tr className="bg-[#f4f1ea]">
                <td className="w-28 text-center font-bold text-slate-900 py-1 px-2 border-r border-neutral-300">[LOCATION]</td>
                <td className="py-1 px-2 text-slate-800">{activePermit.location}</td>
              </tr>
              <tr className="bg-[#ebe7df]">
                <td className="w-28 text-center font-bold text-slate-900 py-1 px-2 border-r border-neutral-300">[WORK AREA]</td>
                <td className="py-1 px-2 text-slate-800">{activePermit.workArea ?? 'N/A'}</td>
              </tr>
              <tr className="bg-[#f4f1ea]">
                <td className="w-28 text-center font-bold text-slate-900 py-1 px-2 border-r border-neutral-300">[RESP. PERSON]</td>
                <td className="py-1 px-2 text-slate-800">{activePermit.responsiblePerson ?? 'N/A'}</td>
              </tr>
              <tr className="bg-[#ebe7df]">
                <td className="w-28 text-center font-bold text-slate-900 py-1 px-2 border-r border-neutral-300">[HEIGHT WORK]</td>
                <td className="py-1 px-2 text-slate-800">
                  {activePermit.safetyChecklist.workingAtHeight === undefined
                    ? 'N/A'
                    : activePermit.safetyChecklist.workingAtHeight
                      ? 'YES'
                      : 'NA'}
                </td>
              </tr>
              <tr className="bg-[#f4f1ea]">
                <td className="w-28 text-center font-bold text-slate-900 py-1 px-2 border-r border-neutral-300">[VALIDITY]</td>
                <td className="py-1 px-2 text-slate-800">{activePermit.validFrom} ~ {activePermit.validTo}</td>
              </tr>
              <tr className="bg-[#ebe7df]">
                <td className="w-28 text-center font-bold text-slate-900 py-1 px-2 border-r border-neutral-300">[HAZARD]</td>
                <td className="py-1 px-2 text-slate-700">{activePermit.hazardDescription}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <PTWGasSafetyGate
          activePermit={activePermit}
          personnelList={personnelList}
          isSafe={currentGasSafety.isSafe}
          blockReason={currentGasSafety.blockReason}
          onUpdateGasReadings={onUpdateGasReadings}
          onAddGasTestLogEntry={onAddGasTestLogEntry}
        />

        {/* Block 3 & Block 4: Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <PTWCompetencyGate activePermit={activePermit} personnelList={personnelList} onNavigateToMatrix={onNavigateToMatrix} />
          <PTWSafetyChecklist checklist={activePermit.safetyChecklist} />
        </div>

        {activePermit.cargoHandling && <CargoHandlingDetailSection cargoHandling={activePermit.cargoHandling} />}

        <PTWSignatureStatusPanel
          activePermit={activePermit}
          personnelList={personnelList}
          onAddSignature={onAddSignature}
        />

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
