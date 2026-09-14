// src/cmms-daily-ops/components/patrol/MeteringPatrolForm.tsx
//
// PURPOSE
//   Metering Train A/B 순찰 입력 폼 — 동일 구조를 `train` prop으로
//   파라미터화한 단일 컴포넌트 2인스턴스(Train A/B) 사용을 의도한다.

'use client';

import { useState } from 'react';
import { RAISED_PANEL, BEVEL_BUTTON } from '../../../components/cmms/scadaStyles';
import { PATROL_FIELD_MAP } from '../../dao/patrolFieldMaps';
import type { PatrolValues, PatrolFieldValue } from '../../dao/dailyOpsPatrolDao';
import type { PatrolDomain, ReadingStatus, ShiftTimeSlot } from '../../types/patrolLog';
import { ShiftSlotSelector } from './ShiftSlotSelector';
import { PatrolFieldInput } from './PatrolFieldInput';
import { ReadingStatusControl } from './ReadingStatusControl';
import { emptyPatrolValues, type PatrolSaveHandler } from './patrolFormTypes';

export interface MeteringPatrolFormProps {
  train: 'A' | 'B';
  onSave: PatrolSaveHandler;
}

export function MeteringPatrolForm({ train, onSave }: MeteringPatrolFormProps) {
  const domain: PatrolDomain = train === 'A' ? 'metering_train_a' : 'metering_train_b';
  const equipmentTag = `METERING-TRAIN-${train}`;
  const fields = PATROL_FIELD_MAP[domain];

  const [shiftTimeSlot, setShiftTimeSlot] = useState<ShiftTimeSlot>('08:00');
  const [values, setValues] = useState<PatrolValues>(() => emptyPatrolValues(fields));
  const [readingStatus, setReadingStatus] = useState<ReadingStatus>('normal');
  const [remarkText, setRemarkText] = useState<string | null>(null);

  function handleFieldChange(columnName: string, value: PatrolFieldValue) {
    setValues((prev) => ({ ...prev, [columnName]: value }));
  }

  function handleSave() {
    onSave({ equipmentTag, shiftTimeSlot, values, readingStatus, remarkText });
  }

  return (
    <div className="space-y-3">
      <ShiftSlotSelector activeSlot={shiftTimeSlot} onSelect={setShiftTimeSlot} />
      <div className={`${RAISED_PANEL} p-2.5 space-y-2`}>
        <div className="text-[11px] font-black uppercase tracking-wider text-[#002b4d] border-b border-[#c8c2b5] pb-1">
          {equipmentTag}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {fields.map((spec) => (
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
