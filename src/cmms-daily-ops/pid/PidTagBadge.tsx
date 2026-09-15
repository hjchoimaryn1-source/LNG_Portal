// src/cmms-daily-ops/pid/PidTagBadge.tsx
//
// PURPOSE
//   P&ID 캔버스 위 태그 1개의 배지 — 라벨 + 대표 실시간 값 1개.
//   여러 필드를 한 배지에 다 보여주면 다이어그램이 어수선해지므로,
//   도메인당 대표 컬럼 1개(PRIMARY_COLUMN_BY_DOMAIN, PIDOverlayView.tsx)만
//   표시한다 — 원 지시에 상세 규정이 없어 내린 최소 범위의 UX 판단.
//
//   Stage HMI-1d: 배지 색은 고정 팔레트 대신 useHmiEquipment()의
//   worstAlarmPriority로 정한다. evaluateAlarmState가 항상 'NORMAL'을
//   반환하는 스텁이라 지금은 전부 저채도 회색조로 보이는 게 정상이다
//   (버그 아님). 표시값(value)은 여전히 useDailyOpsPatrolValue로 조회 —
//   최소 diff를 위해 기존 경로를 그대로 둔다.

'use client';

import { useDailyOpsPatrolValue } from '../state/useDailyOpsPatrolStore';
import { useHmiEquipment } from '../../hmi/state/useHmiLiveStore';
import type { PatrolDomain } from '../types/patrolLog';
import type { AlarmPriority } from '../../hmi/types/hmiCore';

export interface PidTagBadgeProps {
  tagId: string;
  x: number;
  y: number;
  domain: PatrolDomain | undefined;
  primaryColumn: string | undefined;
  onClick?: (tagId: string) => void;
}

/**
 * PLACEHOLDER — hmiCore.AlarmPriority(CRITICAL/HIGH/LOW/NORMAL)용 색상.
 * scadaStyles.ts의 ALARM_COLORS(ISA-101 4단계, MEDIUM 포함)와는 등급 구성이
 * 달라 별개 팔레트로 둔다 — NotebookLM 임계값 도착 후 재조정 예정.
 */
const ALARM_PRIORITY_FILL: Record<AlarmPriority, string> = {
  CRITICAL: 'var(--hmi-alarm-critical, #EF4444)',
  HIGH: 'var(--hmi-alarm-high, #F97316)',
  LOW: 'var(--hmi-alarm-low, #0284c7)',
  NORMAL: 'var(--hmi-alarm-normal, #94a3b8)',
};

export function PidTagBadge({ tagId, x, y, domain, primaryColumn, onClick }: PidTagBadgeProps) {
  // Hooks 규칙상 조건부 호출 불가 — domain 미지정 시 무해한 더미 키('aav')로
  // 조회하고 hasReading으로 표시 여부만 게이팅한다.
  const value = useDailyOpsPatrolValue(domain ?? 'aav', tagId, primaryColumn ?? '');
  const hasReading = domain !== undefined && primaryColumn !== undefined && value !== undefined && value !== null;

  const { worstAlarmPriority } = useHmiEquipment(domain ?? 'aav', tagId);
  const fill = ALARM_PRIORITY_FILL[worstAlarmPriority];

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={
        onClick
          ? (e) => {
              e.stopPropagation();
              onClick(tagId);
            }
          : undefined
      }
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <circle r={6} fill={fill} stroke="white" strokeWidth={1.5} />
      <rect x={10} y={-10} width={100} height={20} rx={3} fill="#002b4d" opacity={0.9} />
      <text x={16} y={4} fontSize={10} fontFamily="monospace" fill="white">
        {tagId}
        {hasReading ? `: ${value}` : ''}
      </text>
    </g>
  );
}
