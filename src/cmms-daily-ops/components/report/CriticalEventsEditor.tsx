// src/cmms-daily-ops/components/report/CriticalEventsEditor.tsx
//
// PURPOSE
//   FORM-NP-08-33-N p5 Critical Events 표 — 항상 최소 3개의 빈 입력 행을
//   유지하고(Stage A DDL 코멘트: "3개 blank row에 대응"), 저장된 행은
//   읽기 전용으로 위에 누적 표시한다. 수정은 지원하지 않음(삭제 후 재입력) —
//   지시에 update 함수가 없어 DAO에 추가하지 않았다.

'use client';

import { useEffect, useState } from 'react';
import { SUNKEN_INPUT, BEVEL_BUTTON, RAISED_PANEL, TITLE_BAR } from '../../../components/cmms/scadaStyles';
import { DRAFT_FIELDS, emptyDraft, type SavedEvent, type DraftRow } from './criticalEventFields';

const CRITICAL_EVENTS_API = '/api/v1/cmms/daily-report-critical-events';
const MIN_DRAFT_ROWS = 3;

export interface CriticalEventsEditorProps {
  snapshotId: number;
}

export function CriticalEventsEditor({ snapshotId }: CriticalEventsEditorProps) {
  const [savedEvents, setSavedEvents] = useState<SavedEvent[]>([]);
  const [drafts, setDrafts] = useState<DraftRow[]>(
    Array.from({ length: MIN_DRAFT_ROWS }, () => emptyDraft())
  );

  useEffect(() => {
    fetch(`${CRITICAL_EVENTS_API}?snapshotId=${snapshotId}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json: { success: boolean; records: SavedEvent[] }) => {
        if (json.success) setSavedEvents(json.records);
      })
      .catch(() => {});
  }, [snapshotId]);

  function updateDraft(index: number, field: keyof DraftRow, value: string) {
    setDrafts((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  async function handleSaveDraft(index: number) {
    const row = drafts[index];
    const payload = {
      snapshotId,
      eventTime: row.eventTime || null,
      equipmentSystem: row.equipmentSystem || null,
      conditionAlarm: row.conditionAlarm || null,
      impact: row.impact || null,
      immediateAction: row.immediateAction || null,
      status: row.status || null,
      pic: row.pic || null,
    };
    const res = await fetch(CRITICAL_EVENTS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) return;

    setSavedEvents((prev) => [...prev, { id: json.id, ...payload }]);
    setDrafts((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length < MIN_DRAFT_ROWS ? [...next, emptyDraft()] : next;
    });
  }

  async function handleDelete(id: number) {
    await fetch(`${CRITICAL_EVENTS_API}?id=${id}`, { method: 'DELETE' });
    setSavedEvents((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className={`${RAISED_PANEL} p-2 space-y-2`}>
      <div className={TITLE_BAR}>CRITICAL EVENTS</div>
      <table className="w-full text-[11px] border-collapse">
        <thead>
          <tr>
            {DRAFT_FIELDS.map((f) => (
              <th key={f.key} className="border border-slate-400 px-1 py-1 bg-slate-100">
                {f.label}
              </th>
            ))}
            <th className="border border-slate-400 px-1" />
          </tr>
        </thead>
        <tbody>
          {savedEvents.map((e) => (
            <tr key={e.id}>
              {DRAFT_FIELDS.map((f) => (
                <td key={f.key} className="border border-slate-300 px-1">
                  {e[f.key]}
                </td>
              ))}
              <td className="border border-slate-300 px-1">
                <button type="button" onClick={() => handleDelete(e.id)} className={BEVEL_BUTTON}>
                  삭제
                </button>
              </td>
            </tr>
          ))}
          {drafts.map((row, i) => (
            <tr key={`draft-${i}`}>
              {DRAFT_FIELDS.map((f) => (
                <td key={f.key} className="border border-slate-300 p-0">
                  <input
                    value={row[f.key]}
                    onChange={(e) => updateDraft(i, f.key, e.target.value)}
                    className={`${SUNKEN_INPUT} w-full`}
                  />
                </td>
              ))}
              <td className="border border-slate-300 px-1">
                <button type="button" onClick={() => handleSaveDraft(i)} className={BEVEL_BUTTON}>
                  저장
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={() => setDrafts((prev) => [...prev, emptyDraft()])} className={BEVEL_BUTTON}>
        + 행 추가
      </button>
    </div>
  );
}
