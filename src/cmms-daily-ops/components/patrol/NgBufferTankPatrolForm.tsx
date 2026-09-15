// src/cmms-daily-ops/components/patrol/NgBufferTankPatrolForm.tsx
//
// PURPOSE
//   NG Buffer Tank(V-101) 순찰 입력 폼 — PI-07A(압력계) + PT-07A(압력
//   트랜스미터) 2필드, 단일 장비 순찰. GcPatrolForm.tsx의 단일 장비
//   구조를 그대로 따른다(Stage E-2).

'use client';

import { useState } from 'react';
import { RAISED_PANEL, BEVEL_BUTTON } from '../../../components/cmms/scadaStyles';
import { PATROL_FIELD_MAP } from '../../dao/patrolFieldMaps';
import { NG_BUFFER_TANK_EQUIPMENT_TAG } from '../../dao/patrolEquipmentTags';
import type { PatrolValues, PatrolFieldValue } from '../../dao/dailyOpsPatrolDao';
import type { ReadingStatus, ShiftTimeSlot } from '../../types/patrolLog';
import { ShiftSlotSelector } from './ShiftSlotSelector';
import { PatrolFieldInput } from './PatrolFieldInput';
import { ReadingStatusControl } from './ReadingStatusControl';
import { emptyPatrolValues, type PatrolSaveHandler } from './patrolFormTypes';

export { NG_BUFFER_TANK_EQUIPMENT_TAG };

const NG_BUFFER_TANK_FIELDS = PATROL_FIELD_MAP.ng_buffer_tank;

export interface NgBufferTankPatrolFormProps {
  onSave: PatrolSaveHandler;
}

export function NgBufferTankPatrolForm({ onSave }: NgBufferTankPatrolFormProps) {
  const [shiftTimeSlot, setShiftTimeSlot] = useState<ShiftTimeSlot>('08:00');
  const [values, setValues] = useState<PatrolValues>(() => emptyPatrolValues(NG_BUFFER_TANK_FIELDS));
  const [readingStatus, setReadingStatus] = useState<ReadingStatus>('normal');
  const [remarkText, setRemarkText] = useState<string | null>(null);

  function handleFieldChange(columnName: string, value: PatrolFieldValue) {
    setValues((prev) => ({ ...prev, [columnName]: value }));
  }

  function handleSave() {
    onSave({ equipmentTag: NG_BUFFER_TANK_EQUIPMENT_TAG, shiftTimeSlot, values, readingStatus, remarkText });
  }

  return (
    <div className="space-y-3">
      <ShiftSlotSelector activeSlot={shiftTimeSlot} onSelect={setShiftTimeSlot} />
      <div className={`${RAISED_PANEL} p-2.5 space-y-2`}>
        <div className="text-[11px] font-black uppercase tracking-wider text-[#002b4d] border-b border-[#c8c2b5] pb-1">
          {NG_BUFFER_TANK_EQUIPMENT_TAG}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {NG_BUFFER_TANK_FIELDS.map((spec) => (
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
