// src/components/admin/modals/ResignPersonnelModal.tsx
'use client';

import { useState } from 'react';
import { RAISED_PANEL, SUNKEN_INPUT, BEVEL_BUTTON, TITLE_BAR } from '../../cmms/scadaStyles';
import type { PersonnelRecord } from '../hooks/usePersonnelList';

export interface ResignPersonnelModalProps {
  person: PersonnelRecord;
  onClose: () => void;
  onConfirm: (employeeId: string, resignationDate: string) => Promise<string | null>;
}

export default function ResignPersonnelModal({ person, onClose, onConfirm }: ResignPersonnelModalProps) {
  const [resignationDate, setResignationDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setSubmitting(true);
    const err = await onConfirm(person.employeeId, resignationDate);
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className={`${RAISED_PANEL} max-w-sm w-full`}>
        <div className={`${TITLE_BAR} flex justify-between items-center`}>
          <span>퇴직 처리 (Resign)</span>
          <button onClick={onClose} className="text-white/80 hover:text-white">✕</button>
        </div>
        <div className="p-4 space-y-2">
          {error && <div className="text-[11px] text-red-600 font-bold">{error}</div>}
          <div className="text-[12px] text-slate-700">
            <strong>{person.fullName}</strong> ({person.employeeId})를 퇴직 처리합니다. 이 작업은 데이터를 삭제하지 않고
            employment_status만 RESIGNED로 변경합니다.
          </div>
          <label className="block text-[11px] font-bold text-slate-700">Resignation Date</label>
          <input
            type="date"
            value={resignationDate}
            onChange={(e) => setResignationDate(e.target.value)}
            className={`${SUNKEN_INPUT} w-full`}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className={BEVEL_BUTTON}>취소</button>
            <button onClick={handleConfirm} disabled={submitting} className={BEVEL_BUTTON}>퇴직 확정</button>
          </div>
        </div>
      </div>
    </div>
  );
}
