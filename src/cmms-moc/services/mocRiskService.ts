// src/cmms-moc/services/mocRiskService.ts
//
// PURPOSE
//   Pure classification for NP-12 §2.1 risk-rating acceptability
//   (1-2 acceptable / 3 needs review / 4-5 not acceptable). Display/
//   classification only — never a blocking gate on save/submit, since MOC
//   approval authority belongs solely to the Site Manager per NP-12, not to
//   this system (mirrors the pure-function isolation pattern of
//   src/cmms-mro-bridge/rop/calculateReorderPoint.ts — no DB/React binding).

export type RiskClassification = 'ACCEPTABLE' | 'REVIEW_NEEDED' | 'NOT_ACCEPTABLE';

/**
 * Classifies a 1-5 NP-12 risk rating. Throws on out-of-range or non-integer
 * input — callers own validating user input before this boundary.
 */
export function classifyRiskRating(rating: number): RiskClassification {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new RangeError(`classifyRiskRating: rating must be an integer 1-5, received ${rating}`);
  }
  if (rating <= 2) return 'ACCEPTABLE';
  if (rating === 3) return 'REVIEW_NEEDED';
  return 'NOT_ACCEPTABLE';
}
