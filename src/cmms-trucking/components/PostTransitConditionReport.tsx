// src/cmms-trucking/components/PostTransitConditionReport.tsx
//
// NP03-15 Post-Transit Vehicle Condition Report (public/docs/sop/NP-03.md §7.15).
// 원문은 체크박스형이 아닌 자유 서술형 보고서(Status Notes)이므로 다른 서브스테이지
// 컴포넌트들과 달리 useTruckChecklistForm(라디오 항목 전용)을 재사용하지 않고,
// 자체 상태로 텍스트 필드 3개를 관리한 뒤 동일한 trucking-inspections API로 제출한다.

'use client';

import { useState } from 'react';
import { RAISED_PANEL, SUNKEN_PANEL, SUNKEN_INPUT, TITLE_BAR, BEVEL_BUTTON } from '../../components/cmms/scadaStyles';
import { SopQuickLinkBar } from '../../components/sop';
import { encodeSopQuickLinkTarget } from '../../components/sop/utils/sopQuickLinkTarget';
import type { NewInspectionItemInput, NewTruckInspectionHeaderInput } from '../types';

const TRUCKING_INSPECTIONS_API = '/api/v1/cmms/trucking-inspections';

const NOTE_FIELDS = [
  { itemId: 'np03-15-brakes-tires-lights', label: 'Condition of Brakes, Tires, Lights', placeholder: 'Brakes, Tires, Lights Status After Trip' },
  { itemId: 'np03-15-lng-tank-condition', label: 'LNG Tank Condition', placeholder: 'Valve, Seal, Pressure Condition After Trip' },
  { itemId: 'np03-15-damage-notes', label: 'Damage or maintenance notes', placeholder: 'Damage or Maintenance Notes' },
] as const;

interface PostTransitConditionReportProps {
  /** WorkOrderListView 등 기존 화면과 동일한 시그니처 — 상위에서 SOP 뷰어를 열 때 사용. */
  onOpenSopReference?: (target: string) => void;
}

export function PostTransitConditionReport({ onOpenSopReference }: PostTransitConditionReportProps) {
  const [vehicleNo, setVehicleNo] = useState('');
  const [inspectionDate, setInspectionDate] = useState('');
  const [driver, setDriver] = useState('');
  const [technician, setTechnician] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<number | null>(null);

  const isComplete = vehicleNo.length > 0 && inspectionDate.length > 0 && driver.length > 0 && technician.length > 0;

  async function handleSubmit() {
    setSubmitError(null);
    if (!isComplete) {
      setSubmitError('필수 항목을 모두 입력해야 합니다.');
      return;
    }

    setSubmitting(true);
    try {
      const header: NewTruckInspectionHeaderInput = {
        inspectionDate,
        driver,
        vehicleNo,
        inspectionType: 'POST_TRANSIT',
        formCode: 'NP03-15',
        status: 'SUBMITTED',
        checkedBy: technician,
      };
      const items: NewInspectionItemInput[] = NOTE_FIELDS.map((f) => ({
        itemLabel: f.label,
        status: 'NA',
        remarks: notes[f.itemId] ?? null,
      }));

      const res = await fetch(TRUCKING_INSPECTIONS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ header, items }),
      });
      const json = (await res.json()) as { success: boolean; record?: { header: { id: number } }; error?: string };
      if (!res.ok || !json.success || !json.record) throw new Error(json.error ?? 'submit failed');
      setSubmittedId(json.record.header.id);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`${RAISED_PANEL} p-3`}>
      <div className={TITLE_BAR}>NP03-15 POST-TRANSIT VEHICLE CONDITION REPORT</div>
      <div className="bg-slate-100 px-2 py-1 border-b border-slate-300">
        <SopQuickLinkBar
          context="TRUCKING_POST_TRANSIT"
          onSelect={(link) => onOpenSopReference?.(encodeSopQuickLinkTarget(link))}
        />
      </div>

      <div className={`${SUNKEN_PANEL} p-3 mt-2 grid grid-cols-2 gap-2`}>
        <input className={SUNKEN_INPUT} placeholder="Vehicle Number" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} />
        <input className={SUNKEN_INPUT} type="date" value={inspectionDate} onChange={(e) => setInspectionDate(e.target.value)} />
        <input className={SUNKEN_INPUT} placeholder="Driver" value={driver} onChange={(e) => setDriver(e.target.value)} />
        <input className={SUNKEN_INPUT} placeholder="Technician" value={technician} onChange={(e) => setTechnician(e.target.value)} />
      </div>

      <div className={`${SUNKEN_PANEL} p-3 mt-2 flex flex-col gap-2`}>
        {NOTE_FIELDS.map((f) => (
          <div key={f.itemId}>
            <label className="text-[11px] font-semibold block mb-1">{f.label}</label>
            <textarea
              className={`${SUNKEN_INPUT} w-full`}
              rows={2}
              placeholder={f.placeholder}
              value={notes[f.itemId] ?? ''}
              onChange={(e) => setNotes((prev) => ({ ...prev, [f.itemId]: e.target.value }))}
            />
          </div>
        ))}
      </div>

      {submitError && <div className="text-red-700 text-[11px] mt-2">{submitError}</div>}
      {submittedId !== null && <div className="text-emerald-700 text-[11px] mt-2">저장되었습니다. (Inspection #{submittedId})</div>}

      <div className="mt-3 flex justify-end">
        <button className={BEVEL_BUTTON} disabled={submitting} onClick={handleSubmit}>
          {submitting ? 'SUBMITTING...' : 'SUBMIT'}
        </button>
      </div>
    </div>
  );
}
