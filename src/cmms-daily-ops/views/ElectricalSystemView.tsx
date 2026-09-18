// src/cmms-daily-ops/views/ElectricalSystemView.tsx
//
// PURPOSE
//   Stage C4 "Electrical System" 탭 진입점 — ElectricalPatrolForm(Stage B1)
//   + 4개 서브블록의 대표 값(bus_voltage) 라이브 상태 스트립.
//   PLTMG Power relocation (2026-09-18): NiasPowerThermalTab을 두 번째 섹션으로
//   적층 — Regas & Gas Process에서 이전, 내부 로직/데이터소스는 변경 없음.

'use client';

import { useState } from 'react';
import { RAISED_PANEL } from '../../components/cmms/scadaStyles';
import { ElectricalPatrolForm } from '../components/patrol/ElectricalPatrolForm';
import { ELECTRICAL_EQUIPMENT_TAGS } from '../dao/patrolEquipmentTags';
import { useDailyOpsPatrolValue } from '../state/useDailyOpsPatrolStore';
import { usePatrolSaveHandler } from '../hooks/usePatrolSaveHandler';
import NiasPowerThermalTab from '../../components/locations/nias/NiasPowerThermalTab';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function LiveStatusBadge({ tag }: { tag: string }) {
  const value = useDailyOpsPatrolValue('electrical', tag, 'bus_voltage');
  return (
    <span className="px-2 py-1 bg-white border border-slate-300 rounded-xs">
      {tag}: {value === undefined || value === null ? '-' : `${value}V`}
    </span>
  );
}

export function ElectricalSystemView() {
  const [reportDate] = useState(today);
  const onSave = usePatrolSaveHandler('electrical', reportDate, 'FIELD OP-1');

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-sm font-black uppercase text-slate-800">Electrical System — Patrol Log</h2>
      <div className={`${RAISED_PANEL} p-2 flex flex-wrap gap-2 text-[11px] font-mono`}>
        {ELECTRICAL_EQUIPMENT_TAGS.map((tag) => (
          <LiveStatusBadge key={tag} tag={tag} />
        ))}
      </div>
      <ElectricalPatrolForm onSave={onSave} />

      <div className="border-t-2 border-slate-300 pt-3">
        <h2 className="text-sm font-black uppercase text-slate-800 mb-3">PLTMG Power</h2>
        <NiasPowerThermalTab />
      </div>
    </div>
  );
}
