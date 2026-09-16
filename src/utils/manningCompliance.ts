// src/utils/manningCompliance.ts
//
// Barrel re-export. Phase 13 Target B Sub-stage C: this file exceeded the 250-line cap
// (366 lines) and was split into ertSummary.ts / rollingManningForecast.ts /
// relieverCandidates.ts. Kept as a thin re-export here (same pattern as
// manpowerCalculations.ts) so manningCompliance.test.ts's existing
// `from './manningCompliance'` imports — including getWibDate — need no changes.

export * from './ertSummary';
export * from './rollingManningForecast';
export * from './relieverCandidates';
