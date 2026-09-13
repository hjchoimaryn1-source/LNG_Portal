// src/components/sop/SopQuickLinkBar.tsx
// Lightweight component reading SOP_QUICK_LINK_MAP. Designed to be dropped
// into NewPTWPermitModal / WorkOrderListView / CargoHandlingPermitForm
// without touching those files' business logic — it only emits onSelect.

import { SOP_QUICK_LINK_MAP, SopQuickLink, SopQuickLinkContext } from './constants/sopQuickLinkMap';

interface SopQuickLinkBarProps {
  context: SopQuickLinkContext;
  onSelect: (link: SopQuickLink) => void;
}

export function SopQuickLinkBar({ context, onSelect }: SopQuickLinkBarProps) {
  const links = SOP_QUICK_LINK_MAP[context] ?? [];
  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 font-mono">
      <span className="text-[10px] font-bold text-slate-600 tracking-wider">SOP REF:</span>
      {links.map((link) => (
        <button
          key={`${link.npCode}-${link.anchorId}`}
          type="button"
          onClick={() => onSelect(link)}
          className="text-[10px] font-mono font-bold bg-[#d4d0c8] text-black px-1.5 py-0.5 border border-[#808080] rounded-none hover:bg-[#dfdbd3]"
        >
          {link.label}
        </button>
      ))}
    </div>
  );
}
