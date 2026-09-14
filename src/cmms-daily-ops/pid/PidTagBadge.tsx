// src/cmms-daily-ops/pid/PidTagBadge.tsx
//
// PURPOSE
//   P&ID 캔버스 위 태그 1개의 배지 — 라벨 + 대표 실시간 값 1개.
//   여러 필드를 한 배지에 다 보여주면 다이어그램이 어수선해지므로,
//   도메인당 대표 컬럼 1개(PRIMARY_COLUMN_BY_DOMAIN, PIDOverlayView.tsx)만
//   표시한다 — 원 지시에 상세 규정이 없어 내린 최소 범위의 UX 판단.

'use client';

import { useDailyOpsPatrolValue } from '../state/useDailyOpsPatrolStore';
import type { PatrolDomain } from '../types/patrolLog';

export interface PidTagBadgeProps {
  tagId: string;
  x: number;
  y: number;
  domain: PatrolDomain | undefined;
  primaryColumn: string | undefined;
}

export function PidTagBadge({ tagId, x, y, domain, primaryColumn }: PidTagBadgeProps) {
  // Hooks 규칙상 조건부 호출 불가 — domain 미지정 시 무해한 더미 키('aav')로
  // 조회하고 hasReading으로 표시 여부만 게이팅한다.
  const value = useDailyOpsPatrolValue(domain ?? 'aav', tagId, primaryColumn ?? '');
  const hasReading = domain !== undefined && primaryColumn !== undefined && value !== undefined && value !== null;

  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle r={6} fill="#0284c7" stroke="white" strokeWidth={1.5} />
      <rect x={10} y={-10} width={100} height={20} rx={3} fill="#002b4d" opacity={0.9} />
      <text x={16} y={4} fontSize={10} fontFamily="monospace" fill="white">
        {tagId}
        {hasReading ? `: ${value}` : ''}
      </text>
    </g>
  );
}
