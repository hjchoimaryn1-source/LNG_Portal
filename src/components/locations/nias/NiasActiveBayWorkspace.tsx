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

  // Helper to format bay/rack names to T-201, T-202, T-203, T-204
  const formatBayName = (id?: string | null): string => {
    if (!id) return '';
    const clean = id.toUpperCase().replace(/\s+|-/g, '');
    if (clean.includes('01') || clean.endsWith('1') || clean.includes('T201')) return 'T-201';
    if (clean.includes('02') || clean.endsWith('2') || clean.includes('T202') || clean.includes('T0202')) return 'T-202';
    if (clean.includes('03') || clean.endsWith('3') || clean.includes('T203')) return 'T-203';
    if (clean.includes('04') || clean.endsWith('4') || clean.includes('T204')) return 'T-204';
    return id;
  };

  // Close modals on ESC key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedChartBayId) setSelectedChartBayId(null);
        if (activeDrawerType === 'DISCONNECT') {
          setActiveDrawerBayId(null);
          setActiveDrawerType(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedChartBayId, activeDrawerType]);

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

  // 4-Hour Patrol 2-Row Matrix Form State
  const [patrolTimeSlot, setPatrolTimeSlot] = useState<string>('08:00');
  
  // Row 1: ISO Tank Measurements
  const [patrolLevelMmH2O, setPatrolLevelMmH2O] = useState<number>(465);
  const [patrolAnalogPress, setPatrolAnalogPress] = useState<number>(0.65);
  const [patrolSmtPress, setPatrolSmtPress] = useState<number>(0.65);
  const [patrolSmtLevel, setPatrolSmtLevel] = useState<number>(49.0);
  const [patrolSmtTemp, setPatrolSmtTemp] = useState<number>(-126.5);

  // Row 2: Skid LNG Inlet & Safety Patrol
  const [patrolInletPress, setPatrolInletPress] = useState<number>(0.00);
  const [patrolInletTemp, setPatrolInletTemp] = useState<number>(-160.0);
  const [patrolFlowRate, setPatrolFlowRate] = useState<number>(1700.0);
  const [patrolIcingState, setPatrolIcingState] = useState<'NORMAL' | 'MODERATE' | 'SEVERE'>('NORMAL');
  const [patrolGasLeak, setPatrolGasLeak] = useState<string>('0 ppm (NORMAL)');
  const [patrolInspector, setPatrolInspector] = useState<string>('FIELD OP-1');
  const [patrolRemarks, setPatrolRemarks] = useState<string>('Routine 4-hr shift inspection normal');

  // Auto-calculated fields based on 950 mmH2O = 44.0 m3 max volume & 441.0 kg/m3 density
  const patrolCalcVol = parseFloat(((patrolLevelMmH2O / 950) * 44.0).toFixed(1));
  const patrolCalcMass = parseFloat(((patrolCalcVol * 441.0) / 1000).toFixed(2));

  // Disconnect SOP Form State
  const [stage1Date, setStage1Date] = useState<string>(() => new Date().toISOString().slice(0, 16).replace('T', ' '));
  const [heelLevelPct, setHeelLevelPct] = useState<number>(4.0);
  const [heelPreVentPressureMPa, setHeelPreVentPressureMPa] = useState<number>(0.70);
  const [heelPressureMPa, setHeelPressureMPa] = useState<number>(0.30);
  const [heelTempC, setHeelTempC] = useState<number>(-135.0);
  const [stage1Remarks, setStage1Remarks] = useState<string>('Normal post-regas offload to Laydown 2');

  const handlePatrolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDrawerBayId || activeDrawerType !== 'PATROL') return;
    const bay = activeBays.find((b) => b.bayId === activeDrawerBayId);
    if (!bay || !bay.tankNo) return;
    const calcVol = parseFloat(((patrolLevelMmH2O / 950) * 44.0).toFixed(1));
    const calcPct = parseFloat(((patrolLevelMmH2O / 950) * 100).toFixed(1));
    const calcMass = parseFloat(((calcVol * 441.0) / 1000).toFixed(2));
    const newRecord: DailyMasterRecord = {
      id: `PATROL-${Date.now()}`,
      reportDate: new Date().toISOString().slice(0, 10),
      tankNo: bay.tankNo,
      serialNo: bay.serialNo || 'UNKNOWN',
      shipment: 'N1',
      position: activeDrawerBayId,
      level: calcPct,
      levelM3: calcVol,
      levelMmH2O: patrolLevelMmH2O,
      pressureMPa: patrolAnalogPress,
      tempC: patrolSmtTemp,
      battery: 100,
      remarks: `[4-Hr Patrol ${patrolTimeSlot}] ${patrolRemarks} | Mass: ${calcMass} Ton | SMT: ${patrolSmtPress.toFixed(2)}MPa, ${patrolSmtLevel.toFixed(1)}%, ${patrolSmtTemp.toFixed(1)}°C | Inlet: ${patrolInletPress.toFixed(2)}MPa, ${patrolInletTemp.toFixed(1)}°C | Flow: ${patrolFlowRate}t/h | Icing: ${patrolIcingState} | Leak: ${patrolGasLeak} | Insp: ${patrolInspector}`,
      depress: '',
      pressBeforeMPa: 0,
      pressAfterMPa: 0,
    };
    batchUpdateDailyMasterRecords([newRecord]);
    const updatedInventory = [...tankInventory];
    const tankIdx = updatedInventory.findIndex((t) => t.id === bay.tankNo);
    if (tankIdx !== -1) {
      updatedInventory[tankIdx].levelPercent = calcPct;
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
      remarks: `[HEEL SETTLEMENT] ${stage1Remarks} | Pre-vent: ${heelPreVentPressureMPa.toFixed(2)} MPa`,
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
    <div id="nias-4bay-section" className="space-y-4 animate-in fade-in duration-200 font-mono">
      {/* SECTION TOP HEADER */}
      <div className="bg-[#0a2540] text-white px-3.5 py-2 flex items-center justify-between rounded-t border-b border-[#071a2e] shadow-xs select-none">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-xs tracking-wider uppercase text-white font-mono">
            ISO TANK - SKID
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="bg-[#d4d0c8] text-slate-900 font-mono font-bold text-xs px-2.5 py-0.5 rounded-xs border-t border-l border-white border-b-2 border-r-2 border-slate-600 shadow-xs">
            {zoneStats.activeBaysCount} / 4 SKIDS OCCUPIED
          </span>
        </div>
      </div>

      {/* 4 SKID CARDS GRID (T-201 ~ T-204) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {activeBays.map((bay) => {
          const isRunning = bay.status === 'RUNNING';
          const isConnected = !!bay.tankNo;
          const isActiveDrawer = activeDrawerBayId === bay.bayId;
          const formattedBayId = formatBayName(bay.bayId);

          return (
            <div key={bay.bayId} className={`bg-[#e8e4dc] border-2 border-[#b0aaa0] rounded-sm p-2.5 shadow-md flex flex-col justify-between space-y-2.5 ${isActiveDrawer ? 'ring-2 ring-blue-500' : ''}`}>
              <div className="space-y-2">
                {/* Skid Header with T-201, T-202, T-203, T-204 */}
                {isRunning ? (
                  <div className="bg-[#0a2540] text-white px-2.5 py-1.5 rounded-t-sm flex items-center justify-between -mx-2.5 -mt-2.5 mb-1 border-b border-[#071a2e]">
                    <span className="font-extrabold text-xs tracking-wider uppercase text-white font-mono">{formattedBayId}</span>
                    <span className="bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-xs border border-emerald-400 font-mono shadow-xs">RUNNING</span>
                  </div>
                ) : (
                  <div className="bg-[#4a5568] text-slate-200 px-2.5 py-1.5 rounded-t-sm flex items-center justify-between -mx-2.5 -mt-2.5 mb-1 border-b border-[#2d3748]">
                    <span className="font-extrabold text-xs tracking-wider uppercase text-slate-200 font-mono">{formattedBayId}</span>
                    <span className="bg-slate-600 text-slate-300 text-[11px] font-bold px-2 py-0.5 rounded-xs font-mono">STANDBY</span>
                  </div>
                )}

                {/* Skid Main Tank Display (Center Aligned, Large ISOT-xxx, Serial below, no 'Mounted Tank' label) */}
                {isConnected ? (
                  <div className="bg-[#f4f1ea] border border-[#b0aaa0] rounded-xs p-2.5 flex flex-col items-center justify-center shadow-inner space-y-1.5">
                    <div className="flex flex-col items-center justify-center text-center">
                      <span className="text-[#0055aa] font-black font-mono text-base sm:text-lg tracking-wide leading-tight">{bay.tankNo}</span>
                      <span className="text-xs font-mono font-bold text-slate-700 tracking-tight">{bay.serialNo || 'SIMU-8101426'}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 w-full pt-1 border-t border-[#d8d3c8]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (activeDrawerBayId === bay.bayId && activeDrawerType === 'PATROL') {
                            setActiveDrawerBayId(null);
                            setActiveDrawerType(null);
                          } else {
                            setActiveDrawerBayId(bay.bayId);
                            setActiveDrawerType('PATROL');
                            const mm = bay.level ? Math.round((bay.level / 100) * 950) : 465;
                            setPatrolLevelMmH2O(mm);
                            setPatrolAnalogPress(bay.pressure || 0.65);
                            setPatrolSmtPress(bay.pressure || 0.65);
                            setPatrolSmtLevel(bay.level || 49.0);
                            setPatrolSmtTemp(bay.temp || -126.5);
                            setPatrolInletPress(0.00);
                            setPatrolInletTemp(-160.0);
                            setPatrolFlowRate(bay.flowRate || (bay.status === 'RUNNING' ? 1700.0 : 0.0));
                            setPatrolIcingState('NORMAL');
                            setPatrolGasLeak('0 ppm (NORMAL)');
                            setPatrolInspector('FIELD OP-1');
                            setPatrolRemarks('Routine 4-hr shift inspection normal');
                          }
                        }}
                        className={`flex-1 py-0.5 font-bold text-[10px] rounded-xs border-t border-l border-white border-b-2 border-r-2 shadow-xs cursor-pointer whitespace-nowrap select-none text-center ${activeDrawerBayId === bay.bayId && activeDrawerType === 'PATROL' ? 'bg-[#bcbaae] text-slate-900 border-slate-700' : 'bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-900 border-slate-600'}`}
                      >
                        LOG 4-HR
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDrawerBayId(bay.bayId);
                          setActiveDrawerType('DISCONNECT');
                          setHeelLevelPct(4.0);
                          setHeelPreVentPressureMPa(0.70);
                          setHeelPressureMPa(0.30);
                          setHeelTempC(-135.0);
                          setStage1Remarks('Normal post-regas offload to Laydown 2');
                        }}
                        className={`flex-1 py-0.5 font-bold text-[10px] rounded-xs border-t border-l border-white border-b-2 border-r-2 shadow-xs cursor-pointer whitespace-nowrap select-none text-center ${activeDrawerBayId === bay.bayId && activeDrawerType === 'DISCONNECT' ? 'bg-[#bcbaae] text-slate-900 border-slate-700' : 'bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-900 border-slate-600'}`}
                      >
                        HEEL
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#f4f1ea] border border-[#b0aaa0] rounded-xs p-2.5 flex items-center justify-between shadow-inner min-h-[64px]">
                    <div className="flex flex-col"><span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">SKID STATUS</span><span className="text-xs font-bold text-slate-500 font-mono">EMPTY SKID</span></div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setMountModalBayId(bay.bayId); }} className="px-2.5 py-1 bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-900 font-bold text-xs rounded-xs border-t border-l border-white border-b-2 border-r-2 border-slate-600 shadow-xs cursor-pointer select-none">+ MOUNT TANK</button>
                  </div>
                )}

                {/* Live Gauges */}
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

              {/* Action Buttons */}
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

      {/* ==================================================================== */}
      {/* 3번 탭 ORU SKID: FULL-SCREEN SCADA TELEMETRY TREND MODAL */}
      {/* ==================================================================== */}
      {selectedChartBayId && (() => {
        const selectedBay = activeBays.find((b) => b.bayId === selectedChartBayId);
        const formattedBayName = formatBayName(selectedChartBayId);

        return (
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 select-none animate-in fade-in duration-150 font-mono"
            onClick={() => setSelectedChartBayId(null)}
          >
            <div
              className="w-[96vw] max-w-[1800px] h-[88vh] min-h-[620px] flex flex-col bg-[#ece9d8] border-2 border-white border-b-2 border-r-2 border-slate-700 shadow-2xl rounded-xs overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header Bar */}
              <div className="bg-[#1e293b] text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-[#334155] shadow-xs shrink-0 select-none">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-black tracking-wider uppercase text-white font-mono flex items-center gap-1.5">
                    <span>📈</span>
                    <span>PHYSICAL TELEMETRY SHIFTS: {formattedBayName}</span>
                    {selectedBay?.tankNo && (
                      <span className="text-amber-300 ml-1 font-bold">(MOUNTED TANK: {selectedBay.tankNo})</span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {selectedBay?.tankNo && (
                    <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-[#0f172a] text-slate-200 border border-slate-700 rounded-xs shadow-inner text-xs">
                      <span className="text-slate-400 font-bold">SERIAL:</span>
                      <span className="text-cyan-300 font-bold">{selectedBay.serialNo || 'SIMU-8101426'}</span>
                      <span className="text-slate-600">|</span>
                      <span className="text-slate-400 font-bold">FLOW:</span>
                      <span className="text-emerald-400 font-bold">{(selectedBay.flowRate || (selectedBay.status === 'RUNNING' ? 1700.0 : 0.0)).toFixed(1)} t/h</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedChartBayId(null)}
                    className="bg-[#c53030] hover:bg-[#e53e3e] active:bg-[#9b2c2c] text-white font-bold text-xs px-3.5 py-1.5 rounded-xs border-t border-l border-[#fc8181] border-b-2 border-r-2 border-[#742a2a] shadow-xs cursor-pointer select-none flex items-center gap-1 font-mono"
                  >
                    <span>✕ CLOSE</span>
                  </button>
                </div>
              </div>

              {/* Modal Body: Large SCADA Canvas */}
              <div className="flex-1 min-h-0 flex flex-col p-3.5 bg-[#161f2b] overflow-hidden">
                <div className="flex-1 min-h-0 flex flex-col bg-[#1e293b] border-2 border-[#475569] rounded-xs shadow-[inset_2px_2px_6px_rgba(0,0,0,0.5)] p-3">
                  <div className="flex-1 min-h-0 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={getMockTrendData(selectedChartBayId)} margin={{ top: 20, right: 70, left: 15, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={true} horizontal={true} strokeOpacity={0.7} />
                        <XAxis
                          dataKey="time"
                          stroke="#64748b"
                          tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace', fontWeight: 'bold' }}
                          tickLine={{ stroke: '#475569' }}
                        />
                        {/* Axis 1 (Left Y1): Residual Volume */}
                        <YAxis
                          yAxisId="left"
                          orientation="left"
                          stroke="#00b4d8"
                          domain={[0, 25]}
                          tick={{ fill: '#00b4d8', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' }}
                          tickLine={{ stroke: '#00b4d8' }}
                          label={{ value: 'Vol (m³)', angle: -90, position: 'insideLeft', offset: 0, fill: '#00b4d8', fontSize: 11, fontWeight: 'bold', fontFamily: 'monospace' }}
                        />
                        {/* Axis 2 (Right Y2): Pressure */}
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="#2ec4b6"
                          domain={[0.0, 1.0]}
                          tick={{ fill: '#2ec4b6', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' }}
                          tickLine={{ stroke: '#2ec4b6' }}
                          label={{ value: 'Press (MPa)', angle: -90, position: 'insideRight', offset: 0, fill: '#2ec4b6', fontSize: 11, fontWeight: 'bold', fontFamily: 'monospace' }}
                        />
                        {/* Axis 3 (Right Y3 Offset): Cryo Temperature */}
                        <YAxis
                          yAxisId="rightOutward"
                          orientation="right"
                          stroke="#ff6b6b"
                          domain={[-160, -100]}
                          dx={38}
                          tick={{ fill: '#ff6b6b', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' }}
                          tickLine={{ stroke: '#ff6b6b' }}
                          label={{ value: 'Temp (°C)', angle: -90, position: 'insideRight', offset: 38, fill: '#ff6b6b', fontSize: 11, fontWeight: 'bold', fontFamily: 'monospace' }}
                        />

                        {/* Reference Lines with soft slate text */}
                        <ReferenceLine
                          y={1.0}
                          yAxisId="left"
                          stroke="#00b4d8"
                          strokeDasharray="3 3"
                          strokeOpacity={0.5}
                          label={{ position: 'insideBottomLeft', value: 'Heel limit: 1.0 m³', fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' }}
                        />
                        <ReferenceLine
                          y={0.70}
                          yAxisId="right"
                          stroke="#2ec4b6"
                          strokeDasharray="3 3"
                          strokeOpacity={0.5}
                          label={{ position: 'insideTopRight', value: 'Regas limit: 0.70 MPa', fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' }}
                        />
                        <ReferenceLine
                          y={0.30}
                          yAxisId="right"
                          stroke="#2ec4b6"
                          strokeDasharray="3 3"
                          strokeOpacity={0.5}
                          label={{ position: 'insideBottomRight', value: 'Disconnect target: 0.30 MPa', fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' }}
                        />

                        <Tooltip
                          contentStyle={{ backgroundColor: '#0c141f', borderColor: '#3b82f6', borderRadius: '4px', color: '#f1f5f9', fontFamily: 'monospace', fontSize: '11px' }}
                          itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                        />
                        <Legend
                          wrapperStyle={{ paddingTop: '10px', fontSize: '11px', fontFamily: 'monospace' }}
                        />

                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="volume"
                          name="Residual Volume (m³)"
                          stroke="#00b4d8"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: '#00b4d8', stroke: '#1e293b', strokeWidth: 1 }}
                          activeDot={{ r: 6, fill: '#00b4d8', stroke: '#fff', strokeWidth: 2 }}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="pressure"
                          name="Pressure (MPa)"
                          stroke="#2ec4b6"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: '#2ec4b6', stroke: '#1e293b', strokeWidth: 1 }}
                          activeDot={{ r: 6, fill: '#2ec4b6', stroke: '#fff', strokeWidth: 2 }}
                        />
                        <Line
                          yAxisId="rightOutward"
                          type="monotone"
                          dataKey="temp"
                          name="Cryo Temp (°C)"
                          stroke="#ff6b6b"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: '#ff6b6b', stroke: '#1e293b', strokeWidth: 1 }}
                          activeDot={{ r: 6, fill: '#ff6b6b', stroke: '#fff', strokeWidth: 2 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ==================================================================== */}
      {/* 4-HOUR PATROL LOG 2-ROW MATRIX REFACTORED DRAWER */}
      {/* ==================================================================== */}
      {activeDrawerBayId && activeDrawerType === 'PATROL' && (() => {
        const bay = activeBays.find((b) => b.bayId === activeDrawerBayId);
        const formattedBayName = formatBayName(activeDrawerBayId);

        return (
          <div className="bg-[#dfdbd1] border-2 border-[#8a8579] rounded-sm p-4 shadow-inner space-y-3.5 animate-in slide-in-from-top-4 fade-in duration-300 font-mono">
            {/* Header */}
            <div className="bg-[#0a2540] text-white px-3.5 py-2 -m-4 mb-3.5 rounded-t-sm flex justify-between items-center border-b border-[#071a2e] select-none">
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                  <span>ROUTINE 4-HOUR SHIFT PATROL LOG: {formattedBayName}</span>
                  {bay?.tankNo && (
                    <span className="text-amber-300 font-bold">(TANK: {bay.tankNo} | SERIAL: {bay.serialNo || 'SIMU-8101426'})</span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-300">Record current physical gauge measurements, SCADA inlet telemetry, and safety inspection parameters.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveDrawerBayId(null);
                  setActiveDrawerType(null);
                }}
                className="text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePatrolSubmit} className="space-y-3">
              {/* Time Slot Selector */}
              <div className="flex items-center gap-2 border-b border-[#c8c2b5] pb-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">SHIFT TIME SLOT:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['00:00', '04:00', '08:00 (Baseline)', '12:00', '16:00', '20:00'].map((slot) => {
                    const isActive = patrolTimeSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setPatrolTimeSlot(slot)}
                        className={`px-3 py-1 text-xs font-bold font-mono rounded-xs border-t border-l border-b-2 border-r-2 shadow-xs cursor-pointer select-none transition-all ${
                          isActive
                            ? 'bg-[#002b4d] text-white border-blue-900 shadow-inner'
                            : 'bg-[#d4d0c8] hover:bg-[#e0dcd4] text-slate-900 border-white border-b-slate-600 border-r-slate-600'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* [1행: ISO TANK MEASUREMENTS - 2번 탭 데이터 구조와 일치화] */}
              <div className="bg-[#e8e4dc] border border-[#b0aaa0] rounded-xs p-2.5 shadow-xs space-y-2">
                <div className="text-[11px] font-black uppercase tracking-wider text-[#002b4d] flex items-center gap-1.5 border-b border-[#c8c2b5] pb-1">
                  <span>[1] ISO TANK MEASUREMENTS (PRIMARY GAUGES &amp; TELEMETRY)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {/* ANALOG LEVEL */}
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-700 uppercase mb-1 truncate text-center">
                      ANALOG LEVEL (mmH2O)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={patrolLevelMmH2O}
                      onChange={(e) => setPatrolLevelMmH2O(parseFloat(e.target.value) || 0)}
                      className="bg-white border border-[#8b9aa8] rounded-xs px-2 py-1 text-slate-950 font-bold font-mono text-center text-sm shadow-inner focus:bg-amber-50 focus:outline-none"
                    />
                  </div>

                  {/* ANALOG PRESS */}
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-700 uppercase mb-1 truncate text-center">
                      ANALOG PRESS (MPa)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={patrolAnalogPress}
                      onChange={(e) => setPatrolAnalogPress(parseFloat(e.target.value) || 0)}
                      className="bg-white border border-[#8b9aa8] rounded-xs px-2 py-1 text-slate-950 font-bold font-mono text-center text-sm shadow-inner focus:bg-amber-50 focus:outline-none"
                    />
                  </div>

                  {/* CALC VOL (READONLY) */}
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-[#004a99] uppercase mb-1 truncate text-center">
                      CALC VOL (m³)
                    </label>
                    <div className="h-[30px] bg-[#f0f7ff] border border-[#7ba4cc] rounded-xs px-2 py-1 text-[#004a99] font-black font-mono text-center text-sm shadow-inner flex items-center justify-center select-all">
                      {patrolCalcVol.toFixed(1)}
                    </div>
                  </div>

                  {/* CALC MASS (READONLY) */}
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-[#004a99] uppercase mb-1 truncate text-center">
                      CALC MASS (TON)
                    </label>
                    <div className="h-[30px] bg-[#f0f7ff] border border-[#7ba4cc] rounded-xs px-2 py-1 text-[#004a99] font-black font-mono text-center text-sm shadow-inner flex items-center justify-center select-all">
                      {patrolCalcMass.toFixed(2)}
                    </div>
                  </div>

                  {/* SMT PRESS */}
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-700 uppercase mb-1 truncate text-center">
                      SMT PRESS (MPa)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={patrolSmtPress}
                      onChange={(e) => setPatrolSmtPress(parseFloat(e.target.value) || 0)}
                      className="bg-white border border-[#8b9aa8] rounded-xs px-2 py-1 text-slate-950 font-bold font-mono text-center text-sm shadow-inner focus:bg-amber-50 focus:outline-none"
                    />
                  </div>

                  {/* SMT LEVEL */}
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-700 uppercase mb-1 truncate text-center">
                      SMT LEVEL (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={patrolSmtLevel}
                      onChange={(e) => setPatrolSmtLevel(parseFloat(e.target.value) || 0)}
                      className="bg-white border border-[#8b9aa8] rounded-xs px-2 py-1 text-slate-950 font-bold font-mono text-center text-sm shadow-inner focus:bg-amber-50 focus:outline-none"
                    />
                  </div>

                  {/* SMT TEMP */}
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-700 uppercase mb-1 truncate text-center">
                      SMT TEMP (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={patrolSmtTemp}
                      onChange={(e) => setPatrolSmtTemp(parseFloat(e.target.value) || 0)}
                      className="bg-white border border-[#8b9aa8] rounded-xs px-2 py-1 text-slate-950 font-bold font-mono text-center text-sm shadow-inner focus:bg-amber-50 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* [2행: SKID LNG INLET & SAFETY PATROL - 1차 인입 및 안전 점검] */}
              <div className="bg-[#e8e4dc] border border-[#b0aaa0] rounded-xs p-2.5 shadow-xs space-y-2">
                <div className="text-[11px] font-black uppercase tracking-wider text-[#002b4d] flex items-center gap-1.5 border-b border-[#c8c2b5] pb-1">
                  <span>[2] SKID LNG INLET &amp; SAFETY PATROL (PROCESS INLET &amp; INTEGRITY)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {/* LNG INLET PRESS */}
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-700 uppercase mb-1 truncate text-center">
                      LNG INLET PRESS (MPa)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={patrolInletPress}
                      onChange={(e) => setPatrolInletPress(parseFloat(e.target.value) || 0)}
                      className="bg-white border border-[#8b9aa8] rounded-xs px-2 py-1 text-slate-950 font-bold font-mono text-center text-sm shadow-inner focus:bg-amber-50 focus:outline-none"
                    />
                  </div>

                  {/* LNG INLET TEMP */}
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-700 uppercase mb-1 truncate text-center">
                      LNG INLET TEMP (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={patrolInletTemp}
                      onChange={(e) => setPatrolInletTemp(parseFloat(e.target.value) || 0)}
                      className="bg-white border border-[#8b9aa8] rounded-xs px-2 py-1 text-slate-950 font-bold font-mono text-center text-sm shadow-inner focus:bg-amber-50 focus:outline-none"
                    />
                  </div>

                  {/* FLOW RATE */}
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-700 uppercase mb-1 truncate text-center">
                      FLOW RATE (T/H)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={patrolFlowRate}
                      onChange={(e) => setPatrolFlowRate(parseFloat(e.target.value) || 0)}
                      className="bg-white border border-[#8b9aa8] rounded-xs px-2 py-1 text-slate-950 font-bold font-mono text-center text-sm shadow-inner focus:bg-amber-50 focus:outline-none"
                    />
                  </div>

                  {/* ICING STATE */}
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-700 uppercase mb-1 truncate text-center">
                      ICING STATE
                    </label>
                    <select
                      value={patrolIcingState}
                      onChange={(e) => setPatrolIcingState(e.target.value as any)}
                      className="bg-white border border-[#8b9aa8] rounded-xs px-2 py-1 text-slate-950 font-bold font-mono text-center text-xs shadow-inner h-[30px] focus:bg-amber-50 focus:outline-none"
                    >
                      <option value="NORMAL">NORMAL (CLEAR)</option>
                      <option value="MODERATE">MODERATE (FROST)</option>
                      <option value="SEVERE">SEVERE (HEAVY ICE)</option>
                    </select>
                  </div>

                  {/* GAS LEAK DETECT */}
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-700 uppercase mb-1 truncate text-center">
                      GAS LEAK DETECT
                    </label>
                    <select
                      value={patrolGasLeak}
                      onChange={(e) => setPatrolGasLeak(e.target.value)}
                      className="bg-white border border-[#8b9aa8] rounded-xs px-2 py-1 text-slate-950 font-bold font-mono text-center text-xs shadow-inner h-[30px] focus:bg-amber-50 focus:outline-none"
                    >
                      <option value="0 ppm (NORMAL)">0 ppm (NORMAL)</option>
                      <option value="< 50 ppm (MONITOR)">&lt; 50 ppm (MONITOR)</option>
                      <option value="> 50 ppm (ALERT)">&gt; 50 ppm (ALERT)</option>
                    </select>
                  </div>

                  {/* INSPECTOR */}
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-700 uppercase mb-1 truncate text-center">
                      INSPECTOR
                    </label>
                    <input
                      type="text"
                      value={patrolInspector}
                      onChange={(e) => setPatrolInspector(e.target.value)}
                      className="bg-white border border-[#8b9aa8] rounded-xs px-2 py-1 text-slate-950 font-bold font-mono text-center text-xs shadow-inner focus:bg-amber-50 focus:outline-none"
                      placeholder="Operator Name"
                    />
                  </div>
                </div>
              </div>

              {/* Bottom: Remarks & Submit */}
              <div className="flex flex-col">
                <label className="text-[11px] font-bold text-slate-700 uppercase mb-1">
                  OPERATOR REMARKS
                </label>
                <input
                  type="text"
                  value={patrolRemarks}
                  onChange={(e) => setPatrolRemarks(e.target.value)}
                  className="bg-white border border-[#8b9aa8] rounded-xs px-2.5 py-1.5 text-slate-950 font-semibold font-mono text-xs shadow-inner focus:bg-amber-50 focus:outline-none"
                  placeholder="Optional operator shift remarks..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#c8c2b5]">
                <button
                  type="button"
                  onClick={() => {
                    setActiveDrawerBayId(null);
                    setActiveDrawerType(null);
                  }}
                  className="h-8 px-4 bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-900 font-bold text-xs rounded-xs border-t border-l border-white border-b-2 border-r-2 border-slate-600 shadow-xs cursor-pointer select-none font-mono"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="h-8 px-6 bg-[#2f855a] hover:bg-[#38a169] active:bg-[#22543d] text-white font-bold text-xs rounded-xs border-t border-l border-[#48bb78] border-b-2 border-r-2 border-[#1c4d35] shadow-xs cursor-pointer select-none font-mono flex items-center gap-1.5"
                >
                  <span>💾 SAVE PATROL LOG</span>
                </button>
              </div>
            </form>
          </div>
        );
      })()}

      {/* ==================================================================== */}
      {/* PRE-DISCONNECT SOP SETTLEMENT: DIALOG POPUP MODAL (STANDARD SIZE) */}
      {/* ==================================================================== */}
      {activeDrawerBayId && activeDrawerType === 'DISCONNECT' && (() => {
        const bay = activeBays.find((b) => b.bayId === activeDrawerBayId);
        const formattedBayName = formatBayName(activeDrawerBayId);

        return (
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150 font-mono"
            onClick={() => {
              setActiveDrawerBayId(null);
              setActiveDrawerType(null);
            }}
          >
            <div
              className="w-[800px] max-w-[90vw] max-h-[92vh] flex flex-col bg-[#ece9d8] border-2 border-white border-b-2 border-r-2 border-slate-700 shadow-2xl rounded-xs overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-[#1e293b] text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-[#334155] shadow-xs shrink-0 select-none">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-black tracking-wider uppercase text-white font-mono flex items-center gap-1.5">
                    <span>🔌</span>
                    <span>HEEL SETTLEMENT: {formattedBayName}</span>
                    {bay?.tankNo && (
                      <span className="text-amber-300 ml-1 font-bold">(TANK: {bay.tankNo})</span>
                    )}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveDrawerBayId(null);
                    setActiveDrawerType(null);
                  }}
                  className="bg-[#c53030] hover:bg-[#e53e3e] active:bg-[#9b2c2c] text-white font-bold text-xs px-3.5 py-1.5 rounded-xs border-t border-l border-[#fc8181] border-b-2 border-r-2 border-[#742a2a] shadow-xs cursor-pointer select-none flex items-center gap-1 font-mono"
                >
                  <span>✕ CLOSE</span>
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleHeelModalSubmit} className="p-4 space-y-3.5 overflow-y-auto custom-scada-scrollbar bg-[#f0ede6]">
                {/* Target Destination 3D Inset Panel */}
                <div className="bg-[#f4f1ea] border-2 border-[#b0aaa0] rounded-xs p-2.5 flex items-center justify-between shadow-inner">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">TARGET DESTINATION</span>
                  <span className="font-black text-sm text-[#002b4d] font-mono">LAYDOWN YARD 2 (ORU LD-2)</span>
                </div>

                {/* SOP Inspection Table */}
                <div className="bg-white border-2 border-[#b0aaa0] rounded-xs overflow-hidden shadow-inner">
                  <div className="grid grid-cols-12 bg-[#4e5d6e] text-white p-2.5 text-[11px] font-extrabold uppercase tracking-wider border-b border-[#8b9aa8]">
                    <div className="col-span-4 pl-2">Inspection Parameter</div>
                    <div className="col-span-4">SOP Target Baseline</div>
                    <div className="col-span-4">Actual Input</div>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {/* Heel Level */}
                    <div className="grid grid-cols-12 p-3 items-center text-xs">
                      <div className="col-span-4 pl-2 font-bold text-slate-900">Residual Heel Level</div>
                      <div className="col-span-4 font-mono font-semibold text-slate-700">1.0 m³ (~4.0% / ~400 kg)</div>
                      <div className="col-span-4 flex items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          value={heelLevelPct}
                          onChange={(e) => setHeelLevelPct(parseFloat(e.target.value) || 0)}
                          className="w-24 bg-white border border-[#8b9aa8] rounded-xs px-2 py-1 text-slate-950 font-bold font-mono text-center text-sm shadow-inner focus:bg-amber-50 focus:outline-none"
                        />
                        <span className="text-slate-700 font-bold font-mono">%</span>
                      </div>
                    </div>

                    {/* Pre-Venting Pressure */}
                    <div className="grid grid-cols-12 p-3 items-center text-xs">
                      <div className="col-span-4 pl-2 font-bold text-slate-900">Pre-Venting Pressure</div>
                      <div className="col-span-4 font-mono font-semibold text-slate-700">0.70 MPa (7.0 bar)</div>
                      <div className="col-span-4 flex items-center gap-1">
                        <input
                          type="number"
                          step="0.01"
                          value={heelPreVentPressureMPa}
                          onChange={(e) => setHeelPreVentPressureMPa(parseFloat(e.target.value) || 0)}
                          className="w-24 bg-white border border-[#8b9aa8] rounded-xs px-2 py-1 text-slate-950 font-bold font-mono text-center text-sm shadow-inner focus:bg-amber-50 focus:outline-none"
                        />
                        <span className="text-slate-700 font-bold font-mono">MPa</span>
                      </div>
                    </div>

                    {/* Post-Venting Disconnect Pressure */}
                    <div className="grid grid-cols-12 p-3 items-center text-xs">
                      <div className="col-span-4 pl-2 font-bold text-slate-900">Post-Venting Disconnect Pressure</div>
                      <div className="col-span-4 font-mono font-semibold text-slate-700">0.30 MPa (3.0 bar)</div>
                      <div className="col-span-4 flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={heelPressureMPa}
                          onChange={(e) => setHeelPressureMPa(parseFloat(e.target.value) || 0)}
                          className="w-24 bg-white border border-[#8b9aa8] rounded-xs px-2 py-1 text-slate-950 font-bold font-mono text-center text-sm shadow-inner focus:bg-amber-50 focus:outline-none"
                        />
                        <span className="text-slate-700 font-bold font-mono">MPa</span>
                        {heelPressureMPa <= 0.30 ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-xs bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono shadow-xs">
                            ✓ SAFE
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-xs bg-amber-100 text-amber-800 border border-amber-300 font-mono shadow-xs">
                            ⚠ HIGH
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Operator Remarks */}
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-slate-700 uppercase mb-1">
                    OPERATOR REMARKS
                  </label>
                  <textarea
                    value={stage1Remarks}
                    onChange={(e) => setStage1Remarks(e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-[#8b9aa8] rounded-xs p-2 text-slate-950 font-semibold font-mono text-xs shadow-inner resize-none focus:bg-amber-50 focus:outline-none"
                    placeholder="SOP settlement notes and offload remarks..."
                  />
                </div>

                {/* Footer Controls */}
                <div className="flex justify-end items-center gap-2 pt-2 border-t border-[#c8c2b5]">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDrawerBayId(null);
                      setActiveDrawerType(null);
                    }}
                    className="h-8 px-4 bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-900 font-bold text-xs rounded-xs border-t border-l border-white border-b-2 border-r-2 border-slate-600 shadow-xs cursor-pointer select-none font-mono"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="h-8 px-6 bg-[#002b4d] hover:bg-[#003e70] active:bg-[#001f38] text-white font-bold text-xs rounded-xs border-t border-l border-blue-400 border-b-2 border-r-2 border-blue-950 shadow-xs cursor-pointer select-none font-mono flex items-center gap-1.5"
                  >
                    <span>💾 LOG HEEL &amp; UNMOUNT</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
