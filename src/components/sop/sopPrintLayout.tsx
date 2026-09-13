// src/components/sop/sopPrintLayout.tsx
// Layer variant: A4 print/PDF-oriented layout for one SOPDocument, including
// full raw markdown text. Toggled from SopRawMarkdownViewer's PRINT button;
// only the #sop-print-area subtree stays visible when the browser prints.

import { SOPDocument } from '../../types/sop';
import { SOP_CATEGORY_LABELS } from './constants/sopDisplay';

interface SopPrintLayoutProps {
  doc: SOPDocument;
  lines: { text: string }[];
  onClose: () => void;
}

export function SopPrintLayout({ doc, lines, onClose }: SopPrintLayoutProps) {
  return (
    <div className="h-full flex flex-col bg-neutral-300">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #sop-print-area, #sop-print-area * { visibility: visible; }
          #sop-print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      <div className="print:hidden bg-[#2A3B4C] text-white p-2 px-3 flex justify-between items-center shrink-0">
        <span className="font-bold text-xs font-mono tracking-wider">{doc.npCode} PRINT VIEW</span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="text-[11px] font-mono font-bold bg-[#d4d0c8] text-black px-2 py-0.5 border border-[#808080] rounded-none hover:bg-[#dfdbd3]"
          >
            PRINT
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] font-mono font-bold bg-[#d4d0c8] text-black px-2 py-0.5 border border-[#808080] rounded-none hover:bg-[#dfdbd3]"
          >
            CLOSE
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 print:p-0 print:overflow-visible">
        <div
          id="sop-print-area"
          className="mx-auto bg-white text-black w-[210mm] min-h-[297mm] p-[15mm] shadow-lg print:shadow-none print:w-auto print:min-h-0 print:p-0 font-sans text-[11px] leading-relaxed"
        >
          <header className="border-b-2 border-black pb-2 mb-3 flex justify-between items-end">
            <div>
              <div className="text-lg font-bold">
                {doc.npCode} — {doc.title}
              </div>
              <div className="text-[10px] text-neutral-600">
                {SOP_CATEGORY_LABELS[doc.category]} · {doc.importanceLevel} IMPORTANCE
              </div>
            </div>
            <div className="text-[10px] text-neutral-600 text-right">
              <div>Version {doc.version}</div>
              <div>Last Updated {doc.lastUpdated}</div>
            </div>
          </header>

          <section className="mb-3">
            <h2 className="text-[11px] font-bold tracking-wider mb-1">PURPOSE</h2>
            <p>{doc.structuredSummary.purpose}</p>
          </section>

          <section className="mb-3">
            <h2 className="text-[11px] font-bold tracking-wider mb-1">KEY REQUIREMENTS</h2>
            <ul className="list-disc list-inside space-y-0.5">
              {doc.structuredSummary.keyRequirements.map((req, i) => (
                <li key={i}>{req}</li>
              ))}
            </ul>
          </section>

          {doc.structuredSummary.safetyRules.length > 0 && (
            <section className="mb-3">
              <h2 className="text-[11px] font-bold tracking-wider mb-1 text-red-800">SAFETY RULES</h2>
              <ul className="list-disc list-inside space-y-0.5">
                {doc.structuredSummary.safetyRules.map((rule, i) => (
                  <li key={i}>{rule}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="mb-3">
            <h2 className="text-[11px] font-bold tracking-wider mb-1">APPROVAL LINE</h2>
            <p>{doc.structuredSummary.approvalLine.join(' / ')}</p>
          </section>

          {doc.checklists.length > 0 && (
            <section className="mb-3 break-inside-avoid">
              <h2 className="text-[11px] font-bold tracking-wider mb-1">CHECKLISTS</h2>
              {doc.checklists.map((cl) => (
                <table key={cl.checklistId} className="w-full border-collapse border border-black mb-2 text-[10px]">
                  <caption className="text-left font-bold mb-0.5">
                    {cl.title}
                    {cl.formCode ? ` (${cl.formCode})` : ''}
                  </caption>
                  <thead>
                    <tr>
                      <th className="border border-black p-1 text-left">Item</th>
                      <th className="border border-black p-1 text-left">Criteria</th>
                      <th className="border border-black p-1 w-16">Check</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cl.items.map((item) => (
                      <tr key={item.itemId}>
                        <td className="border border-black p-1">{item.description}</td>
                        <td className="border border-black p-1">{item.passFailCriteria ?? '-'}</td>
                        <td className="border border-black p-1"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}
            </section>
          )}

          <section className="break-before-page">
            <h2 className="text-[11px] font-bold tracking-wider mb-1 border-t-2 border-black pt-2">FULL DOCUMENT TEXT</h2>
            <pre className="whitespace-pre-wrap font-mono text-[9px] leading-snug">{lines.map((l) => l.text).join('\n')}</pre>
          </section>
        </div>
      </div>
    </div>
  );
}
