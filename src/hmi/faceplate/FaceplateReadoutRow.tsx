// src/hmi/faceplate/FaceplateReadoutRow.tsx
//
// PURPOSE
//   FaceplateDrawer.tsx Readout 탭의 계기 값 1행 — tagId/columnName, 라이브
//   값+단위, 알람 배지. ISA-101 Practical Guide "alarm-only saturation" 원칙에
//   따라 행 배경에는 채도 높은 색을 쓰지 않고, 작은 배지 칩에만 알람색을 준다.
//   NORMAL은 PidTagBadge.tsx에서 이미 정한 회색 토큰(--hmi-alarm-normal)을
//   재사용한다 — 새 회색값을 만들지 않는다.

'use client';

import type { HmiInstrumentReading, AlarmPriority } from '../types/hmiCore';

const ALARM_BADGE_COLOR: Record<AlarmPriority, string> = {
  CRITICAL: '#D32F2F',
  HIGH: '#F57C00',
  LOW: '#1976D2',
  NORMAL: 'var(--hmi-alarm-normal, #94a3b8)',
};

export interface FaceplateReadoutRowProps {
  reading: HmiInstrumentReading;
}

export function FaceplateReadoutRow({ reading }: FaceplateReadoutRowProps) {
  return (
    <div className="flex items-center justify-between gap-2 py-1 border-b border-[#e2ddd0] last:border-b-0">
      <div className="flex flex-col min-w-0">
        <span className="font-mono text-[9px] text-slate-500 truncate">
          {reading.tagId} · {reading.columnName}
        </span>
        <span className="font-mono">
          {reading.value ?? '—'} {reading.unit}
        </span>
      </div>
      <span
        className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
        style={{ backgroundColor: ALARM_BADGE_COLOR[reading.alarmPriority] }}
      >
        {reading.alarmPriority}
      </span>
    </div>
  );
}
