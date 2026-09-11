// src/components/dashboard/panels/MroLowStockPanel.tsx
//
// PURPOSE
//   Overview 대시보드 Panel D. mro_parts(mroInventoryDao.ts)에서 current_stock_qty
//   가 min_stock_qty 이하인 부품만 필터링해 표시한다 — 재고 조정 쓰기 경로
//   (adjustPartStock)는 이 패널의 책임이 아니다(읽기 전용 알림).

import React from 'react';
import { Boxes } from 'lucide-react';
import type { MroPartRecord } from '../../../adapters/db/mroInventoryDao';

interface MroLowStockPanelProps {
  parts: MroPartRecord[];
  loading: boolean;
}

export default function MroLowStockPanel({ parts, loading }: MroLowStockPanelProps) {
  return (
    <div className="win-panel flex flex-col min-h-0 h-full">
      <div className="win-titlebar px-2 py-1 flex items-center gap-1.5">
        <Boxes className="w-3.5 h-3.5 text-white" />
        <span className="text-xs font-bold text-white">MRO Low-Stock Inventory Alert</span>
        <span className="ml-auto text-[10px] font-mono text-white/80">{parts.length} ITEMS</span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto win-sunken">
        <table className="w-full text-left border-collapse font-mono text-[10.5px] win-grid">
          <thead>
            <tr className="bg-slate-200 border-b border-slate-400">
              <th className="p-1.5 border-r border-slate-300">Part No</th>
              <th className="p-1.5 border-r border-slate-300">Part Name</th>
              <th className="p-1.5 border-r border-slate-300 text-right">Current</th>
              <th className="p-1.5">Min</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="p-3 text-center text-slate-400">로딩 중...</td>
              </tr>
            )}
            {!loading && parts.length === 0 && (
              <tr>
                <td colSpan={4} className="p-3 text-center text-emerald-700">저재고 부품 없음</td>
              </tr>
            )}
            {!loading &&
              parts.map((part, i) => (
                <tr key={part.partNo} className={`border-b border-slate-200 ${i % 2 === 0 ? 'bg-white' : 'bg-red-50'}`}>
                  <td className="p-1.5 font-bold border-r border-slate-300 text-blue-950">{part.partNo}</td>
                  <td className="p-1.5 border-r border-slate-300">{part.partName}</td>
                  <td className="p-1.5 border-r border-slate-300 text-right font-bold text-red-700">{part.currentStockQty}</td>
                  <td className="p-1.5 text-slate-600">{part.minStockQty}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
