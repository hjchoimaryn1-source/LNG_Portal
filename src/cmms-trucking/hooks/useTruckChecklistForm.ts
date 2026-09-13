// src/cmms-trucking/hooks/useTruckChecklistForm.ts
//
// PURPOSE
//   NP03-02/NP03-06 등 "헤더 + 고정 항목 목록" 형태 체크리스트의 공용 상태 계층.
//   항목 정의(라벨/기준/옵션)는 각 컴포넌트가 정적으로 소유하고, 이 훅은
//   입력 상태 관리 + /api/v1/cmms/trucking-inspections POST 제출만 담당한다.

import { useState } from 'react';
import type {
  InspectionItemStatus,
  NewInspectionItemInput,
  NewTruckInspectionHeaderInput,
  TruckInspectionFormCode,
  TruckInspectionType,
} from '../types';

const TRUCKING_INSPECTIONS_API = '/api/v1/cmms/trucking-inspections';

export interface ChecklistItemDef {
  itemId: string;
  label: string;
  criteria?: string;
  /** 선택형 항목(예: NP03-02 Verification Section)의 옵션. 없으면 OK/Not OK 기본값. */
  options?: string[];
  /** 기본값 true. false면 미입력이어도 제출을 막지 않는다(예: NP03-06 item 10). */
  required?: boolean;
}

export interface HeaderFieldValues {
  inspectionDate: string;
  driver: string;
  vehicleNo: string;
  isoTankNo: string;
  checkedBy: string;
}

const EMPTY_HEADER: HeaderFieldValues = {
  inspectionDate: '',
  driver: '',
  vehicleNo: '',
  isoTankNo: '',
  checkedBy: '',
};

function toItemStatus(raw: string | undefined): InspectionItemStatus {
  if (raw === 'OK' || raw === 'Pass') return 'OK';
  if (raw === 'Not OK' || raw === 'Fail') return 'NOT_OK';
  return 'NA';
}

export function useTruckChecklistForm(
  inspectionType: TruckInspectionType,
  formCode: TruckInspectionFormCode,
  itemDefs: ChecklistItemDef[]
) {
  const [header, setHeader] = useState<HeaderFieldValues>(EMPTY_HEADER);
  const [itemStatuses, setItemStatuses] = useState<Record<string, string>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<number | null>(null);

  function setHeaderField<K extends keyof HeaderFieldValues>(field: K, value: HeaderFieldValues[K]) {
    setHeader((prev) => ({ ...prev, [field]: value }));
  }

  function setItemStatus(itemId: string, status: string) {
    setItemStatuses((prev) => ({ ...prev, [itemId]: status }));
  }

  function setItemRemarks(itemId: string, text: string) {
    setRemarks((prev) => ({ ...prev, [itemId]: text }));
  }

  const requiredItemsFilled = itemDefs
    .filter((def) => def.required !== false)
    .every((def) => itemStatuses[def.itemId] !== undefined);
  const headerFilled =
    header.inspectionDate.length > 0 && header.driver.length > 0 && header.vehicleNo.length > 0 && header.checkedBy.length > 0;
  const isComplete = requiredItemsFilled && headerFilled;

  async function submit(): Promise<boolean> {
    setSubmitError(null);
    if (!isComplete) {
      setSubmitError('필수 항목을 모두 입력해야 합니다.');
      return false;
    }

    setSubmitting(true);
    try {
      const headerInput: NewTruckInspectionHeaderInput = {
        inspectionDate: header.inspectionDate,
        driver: header.driver,
        vehicleNo: header.vehicleNo,
        isoTankNo: header.isoTankNo || null,
        inspectionType,
        formCode,
        status: 'SUBMITTED',
        checkedBy: header.checkedBy,
      };

      const items: NewInspectionItemInput[] = itemDefs.map((def) => ({
        itemLabel: def.label,
        criteria: def.criteria ?? null,
        status: toItemStatus(itemStatuses[def.itemId]),
        remarks: remarks[def.itemId] ?? null,
      }));

      const res = await fetch(TRUCKING_INSPECTIONS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ header: headerInput, items }),
      });
      const json = (await res.json()) as { success: boolean; record?: { header: { id: number } }; error?: string };
      if (!res.ok || !json.success || !json.record) {
        throw new Error(json.error ?? 'submit failed');
      }
      setSubmittedId(json.record.header.id);
      return true;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  return {
    header,
    setHeaderField,
    itemStatuses,
    setItemStatus,
    remarks,
    setItemRemarks,
    isComplete,
    submitting,
    submitError,
    submittedId,
    submit,
  };
}
