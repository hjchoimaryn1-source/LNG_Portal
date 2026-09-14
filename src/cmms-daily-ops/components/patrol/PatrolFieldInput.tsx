// src/cmms-daily-ops/components/patrol/PatrolFieldInput.tsx
//
// PURPOSE
//   PatrolFieldSpec(patrolFieldMaps.ts) 1건을 라벨+입력창으로 렌더링하는
//   공용 컴포넌트. number/text 컬럼 타입에 따라 입력 컨트롤을 분기한다.
//   (원 지시에는 없던 파일 — 6개 B1 폼이 동일한 필드 렌더링 블록을 반복
//   구현하는 걸 피하기 위한 최소 범위의 추가, deviation note 참고)

'use client';

import { SUNKEN_INPUT } from '../../../components/cmms/scadaStyles';
import type { PatrolFieldSpec } from '../../dao/patrolFieldMaps';
import type { PatrolFieldValue } from '../../dao/dailyOpsPatrolDao';

export interface PatrolFieldInputProps {
  spec: PatrolFieldSpec;
  value: PatrolFieldValue;
  onChange: (columnName: string, value: PatrolFieldValue) => void;
}

export function PatrolFieldInput({ spec, value, onChange }: PatrolFieldInputProps) {
  const label = spec.unit ? `${spec.label} (${spec.unit})` : spec.label;

  return (
    <div className="flex flex-col">
      <label className="text-[10px] font-bold text-slate-700 uppercase mb-1 truncate text-center">{label}</label>
      {spec.type === 'number' ? (
        <input
          type="number"
          step="any"
          value={value === null ? '' : (value as number)}
          onChange={(e) => onChange(spec.columnName, e.target.value === '' ? null : parseFloat(e.target.value))}
          className={`${SUNKEN_INPUT} text-center`}
        />
      ) : (
        <input
          type="text"
          value={value === null ? '' : String(value)}
          onChange={(e) => onChange(spec.columnName, e.target.value === '' ? null : e.target.value)}
          className={SUNKEN_INPUT}
        />
      )}
    </div>
  );
}
