// src/cmms-daily-ops/components/patrol/ShiftSlotSelector.tsx
//
// PURPOSE
//   4시간 교대 순찰 6개 슬롯 선택 UI. NiasActiveBayWorkspace.tsx의 patrol
//   time-slot picker *패턴*(슬롯 배열 + active 하이라이트)을 참고하되, 그
//   파일을 임포트하지 않고 scadaStyles.ts 베벨 버튼 토큰으로 재구현했다.

'use client';

import { BEVEL_BUTTON, BEVEL_BUTTON_PRESSED } from '../../../components/cmms/scadaStyles';
import type { ShiftTimeSlot } from '../../types/patrolLog';

export const SHIFT_TIME_SLOTS: ShiftTimeSlot[] = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];

export interface ShiftSlotSelectorProps {
  activeSlot: ShiftTimeSlot;
  onSelect: (slot: ShiftTimeSlot) => void;
}

export function ShiftSlotSelector({ activeSlot, onSelect }: ShiftSlotSelectorProps) {
  return (
    <div className="flex items-center gap-2 border-b border-[#c8c2b5] pb-2">
      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">SHIFT TIME SLOT:</span>
      <div className="flex flex-wrap gap-1.5">
        {SHIFT_TIME_SLOTS.map((slot) => (
          <button
            key={slot}
            type="button"
            onClick={() => onSelect(slot)}
            className={slot === activeSlot ? BEVEL_BUTTON_PRESSED : BEVEL_BUTTON}
          >
            {slot}
          </button>
        ))}
      </div>
    </div>
  );
}
