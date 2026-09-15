// src/cmms-daily-ops/hmi-overview/ShiftInputStatusStrip.tsx
//
// PURPOSE
//   Static placeholder row for the 6 fixed 4h shift_time_slot values
//   (patrolLog.ts ShiftTimeSlot). Sub-stage A renders a dummy fill state
//   only — real aggregation is NOT computed here.
//
// TODO(hmi-overview-B): replace `placeholderFilled` below with real data
// sourced from `getShiftInputStatus()` (to be added to dailyOpsPatrolDao.ts
// in a later sub-stage), passed in via props instead of hardcoded here.

'use client';

const SHIFT_TIME_SLOTS = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'] as const;

// Placeholder only — first 3 slots shown "filled", rest "pending", purely to
// visually validate the strip's layout ahead of real wiring.
const placeholderFilled: boolean[] = [true, true, true, false, false, false];

export function ShiftInputStatusStrip() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-bold text-slate-600 uppercase mr-1">Shift Input Status</span>
      {SHIFT_TIME_SLOTS.map((slot, i) => (
        <div key={slot} className="flex flex-col items-center gap-0.5">
          <div
            className="w-5 h-5 rounded-sm border border-slate-400"
            style={{ backgroundColor: placeholderFilled[i] ? '#94a3b8' : 'transparent' }}
          />
          <span className="text-[8px] font-mono text-slate-500">{slot}</span>
        </div>
      ))}
    </div>
  );
}
