// src/components/sop/SopReferenceViewer.tsx
// UI Layer: top-level 2-Layer container — Layer 1 (search + structured card
// list) on the left, Layer 2 (raw markdown viewer) opens on the right once
// an anchor is selected. Composes the pieces below; owns no business logic.

import { useState } from 'react';
import { useSopIndex } from './hooks/useSopIndex';
import { SopSearchPanel } from './SopSearchPanel';
import { SopStructuredCard } from './SopStructuredCard';
import { SopRawMarkdownViewer } from './SopRawMarkdownViewer';

export function SopReferenceViewer() {
  const { filteredDocuments, filters, setFilters, findByNpCode } = useSopIndex();
  const [rawTarget, setRawTarget] = useState<{ npCode: string; anchorId?: string } | null>(null);

  const rawDoc = rawTarget ? findByNpCode(rawTarget.npCode) : undefined;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 h-full">
      <div className="space-y-2 overflow-y-auto">
        <SopSearchPanel filters={filters} onFiltersChange={setFilters} resultCount={filteredDocuments.length} />
        <div className="space-y-2">
          {filteredDocuments.map((doc) => (
            <SopStructuredCard
              key={doc.npCode}
              doc={doc}
              onOpenRaw={(npCode, anchorId) => setRawTarget({ npCode, anchorId })}
            />
          ))}
        </div>
      </div>

      <div className="min-h-[400px]">
        {rawDoc ? (
          <SopRawMarkdownViewer doc={rawDoc} targetAnchorId={rawTarget?.anchorId} onClose={() => setRawTarget(null)} />
        ) : (
          <div className="border border-neutral-400 bg-neutral-200/60 h-full flex items-center justify-center text-slate-500 font-mono text-xs">
            SELECT AN SOP TO VIEW RAW DOCUMENT
          </div>
        )}
      </div>
    </div>
  );
}
