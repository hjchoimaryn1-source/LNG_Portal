// src/components/FleetTrackerView.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { usePortalData } from '../context/PortalDataContext';
import { NodeState } from '../types/lng';
import {
  Anchor,
  Ship,
  MapPin,
  Flame,
  RotateCcw,
  Search,
  CheckSquare,
  Square,
  ArrowRight,
  Filter,
  Layers,
  Thermometer,
  Gauge,
  Droplet,
  CheckCircle2,
  Wrench,
} from 'lucide-react';

const NODE_CONFIGS: Record<
  NodeState,
  {
    title: string;
    subTitle: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
    badgeBg: string;
  }
> = {
  [NodeState.NODE_1_ARUN_PAG_TERMINAL]: {
    title: 'Node 1: Arun PAG',
    subTitle: 'Loading & COQ Inspection',
    icon: <Anchor className="w-4 h-4 sm:w-5 sm:h-5" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-950/20',
    borderColor: 'border-blue-500/40',
    badgeBg: 'bg-blue-50 text-blue-400 border-blue-200',
  },
  [NodeState.NODE_2_MV_SAVIOUR_TRANSIT]: {
    title: 'Node 2: Marine Sailing',
    subTitle: 'MV. SAVIOUR Transit',
    icon: <Ship className="w-4 h-4 sm:w-5 sm:h-5" />,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-950/20',
    borderColor: 'border-cyan-500/40',
    badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  },
  [NodeState.NODE_3_NIAS_LAYDOWN_YARD]: {
    title: 'Node 3: Nias Laydown',
    subTitle: 'Depressurization & BOG Staging',
    icon: <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-50 text-emerald-700',
    borderColor: 'border-emerald-200',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-200',
  },
  [NodeState.NODE_4_REGAS_ACTIVE_BAY]: {
    title: 'Node 4: Active Regas Bay',
    subTitle: 'Bay 1~4 Vaporization',
    icon: <Flame className="w-4 h-4 sm:w-5 sm:h-5" />,
    color: 'text-amber-400',
    bgColor: 'bg-amber-50 text-amber-700',
    borderColor: 'border-amber-200',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-200',
  },
  [NodeState.NODE_5_EMPTY_RETURN_CYCLE]: {
    title: 'Node 5: Empty Return',
    subTitle: 'Return Sailing to Arun',
    icon: <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />,
    color: 'text-purple-400',
    bgColor: 'bg-purple-950/20',
    borderColor: 'border-purple-500/40',
    badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  },
  [NodeState.NODE_MAINTENANCE_MRO]: {
    title: 'MRO Workshop Depot',
    subTitle: 'Out-of-Cycle Maintenance & Repair',
    icon: <Wrench className="w-4 h-4 sm:w-5 sm:h-5" />,
    color: 'text-rose-400',
    bgColor: 'bg-rose-950/20',
    borderColor: 'border-rose-500/40',
    badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  },
};

