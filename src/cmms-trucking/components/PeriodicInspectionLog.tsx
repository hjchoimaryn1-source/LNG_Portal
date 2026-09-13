// src/cmms-trucking/components/PeriodicInspectionLog.tsx
//
// NP03-11 Form Periodic Inspection Log Sheet (public/docs/sop/NP-03.md §7.11).
// 8개 Component 행 라벨은 원문 표(Component 열)를 그대로 사용했다. 원문의
// Condition[OK/Not OK] + Findings[Text] 열은 각각 상태 라디오 + Remarks 입력란에
// 대응한다. "Inspector" 서명자는 헤더의 Checked By 필드로 수렴한다.

'use client';

import { useState } from 'react';
import { RAISED_PANEL, SUNKEN_PANEL, SUNKEN_INPUT, TITLE_BAR, BEVEL_BUTTON } from '../../components/cmms/scadaStyles';
import { useTruckChecklistForm, type ChecklistItemDef } from '../hooks/useTruckChecklistForm';
import { ChecklistItemRow } from './ChecklistItemRow';

const NP03_11_ITEMS: ChecklistItemDef[] = [
  { itemId: 'np03-11-1', label: 'ISO tank body' },
  { itemId: 'np03-11-2', label: 'Trailer chassis' },
  { itemId: 'np03-11-3', label: 'Brake system' },
  { itemId: 'np03-11-4', label: 'Tires' },
  { itemId: 'np03-11-5', label: 'Electrical system' },
  { itemId: 'np03-11-6', label: 'PRV & vent valves' },
  { itemId: 'np03-11-7', label: 'Grounding cable' },
  { itemId: 'np03-11-8', label: 'Fire extinguisher' },
];

export function PeriodicInspectionLog() {
  const form = useTruckChecklistForm('PERIODIC', 'NP03-11', NP03_11_ITEMS);
  const [showSuccess, setShowSuccess] = useState(false);

  async function handleSubmit() {
    setShowSuccess(false);
    const ok = await form.submit();
    if (ok) setShowSuccess(true);
  }

  return (
    <div className={`${RAISED_PANEL} p-3`}>
      <div className={TITLE_BAR}>NP03-11 PERIODIC INSPECTION LOG SHEET</div>
      <div className={`${SUNKEN_PANEL} p-3 mt-2 grid grid-cols-2 gap-2`}>
        <input className={SUNKEN_INPUT} type="date" value={form.header.inspectionDate} onChange={(e) => form.setHeaderField('inspectionDate', e.target.value)} />
        <input className={SUNKEN_INPUT} placeholder="Inspector" value={form.header.driver} onChange={(e) => form.setHeaderField('driver', e.target.value)} />
        <input className={SUNKEN_INPUT} placeholder="Vehicle No" value={form.header.vehicleNo} onChange={(e) => form.setHeaderField('vehicleNo', e.target.value)} />
        <input className={SUNKEN_INPUT} placeholder="ISO Tank No" value={form.header.isoTankNo} onChange={(e) => form.setHeaderField('isoTankNo', e.target.value)} />
        <input className={SUNKEN_INPUT} placeholder="Checked By" value={form.header.checkedBy} onChange={(e) => form.setHeaderField('checkedBy', e.target.value)} />
      </div>

      <table className={`${SUNKEN_PANEL} w-full mt-2 border-collapse`}>
        <thead>
          <tr className="bg-slate-100 text-[11px] text-left">
            <th className="px-2 py-1">Component</th>
            <th className="px-2 py-1">Condition</th>
            <th className="px-2 py-1">Findings</th>
          </tr>
        </thead>
        <tbody>
          {NP03_11_ITEMS.map((def) => (
            <ChecklistItemRow
              key={def.itemId}
              def={def}
              value={form.itemStatuses[def.itemId]}
              onChange={(v) => form.setItemStatus(def.itemId, v)}
              remarks={form.remarks[def.itemId] ?? ''}
              onRemarksChange={(v) => form.setItemRemarks(def.itemId, v)}
            />
          ))}
        </tbody>
      </table>

      {form.submitError && <div className="text-red-700 text-[11px] mt-2">{form.submitError}</div>}
      {showSuccess && <div className="text-emerald-700 text-[11px] mt-2">저장되었습니다. (Inspection #{form.submittedId})</div>}

      <div className="mt-3 flex justify-end">
        <button className={BEVEL_BUTTON} disabled={form.submitting} onClick={handleSubmit}>
          {form.submitting ? 'SUBMITTING...' : 'SUBMIT'}
        </button>
      </div>
    </div>
  );
}
