// src/cmms-trucking/components/VehicleSecurityChecklist.tsx
//
// NP03-06 Vehicle & Security Inspection Checklist (public/docs/sop/NP-03.md §7.06).
// 11개 항목 라벨은 원문(및 src/data/sopIndex.json checklistId "NP03-06")을 그대로
// 사용했다. 항목 10(Vehicle camera)만 원문에서 required: false로 표기되어 있다.

'use client';

import { useState } from 'react';
import { RAISED_PANEL, SUNKEN_PANEL, SUNKEN_INPUT, TITLE_BAR, BEVEL_BUTTON } from '../../components/cmms/scadaStyles';
import { useTruckChecklistForm, type ChecklistItemDef } from '../hooks/useTruckChecklistForm';
import { ChecklistItemRow } from './ChecklistItemRow';

const NP03_06_ITEMS: ChecklistItemDef[] = [
  { itemId: 'np03-06-1', label: 'Vehicle ID, license, and permits valid' },
  { itemId: 'np03-06-2', label: 'ISO tank seal intact and numbered' },
  { itemId: 'np03-06-3', label: 'PRV, vent valve, and ESD valve locked and functional' },
  { itemId: 'np03-06-4', label: 'GPS tracker operational' },
  { itemId: 'np03-06-5', label: 'Communication device (radio/phone) tested' },
  { itemId: 'np03-06-6', label: 'Underbody & cabin inspected for hidden objects' },
  { itemId: 'np03-06-7', label: 'Fire extinguisher available & calibrated' },
  { itemId: 'np03-06-8', label: 'First aid kit (P3K) available' },
  { itemId: 'np03-06-9', label: 'Reflective signage & security markings visible' },
  { itemId: 'np03-06-10', label: 'Vehicle camera (if equipped) functional', required: false },
  { itemId: 'np03-06-11', label: 'Driver and crew ID verified' },
];

export function VehicleSecurityChecklist() {
  const form = useTruckChecklistForm('VEHICLE_SECURITY', 'NP03-06', NP03_06_ITEMS);
  const [showSuccess, setShowSuccess] = useState(false);

  async function handleSubmit() {
    setShowSuccess(false);
    const ok = await form.submit();
    if (ok) setShowSuccess(true);
  }

  return (
    <div className={`${RAISED_PANEL} p-3`}>
      <div className={TITLE_BAR}>NP03-06 VEHICLE & SECURITY INSPECTION CHECKLIST</div>
      <div className={`${SUNKEN_PANEL} p-3 mt-2 grid grid-cols-2 gap-2`}>
        <input className={SUNKEN_INPUT} type="date" value={form.header.inspectionDate} onChange={(e) => form.setHeaderField('inspectionDate', e.target.value)} />
        <input className={SUNKEN_INPUT} placeholder="Driver" value={form.header.driver} onChange={(e) => form.setHeaderField('driver', e.target.value)} />
        <input className={SUNKEN_INPUT} placeholder="Vehicle No" value={form.header.vehicleNo} onChange={(e) => form.setHeaderField('vehicleNo', e.target.value)} />
        <input className={SUNKEN_INPUT} placeholder="ISO Tank No" value={form.header.isoTankNo} onChange={(e) => form.setHeaderField('isoTankNo', e.target.value)} />
        <input className={SUNKEN_INPUT} placeholder="Inspector (Checked By)" value={form.header.checkedBy} onChange={(e) => form.setHeaderField('checkedBy', e.target.value)} />
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
          {NP03_06_ITEMS.map((def) => (
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
