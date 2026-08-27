import React, { useState } from 'react';
import { ActiveBayState, DailyMasterRecord } from '@/types/lng';
import { NiasTankAsset } from '../NiasTerminalView';
import { usePortalData } from '@/context/PortalDataContext';
import { Flame, Activity, Thermometer, Droplet, ArrowRightCircle, Play, Square, PlusCircle, Edit3, Zap, XCircle, RotateCcw, MapPin, BarChart3 } from 'lucide-react';
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

  // Generate Dummy Data for Trend Chart
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

  // Patrol State
  const [patrolTimeSlot, setPatrolTimeSlot] = useState<string>('08:00');
  const [patrolLevelPct, setPatrolLevelPct] = useState<number>(45);
  const [patrolLevelMmH2O, setPatrolLevelMmH2O] = useState<number>(410);
  const [patrolVolumeM3, setPatrolVolumeM3] = useState<number>(20.3);
  const [patrolMassTon, setPatrolMassTon] = useState<number>(9.5);
  const [patrolPressureMPa, setPatrolPressureMPa] = useState<number>(0.65);
  const [patrolTempC, setPatrolTempC] = useState<number>(-129.5);
  const [patrolRemarks, setPatrolRemarks] = useState<string>('');

  // Heel Disconnect (Stage 1) State
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
    const tankNo = bay.tankNo;

    const newRecord: DailyMasterRecord = {
      id: `PATROL-${Date.now()}`,
      reportDate: new Date().toISOString().slice(0, 10),
      tankNo,
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
    
    // Update live telemetry in inventory
    const updatedInventory = [...tankInventory];
    const tankIdx = updatedInventory.findIndex((t) => t.id === tankNo);
    if (tankIdx !== -1) {
      updatedInventory[tankIdx].levelPercent = patrolLevelPct;
      updatedInventory[tankIdx].levelM3 = patrolVolumeM3;
      updatedInventory[tankIdx].levelMmH2O = patrolLevelMmH2O;
      updatedInventory[tankIdx].pressureMpa = patrolPressureMPa;
      updatedInventory[tankIdx].tempC = patrolTempC;
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
    
    const tankNo = bay.tankNo;
    
    const newRecord: DailyMasterRecord = {
      id: `INSP-${Date.now()}`,
      reportDate: stage1Date.split(' ')[0],
      tankNo,
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
    
    // Unmount from bay slot and transition to LAYDOWN_2
    const updatedInventory = [...tankInventory];
    const tankIdx = updatedInventory.findIndex((t) => t.id === tankNo);
    if (tankIdx !== -1) {
      updatedInventory[tankIdx].currentZone = 'LAYDOWN_2';
      updatedInventory[tankIdx].levelPercent = heelLevelPct;
      updatedInventory[tankIdx].pressureMpa = heelPressureMPa;
      updatedInventory[tankIdx].tempC = heelTempC;
      setTankInventory(updatedInventory);
    }
    
    unmountBay(activeDrawerBayId);
    setActiveDrawerBayId(null);
    setActiveDrawerType(null);
  };

  return (
    <div id="nias-4bay-section" className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white shadow-none/80 border border-slate-200 rounded-none p-4 sm:p-5">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-950 font-bold flex items-center gap-2">
            <Flame className="w-4 h-4 text-slate-950 font-bold" />
            Active Bay Mounted ISO Tanks (Vaporizer Racks 01 ~ 04)
          </h3>
          <p className="text-xs text-slate-950 font-bold">
            Clean, focused view of vessels actively mounted on the 4 vaporization racks supplying PLTMG Gunungsitoli
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-none bg-blue-950/60 text-slate-950 font-bold border border-blue-800/60">
            {zoneStats.activeBaysCount} / 4 Bays Occupied
          </span>
        </div>
      </div>

      {/* 4-Bay Dedicated Mounted Tank Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {activeBays.map((bay) => {
          const isRunning = bay.status === 'RUNNING';
          const isStandby = bay.status === 'STANDBY';
          const isConnected = !!bay.tankNo;
          const isActiveDrawer = activeDrawerBayId === bay.bayId;

          return (
            <div
              key={bay.bayId}
              className={`p-5 rounded-none border transition-all duration-200 flex flex-col justify-between space-y-4 ${
                isConnected ? 'cursor-pointer hover:ring-1 hover:ring-blue-500/50' : ''
              } ${
                isActiveDrawer
                  ? 'bg-white shadow-none border-purple-500/80 shadow-[0_0_30px_rgba(168,85,247,0.2)] ring-1 ring-purple-500/50'
                  : isRunning
                  ? 'bg-white shadow-none border-blue-500/60 shadow-[0_0_25px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/30'
                  : isStandby
                  ? 'bg-white shadow-none/70 border-blue-500/40'
                  : 'bg-white shadow-none/40 border-slate-200'
              }`}
            >
              <div>
                {/* Bay ID & Status */}
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Flame className={`w-4 h-4 ${isRunning ? 'text-slate-950 font-bold animate-pulse' : 'text-slate-950 font-bold'}`} />
                    <span className="font-bold text-base text-slate-950 font-bold">{bay.bayId}</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-none border ${
                      isRunning
                        ? 'bg-amber-500/20 text-white font-bold border-amber-200 animate-pulse'
                        : isStandby
                        ? 'bg-blue-500/20 text-white font-bold border-blue-200'
                        : 'bg-slate-100 text-slate-950 font-bold border-slate-200'
                    }`}
                  >
                    {bay.status}
                  </span>
                </div>

                {/* Mounted Vessel Information */}
                <div className="win-panel/80 border border-slate-200/90 rounded-none p-3.5 mb-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-950 font-bold uppercase tracking-wider font-bold block">
                      Mounted ISO Tank
                    </span>
                    <span className="font-mono font-bold text-base text-slate-950 font-bold">
                      {bay.tankNo || 'Empty Rack'}
                    </span>
                    {bay.serialNo && (
                      <span className="text-[10px] text-slate-950 font-bold font-mono block">{bay.serialNo}</span>
                    )}
                  </div>
                  {isConnected ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDrawerBayId(bay.bayId === activeDrawerBayId && activeDrawerType === 'PATROL' ? null : bay.bayId);
                          setActiveDrawerType('PATROL');
                        }}
                        className={`px-2 py-1.5 rounded-none text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap border ${
                          activeDrawerBayId === bay.bayId && activeDrawerType === 'PATROL'
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-blue-600/20 hover:bg-blue-600/40 text-white font-bold border-blue-500/40'
                        }`}
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>📝 Log 4-Hr</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDrawerBayId(bay.bayId === activeDrawerBayId && activeDrawerType === 'DISCONNECT' ? null : bay.bayId);
                          setActiveDrawerType('DISCONNECT');
                        }}
                        className={`px-2 py-1.5 rounded-none text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap border ${
                          activeDrawerBayId === bay.bayId && activeDrawerType === 'DISCONNECT'
                            ? 'bg-purple-600 text-slate-950 border-purple-500'
                            : 'bg-purple-600/20 hover:bg-purple-600/40 text-slate-950 font-bold border-purple-500/40'
                        }`}
                      >
                        <Zap className="w-3 h-3" />
                        <span>⚡ Disconnect SOP</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMountModalBayId(bay.bayId);
                      }}
                      className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/40 text-white font-bold rounded-none text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Mount
                    </button>
                  )}
                </div>

                {/* Vessel Telemetry Metrics */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="win-panel/60 p-2.5 rounded-none border border-slate-200 flex flex-col items-center">
                    <Activity className="w-3.5 h-3.5 text-slate-950 font-bold mb-1" />
                    <span className="text-[10px] uppercase text-slate-950 font-bold font-bold">Holding Press</span>
                    <span className="font-mono font-bold text-sm text-slate-950 font-bold">
                      {bay.pressure.toFixed(2)} MPa
                    </span>
                  </div>
                  <div className="win-panel/60 p-2.5 rounded-none border border-slate-200 flex flex-col items-center">
                    <Thermometer className="w-3.5 h-3.5 text-slate-950 font-bold mb-1" />
                    <span className="text-[10px] uppercase text-slate-950 font-bold font-bold">Cryo Temp</span>
                    <span className="font-mono font-bold text-sm text-slate-950 font-bold">
                      {bay.temp.toFixed(1)}°C
                    </span>
                  </div>
                  <div className="win-panel/60 p-2.5 rounded-none border border-slate-200 flex flex-col items-center">
                    <Droplet className="w-3.5 h-3.5 text-slate-950 font-bold mb-1" />
                    <span className="text-[10px] uppercase text-slate-950 font-bold font-bold">Current Level</span>
                    <span className="font-mono font-bold text-sm text-slate-950 font-bold">{bay.level}%</span>
                  </div>
                  <div className="win-panel/60 p-2.5 rounded-none border border-slate-200 flex flex-col items-center">
                    <ArrowRightCircle className="w-3.5 h-3.5 text-slate-950 font-bold mb-1" />
                    <span className="text-[10px] uppercase text-slate-950 font-bold font-bold">Flow Rate</span>
                    <span className="font-mono font-bold text-sm text-slate-950 font-bold">
                      {bay.flowRate.toFixed(1)} t/h
                    </span>
                  </div>
                </div>

                {/* Fill Level Gauge */}
                {isConnected && (
                  <div>
                    <div className="flex justify-between items-center text-[10px] text-slate-950 font-bold mb-1 font-mono">
                      <span>Liquid Depletion</span>
                      <span>{bay.level}% ({((bay.level / 100) * 45).toFixed(1)} m³)</span>
                    </div>
                    <div className="w-full h-2 win-panel rounded-none overflow-hidden border border-slate-200">
                      <div
                        className={`h-full rounded-none transition-all ${
                          bay.level > 20
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                            : 'bg-gradient-to-r from-amber-500 to-red-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, bay.level))}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex gap-2 pt-2 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => toggleBayRunning(bay.bayId)}
                  disabled={!isConnected}
                  className={`flex-1 py-2 rounded-none text-xs font-bold flex justify-center items-center gap-1.5 transition-all ${
                    !isConnected
                      ? 'bg-slate-100 text-slate-950 font-bold cursor-not-allowed'
                      : isRunning
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-none shadow-amber-600/20 cursor-pointer'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-none shadow-emerald-600/20 cursor-pointer'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <Square className="w-3.5 h-3.5" /> Pause Regas
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" /> Start Regas
                    </>
                  )}
                </button>
                {isConnected && (
                  <button
                    type="button"
                    onClick={() => setSelectedChartBayId(bay.bayId === selectedChartBayId ? null : bay.bayId)}
                    className={`flex-1 py-2 rounded-none text-xs font-bold flex justify-center items-center gap-1.5 transition-all cursor-pointer ${
                      selectedChartBayId === bay.bayId
                        ? 'bg-indigo-600 text-slate-950 border-indigo-500 shadow-none shadow-indigo-600/20'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-900/60 text-slate-950 font-bold border border-indigo-900/50'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    Trend
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CHART DOMAIN: IN-LINE MULTI-AXIS TREND CHART */}
      {selectedChartBayId && (
        <div className="bg-white shadow-none border border-indigo-200 rounded-none p-6 shadow-none animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex justify-between items-start mb-6 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-950 font-bold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-slate-950 font-bold" />
                Physical Telemetry Shifts: {selectedChartBayId}
              </h3>
              <p className="text-sm text-slate-950 font-bold mt-1">
                Integrated view of residual volume, pressure, and temperature over 4-hour intervals.
              </p>
            </div>
            <button
              onClick={() => setSelectedChartBayId(null)}
              className="text-slate-950 font-bold hover:text-slate-950 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
          
          <div className="h-[400px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={getMockTrendData(selectedChartBayId)}
                margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#94a3b8" 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  dy={10} 
                />
                <YAxis 
                  yAxisId="left" 
                  orientation="left" 
                  stroke="#38bdf8" 
                  domain={[0, 25]} 
                  tick={{ fill: '#38bdf8', fontSize: 12 }} 
                  label={{ value: 'Vol (m³)', angle: -90, position: 'insideLeft', fill: '#38bdf8', dx: -10 }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#34d399" 
                  domain={[0, 1.0]} 
                  tick={{ fill: '#34d399', fontSize: 12 }} 
                  label={{ value: 'Press (MPa)', angle: 90, position: 'insideRight', fill: '#34d399', dx: 15 }}
                />
                <YAxis 
                  yAxisId="rightOutward" 
                  orientation="right" 
                  stroke="#fb7185" 
                  domain={[-160, -100]} 
                  tick={{ fill: '#fb7185', fontSize: 12 }} 
                  dx={40} // Shift it outward
                  label={{ value: 'Temp (°C)', angle: 90, position: 'insideRight', fill: '#fb7185', dx: 60 }}
                />
                
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f1f5f9' }}
                  itemStyle={{ fontSize: '14px', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                
                {/* Reference Lines */}
                <ReferenceLine y={1.0} yAxisId="left" stroke="#38bdf8" strokeDasharray="3 3" opacity={0.5} label={{ position: 'top', value: '1.0 m³ (Heel)', fill: '#38bdf8', fontSize: 11 }} />
                <ReferenceLine y={0.70} yAxisId="right" stroke="#34d399" strokeDasharray="3 3" opacity={0.5} label={{ position: 'insideBottomLeft', value: '0.70 MPa (Regas)', fill: '#34d399', fontSize: 11 }} />
                <ReferenceLine y={0.30} yAxisId="right" stroke="#34d399" strokeDasharray="3 3" opacity={0.5} label={{ position: 'insideTopLeft', value: '0.30 MPa (Disconnect)', fill: '#34d399', fontSize: 11 }} />

                {/* Data Lines */}
                <Line yAxisId="left" type="monotone" dataKey="volume" name="Residual Volume (m³)" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="pressure" name="Pressure (MPa)" stroke="#34d399" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line yAxisId="rightOutward" type="monotone" dataKey="temp" name="Cryo Temp (°C)" stroke="#fb7185" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* IN-LINE FULL WIDTH DRAWERS */}
      {activeDrawerBayId && activeDrawerType === 'PATROL' && (
        <div className="bg-white shadow-none border border-blue-500/50 rounded-none p-6 shadow-none animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex justify-between items-start mb-6 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-950 font-bold flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-slate-950 font-bold" />
                Routine 4-Hour Shift Patrol Log for {activeDrawerBayId}
              </h3>
              <p className="text-sm text-slate-950 font-bold mt-1">
                Record current physical gauges and state.
              </p>
            </div>
            <button
              onClick={() => setActiveDrawerBayId(null)}
              className="text-slate-950 font-bold hover:text-slate-950 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handlePatrolSubmit} className="space-y-6">
            <div className="flex flex-wrap gap-2 mb-6">
              {['00:00', '04:00', '08:00 (Daily Baseline)', '12:00', '16:00', '20:00'].map((slot) => {
                const isActive = patrolTimeSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setPatrolTimeSlot(slot)}
                    className={`px-4 py-2 rounded-none text-xs font-bold border transition-colors ${
                      isActive ? 'bg-blue-600/20 text-white font-bold border-blue-500/50' : 'win-panel border-slate-200 text-slate-950 font-bold hover:border-slate-200'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="flex flex-col">
                <label className="text-xs text-slate-950 font-bold mb-1">Level (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={patrolLevelPct}
                  onChange={(e) => setPatrolLevelPct(parseFloat(e.target.value))}
                  className="win-panel border border-slate-200 rounded-none px-1.5 py-0.5 text-slate-950 font-bold font-mono"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-slate-950 font-bold mb-1">Volume (m³)</label>
                <input
                  type="number"
                  step="0.1"
                  value={patrolVolumeM3}
                  onChange={(e) => setPatrolVolumeM3(parseFloat(e.target.value))}
                  className="win-panel border border-slate-200 rounded-none px-1.5 py-0.5 text-slate-950 font-bold font-mono"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-slate-950 font-bold mb-1">Mass (Ton)</label>
                <input
                  type="number"
                  step="0.1"
                  value={patrolMassTon}
                  onChange={(e) => setPatrolMassTon(parseFloat(e.target.value))}
                  className="win-panel border border-slate-200 rounded-none px-1.5 py-0.5 text-slate-950 font-bold font-mono"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-slate-950 font-bold mb-1">Pressure (MPa)</label>
                <input
                  type="number"
                  step="0.01"
                  value={patrolPressureMPa}
                  onChange={(e) => setPatrolPressureMPa(parseFloat(e.target.value))}
                  className="win-panel border border-slate-200 rounded-none px-1.5 py-0.5 text-slate-950 font-bold font-mono"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-slate-950 font-bold mb-1">Temp (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={patrolTempC}
                  onChange={(e) => setPatrolTempC(parseFloat(e.target.value))}
                  className="win-panel border border-slate-200 rounded-none px-1.5 py-0.5 text-slate-950 font-bold font-mono"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-slate-950 font-bold mb-1">Remarks</label>
              <input
                type="text"
                value={patrolRemarks}
                onChange={(e) => setPatrolRemarks(e.target.value)}
                className="win-panel border border-slate-200 rounded-none px-1.5 py-0.5 text-slate-950 font-bold"
                placeholder="Optional remarks..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-none font-bold shadow-none shadow-blue-900/50 transition-all cursor-pointer"
              >
                Save Patrol Log
              </button>
            </div>
          </form>
        </div>
      )}

      {activeDrawerBayId && activeDrawerType === 'DISCONNECT' && (
        <div className="bg-white shadow-none border border-purple-500/50 rounded-none p-6 shadow-none animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex justify-between items-start mb-6 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-950 font-bold flex items-center gap-2">
                <Zap className="w-5 h-5 text-slate-950 font-bold" />
                Pre-Disconnect SOP Settlement for {activeDrawerBayId}
              </h3>
              <p className="text-sm text-slate-950 font-bold mt-1">
                Log final offload metrics and safely unmount the tank to Laydown Yard 2.
              </p>
            </div>
            <button
              onClick={() => setActiveDrawerBayId(null)}
              className="text-slate-950 font-bold hover:text-slate-950 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleHeelModalSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 win-panel/50 rounded-none border border-slate-200">
                <span className="text-xs text-slate-950 font-bold font-bold block">Target Destination</span>
                <span className="font-bold text-slate-950 font-bold">Laydown Yard 2</span>
              </div>
            </div>

            <div className="win-panel rounded-none border border-slate-200 overflow-hidden">
              <div className="grid grid-cols-12 bg-white shadow-none border-b border-slate-200 p-3 text-xs font-bold text-slate-950 font-bold uppercase tracking-wider">
                <div className="col-span-4 pl-2">Inspection Parameter</div>
                <div className="col-span-4">SOP Target Baseline</div>
                <div className="col-span-4">Actual Input</div>
              </div>
              <div className="divide-y divide-slate-800/60">
                {/* Row 1: Residual Heel Level */}
                <div className="grid grid-cols-12 p-4 items-center">
                  <div className="col-span-4 pl-2 font-bold text-sm text-slate-950 font-bold">Residual Heel Level</div>
                  <div className="col-span-4 font-mono text-sm text-slate-950 font-bold">1.0 m³ (~4.0% / ~400 kg)</div>
                  <div className="col-span-4">
                    <input
                      type="number"
                      step="0.1"
                      value={heelLevelPct}
                      onChange={(e) => setHeelLevelPct(parseFloat(e.target.value))}
                      className="w-24 bg-white shadow-none border border-slate-200 rounded-none px-3 py-1.5 text-slate-950 font-bold font-mono font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                    <span className="ml-2 text-slate-950 font-bold text-xs">%</span>
                  </div>
                </div>

                {/* Row 2: Pre-Venting Pressure */}
                <div className="grid grid-cols-12 p-4 items-center">
                  <div className="col-span-4 pl-2 font-bold text-sm text-slate-950 font-bold">Pre-Venting Pressure</div>
                  <div className="col-span-4 font-mono text-sm text-slate-950 font-bold">0.70 MPa (7.0 bar)</div>
                  <div className="col-span-4">
                    <input
                      type="number"
                      step="0.01"
                      value={heelPreVentPressureMPa}
                      onChange={(e) => setHeelPreVentPressureMPa(parseFloat(e.target.value))}
                      className="w-24 bg-white shadow-none border border-slate-200 rounded-none px-3 py-1.5 text-slate-950 font-bold font-mono font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                    <span className="ml-2 text-slate-950 font-bold text-xs">MPa</span>
                  </div>
                </div>

                {/* Row 3: Disconnect Pressure */}
                <div className="grid grid-cols-12 p-4 items-center">
                  <div className="col-span-4 pl-2 font-bold text-sm text-slate-950 font-bold">Post-Venting Disconnect Pressure</div>
                  <div className="col-span-4 font-mono text-sm text-slate-950 font-bold">0.30 MPa (3.0 bar)</div>
                  <div className="col-span-4 flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={heelPressureMPa}
                      onChange={(e) => setHeelPressureMPa(parseFloat(e.target.value))}
                      className="w-24 bg-white shadow-none border border-slate-200 rounded-none px-3 py-1.5 text-slate-950 font-bold font-mono font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                    <span className="text-slate-950 font-bold text-xs">MPa</span>
                    {heelPressureMPa <= 0.30 ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-slate-950 font-bold border border-emerald-900">
                        ✓ Safe
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-slate-950 font-bold border border-amber-900">
                        ⚠️ High
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-950 font-bold uppercase tracking-wider mb-2">Operator Remarks</label>
              <textarea
                value={stage1Remarks}
                onChange={(e) => setStage1Remarks(e.target.value)}
                className="flex-1 w-full win-panel border border-slate-200 rounded-none p-3 text-slate-950 font-bold text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="submit"
                className="px-8 py-2.5 bg-purple-600 hover:bg-purple-500 text-slate-950 rounded-none font-bold shadow-none shadow-purple-900/50 transition-all cursor-pointer"
              >
                Log Disconnect SOP & Unmount
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
