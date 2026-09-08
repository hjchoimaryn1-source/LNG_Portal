// src/components/manpower/tabs/ptw/PTWTypeFilterStrip.tsx
"use client";

import React from 'react';
import { PTWPermit, PTWType } from '../../../../types/lng';

export type PTWCategoryFilter = PTWType | 'ALL' | 'LIFTING';

export interface PTWTypeFilterStripProps {
  permits: PTWPermit[];
  selectedTypeFilter: PTWCategoryFilter;
  onSelectTypeFilter: (type: PTWCategoryFilter) => void;
}

const CATEGORY_BUTTONS: { key: PTWCategoryFilter; label: string }[] = [
  { key: 'HOT_WORK', label: 'HOT WORK' },
  { key: 'COLD_WORK', label: 'COLD WORK' },
  { key: 'CONFINED_SPACE', label: 'CONFINED SPACE' },
  { key: 'ELECTRICAL', label: 'ELECTRICAL' },
  { key: 'LIFTING', label: 'LIFTING' },
];

function countFor(permits: PTWPermit[], key: PTWCategoryFilter): number {
  if (key === 'ALL') return permits.length;
  if (key === 'LIFTING') {
    return permits.filter((p) => p.type === 'CARGO_HANDLING' && p.cargoHandling?.activityType === 'LIFTING').length;
  }
  return permits.filter((p) => p.type === key).length;
}

function NavButton({
  label,
  count,
  isSelected,
  onClick,
}: {
  label: string;
  count: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const stateClass =
    count === 0
      ? 'shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] border-t-neutral-500 border-l-neutral-500 border-b-white border-r-white bg-[#d4d0c8] text-slate-600 opacity-40 cursor-not-allowed'
      : isSelected
      ? 'shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] border-t-neutral-600 border-l-neutral-600 border-b-white border-r-white bg-[#c8c4bc] text-blue-950 font-bold cursor-pointer'
      : 'shadow-[0_2px_3px_rgba(0,0,0,0.15)] hover:shadow-[0_1px_1px_rgba(0,0,0,0.15)] active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-150 ease-out border-t-white border-l-white border-b-neutral-600 border-r-neutral-600 bg-[#d4d0c8] text-slate-900 hover:bg-[#dfdbd3] cursor-pointer';

  return (
    <button
      onClick={onClick}
      className={`shrink-0 border px-2 py-0.5 text-xs font-mono ${stateClass}`}
    >
      {label} ({count})
    </button>
  );
}

export default function PTWTypeFilterStrip({ permits, selectedTypeFilter, onSelectTypeFilter }: PTWTypeFilterStripProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap border-t border-[#808080]/30 pt-1.5">
      <NavButton
        label="ALL"
        count={countFor(permits, 'ALL')}
        isSelected={selectedTypeFilter === 'ALL'}
        onClick={() => onSelectTypeFilter('ALL')}
      />

      {CATEGORY_BUTTONS.map(({ key, label }) => {
        const isSelected = selectedTypeFilter === key;
        return (
          <NavButton
            key={key}
            label={label}
            count={countFor(permits, key)}
            isSelected={isSelected}
            onClick={() => onSelectTypeFilter(isSelected ? 'ALL' : key)}
          />
        );
      })}

      <div className="h-4 w-px bg-[#808080]/40 mx-1 shrink-0" />

      <NavButton
        label="CARGO HANDLING"
        count={countFor(permits, 'CARGO_HANDLING')}
        isSelected={selectedTypeFilter === 'CARGO_HANDLING'}
        onClick={() => onSelectTypeFilter(selectedTypeFilter === 'CARGO_HANDLING' ? 'ALL' : 'CARGO_HANDLING')}
      />
    </div>
  );
}
