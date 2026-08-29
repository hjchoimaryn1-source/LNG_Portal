import React, { useState } from 'react';
import { ActiveBayState, DailyMasterRecord } from '@/types/lng';
import { NiasTankAsset } from '../NiasTerminalView';
import { usePortalData } from '@/context/PortalDataContext';
import { XCircle } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

interface NiasActiveBayWorkspaceProps {
  tankInventory: NiasTankAsset[];
  setTankInventory: (inventory: NiasTankAsset[]) => void;
  setMountModalBayId: (bayId: string | null) => void;
  linkedArunBaseline: any;
  zoneStats: { activeBaysCount: number };
}

export function NiasActiveBayWorkspace({
  tankInventory,
  setTankInventory,
  setMountModalBayId,
  linkedArunBaseline,
  zoneStats,
}: NiasActiveBayWorkspaceProps) {
  const { activeBays, toggleBayRunning, unmountBay, batchUpdateDailyMasterRecords } = usePortalData();

  const [activeDrawerBayId, setActiveDrawerBayId] = useState<string | null>(null);
  const [activeDrawerType, setActiveDrawerType] = useState<'PATROL' | 'DISCONNECT' | null>(null);
  const [selectedChartBayId, setSelectedChartBayId] = useState<string | null>(null);

  const getMockTrendData = (bayId: string) => {
    return [
      { time: '00:00', volume: 22.5, pressure: 0.85, temp: -155 },
      { time: '04:00', volume: 18.2, pressure: 0.80, temp: -148 },
      { time: '08:00 (Baseline)', volume: 14.1, pressure: 0.75, temp: -140 },
      { time: '12:00', volume: 9.8, pressure: 0.72, temp: -135 },
      { time: '16:00', volume: 5.4, pressure: 0.65, temp: -128 },
      { time: '20:00', volume: 2.1, pressure: 0.45, temp: -120 },
      { time: 'Bay-Out', volume: 1.0, pressure: 0.30, temp: -115 },
    ];
  };

  const [patrolTimeSlot, setPatrolTimeSlot] = useState<string>('08:00');
  const [patrolLevelPct, setPatrolLevelPct] = useState<number>(45);
  const [patrolLevelMmH2O, setPatrolLevelMmH2O] = useState<number>(410);
  const [patrolVolumeM3, setPatrolVolumeM3] = useState<number>(20.3);
  const [patrolMassTon, setPatrolMassTon] = useState<number>(9.5);
  const [patrolPressureMPa, setPatrolPressureMPa] = useState<number>(0.65);
  const [patrolTempC, setPatrolTempC] = useState<number>(-129.5);
  const [patrolRemarks, setPatrolRemarks] = useState<string>('');

  const [stage1Date, setStage1Date] = useState<string>(() => new Date().toISOString().slice(0, 16).replace('T', ' '));
  const [heelLevelPct, setHeelLevelPct] = useState<number>(4.0);
  const [heelPreVentPressureMPa, setHeelPreVentPressureMPa] = useState<number>(0.70);
  const [heelPressureMPa, setHeelPressureMPa] = useState<number>(0.30);
  const [heelTempC, setHeelTempC] = useState<number>(-135.0);
  const [heelWeightKg, setHeelWeightKg] = useState<number>(400);
  const [stage1Remarks, setStage1Remarks] = useState<string>('Normal post-regas offload to Laydown 2');

  const handlePatrolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDrawerBayId || activeDrawerType !== 'PATROL') return;
    const bay = activeBays.find((b) => b.bayId === activeDrawerBayId);
    if (!bay || !bay.tankNo) return;
    const newRecord: DailyMasterRecord = {
      id: `PATROL-${Date.now()}`,
      reportDate: new Date().toISOString().slice(0, 10),
      tankNo: bay.tankNo,
      serialNo: bay.serialNo || 'UNKNOWN',
      shipment: 'N1',
      position: activeDrawerBayId,
      level: patrolLevelPct,
      levelM3: patrolVolumeM3,
      levelMmH2O: patrolLevelMmH2O,
      pressureMPa: patrolPressureMPa,
      tempC: patrolTempC,
      battery: 100,
      remarks: `[4-Hr Patrol ${patrolTimeSlot}] ${patrolRemarks} | Mass: ${patrolMassTon} Ton`,
      depress: '',
      pressBeforeMPa: 0,
      pressAfterMPa: 0,
    };
    batchUpdateDailyMasterRecords([newRecord]);
    const updatedInventory = [...tankInventory];
    const tankIdx = updatedInventory.findIndex((t) => t.id === bay.tankNo);
    if (tankIdx !== -1) {
      updatedInventory[tankIdx].levelPercent = patrolLevelPct;
      setTankInventory(updatedInventory);
    }
    setActiveDrawerBayId(null);
    setActiveDrawerType(null);
  };

  const handleHeelModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDrawerBayId || activeDrawerType !== 'DISCONNECT') return;
    const bay = activeBays.find((b) => b.bayId === activeDrawerBayId);
    if (!bay || !bay.tankNo) return;
    const newRecord: DailyMasterRecord = {
      id: `INSP-${Date.now()}`,
      reportDate: stage1Date.split(' ')[0],
      tankNo: bay.tankNo,
      serialNo: bay.serialNo || 'UNKNOWN',
      shipment: 'N1',
      position: activeDrawerBayId,
      level: heelLevelPct,
      levelM3: parseFloat((heelLevelPct * 0.45).toFixed(1)),
      levelMmH2O: heelLevelPct * 9,
      pressureMPa: heelPressureMPa,
      tempC: heelTempC,
      battery: 100,
      remarks: `[DISCONNECT SOP] ${stage1Remarks} | Pre-vent: ${heelPreVentPressureMPa.toFixed(2)} MPa`,
      depress: '',
      pressBeforeMPa: 0,
      pressAfterMPa: 0,
    };
    batchUpdateDailyMasterRecords([newRecord]);
    const updatedInventory = [...tankInventory];
    const tankIdx = updatedInventory.findIndex((t) => t.id === bay.tankNo);
    if (tankIdx !== -1) {
      updatedInventory[tankIdx].currentZone = 'LAYDOWN_2';
      setTankInventory(updatedInventory);
    }
    unmountBay(activeDrawerBayId);
    setActiveDrawerBayId(null);
    setActiveDrawerType(null);
  };

  return (
    <div id="nias-4bay-section" className="space-y-4 animate-in fade-in duration-200">
      <div className="bg-[#0a2540] text-white px-3.5 py-2 flex items-center justify-between rounded-t border-b border-[#071a2e] shadow-xs select-none">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-xs tracking-wider uppercase text-white font-mono">
            ACTIVE BAY MOUNTED ISO TANKS (VAPORIZER RACKS 01 ~ 04)
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="bg-[#d4d0c8] text-slate-900 font-mono font-bold text-xs px-2.5 py-0.5 rounded-xs border-t border-l border-white border-b-2 border-r-2 border-slate-600 shadow-xs">
            {zoneStats.activeBaysCount} / 4 BAYS OCCUPIED
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {activeBays.map((bay) => {
          const isRunning = bay.status === 'RUNNING';
          const isConnected = !!bay.tankNo;
          const isActiveDrawer = activeDrawerBayId === bay.bayId;
          return (
            <div key={bay.bayId} className={`bg-[#e8e4dc] border-2 border-[#b0aaa0] rounded-sm p-2.5 shadow-md flex flex-col justify-between space-y-2.5 ${isActiveDrawer ? 'ring-2 ring-blue-500' : ''}`}>
              <div className="space-y-2">
                {isRunning ? (
                  <div className="bg-[#0a2540] text-white px-2.5 py-1.5 rounded-t-sm flex items-center justify-between -mx-2.5 -mt-2.5 mb-1 border-b border-[#071a2e]">
                    <span className="font-extrabold text-xs tracking-wider uppercase text-white font-mono">{bay.bayId}</span>
                    <span className="bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-xs border border-emerald-400 font-mono shadow-xs">RUNNING</span>
                  </div>
                ) : (
                  <div className="bg-[#4a5568] text-slate-200 px-2.5 py-1.5 rounded-t-sm flex items-center justify-between -mx-2.5 -mt-2.5 mb-1 border-b border-[#2d3748]">
                    <span className="font-extrabold text-xs tracking-wider uppercase text-slate-200 font-mono">{bay.bayId}</span>
                    <span className="bg-slate-600 text-slate-300 text-[11px] font-bold px-2 py-0.5 rounded-xs font-mono">STANDBY</span>
                  </div>
                )}
                {isConnected ? (
                  <div className="bg-[#f4f1ea] border border-[#b0aaa0] rounded-xs p-2 flex items-center justify-between shadow-inner">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">MOUNTED TANK</span>
                      <span className="text-[#0055aa] font-black font-mono text-sm">{bay.tankNo}</span>
                      <span className="text-xs font-mono font-bold text-slate-700">{bay.serialNo || 'SIMU-8101426'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button type="button" onClick={(e) => { e.stopPropagation(); setActiveDrawerBayId(bay.bayId === activeDrawerBayId && activeDrawerType === 'PATROL' ? null : bay.bayId); setActiveDrawerType('PATROL'); }} className={`px-2 py-0.5 font-bold text-[10px] rounded-xs border-t border-l border-white border-b-2 border-r-2 shadow-xs cursor-pointer whitespace-nowrap select-none ${activeDrawerBayId === bay.bayId && activeDrawerType === 'PATROL' ? 'bg-[#bcbaae] text-slate-900 border-slate-700' : 'bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-900 border-slate-600'}`}>LOG 4-HR</button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setActiveDrawerBayId(bay.bayId === activeDrawerBayId && activeDrawerType === 'DISCONNECT' ? null : bay.bayId); setActiveDrawerType('DISCONNECT'); }} className={`px-2 py-0.5 font-bold text-[10px] rounded-xs border-t border-l border-white border-b-2 border-r-2 shadow-xs cursor-pointer whitespace-nowrap select-none ${activeDrawerBayId === bay.bayId && activeDrawerType === 'DISCONNECT' ? 'bg-[#bcbaae] text-slate-900 border-slate-700' : 'bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-900 border-slate-600'}`}>DISCONNECT SOP</button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#f4f1ea] border border-[#b0aaa0] rounded-xs p-2 flex items-center justify-between shadow-inner min-h-[58px]">
                    <div className="flex flex-col"><span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">RACK STATUS</span><span className="text-xs font-bold text-slate-500 font-mono">EMPTY RACK</span></div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setMountModalBayId(bay.bayId); }} className="px-2.5 py-1 bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-900 font-bold text-xs rounded-xs border-t border-l border-white border-b-2 border-r-2 border-slate-600 shadow-xs cursor-pointer select-none">+ MOUNT TANK</button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="bg-white border border-slate-400 rounded-xs p-1 text-center shadow-inner flex flex-col justify-center"><span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter block truncate">HOLDING PRESS (MPa)</span><span className="font-mono font-bold text-sm text-slate-950">{isConnected ? bay.pressure.toFixed(2) : '0.00'}</span></div>
                  <div className="bg-white border border-slate-400 rounded-xs p-1 text-center shadow-inner flex flex-col justify-center"><span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter block truncate">CRYO TEMP (°C)</span><span className="font-mono font-bold text-sm text-slate-950">{isConnected ? bay.temp.toFixed(1) : '-160.0'}</span></div>
                  <div className="bg-white border border-slate-400 rounded-xs p-1 text-center shadow-inner flex flex-col justify-center"><span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter block truncate">CURRENT LEVEL (%)</span><span className="font-mono font-bold text-sm text-slate-950">{isConnected ? bay.level : '0'}</span></div>
                  <div className="bg-white border border-slate-400 rounded-xs p-1 text-center shadow-inner flex flex-col justify-center"><span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter block truncate">FLOW RATE (t/h)</span><span className="font-mono font-bold text-sm text-slate-950">{isConnected ? (bay.flowRate || (isRunning ? 1700.0 : 0.0)).toFixed(1) : '0.0'}</span></div>
                </div>
                {isConnected && (
                  <div className="space-y-1 pt-0.5">
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-700 font-mono"><span>Liquid Depletion:</span><span>{bay.level}% ({((bay.level / 100) * 45).toFixed(1)} m³)</span></div>
                    <div className="w-full bg-slate-300 h-2.5 rounded-xs border border-slate-400 overflow-hidden shadow-inner"><div className={`h-full transition-all ${bay.level > 20 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, Math.max(0, bay.level))}%` }} /></div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 pt-2 border-t border-[#c8c2b5]">
                {isRunning ? (
                  <button type="button" onClick={() => toggleBayRunning(bay.bayId)} disabled={!isConnected} className="flex-1 bg-[#c05621] hover:bg-[#dd6b20] active:bg-[#9c4215] text-white font-bold text-xs py-1.5 rounded-xs border-t border-l border-[#ed8936] border-b-2 border-r-2 border-[#7b341e] shadow-sm select-none cursor-pointer flex items-center justify-center gap-1"><span>⏸ PAUSE REGAS</span></button>
                ) : (
                  <button type="button" onClick={() => toggleBayRunning(bay.bayId)} disabled={!isConnected} className={`flex-1 font-bold text-xs py-1.5 rounded-xs border-t border-l border-b-2 border-r-2 shadow-sm select-none flex items-center justify-center gap-1 ${!isConnected ? 'bg-slate-300 text-slate-500 border-slate-400 cursor-not-allowed' : 'bg-[#2f855a] hover:bg-[#38a169] active:bg-[#22543d] text-white border-t border-l border-[#48bb78] border-b-2 border-r-2 border-[#1c4d35] cursor-pointer'}`}><span>▶ START REGAS</span></button>
                )}
                {isConnected && (
                  <button type="button" onClick={() => setSelectedChartBayId(bay.bayId === selectedChartBayId ? null : bay.bayId)} className="bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-900 font-bold text-xs px-3 py-1.5 rounded-xs border-t border-l border-white border-b-2 border-r-2 border-slate-600 shadow-xs cursor-pointer select-none"><span>📊 TREND</span></button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {selectedChartBayId && (
        <div className="bg-[#dfdbd1] border-2 border-[#8a8579] rounded-sm p-4 shadow-inner space-y-4 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-[#0a2540] text-white px-3 py-2 -m-4 mb-4 rounded-t-sm flex justify-between items-center border-b border-[#071a2e] select-none">
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white font-mono flex items-center gap-2"><span>PHYSICAL TELEMETRY SHIFTS: {selectedChartBayId}</span></h3>
              <p className="text-[11px] text-slate-300">Integrated view of residual volume, pressure, and temperature over 4-hour intervals.</p>
            </div>
            <button onClick={() => setSelectedChartBayId(null)} className="text-slate-300 hover:text-white transition-colors cursor-pointer"><XCircle className="w-5 h-5" /></button>
          </div>
          <div className="h-[380px] w-full bg-[#1e293b] p-3 rounded-xs border border-slate-600 shadow-inner">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={getMockTrendData(selectedChartBayId)} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="time" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} dy={10} />
                <YAxis yAxisId="left" orientation="left" stroke="#38bdf8" domain={[0, 25]} tick={{ fill: '#38bdf8', fontSize: 11 }} label={{ value: 'Vol (m³)', angle: -90, position: 'insideLeft', fill: '#38bdf8', dx: -10 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#34d399" domain={[0, 1.0]} tick={{ fill: '#34d399', fontSize: 11 }} label={{ value: 'Press (MPa)', angle: 90, position: 'insideRight', fill: '#34d399', dx: 15 }} />
                <YAxis yAxisId="rightOutward" orientation="right" stroke="#fb7185" domain={[-160, -100]} tick={{ fill: '#fb7185', fontSize: 11 }} dx={40} label={{ value: 'Temp (°C)', angle: 90, position: 'insideRight', fill: '#fb7185', dx: 60 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '4px', color: '#f1f5f9' }} itemStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                <Legend wrapperStyle={{ paddingTop: '15px' }} />
                <ReferenceLine y={1.0} yAxisId="left" stroke="#38bdf8" strokeDasharray="3 3" opacity={0.6} label={{ position: 'top', value: '1.0 m³ (Heel)', fill: '#38bdf8', fontSize: 10 }} />
                <ReferenceLine y={0.70} yAxisId="right" stroke="#34d399" strokeDasharray="3 3" opacity={0.6} label={{ position: 'insideBottomLeft', value: '0.70 MPa (Regas)', fill: '#34d399', fontSize: 10 }} />
                <ReferenceLine y={0.30} yAxisId="right" stroke="#34d399" strokeDasharray="3 3" opacity={0.6} label={{ position: 'insideTopLeft', value: '0.30 MPa (Disconnect)', fill: '#34d399', fontSize: 10 }} />
                <Line yAxisId="left" type="monotone" dataKey="volume" name="Residual Volume (m³)" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 1 }} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="pressure" name="Pressure (MPa)" stroke="#34d399" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 1 }} activeDot={{ r: 6 }} />
                <Line yAxisId="rightOutward" type="monotone" dataKey="temp" name="Cryo Temp (°C)" stroke="#fb7185" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 1 }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      {activeDrawerBayId && activeDrawerType === 'PATROL' && (
        <div className="bg-[#dfdbd1] border-2 border-[#8a8579] rounded-sm p-4 shadow-inner space-y-4 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-[#0a2540] text-white px-3.5 py-2 -m-4 mb-4 rounded-t-sm flex justify-between items-center border-b border-[#071a2e] select-none">
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white font-mono">ROUTINE 4-HOUR SHIFT PATROL LOG: {activeDrawerBayId}</h3>
              <p className="text-[11px] text-slate-300">Record current physical gauge measurements and operating state.</p>
            </div>
            <button onClick={() => setActiveDrawerBayId(null)} className="text-slate-300 hover:text-white transition-colors cursor-pointer"><XCircle className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handlePatrolSubmit} className="space-y-4">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {['00:00', '04:00', '08:00 (Daily Baseline)', '12:00', '16:00', '20:00'].map((slot) => {
                const isActive = patrolTimeSlot === slot;
                return (
                  <button key={slot} type="button" onClick={() => setPatrolTimeSlot(slot)} className={`px-3 py-1 text-xs font-bold font-mono rounded-xs border-t border-l border-b-2 border-r-2 shadow-xs cursor-pointer select-none transition-all ${isActive ? 'bg-[#002b4d] text-white border-blue-900' : 'bg-[#d4d0c8] hover:bg-[#e0dcd4] text-slate-900 border-white border-b-slate-600 border-r-slate-600'}`}>{slot}</button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="flex flex-col"><label className="text-[11px] font-bold text-slate-700 uppercase mb-1">LEVEL (%)</label><input type="number" step="0.1" value={patrolLevelPct} onChange={(e) => setPatrolLevelPct(parseFloat(e.target.value) || 0)} className="bg-white border-t-2 border-l-2 border-[#8a8579] border-b border-r border-white rounded-xs px-2 py-1 text-slate-950 font-bold font-mono text-sm shadow-inner" /></div>
              <div className="flex flex-col"><label className="text-[11px] font-bold text-slate-700 uppercase mb-1">VOLUME (m³)</label><input type="number" step="0.1" value={patrolVolumeM3} onChange={(e) => setPatrolVolumeM3(parseFloat(e.target.value) || 0)} className="bg-white border-t-2 border-l-2 border-[#8a8579] border-b border-r border-white rounded-xs px-2 py-1 text-slate-950 font-bold font-mono text-sm shadow-inner" /></div>
              <div className="flex flex-col"><label className="text-[11px] font-bold text-slate-700 uppercase mb-1">MASS (Ton)</label><input type="number" step="0.1" value={patrolMassTon} onChange={(e) => setPatrolMassTon(parseFloat(e.target.value) || 0)} className="bg-white border-t-2 border-l-2 border-[#8a8579] border-b border-r border-white rounded-xs px-2 py-1 text-slate-950 font-bold font-mono text-sm shadow-inner" /></div>
              <div className="flex flex-col"><label className="text-[11px] font-bold text-slate-700 uppercase mb-1">PRESSURE (MPa)</label><input type="number" step="0.01" value={patrolPressureMPa} onChange={(e) => setPatrolPressureMPa(parseFloat(e.target.value) || 0)} className="bg-white border-t-2 border-l-2 border-[#8a8579] border-b border-r border-white rounded-xs px-2 py-1 text-slate-950 font-bold font-mono text-sm shadow-inner" /></div>
              <div className="flex flex-col"><label className="text-[11px] font-bold text-slate-700 uppercase mb-1">TEMP (°C)</label><input type="number" step="0.1" value={patrolTempC} onChange={(e) => setPatrolTempC(parseFloat(e.target.value) || 0)} className="bg-white border-t-2 border-l-2 border-[#8a8579] border-b border-r border-white rounded-xs px-2 py-1 text-slate-950 font-bold font-mono text-sm shadow-inner" /></div>
            </div>
            <div className="flex flex-col"><label className="text-[11px] font-bold text-slate-700 uppercase mb-1">OPERATOR REMARKS</label><input type="text" value={patrolRemarks} onChange={(e) => setPatrolRemarks(e.target.value)} className="bg-white border-t-2 border-l-2 border-[#8a8579] border-b border-r border-white rounded-xs px-2.5 py-1.5 text-slate-950 font-semibold text-sm shadow-inner" placeholder="Optional remarks..." /></div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#c8c2b5]"><button type="submit" className="h-8 px-6 bg-[#2f855a] hover:bg-[#38a169] active:bg-[#22543d] text-white font-bold text-xs rounded-xs border-t border-l border-[#48bb78] border-b-2 border-r-2 border-[#1c4d35] shadow-xs cursor-pointer select-none">SAVE PATROL LOG</button></div>
          </form>
        </div>
      )}
      {activeDrawerBayId && activeDrawerType === 'DISCONNECT' && (
        <div className="bg-[#dfdbd1] border-2 border-[#8a8579] rounded-sm p-4 shadow-inner space-y-4 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-[#0a2540] text-white px-3.5 py-2 -m-4 mb-4 rounded-t-sm flex justify-between items-center border-b border-[#071a2e] select-none">
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white font-mono">PRE-DISCONNECT SOP SETTLEMENT: {activeDrawerBayId}</h3>
              <p className="text-[11px] text-slate-300">Log final offload metrics and safely unmount the tank to Laydown Yard 2.</p>
            </div>
            <button onClick={() => setActiveDrawerBayId(null)} className="text-slate-300 hover:text-white transition-colors cursor-pointer"><XCircle className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleHeelModalSubmit} className="space-y-4">
            <div className="bg-[#f4f1ea] border border-[#b0aaa0] rounded-xs p-3 flex items-center justify-between shadow-inner"><span className="text-xs font-bold text-slate-700 uppercase">TARGET DESTINATION</span><span className="font-bold text-sm text-[#002b4d] font-mono">LAYDOWN YARD 2 (ORU LD-2)</span></div>
            <div className="bg-white border border-[#b0aaa0] rounded-xs overflow-hidden shadow-inner">
              <div className="grid grid-cols-12 bg-[#4e5d6e] text-white p-2.5 text-[11px] font-extrabold uppercase tracking-wider border-b border-[#8b9aa8]">
                <div className="col-span-4 pl-2">Inspection Parameter</div>
                <div className="col-span-4">SOP Target Baseline</div>
                <div className="col-span-4">Actual Input</div>
              </div>
              <div className="divide-y divide-slate-200">
                <div className="grid grid-cols-12 p-3 items-center text-xs">
                  <div className="col-span-4 pl-2 font-bold text-slate-900">Residual Heel Level</div>
                  <div className="col-span-4 font-mono font-semibold text-slate-700">1.0 m³ (~4.0% / ~400 kg)</div>
                  <div className="col-span-4 flex items-center gap-1"><input type="number" step="0.1" value={heelLevelPct} onChange={(e) => setHeelLevelPct(parseFloat(e.target.value) || 0)} className="w-24 bg-white border-t-2 border-l-2 border-[#8a8579] border-b border-r border-white rounded-xs px-2 py-1 text-slate-950 font-bold font-mono text-sm shadow-inner" /><span className="text-slate-700 font-bold">%</span></div>
                </div>
                <div className="grid grid-cols-12 p-3 items-center text-xs">
                  <div className="col-span-4 pl-2 font-bold text-slate-900">Pre-Venting Pressure</div>
                  <div className="col-span-4 font-mono font-semibold text-slate-700">0.70 MPa (7.0 bar)</div>
                  <div className="col-span-4 flex items-center gap-1"><input type="number" step="0.01" value={heelPreVentPressureMPa} onChange={(e) => setHeelPreVentPressureMPa(parseFloat(e.target.value) || 0)} className="w-24 bg-white border-t-2 border-l-2 border-[#8a8579] border-b border-r border-white rounded-xs px-2 py-1 text-slate-950 font-bold font-mono text-sm shadow-inner" /><span className="text-slate-700 font-bold">MPa</span></div>
                </div>
                <div className="grid grid-cols-12 p-3 items-center text-xs">
                  <div className="col-span-4 pl-2 font-bold text-slate-900">Post-Venting Disconnect Pressure</div>
                  <div className="col-span-4 font-mono font-semibold text-slate-700">0.30 MPa (3.0 bar)</div>
                  <div className="col-span-4 flex items-center gap-2">
                    <input type="number" step="0.01" value={heelPressureMPa} onChange={(e) => setHeelPressureMPa(parseFloat(e.target.value) || 0)} className="w-24 bg-white border-t-2 border-l-2 border-[#8a8579] border-b border-r border-white rounded-xs px-2 py-1 text-slate-950 font-bold font-mono text-sm shadow-inner" />
                    <span className="text-slate-700 font-bold">MPa</span>
                    {heelPressureMPa <= 0.30 ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-xs bg-emerald-100 text-emerald-800 border border-emerald-300">✓ SAFE</span> : <span className="text-[10px] font-bold px-2 py-0.5 rounded-xs bg-amber-100 text-amber-800 border border-amber-300">⚠ HIGH</span>}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col"><label className="text-[11px] font-bold text-slate-700 uppercase mb-1">OPERATOR REMARKS</label><textarea value={stage1Remarks} onChange={(e) => setStage1Remarks(e.target.value)} rows={2} className="w-full bg-white border-t-2 border-l-2 border-[#8a8579] border-b border-r border-white rounded-xs p-2 text-slate-950 font-semibold text-sm shadow-inner resize-none" /></div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#c8c2b5]"><button type="submit" className="h-8 px-6 bg-[#002b4d] hover:bg-[#003e70] active:bg-[#001f38] text-white font-bold text-xs rounded-xs border-t border-l border-blue-400 border-b-2 border-r-2 border-blue-950 shadow-xs cursor-pointer select-none">LOG DISCONNECT SOP &amp; UNMOUNT</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
