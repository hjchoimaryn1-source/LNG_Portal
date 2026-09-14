// src/cmms-trucking/components/PreOpsTruckIsoTankChecklist.tsx
//
// NP03-13 Pre-Operations Checklist - LNG TRUCK & ISO TANK (public/docs/sop/NP-03.md §7.13).
// 12개 항목의 "Inspection Item"/"Description" 열은 원문 표를 그대로 사용했다.

'use client';

import { useState } from 'react';
import { RAISED_PANEL, SUNKEN_PANEL, SUNKEN_INPUT, TITLE_BAR, BEVEL_BUTTON } from '../../components/cmms/scadaStyles';
import { useTruckChecklistForm, type ChecklistItemDef } from '../hooks/useTruckChecklistForm';
import { ChecklistItemRow } from './ChecklistItemRow';

const NP03_13_ITEMS: ChecklistItemDef[] = [
  { itemId: 'np03-13-1', label: 'Vehicle registration & license', criteria: 'Documents valid and complete' },
  { itemId: 'np03-13-2', label: 'ISO tank certificate', criteria: 'Inspection and calibration valid' },
  { itemId: 'np03-13-3', label: 'External tank condition', criteria: 'No frost, dents, or corrosion' },
  { itemId: 'np03-13-4', label: 'PRV & vent valves', criteria: 'No leaks, properly sealed' },
  { itemId: 'np03-13-5', label: 'Pressure gauge & thermometer', criteria: 'Functional and readable' },
  { itemId: 'np03-13-6', label: 'Hoses & fittings', criteria: 'No cracks or wear' },
  { itemId: 'np03-13-7', label: 'Tires & wheels', criteria: 'Proper air pressure, no damage' },
  { itemId: 'np03-13-8', label: 'Brakes & lights', criteria: 'Function tested' },
  { itemId: 'np03-13-9', label: 'Fire extinguisher', criteria: 'Available and within validity' },
  { itemId: 'np03-13-10', label: 'Grounding cable', criteria: 'Available, no damage' },
  { itemId: 'np03-13-11', label: 'Communication device', criteria: 'Radio/phone functional' },
  { itemId: 'np03-13-12', label: 'PPE availability', criteria: 'Helmet, gloves, safety boots, FR suit' },
];

export function PreOpsTruckIsoTankChecklist() {
  const form = useTruckChecklistForm('PRE_OP', 'NP03-13', NP03_13_ITEMS);
  const [showSuccess, setShowSuccess] = useState(false);

  async function handleSubmit() {
    setShowSuccess(false);
    const ok = await form.submit();
    if (ok) setShowSuccess(true);
  }

  return (
    <div className={`${RAISED_PANEL} p-3`}>
      <div className={TITLE_BAR}>NP03-13 PRE-OPERATIONS CHECKLIST - LNG TRUCK &amp; ISO TANK</div>
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
            <th className="px-2 py-1">Inspection Item</th>
            <th className="px-2 py-1">Status</th>
            <th className="px-2 py-1">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {NP03_13_ITEMS.map((def) => (
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
