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
//
//   isCalibrating(PIDOverlayView.tsx 로컬 state)이 true인 동안은 배지 클릭도
//   좌표 재지정으로 소비돼야 하므로, 이 컴포넌트가 직접 그 분기를 갖는다 —
//   PIDOverlayView는 값을 그대로 내려줄 뿐 상호배제 로직을 갖지 않는다.

'use client';

import type { MouseEvent } from 'react';
import { useDailyOpsPatrolValue } from '../state/useDailyOpsPatrolStore';
import { useHmiEquipment } from '../../hmi/state/useHmiLiveStore';
import { useAlarmBadgeState } from '../../hmi/state/useAlarmBadgeState';
import type { PatrolDomain } from '../types/patrolLog';
import type { AlarmPriority } from '../../hmi/types/hmiCore';
import '../../hmi/faceplate/hmiAlarmFlash.css';

export interface PidTagBadgeProps {
  tagId: string;
  x: number;
  y: number;
  domain: PatrolDomain | undefined;
  primaryColumn: string | undefined;
  /** true면 캔버스가 캘리브레이션 모드 — 배지 클릭도 좌표 재지정으로 위임한다. */
  isCalibrating: boolean;
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

/** FaceplateReadoutRow.tsx와 동일한 억제색 토큰 — 새 회색/보라값을 만들지 않는다. */
const SUPPRESSED_FILL = 'var(--hmi-alarm-suppressed, #7c6f9c)';

export function PidTagBadge({ tagId, x, y, domain, primaryColumn, isCalibrating, onClick }: PidTagBadgeProps) {
  // Hooks 규칙상 조건부 호출 불가 — domain 미지정 시 무해한 더미 키('aav')로
  // 조회하고 hasReading으로 표시 여부만 게이팅한다.
  const value = useDailyOpsPatrolValue(domain ?? 'aav', tagId, primaryColumn ?? '');
  const hasReading = domain !== undefined && primaryColumn !== undefined && value !== undefined && value !== null;

  const { worstAlarmPriority, readings } = useHmiEquipment(domain ?? 'aav', tagId);
  // HMI-2e-1: readings(장비의 전 컬럼)을 컬럼 단위 flash/ack/suppress 판정(useAlarmAckStore.ts,
  // useAlarmSuppressionStore.ts)에 걸쳐 배지 하나짜리 최악값으로 접는다.
  const { isFlashing, isSuppressed } = useAlarmBadgeState(readings);
  const fill = isSuppressed ? SUPPRESSED_FILL : ALARM_PRIORITY_FILL[worstAlarmPriority];

  function handleBadgeClick(e: MouseEvent<SVGGElement>) {
    // 캘리브레이션 모드에선 아무 것도 하지 않고 그대로 버블링시켜, 캔버스의
    // handleCanvasClick(좌표 재지정 전용)에 클릭을 위임한다.
    if (isCalibrating || !onClick) return;
    e.stopPropagation();
    onClick(tagId);
  }

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={handleBadgeClick}
      style={{ cursor: !isCalibrating && onClick ? 'pointer' : 'inherit' }}
    >
      <circle r={6} fill={fill} stroke="white" strokeWidth={1.5} className={isFlashing ? 'hmi-alarm-flash' : undefined} />
      {/* 배지가 작아 FaceplateReadoutRow의 "(SUPPRESSED)" 텍스트가 들어갈 자리가 없다 —
          동일한 색-비의존 원칙을 지키는 축약형 아이콘 오버레이(HMI-2e-2 승인된 대안). */}
      {isSuppressed && (
        <text x={5} y={-4} fontSize={7} fontFamily="monospace" fontWeight="bold" fill="white" stroke="#002b4d" strokeWidth={0.6} textAnchor="middle">
          S
        </text>
      )}
      <rect x={10} y={-10} width={100} height={20} rx={3} fill="#002b4d" opacity={0.9} />
      <text x={16} y={4} fontSize={10} fontFamily="monospace" fill="white">
        {tagId}
        {hasReading ? `: ${value}` : ''}
      </text>
    </g>
  );
}
