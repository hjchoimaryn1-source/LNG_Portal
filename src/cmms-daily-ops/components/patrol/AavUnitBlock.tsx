// src/cmms-daily-ops/components/patrol/AavUnitBlock.tsx
//
// PURPOSE
//   AAV 유닛 1기(AAV-102/103/105/106 중 1개)의 8필드 블록 — FORM-NP-08-33-N
//   p2 매핑. AavPatrolForm.tsx가 4개를 렌더링한다 (250줄 캡 대응 분리).

'use client';

import { useState } from 'react';
import { RAISED_PANEL, BEVEL_BUTTON } from '../../../components/cmms/scadaStyles';
import { PATROL_FIELD_MAP } from '../../dao/patrolFieldMaps';
import type { PatrolValues, PatrolFieldValue } from '../../dao/dailyOpsPatrolDao';
import type { ReadingStatus, ShiftTimeSlot } from '../../types/patrolLog';
import { PatrolFieldInput } from './PatrolFieldInput';
import { ReadingStatusControl } from './ReadingStatusControl';
import { emptyPatrolValues, type PatrolSaveHandler } from './patrolFormTypes';

const AAV_FIELDS = PATROL_FIELD_MAP.aav;

export interface AavUnitBlockProps {
  equipmentTag: string;
  shiftTimeSlot: ShiftTimeSlot;
  onSave: PatrolSaveHandler;
}

export function AavUnitBlock({ equipmentTag, shiftTimeSlot, onSave }: AavUnitBlockProps) {
  const [values, setValues] = useState<PatrolValues>(() => emptyPatrolValues(AAV_FIELDS));
  const [readingStatus, setReadingStatus] = useState<ReadingStatus>('normal');
  const [remarkText, setRemarkText] = useState<string | null>(null);

  function handleFieldChange(columnName: string, value: PatrolFieldValue) {
    setValues((prev) => ({ ...prev, [columnName]: value }));
  }

  function handleSave() {
    onSave({ equipmentTag, shiftTimeSlot, values, readingStatus, remarkText });
  }

  return (
    <div className={`${RAISED_PANEL} p-2.5 space-y-2`}>
      <div className="text-[11px] font-black uppercase tracking-wider text-[#002b4d] border-b border-[#c8c2b5] pb-1">
        {equipmentTag}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {AAV_FIELDS.map((spec) => (
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
  );
}
