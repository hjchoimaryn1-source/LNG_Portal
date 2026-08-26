// src/components/MaintenanceHubView.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { usePortalData } from '../context/PortalDataContext';
import { DefectCategory, MaintenanceLocation, NodeState } from '../types/lng';
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  Clock,
  MapPin,
  Building2,
  Search,
  RotateCcw,
  ShieldAlert,
  SlidersHorizontal,
  XCircle,
} from 'lucide-react';

const DEFECT_BADGES: Record<
  DefectCategory,
  { label: string; bg: string; text: string; border: string; desc: string }
> = {
  VACUUM_LOSS: {
    label: 'Vacuum Loss',
    bg: 'bg-red-500/20',
    text: 'text-white font-bold',
    border: 'border-red-500/40',
    desc: 'Annular vacuum insulation degradation, high boil-off rate',
  },
  VALVE_LEAK: {
    label: 'Valve Leak',
    bg: 'bg-amber-500/20',
    text: 'text-white font-bold',
    border: 'border-amber-500/40',
    desc: 'Cryogenic liquid or gas valve packing/seat passing',
  },
  INSTRUMENT_FAULT: {
    label: 'Instrument Fault',
    bg: 'bg-blue-500/20',
    text: 'text-white font-bold',
    border: 'border-blue-500/40',
    desc: 'Pressure transmitter, RTD temp sensor, or telemetry battery',
  },
  STRUCTURE_DAMAGE: {
    label: 'Structure Damage',
    bg: 'bg-purple-500/20',
    text: 'text-white font-bold',
    border: 'border-purple-500/40',
    desc: 'ISO container corner casting, frame, or cladding impact',
  },
  PERIODIC_INSPECTION: {
    label: 'Periodic Inspection',
    bg: 'bg-emerald-500/20',
    text: 'text-white font-bold',
    border: 'border-emerald-500/40',
    desc: '2.5yr / 5yr statutory ADR/IMDG cryogenic re-certification',
  },
};

