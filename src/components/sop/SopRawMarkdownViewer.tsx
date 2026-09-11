// src/components/sop/SopRawMarkdownViewer.tsx
// UI Layer (2-Layer view): raw .md viewer with auto-scroll & highlight of a
// targeted anchorId. Fetch/parse state lives in hooks/useSopRawMarkdown.ts.

import { useEffect, useRef } from 'react';
import { SOPDocument } from '../../types/sop';
import { useSopRawMarkdown } from './hooks/useSopRawMarkdown';
import { findAnchorLineIndex } from './utils/sopMarkdownAnchors';

interface SopRawMarkdownViewerProps {
  doc: SOPDocument;
  targetAnchorId?: string;
  onClose: () => void;
}

export function SopRawMarkdownViewer({ doc, targetAnchorId, onClose }: SopRawMarkdownViewerProps) {
  const { lines, isLoading, error } = useSopRawMarkdown(doc.markdownFilePath);
  const targetLineRef = useRef<HTMLDivElement | null>(null);
  const targetLineIndex = findAnchorLineIndex(lines, targetAnchorId);

  useEffect(() => {
    if (targetLineRef.current) {
      targetLineRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetLineIndex, lines.length]);

  return (
    <div className="border border-neutral-400 bg-white rounded-none overflow-hidden font-mono text-xs flex flex-col h-full">
      <div className="bg-[#2A3B4C] text-white p-2 px-3 flex justify-between items-center border-b border-[#2A3B4C] shrink-0">
        <span className="font-bold text-xs tracking-wider">
          {doc.npCode} RAW DOCUMENT — {doc.markdownFilePath}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-[11px] font-mono font-bold bg-[#d4d0c8] text-black px-2 py-0.5 border border-[#808080] rounded-none hover:bg-[#dfdbd3]"
        >
          CLOSE
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#f4f1ea] p-2">
        {isLoading && <div className="text-slate-500 p-2">LOADING...</div>}
        {error && <div className="text-red-700 p-2">FETCH ERROR: {error}</div>}
        {!isLoading &&
          !error &&
          lines.map((line, i) => {
            const isTarget = i === targetLineIndex;
            return (
              <div
                key={i}
                ref={isTarget ? targetLineRef : undefined}
                className={`whitespace-pre-wrap leading-snug px-1 ${
                  isTarget ? 'bg-amber-300 text-black font-bold' : 'text-slate-800'
                }`}
              >
                {line.text || ' '}
              </div>
            );
          })}
      </div>
    </div>
  );
}
