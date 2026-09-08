// src/components/manpower/modals/NewPTWPermitModal.tsx
"use client";

import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { PTWPermit, PTWType, StaffPersonnel } from '../../../types/lng';
import { PTW_SOP_FORMS, validatePTWWorkerEligibility } from '../../../data/ptwMasterData';

export interface NewPTWPermitModalProps {
  isOpen: boolean;
  onClose: () => void;
  personnelList: StaffPersonnel[];
  sequenceNumber: number;
  onSubmitSuccess: (newPermit: PTWPermit) => void;
}

export default function NewPTWPermitModal({
  isOpen,
  onClose,
  personnelList,
  sequenceNumber,
  onSubmitSuccess,
}: NewPTWPermitModalProps) {
  const [newPermitType, setNewPermitType] = useState<PTWType>('HOT_WORK');
  const [newPermitTitle, setNewPermitTitle] = useState<string>('');
  const [newPermitLocation, setNewPermitLocation] = useState<string>('Vaporization Skid #1');
  const [newWorkLeaderId, setNewWorkLeaderId] = useState<string>('EMP-005');
  const [newWorkerId, setNewWorkerId] = useState<string>('EMP-006');
  const [newGasLel, setNewGasLel] = useState<number>(0.0);
  const [newGasO2, setNewGasO2] = useState<number>(20.9);

  if (!isOpen) return null;

  const handleCreatePermit = () => {
    if (!newPermitTitle.trim()) {
      alert('Please enter a permit work title.');
      return;
    }

    const leader = personnelList.find((s) => s.id === newWorkLeaderId);
    const worker = personnelList.find((s) => s.id === newWorkerId);
    if (!leader || !worker) return;

    const leaderCheck = validatePTWWorkerEligibility(leader, newPermitType);
    const workerCheck = validatePTWWorkerEligibility(worker, newPermitType);

    if (!leaderCheck.isEligible) {
      alert(`Work Leader (${leader.name}) is disqualified: ${leaderCheck.reason}`);
      return;
    }
    if (!workerCheck.isEligible) {
      alert(`Assigned Worker (${worker.name}) is disqualified: ${workerCheck.reason}`);
      return;
    }

    const formDef = PTW_SOP_FORMS[newPermitType];
    const newId = `PTW-2026-0901-${String(sequenceNumber).padStart(2, '0')}`;

    const newPermit: PTWPermit = {
      id: newId,
      formNumber: formDef.formNumber,
      type: newPermitType,
      title: newPermitTitle,
      location: newPermitLocation,
      status: 'DRAFT',
      workLeaderId: leader.id,
      workLeaderName: leader.name,
      assignedWorkerIds: [worker.id],
      assignedWorkerNames: [worker.name],
      agtStaffId: 'EMP-013',
      approverStaffId: 'EMP-001',
      gasReadings: {
        lelPercent: newGasLel,
        o2Percent: newGasO2,
        h2sPpm: 0.0,
        coPpm: 0.0,
        testedAt: '2026-09-01 12:00 WIB',
        isSafeForWork: newPermitType === 'HOT_WORK' ? newGasLel === 0 : newGasO2 >= 19.5 && newGasO2 <= 23.5,
      },
      safetyChecklist: {
        fireWatchAssigned: newPermitType === 'HOT_WORK',
        gasDetectorContinuous: true,
        lotoApplied: newPermitType === 'ELECTRICAL',
        forcedVentilation: newPermitType === 'CONFINED_SPACE',
        ppeVerified: true,
        barricadeSet: true,
      },
      validFrom: '2026-09-01 13:00',
      validTo: '2026-09-01 18:00',
      emergencyProtocol: 'Radio Channel 1 Emergency Channel Active',
      createdAt: '2026-09-01 12:00',
      hazardDescription: `${formDef.category} protocol active under SOP ${formDef.formNumber}.`,
    };

    onSubmitSuccess(newPermit);
    setNewPermitTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="win-panel max-w-xl w-full bg-white shadow-2xl border-2 border-blue-950 text-slate-900 rounded-xl overflow-hidden font-sans">
        <div className="bg-blue-950 text-white px-5 py-3.5 flex justify-between items-center border-b border-blue-800">
          <span className="font-bold text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400 shrink-0" />
            <span>신규 작업허가서 발행 (Issue New PTW Form)</span>
          </span>
          <button
            onClick={onClose}
            className="text-white font-bold p-1 px-2.5 bg-slate-800 hover:bg-slate-700 rounded text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-3.5 text-xs sm:text-sm">
          {/* 1. PTW Form Type Selection */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-800">1. 작업허가서 분류 (SOP PTW Form Type):</label>
            <select
              value={newPermitType}
              onChange={(e) => setNewPermitType(e.target.value as PTWType)}
              className="w-full h-9 px-3 border border-slate-300 rounded font-medium bg-white cursor-pointer"
            >
              {Object.entries(PTW_SOP_FORMS).map(([k, def]) => (
                <option key={k} value={k}>
                  {def.formNumber}: {def.title}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Work Title */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-800">2. 작업 명칭 (Work Description / Title):</label>
            <input
              type="text"
              placeholder="e.g. Laydown-2 Flare Header Pipe Tie-in Welding"
              value={newPermitTitle}
              onChange={(e) => setNewPermitTitle(e.target.value)}
              className="w-full h-9 px-3 border border-slate-300 rounded font-medium bg-white"
            />
          </div>

          {/* 3. Location */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-800">3. 작업 구역 (Plant Location / Area):</label>
            <select
              value={newPermitLocation}
              onChange={(e) => setNewPermitLocation(e.target.value)}
              className="w-full h-9 px-3 border border-slate-300 rounded font-medium bg-white cursor-pointer"
            >
              <option value="Vaporization Skid #1 (PRSS Area)">Vaporization Skid #1 (PRSS Area)</option>
              <option value="Loading Bay 01 & 02">Loading Bay 01 & 02</option>
              <option value="Laydown Area 2 & Flare Header">Laydown Area 2 & Flare Header</option>
              <option value="ORU Sump Pit Area">ORU Sump Pit Area</option>
              <option value="Main Substation MCC-01">Main Substation MCC-01</option>
              <option value="Marine Jetty LNG Transfer Header">Marine Jetty LNG Transfer Header</option>
            </select>
          </div>

          {/* 4. Work Leader Assignment (Gatekeeper Checked) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-bold text-slate-800">4. 작업 책임자 (Work Leader):</label>
              <select
                value={newWorkLeaderId}
                onChange={(e) => setNewWorkLeaderId(e.target.value)}
                className="w-full h-9 px-2 border border-slate-300 rounded font-medium bg-white cursor-pointer"
              >
                {personnelList.map((m) => {
                  const check = validatePTWWorkerEligibility(m, newPermitType);
                  return (
                    <option key={m.id} value={m.id} disabled={!check.isEligible}>
                      {m.name} ({m.role}) {!check.isEligible ? `[⚠️ ${check.reason}]` : '✓ Valid'}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-800">5. 배정 작업원 (Worker):</label>
              <select
                value={newWorkerId}
                onChange={(e) => setNewWorkerId(e.target.value)}
                className="w-full h-9 px-2 border border-slate-300 rounded font-medium bg-white cursor-pointer"
              >
                {personnelList.map((m) => {
                  const check = validatePTWWorkerEligibility(m, newPermitType);
                  return (
                    <option key={m.id} value={m.id} disabled={!check.isEligible}>
                      {m.name} ({m.role}) {!check.isEligible ? `[⚠️ Disqualified]` : '✓ Valid'}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* 5. Gas Reading Initial Verification */}
          <div className="bg-slate-50 p-3 rounded border border-slate-300 space-y-2">
            <div className="font-bold text-slate-800 text-xs">Initial Gas Test Reading:</div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <label>LEL (%):</label>
                <input
                  type="number"
                  step="0.1"
                  value={newGasLel}
                  onChange={(e) => setNewGasLel(parseFloat(e.target.value) || 0)}
                  className="w-full h-8 px-2 border border-slate-300 rounded bg-white"
                />
              </div>
              <div>
                <label>O2 (%):</label>
                <input
                  type="number"
                  step="0.1"
                  value={newGasO2}
                  onChange={(e) => setNewGasO2(parseFloat(e.target.value) || 20.9)}
                  className="w-full h-8 px-2 border border-slate-300 rounded bg-white"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              onClick={onClose}
              className="win-btn px-4 py-1.5 text-xs font-semibold cursor-pointer hover:bg-slate-200 rounded"
            >
              취소 (Cancel)
            </button>
            <button
              onClick={handleCreatePermit}
              className="win-btn px-5 py-1.5 text-xs font-bold bg-blue-900 hover:bg-blue-950 text-white rounded cursor-pointer"
            >
              발행 및 등록 (Submit Draft)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
