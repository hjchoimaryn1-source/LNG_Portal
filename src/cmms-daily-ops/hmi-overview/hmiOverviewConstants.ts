// src/cmms-daily-ops/hmi-overview/hmiOverviewConstants.ts
//
// PURPOSE
//   HJ-confirmed operating band (2026-09-15). Absolute normal range
//   4.5-8.0 barg; typical steady-state operation 7.4-8.0 barg. Promote to a
//   configurable DB column via ALTER only if site-specific variance is
//   confirmed later.
//
//   Sole source for any normal/abnormal band rendering in this module — do
//   not inline these numbers elsewhere.

export const NG_BUFFER_TANK_NORMAL_MIN_BARG = 4.5;
export const NG_BUFFER_TANK_NORMAL_MAX_BARG = 8.0;
export const NG_BUFFER_TANK_TYPICAL_MIN_BARG = 7.4;
export const NG_BUFFER_TANK_TYPICAL_MAX_BARG = 8.0;
