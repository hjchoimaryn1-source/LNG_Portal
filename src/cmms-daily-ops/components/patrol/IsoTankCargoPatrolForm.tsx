// src/cmms-daily-ops/components/patrol/IsoTankCargoPatrolForm.tsx
//
// PURPOSE
//   ISO Tank Cargo(Laydown 1/2) 순찰 입력 폼 — FORM-NP-08-33-N Section D
//   대상. T-201~204(Section C, 고정 설비)와 달리 SIMU 탱크 모집단이 선적
//   사이클로 바뀌므로 태그를 정적 배열이 아니라 useFleetTankFacade()의
//   fleetTanks를 deriveIsoTankCargoTags()로 필터링해 매 렌더마다 도출한다.
//   1일 1회 점검 대상이라 ShiftSlotSelector를 노출하지 않고 고정 슬롯
//   (ISO_TANK_CARGO_DAILY_SLOT)으로 저장한다 — UNIQUE(domain, equipment_tag,
//   report_date, shift_time_slot) 제약이 동일 슬롯 재저장 시 "하루 1건"
//   upsert로 자연히 동작한다(스키마 변경 없음).
//
//   Print 파이프라인(isoTankPrintMapper.ts/DailyReportPrintView.tsx)은 이
//   단계에서 무수정 — legacy DailyMasterRecord 기반 Section D 브릿지가
//   그대로 유지된다. 이 폼의 저장값을 인쇄에 연결하는 건 후속 단계.

'use client';

import { useState } from 'react';
import { RAISED_PANEL, BEVEL_BUTTON, SUNKEN_PANEL } from '../../../components/cmms/scadaStyles';
import { PATROL_FIELD_MAP } from '../../dao/patrolFieldMaps';
import { deriveIsoTankCargoTags, ISO_TANK_CARGO_DAILY_SLOT } from '../../dao/deriveIsoTankCargoTags';
import { useFleetTankFacade } from '../../../hooks/portalDataFacade/useFleetTankFacade';
import type { PatrolValues, PatrolFieldValue } from '../../dao/dailyOpsPatrolDao';
import type { ReadingStatus } from '../../types/patrolLog';
import { PatrolFieldInput } from './PatrolFieldInput';
import { ReadingStatusControl } from './ReadingStatusControl';
import { emptyPatrolValues, type PatrolSaveHandler } from './patrolFormTypes';

const ISO_TANK_CARGO_FIELDS = PATROL_FIELD_MAP.iso_tank_cargo;

interface RowState {
  values: PatrolValues;
  readingStatus: ReadingStatus;
  remarkText: string | null;
}

function initialRowState(): RowState {
  return { values: emptyPatrolValues(ISO_TANK_CARGO_FIELDS), readingStatus: 'normal', remarkText: null };
}

export interface IsoTankCargoPatrolFormProps {
  onSave: PatrolSaveHandler;
}

export function IsoTankCargoPatrolForm({ onSave }: IsoTankCargoPatrolFormProps) {
  const { fleetTanks } = useFleetTankFacade();
  const tags = deriveIsoTankCargoTags(fleetTanks);
  const [rows, setRows] = useState<Record<string, RowState>>({});

  function rowFor(tag: string): RowState {
    return rows[tag] ?? initialRowState();
  }

  function updateRow(tag: string, patch: Partial<RowState>) {
    setRows((prev) => ({ ...prev, [tag]: { ...rowFor(tag), ...patch } }));
  }

  function handleFieldChange(tag: string, columnName: string, value: PatrolFieldValue) {
    updateRow(tag, { values: { ...rowFor(tag).values, [columnName]: value } });
  }

  function handleSave(tag: string) {
    const row = rowFor(tag);
    onSave({
      equipmentTag: tag,
      shiftTimeSlot: ISO_TANK_CARGO_DAILY_SLOT,
      values: row.values,
      readingStatus: row.readingStatus,
      remarkText: row.remarkText,
    });
  }

  return (
    <div className="space-y-3">
      <div className={`${RAISED_PANEL} p-2.5 space-y-2`}>
        <div className="text-[11px] font-black uppercase tracking-wider text-[#002b4d] border-b border-[#c8c2b5] pb-1">
          ISO TANK CARGO — LAYDOWN 1/2 ({tags.length}대, 1일 1회 점검)
        </div>
        {tags.length === 0 && (
          <div className="text-[11px] text-slate-500 p-2">현재 Laydown 1/2에 위치한 탱크가 없습니다.</div>
        )}
        <div className="space-y-2">
          {tags.map((tag) => {
            const row = rowFor(tag);
            return (
              <div key={tag} className={`${SUNKEN_PANEL} p-2 flex flex-wrap items-end gap-3`}>
                <div className="text-[11px] font-bold text-slate-800 w-32 shrink-0">{tag}</div>
                <div className="flex gap-2 flex-1 min-w-[220px] flex-wrap">
                  {ISO_TANK_CARGO_FIELDS.map((spec) => (
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
