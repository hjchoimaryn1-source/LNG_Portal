// src/cmms-daily-ops/components/patrol/GcPatrolForm.tsx
//
// PURPOSE
//   GC(Gas Chromatograph) 순찰 입력 폼 — 교정/캐리어가스 상태 블록(4 텍스트
//   필드) + 몰 조성 블록(11 숫자 필드), 단일 장비(GC-01) 순찰.

'use client';

import { useState } from 'react';
import { RAISED_PANEL, BEVEL_BUTTON } from '../../../components/cmms/scadaStyles';
import { PATROL_FIELD_MAP } from '../../dao/patrolFieldMaps';
import { GC_EQUIPMENT_TAG } from '../../dao/patrolEquipmentTags';
import type { PatrolValues, PatrolFieldValue } from '../../dao/dailyOpsPatrolDao';
import type { ReadingStatus, ShiftTimeSlot } from '../../types/patrolLog';
import { ShiftSlotSelector } from './ShiftSlotSelector';
import { PatrolFieldInput } from './PatrolFieldInput';
import { ReadingStatusControl } from './ReadingStatusControl';
import { emptyPatrolValues, type PatrolSaveHandler } from './patrolFormTypes';

export { GC_EQUIPMENT_TAG };

const GC_FIELDS = PATROL_FIELD_MAP.gc;
// Stage E-5 — GASCAL/Helium 컬럼은 gc 필드맵에 append되어 있어 type만으로
// 걸러내면 기존 상태/조성 블록에 섞인다. 접두사로 별도 그룹핑한다.
const isGascalOrHelium = (columnName: string) => columnName.startsWith('gascal_') || columnName.startsWith('helium_');
const GC_STATUS_FIELDS = GC_FIELDS.filter((f) => f.type === 'text' && !isGascalOrHelium(f.columnName));
const GC_COMPOSITION_FIELDS = GC_FIELDS.filter((f) => f.type === 'number' && !isGascalOrHelium(f.columnName));
const GASCAL_FIELDS = GC_FIELDS.filter((f) => f.columnName.startsWith('gascal_'));
const HELIUM_FIELDS = GC_FIELDS.filter((f) => f.columnName.startsWith('helium_'));

export interface GcPatrolFormProps {
  onSave: PatrolSaveHandler;
}

export function GcPatrolForm({ onSave }: GcPatrolFormProps) {
  const [shiftTimeSlot, setShiftTimeSlot] = useState<ShiftTimeSlot>('08:00');
  const [values, setValues] = useState<PatrolValues>(() => emptyPatrolValues(GC_FIELDS));
  const [readingStatus, setReadingStatus] = useState<ReadingStatus>('normal');
  const [remarkText, setRemarkText] = useState<string | null>(null);

  function handleFieldChange(columnName: string, value: PatrolFieldValue) {
    setValues((prev) => ({ ...prev, [columnName]: value }));
  }

  function handleSave() {
    onSave({ equipmentTag: GC_EQUIPMENT_TAG, shiftTimeSlot, values, readingStatus, remarkText });
  }

  return (
    <div className="space-y-3">
      <ShiftSlotSelector activeSlot={shiftTimeSlot} onSelect={setShiftTimeSlot} />
      <div className={`${RAISED_PANEL} p-2.5 space-y-3`}>
        <div className="text-[11px] font-black uppercase tracking-wider text-[#002b4d] border-b border-[#c8c2b5] pb-1">
          {GC_EQUIPMENT_TAG} — 교정 / 캐리어가스 상태
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {GC_STATUS_FIELDS.map((spec) => (
            <PatrolFieldInput
              key={spec.columnName}
              spec={spec}
              value={values[spec.columnName]}
              onChange={handleFieldChange}
            />
          ))}
        </div>

        <div className="text-[11px] font-black uppercase tracking-wider text-[#002b4d] border-b border-[#c8c2b5] pb-1">
          몰 조성 (% Mol / ppm)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {GC_COMPOSITION_FIELDS.map((spec) => (
            <PatrolFieldInput
              key={spec.columnName}
              spec={spec}
              value={values[spec.columnName]}
              onChange={handleFieldChange}
            />
          ))}
        </div>

        <div className="text-[11px] font-black uppercase tracking-wider text-[#002b4d] border-b border-[#c8c2b5] pb-1">
          Calibration Gas (GASCAL)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {GASCAL_FIELDS.map((spec) => (
            <PatrolFieldInput
              key={spec.columnName}
              spec={spec}
              value={values[spec.columnName]}
              onChange={handleFieldChange}
            />
          ))}
        </div>

        <div className="text-[11px] font-black uppercase tracking-wider text-[#002b4d] border-b border-[#c8c2b5] pb-1">
          Carrier Gas (Helium)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {HELIUM_FIELDS.map((spec) => (
            <PatrolFieldInput
              key={spec.columnName}
              spec={spec}
              value={values[spec.columnName]}
              onChange={handleFieldChange}
            />
          ))}
        </div>

        <ReadingStatusControl
          readingStatus={readingStatus}
          remarkText={remarkText}
          onReadingStatusChange={setReadingStatus}
          onRemarkTextChange={setRemarkText}
        />
        <div className="flex justify-end">
          <button type="button" onClick={handleSave} className={BEVEL_BUTTON}>
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
