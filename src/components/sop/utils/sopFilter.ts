// src/components/sop/utils/sopFilter.ts
// Pure filtering logic for SOPDocument[] — no React bindings.

import { SOPDocument, SOPSearchFilters } from '../../../types/sop';

export function filterSopDocuments(documents: SOPDocument[], filters: SOPSearchFilters): SOPDocument[] {
  const keyword = filters.keyword?.trim().toLowerCase();

  return documents.filter((doc) => {
    if (filters.categories && filters.categories.length > 0 && !filters.categories.includes(doc.category)) {
      return false;
    }

    if (
      filters.importanceLevels &&
      filters.importanceLevels.length > 0 &&
      !filters.importanceLevels.includes(doc.importanceLevel)
    ) {
      return false;
    }

    if (!keyword) return true;

    const haystack = [
      doc.npCode,
      doc.title,
      ...doc.keywords,
      doc.structuredSummary.purpose,
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(keyword);
  });
}
