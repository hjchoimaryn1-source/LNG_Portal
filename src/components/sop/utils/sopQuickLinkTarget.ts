// src/components/sop/utils/sopQuickLinkTarget.ts
// A SopQuickLink click needs to survive the trip through the existing
// handleSelectSubProcess(key, focusId?: string) navigation channel (see
// usePortalNavigation.ts) — that channel only carries a single opaque
// string. These helpers encode/decode {npCode, anchorId} into that string
// so SopReferenceViewer can resolve the exact document + anchor a
// quick-link button was clicked for, instead of opening a blank viewer.

import { SopQuickLink } from '../constants/sopQuickLinkMap';

const TARGET_DELIMITER = '|';

export interface SopQuickLinkTarget {
  npCode: string;
  anchorId?: string;
}

export function encodeSopQuickLinkTarget(link: SopQuickLink): string {
  return `${link.npCode}${TARGET_DELIMITER}${link.anchorId}`;
}

export function decodeSopQuickLinkTarget(raw: string | null | undefined): SopQuickLinkTarget | null {
  if (!raw) return null;
  const [npCode, anchorId] = raw.split(TARGET_DELIMITER);
  if (!npCode) return null;
  return { npCode, anchorId: anchorId || undefined };
}
