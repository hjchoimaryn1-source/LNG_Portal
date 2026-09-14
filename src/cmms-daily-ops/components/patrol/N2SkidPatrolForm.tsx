// src/cmms-daily-ops/components/patrol/N2SkidPatrolForm.tsx
//
// PURPOSE
//   N2 Skid 순찰 입력 폼 — 실린더 10기(N2-CYL-01..10) + 스키드 공급 압력
//   3계통(N2-SKID-SUPPLY-1..3), 총 13개 equipment_tag 행. 도메인 컬럼이
//   2개(cylinder_pressure_bar/cylinder_status)뿐이라 데이터 기반 행 렌더링
//   하나로 250줄 캡을 넉넉히 만족한다(분리 불필요).

'use client';

import { useState } from 'react';
import { RAISED_PANEL, BEVEL_BUTTON, SUNKEN_PANEL } from '../../../components/cmms/scadaStyles';
import { PATROL_FIELD_MAP } from '../../dao/patrolFieldMaps';
import { N2_ALL_TAGS } from '../../dao/patrolEquipmentTags';
import type { PatrolValues, PatrolFieldValue } from '../../dao/dailyOpsPatrolDao';
import type { ReadingStatus, ShiftTimeSlot } from '../../types/patrolLog';
import { ShiftSlotSelector } from './ShiftSlotSelector';
import { PatrolFieldInput } from './PatrolFieldInput';
import { ReadingStatusControl } from './ReadingStatusControl';
import { emptyPatrolValues, type PatrolSaveHandler } from './patrolFormTypes';

export { N2_ALL_TAGS };

const N2_FIELDS = PATROL_FIELD_MAP.n2_skid;

interface RowState {
  values: PatrolValues;
  readingStatus: ReadingStatus;
  remarkText: string | null;
}

function initialRowState(): RowState {
  return { values: emptyPatrolValues(N2_FIELDS), readingStatus: 'normal', remarkText: null };
}

export interface N2SkidPatrolFormProps {
  onSave: PatrolSaveHandler;
}

export function N2SkidPatrolForm({ onSave }: N2SkidPatrolFormProps) {
  const [shiftTimeSlot, setShiftTimeSlot] = useState<ShiftTimeSlot>('08:00');
  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(N2_ALL_TAGS.map((tag) => [tag, initialRowState()]))
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
          N2 SKID — 실린더 10기 + 공급 압력 3계통
        </div>
        <div className="space-y-2">
          {N2_ALL_TAGS.map((tag) => {
            const row = rows[tag];
            return (
              <div key={tag} className={`${SUNKEN_PANEL} p-2 flex flex-wrap items-end gap-3`}>
                <div className="text-[11px] font-bold text-slate-800 w-32 shrink-0">{tag}</div>
                <div className="flex gap-2 flex-1 min-w-[220px]">
                  {N2_FIELDS.map((spec) => (
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
