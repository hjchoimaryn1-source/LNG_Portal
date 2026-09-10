// src/components/manpower/modals/NewPTWPermitModal.tsx
"use client";

import React from 'react';
import { FileText } from 'lucide-react';
import { PTWPermit, PTWType, StaffPersonnel } from '../../../types/lng';
import { PTW_SOP_FORMS, isGasMeasurementApplicable, validatePTWWorkerEligibility } from '../../../data/ptwMasterData';
import { PLANT_WORK_LOCATIONS } from '../../../data/ptwWorkAreas';
import { CmmsPermitMeta, useCMMSPTWForm } from '../../../hooks/useCMMSPTWForm';
import PRACChecklistSection from './ptw/PRACChecklistSection';
import WorkforcePillPicker from './ptw/WorkforcePillPicker';
import SimopsWarningModal from './ptw/SimopsWarningModal';
import StageOneSummaryFlags from './ptw/StageOneSummaryFlags';

export interface NewPTWPermitModalProps {
  isOpen: boolean;
  onClose: () => void;
  personnelList: StaffPersonnel[];
  sequenceNumber: number;
  // SIMOPS 공간 간섭 판정 대상 — 발급 시점의 활성 permit 목록 (usePTWPermits().permits).
  activePermits: PTWPermit[];
  // Phase 1 stage/status + payloadHash baseline (permit_lock_state) generated
  // alongside the legacy permit — see src/hooks/useCMMSPTWForm.ts.
  onSubmitSuccess: (newPermit: PTWPermit, cmmsMeta: CmmsPermitMeta) => void;
}

