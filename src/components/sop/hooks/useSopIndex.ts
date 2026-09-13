// src/components/sop/hooks/useSopIndex.ts
// Loads src/data/sopIndex.json once and exposes filtered SOPDocument[] state.

import { useMemo, useState } from 'react';
import { SOPDocument, SOPSearchFilters } from '../../../types/sop';
import { filterSopDocuments } from '../utils/sopFilter';
import sopIndexData from '../../../data/sopIndex.json';

const SOP_DOCUMENTS = sopIndexData as unknown as SOPDocument[];

export function useSopIndex() {
  const [filters, setFilters] = useState<SOPSearchFilters>({});

  const filteredDocuments = useMemo(
    () => filterSopDocuments(SOP_DOCUMENTS, filters),
    [filters]
  );

  const findByNpCode = (npCode: string): SOPDocument | undefined =>
    SOP_DOCUMENTS.find((doc) => doc.npCode === npCode);

  return {
    documents: SOP_DOCUMENTS,
    filteredDocuments,
    filters,
    setFilters,
    findByNpCode,
  };
}
