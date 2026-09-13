// src/cmms-trucking/components/PreOperationChecklist.tsx
//
// NP03-02 Pre-Operation Checklist (public/docs/sop/NP-03.md §7.02).
// 항목 라벨/기준 텍스트는 원문(및 src/data/sopIndex.json checklistId "NP03-02")을
// 그대로 사용했으며 임의로 추가/변형하지 않았다.

'use client';

import { useState } from 'react';
import { RAISED_PANEL, SUNKEN_PANEL, SUNKEN_INPUT, TITLE_BAR, BEVEL_BUTTON } from '../../components/cmms/scadaStyles';
import { useTruckChecklistForm, type ChecklistItemDef } from '../hooks/useTruckChecklistForm';
import { ChecklistItemRow } from './ChecklistItemRow';

const NP03_02_ITEMS: ChecklistItemDef[] = [
  { itemId: 'np03-02-1', label: 'Document Verification', criteria: 'Ensure all vehicle and tank certificates, permits, and driver licenses are valid.' },
  { itemId: 'np03-02-2', label: 'Tank Inspection', criteria: 'Inspect tank exterior for frost, cracks, or corrosion.' },
  { itemId: 'np03-02-3', label: 'Vehicle & Equipment', criteria: 'Check brakes, lights, horn, and communication systems.' },
  { itemId: 'np03-02-4', label: 'Safety Devices', criteria: 'Ensure PRV, vent valves, and grounding cables are installed and functional.' },
  { itemId: 'np03-02-5', label: 'Work Area', criteria: 'Confirm area is clear of ignition sources, and signage is in place.' },
  { itemId: 'np03-02-6', label: 'Personnel', criteria: 'Ensure PPE is complete (helmet, cryogenic gloves, FR suit, goggles, boots).' },
  { itemId: 'np03-02-v1', label: 'Work Permit (Hot/Cold)', options: ['Pass', 'Fail'] },
  { itemId: 'np03-02-v2', label: 'Gas Test Result', options: ['Pass', 'Fail'] },
  { itemId: 'np03-02-v3', label: 'PPE Inspection', options: ['Pass', 'Fail'] },
  { itemId: 'np03-02-v4', label: 'Environmental Check', options: ['Pass', 'Fail'] },
];

export function PreOperationChecklist() {
  const form = useTruckChecklistForm('PRE_OP', 'NP03-02', NP03_02_ITEMS);
  const [showSuccess, setShowSuccess] = useState(false);

  async function handleSubmit() {
    setShowSuccess(false);
    const ok = await form.submit();
    if (ok) setShowSuccess(true);
  }

  return (
    <div className={`${RAISED_PANEL} p-3`}>
      <div className={TITLE_BAR}>NP03-02 PRE-OPERATION CHECKLIST</div>
      <div className={`${SUNKEN_PANEL} p-3 mt-2 grid grid-cols-2 gap-2`}>
        <input className={SUNKEN_INPUT} type="date" value={form.header.inspectionDate} onChange={(e) => form.setHeaderField('inspectionDate', e.target.value)} />
        <input className={SUNKEN_INPUT} placeholder="Driver" value={form.header.driver} onChange={(e) => form.setHeaderField('driver', e.target.value)} />
        <input className={SUNKEN_INPUT} placeholder="Vehicle No" value={form.header.vehicleNo} onChange={(e) => form.setHeaderField('vehicleNo', e.target.value)} />
        <input className={SUNKEN_INPUT} placeholder="ISO Tank No" value={form.header.isoTankNo} onChange={(e) => form.setHeaderField('isoTankNo', e.target.value)} />
        <input className={SUNKEN_INPUT} placeholder="Checked By" value={form.header.checkedBy} onChange={(e) => form.setHeaderField('checkedBy', e.target.value)} />
      </div>

      <table className={`${SUNKEN_PANEL} w-full mt-2 border-collapse`}>
        <thead>
          <tr className="bg-slate-100 text-[11px] text-left">
            <th className="px-2 py-1">Item</th>
            <th className="px-2 py-1">Status</th>
            <th className="px-2 py-1">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {NP03_02_ITEMS.map((def) => (
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
