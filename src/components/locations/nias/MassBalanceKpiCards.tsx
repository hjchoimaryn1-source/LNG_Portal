// src/components/locations/nias/MassBalanceKpiCards.tsx
//
// PURPOSE
//   3 KPI cards for the rebuilt Mass Balance tab, all live now
//   (massBalanceCalculations.ts): Total Yard BOG Loss, Net Usable Stock
//   (= Arun Latest Batch Inbound − Total Gas Consumed − Total Yard BOG
//   Loss, Arun cert. seed stage), Tanks Tracked. Total Gas Consumed is
//   currently 0 in the live data — correct for the pre-commercial-
//   operation period (zero draw-off since batch arrival), not a gap.

import type { MassBalanceMetrics } from './utils/massBalanceCalculations';

export interface MassBalanceKpiCardsProps {
  metrics: MassBalanceMetrics;
}

const CARD_SHELL = 'bg-[#e8e4dc] border-2 border-[#8a8579] rounded-xs overflow-hidden shadow-xs flex flex-col justify-between';
const CARD_HEADER = 'bg-[#4e5d6e] text-white px-3 py-1.5 flex items-center justify-between border-b border-[#334155]';
const CARD_TITLE = 'text-[11px] font-black uppercase tracking-wider text-white';
const CARD_BODY = 'p-2.5 flex flex-col items-center justify-center text-center space-y-0.5';

export function MassBalanceKpiCards({ metrics }: MassBalanceKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 font-mono">
      <div className={CARD_SHELL}>
        <div className={CARD_HEADER}>
          <span className={CARD_TITLE}>TANKS TRACKED</span>
        </div>
        <div className={CARD_BODY}>
          <span className="text-xl sm:text-2xl font-black font-mono text-slate-900">{metrics.tankCount}</span>
          <div className="text-[11px] font-bold text-slate-600">
            Overpressure: <span className={metrics.overpressureCount > 0 ? 'text-[#c53030] font-black' : 'text-slate-700'}>{metrics.overpressureCount} Tanks</span>
          </div>
        </div>
      </div>

      <div className={CARD_SHELL}>
        <div className={CARD_HEADER}>
          <span className={CARD_TITLE}>TOTAL YARD BOG LOSS</span>
        </div>
        <div className={CARD_BODY}>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-xl sm:text-2xl font-black font-mono text-[#c53030]">
              -{metrics.totalBogLossKg.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </span>
            <span className="text-xs font-bold text-red-800">kg</span>
          </div>
          <div className="pt-1.5 mt-1 border-t border-[#c8c2b5] w-full text-[9.5px] font-bold text-red-700 text-center">
            Live SUM(losses_kg) — iso_tank_daily_readings
          </div>
        </div>
      </div>

      <div className={CARD_SHELL}>
        <div className={CARD_HEADER}>
          <span className={CARD_TITLE}>NET USABLE STOCK</span>
        </div>
        <div className={CARD_BODY}>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-xl sm:text-2xl font-black font-mono text-[#004a99]">
              {metrics.netUsableStockKg.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </span>
            <span className="text-xs font-bold text-[#004a99]">kg</span>
          </div>
          <div className="text-[11px] font-bold text-slate-600">
            Inbound ({metrics.arunLatestShipment ?? '—'}): {metrics.arunInboundStockKg.toLocaleString()} kg
          </div>
          <div className="text-[11px] font-bold text-slate-600">
            Consumed: {metrics.totalConsumedKg.toLocaleString()} kg
            {metrics.totalConsumedKg === 0 && <span className="text-slate-500"> (pre-commercial-operation, no draw-off yet)</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
