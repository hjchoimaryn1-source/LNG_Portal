// src/components/manpower/tabs/ptw/modals/PTWSignatureModal.tsx
//
// PURPOSE
//   서명 슬롯 1건을 캡처하는 모달. 실제 필적/이미지 서명이 아니라 담당자
//   본인 확인(personnelList에서 선택) + staffId/staffName + timestamp를
//   기록하는 방식 — GasRetestEntryModal.tsx의 AGT 서명 캡처와 동일 관례.

'use client';

import React, { useState } from 'react';
import { PTWSignatureRole, StaffPersonnel } from '../../../../../types/lng';
import { PTW_SIGNATURE_ROLE_LABELS } from '../../../../../data/ptwSignatureRoles';

export interface PTWSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: PTWSignatureRole | null;
  permitId: string;
  personnelList: StaffPersonnel[];
  onSign: (permitId: string, role: PTWSignatureRole, staffId: string, staffName: string) => void;
}

export default function PTWSignatureModal({ isOpen, onClose, role, permitId, personnelList, onSign }: PTWSignatureModalProps) {
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');

  if (!isOpen || !role) return null;

  const selectedStaff = personnelList.find((s) => s.id === selectedStaffId);
  const canSign = !!selectedStaff;

  const handleSign = () => {
    if (!selectedStaff) return;
    onSign(permitId, role, selectedStaff.id, selectedStaff.name);
    setSelectedStaffId('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="max-w-md w-full bg-[#1B242C] border-2 border-[#0B192C] shadow-2xl rounded-none font-mono text-xs text-slate-100 overflow-hidden">
        <div className="bg-[#2A3B4C] text-white font-mono text-sm font-bold text-center py-1.5 flex items-center justify-between px-3">
          <span>ELECTRONIC SIGNATURE — {permitId}</span>
          <button onClick={onClose} className="text-white/80 hover:text-white cursor-pointer px-1">
            ✕
          </button>
        </div>

        <div className="p-3 space-y-2.5">
          <div className="p-2 border border-slate-600 bg-[#0F1620] text-slate-200 font-bold text-[11px]">
            {PTW_SIGNATURE_ROLE_LABELS[role]}
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-0.5">SIGNING STAFF</label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full h-8 px-2 bg-[#0F1620] border border-slate-600 text-slate-100 font-mono text-xs"
            >
              <option value="">-- SELECT STAFF --</option>
              {personnelList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.id}) — {s.role}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-[11px] font-bold bg-slate-700 hover:bg-slate-600 text-white cursor-pointer"
            >
              CANCEL
            </button>
            <button
              onClick={handleSign}
              disabled={!canSign}
              className="px-3 py-1.5 text-[11px] font-bold bg-[#2A3B4C] hover:bg-[#354c62] disabled:opacity-40 disabled:cursor-not-allowed text-white cursor-pointer"
            >
              CONFIRM SIGNATURE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
