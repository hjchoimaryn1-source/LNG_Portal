// src/components/admin/modals/EditPersonnelModal.tsx
'use client';

import { useState } from 'react';
import { RAISED_PANEL, SUNKEN_INPUT, BEVEL_BUTTON, TITLE_BAR } from '../../cmms/scadaStyles';
import type { PersonnelRecord, UpdatePersonnelInput } from '../hooks/usePersonnelList';

const DEPARTMENT_GROUPS = ['ADMIN', 'SITE_MANAGER', 'OP_TEAM', 'HSSE', 'MAINTENANCE', 'LOGISTIC', 'HR'];

export interface EditPersonnelModalProps {
  person: PersonnelRecord;
  onClose: () => void;
  onSubmit: (employeeId: string, update: UpdatePersonnelInput) => Promise<string | null>;
}

export default function EditPersonnelModal({ person, onClose, onSubmit }: EditPersonnelModalProps) {
  const [positionTitle, setPositionTitle] = useState(person.positionTitle);
  const [departmentGroup, setDepartmentGroup] = useState(person.departmentGroup);
  const [contactNo, setContactNo] = useState(person.contactNo ?? '');
  const [remarks, setRemarks] = useState(person.remarks ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    const err = await onSubmit(person.employeeId, {
      positionTitle,
      departmentGroup,
      contactNo: contactNo.trim() || null,
      remarks: remarks.trim() || null,
    });
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className={`${RAISED_PANEL} max-w-md w-full`}>
        <div className={`${TITLE_BAR} flex justify-between items-center`}>
          <span>인력 정보 수정 — {person.employeeId}</span>
          <button onClick={onClose} className="text-white/80 hover:text-white">✕</button>
        </div>
        <div className="p-4 space-y-2">
          {error && <div className="text-[11px] text-red-600 font-bold">{error}</div>}
          <div className="text-[11px] text-slate-500">{person.fullName}</div>
          <label className="block text-[11px] font-bold text-slate-700">Position Title</label>
          <input value={positionTitle} onChange={(e) => setPositionTitle(e.target.value)} className={`${SUNKEN_INPUT} w-full`} />
          <label className="block text-[11px] font-bold text-slate-700">Department Group</label>
          <select value={departmentGroup} onChange={(e) => setDepartmentGroup(e.target.value)} className={`${SUNKEN_INPUT} w-full`}>
            {DEPARTMENT_GROUPS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <label className="block text-[11px] font-bold text-slate-700">Contact No</label>
          <input value={contactNo} onChange={(e) => setContactNo(e.target.value)} className={`${SUNKEN_INPUT} w-full`} />
          <label className="block text-[11px] font-bold text-slate-700">Remarks</label>
          <input value={remarks} onChange={(e) => setRemarks(e.target.value)} className={`${SUNKEN_INPUT} w-full`} />

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className={BEVEL_BUTTON}>취소</button>
            <button onClick={handleSubmit} disabled={submitting} className={BEVEL_BUTTON}>저장</button>
          </div>
        </div>
      </div>
    </div>
  );
}
