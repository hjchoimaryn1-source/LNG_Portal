// src/data/ptwCargoHandlingRules.ts
// Cargo Handling (ISO Tank Unloading / Crane-Reachstacker Lifting Transfer) PTW
// named constants. Source: safety-ptw-rules.md.
// Cargo Handling permit data is carried as PTWPermit.cargoHandling (optional,
// additive field, defined in ../types/lng) — existing PTWPermit/PTW_SOP_FORMS
// fields are never modified here.

import { CargoHandlingActivityType } from '../types/lng';
import { PTW_SOP_FORMS, PTWSOPFormDef } from './ptwMasterData';

// --- SOP code mapping (NP08-xx) ---
export const CARGO_HANDLING_SOP = {
  UNLOADING_SKID: 'NP08-04',
  GAS_MONITORING: 'NP08-15',
  LIFTING_ISO_TANK: 'NP08-02',
  SHIP_TO_SHIP_TRANSFER: 'NP08-10',
} as const;

export const CARGO_HANDLING_SOP_BY_ACTIVITY: Record<CargoHandlingActivityType, string[]> = {
  UNLOADING: [CARGO_HANDLING_SOP.UNLOADING_SKID, CARGO_HANDLING_SOP.GAS_MONITORING],
  LIFTING: [CARGO_HANDLING_SOP.LIFTING_ISO_TANK, CARGO_HANDLING_SOP.SHIP_TO_SHIP_TRANSFER],
  COMBINED: [
    CARGO_HANDLING_SOP.UNLOADING_SKID,
    CARGO_HANDLING_SOP.GAS_MONITORING,
    CARGO_HANDLING_SOP.LIFTING_ISO_TANK,
    CARGO_HANDLING_SOP.SHIP_TO_SHIP_TRANSFER,
  ],
};

// --- Mandatory AGT measurement points (Unloading Skid) ---
export const CARGO_HANDLING_AGT_MANDATORY_POINTS = ['T-201', 'T-202', 'T-203', 'T-204'] as const;

// --- Critical High Risk escalation threshold ---
export const CRITICAL_HIGH_RISK_WEIGHT_TON = 25;

// --- Gas safety thresholds (Unloading) ---
export const UNLOADING_LEL_MAX_PERCENT = 10;
export const UNLOADING_O2_MIN_PERCENT = 19.5;
export const UNLOADING_O2_MAX_PERCENT = 23.5;
export const SCBA_REQUIRED_BELOW_O2_PERCENT = 19.5;
export const ATMOSPHERE_SAFE_LEL_MAX_PERCENT = 0;
export const ATMOSPHERE_SAFE_O2_TARGET_PERCENT = 20.9;
export const ATMOSPHERE_SAFE_O2_TOLERANCE_PERCENT = 0.4;
export const GAS_RETEST_INTERVAL_HOURS = 4;

// --- Grounding & Bonding threshold ---
export const GROUNDING_RESISTANCE_MAX_OHM = 5;

// --- Barricade radius thresholds ---
// Spec only defines a hard block on falling short of the minimum; the lifting
// max is the SOP's documented upper reference band, not an additional block.
export const BARRICADE_RADIUS_UNLOADING_MIN_M = 25;
export const BARRICADE_RADIUS_LIFTING_MIN_M = 50;
export const BARRICADE_RADIUS_LIFTING_MAX_M = 100;

// --- Depressurization targets (ISO Tank / hose disconnection gate) ---
export const DEPRESSURIZATION_T203_TAG_ID = 'T-203';
export const DEPRESSURIZATION_TARGET_MPA_DEFAULT = 0.4;
export const DEPRESSURIZATION_TARGET_MPA_T203 = 0.1;
export const DEPRESSURIZATION_TARGET_MPA_HOSE = 0.0;

// --- Per-activity-type SOP form info ---
// PTW_SOP_FORMS[CARGO_HANDLING] only carries one representative formNumber
// (see NOTE comment above that entry in ptwMasterData.ts). This assembles the
// actual 1:N SOP set for a given activity from CARGO_HANDLING_SOP_BY_ACTIVITY,
// so no UI surface displays the single placeholder value as if it were complete.
export function getCargoHandlingSOPInfo(activityType: CargoHandlingActivityType): PTWSOPFormDef[] {
  const base = PTW_SOP_FORMS.CARGO_HANDLING;
  return CARGO_HANDLING_SOP_BY_ACTIVITY[activityType].map((formNumber) => ({
    ...base,
    formNumber,
  }));
}