export default function MaintenanceHubView() {
  const {
    fleetTanks,
    markTankForMaintenance,
    releaseTankFromMaintenance,
  } = usePortalData();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<DefectCategory | 'ALL'>('ALL');
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state for logging fault
  const [targetTankNo, setTargetTankNo] = useState<string>('');
  const [defectCat, setDefectCat] = useState<DefectCategory>('VALVE_LEAK');
  const [mroLocation, setMroLocation] = useState<MaintenanceLocation>('NIAS_MRO_BAY');
  const [defectDesc, setDefectDesc] = useState<string>('');

  // Active MRO tanks
  const mroTanks = useMemo(() => {
    return fleetTanks.filter(
      (t) => t.isUnderMaintenance || t.node === NodeState.NODE_MAINTENANCE_MRO
    );
  }, [fleetTanks]);

  const filteredMroTanks = useMemo(() => {
    return mroTanks.filter((t) => {
      const matchCat = filterCategory === 'ALL' || t.defectCategory === filterCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        t.tankNo.toLowerCase().includes(q) ||
        t.serialNo.toLowerCase().includes(q) ||
        (t.defectDescription || '').toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [mroTanks, filterCategory, searchQuery]);

  const handleLogFaultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTankNo) return;
    markTankForMaintenance(targetTankNo, defectCat, mroLocation, defectDesc || 'Reported maintenance fault');
    setIsLogModalOpen(false);
    setTargetTankNo('');
    setDefectDesc('');
    setToastMessage(`Tank ${targetTankNo} routed to MRO Workshop`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRelease = (tankNo: string, targetNode: NodeState) => {
    releaseTankFromMaintenance(tankNo, targetNode);
    setToastMessage(`Tank ${tankNo} inspection completed & returned to operational rotation`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="flex flex-col gap-6 w-full text-white font-bold">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-500/20 border border-emerald-500/50 text-white font-bold rounded-xl shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-white font-bold" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header Banner */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Wrench className="w-6 h-6 text-white font-bold" />
            <h2 className="text-lg sm:text-xl font-bold text-white font-bold">
              ISO Tank Maintenance, Repair & Overhaul (MRO) Hub
            </h2>
          </div>
          <p className="text-xs text-white font-bold max-w-2xl leading-relaxed">
            Out-of-cycle maintenance staging for cryogenic vacuum insulation loss, valve leaks, transmitter faults, and mandatory statutory ADR/IMDG re-certifications.
          </p>
        </div>

        <button
          onClick={() => setIsLogModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-600/20 transition-all cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report Fault / Log MRO Incident</span>
        </button>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-16 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <span className="text-[11px] font-bold uppercase text-white font-bold block mb-1">
            Active Tanks in MRO
          </span>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold font-mono text-white font-bold">{mroTanks.length}</span>
            <span className="text-xs text-white font-bold font-mono">Tanks Under Repair</span>
          </div>
          <span className="text-xs text-white font-bold">
            {((mroTanks.length / fleetTanks.length) * 100).toFixed(1)}% of 120 Fleet
          </span>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <span className="text-[11px] font-bold uppercase text-white font-bold block mb-1">
            Arun PAG Workshop
          </span>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold font-mono text-white font-bold">
              {mroTanks.filter((t) => t.maintenanceLocation === 'ARUN_WORKSHOP').length}
            </span>
            <span className="text-xs text-white font-bold font-mono">Tanks Staged</span>
          </div>
          <span className="text-xs text-white font-bold">Major Vacuum & Overhaul Depot</span>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <span className="text-[11px] font-bold uppercase text-white font-bold block mb-1">
            Nias MRO Field Bay
          </span>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold font-mono text-white font-bold">
              {mroTanks.filter((t) => t.maintenanceLocation === 'NIAS_MRO_BAY').length}
            </span>
            <span className="text-xs text-white font-bold font-mono">Tanks Staged</span>
          </div>
          <span className="text-xs text-white font-bold">Field Valve Gland & Sensor Repair</span>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <span className="text-[11px] font-bold uppercase text-white font-bold block mb-1">
            Operational Availability
          </span>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold font-mono text-white font-bold">
              {(((fleetTanks.length - mroTanks.length) / fleetTanks.length) * 100).toFixed(1)}%
            </span>
            <span className="text-xs text-white font-bold font-mono">Fleet Ready</span>
          </div>
          <span className="text-xs text-white font-bold">{fleetTanks.length - mroTanks.length} In Active Service</span>
        </div>
      </div>

      {/* Control Filter Bar */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-white font-bold absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search MRO Tanks, Defects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white font-bold focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setFilterCategory('ALL')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filterCategory === 'ALL'
                ? 'bg-slate-800 text-white font-bold font-bold'
                : 'text-white font-bold hover:text-white font-bold'
            }`}
          >
            All Faults ({mroTanks.length})
          </button>
          {(Object.keys(DEFECT_BADGES) as DefectCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2 py-1 rounded-md transition-colors text-[11px] whitespace-nowrap ${
                filterCategory === cat
                  ? 'bg-slate-800 text-white font-bold font-bold'
                  : 'text-white font-bold hover:text-white font-bold'
              }`}
            >
              {DEFECT_BADGES[cat].label}
            </button>
          ))}
        </div>
      </section>

      {/* MRO Tanks List */}
      <section className="space-y-3">
        {filteredMroTanks.map((tank) => {
          const badge = tank.defectCategory ? DEFECT_BADGES[tank.defectCategory] : DEFECT_BADGES.VALVE_LEAK;
          const isArun = tank.maintenanceLocation === 'ARUN_WORKSHOP';

          return (
            <div
              key={tank.tankNo}
              className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 hover:border-slate-700 transition-all"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6 text-white font-bold" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-base text-white font-bold">{tank.tankNo}</span>
                    <span className="text-xs text-white font-bold font-mono">({tank.serialNo})</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                      {badge.label}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-white font-bold font-mono flex items-center gap-1">
                      {isArun ? <Building2 className="w-3 h-3 text-white font-bold" /> : <MapPin className="w-3 h-3 text-white font-bold" />}
                      {isArun ? 'Arun Workshop' : 'Nias MRO Bay'}
                    </span>
                  </div>

                  <p className="text-xs text-white font-bold mb-2 leading-relaxed">
                    {tank.defectDescription || badge.desc}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-white font-bold">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-white font-bold" />
                      Started: {tank.repairStartedAt || '2026-08-13 10:00'}
                    </span>
                    <span>Pressure: {tank.pressureMPa.toFixed(2)} MPa</span>
                    <span>Temp: {tank.tempC.toFixed(1)}°C</span>
                    <span>Level: {tank.level}%</span>
                  </div>
                </div>
              </div>

              {/* Release Actions */}
              <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                <button
                  onClick={() =>
                    handleRelease(
                      tank.tankNo,
                      isArun ? NodeState.NODE_1_ARUN_PAG_TERMINAL : NodeState.NODE_3_NIAS_LAYDOWN_YARD
                    )
                  }
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete Inspection & Return to Service</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredMroTanks.length === 0 && (
          <div className="text-center py-16 bg-slate-900/30 border border-slate-800 rounded-2xl text-white font-bold text-sm">
            No tanks currently under maintenance matching the filter.
          </div>
        )}
      </section>

      {/* Log New Fault Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-white font-bold flex items-center gap-2">
                <Wrench className="w-5 h-5 text-white font-bold" />
                Report Tank Fault / Route to MRO
              </h3>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="text-white font-bold hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogFaultSubmit} className="space-y-4 text-xs">
              {/* Select Tank */}
              <div>
                <label className="block text-white font-bold mb-1 font-bold">Select ISO Tank:</label>
                <select
                  value={targetTankNo}
                  onChange={(e) => setTargetTankNo(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Choose Tank from 120 Fleet --</option>
                  {fleetTanks.map((t) => (
                    <option key={t.tankNo} value={t.tankNo}>
                      {t.tankNo} ({t.serialNo}) - Current: {t.location} / {t.position}
                    </option>
                  ))}
                </select>
              </div>

              {/* Defect Category */}
              <div>
                <label className="block text-white font-bold mb-1 font-bold">Defect Classification:</label>
                <select
                  value={defectCat}
                  onChange={(e) => setDefectCat(e.target.value as DefectCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="VACUUM_LOSS">Vacuum Loss (High BOG / Annular failure)</option>
                  <option value="VALVE_LEAK">Valve Leak (Liquid/Gas valve packing)</option>
                  <option value="INSTRUMENT_FAULT">Instrument Fault (Transmitter / RTD / Battery)</option>
                  <option value="STRUCTURE_DAMAGE">Structure Damage (Frame / Corner casting)</option>
                  <option value="PERIODIC_INSPECTION">Periodic Statutory Inspection (ADR/IMDG 2.5y)</option>
                </select>
              </div>

              {/* MRO Workshop Location */}
              <div>
                <label className="block text-white font-bold mb-1 font-bold">Repair Workshop Depot:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMroLocation('NIAS_MRO_BAY')}
                    className={`py-2 px-3 rounded-lg border text-center transition-all ${
                      mroLocation === 'NIAS_MRO_BAY'
                        ? 'bg-emerald-600/20 text-white font-bold border-emerald-500 font-bold'
                        : 'bg-slate-950 border-slate-800 text-white font-bold'
                    }`}
                  >
                    Nias MRO Field Bay
                  </button>
                  <button
                    type="button"
                    onClick={() => setMroLocation('ARUN_WORKSHOP')}
                    className={`py-2 px-3 rounded-lg border text-center transition-all ${
                      mroLocation === 'ARUN_WORKSHOP'
                        ? 'bg-blue-600/20 text-white font-bold border-blue-500 font-bold'
                        : 'bg-slate-950 border-slate-800 text-white font-bold'
                    }`}
                  >
                    Arun PAG Workshop
                  </button>
                </div>
              </div>

              {/* Defect Description */}
              <div>
                <label className="block text-white font-bold mb-1 font-bold">Defect Description / Inspection Findings:</label>
                <textarea
                  value={defectDesc}
                  onChange={(e) => setDefectDesc(e.target.value)}
                  placeholder="Describe observed leak, pressure drop, or sensor failure..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold shadow-md transition-colors"
                >
                  Submit Fault Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
