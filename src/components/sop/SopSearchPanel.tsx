// src/components/sop/SopSearchPanel.tsx
// UI Layer: search input + category/importance filter chips. Pure rendering
// and user interaction only — filtering logic lives in utils/sopFilter.ts.

import { ImportanceLevel, SOPCategory, SOPSearchFilters } from '../../types/sop';
import { ALL_IMPORTANCE_LEVELS, ALL_SOP_CATEGORIES, SOP_CATEGORY_LABELS } from './constants/sopDisplay';

interface SopSearchPanelProps {
  filters: SOPSearchFilters;
  onFiltersChange: (filters: SOPSearchFilters) => void;
  resultCount: number;
}

function toggleValue<T>(list: T[] | undefined, value: T): T[] {
  const current = list ?? [];
  return current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
}

export function SopSearchPanel({ filters, onFiltersChange, resultCount }: SopSearchPanelProps) {
  return (
    <div className="bg-neutral-200/60 border border-neutral-400 p-2 space-y-2 rounded-none font-mono">
      <div className="bg-[#2A3B4C] text-white p-2 px-3 flex justify-between items-center rounded-none font-mono border border-[#2A3B4C]">
        <span className="font-bold text-xs tracking-wider text-white">SOP REFERENCE SEARCH</span>
        <span className="text-[11px] font-mono font-bold bg-[#d4d0c8] text-black px-2 py-0.5 border border-[#808080] rounded-none">
          {resultCount} RESULTS
        </span>
      </div>

      <input
        type="text"
        value={filters.keyword ?? ''}
        onChange={(e) => onFiltersChange({ ...filters, keyword: e.target.value })}
        placeholder="NP code, title, keyword..."
        className="w-full border border-neutral-400 bg-white text-slate-900 text-xs px-2 py-1.5 rounded-none font-mono focus:outline-none focus:border-[#2A3B4C]"
      />

      <div className="space-y-1">
        <div className="text-[10px] font-bold text-slate-600 tracking-wider">CATEGORY</div>
        <div className="flex flex-wrap gap-1">
          {ALL_SOP_CATEGORIES.map((category) => {
            const active = (filters.categories ?? []).includes(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() =>
                  onFiltersChange({ ...filters, categories: toggleValue(filters.categories, category) })
                }
                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 border rounded-none ${
                  active
                    ? 'bg-[#2A3B4C] text-white border-[#2A3B4C]'
                    : 'bg-white text-slate-700 border-neutral-400 hover:bg-neutral-100'
                }`}
              >
                {SOP_CATEGORY_LABELS[category]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-[10px] font-bold text-slate-600 tracking-wider">IMPORTANCE</div>
        <div className="flex flex-wrap gap-1">
          {ALL_IMPORTANCE_LEVELS.map((level: ImportanceLevel) => {
            const active = (filters.importanceLevels ?? []).includes(level);
            return (
              <button
                key={level}
                type="button"
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    importanceLevels: toggleValue(filters.importanceLevels, level),
                  })
                }
                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 border rounded-none ${
                  active
                    ? 'bg-[#2A3B4C] text-white border-[#2A3B4C]'
                    : 'bg-white text-slate-700 border-neutral-400 hover:bg-neutral-100'
                }`}
              >
                {level}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export type { SOPCategory };
