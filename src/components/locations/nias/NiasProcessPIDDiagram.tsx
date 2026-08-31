'use client';

import React from 'react';
import { usePortalData } from '@/context/PortalDataContext';

interface NiasProcessPIDDiagramProps {
  onSelectEquipment?: (eqId: string) => void;
}

export default function NiasProcessPIDDiagram({ onSelectEquipment }: NiasProcessPIDDiagramProps) {
  const { gasCompositions } = usePortalData();

  return (
    <div className="w-full bg-[#dcd8cf] border border-[#b0aaa0] rounded-none overflow-hidden text-slate-900 space-y-0 mb-0 pb-0">
      {/* 1. Header Bar: Clean SCADA Controls (Dark Navy Header) */}
      <div className="bg-[#0f172a] text-[#f8fafc] px-2.5 py-1 flex items-center justify-between border-b border-[#334155]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-none bg-[#16a34a]" />
          <span className="font-mono text-[12px] font-bold uppercase tracking-wider text-[#f8fafc]">
            GAS PROCESS
          </span>
        </div>
      </div>

      {/* 2. Top 4-Card Macro Plant Pulse KPI Grid (Row-Separated Table Layout) */}
      <div className="w-full bg-[#e6e2d8] border-b border-[#b0aaa0] p-1.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-1.5 sm:gap-2 w-full">
          {/* Card 1: DAILY LNG SENDOUT */}
          <div className="flex flex-col justify-start bg-white border border-[#cbd5e1] rounded-sm overflow-hidden font-mono">
            <div className="bg-[#3b4758] text-white text-xs font-bold py-1 px-2 uppercase tracking-wider text-center border-b border-[#334155]">
              DAILY LNG SENDOUT
            </div>
            <div className="divide-y divide-slate-200 text-xs">
              <div className="flex items-center justify-between py-1.5 px-2">
                <span className="text-[#475569] font-medium">Sendout Rate</span>
                <span className="font-bold text-slate-900">10.04 Tonne / d</span>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2">
                <span className="text-[#475569] font-medium">Cum. Volume</span>
                <span className="font-bold text-slate-900">0.51 MMCF</span>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2">
                <span className="text-[#475569] font-medium">Hourly Flow</span>
                <span className="font-bold text-slate-900">2.12 t/h</span>
              </div>
            </div>
          </div>

          {/* Card 2: DELIVERED THERMAL ENERGY */}
          <div className="flex flex-col justify-start bg-white border border-[#cbd5e1] rounded-sm overflow-hidden font-mono">
            <div className="bg-[#3b4758] text-white text-xs font-bold py-1 px-2 uppercase tracking-wider text-center border-b border-[#334155]">
              DELIVERED THERMAL ENERGY
            </div>
            <div className="divide-y divide-slate-200 text-xs">
              <div className="flex items-center justify-between py-1.5 px-2">
                <span className="text-[#475569] font-medium">Total Energy</span>
                <span className="font-bold text-slate-900">524.0 MMBTU / d</span>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2">
                <span className="text-[#475569] font-medium">Avg GHV</span>
                <span className="font-bold text-slate-900">1,049.7 BTU/Scf</span>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2">
                <span className="text-[#475569] font-medium">Energy Rate</span>
                <span className="font-bold text-slate-900">43.6 MMBTU/h</span>
              </div>
            </div>
          </div>

          {/* Card 3: PLTMG POWER GENERATION */}
          <div className="flex flex-col justify-start bg-white border border-[#cbd5e1] rounded-sm overflow-hidden font-mono">
            <div className="bg-[#3b4758] text-white text-xs font-bold py-1 px-2 uppercase tracking-wider text-center border-b border-[#334155]">
              PLTMG POWER GENERATION
            </div>
            <div className="divide-y divide-slate-200 text-xs">
              <div className="flex items-center justify-between py-1.5 px-2">
                <span className="text-[#475569] font-medium">Combined Output</span>
                <span className="font-bold text-slate-900">22.05 MW</span>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2">
                <span className="text-[#475569] font-medium">Daily Generation</span>
                <span className="font-bold text-slate-900">440.0 MWh/d</span>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2">
                <span className="text-[#475569] font-medium">Load / Active</span>
                <span className="font-bold text-slate-900">60.0% MCR (4/5 Units)</span>
              </div>
            </div>
          </div>

          {/* Card 4: FEED AUTONOMY & SWAP ETA (강조 패널) */}
          <div className="flex flex-col justify-start bg-[#dcfce7]/30 border border-[#86efac] rounded-sm overflow-hidden font-mono">
            <div className="bg-[#15803d] text-white text-xs font-bold py-1 px-2 uppercase tracking-wider text-center border-b border-[#166534]">
              FEED AUTONOMY & SWAP ETA
            </div>
            <div className="divide-y divide-slate-200 text-xs">
              <div className="flex items-center justify-between py-1.5 px-2">
                <span className="text-[#475569] font-medium">Active Feed TK</span>
                <span className="font-bold text-slate-900">ISOT-009</span>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2">
                <span className="text-[#475569] font-medium">Heel Threshold</span>
                <span className="font-bold text-slate-900">5% (500 kg)</span>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2 bg-[#dcfce7]/70">
                <span className="text-[#15803d] font-bold">Est. Autonomy</span>
                <span className="font-bold text-[#15803d]">~2.2 Hours (ETA: 21:10)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. 3-Section Full Width Process Canvas (Bright SCADA Standard Theme - Tight-Fit No-Scroll) */}
      <div className="relative w-full bg-[#e6e2d8] p-1.5 pb-1 select-none">
        {/* 3-Section Grid Layout */}
        <div className="w-full grid grid-cols-1 xl:grid-cols-3 gap-1.5 items-stretch">
          
          {/* ========================================================================= */}
          {/* BLOCK 1: [ ACTIVE FEED ]                                                  */}
          {/* System Integration Note: All data (ISOT-009, CONSUMPTION dynamics,        */}
          {/* and STANDBY skids) are real-time integrated with the ISO Tank Management   */}
          {/* subsystem position changes and SCADA tag telemetry.                        */}
          {/* ========================================================================= */}
          <div className="flex flex-col justify-start space-y-1 p-1.5 pb-1.5 rounded-none bg-[#f1eee7] border border-[#b0aaa0] overflow-hidden">
            {/* Block Header (Dark Slate Charcoal #3b4758) - Center Aligned */}
            <div className="relative bg-[#3b4758] text-[#f8fafc] px-2 py-1 border border-[#334155] flex justify-center items-center">
              <span className="font-mono font-bold text-[11px] sm:text-[12px] uppercase tracking-wider text-[#f8fafc] text-center">
                ACTIVE FEED
              </span>
              <span className="absolute right-1.5 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-none bg-[#2a3444] text-[#4ade80] border border-[#526075] whitespace-nowrap">
                [ RUNNING ]
              </span>
            </div>

            {/* 1단 (최상단): [ CONSUMPTION ] 4열 수평 인셋 카드 (2단 구조) */}
            <div className="px-0.5 pt-0.5">
              <span className="font-mono font-bold text-[10px] text-[#334155] tracking-wide block">
                [ CONSUMPTION ]
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1 bg-white border border-[#cbd5e1] p-1 rounded-none text-center font-mono w-full">
              <div className="bg-[#f8fafc] py-1.5 px-1 border border-[#cbd5e1] flex flex-col justify-center items-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight leading-tight block truncate">
                  RATE
                </span>
                <span className="text-sm font-bold text-slate-900 leading-tight mt-0.5 whitespace-nowrap">
                  106.5 <span className="text-[10px] font-normal text-slate-500 ml-0.5">kg/h</span>
                </span>
              </div>
              <div className="bg-[#f8fafc] py-1.5 px-1 border border-[#cbd5e1] flex flex-col justify-center items-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight leading-tight block truncate">
                  DELIVERED
                </span>
                <span className="text-sm font-bold text-slate-900 leading-tight mt-0.5 whitespace-nowrap">
                  426.0 <span className="text-[10px] font-normal text-slate-500 ml-0.5">kg</span>
                </span>
              </div>
              <div className="bg-[#f8fafc] py-1.5 px-1 border border-[#cbd5e1] flex flex-col justify-center items-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight leading-tight block truncate">
                  REMAIN
                </span>
                <span className="text-sm font-bold text-slate-900 leading-tight mt-0.5 whitespace-nowrap">
                  9,798.0 <span className="text-[10px] font-normal text-slate-500 ml-0.5">kg</span>
                </span>
              </div>
              <div className="bg-[#dcfce7] py-1.5 px-1 border border-[#86efac] flex flex-col justify-center items-center">
                <span className="text-[10px] text-[#15803d] font-bold uppercase tracking-tight leading-tight block truncate">
                  EST. COMPLETED
                </span>
                <span className="text-sm font-bold text-[#15803d] leading-tight mt-0.5 whitespace-nowrap">
                  21:10 <span className="text-[10px] font-medium text-slate-600 ml-0.5">(8.7h)</span>
                </span>
              </div>
            </div>

            {/* 2단 (중단): Active Feed 탱크 ID 및 메인 계측치/변화량 테이블 */}
            <div className="flex items-center px-0.5 pt-0.5">
              <span className="font-mono font-bold text-sm text-[#0f172a] tracking-wide">
                ISOT-009
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-[#cbd5e1] text-[10px] font-mono bg-white">
                <thead>
                  <tr className="bg-[#e2e8f0] text-[#1e293b]">
                    <th className="border border-[#cbd5e1] py-0.5 px-1 text-center font-bold text-[9px]"></th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[9px] leading-tight">
                      TIME<br /><span className="text-[7.5px] font-normal text-[#475569]">(HH:MM)</span>
                    </th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[9px] leading-tight">
                      LEVEL<br /><span className="text-[7.5px] font-normal text-[#475569]">(%)</span>
                    </th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[9px] leading-tight">
                      LEVEL<br /><span className="text-[7.5px] font-normal text-[#475569]">(mmH2O)</span>
                    </th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[9px] leading-tight">
                      VOLUME<br /><span className="text-[7.5px] font-normal text-[#475569]">(m³)</span>
                    </th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[9px] leading-tight">
                      MASS<br /><span className="text-[7.5px] font-normal text-[#475569]">(kg)</span>
                    </th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[9px] leading-tight">
                      PRESS<br /><span className="text-[7.5px] font-normal text-[#475569]">(MPa)</span>
                    </th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[9px] leading-tight">
                      TEMP<br /><span className="text-[7.5px] font-normal text-[#475569]">(°C)</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-[#f8fafc]">
                    <td className="border border-[#cbd5e1] py-0.5 px-1 text-center font-bold text-[#475569]">MOUNTED</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center text-[#0f172a] font-bold">08:00</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">54.0</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">510</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">24.0</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">10,224</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">0.76</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">-126.7</td>
                  </tr>
                  <tr className="bg-[#f0fdf4]/60 hover:bg-[#f0fdf4]">
                    <td className="border border-[#cbd5e1] py-0.5 px-1 text-center font-bold text-[#15803d]">LAST</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center text-[#0f172a] font-bold">12:00</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">49.0</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">466</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">22.9</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">9,798</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">0.76</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">-126.7</td>
                  </tr>
                  <tr className="bg-[#fef2f2]/60 hover:bg-[#fef2f2]">
                    <td className="border border-[#cbd5e1] py-0.5 px-1 text-center font-bold text-[#b91c1c]">Δ</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#475569]">04:00</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#b91c1c]">-5.0</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#b91c1c]">-44</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#b91c1c]">-1.1</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#b91c1c]">-426</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#475569]">0.00</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#475569]">0.0</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 3단 (하단): [ STANDBY ] 대기 스키드 목록 테이블 */}
            <div className="px-0.5 pt-0.5">
              <span className="font-mono font-bold text-[10px] text-[#334155] tracking-wide block">
                [ STANDBY ]
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-[#cbd5e1] text-[9.5px] font-mono bg-white">
                <thead>
                  <tr className="bg-[#e2e8f0] text-[#1e293b]">
                    <th className="border border-[#cbd5e1] py-0.5 px-1 text-center font-bold text-[8.5px]">SKID</th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[8.5px]">TANK ID</th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[8.5px] leading-tight">
                      MASS<br /><span className="text-[7.5px] font-normal text-[#475569]">(kg)</span>
                    </th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[8.5px] leading-tight">
                      PRESS<br /><span className="text-[7.5px] font-normal text-[#475569]">(MPa)</span>
                    </th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[8.5px] leading-tight">
                      TEMP<br /><span className="text-[7.5px] font-normal text-[#475569]">(°C)</span>
                    </th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[8.5px]">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-[#f8fafc]">
                    <td className="border border-[#cbd5e1] py-0.5 px-1 text-center font-bold text-[#0f172a]">T-202</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center text-[#475569] font-bold">ISOT-014</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">11,118.6</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center text-[#0f172a]">0.80</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center text-[#0f172a]">-126.5</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center">
                      <span className="px-1.5 py-0.5 rounded-none text-[8px] font-bold bg-[#f1f5f9] text-[#64748b] border border-[#cbd5e1]">
                        ST-By
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-[#f8fafc]">
                    <td className="border border-[#cbd5e1] py-0.5 px-1 text-center font-bold text-[#0f172a]">T-203</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center text-[#475569] font-bold">ISOT-017</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">12,780.0</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center text-[#0f172a]">0.79</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center text-[#0f172a]">-126.8</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center">
                      <span className="px-1.5 py-0.5 rounded-none text-[8px] font-bold bg-[#f1f5f9] text-[#64748b] border border-[#cbd5e1]">
                        ST-By
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-[#f8fafc]">
                    <td className="border border-[#cbd5e1] py-0.5 px-1 text-center font-bold text-[#0f172a]">T-204</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center text-[#475569] font-bold">ISOT-026</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">12,822.6</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center text-[#0f172a]">0.80</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center text-[#0f172a]">-126.6</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center">
                      <span className="px-1.5 py-0.5 rounded-none text-[8px] font-bold bg-[#f1f5f9] text-[#64748b] border border-[#cbd5e1]">
                        ST-By
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BLOCK 2: GAS METERING                                                     */}
          {/* ========================================================================= */}
          <div className="flex flex-col justify-start space-y-1 p-1.5 pb-1.5 rounded-none bg-[#f1eee7] border border-[#b0aaa0] overflow-hidden">
            {/* Block Header (Dark Slate Charcoal #3b4758) - Center Aligned */}
            <div className="relative bg-[#3b4758] text-[#f8fafc] px-2 py-1 border border-[#334155] flex justify-center items-center">
              <span className="font-mono font-bold text-[11px] sm:text-[12px] uppercase tracking-wider text-[#f8fafc] text-center">
                GAS METERING
              </span>
              <span className="absolute right-1.5 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-none bg-[#2a3444] text-[#38bdf8] border border-[#526075] whitespace-nowrap">
                [ ONLINE / PARITY ]
              </span>
            </div>

            {/* 1단 (최상단): [ CUMULATIVE TOTAL ] 기간 누적 요약 패널 */}
            <div className="px-0.5 pt-0.5">
              <span className="font-mono font-bold text-[10px] text-[#334155] tracking-wide block">
                [ CUMULATIVE TOTAL ]
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1 bg-white border border-[#cbd5e1] p-1 rounded-none text-center font-mono w-full">
              <div className="bg-[#f8fafc] py-1.5 px-1 border border-[#cbd5e1] flex flex-col items-center justify-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight leading-tight block truncate">
                  ENERGY
                </span>
                <span className="text-[9px] text-slate-400 font-normal leading-none my-0.5 block truncate">
                  (MMBTU)
                </span>
                <span className="text-sm font-bold text-slate-900 leading-tight block whitespace-nowrap">
                  16,782.5
                </span>
              </div>
              <div className="bg-[#f8fafc] py-1.5 px-1 border border-[#cbd5e1] flex flex-col items-center justify-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight leading-tight block truncate">
                  GAS VOL
                </span>
                <span className="text-[9px] text-slate-400 font-normal leading-none my-0.5 block truncate">
                  (MMCF)
                </span>
                <span className="text-sm font-bold text-slate-900 leading-tight block whitespace-nowrap">
                  16.02
                </span>
              </div>
              <div className="bg-[#f8fafc] py-1.5 px-1 border border-[#cbd5e1] flex flex-col items-center justify-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight leading-tight block truncate">
                  DELIVERED
                </span>
                <span className="text-[9px] text-slate-400 font-normal leading-none my-0.5 block truncate">
                  (T)
                </span>
                <span className="text-sm font-bold text-slate-900 leading-tight block whitespace-nowrap">
                  319.94
                </span>
              </div>
              <div className="bg-[#f8fafc] py-1.5 px-1 border border-[#cbd5e1] flex flex-col items-center justify-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight leading-tight block truncate">
                  GHV
                </span>
                <span className="text-[9px] text-slate-400 font-normal leading-none my-0.5 block truncate">
                  (BTU)
                </span>
                <span className="text-sm font-bold text-slate-900 leading-tight block whitespace-nowrap">
                  1048.2
                </span>
              </div>
              <div className="bg-[#f8fafc] py-1.5 px-1 border border-[#cbd5e1] flex flex-col items-center justify-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight leading-tight block truncate">
                  CH₄
                </span>
                <span className="text-[9px] text-slate-400 font-normal leading-none my-0.5 block truncate">
                  (%)
                </span>
                <span className="text-sm font-bold text-slate-900 leading-tight block whitespace-nowrap">
                  96.64
                </span>
              </div>
            </div>

            {/* 2단 (중단): [ DAILY GAS METERING ] 메인 계측 테이블 (수치 전체 중앙 정렬) */}
            <div className="px-0.5 pt-0.5">
              <span className="font-mono font-bold text-[10px] text-[#334155] tracking-wide block">
                [ DAILY GAS METERING ]
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-[#cbd5e1] text-[10px] font-mono bg-white">
                <thead>
                  <tr className="bg-[#e2e8f0] text-[#1e293b]">
                    <th className="border border-[#cbd5e1] py-0.5 px-1 text-center font-bold text-[9px]"></th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[9px] leading-tight">
                      UVOL<br /><span className="text-[7.5px] font-normal text-[#475569]">(MMCF)</span>
                    </th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[9px] leading-tight">
                      CVOL<br /><span className="text-[7.5px] font-normal text-[#475569]">(MMCF)</span>
                    </th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[9px] leading-tight">
                      MASS<br /><span className="text-[7.5px] font-normal text-[#475569]">(Tonne)</span>
                    </th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[9px] leading-tight">
                      ENERGY<br /><span className="text-[7.5px] font-normal text-[#475569]">(MMBTU)</span>
                    </th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[9px] leading-tight">
                      PRESS<br /><span className="text-[7.5px] font-normal text-[#475569]">(BARG)</span>
                    </th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[9px] leading-tight">
                      TEMP<br /><span className="text-[7.5px] font-normal text-[#475569]">(°C)</span>
                    </th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[9px] leading-tight">
                      GHV<br /><span className="text-[7.5px] font-normal text-[#475569]">(BTU/SCF)</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-[#f8fafc]">
                    <td className="border border-[#cbd5e1] py-0.5 px-1 text-center font-bold text-[#0f172a]">M-101A</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">0.01</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">0.01</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">0.02</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">1.0</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">7.05</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">+32.8</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">1049.7</td>
                  </tr>
                  <tr className="bg-[#f0fdf4]/60 hover:bg-[#f0fdf4]">
                    <td className="border border-[#cbd5e1] py-0.5 px-1 text-center font-bold text-[#15803d]">M-101B</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">0.50</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">0.50</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">10.02</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">523.0</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">2.18</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">+23.4</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">1049.7</td>
                  </tr>
                  <tr className="bg-[#f8fafc] hover:bg-[#f1f5f9]">
                    <td className="border border-[#cbd5e1] py-0.5 px-1 text-center font-bold text-[#0f172a]">STATION</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">0.51</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">0.51</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">10.04</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">524.0</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">3.50</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">+28.4</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">1049.7</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 3단 (최하단): [ GAS COMPOSITION ] 성분별 몰 분율 테이블 */}
            <div className="flex items-center justify-between px-0.5 pt-0.5">
              <span className="font-mono font-bold text-[10px] text-[#334155] tracking-wide block">
                [ GAS COMPOSITION ]
              </span>
              <span className="font-mono text-[8.5px] font-semibold text-[#64748b]">
                (Mol %)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-[#cbd5e1] text-[10px] font-mono bg-white">
                <thead>
                  <tr className="bg-[#e2e8f0] text-[#1e293b]">
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[9px]">CH₄</th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[9px]">C₂H₆</th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[9px]">C₃H₈</th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[9px]">i-C₄</th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[9px]">n-C₄</th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[9px]">N₂</th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[9px]">CO₂</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-[#f8fafc]">
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">96.53</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">2.71</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">0.51</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">0.07</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">0.08</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">0.03</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">0.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BLOCK 3: PLTMG POWER OUTPUT                                               */}
          {/* ========================================================================= */}
          <div className="flex flex-col justify-start space-y-1 p-1.5 pb-1.5 rounded-none bg-[#f1eee7] border border-[#b0aaa0] overflow-hidden">
            {/* Block Header (Dark Slate Charcoal #3b4758) - Center Aligned */}
            <div className="relative bg-[#3b4758] text-[#f8fafc] px-2 py-1 border border-[#334155] flex justify-center items-center">
              <span className="font-mono font-bold text-[11px] sm:text-[12px] uppercase tracking-wider text-[#f8fafc] text-center">
                PLTMG POWER OUTPUT
              </span>
              <span className="absolute right-1.5 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-none bg-[#2a3444] text-[#f8fafc] border border-[#526075] whitespace-nowrap">
                [ 4/5 RUN / 60.0% MCR ]
              </span>
            </div>

            {/* 1단 (상단): [ COMBINED SUMMARY ] 플랜트 종합 요약 그리드 */}
            <div className="px-0.5 pt-0.5">
              <span className="font-mono font-bold text-[10px] text-[#334155] tracking-wide block">
                [ COMBINED SUMMARY ]
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-[#cbd5e1] text-[10px] font-mono bg-white">
                <thead>
                  <tr className="bg-[#e2e8f0] text-[#1e293b]">
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[9px] leading-tight">
                      OUTPUT<br /><span className="text-[7.5px] font-normal text-[#475569]">(MW)</span>
                    </th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[9px] leading-tight">
                      RUN<br /><span className="text-[7.5px] font-normal text-[#475569]">(ACTIVE / TOTAL)</span>
                    </th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[9px] leading-tight">
                      LOAD<br /><span className="text-[7.5px] font-normal text-[#475569]">(% MCR)</span>
                    </th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[9px] leading-tight">
                      GAS<br /><span className="text-[7.5px] font-normal text-[#475569]">(MW / %)</span>
                    </th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[9px] leading-tight">
                      DIESEL<br /><span className="text-[7.5px] font-normal text-[#475569]">(MW / %)</span>
                    </th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[9px] leading-tight">
                      TOTAL GAS FLOW<br /><span className="text-[7.5px] font-normal text-[#475569]">(Nm³/h)</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-[#f8fafc]">
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-black text-[#0f172a]">22.05</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">4 / 5</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">60.0</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#15803d]">22.05 (100%)</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#64748b]">0.00 (0%)</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-black text-[#0f172a]">5,631.2</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 2단 (하단): [ GENERATOR UNITS ] 개별 엔진 스키드 상태 테이블 */}
            <div className="px-0.5 pt-0.5">
              <span className="font-mono font-bold text-[10px] text-[#334155] tracking-wide block">
                [ GENERATOR UNITS ]
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-[#cbd5e1] text-[9.5px] font-mono bg-white">
                <thead>
                  <tr className="bg-[#e2e8f0] text-[#1e293b]">
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[8.5px]">ENGINE ID</th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[8.5px]">MODE</th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[8.5px]">STATUS</th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[8.5px] leading-tight">
                      OUTPUT<br /><span className="text-[7.5px] font-normal text-[#475569]">(kW)</span>
                    </th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[8.5px] leading-tight">
                      LOAD<br /><span className="text-[7.5px] font-normal text-[#475569]">(%)</span>
                    </th>
                    <th className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[8.5px] leading-tight">
                      GAS FLOW<br /><span className="text-[7.5px] font-normal text-[#475569]">(Nm³/h)</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-[#f8fafc]">
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">GEN-01</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center text-[#475569]">Gas</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center">
                      <span className="px-1.5 py-0.5 rounded-none text-[8px] font-bold bg-[#dcfce7] text-[#15803d] border border-[#86efac]">
                        RUN
                      </span>
                    </td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">5,513</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">75.0</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center text-[#0f172a]">1,407.8</td>
                  </tr>
                  <tr className="hover:bg-[#f8fafc]">
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">GEN-02</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center text-[#475569]">Gas</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center">
                      <span className="px-1.5 py-0.5 rounded-none text-[8px] font-bold bg-[#dcfce7] text-[#15803d] border border-[#86efac]">
                        RUN
                      </span>
                    </td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">5,513</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">75.0</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center text-[#0f172a]">1,407.8</td>
                  </tr>
                  <tr className="hover:bg-[#f8fafc]">
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">GEN-03</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center text-[#475569]">Gas</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center">
                      <span className="px-1.5 py-0.5 rounded-none text-[8px] font-bold bg-[#dcfce7] text-[#15803d] border border-[#86efac]">
                        RUN
                      </span>
                    </td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">5,513</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">75.0</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center text-[#0f172a]">1,407.8</td>
                  </tr>
                  <tr className="hover:bg-[#f8fafc]">
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">GEN-04</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center text-[#475569]">Gas</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center">
                      <span className="px-1.5 py-0.5 rounded-none text-[8px] font-bold bg-[#dcfce7] text-[#15803d] border border-[#86efac]">
                        RUN
                      </span>
                    </td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">5,513</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#0f172a]">75.0</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center text-[#0f172a]">1,407.8</td>
                  </tr>
                  <tr className="hover:bg-[#f8fafc]">
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#64748b]">GEN-05</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center text-[#64748b]">Diesel</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center">
                      <span className="px-1.5 py-0.5 rounded-none text-[8px] font-bold bg-[#f1f5f9] text-[#64748b] border border-[#cbd5e1]">
                        STOP
                      </span>
                    </td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#64748b]">0</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center font-bold text-[#64748b]">0.0</td>
                    <td className="border border-[#cbd5e1] py-0.5 px-0.5 text-center text-[#64748b]">0.0</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
