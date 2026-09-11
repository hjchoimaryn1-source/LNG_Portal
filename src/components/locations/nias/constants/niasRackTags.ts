// src/components/locations/nias/constants/niasRackTags.ts

// Bay index -> physical rack tag lookup values, used by getRackTag().
// Extracted verbatim from NiasTerminalView (lines 165-168) — values only,
// the matching logic in getRackTag() is unchanged.
export const NIAS_RACK_TAG_BY_BAY_INDEX: Record<'1' | '2' | '3' | '4', string> = {
  '1': 'T-201',
  '2': 'T-202',
  '3': 'T-203',
  '4': 'T-204',
};
