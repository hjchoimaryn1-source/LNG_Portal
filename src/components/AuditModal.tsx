// src/components/AuditModal.tsx
"use client";

import React from 'react';
import { RotateCcw } from 'lucide-react';
import { FleetTankItem } from '../data/mockTankData';

interface AuditModalProps {
  tankNo: string | null;
  onClose: () => void;
  fleetTanks: FleetTankItem[];
}

export default function AuditModal({
  tankNo,
  onClose,
  fleetTanks,
}: AuditModalProps) {
  if (!tankNo) return null;
  const tank = fleetTanks.find((t) => t.tankNo === tankNo);
  if (!tank) return null;

  const stage1 = tank.offloadHeelMetrics || {
    offloadDate: '2026-08-10 14:00',
    heelLevelPct: 4.2,
    heelVolumeM3: 1.0,
    heelMmH2O: 38,
    heelMassKg: 445,
    holdingPressureMPa: 0.21,
    tempC: -136.0,
    bayId: 'Bay 01',
  };

  const stage2 = tank.backhaulDepartureMetrics || {
    departureDate: '2026-08-11 09:30',
    departureLevelPct: 4.0,
    departureMassKg: 445,
    departurePressureMPa: 0.24,
    departureTempC: -133.5,
    manifestNo: 'BHM-202608-001',
    vesselName: 'MV. Saviour',
    safetyClearance: true,
  };

  const stage3 = tank.arrivalHeelMetrics || {
    arrivalDate: '2026-08-13 11:15',
    arrivalMassKg: 430,
    arrivalPressureMPa: 0.31,
    arrivalTempC: -129.0,
    tareWeightKg: 10850,
    grossWeightKg: 11280,
    inspectorRemarks: 'Arun PAG arrival inspection: ~430 kg (1.0 m³) cold heel verified intact.',
  };

  const massLoss = tank.voyageHeelLoss?.massLossKg ?? Math.max(0, stage2.departureMassKg - stage3.arrivalMassKg);
  const pressRise = tank.voyageHeelLoss?.pressureRiseMPa ?? parseFloat(Math.max(0, stage3.arrivalPressureMPa - stage2.departurePressureMPa).toFixed(3));
  const efficiency = tank.voyageHeelLoss?.preservationEfficiencyPct ?? parseFloat(((stage3.arrivalMassKg / stage2.departureMassKg) * 100).toFixed(1));
  const heelCredit = tank.voyageHeelLoss?.heelCreditMMBtu ?? parseFloat(((stage3.arrivalMassKg * 52215) / 1000000 * 0.947817 * 0.001055).toFixed(2));

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="border-2 border-slate-400 bg-[#d4d0c8] shadow-2xl w-[92vw] max-w-5xl rounded-none flex flex-col overflow-hidden text-slate-900 font-sans"
      >
        {/* Modal Header Strip */}
        <div className="bg-[#0a2558] text-white font-bold px-4 py-2.5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <RotateCcw className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-xs sm:text-sm font-black tracking-wide">
              ISO Tank Closed-Loop Heel & Transit Audit Console — [Tank UID: {tank.tankNo} ({tank.serialNo})]
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="win-btn px-2.5 py-0.5 text-xs font-bold text-slate-900 hover:bg-slate-300 cursor-pointer"
          >
            Close (ESC)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3 bg-[#ece9d8] overflow-y-auto max-h-[75vh]">
          {/* 3-Column Telemetry Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Column 1: 1. NIAS OFFLOAD SPEC */}
            <div className="win-panel bg-white border border-slate-300 p-3 space-y-2">
              <div className="bg-[#0a2558] px-2 py-1 flex justify-between items-center text-white">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-100">
                  1. NIAS OFFLOAD SPEC
                </span>
                <span className="text-[10px] font-mono text-slate-200">{stage1.offloadDate}</span>
              </div>
              <div className="space-y-1.5 text-xs font-mono text-slate-800 pt-1">
                <div className="flex justify-between border-b border-slate-100 pb-0.5">
                  <span className="text-slate-600 font-bold">Heel Mass:</span>
                  <strong className="text-slate-950 font-black">{stage1.heelMassKg} kg</strong>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-0.5">
                  <span className="text-slate-600 font-bold">Heel Level:</span>
                  <strong className="text-slate-950 font-black">{stage1.heelLevelPct}% ({stage1.heelVolumeM3} m³)</strong>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-0.5">
                  <span className="text-slate-600 font-bold">Holding Press:</span>
                  <strong className="text-slate-950 font-bold">{stage1.holdingPressureMPa.toFixed(2)} MPa</strong>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-0.5">
                  <span className="text-slate-600 font-bold">Cryo Temp:</span>
                  <strong className="text-slate-950 font-bold">{stage1.tempC.toFixed(1)} °C</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-bold">Offload Bay:</span>
                  <strong className="text-blue-900 font-bold">{stage1.bayId || 'Bay 01'}</strong>
                </div>
              </div>
            </div>

            {/* Column 2: 2. NIAS DEPARTURE SPEC */}
            <div className="win-panel bg-white border border-slate-300 p-3 space-y-2">
              <div className="bg-[#0a2558] px-2 py-1 flex justify-between items-center text-white">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-100">
                  2. NIAS DEPARTURE SPEC
                </span>
                <span className="text-[10px] font-mono text-slate-200">{stage2.departureDate}</span>
              </div>
              <div className="space-y-1.5 text-xs font-mono text-slate-800 pt-1">
                <div className="flex justify-between border-b border-slate-100 pb-0.5">
                  <span className="text-slate-600 font-bold">Manifest No:</span>
                  <strong className="text-slate-950 font-black">{stage2.manifestNo}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-0.5">
                  <span className="text-slate-600 font-bold">Departure Mass:</span>
                  <strong className="text-slate-950 font-black">{stage2.departureMassKg} kg</strong>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-0.5">
                  <span className="text-slate-600 font-bold">Departure Press:</span>
                  <strong className="text-slate-950 font-bold">{stage2.departurePressureMPa.toFixed(2)} MPa</strong>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-0.5">
                  <span className="text-slate-600 font-bold">Departure Temp:</span>
                  <strong className="text-slate-950 font-bold">{stage2.departureTempC?.toFixed(1) || '-133.5'} °C</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-bold">Safety Status:</span>
                  <strong className="text-emerald-700 font-bold">VALVES LOCKED / SEALED</strong>
                </div>
              </div>
            </div>

            {/* Column 3: 3. ARUN ARRIVAL BASELINE */}
            <div className="win-panel bg-white border border-slate-300 p-3 space-y-2">
              <div className="bg-[#0a2558] px-2 py-1 flex justify-between items-center text-white">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-100">
                  3. ARUN ARRIVAL BASELINE
                </span>
                <span className="text-[10px] font-mono text-slate-200">{stage3.arrivalDate}</span>
              </div>
              <div className="space-y-1.5 text-xs font-mono text-slate-800 pt-1">
                <div className="flex justify-between border-b border-slate-100 pb-0.5">
                  <span className="text-slate-600 font-bold">Baseline Tare:</span>
                  <strong className="text-slate-950 font-black">{stage3.tareWeightKg || 10850} kg</strong>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-0.5">
                  <span className="text-slate-600 font-bold">Measured Heel:</span>
                  <strong className="text-slate-950 font-black">{stage3.arrivalMassKg} kg</strong>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-0.5">
                  <span className="text-slate-600 font-bold">Holding Press:</span>
                  <strong className="text-slate-950 font-bold">{stage3.arrivalPressureMPa.toFixed(2)} MPa</strong>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-0.5">
                  <span className="text-slate-600 font-bold">Holding Temp:</span>
                  <strong className="text-slate-950 font-bold">{stage3.arrivalTempC.toFixed(1)} °C</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-bold">Cryo Integrity:</span>
                  <strong className="text-emerald-700 font-bold">IN-SPEC / VACUUM NORMAL</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Bottom Summary Strip (Grid with Inset SCADA Frames) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white win-panel p-3 border border-slate-300 font-mono text-xs">
            <div className="bg-slate-50 p-2 border border-slate-200">
              <span className="text-[10px] text-slate-600 font-bold uppercase block font-sans">
                Voyage BOG Loss
              </span>
              <span className="font-black text-sm text-slate-950">Δ {massLoss} kg</span>
              <span className="text-[10px] text-slate-500 block">Departure → Arrival</span>
            </div>
            <div className="bg-slate-50 p-2 border border-slate-200">
              <span className="text-[10px] text-slate-600 font-bold uppercase block font-sans">
                Pressure Rise
              </span>
              <span className="font-black text-sm text-slate-950">+{pressRise} MPa</span>
              <span className="text-[10px] text-slate-500 block">Normal Cryo Rise</span>
            </div>
            <div className="bg-slate-50 p-2 border border-slate-200">
              <span className="text-[10px] text-slate-600 font-bold uppercase block font-sans">
                Preservation Efficiency
              </span>
              <span className="font-black text-sm text-emerald-700">{efficiency}%</span>
              <span className="text-[10px] text-slate-500 block">Cold Vacuum Retained</span>
            </div>
            <div className="bg-slate-50 p-2 border border-slate-200">
              <span className="text-[10px] text-slate-600 font-bold uppercase block font-sans">
                Heel Energy Credit
              </span>
              <span className="font-black text-sm text-blue-900">-{heelCredit} MMBtu</span>
              <span className="text-[10px] text-slate-500 block">Deducted from Baseline</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#d4d0c8] border-t border-slate-300 px-4 py-2 flex justify-between items-center shrink-0">
          <span className="text-xs font-mono font-bold text-slate-700">
            Audit Log Reference: #AUD-{tank.tankNo}-2026
          </span>
          <button
            type="button"
            onClick={onClose}
            className="win-btn px-4 py-1 text-xs font-bold text-slate-900 cursor-pointer"
          >
            Close Window (ESC)
          </button>
        </div>
      </div>
    </div>
  );
}
