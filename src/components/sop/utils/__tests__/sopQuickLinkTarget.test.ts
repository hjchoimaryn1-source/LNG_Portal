// src/components/sop/utils/__tests__/sopQuickLinkTarget.test.ts
// Verifies the Phase9-StageC fix: a SopQuickLink's {npCode, anchorId} must
// survive encode -> (handleSelectSubProcess focusId channel) -> decode
// round-trip intact, for every real entry in SOP_QUICK_LINK_MAP (the exact
// links rendered by SopQuickLinkBar on the PTW and Work Order screens).

import { describe, it, expect } from 'vitest';
import { SOP_QUICK_LINK_MAP } from '../../constants/sopQuickLinkMap';
import { encodeSopQuickLinkTarget, decodeSopQuickLinkTarget } from '../sopQuickLinkTarget';

const ALL_LINKS = Object.values(SOP_QUICK_LINK_MAP).flat();

describe('sopQuickLinkTarget', () => {
  it('round-trips every real SOP_QUICK_LINK_MAP entry through encode/decode', () => {
    expect(ALL_LINKS.length).toBeGreaterThan(0);
    for (const link of ALL_LINKS) {
      const encoded = encodeSopQuickLinkTarget(link);
      const decoded = decodeSopQuickLinkTarget(encoded);
      expect(decoded).toEqual({ npCode: link.npCode, anchorId: link.anchorId });
    }
  });

  it('decodes null/undefined/empty input as null (blank-viewer fallback, not a crash)', () => {
    expect(decodeSopQuickLinkTarget(null)).toBeNull();
    expect(decodeSopQuickLinkTarget(undefined)).toBeNull();
    expect(decodeSopQuickLinkTarget('')).toBeNull();
  });

  it('does not confuse an npCode-only string (no anchor) with a missing target', () => {
    const decoded = decodeSopQuickLinkTarget('NP-07');
    expect(decoded).toEqual({ npCode: 'NP-07', anchorId: undefined });
  });
});
