// src/cmms-mro-bridge/crosswalkBuilder.ts
//
// PURPOSE
//   Pure matching logic for Phase 10 Stage 1B: for each existing mro_parts
//   row, propose a candidate impa_catalog.impa_code by token-overlap
//   similarity against part_name/specification. No React/DB bindings.
//
// NON-GOAL
//   Never guesses a match when there is no real impa_catalog data to compare
//   against (docs/phase10-stage0-investigation-report.md Task 2: impa_catalog
//   has 0 rows and no IMPA_Store_Code source file exists anywhere in the
//   repo). An empty catalog must yield UNMATCHED for every part — never a
//   fabricated candidate.

export interface CrosswalkSourcePart {
  partNo: string;
  partName: string;
}

export interface CrosswalkCatalogRow {
  impaCode: string;
  partName: string;
  specification: string | null;
}

export type CrosswalkStatus = 'AUTO_MATCHED' | 'NEEDS_REVIEW' | 'UNMATCHED';

export interface CrosswalkCandidate {
  legacyPartId: string;
  impaCodeCandidate: string | null;
  matchConfidence: number;
  status: CrosswalkStatus;
  matchedReason: string;
}

export const AUTO_MATCH_THRESHOLD = 0.6;
export const NEEDS_REVIEW_THRESHOLD = 0.3;

const STOPWORDS = new Set(['a', 'an', 'the', 'of', 'for']);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 1 && !STOPWORDS.has(t))
  );
}

/** Jaccard similarity over token sets — deterministic, no external ML/embedding dependency. */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function bestCandidate(
  partTokens: Set<string>,
  catalog: CrosswalkCatalogRow[]
): { impaCode: string; score: number } | undefined {
  let best: { impaCode: string; score: number } | undefined;
  for (const row of catalog) {
    const catTokens = tokenize(`${row.partName} ${row.specification ?? ''}`);
    const score = jaccardSimilarity(partTokens, catTokens);
    if (!best || score > best.score) best = { impaCode: row.impaCode, score };
  }
  return best;
}

/**
 * Builds one candidate row per mroParts entry. Never inserts a candidate
 * impa_code when the catalog is empty or no candidate clears
 * NEEDS_REVIEW_THRESHOLD — those cases return status UNMATCHED with
 * impaCodeCandidate: null.
 */
export function buildCandidateMatches(
  mroParts: CrosswalkSourcePart[],
  impaCatalog: CrosswalkCatalogRow[]
): CrosswalkCandidate[] {
  if (impaCatalog.length === 0) {
    return mroParts.map((part) => ({
      legacyPartId: part.partNo,
      impaCodeCandidate: null,
      matchConfidence: 0,
      status: 'UNMATCHED',
      matchedReason: 'impa_catalog has 0 rows — no candidates exist to compare against.',
    }));
  }

  return mroParts.map((part) => {
    const partTokens = tokenize(part.partName);
    const best = bestCandidate(partTokens, impaCatalog);

    if (!best || best.score < NEEDS_REVIEW_THRESHOLD) {
      return {
        legacyPartId: part.partNo,
        impaCodeCandidate: null,
        matchConfidence: best?.score ?? 0,
        status: 'UNMATCHED',
        matchedReason: `Best candidate similarity ${(best?.score ?? 0).toFixed(2)} < NEEDS_REVIEW threshold ${NEEDS_REVIEW_THRESHOLD}.`,
      };
    }

    if (best.score >= AUTO_MATCH_THRESHOLD) {
      return {
        legacyPartId: part.partNo,
        impaCodeCandidate: best.impaCode,
        matchConfidence: best.score,
        status: 'AUTO_MATCHED',
        matchedReason: `Token-overlap similarity ${best.score.toFixed(2)} >= AUTO_MATCH threshold ${AUTO_MATCH_THRESHOLD}.`,
      };
    }

    return {
      legacyPartId: part.partNo,
      impaCodeCandidate: best.impaCode,
      matchConfidence: best.score,
      status: 'NEEDS_REVIEW',
      matchedReason: `Token-overlap similarity ${best.score.toFixed(2)} between thresholds — human confirmation required.`,
    };
  });
}
