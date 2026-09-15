// src/cmms-daily-ops/hmi-overview/hmiOverviewConstants.ts
//
// PURPOSE
//   NG Buffer Tank: HJ-confirmed operating band (2026-09-15). Absolute
//   normal range 4.5-8.0 barg; typical steady-state operation 7.4-8.0 barg.
//   Promote to a configurable DB column via ALTER only if site-specific
//   variance is confirmed later.
//
//   All other domains below (AAV/Metering Train A&B/N2 Skid/GC/ISO Tank
//   Unloading Skid): no documented normal-operating-range source was found
//   in CMMS_Architecture.md / pms-master-specification.md / safety-ptw-rules.md
//   at the time these were added (Stage 1, site-launch readiness) — every
//   such constant carries its own PLACEHOLDER comment; see
//   OverviewHmiUnit.isThresholdValidated for the corresponding UI flag.
//
//   Sole source for any normal/abnormal band rendering in this module — do
//   not inline these numbers elsewhere.

export const NG_BUFFER_TANK_NORMAL_MIN_BARG = 4.5;
export const NG_BUFFER_TANK_NORMAL_MAX_BARG = 8.0;
export const NG_BUFFER_TANK_TYPICAL_MIN_BARG = 7.4;
export const NG_BUFFER_TANK_TYPICAL_MAX_BARG = 8.0;

// AAV (Ambient Air Vaporizer) — US-side gauge pressure (pressure_gauge_us_bar).
// PLACEHOLDER — mock range pending site engineer confirmation. Do not treat as validated
// safety threshold. HJ to confirm real values post-launch.
export const AAV_NORMAL_MIN_BAR = 1.0;
export const AAV_NORMAL_MAX_BAR = 12.0;
export const AAV_TYPICAL_MIN_BAR = 2.5;
export const AAV_TYPICAL_MAX_BAR = 9.0;

// Gas Sales Metering Train A/B — inlet gauge pressure (press_barg). Shared band: both
// trains are the identical skid design (pms-master-specification.md §Gas Sales Metering
// Skid & 분석기, M-101A/M-101B row).
// PLACEHOLDER — mock range pending site engineer confirmation. Do not treat as validated
// safety threshold. HJ to confirm real values post-launch.
export const METERING_TRAIN_NORMAL_MIN_BARG = 3.0;
export const METERING_TRAIN_NORMAL_MAX_BARG = 9.0;
export const METERING_TRAIN_TYPICAL_MIN_BARG = 5.5;
export const METERING_TRAIN_TYPICAL_MAX_BARG = 7.5;

// N2 Skid — cylinder supply pressure (cylinder_pressure_bar).
// PLACEHOLDER — mock range pending site engineer confirmation. Do not treat as validated
// safety threshold. HJ to confirm real values post-launch.
export const N2_SKID_NORMAL_MIN_BAR = 50;
export const N2_SKID_NORMAL_MAX_BAR = 250;
export const N2_SKID_TYPICAL_MIN_BAR = 120;
export const N2_SKID_TYPICAL_MAX_BAR = 200;

// Gas Chromatograph (EMERSON 470XA) — methane mol% (mol_methane).
// PLACEHOLDER — mock range pending site engineer confirmation. Do not treat as validated
// safety threshold. HJ to confirm real values post-launch.
export const GC_METHANE_NORMAL_MIN_PCT = 80.0;
export const GC_METHANE_NORMAL_MAX_PCT = 99.0;
export const GC_METHANE_TYPICAL_MIN_PCT = 88.0;
export const GC_METHANE_TYPICAL_MAX_PCT = 96.0;

// ISO Tank Unloading Skid — IoT level % (level_iot_pct).
// PLACEHOLDER — mock range pending site engineer confirmation. Do not treat as validated
// safety threshold. HJ to confirm real values post-launch.
export const ISO_TANK_UNLOADING_SKID_NORMAL_MIN_PCT = 5.0;
export const ISO_TANK_UNLOADING_SKID_NORMAL_MAX_PCT = 95.0;
export const ISO_TANK_UNLOADING_SKID_TYPICAL_MIN_PCT = 20.0;
export const ISO_TANK_UNLOADING_SKID_TYPICAL_MAX_PCT = 85.0;
