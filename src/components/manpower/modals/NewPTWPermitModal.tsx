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

export interface NewPTWPermitModalProps {
  isOpen: boolean;
  onClose: () => void;
  personnelList: StaffPersonnel[];
  sequenceNumber: number;
  // Phase 1 stage/status + payloadHash baseline (permit_lock_state) generated
  // alongside the legacy permit — see src/hooks/useCMMSPTWForm.ts.
  onSubmitSuccess: (newPermit: PTWPermit, cmmsMeta: CmmsPermitMeta) => void;
}

export default function NewPTWPermitModal({
  isOpen,
  onClose,
  personnelList,
  sequenceNumber,
  onSubmitSuccess,
}: NewPTWPermitModalProps) {
  const form = useCMMSPTWForm({ personnelList, sequenceNumber, onSubmitSuccess, onClose });

  if (!isOpen) return null;

  const isHighRisk = PTW_SOP_FORMS[form.newPermitType].category === 'CRITICAL HIGH RISK';
  const isGasRequired = isGasMeasurementApplicable(form.newPermitType);

  return (
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
                onChange={(e) => form.setNewPermitType(e.target.value as PTWType)}
                className="w-full h-10 px-3.5 border border-slate-300 rounded-md font-medium bg-white cursor-pointer shadow-sm"
              >
                {Object.entries(PTW_SOP_FORMS).map(([k, def]) => (
                  <option key={k} value={k}>
                    {def.formNumber}: {def.title.split(' (')[0]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-800">
                Plant Work Location / Equipment Tag
                <span className="text-xs font-normal text-slate-500 ml-1.5">(Specific equipment / Tag location)</span>
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

          {/* 1b. Safety & PPE Zone (NP-09 App 01) */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between p-3 bg-white rounded-md border border-slate-200">
              <span className="font-semibold text-slate-700">High-Risk Activity:</span>
              <span className={`px-2.5 py-1 text-xs font-bold rounded ${
                isHighRisk ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-slate-100 text-slate-700 border border-slate-300'
              }`}>
                {isHighRisk ? 'YES (High Risk)' : 'NO (Standard Risk)'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded-md border border-slate-200">
              <span className="font-semibold text-slate-700">Gas Test Required:</span>
              <span className={`px-2.5 py-1 text-xs font-bold rounded ${
                isGasRequired ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-600 border border-slate-300'
              }`}>
                {isGasRequired ? 'YES' : 'N/A'}
              </span>
            </div>
          </div>

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
  );
}
