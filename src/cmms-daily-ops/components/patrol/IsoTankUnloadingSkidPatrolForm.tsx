// src/cmms-daily-ops/components/patrol/IsoTankUnloadingSkidPatrolForm.tsx
//
// PURPOSE
//   ISO Tank Unloading Skid 순찰 입력 폼 — T-201~204 4기, FORM-NP-08-33-N p2
//   Section C(UNLOADING SKID) 매핑. PATROL_FIELD_MAP.iso_tank_unloading_skid
//   (6필드)가 N2SkidPatrolForm과 동일한 데이터 기반 행 렌더링 하나로 250줄
//   캡을 만족하므로 분리 불필요.

'use client';

import { useState } from 'react';
import { RAISED_PANEL, BEVEL_BUTTON, SUNKEN_PANEL } from '../../../components/cmms/scadaStyles';
import { PATROL_FIELD_MAP } from '../../dao/patrolFieldMaps';
import { ISO_TANK_UNLOADING_SKID_TAGS } from '../../dao/patrolEquipmentTags';
import type { PatrolValues, PatrolFieldValue } from '../../dao/dailyOpsPatrolDao';
import type { ReadingStatus, ShiftTimeSlot } from '../../types/patrolLog';
import { ShiftSlotSelector } from './ShiftSlotSelector';
import { PatrolFieldInput } from './PatrolFieldInput';
import { ReadingStatusControl } from './ReadingStatusControl';
import { emptyPatrolValues, type PatrolSaveHandler } from './patrolFormTypes';

export { ISO_TANK_UNLOADING_SKID_TAGS };

const ISO_TANK_UNLOADING_SKID_FIELDS = PATROL_FIELD_MAP.iso_tank_unloading_skid;

interface RowState {
  values: PatrolValues;
  readingStatus: ReadingStatus;
  remarkText: string | null;
}

function initialRowState(): RowState {
  return { values: emptyPatrolValues(ISO_TANK_UNLOADING_SKID_FIELDS), readingStatus: 'normal', remarkText: null };
}

export interface IsoTankUnloadingSkidPatrolFormProps {
  onSave: PatrolSaveHandler;
}

export function IsoTankUnloadingSkidPatrolForm({ onSave }: IsoTankUnloadingSkidPatrolFormProps) {
  const [shiftTimeSlot, setShiftTimeSlot] = useState<ShiftTimeSlot>('08:00');
  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(ISO_TANK_UNLOADING_SKID_TAGS.map((tag) => [tag, initialRowState()]))
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
      <div className={`${RAISED_PANEL} p-2.5 space-y-2`}>
        <div className="text-[11px] font-black uppercase tracking-wider text-[#002b4d] border-b border-[#c8c2b5] pb-1">
          ISO TANK UNLOADING SKID — T-201~204
        </div>
        <div className="space-y-2">
          {ISO_TANK_UNLOADING_SKID_TAGS.map((tag) => {
            const row = rows[tag];
            return (
              <div key={tag} className={`${SUNKEN_PANEL} p-2 flex flex-wrap items-end gap-3`}>
                <div className="text-[11px] font-bold text-slate-800 w-32 shrink-0">{tag}</div>
                <div className="flex gap-2 flex-1 min-w-[220px] flex-wrap">
                  {ISO_TANK_UNLOADING_SKID_FIELDS.map((spec) => (
                    <PatrolFieldInput
                      key={spec.columnName}
                      spec={spec}
                      value={row.values[spec.columnName]}
                      onChange={(columnName, value) => handleFieldChange(tag, columnName, value)}
                    />
                  ))}
                </div>
                <div className="flex-1 min-w-[220px]">
                  <ReadingStatusControl
                    readingStatus={row.readingStatus}
                    remarkText={row.remarkText}
                    onReadingStatusChange={(status) => updateRow(tag, { readingStatus: status })}
                    onRemarkTextChange={(text) => updateRow(tag, { remarkText: text })}
                  />
                </div>
                <button type="button" onClick={() => handleSave(tag)} className={BEVEL_BUTTON}>
                  저장
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
