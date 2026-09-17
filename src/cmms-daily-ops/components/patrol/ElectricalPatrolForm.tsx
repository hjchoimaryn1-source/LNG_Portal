// src/cmms-daily-ops/components/patrol/ElectricalPatrolForm.tsx
//
// PURPOSE
//   Electrical 순찰 입력 폼 — MV SWGR / LV SWGR / TRAFO / UPS 4개 서브블록.
//   PATROL_FIELD_MAP.electrical(9개 와이드 컬럼)을 서브블록 성격에 맞는
//   부분집합으로 나눠 쓴다 — TRAFO에만 유온/권선온도/유면이, UPS에만
//   배터리/부하율이 의미가 있으므로 나머지는 항상 NULL로 남는다.

'use client';

import { useState } from 'react';
import { RAISED_PANEL, BEVEL_BUTTON, SUNKEN_PANEL } from '../../../components/cmms/scadaStyles';
import { PATROL_FIELD_MAP, type PatrolFieldSpec } from '../../dao/patrolFieldMaps';
import { ELECTRICAL_EQUIPMENT_TAGS, ELECTRICAL_SUB_BLOCKS } from '../../dao/patrolEquipmentTags';
import type { PatrolValues, PatrolFieldValue } from '../../dao/dailyOpsPatrolDao';
import type { ReadingStatus, ShiftTimeSlot } from '../../types/patrolLog';
import { ShiftSlotSelector } from './ShiftSlotSelector';
import { PatrolFieldInput } from './PatrolFieldInput';
import { ReadingStatusControl } from './ReadingStatusControl';
import { emptyPatrolValues, type PatrolSaveHandler } from './patrolFormTypes';

export { ELECTRICAL_EQUIPMENT_TAGS };

const ELECTRICAL_FIELDS = PATROL_FIELD_MAP.electrical;

function fieldsFor(columns: string[]): PatrolFieldSpec[] {
  return columns.map((c) => ELECTRICAL_FIELDS.find((f) => f.columnName === c)!);
}

interface RowState {
  values: PatrolValues;
  readingStatus: ReadingStatus;
  remarkText: string | null;
}

function initialRowState(fields: PatrolFieldSpec[]): RowState {
  return { values: emptyPatrolValues(fields), readingStatus: 'normal', remarkText: null };
}

export interface ElectricalPatrolFormProps {
  onSave: PatrolSaveHandler;
}

export function ElectricalPatrolForm({ onSave }: ElectricalPatrolFormProps) {
  const [shiftTimeSlot, setShiftTimeSlot] = useState<ShiftTimeSlot>('08:00');
  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(ELECTRICAL_SUB_BLOCKS.map((b) => [b.tag, initialRowState(fieldsFor(b.columns))]))
  );

  function updateRow(tag: string, patch: Partial<RowState>) {
    setRows((prev) => ({ ...prev, [tag]: { ...prev[tag], ...patch } }));
  }

  function handleFieldChange(tag: string, columnName: string, value: PatrolFieldValue) {
    updateRow(tag, { values: { ...rows[tag].values, [columnName]: value } });
  }

  function handleSave(tag: string) {
    const row = rows[tag];
    onSave({
      equipmentTag: tag,
      shiftTimeSlot,
      values: row.values,
      readingStatus: row.readingStatus,
      remarkText: row.remarkText,
    });
  }

  return (
    <div className="space-y-3">
      <ShiftSlotSelector activeSlot={shiftTimeSlot} onSelect={setShiftTimeSlot} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {ELECTRICAL_SUB_BLOCKS.map((block) => {
          const row = rows[block.tag];
          const fields = fieldsFor(block.columns);
          return (
            <div key={block.tag} className={`${RAISED_PANEL} p-2.5 space-y-2`}>
              <div className="text-[11px] font-black uppercase tracking-wider text-[#002b4d] border-b border-[#c8c2b5] pb-1">
                {block.label} ({block.tag})
              </div>
              <div className={`${SUNKEN_PANEL} p-2 grid grid-cols-2 sm:grid-cols-4 gap-2`}>
                {fields.map((spec) => (
                  <PatrolFieldInput
                    key={spec.columnName}
                    spec={spec}
                    value={row.values[spec.columnName]}
                    onChange={(columnName, value) => handleFieldChange(block.tag, columnName, value)}
                  />
                ))}
              </div>
              <ReadingStatusControl
                readingStatus={row.readingStatus}
                remarkText={row.remarkText}
                onReadingStatusChange={(status) => updateRow(block.tag, { readingStatus: status })}
                onRemarkTextChange={(text) => updateRow(block.tag, { remarkText: text })}
              />
              <div className="flex justify-end">
                <button type="button" onClick={() => handleSave(block.tag)} className={BEVEL_BUTTON}>
                  저장
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
