// src/components/sop/SopStructuredCard.tsx
// UI Layer (1-Layer view): renders one SOPDocument's structuredSummary
// (purpose, keyRequirements, approvalLine, safetyRules). Anchors with
// level <= 2 are shown as jump links into the 2-Layer raw viewer.

import { SOPDocument } from '../../types/sop';
import { IMPORTANCE_BADGE_CLASS, SOP_CATEGORY_LABELS } from './constants/sopDisplay';

interface SopStructuredCardProps {
  doc: SOPDocument;
  onOpenRaw: (npCode: string, anchorId?: string) => void;
}

const MAX_ANCHOR_LINKS = 12;

export function SopStructuredCard({ doc, onOpenRaw }: SopStructuredCardProps) {
  const topAnchors = doc.anchors.filter((a) => a.level <= 2).slice(0, MAX_ANCHOR_LINKS);
  const hiddenAnchorCount = doc.anchors.filter((a) => a.level <= 2).length - topAnchors.length;

  return (
    <div className="border border-neutral-300 bg-white rounded-none overflow-hidden font-mono text-xs">
      <div className="bg-[#8A9EA7] text-slate-900 font-bold text-xs h-8 px-3 flex items-center justify-between border-b border-neutral-300">
        <span>
          {doc.npCode} — {doc.title}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 border rounded-none ${IMPORTANCE_BADGE_CLASS[doc.importanceLevel]}`}
          >
            {doc.importanceLevel}
          </span>
          <span className="text-[10px] font-mono font-bold bg-[#d4d0c8] text-black px-1.5 py-0.5 border border-[#808080] rounded-none">
            {SOP_CATEGORY_LABELS[doc.category]}
          </span>
        </div>
      </div>

      <div className="p-3 space-y-2 text-slate-800">
        <p className="leading-snug">{doc.structuredSummary.purpose}</p>

        <div>
          <div className="text-[10px] font-bold text-slate-600 tracking-wider mb-0.5">KEY REQUIREMENTS</div>
          <ul className="list-disc list-inside space-y-0.5">
            {doc.structuredSummary.keyRequirements.map((req, i) => (
              <li key={i}>{req}</li>
            ))}
          </ul>
        </div>

        {doc.structuredSummary.safetyRules.length > 0 && (
          <div>
            <div className="text-[10px] font-bold text-red-700 tracking-wider mb-0.5">SAFETY RULES</div>
            <ul className="list-disc list-inside space-y-0.5 text-red-900">
              {doc.structuredSummary.safetyRules.map((rule, i) => (
                <li key={i}>{rule}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <div className="text-[10px] font-bold text-slate-600 tracking-wider mb-0.5">APPROVAL LINE</div>
          <div className="text-slate-600">{doc.structuredSummary.approvalLine.join(' / ')}</div>
        </div>

        <div className="pt-1 border-t border-neutral-200">
          <div className="text-[10px] font-bold text-slate-600 tracking-wider mb-1">RAW DOCUMENT</div>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => onOpenRaw(doc.npCode)}
              className="text-[10px] font-mono font-bold bg-[#2A3B4C] text-white px-1.5 py-0.5 border border-[#2A3B4C] rounded-none hover:bg-[#3a4f64]"
            >
              OPEN FULL DOC
            </button>
            {topAnchors.map((anchor) => (
              <button
                key={anchor.anchorId}
                type="button"
                onClick={() => onOpenRaw(doc.npCode, anchor.anchorId)}
                className="text-[10px] font-mono bg-white text-slate-700 px-1.5 py-0.5 border border-neutral-400 rounded-none hover:bg-neutral-100"
              >
                {anchor.headingText}
              </button>
            ))}
            {hiddenAnchorCount > 0 && (
              <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.5">+{hiddenAnchorCount} more</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
