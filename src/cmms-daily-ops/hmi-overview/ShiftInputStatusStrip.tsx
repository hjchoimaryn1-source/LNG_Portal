// src/cmms-daily-ops/hmi-overview/ShiftInputStatusStrip.tsx
//
// PURPOSE
//   Row for the 6 fixed 4h shift_time_slot values (patrolLog.ts
//   ShiftTimeSlot). Sub-stage B (HmiOverviewContainer.tsx) wires real data
//   in via the optional `status` prop (getShiftInputStatus); when omitted —
//   the Sub-stage A mock fixture / isolated dev usage — falls back to the
//   original static placeholder so that usage is unaffected.

'use client';

import type { ShiftTimeSlot } from '../types/patrolLog';

const SHIFT_TIME_SLOTS: ShiftTimeSlot[] = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];

// Fallback when no `status` prop is given — first 3 slots "filled", rest
// "pending", purely to visually validate the strip's layout without real data.
const PLACEHOLDER_STATUS: Record<ShiftTimeSlot, boolean> = {
  '00:00': true,
  '04:00': true,
  '08:00': true,
  '12:00': false,
  '16:00': false,
  '20:00': false,
};

interface ShiftInputStatusStripProps {
  status?: Record<ShiftTimeSlot, boolean>;
}

export function ShiftInputStatusStrip({ status }: ShiftInputStatusStripProps) {
  const resolvedStatus = status ?? PLACEHOLDER_STATUS;
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-bold text-slate-600 uppercase mr-1">Shift Input Status</span>
      {SHIFT_TIME_SLOTS.map((slot) => (
        <div key={slot} className="flex flex-col items-center gap-0.5">
          <div
            className="w-5 h-5 rounded-sm border border-slate-400"
            style={{ backgroundColor: resolvedStatus[slot] ? '#94a3b8' : 'transparent' }}
          />
          <span className="text-[8px] font-mono text-slate-500">{slot}</span>
        </div>
      ))}
    </div>
  );
}
