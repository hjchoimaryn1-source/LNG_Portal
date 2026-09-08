// src/components/manpower/tabs/ptw/PTWTypeFilterStrip.tsx
"use client";

import React from 'react';
import { PTWPermit, PTWType } from '../../../../types/lng';
import { PTW_SOP_FORMS } from '../../../../data/ptwMasterData';

export interface PTWTypeFilterStripProps {
  permits: PTWPermit[];
  selectedTypeFilter: PTWType | 'ALL';
  onSelectTypeFilter: (type: PTWType | 'ALL') => void;
}

export default function PTWTypeFilterStrip({ permits, selectedTypeFilter, onSelectTypeFilter }: PTWTypeFilterStripProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs font-mono">
      {Object.entries(PTW_SOP_FORMS).map(([typeKey, def]) => {
        const count = permits.filter((p) => p.type === typeKey).length;
        const isSelected = selectedTypeFilter === typeKey;
        return (
          <div
            key={typeKey}
            onClick={() => onSelectTypeFilter(isSelected ? 'ALL' : (typeKey as PTWType))}
            className={`p-2 border rounded cursor-pointer transition-all ${
              isSelected
                ? 'ring-2 ring-blue-600 bg-white shadow-md border-blue-500'
                : 'bg-slate-50 hover:bg-white border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${def.colorBg} ${def.colorText} border ${def.borderColor}`}>
                {def.formNumber}
              </span>
              <span className="font-bold text-slate-800 text-[11px]">{count}</span>
            </div>
            <div className="font-sans font-bold text-[11px] text-slate-900 truncate" title={def.title}>
              {def.type.replace('_', ' ')}
            </div>
            <div className="text-[9px] text-slate-500 truncate">{def.category}</div>
          </div>
        );
      })}
    </div>
  );
}
