// src/cmms-daily-ops/print/PrintFieldGrid.tsx
//
// PURPOSE
//   장비 태그 1개의 전체 필드(PATROL_FIELD_MAP 도메인 전체, B4 오버레이의
//   대표 컬럼 1개가 아님)를 라벨/단위와 함께 표로 렌더링하는 공용 컴포넌트.
//   snapshot_payload의 domains[domain][tag] 값을 그대로 소비한다.

import type { PatrolFieldSpec } from '../dao/patrolFieldMaps';
import type { PatrolValues } from '../dao/dailyOpsPatrolDao';

export interface PrintFieldGridProps {
  title: string;
  fields: PatrolFieldSpec[];
  values: PatrolValues | null | undefined;
}

export function PrintFieldGrid({ title, fields, values }: PrintFieldGridProps) {
  return (
    <table className="print-field-grid">
      <caption>{title}</caption>
      <tbody>
        {fields.map((f) => (
          <tr key={f.columnName}>
            <td>
              {f.label}
              {f.unit ? ` (${f.unit})` : ''}
            </td>
            <td>{values ? String(values[f.columnName] ?? '-') : '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
