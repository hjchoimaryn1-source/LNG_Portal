import React, { useState } from 'react';
import { RotateCcw, Ship, FileSpreadsheet } from 'lucide-react';

export interface NiasLd2BackhaulTabProps {
  zoneStats: any;
  selectedBackhaulTanks: Set<string>;
  setSelectedBackhaulTanks: React.Dispatch<React.SetStateAction<Set<string>>>;
  handleAuthorizeBackhaul: () => void;
  handleExportShippingReport: () => void;
  handleOpenLd2VentModal: (tank: any) => void;
  draggingTankNo?: string | null;
  setDraggingTankNo?: (val: string | null) => void;
  dragOverTarget?: string | null;
  setDragOverTarget?: (val: string | null) => void;
  setToastMessage?: (msg: string | null) => void;
}

export const NiasLd2BackhaulTab: React.FC<NiasLd2BackhaulTabProps> = ({
  zoneStats,
  selectedBackhaulTanks,
  setSelectedBackhaulTanks,
  handleAuthorizeBackhaul,
  handleExportShippingReport,
  handleOpenLd2VentModal,
  draggingTankNo = null,
  setDraggingTankNo,
  dragOverTarget = null,
  setDragOverTarget,
  setToastMessage,
}) => {
  const [ld2ViewMode, setLd2ViewMode] = useState<'STAGING_BUFFER' | 'SHIPPING_REPORT'>('STAGING_BUFFER');

  const yard2TanksList: any[] = zoneStats?.yard2?.tanks || [];
  const avgHeelPct = yard2TanksList.length > 0
    ? (yard2TanksList.reduce((acc, t) => acc + (t.levelPercent || 4.0), 0) / yard2TanksList.length).toFixed(1)
    : '4.0';
  const loadedCount = selectedBackhaulTanks.size > 0 ? selectedBackhaulTanks.size : yard2TanksList.length;
  const totalHeelKg = yard2TanksList.reduce((acc, t) => acc + Math.round(((t.levelPercent || 4.0) / 100) * 18200), 0);
  const totalHeelTon = (totalHeelKg / 1000).toFixed(2);

  const showToast = (msg: string) => {
    if (setToastMessage) {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  const ld2BufferTanks = yard2TanksList.filter((t) => !selectedBackhaulTanks.has(t.id));
  const mvSaviourTanks = yard2TanksList.filter((t) => selectedBackhaulTanks.has(t.id));

  return (
    <div className="space-y-4 animate-in fade-in duration-200 font-mono">
      {/* Top Control & KPI Dashboard (SCADA Header Theme - Clean without Emojis) */}
      <div className="bg-[#0a2540] text-white p-3.5 rounded-t border-b border-[#071a2e] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 select-none">
        <div>
          <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white font-mono flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>ORU ( LD - 2 ) : HEEL STAGING &amp; BACKHAUL CLEARANCE</span>
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAuthorizeBackhaul}
            disabled={selectedBackhaulTanks.size === 0}
            className={`flex items-center gap-1.5 px-4 py-2 font-bold text-xs rounded-xs border-t border-l border-b-2 border-r-2 shadow-xs select-none transition-all font-mono ${selectedBackhaulTanks.size > 0
              ? 'bg-[#7c3aed] hover:bg-[#6d28d9] active:bg-[#5b21b6] text-white border-purple-300 border-b-purple-950 border-r-purple-950 cursor-pointer'
              : 'bg-slate-700 text-slate-400 border-slate-600 cursor-not-allowed'
              }`}
          >
            <Ship className="w-4 h-4" />
            <span>Authorize MV. Saviour Backhaul ({selectedBackhaulTanks.size} Tanks)</span>
          </button>
        </div>
      </div>

      {/* Inner Sub-Tab Switching Bar (Clean without Emojis) */}
      <div className="flex items-center gap-1 border-b-2 border-[#1e293b] pb-0 px-1 pt-1 bg-[#dfdbd1] rounded-xs select-none">
        <button
          type="button"
          onClick={() => setLd2ViewMode('STAGING_BUFFER')}
          className={`px-4 py-2 font-mono text-xs font-black tracking-wide border-t-2 border-l-2 border-r-2 rounded-t-xs transition-all cursor-pointer flex items-center gap-1.5 ${ld2ViewMode === 'STAGING_BUFFER'
            ? 'bg-[#ece9d8] text-[#002b4d] border-t-white border-l-white border-r-slate-600 shadow-xs -mb-[2px] pb-2.5 z-10'
            : 'bg-[#d0cbbf] hover:bg-[#dedad0] text-slate-700 border-t-slate-300 border-l-slate-300 border-r-slate-500'
            }`}
        >
          <span>[1] STAGING BUFFER</span>
        </button>

        <button
          type="button"
          onClick={() => setLd2ViewMode('SHIPPING_REPORT')}
          className={`px-4 py-2 font-mono text-xs font-black tracking-wide border-t-2 border-l-2 border-r-2 rounded-t-xs transition-all cursor-pointer flex items-center gap-1.5 ${ld2ViewMode === 'SHIPPING_REPORT'
            ? 'bg-[#ece9d8] text-[#002b4d] border-t-white border-l-white border-r-slate-600 shadow-xs -mb-[2px] pb-2.5 z-10'
            : 'bg-[#d0cbbf] hover:bg-[#dedad0] text-slate-700 border-t-slate-300 border-l-slate-300 border-r-slate-500'
            }`}
        >
          <span>[2] BACKHAUL MANIFEST &amp; SHIPPING REPORT</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* VIEW MODE 1: 50% : 50% SPLIT (LD-2 STAGING BUFFER vs M.V. SAVIOUR)  */}
      {/* ==================================================================== */}
      {ld2ViewMode === 'STAGING_BUFFER' && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          {/* 4 SCADA KPI Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <div className="bg-[#e8e4dc] border border-[#b0aaa0] rounded-xs p-2.5 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">TOTAL HEEL BUFFER</span>
              <div className="flex items-baseline gap-1.5 my-0.5">
                <span className="font-mono text-xl font-black text-slate-900">{yard2TanksList.length}</span>
                <span className="text-xs font-bold text-slate-600">/ 16 SLOTS</span>
              </div>
              <span className="text-[9px] text-slate-500 font-bold truncate">Depleted &amp; Ready for Return</span>
            </div>

            <div className="bg-[#e8e4dc] border border-[#b0aaa0] rounded-xs p-2.5 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">AVG RESIDUAL HEEL</span>
              <div className="flex items-baseline gap-1.5 my-0.5">
                <span className="font-mono text-xl font-black text-[#0055aa]">1.0 m³</span>
                <span className="text-xs font-bold text-slate-600">(~445 kg / {avgHeelPct}%)</span>
              </div>
              <span className="text-[9px] text-emerald-700 font-bold truncate">Cold heel preserved</span>
            </div>

            <div className="bg-[#e8e4dc] border border-[#b0aaa0] rounded-xs p-2.5 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">AVG HOLDING PRESSURE</span>
              <div className="flex items-baseline gap-1.5 my-0.5">
                <span className="font-mono text-xl font-black text-slate-900">{(zoneStats?.yard2?.avgPress ?? 0.22).toFixed(2)}</span>
                <span className="text-xs font-bold text-slate-600">MPa</span>
              </div>
              <span className="text-[9px] text-slate-500 font-bold truncate">Safe marine transit margin</span>
            </div>

            <div className="bg-[#f3e8ff] border border-[#c084fc] rounded-xs p-2.5 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-bold text-purple-900 uppercase tracking-tighter">LOADED ON M.V. SAVIOUR</span>
              <div className="flex items-baseline gap-1.5 my-0.5">
                <span className="font-mono text-xl font-black text-purple-950">{selectedBackhaulTanks.size}</span>
                <span className="text-xs font-bold text-purple-700">of {yard2TanksList.length}</span>
              </div>
              <span className="text-[9px] text-purple-700 font-bold truncate">Voyage 02 (Arun Return)</span>
            </div>
          </div>

          {/* 50% : 50% Dual Panel Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {/* [LEFT PANEL: LAYDOWN YARD 2 (STAGING BUFFER)] */}
            <div
              className={`bg-[#dfdbd1] border-2 rounded-xs p-3 shadow-inner flex flex-col justify-between transition-colors ${dragOverTarget === 'LD2' ? 'border-amber-500 bg-[#ebd9c2]' : 'border-[#8a8579]'
                }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverTarget?.('LD2');
              }}
              onDragLeave={() => {
                if (dragOverTarget === 'LD2') setDragOverTarget?.(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const tankId = e.dataTransfer.getData('text/plain') || draggingTankNo;
                if (tankId && selectedBackhaulTanks.has(tankId)) {
                  setSelectedBackhaulTanks((prev) => {
                    const next = new Set(prev);
                    next.delete(tankId);
                    return next;
                  });
                  showToast(`📦 ${tankId} returned to LD-2 Staging Buffer`);
                }
                setDraggingTankNo?.(null);
                setDragOverTarget?.(null);
              }}
            >
              {/* Header */}
              <div className="bg-[#4e5d6e] text-white p-2.5 -mx-3 -mt-3 mb-3 rounded-t-xs border-b-2 border-[#334155] flex flex-wrap justify-between items-center gap-2 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-white font-mono">
                    ORU LAYDOWN YARD 2 (STAGING BUFFER)
                  </span>
                  <span className="bg-[#002b4d] text-cyan-300 font-mono font-bold text-[10px] px-2 py-0.5 rounded-xs border border-blue-900 shadow-xs">
                    OCCUPIED: {ld2BufferTanks.length} / 16
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBackhaulTanks(new Set(yard2TanksList.map((t) => t.id)));
                      showToast('🚢 All tanks selected & loaded to M.V. SAVIOUR');
                    }}
                    className="px-2.5 py-1 bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-900 font-bold text-[11px] rounded-xs border-t border-l border-white border-b-2 border-r-2 border-slate-600 shadow-xs cursor-pointer select-none font-mono"
                  >
                    SELECT ALL (LOAD ALL)
                  </button>
                </div>
              </div>

              {/* Grid for LD-2 Staged Tanks (2 Columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Array.from({ length: Math.max(16, yard2TanksList.length) }).map((_, slotIdx) => {
                  const slotNum = slotIdx + 1;
                  const tank = ld2BufferTanks[slotIdx];

                  if (tank) {
                    const massKg = Math.round(((tank.levelPercent || 4.0) / 100) * 18200);
                    const volM3 = (((tank.levelPercent || 4.0) / 100) * 44.0).toFixed(1);

                    return (
                      <div
                        key={tank.id}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', tank.id);
                          setDraggingTankNo?.(tank.id);
                        }}
                        onDragEnd={() => {
                          setDraggingTankNo?.(null);
                          setDragOverTarget?.(null);
                        }}
                        className="relative p-2.5 pb-2 flex flex-col justify-between gap-1.5 rounded-xs border-2 border-[#64748b] bg-gradient-to-b from-[#e8edf2] to-[#dbe2ea] hover:border-[#0055aa] select-none shadow-md transition-all cursor-grab active:cursor-grabbing"
                        style={{
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), 0 3px 8px rgba(0,0,0,0.12)',
                        }}
                      >
                        {/* 4 Corner Bolt Casting Marks */}
                        <span className="absolute -top-[2px] -left-[2px] w-2 h-2 border-t-2 border-l-2 border-[#1e293b] bg-[#475569] rounded-tl-xs pointer-events-none" />
                        <span className="absolute -top-[2px] -right-[2px] w-2 h-2 border-t-2 border-r-2 border-[#1e293b] bg-[#475569] rounded-tr-xs pointer-events-none" />
                        <span className="absolute -bottom-[2px] -left-[2px] w-2 h-2 border-b-2 border-l-2 border-[#1e293b] bg-[#475569] rounded-bl-xs pointer-events-none" />
                        <span className="absolute -bottom-[2px] -right-[2px] w-2 h-2 border-b-2 border-r-2 border-[#1e293b] bg-[#475569] rounded-br-xs pointer-events-none" />

                        {/* Top Header Row */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono font-bold text-slate-600 truncate">
                              {tank.serialNo || `SIMU-82020${slotNum}`}
                            </span>
                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-900 border border-purple-300 rounded-xs text-[9px] font-black font-mono">
                              HEEL 1.0m³
                            </span>
                          </div>

                          <div className="flex justify-between items-center pt-0.5">
                            <span className="text-sm font-black font-mono text-[#0055aa] tracking-tight">
                              {tank.id}
                            </span>
                            <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 border border-slate-300 rounded-xs text-[9px] font-bold font-mono">
                              2026-08-28 | D+2
                            </span>
                          </div>
                        </div>

                        {/* 3D ISO Tank Graphic */}
                        <div className="relative w-full h-[64px] flex items-center justify-center bg-slate-200/70 rounded-xs border border-slate-300/90 p-1 shadow-inner my-0.5 pointer-events-none">
                          <svg viewBox="0 0 420 86" className="w-full h-full" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id={`tankVessel-ld2-buf-${tank.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#f8fafc" />
                                <stop offset="50%" stopColor="#cbd5e1" />
                                <stop offset="100%" stopColor="#94a3b8" />
                              </linearGradient>
                              <linearGradient id={`gasVaporBg-ld2-buf-${tank.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#f1f5f9" />
                                <stop offset="60%" stopColor="#e2e8f0" />
                                <stop offset="100%" stopColor="#cbd5e1" />
                              </linearGradient>
                              <linearGradient id={`liquidFill-ld2-buf-${tank.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#38bdf8" />
                                <stop offset="50%" stopColor="#0284c7" />
                                <stop offset="100%" stopColor="#0369a1" />
                              </linearGradient>
                              <pattern id={`gasPattern-ld2-buf-${tank.id}`} width="8" height="8" patternUnits="userSpaceOnUse">
                                <path d="M-1,1 l2,-2 M0,8 l8,-8 M7,9 l2,-2" stroke="#94a3b8" strokeWidth="0.75" strokeOpacity="0.3" />
                              </pattern>
                              <clipPath id={`innerWindowClip-ld2-buf-${tank.id}`}>
                                <rect x="58" y="14" width="304" height="58" rx="8" />
                              </clipPath>
                            </defs>

                            <line x1="28" y1="12" x2="392" y2="12" stroke="#475569" strokeWidth="2.5" />
                            <line x1="28" y1="74" x2="392" y2="74" stroke="#475569" strokeWidth="3" />
                            <rect x="24" y="8" width="8" height="70" fill="#334155" stroke="#64748b" strokeWidth="1.5" rx="1" />
                            <rect x="22" y="6" width="12" height="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
                            <rect x="22" y="74" width="12" height="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
                            <rect x="388" y="8" width="8" height="70" fill="#334155" stroke="#64748b" strokeWidth="1.5" rx="1" />
                            <rect x="386" y="6" width="12" height="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
                            <rect x="386" y="74" width="12" height="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
                            <path d="M 58 14 C 28 14, 28 72, 58 72 Z" fill={`url(#tankVessel-ld2-buf-${tank.id})`} stroke="#475569" strokeWidth="2" />
                            <path d="M 362 14 C 392 14, 392 72, 362 72 Z" fill={`url(#tankVessel-ld2-buf-${tank.id})`} stroke="#475569" strokeWidth="2" />
                            <rect x="56" y="12" width="308" height="62" fill={`url(#tankVessel-ld2-buf-${tank.id})`} stroke="#475569" strokeWidth="1.5" />

                            <rect x="58" y="14" width="304" height="58" rx="8" fill="#f1f5f9" stroke="#0284c7" strokeWidth="1.5" />
                            <g clipPath={`url(#innerWindowClip-ld2-buf-${tank.id})`}>
                              <rect x="58" y="14" width="304" height="58" fill={`url(#gasVaporBg-ld2-buf-${tank.id})`} />
                              <rect x="58" y="14" width="304" height="58" fill={`url(#gasPattern-ld2-buf-${tank.id})`} />
                              <text x="70" y="25" fill="#475569" fontSize="8" fontWeight="bold" fontFamily="monospace" letterSpacing="0.8">GAS / VAPOR (BOG)</text>
                              <text x="350" y="25" textAnchor="end" fill="#64748b" fontSize="7.5" fontWeight="bold" fontFamily="monospace" letterSpacing="0.5">HEADSPACE</text>

                              {(() => {
                                const fillHeight = Math.max(4, ((tank.levelPercent || 4) / 100) * 58);
                                const fillY = 72 - fillHeight;
                                return (
                                  <g>
                                    <rect x="58" y={fillY} width="304" height={fillHeight} fill={`url(#liquidFill-ld2-buf-${tank.id})`} />
                                    <path d={`M 58 ${fillY} Q 134 ${fillY - 2}, 210 ${fillY} T 362 ${fillY}`} fill="none" stroke="#bae6fd" strokeWidth="2" strokeOpacity="0.95" />
                                  </g>
                                );
                              })()}
                            </g>

                            <text
                              x="210"
                              y="49"
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill="#002b4d"
                              fontSize="16"
                              fontWeight="900"
                              fontFamily="monospace"
                              letterSpacing="0.5"
                              style={{
                                paintOrder: 'stroke fill',
                                stroke: '#ffffff',
                                strokeWidth: '1.5px',
                                strokeLinejoin: 'round',
                              }}
                            >
                              {(tank.levelPercent || 4.0).toFixed(1)}%
                            </text>
                          </svg>
                        </div>

                        {/* Bottom Telemetry Data Matrix */}
                        <div className="border border-slate-300 rounded-xs bg-white grid grid-cols-4 divide-x divide-slate-200 py-1 px-0.5 text-center shadow-2xs">
                          <div className="flex flex-col items-center justify-center px-0.5">
                            <span className="font-mono text-[11px] font-bold text-[#0f172a] leading-tight">
                              {(tank.pressureMpa || 0.22).toFixed(2)}
                            </span>
                            <span className="text-[7.5px] text-slate-500 font-bold uppercase mt-0.5">MPa</span>
                          </div>

                          <div className="flex flex-col items-center justify-center px-0.5">
                            <span className="font-mono text-[11px] font-bold text-[#0f172a] leading-tight">
                              {(tank.tempC ?? -135.0).toFixed(1)}
                            </span>
                            <span className="text-[7.5px] text-slate-500 font-bold uppercase mt-0.5">°C</span>
                          </div>

                          <div className="flex flex-col items-center justify-center px-0.5">
                            <span className="font-mono text-[11px] font-bold text-[#0055aa] leading-tight">
                              {volM3}
                            </span>
                            <span className="text-[7.5px] text-slate-500 font-bold uppercase mt-0.5">m³</span>
                          </div>

                          <div className="flex flex-col items-center justify-center px-0.5">
                            <span className="font-mono text-[11px] font-bold text-[#0f172a] leading-tight">
                              {massKg}
                            </span>
                            <span className="text-[7.5px] text-slate-500 font-bold uppercase mt-0.5">kg</span>
                          </div>
                        </div>

                        {/* Action Footer */}
                        <div className="flex items-center gap-1.5 pt-1 border-t border-[#c8c2b5]">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBackhaulTanks((prev) => new Set([...prev, tank.id]));
                              showToast(`🚢 ${tank.id} loaded to M.V. SAVIOUR deck`);
                            }}
                            className="flex-1 py-1 bg-[#7c3aed] hover:bg-[#6d28d9] active:bg-[#5b21b6] text-white font-bold text-[10px] rounded-xs border-t border-l border-purple-300 border-b-2 border-r-2 border-purple-950 shadow-xs cursor-pointer select-none font-mono text-center flex items-center justify-center gap-1"
                          >
                            <span>→ LOAD TO VESSEL</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenLd2VentModal(tank)}
                            className="px-2.5 py-1 bg-[#002b4d] hover:bg-[#003e70] active:bg-[#001f38] text-white font-bold text-[10px] rounded-xs border-t border-l border-blue-400 border-b-2 border-r-2 border-blue-950 shadow-xs cursor-pointer select-none font-mono whitespace-nowrap"
                          >
                            LOG / VENT
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // Empty Staging Buffer Slot
                  return (
                    <div
                      key={`empty-ld2-slot-${slotIdx}`}
                      className="min-h-[175px] p-3 flex flex-col items-center justify-center gap-1 text-center rounded-xs border-2 border-dashed border-[#b0aaa0] bg-[#e8e4dc]/60 text-slate-500 shadow-inner select-none"
                    >
                      <span className="text-xs font-mono font-bold text-slate-700">
                        SLOT-{String(slotNum).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        Standby - Empty Buffer
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* [RIGHT PANEL: M.V. SAVIOUR (BACKHAUL VESSEL DECK)] */}
            <div
              className={`bg-[#d7dfdb] border-2 rounded-xs p-3 shadow-inner flex flex-col justify-between transition-colors ${dragOverTarget === 'SAVIOUR' ? 'border-purple-600 bg-[#e6daf2]' : 'border-[#71887e]'
                }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverTarget?.('SAVIOUR');
              }}
              onDragLeave={() => {
                if (dragOverTarget === 'SAVIOUR') setDragOverTarget?.(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const tankId = e.dataTransfer.getData('text/plain') || draggingTankNo;
                if (tankId && !selectedBackhaulTanks.has(tankId)) {
                  setSelectedBackhaulTanks((prev) => new Set([...prev, tankId]));
                  showToast(`🚢 ${tankId} loaded onto M.V. SAVIOUR deck`);
                }
                setDraggingTankNo?.(null);
                setDragOverTarget?.(null);
              }}
            >
              {/* Header */}
              <div className="bg-[#4e5d6e] text-white p-2.5 -mx-3 -mt-3 mb-3 rounded-t-xs border-b-2 border-[#334155] flex flex-wrap justify-between items-center gap-2 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-white font-mono">
                    M.V. SAVIOUR (VOY-2026-08 DECK)
                  </span>
                  <span className="bg-[#064e3b] text-emerald-300 font-mono font-bold text-[10px] px-2 py-0.5 rounded-xs border border-emerald-900 shadow-xs">
                    LOADED: {mvSaviourTanks.length} / 16
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBackhaulTanks(new Set());
                      showToast('📦 All tanks returned to LD-2 Staging Buffer');
                    }}
                    disabled={mvSaviourTanks.length === 0}
                    className={`px-2.5 py-1 font-bold text-[11px] rounded-xs border-t border-l border-white border-b-2 border-r-2 shadow-xs select-none font-mono ${mvSaviourTanks.length > 0
                      ? 'bg-[#c53030] hover:bg-[#e53e3e] active:bg-[#9b2c2c] text-white border-[#fc8181] border-b-[#742a2a] border-r-[#742a2a] cursor-pointer'
                      : 'bg-slate-300 text-slate-500 border-slate-400 cursor-not-allowed'
                      }`}
                  >
                    RESET (UNLOAD ALL)
                  </button>
                </div>
              </div>

              {/* Grid for M.V. Saviour Deck Slots (2 Columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Array.from({ length: Math.max(16, yard2TanksList.length) }).map((_, slotIdx) => {
                  const slotNum = slotIdx + 1;
                  const tank = mvSaviourTanks[slotIdx];

                  if (tank) {
                    const massKg = Math.round(((tank.levelPercent || 4.0) / 100) * 18200);
                    const volM3 = (((tank.levelPercent || 4.0) / 100) * 44.0).toFixed(1);

                    return (
                      <div
                        key={tank.id}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', tank.id);
                          setDraggingTankNo?.(tank.id);
                        }}
                        onDragEnd={() => {
                          setDraggingTankNo?.(null);
                          setDragOverTarget?.(null);
                        }}
                        className="relative p-2.5 pb-2 flex flex-col justify-between gap-1.5 rounded-xs border-2 border-purple-600 bg-gradient-to-b from-[#f3e8ff] to-[#e9d5ff] ring-2 ring-purple-500 select-none shadow-md transition-all cursor-grab active:cursor-grabbing"
                        style={{
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), 0 3px 8px rgba(0,0,0,0.12)',
                        }}
                      >
                        {/* 4 Corner Bolt Casting Marks */}
                        <span className="absolute -top-[2px] -left-[2px] w-2 h-2 border-t-2 border-l-2 border-[#1e293b] bg-[#475569] rounded-tl-xs pointer-events-none" />
                        <span className="absolute -top-[2px] -right-[2px] w-2 h-2 border-t-2 border-r-2 border-[#1e293b] bg-[#475569] rounded-tr-xs pointer-events-none" />
                        <span className="absolute -bottom-[2px] -left-[2px] w-2 h-2 border-b-2 border-l-2 border-[#1e293b] bg-[#475569] rounded-bl-xs pointer-events-none" />
                        <span className="absolute -bottom-[2px] -right-[2px] w-2 h-2 border-b-2 border-r-2 border-[#1e293b] bg-[#475569] rounded-br-xs pointer-events-none" />

                        {/* Top Header Row */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono font-bold text-slate-600 truncate">
                              {tank.serialNo || `SIMU-82020${slotNum}`}
                            </span>
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xs text-[9px] font-black font-mono">
                              LOADED ON DECK
                            </span>
                          </div>

                          <div className="flex justify-between items-center pt-0.5">
                            <span className="text-sm font-black font-mono text-purple-950 tracking-tight">
                              {tank.id}
                            </span>
                            <span className="px-1.5 py-0.5 bg-purple-200 text-purple-900 border border-purple-300 rounded-xs text-[9px] font-bold font-mono">
                              DECK SLOT-{String(slotNum).padStart(2, '0')}
                            </span>
                          </div>
                        </div>

                        {/* 3D ISO Tank Graphic with Marine Deck theme */}
                        <div className="relative w-full h-[64px] flex items-center justify-center bg-slate-200/70 rounded-xs border border-slate-300/90 p-1 shadow-inner my-0.5 pointer-events-none">
                          <svg viewBox="0 0 420 86" className="w-full h-full" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id={`tankVessel-sav-buf-${tank.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#f8fafc" />
                                <stop offset="50%" stopColor="#cbd5e1" />
                                <stop offset="100%" stopColor="#94a3b8" />
                              </linearGradient>
                              <linearGradient id={`gasVaporBg-sav-buf-${tank.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#f1f5f9" />
                                <stop offset="60%" stopColor="#e2e8f0" />
                                <stop offset="100%" stopColor="#cbd5e1" />
                              </linearGradient>
                              <linearGradient id={`liquidFill-sav-buf-${tank.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#38bdf8" />
                                <stop offset="50%" stopColor="#0284c7" />
                                <stop offset="100%" stopColor="#0369a1" />
                              </linearGradient>
                              <pattern id={`gasPattern-sav-buf-${tank.id}`} width="8" height="8" patternUnits="userSpaceOnUse">
                                <path d="M-1,1 l2,-2 M0,8 l8,-8 M7,9 l2,-2" stroke="#94a3b8" strokeWidth="0.75" strokeOpacity="0.3" />
                              </pattern>
                              <clipPath id={`innerWindowClip-sav-buf-${tank.id}`}>
                                <rect x="58" y="14" width="304" height="58" rx="8" />
                              </clipPath>
                            </defs>

                            <line x1="28" y1="12" x2="392" y2="12" stroke="#475569" strokeWidth="2.5" />
                            <line x1="28" y1="74" x2="392" y2="74" stroke="#475569" strokeWidth="3" />
                            <rect x="24" y="8" width="8" height="70" fill="#334155" stroke="#64748b" strokeWidth="1.5" rx="1" />
                            <rect x="22" y="6" width="12" height="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
                            <rect x="22" y="74" width="12" height="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
                            <rect x="388" y="8" width="8" height="70" fill="#334155" stroke="#64748b" strokeWidth="1.5" rx="1" />
                            <rect x="386" y="6" width="12" height="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
                            <rect x="386" y="74" width="12" height="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
                            <path d="M 58 14 C 28 14, 28 72, 58 72 Z" fill={`url(#tankVessel-sav-buf-${tank.id})`} stroke="#475569" strokeWidth="2" />
                            <path d="M 362 14 C 392 14, 392 72, 362 72 Z" fill={`url(#tankVessel-sav-buf-${tank.id})`} stroke="#475569" strokeWidth="2" />
                            <rect x="56" y="12" width="308" height="62" fill={`url(#tankVessel-sav-buf-${tank.id})`} stroke="#475569" strokeWidth="1.5" />

                            <rect x="58" y="14" width="304" height="58" rx="8" fill="#f1f5f9" stroke="#0284c7" strokeWidth="1.5" />
                            <g clipPath={`url(#innerWindowClip-sav-buf-${tank.id})`}>
                              <rect x="58" y="14" width="304" height="58" fill={`url(#gasVaporBg-sav-buf-${tank.id})`} />
                              <rect x="58" y="14" width="304" height="58" fill={`url(#gasPattern-sav-buf-${tank.id})`} />
                              <text x="70" y="25" fill="#475569" fontSize="8" fontWeight="bold" fontFamily="monospace" letterSpacing="0.8">GAS / VAPOR (BOG)</text>
                              <text x="350" y="25" textAnchor="end" fill="#64748b" fontSize="7.5" fontWeight="bold" fontFamily="monospace" letterSpacing="0.5">HEADSPACE</text>

                              {(() => {
                                const fillHeight = Math.max(4, ((tank.levelPercent || 4) / 100) * 58);
                                const fillY = 72 - fillHeight;
                                return (
                                  <g>
                                    <rect x="58" y={fillY} width="304" height={fillHeight} fill={`url(#liquidFill-sav-buf-${tank.id})`} />
                                    <path d={`M 58 ${fillY} Q 134 ${fillY - 2}, 210 ${fillY} T 362 ${fillY}`} fill="none" stroke="#bae6fd" strokeWidth="2" strokeOpacity="0.95" />
                                  </g>
                                );
                              })()}
                            </g>

                            <text
                              x="210"
                              y="49"
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill="#002b4d"
                              fontSize="16"
                              fontWeight="900"
                              fontFamily="monospace"
                              letterSpacing="0.5"
                              style={{
                                paintOrder: 'stroke fill',
                                stroke: '#ffffff',
                                strokeWidth: '1.5px',
                                strokeLinejoin: 'round',
                              }}
                            >
                              {(tank.levelPercent || 4.0).toFixed(1)}%
                            </text>
                          </svg>
                        </div>

                        {/* Bottom Telemetry Data Matrix */}
                        <div className="border border-purple-300 rounded-xs bg-white grid grid-cols-4 divide-x divide-purple-200 py-1 px-0.5 text-center shadow-2xs">
                          <div className="flex flex-col items-center justify-center px-0.5">
                            <span className="font-mono text-[11px] font-bold text-[#0f172a] leading-tight">
                              {(tank.pressureMpa || 0.22).toFixed(2)}
                            </span>
                            <span className="text-[7.5px] text-slate-500 font-bold uppercase mt-0.5">MPa</span>
                          </div>

                          <div className="flex flex-col items-center justify-center px-0.5">
                            <span className="font-mono text-[11px] font-bold text-[#0f172a] leading-tight">
                              {(tank.tempC ?? -135.0).toFixed(1)}
                            </span>
                            <span className="text-[7.5px] text-slate-500 font-bold uppercase mt-0.5">°C</span>
                          </div>

                          <div className="flex flex-col items-center justify-center px-0.5">
                            <span className="font-mono text-[11px] font-bold text-purple-900 leading-tight">
                              {volM3}
                            </span>
                            <span className="text-[7.5px] text-slate-500 font-bold uppercase mt-0.5">m³</span>
                          </div>

                          <div className="flex flex-col items-center justify-center px-0.5">
                            <span className="font-mono text-[11px] font-bold text-purple-950 leading-tight">
                              {massKg}
                            </span>
                            <span className="text-[7.5px] text-slate-500 font-bold uppercase mt-0.5">kg</span>
                          </div>
                        </div>

                        {/* Action Footer */}
                        <div className="flex items-center gap-1.5 pt-1 border-t border-purple-300">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBackhaulTanks((prev) => {
                                const next = new Set(prev);
                                next.delete(tank.id);
                                return next;
                              });
                              showToast(`📦 ${tank.id} returned to LD-2 Staging Buffer`);
                            }}
                            className="flex-1 py-1 bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-900 font-bold text-[10px] rounded-xs border-t border-l border-white border-b-2 border-r-2 border-slate-600 shadow-xs cursor-pointer select-none font-mono text-center flex items-center justify-center gap-1"
                          >
                            <span>← UNLOAD TO LD-2</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenLd2VentModal(tank)}
                            className="px-2.5 py-1 bg-[#002b4d] hover:bg-[#003e70] active:bg-[#001f38] text-white font-bold text-[10px] rounded-xs border-t border-l border-blue-400 border-b-2 border-r-2 border-blue-950 shadow-xs cursor-pointer select-none font-mono whitespace-nowrap"
                          >
                            LOG / VENT
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // Empty Deck Slot (Drop Target)
                  return (
                    <div
                      key={`empty-sav-slot-${slotIdx}`}
                      className="min-h-[175px] p-3 flex flex-col items-center justify-center gap-1 text-center rounded-xs border-2 border-dashed border-[#71887e] bg-[#d7dfdb]/60 text-slate-600 shadow-inner select-none hover:bg-emerald-50/60 transition-colors"
                    >
                      <span className="text-xs font-mono font-bold text-slate-700">
                        DECK SLOT-{String(slotNum).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        Drop ISO Tank Here / Empty Deck Slot
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW MODE 2: BACKHAUL MANIFEST & SHIPPING REPORT                     */}
      {/* ==================================================================== */}
      {ld2ViewMode === 'SHIPPING_REPORT' && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          {/* [상단 VOYAGE SUMMARY 패널] */}
          <div className="bg-[#e8e4dc] border-2 border-[#8a8579] rounded-xs p-3.5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#c8c2b5] pb-2.5">
              <div className="flex items-center gap-2">
                <Ship className="w-5 h-5 text-[#0055aa]" />
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#002b4d] font-mono">
                  BACKHAUL MARINE VOYAGE MANIFEST SUMMARY
                </span>
              </div>

              <button
                type="button"
                onClick={handleExportShippingReport}
                className="px-4 py-1.5 bg-[#2f855a] hover:bg-[#38a169] active:bg-[#22543d] text-white font-bold text-xs rounded-xs border-t border-l border-[#48bb78] border-b-2 border-r-2 border-[#1c4d35] shadow-xs cursor-pointer select-none font-mono flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>EXPORT MANIFEST (EXCEL / CSV)</span>
              </button>
            </div>

            {/* 5 Summary KPI Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="bg-white border border-[#b0aaa0] rounded-xs p-2 shadow-inner text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">VESSEL</span>
                <span className="text-xs font-black text-slate-900 font-mono">M.V. SAVIOUR</span>
              </div>

              <div className="bg-white border border-[#b0aaa0] rounded-xs p-2 shadow-inner text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">VOYAGE</span>
                <span className="text-xs font-black text-slate-900 font-mono truncate block">VOY-2026-08 (ARUN)</span>
              </div>

              <div className="bg-white border border-[#b0aaa0] rounded-xs p-2 shadow-inner text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">LOADING DATE</span>
                <span className="text-xs font-black text-slate-900 font-mono">2026-08-30</span>
              </div>

              <div className="bg-white border border-[#b0aaa0] rounded-xs p-2 shadow-inner text-center">
                <span className="text-[10px] font-bold text-purple-950 font-mono">
                  {loadedCount} / {yard2TanksList.length} Tanks
                </span>
              </div>

              <div className="bg-[#f0f7ff] border border-[#7ba4cc] rounded-xs p-2 shadow-inner text-center">
                <span className="text-[10px] font-bold text-[#004a99] uppercase block">TOTAL HEEL MASS</span>
                <span className="text-sm font-black text-[#004a99] font-mono">
                  {totalHeelTon} Ton ({totalHeelKg.toLocaleString()} kg)
                </span>
              </div>
            </div>
          </div>

          {/* [선적 마스터 테이블 - 2단 슬레이트 SCADA 스타일] */}
          <div className="bg-white border-2 border-[#8a8579] rounded-xs overflow-hidden shadow-md">
            <div className="overflow-x-auto custom-scada-scrollbar">
              <table className="w-full text-xs text-center border-collapse font-mono">
                {/* 1행: 4대 그룹 헤더 */}
                <thead>
                  <tr className="bg-[#4e5d6e] text-white font-extrabold uppercase text-[11px] tracking-wider border-b border-[#334155]">
                    <th colSpan={3} className="py-2 px-2 border-r border-[#64748b] bg-[#3e4d5e]">
                      [1] IDENTIFICATION
                    </th>
                    <th colSpan={2} className="py-2 px-2 border-r border-[#64748b] bg-[#475768]">
                      [2] STAGING HISTORY
                    </th>
                    <th colSpan={4} className="py-2 px-2 border-r border-[#64748b] bg-[#3a506b]">
                      [3] FINAL TELEMETRY (RESIDUAL HEEL)
                    </th>
                    <th colSpan={4} className="py-2 px-2 bg-[#3e4d5e]">
                      [4] CLEARANCE &amp; CERTIFICATION
                    </th>
                  </tr>

                  {/* 2행: 세부 컬럼 헤더 */}
                  <tr className="bg-[#5f6f82] text-[#f1f5f9] font-bold text-[10px] tracking-tight border-b-2 border-[#334155] select-none">
                    {/* Identification */}
                    <th className="py-2 px-2 border-r border-[#718096] w-10">NO</th>
                    <th className="py-2 px-2 border-r border-[#718096]">TANK ID</th>
                    <th className="py-2 px-2 border-r border-[#718096]">SERIAL NO</th>

                    {/* Staging History */}
                    <th className="py-2 px-2 border-r border-[#718096]">SKID UNMOUNT DATE</th>
                    <th className="py-2 px-2 border-r border-[#718096]">LD-2 DURATION</th>

                    {/* Final Telemetry */}
                    <th className="py-2 px-2 border-r border-[#718096]">FINAL PRESS (MPa)</th>
                    <th className="py-2 px-2 border-r border-[#718096]">TEMP (°C)</th>
                    <th className="py-2 px-2 border-r border-[#718096]">HEEL LEVEL (%)</th>
                    <th className="py-2 px-2 border-r border-[#718096] bg-[#355375] text-cyan-200">
                      CALC MASS (kg)
                    </th>

                    {/* Clearance */}
                    <th className="py-2 px-2 border-r border-[#718096]">BOG VENT DONE</th>
                    <th className="py-2 px-2 border-r border-[#718096]">SAFETY SEAL NO</th>
                    <th className="py-2 px-2 border-r border-[#718096]">INSPECTOR SIGN</th>
                    <th className="py-2 px-2">STATUS</th>
                  </tr>
                </thead>

                {/* 테이블 본문 */}
                <tbody className="divide-y divide-slate-200 bg-white">
                  {yard2TanksList.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="py-8 text-center text-slate-500 font-bold">
                        No empty heel tanks staged in Laydown Yard 2.
                      </td>
                    </tr>
                  ) : (
                    yard2TanksList.map((tank, idx) => {
                      const massKg = Math.round(((tank.levelPercent || 4.0) / 100) * 18200);
                      const isEven = idx % 2 === 0;

                      return (
                        <tr
                          key={tank.id}
                          className={`hover:bg-amber-50 transition-colors font-mono ${isEven ? 'bg-[#faf9f6]' : 'bg-white'
                            }`}
                        >
                          {/* Identification */}
                          <td className="py-2.5 px-2 border-r border-slate-200 font-bold text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-2 border-r border-slate-200 font-black text-[#0055aa]">
                            {tank.id}
                          </td>
                          <td className="py-2.5 px-2 border-r border-slate-200 font-bold text-slate-700">
                            {tank.serialNo || `SIMU-82020${idx + 1}`}
                          </td>

                          {/* Staging History */}
                          <td className="py-2.5 px-2 border-r border-slate-200 text-slate-700 font-medium">
                            2026-08-28 14:30
                          </td>
                          <td className="py-2.5 px-2 border-r border-slate-200 font-bold text-slate-800">
                            2 Days (48h)
                          </td>

                          {/* Final Telemetry */}
                          <td className="py-2.5 px-2 border-r border-slate-200 font-bold text-slate-900">
                            {(tank.pressureMpa || 0.22).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-2 border-r border-slate-200 font-bold text-slate-900">
                            {(tank.tempC ?? -135.0).toFixed(1)}
                          </td>
                          <td className="py-2.5 px-2 border-r border-slate-200 font-bold text-[#0055aa]">
                            {(tank.levelPercent || 4.0).toFixed(1)}%
                          </td>
                          <td
                            className="py-2.5 px-2 border-r border-slate-200 font-black text-[#004a99]"
                            style={{ backgroundColor: '#f0f7ff' }}
                          >
                            {massKg.toLocaleString()} kg
                          </td>

                          {/* Clearance */}
                          <td className="py-2.5 px-2 border-r border-slate-200 font-bold text-emerald-700">
                            Y (0.22 MPa)
                          </td>
                          <td className="py-2.5 px-2 border-r border-slate-200 font-bold text-slate-600">
                            SL-8842-N{String(idx + 1).padStart(2, '0')}
                          </td>
                          <td className="py-2.5 px-2 border-r border-slate-200 font-bold text-slate-700">
                            FIELD OP-1 / CHIEF
                          </td>
                          <td className="py-2.5 px-2">
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-900 border border-purple-300 font-black rounded-xs text-[10px] shadow-2xs">
                              LOADED
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NiasLd2BackhaulTab;