export default function FleetTrackerView() {
  const { fleetTanks, batchTransitionTanks } = usePortalData();
  const [selectedNodeFilter, setSelectedNodeFilter] = useState<NodeState | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTankNos, setSelectedTankNos] = useState<Set<string>>(new Set());
  const [transitionTargetNode, setTransitionTargetNode] = useState<NodeState>(
    NodeState.NODE_3_NIAS_LAYDOWN_YARD
  );
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Compute node distribution counts
  const nodeCounts = useMemo(() => {
    const counts: Record<NodeState, number> = {
      [NodeState.NODE_1_ARUN_PAG_TERMINAL]: 0,
      [NodeState.NODE_2_MV_SAVIOUR_TRANSIT]: 0,
      [NodeState.NODE_3_NIAS_LAYDOWN_YARD]: 0,
      [NodeState.NODE_4_REGAS_ACTIVE_BAY]: 0,
      [NodeState.NODE_5_EMPTY_RETURN_CYCLE]: 0,
      [NodeState.NODE_MAINTENANCE_MRO]: 0,
    };
    fleetTanks.forEach((t) => {
      if (counts[t.node] !== undefined) {
        counts[t.node]++;
      }
    });
    return counts;
  }, [fleetTanks]);

  // Filtered tanks
  const filteredTanks = useMemo(() => {
    return fleetTanks.filter((t) => {
      const matchesNode = selectedNodeFilter === 'ALL' || t.node === selectedNodeFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.tankNo.toLowerCase().includes(q) ||
        t.serialNo.toLowerCase().includes(q) ||
        t.location.toLowerCase().includes(q) ||
        t.position.toLowerCase().includes(q) ||
        t.remarks.toLowerCase().includes(q);
      return matchesNode && matchesSearch;
    });
  }, [fleetTanks, selectedNodeFilter, searchQuery]);

  const toggleSelectTank = (tankNo: string) => {
    setSelectedTankNos((prev) => {
      const next = new Set(prev);
      if (next.has(tankNo)) next.delete(tankNo);
      else next.add(tankNo);
      return next;
    });
  };

  const selectAllFiltered = () => {
    if (selectedTankNos.size === filteredTanks.length) {
      setSelectedTankNos(new Set());
    } else {
      setSelectedTankNos(new Set(filteredTanks.map((t) => t.tankNo)));
    }
  };

  const handleExecuteTransition = () => {
    if (selectedTankNos.size === 0) return;
    const count = selectedTankNos.size;
    batchTransitionTanks(Array.from(selectedTankNos), transitionTargetNode);
    setSelectedTankNos(new Set());
    setSuccessToast(`Successfully transitioned ${count} tanks to ${NODE_CONFIGS[transitionTargetNode].title}`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  return (
    <div className="flex flex-col gap-5 sm:gap-6 w-full">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 flex items-center gap-2 px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-200 text-emerald-300 rounded-none shadow-none backdrop-blur-md animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{successToast}</span>
        </div>
      )}

      {/* 5-Node + MRO Summary - Adaptive for all monitors */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 shrink-0" />
              120 ISO Tank Fleet Closed-Loop & MRO Lifecycle Distribution
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Live FSM State lifecycle tracking across Arun Terminal, MV. Saviour Transit, Nias Laydown, Regas Bays, Empty Return, and MRO Depot
            </p>
          </div>
          <div className="text-xs font-mono text-slate-500 bg-white shadow-none/80 px-3 py-1.5 rounded-none border border-slate-200 self-start sm:self-auto shrink-0">
            Total Fleet: <span className="text-blue-400 font-bold">{fleetTanks.length} Tanks</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {(Object.keys(NODE_CONFIGS) as NodeState[]).map((nodeKey) => {
            const config = NODE_CONFIGS[nodeKey];
            const count = nodeCounts[nodeKey] || 0;
            const percent = fleetTanks.length > 0 ? ((count / fleetTanks.length) * 100).toFixed(1) : '0.0';
            const isSelected = selectedNodeFilter === nodeKey;

            return (
              <div
                key={nodeKey}
                onClick={() => setSelectedNodeFilter(isSelected ? 'ALL' : nodeKey)}
                className={`p-3.5 sm:p-4 rounded-none border cursor-pointer transition-all duration-200 relative overflow-hidden group ${
                  isSelected
                    ? `${config.borderColor} ${config.bgColor} shadow-none shadow-blue-500/10 ring-1 ring-blue-500/50`
                    : 'bg-white shadow-none/60 border-slate-200/80 hover:border-slate-200 hover:bg-white shadow-none'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-none win-panel ${config.color}`}>
                    {config.icon}
                  </div>
                  <span className="text-xl sm:text-2xl font-bold font-mono text-slate-100">{count}</span>
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-slate-700 group-hover:text-slate-700 transition-colors truncate">
                  {config.title}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500 truncate mb-2">{config.subTitle}</p>
                {/* Progress bar */}
                <div className="w-full bg-slate-50/80 rounded-none h-1.5 overflow-hidden border border-slate-200">
                  <div
                    className={`h-full rounded-none transition-all duration-500 ${
                      nodeKey === NodeState.NODE_1_ARUN_PAG_TERMINAL
                        ? 'bg-blue-500'
                        : nodeKey === NodeState.NODE_2_MV_SAVIOUR_TRANSIT
                        ? 'bg-cyan-500'
                        : nodeKey === NodeState.NODE_3_NIAS_LAYDOWN_YARD
                        ? 'bg-emerald-500'
                        : nodeKey === NodeState.NODE_4_REGAS_ACTIVE_BAY
                        ? 'bg-amber-500'
                        : nodeKey === NodeState.NODE_5_EMPTY_RETURN_CYCLE
                        ? 'bg-purple-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.max(5, parseFloat(percent))}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-1 inline-block">{percent}% of fleet</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Control Bar: Filter, Search, Batch Transition Trigger */}
      <section className="bg-white shadow-none/80 border border-slate-200/80 rounded-none p-3.5 sm:p-4 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 sm:gap-4 shadow-none">
        {/* Left: Search & Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <div className="relative flex-1 sm:flex-initial sm:min-w-[220px]">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Tank, Serial, Location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 sm:pl-9 pr-3 py-1.5 text-xs win-panel rounded-none text-slate-700 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 bg-slate-50 p-1 rounded-none border border-slate-200 text-xs">
            <Filter className="w-3 h-3 text-slate-500 ml-1 mr-0.5 shrink-0 hidden xs:inline" />
            <button
              onClick={() => setSelectedNodeFilter('ALL')}
              className={`px-2 py-0.8 sm:px-2.5 sm:py-1 rounded-none transition-colors text-[11px] sm:text-xs ${
                selectedNodeFilter === 'ALL'
                  ? 'bg-slate-100 text-blue-400 font-semibold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              All ({fleetTanks.length})
            </button>
            {(Object.keys(NODE_CONFIGS) as NodeState[]).map((nk) => (
              <button
                key={nk}
                onClick={() => setSelectedNodeFilter(nk)}
                className={`px-1.5 sm:px-2 py-0.8 sm:py-1 rounded-none transition-colors text-[11px] sm:text-xs whitespace-nowrap ${
                  selectedNodeFilter === nk
                    ? 'bg-slate-100 text-blue-400 font-semibold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {nk === NodeState.NODE_1_ARUN_PAG_TERMINAL && 'Node 1'}
                {nk === NodeState.NODE_2_MV_SAVIOUR_TRANSIT && 'Node 2'}
                {nk === NodeState.NODE_3_NIAS_LAYDOWN_YARD && 'Node 3'}
                {nk === NodeState.NODE_4_REGAS_ACTIVE_BAY && 'Node 4'}
                {nk === NodeState.NODE_5_EMPTY_RETURN_CYCLE && 'Node 5'}
                {nk === NodeState.NODE_MAINTENANCE_MRO && 'MRO'}
                {' (' + (nodeCounts[nk] || 0) + ')'}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Batch FSM Transition Selector */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 sm:gap-3 pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-200">
          <button
            onClick={selectAllFiltered}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-none text-xs text-slate-600 font-medium transition-colors shrink-0"
          >
            {selectedTankNos.size > 0 && selectedTankNos.size === filteredTanks.length ? (
              <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
            ) : (
              <Square className="w-3.5 h-3.5 text-slate-500" />
            )}
            {selectedTankNos.size > 0 ? `Selected (${selectedTankNos.size})` : 'Select All'}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:inline">Move:</span>
            <select
              value={transitionTargetNode}
              onChange={(e) => setTransitionTargetNode(e.target.value as NodeState)}
              className="win-panel text-slate-700 text-xs rounded-none px-2 sm:px-2.5 py-1.5 focus:outline-none focus:border-blue-500 max-w-[170px] sm:max-w-none"
            >
              <option value={NodeState.NODE_1_ARUN_PAG_TERMINAL}>Node 1: Arun Loading</option>
              <option value={NodeState.NODE_2_MV_SAVIOUR_TRANSIT}>Node 2: MV. Saviour</option>
              <option value={NodeState.NODE_3_NIAS_LAYDOWN_YARD}>Node 3: Nias Laydown</option>
              <option value={NodeState.NODE_4_REGAS_ACTIVE_BAY}>Node 4: Regas Bay</option>
              <option value={NodeState.NODE_5_EMPTY_RETURN_CYCLE}>Node 5: Empty Return</option>
              <option value={NodeState.NODE_MAINTENANCE_MRO}>MRO: Maintenance Depot</option>
            </select>

            <button
              onClick={handleExecuteTransition}
              disabled={selectedTankNos.size === 0}
              className={`flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-none text-xs font-semibold transition-all shrink-0 ${
                selectedTankNos.size > 0
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-none shadow-blue-500/20 cursor-pointer'
                  : 'bg-slate-100 text-slate-500 border border-slate-200/50 cursor-not-allowed'
              }`}
            >
              <span>Transition</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 120 Fleet Tank Cards Grid */}
      <section>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(195px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(205px,1fr))] gap-2.5 sm:gap-3.5">
          {filteredTanks.map((tank) => {
            const isSelected = selectedTankNos.has(tank.tankNo);
            const nodeConfig = NODE_CONFIGS[tank.node] || NODE_CONFIGS[NodeState.NODE_2_MV_SAVIOUR_TRANSIT];

            return (
              <div
                key={tank.tankNo}
                onClick={() => toggleSelectTank(tank.tankNo)}
                className={`p-3 sm:p-3.5 rounded-none border cursor-pointer transition-all duration-200 relative group flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-950/35 border-blue-500 shadow-none shadow-blue-500/10 ring-1 ring-blue-500/40'
                    : tank.isUnderMaintenance
                    ? 'bg-rose-950/20 border-rose-800/80 hover:border-rose-600'
                    : 'bg-white shadow-none/50 border-slate-200/80 hover:border-slate-200 hover:bg-white shadow-none/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-xs sm:text-sm text-slate-100 group-hover:text-blue-400 transition-colors">
                      {tank.tankNo}
                    </span>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="rounded border-slate-200 bg-slate-50 text-blue-500 accent-blue-500 cursor-pointer"
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate mb-2">{tank.serialNo}</div>

                  <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-none border inline-flex items-center gap-1 mb-2.5 max-w-full truncate ${nodeConfig.badgeBg}`}>
                    {nodeConfig.icon}
                    <span className="truncate">{nodeConfig.title.split(':')[1] || nodeConfig.title}</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-200/60 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1 text-[11px] text-slate-500 font-sans">
                      <Droplet className="w-3 h-3 text-blue-400" /> Level
                    </span>
                    <span className="font-semibold">{tank.level}%</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1 text-[11px] text-slate-500 font-sans">
                      <Gauge className="w-3 h-3 text-emerald-400" /> Press
                    </span>
                    <span>{tank.pressureMPa.toFixed(2)} MPa</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1 text-[11px] text-slate-500 font-sans">
                      <Thermometer className="w-3 h-3 text-red-400" /> Temp
                    </span>
                    <span>{tank.tempC.toFixed(1)}°C</span>
                  </div>
                </div>

                <div className="mt-2.5 pt-1.5 border-t border-slate-200/40 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="truncate max-w-[85px]">{tank.location}</span>
                  <span className="font-mono text-slate-500 truncate max-w-[85px]">{tank.position}</span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredTanks.length === 0 && (
          <div className="text-center py-16 bg-white shadow-none/30 border border-slate-200 rounded-none text-slate-500 text-sm">
            No ISO Tanks found matching your search and filter criteria.
          </div>
        )}
      </section>
    </div>
  );
}
