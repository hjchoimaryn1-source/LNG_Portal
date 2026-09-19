// src/components/admin/modals/AddPersonnelModal.tsx
'use client';

import { useState } from 'react';
import { RAISED_PANEL, SUNKEN_INPUT, BEVEL_BUTTON, TITLE_BAR } from '../../cmms/scadaStyles';
import type { CreatePersonnelInput } from '../hooks/usePersonnelList';

const DEPARTMENT_GROUPS = ['ADMIN', 'SITE_MANAGER', 'OP_TEAM', 'HSSE', 'MAINTENANCE', 'LOGISTIC', 'HR'];

export interface AddPersonnelModalProps {
  onClose: () => void;
  onSubmit: (input: CreatePersonnelInput) => Promise<string | null>;
}

export default function AddPersonnelModal({ onClose, onSubmit }: AddPersonnelModalProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [fullName, setFullName] = useState('');
  const [positionTitle, setPositionTitle] = useState('');
  const [departmentGroup, setDepartmentGroup] = useState('OP_TEAM');
  const [contactNo, setContactNo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!employeeId.trim() || !fullName.trim() || !positionTitle.trim()) {
      setError('employeeId / fullName / positionTitle은 필수입니다.');
      return;
    }
    setSubmitting(true);
    const err = await onSubmit({
      employeeId: employeeId.trim(),
      fullName: fullName.trim(),
      positionTitle: positionTitle.trim(),
      departmentGroup,
      contactNo: contactNo.trim() || null,
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
          <span>신규 인력 등록 (Add Personnel)</span>
          <button onClick={onClose} className="text-white/80 hover:text-white">✕</button>
        </div>
        <div className="p-4 space-y-2">
          {error && <div className="text-[11px] text-red-600 font-bold">{error}</div>}
          <label className="block text-[11px] font-bold text-slate-700">Employee ID</label>
          <input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className={`${SUNKEN_INPUT} w-full`} />
          <label className="block text-[11px] font-bold text-slate-700">Full Name</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={`${SUNKEN_INPUT} w-full`} />
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

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className={BEVEL_BUTTON}>취소</button>
            <button onClick={handleSubmit} disabled={submitting} className={BEVEL_BUTTON}>등록</button>
          </div>
        </div>
      </div>
    </div>
  );
}
