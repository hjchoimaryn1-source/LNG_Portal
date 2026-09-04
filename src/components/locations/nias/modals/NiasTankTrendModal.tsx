// src/components/locations/nias/modals/NiasTankTrendModal.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { Radio } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine,
} from 'recharts';
import { DailyMasterRecord, FleetTankItem } from '../../../../types/lng';
import { NiasTankAsset } from '../../NiasTerminalView';
import {
  calcVolumeFromMmH2O,
  calcMassTonFromVolume,
} from '../../../../utils/tankPhysicsCalculations';

export interface NiasTankTrendModalProps {
  tankNo: string | null;
  onClose: () => void;
  dailyMasterRecords: DailyMasterRecord[];
  tankInventory: Array<NiasTankAsset | FleetTankItem | any>;
}

const normalizeBatch = (raw?: string): string => {
  if (!raw) return '';
  const match = raw.match(/n-?(\d+)/i);
  if (match) return `N${match[1]}`;
  return raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
};

export function NiasTankTrendModal({
  tankNo,
  onClose,
  dailyMasterRecords,
  tankInventory,
}: NiasTankTrendModalProps) {
  const [trendTimeRange, setTrendTimeRange] = useState<'7D' | '14D' | '30D' | 'ALL'>('7D');
  const [trendSeriesVisible, setTrendSeriesVisible] = useState<{ vol: boolean; press: boolean; temp: boolean }>({
    vol: true,
    press: true,
    temp: true,
  });

  const tankAsset = useMemo(() => {
    if (!tankNo) return null;
    return tankInventory.find((t: any) => t.id === tankNo || t.tankNo === tankNo);
  }, [tankNo, tankInventory]);

  const serialNo = tankAsset?.serialNo || 'SIMU-8101426';

  const trendModalData = useMemo(() => {
    if (!tankNo) return [];

    const tankRecords = dailyMasterRecords
      .filter((r) => r.tankNo === tankNo)
      .sort((a, b) => (a.reportDate > b.reportDate ? 1 : -1));

    const activeTank = tankInventory.find((t: any) => t.id === tankNo || t.tankNo === tankNo);
    const baseDate = new Date();
    const daysCount = trendTimeRange === '7D' ? 7 : trendTimeRange === '14D' ? 14 : trendTimeRange === '30D' ? 30 : 30;

    const points: Array<{
      date: string;
      fullDate: string;
      analogPress: number;
      smtPress: number;
      smtLevel: number;
      calcVol: number;
      calcMass: number;
      tempC: number;
      battery: number;
      signal: number;
      bogLossKg: number;
      zone: string;
      batch: string;
      status: string;
    }> = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const shortDate = dateStr.slice(5);

      const existing = tankRecords.find((r) => r.reportDate === dateStr);
      if (existing) {
        const rawMm = existing.levelMmH2O || (existing.level ? Math.round((existing.level / 100) * 950) : 465);
        const cVol = calcVolumeFromMmH2O(rawMm);
        const cMass = calcMassTonFromVolume(cVol);
        const isHighPress = (existing.pressureMPa || 0) >= 0.74;
        points.push({
          date: shortDate,
          fullDate: dateStr,
          analogPress: parseFloat((existing.pressureMPa || 0.76).toFixed(2)),
          smtPress: parseFloat(((existing.pressureMPa || 0.76) + (Math.sin(i) * 0.01)).toFixed(2)),
          smtLevel: parseFloat((existing.level ?? ((rawMm / 950) * 100)).toFixed(1)),
          calcVol: parseFloat(cVol.toFixed(1)),
          calcMass: parseFloat(cMass.toFixed(2)),
          tempC: parseFloat((existing.tempC !== undefined && existing.tempC !== null ? existing.tempC : -126.7).toFixed(1)),
          battery: existing.battery || Math.max(50, 95 - i),
          signal: Math.min(100, Math.max(80, 92 + Math.round(Math.cos(i) * 5))),
          bogLossKg: existing.depress ? (existing.pressBeforeMPa && existing.pressAfterMPa ? Math.round((existing.pressBeforeMPa - existing.pressAfterMPa) * 1000 * 6.1) : 426) : 0,
          zone: existing.position || (activeTank?.currentZone === 'LAYDOWN_2' ? 'LD-2' : activeTank?.currentZone?.startsWith('BAY') ? 'SKID' : 'LD-1'),
          batch: normalizeBatch(existing.shipment) || 'N1',
          status: isHighPress ? 'WARNING' : 'NORMAL',
        });
      } else {
        const currentLevel = activeTank?.levelPercent ?? activeTank?.level ?? 51.0;
        const currentPress = activeTank?.pressureMpa ?? activeTank?.pressureMPa ?? 0.76;
        const currentTemp = activeTank?.tempC ?? -126.7;
        const progressFactor = (daysCount - 1 - i) / Math.max(1, daysCount - 1);

        const simPress = parseFloat((0.68 + (currentPress - 0.68) * progressFactor + Math.sin(i * 0.8) * 0.015).toFixed(2));
        const simSmtPress = parseFloat((simPress + 0.01).toFixed(2));
        const simLevel = parseFloat((Math.min(95, currentLevel + (daysCount - 1 - (daysCount - 1 - i)) * 0.15)).toFixed(1));
        const simMmH2O = Math.round((simLevel / 100) * 950);
        const simVol = calcVolumeFromMmH2O(simMmH2O);
        const simMass = calcMassTonFromVolume(simVol);
        const simTemp = parseFloat((currentTemp + Math.sin(i * 0.5) * 0.4).toFixed(1));
        const simBatt = Math.min(100, Math.max(60, 96 - Math.floor(i * 0.8)));
        const simSignal = Math.min(100, Math.max(82, 94 + Math.round(Math.cos(i) * 4)));
        const isDepressDay = i % 5 === 2;

        points.push({
          date: shortDate,
          fullDate: dateStr,
          analogPress: simPress,
          smtPress: simSmtPress,
          smtLevel: simLevel,
          calcVol: parseFloat(simVol.toFixed(1)),
          calcMass: parseFloat(simMass.toFixed(2)),
          tempC: simTemp,
          battery: simBatt,
          signal: simSignal,
          bogLossKg: isDepressDay ? 385 : 0,
          zone: activeTank?.currentZone === 'LAYDOWN_2' ? 'LD-2' : activeTank?.currentZone?.startsWith('BAY') ? 'SKID' : 'LD-1',
          batch: activeTank?.shipment ? normalizeBatch(activeTank.shipment) : 'N1',
          status: simPress >= 0.74 ? 'WARNING' : 'NORMAL',
        });
      }
    }

    return points;
  }, [tankNo, dailyMasterRecords, tankInventory, trendTimeRange]);

  if (!tankNo) return null;

  const latestPoint = trendModalData.length > 0 ? trendModalData[trendModalData.length - 1] : null;
  const battVal = latestPoint?.battery ?? tankAsset?.batteryPercent ?? 95;
  const sigVal = latestPoint?.signal ?? 92;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 select-none animate-in fade-in duration-150 font-mono">
      <div className="w-[96vw] max-w-[1480px] h-[90vh] flex flex-col bg-[#ece9d8] border-2 border-white border-b-2 border-r-2 border-slate-700 shadow-2xl rounded-xs overflow-hidden">

        {/* Top Header Bar */}
        <div className="bg-[#0a2540] text-white px-4 py-2 flex items-center justify-between border-b border-[#071a2e] shrink-0">
          {/* Left: Title & Serial */}
          <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden">
            <span className="text-sm sm:text-base font-black tracking-wider uppercase text-white font-mono flex items-center gap-1.5 shrink-0">
              <span>📈</span>
              <span>HISTORICAL TELEMETRY TREND ANALYTICS:</span>
              <span className="text-amber-300 ml-1">{tankNo}</span>
              <span className="text-slate-300 font-normal text-xs">({serialNo})</span>
            </span>
          </div>

          {/* Center: Time Range Selector 3D Buttons */}
          <div className="flex items-center gap-1 bg-[#061828] p-1 rounded-xs border border-blue-900/60 shadow-inner shrink-0">
            {(['7D', '14D', '30D', 'ALL'] as const).map((range) => {
              const label = range === '7D' ? '7 Days' : range === '14D' ? '14 Days' : range === '30D' ? '30 Days' : 'All History';
              const isActive = trendTimeRange === range;
              return (
                <button
                  key={range}
                  type="button"
                  onClick={() => setTrendTimeRange(range)}
                  className={`px-3 py-0.5 text-xs font-bold font-mono rounded-xs border-t border-l border-b-2 border-r-2 shadow-xs cursor-pointer select-none transition-all ${isActive
                    ? 'bg-[#d4d0c8] text-slate-900 border-white border-b-slate-700 border-r-slate-700 shadow-inner font-black'
                    : 'bg-[#1b2b3a] hover:bg-[#25394d] text-slate-300 border-slate-600 border-b-slate-900 border-r-slate-900'
                    }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Right: Auxiliary Telemetry Badge [ BATT | SIG ] + Close Button */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Slate Inset Telemetry Badge */}
            <div className="flex items-center gap-2.5 px-3 py-1 bg-[#07131f] text-slate-200 border border-slate-700/80 rounded-xs shadow-[inset_1px_1px_3px_rgba(0,0,0,0.8)] font-mono text-xs select-none">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${battVal > 50 ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="text-slate-400 font-bold text-[11px]">BATT:</span>
                <span className={`font-black ${battVal > 50 ? 'text-emerald-400' : 'text-amber-400'}`}>{battVal}%</span>
              </div>
              <span className="text-slate-600 font-bold">|</span>
              <div className="flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-cyan-400" />
                <span className="text-slate-400 font-bold text-[11px]">SIG:</span>
                <span className="text-cyan-300 font-black">{sigVal}%</span>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="bg-[#c53030] hover:bg-[#e53e3e] active:bg-[#9b2c2c] text-white font-bold text-xs px-3.5 py-1 rounded-xs border-t border-l border-[#fc8181] border-b-2 border-r-2 border-[#742a2a] shadow-xs cursor-pointer select-none flex items-center gap-1 font-mono"
            >
              <span>✕ CLOSE</span>
            </button>
          </div>
        </div>

        {/* Modal Body: 60% Single Large Multi-Axis Chart + 40% Data Sheet */}
        <div className="flex-1 min-h-0 flex flex-col p-3 gap-3 overflow-hidden bg-[#e8e4dc]">

          {/* TOP: Single Multi-Axis SCADA Telemetry Chart Canvas (60% height) */}
          <div className="flex-[6] min-h-0 flex flex-col bg-[#1e293b] border-2 border-[#475569] rounded-xs shadow-[inset_2px_2px_6px_rgba(0,0,0,0.5)] p-2.5 overflow-hidden">

            {/* Chart Container */}
            <div className="flex-1 min-h-0 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendModalData} margin={{ top: 15, right: 70, left: 15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={true} horizontal={true} strokeOpacity={0.7} />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'monospace', fontWeight: 'bold' }}
                    tickLine={{ stroke: '#475569' }}
                  />

                  {/* Axis 1 (Left Y1): Liquid Level / Residual Volume */}
                  <YAxis
                    yAxisId="vol"
                    orientation="left"
                    stroke="#00b4d8"
                    domain={[0, 25]}
                    tick={{ fontSize: 10, fill: '#00b4d8', fontFamily: 'monospace', fontWeight: 'bold' }}
                    tickLine={{ stroke: '#00b4d8' }}
                    label={{
                      value: 'Vol (m³)',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 0,
                      fill: '#00b4d8',
                      fontSize: 11,
                      fontWeight: 'bold',
                      fontFamily: 'monospace',
                    }}
                  />

                  {/* Axis 2 (Right Y2 - 1st Right Axis): Holding / SMT Pressure */}
                  <YAxis
                    yAxisId="press"
                    orientation="right"
                    stroke="#2ec4b6"
                    domain={[0.0, 1.0]}
                    tick={{ fontSize: 10, fill: '#2ec4b6', fontFamily: 'monospace', fontWeight: 'bold' }}
                    tickLine={{ stroke: '#2ec4b6' }}
                    label={{
                      value: 'Press (MPa)',
                      angle: -90,
                      position: 'insideRight',
                      offset: 0,
                      fill: '#2ec4b6',
                      fontSize: 11,
                      fontWeight: 'bold',
                      fontFamily: 'monospace',
                    }}
                  />

                  {/* Axis 3 (Right Y3 - 2nd Right Axis Offset): Cryogenic Temperature */}
                  <YAxis
                    yAxisId="temp"
                    orientation="right"
                    stroke="#ff6b6b"
                    domain={[-160, -100]}
                    dx={38}
                    tick={{ fontSize: 10, fill: '#ff6b6b', fontFamily: 'monospace', fontWeight: 'bold' }}
                    tickLine={{ stroke: '#ff6b6b' }}
                    label={{
                      value: 'Temp (°C)',
                      angle: -90,
                      position: 'insideRight',
                      offset: 38,
                      fill: '#ff6b6b',
                      fontSize: 11,
                      fontWeight: 'bold',
                      fontFamily: 'monospace',
                    }}
                  />

                  {/* Process Reference Lines with Soft Slate (#94a3b8) text */}
                  <ReferenceLine
                    yAxisId="press"
                    y={0.70}
                    stroke="#2ec4b6"
                    strokeDasharray="3 3"
                    strokeOpacity={0.5}
                    label={{
                      value: 'Regas limit: 0.70 MPa',
                      position: 'insideTopRight',
                      fill: '#94a3b8',
                      fontSize: 10,
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                    }}
                  />
                  <ReferenceLine
                    yAxisId="press"
                    y={0.30}
                    stroke="#2ec4b6"
                    strokeDasharray="3 3"
                    strokeOpacity={0.5}
                    label={{
                      value: 'Disconnect target: 0.30 MPa',
                      position: 'insideBottomRight',
                      fill: '#94a3b8',
                      fontSize: 10,
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                    }}
                  />
                  <ReferenceLine
                    yAxisId="vol"
                    y={1.0}
                    stroke="#00b4d8"
                    strokeDasharray="3 3"
                    strokeOpacity={0.5}
                    label={{
                      value: 'Heel limit: 1.0 m³',
                      position: 'insideBottomLeft',
                      fill: '#94a3b8',
                      fontSize: 10,
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                    }}
                  />

                  {/* SCADA HUD Tooltip */}
                  <RechartsTooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0]?.payload;
                        return (
                          <div className="bg-[#0c141f]/95 border border-[#3b82f6]/60 p-2.5 rounded shadow-2xl backdrop-blur-md font-mono text-xs text-white space-y-1.5 min-w-[220px]">
                            <div className="border-b border-slate-700/80 pb-1 flex justify-between items-center">
                              <span className="font-extrabold text-amber-300">📅 {d?.fullDate || label}</span>
                              <span className="px-1.5 py-0.2 bg-blue-900/60 text-cyan-300 border border-cyan-500/30 rounded text-[10px]">
                                {d?.zone} | {d?.batch}
                              </span>
                            </div>
                            <div className="space-y-1 text-[11px]">
                              <div className="flex justify-between items-center text-[#00b4d8]">
                                <span>• Residual Volume:</span>
                                <span className="font-bold">{d?.calcVol?.toFixed(1)} m³ ({d?.smtLevel?.toFixed(1)}%)</span>
                              </div>
                              <div className="flex justify-between items-center text-[#2ec4b6]">
                                <span>• Holding Pressure:</span>
                                <span className="font-bold">{d?.analogPress?.toFixed(2)} MPa</span>
                              </div>
                              <div className="flex justify-between items-center text-[#2ec4b6]/80">
                                <span>• SMT Sensor Press:</span>
                                <span className="font-bold">{d?.smtPress?.toFixed(2)} MPa</span>
                              </div>
                              <div className="flex justify-between items-center text-[#ff6b6b]">
                                <span>• Cryo Temp:</span>
                                <span className="font-bold">{d?.tempC?.toFixed(1)} °C</span>
                              </div>
                              {d?.bogLossKg > 0 && (
                                <div className="flex justify-between items-center text-amber-400 border-t border-slate-800 pt-0.5">
                                  <span>• BOG Vented Loss:</span>
                                  <span className="font-bold">{d.bogLossKg} kg</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  {/* Series 1: Residual Volume (m³) */}
                  <Line
                    yAxisId="vol"
                    type="monotone"
                    dataKey="calcVol"
                    name="Residual Volume (m³)"
                    stroke="#00b4d8"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#00b4d8', stroke: '#1e293b', strokeWidth: 1 }}
                    activeDot={{ r: 5, fill: '#00b4d8', stroke: '#fff', strokeWidth: 2 }}
                    hide={!trendSeriesVisible.vol}
                  />

                  {/* Series 2: Pressure (MPa) */}
                  <Line
                    yAxisId="press"
                    type="monotone"
                    dataKey="analogPress"
                    name="Pressure (MPa)"
                    stroke="#2ec4b6"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#2ec4b6', stroke: '#1e293b', strokeWidth: 1 }}
                    activeDot={{ r: 5, fill: '#2ec4b6', stroke: '#fff', strokeWidth: 2 }}
                    hide={!trendSeriesVisible.press}
                  />

                  {/* Series 2b: SMT Pressure (MPa) - dashed telemetry comparison */}
                  <Line
                    yAxisId="press"
                    type="monotone"
                    dataKey="smtPress"
                    name="SMT Pressure (MPa)"
                    stroke="#2ec4b6"
                    strokeDasharray="4 2"
                    strokeWidth={1.5}
                    strokeOpacity={0.85}
                    dot={false}
                    activeDot={{ r: 4 }}
                    hide={!trendSeriesVisible.press}
                  />

                  {/* Series 3: Cryo Temp (°C) */}
                  <Line
                    yAxisId="temp"
                    type="monotone"
                    dataKey="tempC"
                    name="Cryo Temp (°C)"
                    stroke="#ff6b6b"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#ff6b6b', stroke: '#1e293b', strokeWidth: 1 }}
                    activeDot={{ r: 5, fill: '#ff6b6b', stroke: '#fff', strokeWidth: 2 }}
                    hide={!trendSeriesVisible.temp}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* SCADA Interactive Centralized Bottom Legend with Toggle Support */}
            <div className="flex items-center justify-center gap-4 sm:gap-8 pt-1.5 border-t border-[#334155] bg-[#0f172a] py-1.5 px-3 rounded-xs font-mono text-xs select-none shrink-0 shadow-inner">
              <button
                type="button"
                onClick={() => setTrendSeriesVisible((prev) => ({ ...prev, temp: !prev.temp }))}
                className={`flex items-center gap-2 px-3 py-1 rounded-xs cursor-pointer transition-all border ${trendSeriesVisible.temp
                  ? 'bg-[#ff6b6b]/15 border-[#ff6b6b]/60 text-[#ff6b6b] shadow-xs font-bold'
                  : 'bg-slate-800/40 border-slate-700/50 text-slate-500 opacity-60 line-through'
                  }`}
                title="Toggle Cryo Temperature Series"
              >
                <span className={`w-3 h-1 rounded-full ${trendSeriesVisible.temp ? 'bg-[#ff6b6b]' : 'bg-slate-600'}`} />
                <span className="font-bold text-[11px]">Cryo Temp (°C)</span>
              </button>

              <button
                type="button"
                onClick={() => setTrendSeriesVisible((prev) => ({ ...prev, press: !prev.press }))}
                className={`flex items-center gap-2 px-3 py-1 rounded-xs cursor-pointer transition-all border ${trendSeriesVisible.press
                  ? 'bg-[#2ec4b6]/15 border-[#2ec4b6]/60 text-[#2ec4b6] shadow-xs font-bold'
                  : 'bg-slate-800/40 border-slate-700/50 text-slate-500 opacity-60 line-through'
                  }`}
                title="Toggle Pressure Series"
              >
                <span className={`w-3 h-1 rounded-full ${trendSeriesVisible.press ? 'bg-[#2ec4b6]' : 'bg-slate-600'}`} />
                <span className="font-bold text-[11px]">Pressure (MPa)</span>
              </button>

              <button
                type="button"
                onClick={() => setTrendSeriesVisible((prev) => ({ ...prev, vol: !prev.vol }))}
                className={`flex items-center gap-2 px-3 py-1 rounded-xs cursor-pointer transition-all border ${trendSeriesVisible.vol
                  ? 'bg-[#00b4d8]/15 border-[#00b4d8]/60 text-[#00b4d8] shadow-xs font-bold'
                  : 'bg-slate-800/40 border-slate-700/50 text-slate-500 opacity-60 line-through'
                  }`}
                title="Toggle Residual Volume Series"
              >
                <span className={`w-3 h-1 rounded-full ${trendSeriesVisible.vol ? 'bg-[#00b4d8]' : 'bg-slate-600'}`} />
                <span className="font-bold text-[11px]">Residual Volume (m³)</span>
              </button>
            </div>
          </div>

          {/* BOTTOM: Data Sheet (40% height) */}
          <div className="flex-[4] min-h-0 flex flex-col bg-white border-2 border-[#8a8579] rounded-xs shadow-inner overflow-hidden">
            <div className="bg-[#4e5d6e] text-white px-3 py-1 text-xs font-extrabold uppercase tracking-wider flex items-center justify-between border-b border-[#8b9aa8] shrink-0 select-none">
              <span>HISTORICAL INSPECTION &amp; TELEMETRY LOG DATA SHEET</span>
              <span className="font-mono text-xs text-slate-200">{trendModalData.length} Records Loaded</span>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto custom-scada-scrollbar">
              <table className="w-full text-xs font-mono border-collapse">
                <thead className="sticky top-0 bg-[#5f6f82] text-white text-[11px] font-extrabold uppercase select-none shadow-xs z-10">
                  <tr>
                    <th className="py-1 px-2 text-center border-r border-b border-[#8b9aa8]">DATE</th>
                    <th className="py-1 px-1.5 text-center border-r border-b border-[#8b9aa8]">ZONE</th>
                    <th className="py-1 px-1.5 text-center border-r border-b border-[#8b9aa8]">BATCH</th>
                    <th className="py-1 px-2 text-center border-r border-b border-[#8b9aa8]">ANALOG PRESS</th>
                    <th className="py-1 px-2 text-center border-r border-b border-[#8b9aa8]">LEVEL (mmH2O)</th>
                    <th className="py-1 px-2 text-center border-r border-b border-[#8b9aa8] bg-[#2b78c5] text-white">CALC VOL</th>
                    <th className="py-1 px-2 text-center border-r border-b border-[#8b9aa8] bg-[#2b78c5] text-white">CALC MASS</th>
                    <th className="py-1 px-2 text-center border-r border-b border-[#8b9aa8]">SMT PRESS</th>
                    <th className="py-1 px-2 text-center border-r border-b border-[#8b9aa8]">SMT LEVEL</th>
                    <th className="py-1 px-2 text-center border-r border-b border-[#8b9aa8]">TEMP</th>
                    <th className="py-1 px-1.5 text-center border-r border-b border-[#8b9aa8]">BATT</th>
                    <th className="py-1 px-2 text-center border-r border-b border-[#8b9aa8]">BOG LOSS</th>
                    <th className="py-1 px-2 text-center border-b border-[#8b9aa8]">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8e4dc] text-[12px]">
                  {trendModalData.slice().reverse().map((row, idx) => (
                    <tr key={row.fullDate || idx} className="hover:bg-[#eaf2fb] transition-colors even:bg-[#faf8f5]">
                      <td className="py-1 px-2 text-center border-r border-[#e8e4dc] font-bold text-slate-800">{row.fullDate}</td>
                      <td className="py-1 px-1.5 text-center border-r border-[#e8e4dc]">
                        <span className="px-1 py-0.2 bg-sky-50 text-sky-800 border border-sky-300 rounded text-[10px] font-bold">{row.zone}</span>
                      </td>
                      <td className="py-1 px-1.5 text-center border-r border-[#e8e4dc]">
                        <span className="px-1 py-0.2 bg-white text-slate-800 border border-slate-300 rounded text-[10px] font-bold">{row.batch}</span>
                      </td>
                      <td className={`py-1 px-2 text-center border-r border-[#e8e4dc] font-bold ${row.analogPress >= 0.74 ? 'text-amber-600 font-black' : 'text-slate-900'}`}>
                        {row.analogPress.toFixed(2)} MPa
                      </td>
                      <td className="py-1 px-2 text-center border-r border-[#e8e4dc] text-slate-900 font-bold">
                        {Math.round((row.smtLevel / 100) * 950)}
                      </td>
                      <td className="py-1 px-2 text-center border-r border-[#d4e6f8] bg-[#f0f7ff] text-[#004a99] font-bold">
                        {row.calcVol.toFixed(1)} m³
                      </td>
                      <td className="py-1 px-2 text-center border-r border-[#d4e6f8] bg-[#f0f7ff] text-[#004a99] font-bold">
                        {row.calcMass.toFixed(2)} t
                      </td>
                      <td className="py-1 px-2 text-center border-r border-[#e8e4dc] text-slate-900 font-bold">{row.smtPress.toFixed(2)} MPa</td>
                      <td className="py-1 px-2 text-center border-r border-[#e8e4dc] text-slate-900 font-bold">{row.smtLevel.toFixed(1)}%</td>
                      <td className="py-1 px-2 text-center border-r border-[#e8e4dc] text-slate-900 font-bold">{row.tempC.toFixed(1)}°C</td>
                      <td className="py-1 px-1.5 text-center border-r border-[#e8e4dc] text-slate-700">{row.battery}%</td>
                      <td className="py-1 px-2 text-center border-r border-[#e8e4dc] text-slate-700 font-semibold">{row.bogLossKg > 0 ? `${row.bogLossKg} kg` : '-'}</td>
                      <td className="py-1 px-2 text-center">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${row.status === 'WARNING' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NiasTankTrendModal;
