// src/hmi/faceplate/FaceplateReadoutRow.tsx
//
// PURPOSE
//   FaceplateDrawer.tsx Readout 탭의 계기 값 1행 — tagId/columnName, 라이브
//   값+단위, 알람 배지. ISA-101 Practical Guide "alarm-only saturation" 원칙에
//   따라 행 배경에는 채도 높은 색을 쓰지 않고, 작은 배지 칩에만 알람색을 준다.
//   NORMAL은 PidTagBadge.tsx에서 이미 정한 회색 토큰(--hmi-alarm-normal)을
//   재사용한다 — 새 회색값을 만들지 않는다.
//
//   HMI-2c-final — suppress는 스타일만 죽이고 판정 자체(reading.alarmPriority)는
//   evaluateAlarmState.ts가 계속 실제로 계산한 값 그대로 저장/전달된다(이 컴포넌트는
//   표시만 바꾼다). --hmi-alarm-suppressed는 --hmi-alarm-normal(#94a3b8)과 다른 색 +
//   텍스트 접미사 둘 다로 구분한다 — "진짜 NORMAL"과 "억제된 알람"이 색만으로도,
//   텍스트만으로도 혼동되지 않게.

'use client';

import type { HmiInstrumentReading, AlarmPriority } from '../types/hmiCore';
import { useIsAlarmSuppressed } from '../state/useAlarmSuppressionStore';
import { useIsAlarmAcknowledged } from '../state/useAlarmAckStore';
import { FaceplateReadoutRowActions } from './FaceplateReadoutRowActions';
import './hmiAlarmFlash.css';

const ALARM_BADGE_COLOR: Record<AlarmPriority, string> = {
  CRITICAL: '#D32F2F',
  HIGH: '#F57C00',
  LOW: '#1976D2',
  NORMAL: 'var(--hmi-alarm-normal, #94a3b8)',
};

const SUPPRESSED_BADGE_COLOR = 'var(--hmi-alarm-suppressed, #7c6f9c)';

export interface FaceplateReadoutRowProps {
  reading: HmiInstrumentReading;
}

export function FaceplateReadoutRow({ reading }: FaceplateReadoutRowProps) {
  const isSuppressed = useIsAlarmSuppressed(reading.domain, reading.tagId, reading.columnName);
  const isAcknowledged = useIsAlarmAcknowledged(reading.domain, reading.tagId, reading.columnName);
  const isActionable = reading.alarmPriority === 'HIGH' || reading.alarmPriority === 'CRITICAL';
  // HMI-2d-2: suppressed가 flashing/ack 표시보다 항상 우선한다 — 억제된 알람은 깜빡이지 않는다.
  const isFlashing = isActionable && !isSuppressed && !isAcknowledged;

  return (
    <div className="flex flex-col gap-1 py-1 border-b border-[#e2ddd0] last:border-b-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col min-w-0">
          <span className="font-mono text-[9px] text-slate-500 truncate">
            {reading.tagId} · {reading.columnName}
          </span>
          <span className="font-mono">
            {reading.value ?? '—'} {reading.unit}
          </span>
        </div>
        <span
          className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${isFlashing ? 'hmi-alarm-flash' : ''}`}
          style={{ backgroundColor: isSuppressed ? SUPPRESSED_BADGE_COLOR : ALARM_BADGE_COLOR[reading.alarmPriority] }}
        >
          {reading.alarmPriority}
          {isSuppressed ? ' (SUPPRESSED)' : ''}
        </span>
      </div>
      {isActionable && <FaceplateReadoutRowActions reading={reading} />}
    </div>
  );
}
