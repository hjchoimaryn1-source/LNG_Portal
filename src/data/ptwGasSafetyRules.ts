// src/data/ptwGasSafetyRules.ts
// Universal PTW gas-safety gate thresholds (SSHQE_MASTER_SPECIFICATION.md §4.3).
// O2/H2S/CO bands apply uniformly across every PTW type, independent of
// PTW_SOP_FORMS[type].gasRestrictions (per-type LEL/H2S/CO values, not yet
// fully wired into validatePTWGasSafety() — see PTW_AUDIT_REPORT_2026-09-08.md
// §3 table row 7). Hg gating remains out of scope (no numeric SSHQE threshold).

import { PTWPermit } from '../types/lng';

export const O2_MIN_PERCENT = 19.5;
export const O2_MAX_PERCENT = 23.5;
export const H2S_MAX_PPM = 10; // strict: 10 ppm itself fails
export const CO_MAX_PPM = 25; // strict: 25 ppm itself fails

export function checkUniversalGasBands(
  gasReadings: PTWPermit['gasReadings']
): { isSafe: boolean; blockReason: string | null } {
  if (gasReadings.o2Percent < O2_MIN_PERCENT || gasReadings.o2Percent > O2_MAX_PERCENT) {
    return {
      isSafe: false,
      blockReason: `O2 concentration is ${gasReadings.o2Percent}% (Safe atmospheric band: ${O2_MIN_PERCENT}% ~ ${O2_MAX_PERCENT}%).`,
    };
  }

  if (gasReadings.h2sPpm >= H2S_MAX_PPM) {
    return {
      isSafe: false,
      blockReason: `H2S concentration is ${gasReadings.h2sPpm} ppm (must be strictly below ${H2S_MAX_PPM} ppm).`,
    };
  }

  if (gasReadings.coPpm >= CO_MAX_PPM) {
    return {
      isSafe: false,
      blockReason: `CO concentration is ${gasReadings.coPpm} ppm (must be strictly below ${CO_MAX_PPM} ppm).`,
    };
  }

  return { isSafe: true, blockReason: null };
}
