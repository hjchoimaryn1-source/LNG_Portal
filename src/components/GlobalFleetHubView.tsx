"use client";

import React, { useState, useMemo } from 'react';
import { usePortalData } from '../context/PortalDataContext';
import { NodeState, FleetTankItem } from '../types/lng';
import {
  Search,
  MapPin,
  Ship,
  Building2,
  Flame,
  Globe,
  MoreVertical,
  ChevronDown,
} from 'lucide-react';

type BucketKey = 'ARUN' | 'SAVIOUR' | 'NIAS_L1' | 'NIAS_BAY' | 'NIAS_L2';

const BUCKET_CONFIG: Record<BucketKey, { title: string; node: NodeState; icon: React.ReactNode; color: string; bg: string }> = {
  ARUN: {
    title: 'Arun PAG (Aceh)',
    node: NodeState.NODE_1_ARUN_PAG_TERMINAL,
    icon: <Building2 className="w-4 h-4 text-slate-900 font-bold" />,
    color: 'text-slate-900 font-bold',
    bg: 'bg-blue-950/30 border-blue-900/50',
  },
  SAVIOUR: {
    title: 'MV. Saviour (Transit)',
    node: NodeState.NODE_2_MV_SAVIOUR_TRANSIT,
    icon: <Ship className="w-4 h-4 text-slate-900 font-bold" />,
    color: 'text-slate-900 font-bold',
    bg: 'bg-cyan-950/30 border-cyan-900/50',
  },
  NIAS_L1: {
    title: 'Nias Laydown 1',
    node: NodeState.NODE_3_NIAS_LAYDOWN_YARD,
    icon: <MapPin className="w-4 h-4 text-slate-900 font-bold" />,
    color: 'text-slate-900 font-bold',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-900/50',
  },
  NIAS_BAY: {
    title: 'Nias 4-Bay Vaporizer',
    node: NodeState.NODE_4_REGAS_ACTIVE_BAY,
    icon: <Flame className="w-4 h-4 text-slate-900 font-bold" />,
    color: 'text-slate-900 font-bold',
    bg: 'bg-amber-50 text-amber-700 border-amber-900/50',
  },
  NIAS_L2: {
    title: 'Nias Laydown 2',
    node: NodeState.NODE_5_EMPTY_RETURN_CYCLE,
    icon: <MapPin className="w-4 h-4 text-slate-900 font-bold" />,
    color: 'text-slate-900 font-bold',
    bg: 'bg-purple-950/30 border-purple-900/50',
  }
};