export default function NewPTWPermitModal({
  isOpen,
  onClose,
  personnelList,
  sequenceNumber,
  activePermits,
  onSubmitSuccess,
}: NewPTWPermitModalProps) {
  const form = useCMMSPTWForm({ personnelList, sequenceNumber, activePermits, onSubmitSuccess, onClose });

  if (!isOpen) return null;

  const isHighRisk = PTW_SOP_FORMS[form.newPermitType].category === 'CRITICAL HIGH RISK';
  const isGasRequired = isGasMeasurementApplicable(form.newPermitType);

  return (
    <>
    <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="win-panel w-[90vw] max-w-6xl bg-white shadow-2xl border-2 border-blue-950 text-slate-900 rounded-xl overflow-hidden font-sans flex flex-col max-h-[90vh]">
        <div className="bg-blue-950 text-white px-6 py-4 flex justify-between items-center border-b border-blue-800 shrink-0">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 text-xs font-black bg-amber-400 text-blue-950 rounded font-mono shadow-sm">
                SOP [{form.headerFormLabel}]
              </span>
              <span className="font-bold text-base sm:text-lg">
                Create New Permit to Work (PTW) — Stage 1 Draft
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white font-bold px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-sm cursor-pointer transition-colors"
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-5 text-sm overflow-y-auto flex-1">
          {/* 1. PTW Form Type & Plant Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-800">Permit Category (SOP Standard Form)</label>
              <select
                value={form.newPermitType}
                onChange={(e) => form.setNewPermitType(e.target.value as Exclude<PTWType, 'CARGO_HANDLING'>)}
                className="w-full h-10 px-3.5 border border-slate-300 rounded-md font-medium bg-white cursor-pointer shadow-sm"
              >
                {/* CARGO_HANDLING excluded — created only via the dedicated Cargo Handling modal. */}
                {Object.entries(PTW_SOP_FORMS)
                  .filter(([k]) => k !== 'CARGO_HANDLING')
                  .map(([k, def]) => (
                    <option key={k} value={k}>
                      {def.formNumber}: {def.title.split(' (')[0]}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-800">
                Plant Work Location
                <span className="text-xs font-normal text-slate-500 ml-1.5">(Specific plant/site zone)</span>
              </label>
              <select
                value={form.newPermitLocation}
                onChange={(e) => form.setNewPermitLocation(e.target.value)}
                className="w-full h-10 px-3.5 border border-slate-300 rounded-md font-medium bg-white cursor-pointer shadow-sm"
              >
                {PLANT_WORK_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 1b. Equipment / Asset Tag — SIMOPS conflict-matching key alongside PPE Zone */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-800">
              Equipment / Asset Tag
              <span className="text-xs font-normal text-slate-500 ml-1.5">
                (Optional — used for SIMOPS conflict matching, e.g. PRSS-CMP-01)
              </span>
            </label>
            <input
              type="text"
              placeholder="e.g. PRSS-CMP-01"
              value={form.newEquipmentTag}
              onChange={(e) => form.setNewEquipmentTag(e.target.value)}
              className="w-full h-10 px-3.5 border border-slate-300 rounded-md font-medium bg-white shadow-sm"
            />
          </div>

          {/* 1c. Safety & PPE Zone (NP-09 App 01) */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-800">
              Safety & PPE Zone (NP-09)
              <span className="text-xs font-normal text-slate-500 ml-1.5">(App 01 standard 11 English PPE zones)</span>
            </label>
            <select
              value={form.newWorkArea}
              onChange={(e) => form.setNewWorkArea(e.target.value)}
              className="w-full h-10 px-3.5 border border-slate-300 rounded-md font-medium bg-white cursor-pointer shadow-sm"
            >
              {form.availablePpeZones.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Work Description / Title */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-800">Work Description & Scope</label>
            <input
              type="text"
              placeholder="e.g. Precision welding on Flare Header Line 2"
              value={form.newPermitTitle}
              onChange={(e) => form.setNewPermitTitle(e.target.value)}
              className="w-full h-10 px-3.5 border border-slate-300 rounded-md font-medium bg-white shadow-sm"
            />
          </div>

          {/* 3. Personnel: Originator, Work Leader & Workforce */}
          <div className="space-y-4">
            {/* Originator — Read-Only */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-800">
                Originator / Applicant
                <span className="text-xs font-normal text-slate-500 ml-1.5">(Read-Only — Auto-filled from session)</span>
              </label>
              <div className="w-full h-10 px-3.5 flex items-center border border-slate-200 rounded-md bg-slate-50 text-slate-600 font-medium text-sm select-none">
                {form.originatorLabel}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Work Leader */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800">Work Leader</label>
                <select
                  value={form.newWorkLeaderId}
                  onChange={(e) => form.setNewWorkLeaderId(e.target.value)}
                  className="w-full h-10 px-3.5 border border-slate-300 rounded-md font-medium bg-white cursor-pointer shadow-sm"
                >
                  {personnelList.map((m) => {
                    const check = validatePTWWorkerEligibility(m, form.newPermitType);
                    return (
                      <option key={m.id} value={m.id} disabled={!check.isEligible}>
                        {m.name} ({m.role}) {!check.isEligible ? `[⚠️ Ineligible: ${check.reason}]` : '✓ Qualified'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Assigned Workforce — Pill Picker */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800">Assigned Workforce (PJSM Participants)</label>
                <WorkforcePillPicker
                  personnelList={personnelList}
                  permitType={form.newPermitType}
                  selectedIds={form.assignedWorkerIds}
                  onToggle={form.toggleAssignedWorker}
                />
              </div>
            </div>
          </div>

          {/* 4. Stage-1 Derived Summary Flags */}
          <StageOneSummaryFlags isHighRisk={isHighRisk} isGasRequired={isGasRequired} />

          {/* 5. PRAC Checklist Section (NIAS NP-09 §NP09-01) */}
          <PRACChecklistSection />

          {/* 6. Additional Safety Controls */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-lg border border-slate-300">
            <div className="font-bold text-slate-800 text-xs sm:text-sm mb-2">Additional Safety Controls:</div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.newWorkingAtHeight}
                onChange={(e) => form.setNewWorkingAtHeight(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
              Working at Height
            </label>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-3 pt-5 border-t border-slate-200 shrink-0">
            <button
              onClick={onClose}
              className="win-btn px-5 py-2.5 text-xs sm:text-sm font-semibold cursor-pointer hover:bg-slate-200 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={form.handleCreatePermit}
              className="win-btn px-7 py-2.5 text-xs sm:text-sm font-bold bg-blue-900 hover:bg-blue-950 text-white rounded-md cursor-pointer shadow"
            >
              Submit Permit Draft
            </button>
          </div>
        </div>
      </div>
    </div>
    {form.simopsGate && (
      <SimopsWarningModal
        result={form.simopsGate}
        onAcknowledge={form.onSimopsAcknowledge}
        onCancel={form.onSimopsCancel}
        onConfirmOverride={form.onSimopsConfirmOverride}
      />
    )}
    </>
  );
}
