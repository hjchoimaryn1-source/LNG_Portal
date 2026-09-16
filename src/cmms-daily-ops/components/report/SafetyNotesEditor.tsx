// src/cmms-daily-ops/components/report/SafetyNotesEditor.tsx
//
// PURPOSE
//   Unsafe Action / Unsafe Condition / Incident / Remarks 자유서술 4필드.
//   snapshot당 1행 개념(upsertSafetyNotes, dailyReportChildDao.ts 참고).

'use client';

import { useEffect, useState } from 'react';
import { SUNKEN_INPUT, BEVEL_BUTTON, RAISED_PANEL, TITLE_BAR } from '../../../components/cmms/scadaStyles';
import { useActiveSession } from '../../../lib/rbac/activeSessionStore';
import { getEffectivePermission } from '../../../lib/rbac/rolePermissionService';

const SAFETY_NOTES_API = '/api/v1/cmms/daily-report-safety-notes';

interface SafetyNotesState {
  unsafeActionText: string;
  unsafeConditionText: string;
  incidentText: string;
  remarksText: string;
}

const FIELDS: Array<{ key: keyof SafetyNotesState; label: string }> = [
  { key: 'unsafeActionText', label: 'Unsafe Action' },
  { key: 'unsafeConditionText', label: 'Unsafe Condition' },
  { key: 'incidentText', label: 'Incident' },
  { key: 'remarksText', label: 'Remarks' },
];

function emptyNotes(): SafetyNotesState {
  return { unsafeActionText: '', unsafeConditionText: '', incidentText: '', remarksText: '' };
}

export interface SafetyNotesEditorProps {
  snapshotId: number;
}

export function SafetyNotesEditor({ snapshotId }: SafetyNotesEditorProps) {
  const [notes, setNotes] = useState<SafetyNotesState>(emptyNotes());
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const activeSession = useActiveSession();

  useEffect(() => {
    fetch(`${SAFETY_NOTES_API}?snapshotId=${snapshotId}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json: { success: boolean; record: Partial<SafetyNotesState> | null }) => {
        if (json.success && json.record) {
          setNotes({
            unsafeActionText: json.record.unsafeActionText ?? '',
            unsafeConditionText: json.record.unsafeConditionText ?? '',
            incidentText: json.record.incidentText ?? '',
            remarksText: json.record.remarksText ?? '',
          });
        }
      })
      .catch(() => {});
  }, [snapshotId]);

  function handleSave() {
    setBlockedMessage(null);
    if (!activeSession) {
      setBlockedMessage('로그인 세션이 없습니다.');
      return;
    }
    if (getEffectivePermission(activeSession.roleCode, 'DAILY_OPS_REPORT')?.canCreate !== true) {
      setBlockedMessage(`역할 ${activeSession.roleCode}은(는) Safety Information 저장 권한이 없습니다.`);
      return;
    }
    fetch(SAFETY_NOTES_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        snapshotId,
        roleCode: activeSession.roleCode,
        unsafeActionText: notes.unsafeActionText || null,
        unsafeConditionText: notes.unsafeConditionText || null,
        incidentText: notes.incidentText || null,
        remarksText: notes.remarksText || null,
      }),
    })
      .then((res) => res.json())
      .then((json: { success: boolean; error?: string }) => {
        if (!json.success) setBlockedMessage(json.error ?? '저장 실패');
      })
      .catch(() => {});
  }

  return (
    <div className={`${RAISED_PANEL} p-2 space-y-2`}>
      <div className={TITLE_BAR}>SAFETY INFORMATION</div>
      {blockedMessage && <div className="text-[11px] text-red-600 font-bold">{blockedMessage}</div>}
      {FIELDS.map(({ key, label }) => (
        <div key={key} className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-700 uppercase">{label}</label>
          <textarea
            value={notes[key]}
            onChange={(e) => setNotes((prev) => ({ ...prev, [key]: e.target.value }))}
            rows={2}
            className={`${SUNKEN_INPUT} w-full`}
          />
        </div>
      ))}
      <div className="flex justify-end">
        <button type="button" onClick={handleSave} className={BEVEL_BUTTON}>
          저장
        </button>
      </div>
    </div>
  );
}
