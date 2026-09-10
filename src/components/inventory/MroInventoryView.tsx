// src/components/inventory/MroInventoryView.tsx
//
// PURPOSE
//   MRO Depot 부품 재고 목록 화면. WorkOrderListView.tsx와 동일한 win-panel
//   레이아웃 컨벤션을 재사용한다. 저재고(min_stock_qty 미만) 부품은 하이라이트.
//   재고 조정 폼은 StockAdjustmentModal.tsx(독립 파일)로 위임 — 인라인 모달 금지.

'use client';

import React, { useMemo, useState } from 'react';
import { Boxes } from 'lucide-react';
import { useMroInventory } from './hooks/useMroInventory';
import StockAdjustmentModal from './modals/StockAdjustmentModal';
import { BEVEL_BUTTON, SUNKEN_INPUT } from '../cmms/scadaStyles';
import type { MroPartRecord } from '../../adapters/db/mroInventoryDao';

export default function MroInventoryView() {
  const { parts, loading, error, adjustStock } = useMroInventory();
  const [search, setSearch] = useState('');
  const [selectedPart, setSelectedPart] = useState<MroPartRecord | null>(null);

  const filteredParts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return parts;
    return parts.filter((p) => p.partNo.toLowerCase().includes(q) || p.partName.toLowerCase().includes(q));
  }, [parts, search]);

  return (
    <div className="h-full flex flex-col min-h-0 gap-1.5 w-full win-panel p-2 overflow-hidden">
      <div className="win-titlebar px-2 py-1 flex items-center justify-between">
        <span className="text-xs font-bold text-white flex items-center gap-1.5">
          <Boxes className="w-3.5 h-3.5" />
          MRO Depot - Parts Inventory & Stock Ledger
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Part No / Name 검색..."
          className={`${SUNKEN_INPUT} !py-0.5 w-56`}
        />
      </div>

      {error && <div className="px-2 py-1 text-[11px] text-red-700 font-mono bg-red-50 border border-red-700">⚠ {error}</div>}

      <div className="flex-1 min-h-0 overflow-y-auto win-sunken">
        <table className="w-full text-left border-collapse font-mono text-[11px] win-grid">
          <thead>
            <tr className="bg-slate-200 border-b border-slate-400">
              <th className="p-1.5 border-r border-slate-300">Part No</th>
              <th className="p-1.5 border-r border-slate-300">Part Name</th>
              <th className="p-1.5 border-r border-slate-300">UOM</th>
              <th className="p-1.5 border-r border-slate-300">Location</th>
              <th className="p-1.5 border-r border-slate-300 text-right">Current Stock</th>
              <th className="p-1.5 border-r border-slate-300 text-right">Min Stock</th>
              <th className="p-1.5 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="p-3 text-center text-slate-400">
                  로딩 중...
                </td>
              </tr>
            )}
            {!loading &&
              filteredParts.map((p, i) => {
                const isLowStock = p.currentStockQty < p.minStockQty;
                return (
                  <tr
                    key={p.partNo}
                    className={`border-b border-slate-200 ${isLowStock ? 'bg-red-50' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                  >
                    <td className="p-1.5 font-bold border-r border-slate-300 text-blue-950">{p.partNo}</td>
                    <td className="p-1.5 border-r border-slate-300">{p.partName}</td>
                    <td className="p-1.5 border-r border-slate-300">{p.uom}</td>
                    <td className="p-1.5 border-r border-slate-300">{p.storageLocation ?? '—'}</td>
                    <td className={`p-1.5 border-r border-slate-300 text-right font-bold ${isLowStock ? 'text-red-700' : 'text-slate-800'}`}>
                      {p.currentStockQty}
                    </td>
                    <td className="p-1.5 border-r border-slate-300 text-right text-slate-500">{p.minStockQty}</td>
                    <td className="p-1.5 text-center">
                      <button onClick={() => setSelectedPart(p)} className={`${BEVEL_BUTTON} !text-[10px] !py-0.5`}>
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <StockAdjustmentModal
        part={selectedPart}
        onClose={() => setSelectedPart(null)}
        onSubmit={(input) => adjustStock({ partNo: selectedPart!.partNo, ...input })}
      />
    </div>
  );
}