export default function GlobalFleetHubView() {
  const { fleetTanks, batchTransitionTanks } = usePortalData();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ARUN' | 'SAVIOUR' | 'NIAS'>('ALL');

  const [draggedTank, setDraggedTank] = useState<string | null>(null);

  // Filter Active Tanks
  const filteredTanks = useMemo(() => {
    return fleetTanks.filter((t) => {
      if (t.isUnderMaintenance || t.node === NodeState.NODE_MAINTENANCE_MRO) return false;

      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || t.tankNo.toLowerCase().includes(q) || t.serialNo.toLowerCase().includes(q);
      
      let matchesFilter = true;
      if (activeFilter === 'ARUN') matchesFilter = t.node === NodeState.NODE_1_ARUN_PAG_TERMINAL;
      else if (activeFilter === 'SAVIOUR') matchesFilter = t.node === NodeState.NODE_2_MV_SAVIOUR_TRANSIT;
      else if (activeFilter === 'NIAS') {
        matchesFilter = 
          t.node === NodeState.NODE_3_NIAS_LAYDOWN_YARD ||
          t.node === NodeState.NODE_4_REGAS_ACTIVE_BAY ||
          t.node === NodeState.NODE_5_EMPTY_RETURN_CYCLE ||
          t.location === 'ORU NIAS';
      }

      return matchesSearch && matchesFilter;
    });
  }, [fleetTanks, searchQuery, activeFilter]);

  // Compute Buckets
  const getBucket = (t: FleetTankItem): BucketKey => {
    if (t.node === NodeState.NODE_1_ARUN_PAG_TERMINAL) return 'ARUN';
    if (t.node === NodeState.NODE_2_MV_SAVIOUR_TRANSIT) return 'SAVIOUR';
    if (t.node === NodeState.NODE_4_REGAS_ACTIVE_BAY) return 'NIAS_BAY';
    if (t.node === NodeState.NODE_5_EMPTY_RETURN_CYCLE) return 'NIAS_L2';
    return 'NIAS_L1'; // Default to Laydown 1 for Nias
  };

  const buckets = {
    ARUN: filteredTanks.filter(t => getBucket(t) === 'ARUN'),
    SAVIOUR: filteredTanks.filter(t => getBucket(t) === 'SAVIOUR'),
    NIAS_L1: filteredTanks.filter(t => getBucket(t) === 'NIAS_L1'),
    NIAS_BAY: filteredTanks.filter(t => getBucket(t) === 'NIAS_BAY'),
    NIAS_L2: filteredTanks.filter(t => getBucket(t) === 'NIAS_L2'),
  };

  // Handlers
  const handleDragStart = (e: React.DragEvent, tankNo: string) => {
    setDraggedTank(tankNo);
    e.dataTransfer.setData('text/plain', tankNo);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetBucket: BucketKey) => {
    e.preventDefault();
    const tankNo = e.dataTransfer.getData('text/plain');
    if (tankNo && BUCKET_CONFIG[targetBucket]) {
      batchTransitionTanks([tankNo], BUCKET_CONFIG[targetBucket].node);
    }
    setDraggedTank(null);
  };

  const handleMoveTank = (tankNo: string, targetNode: NodeState) => {
    batchTransitionTanks([tankNo], targetNode);
  };

  // Render a Tank Card
  const renderTankCard = (tank: FleetTankItem, currentBucket: BucketKey) => (
    <div
      key={tank.tankNo}
      draggable
      onDragStart={(e) => handleDragStart(e, tank.tankNo)}
      onDragEnd={() => setDraggedTank(null)}
      className={`group relative p-3 rounded-none border bg-white shadow-none shadow-none cursor-grab active:cursor-grabbing transition-all ${
        draggedTank === tank.tankNo ? 'opacity-50 scale-95 border-slate-200' : 'border-slate-200 hover:border-slate-200 hover:shadow-none hover:-translate-y-0.5'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-mono font-bold text-slate-900 font-bold text-xs sm:text-sm">{tank.tankNo}</div>
          <div className="text-[10px] text-slate-900 font-bold font-mono mt-0.5">{tank.serialNo || 'S-UNKNOWN'}</div>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold">
          <span className={tank.level > 20 ? 'text-slate-900 font-bold' : 'text-slate-900 font-bold'}>{tank.level}%</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="text-[10px] text-slate-900 font-bold">
          <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">{tank.pressureMPa.toFixed(2)} MPa</span>
        </div>

        {/* Inline Relocation Dropdown */}
        <div className="relative">
          <select
            className="appearance-none bg-slate-100 text-slate-900 font-bold text-[10px] font-bold py-1 pl-2 pr-6 rounded border border-slate-200 hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            value={BUCKET_CONFIG[currentBucket].node}
            onChange={(e) => handleMoveTank(tank.tankNo, e.target.value as NodeState)}
          >
            {Object.entries(BUCKET_CONFIG).map(([key, config]) => (
              <option key={key} value={config.node}>Move ➔ {config.title}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-900 font-bold pointer-events-none" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics */}
      <div className="bg-white shadow-none/50 rounded-none border border-slate-200 p-5 shadow-none backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg md:text-xl font-black text-slate-700 flex items-center gap-2 tracking-tight">
              <Globe className="w-6 h-6 text-slate-900 font-bold" />
              Global Fleet Control Center
            </h1>
            <p className="text-xs text-slate-900 font-bold mt-1">
              Drag and drop ISO Tanks across the global supply chain, instantly updating telemetry systems across terminals.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-50/50 p-1.5 rounded-none border border-slate-200/80">
            {['ALL', 'ARUN', 'SAVIOUR', 'NIAS'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter as any)}
                className={`px-4 py-1.5 rounded-none text-xs font-bold transition-all ${
                  activeFilter === filter
                    ? 'bg-blue-600/20 text-white font-bold shadow-none border border-blue-200'
                    : 'text-slate-900 font-bold hover:text-slate-900 font-bold hover:bg-slate-100'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mt-5 relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-900 font-bold" />
          <input
            type="text"
            placeholder="Search ISO Tank No (e.g. ISOT-064)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full win-panel text-slate-900 font-bold text-sm rounded-none py-2 pl-10 pr-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-600"
          />
        </div>
      </div>

      {/* 5-Column Drag and Drop Buckets */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {(Object.entries(BUCKET_CONFIG) as [BucketKey, typeof BUCKET_CONFIG[BucketKey]][]).map(([key, config]) => (
          <div
            key={key}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, key)}
            className={`flex flex-col rounded-none border ${config.bg} shadow-none overflow-hidden min-h-[500px] transition-colors`}
          >
            {/* Column Header */}
            <div className="p-3 bg-slate-50/40 border-b border-slate-200/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {config.icon}
                <h3 className={`text-xs font-bold ${config.color} uppercase tracking-wider`}>
                  {config.title}
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold bg-white shadow-none px-2 py-0.5 rounded text-slate-900 font-bold border border-slate-200">
                {buckets[key].length}
              </span>
            </div>

            {/* Column Body / Drop Zone */}
            <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
              {buckets[key].length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-900 font-bold font-bold border-2 border-dashed border-slate-200/50 rounded-none m-2">
                  Drag Tanks Here
                </div>
              ) : (
                buckets[key].map((tank) => renderTankCard(tank, key))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
