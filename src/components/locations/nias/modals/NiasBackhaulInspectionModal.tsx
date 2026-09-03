// src/components/locations/nias/modals/NiasBackhaulInspectionModal.tsx
"use client";

import React from 'react';
import { Ship, XCircle, ShieldCheck } from 'lucide-react';

export interface NiasBackhaulInspectionModalProps {
  // Trigger
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;

  // Read-only context
  selectedBackhaulTanks: Set<string>;

  // Controlled form state — values
  stage2ManifestNo: string;
  stage2VesselName: string;
  stage2Date: string;
  stage2MassKg: number;
  stage2PressureMPa: number;
  stage2TempC: number;
  stage2ValvesSealed: boolean;
  stage2PressureWithinLimit: boolean;
  stage2VacuumIntact: boolean;
  stage2Remarks: string;

  // Controlled form state — setters
  onManifestNoChange: (v: string) => void;
  onVesselNameChange: (v: string) => void;
  onDateChange: (v: string) => void;
  onMassKgChange: (v: number) => void;
  onPressureMPaChange: (v: number) => void;
  onTempCChange: (v: number) => void;
  onValvesSealedChange: (v: boolean) => void;
  onPressureWithinLimitChange: (v: boolean) => void;
  onVacuumIntactChange: (v: boolean) => void;
  onRemarksChange: (v: string) => void;
}

/**
 * Stage 2: Pre-Backhaul Departure Inspection Modal (Laydown 3 → Ship).
 * Extracted from NiasTerminalView (lines 3656–3833).
 * All side-effect logic (authorizeBackhaulClearance, toast, inventory update)
 * is handled by the parent via onSubmit.
 */
export default function NiasBackhaulInspectionModal({
  isOpen,
  onClose,
  onSubmit,
  selectedBackhaulTanks,
  stage2ManifestNo,
  stage2VesselName,
  stage2Date,
  stage2MassKg,
  stage2PressureMPa,
  stage2TempC,
  stage2ValvesSealed,
  stage2PressureWithinLimit,
  stage2VacuumIntact,
  stage2Remarks,
  onManifestNoChange,
  onVesselNameChange,
  onDateChange,
  onMassKgChange,
  onPressureMPaChange,
  onTempCChange,
  onValvesSealedChange,
  onPressureWithinLimitChange,
  onVacuumIntactChange,
  onRemarksChange,
}: NiasBackhaulInspectionModalProps) {
  if (!isOpen) return null;

  const allChecked = stage2ValvesSealed && stage2PressureWithinLimit && stage2VacuumIntact;

  return (
    <div className="fixed inset-0 z-50 win-panel/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white shadow-none border border-slate-200 rounded-none max-w-xl w-full p-6 shadow-none animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-bold text-slate-950 font-bold flex items-center gap-2">
            <Ship className="w-5 h-5 text-slate-950 font-bold" />
            Stage 2: Pre-Backhaul Inspection &amp; Marine Manifest
          </h3>
          <button onClick={onClose} className="text-slate-950 font-bold hover:text-slate-950">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-950 font-bold mb-4">
          Pre-departure inspection for{' '}
          <span className="font-bold text-slate-950 font-bold">
            {selectedBackhaulTanks.size} selected heel tanks
          </span>{' '}
          before loading aboard{' '}
          <span className="font-bold text-slate-950 font-bold">{stage2VesselName}</span>:
        </p>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          {/* Selected Tanks Pill List */}
          <div className="p-3 win-panel rounded-none border border-slate-200">
            <span className="text-[10px] text-slate-950 font-bold uppercase block font-bold mb-1.5">
              Selected Tanks for Backhaul ({selectedBackhaulTanks.size})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {Array.from(selectedBackhaulTanks).map((tNo) => (
                <span
                  key={tNo}
                  className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800 text-slate-950 font-bold font-mono text-[11px] font-bold"
                >
                  {tNo}
                </span>
              ))}
            </div>
          </div>

          {/* Manifest Metadata */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-950 font-bold mb-1 font-bold">Backhaul Manifest No:</label>
              <input
                type="text"
                value={stage2ManifestNo}
                onChange={(e) => onManifestNoChange(e.target.value)}
                className="w-full win-panel border border-slate-200 rounded-none px-1.5 py-0.5 text-slate-950 font-bold font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-950 font-bold mb-1 font-bold">Vessel Assignment:</label>
              <input
                type="text"
                value={stage2VesselName}
                onChange={(e) => onVesselNameChange(e.target.value)}
                className="w-full win-panel border border-slate-200 rounded-none px-1.5 py-0.5 text-slate-950 font-bold font-mono font-bold"
              />
            </div>
          </div>

          {/* Departure Inspection Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-950 font-bold mb-1 font-bold">Departure Date &amp; Time:</label>
              <input
                type="text"
                value={stage2Date}
                onChange={(e) => onDateChange(e.target.value)}
                placeholder="YYYY-MM-DD HH:mm"
                className="w-full win-panel border border-slate-200 rounded-none px-1.5 py-0.5 text-slate-950 font-bold font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-950 font-bold mb-1 font-bold">Departure Heel Mass (Kg):</label>
              <input
                type="number"
                value={stage2MassKg}
                onChange={(e) => onMassKgChange(parseFloat(e.target.value) || 0)}
                className="w-full win-panel border border-slate-200 rounded-none px-1.5 py-0.5 text-slate-950 font-bold font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-950 font-bold mb-1 font-bold">Departure Pressure (MPa):</label>
              <input
                type="number"
                step="0.01"
                value={stage2PressureMPa}
                onChange={(e) => onPressureMPaChange(parseFloat(e.target.value) || 0)}
                className="w-full win-panel border border-slate-200 rounded-none px-1.5 py-0.5 text-slate-950 font-bold font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-950 font-bold mb-1 font-bold">Departure Temperature (°C):</label>
              <input
                type="number"
                step="0.5"
                value={stage2TempC}
                onChange={(e) => onTempCChange(parseFloat(e.target.value) || 0)}
                className="w-full win-panel border border-slate-200 rounded-none px-1.5 py-0.5 text-slate-950 font-bold font-mono font-bold"
              />
            </div>
          </div>

          {/* Safety Clearance Checklist */}
          <div className="p-3.5 win-panel/80 rounded-none border border-slate-200 space-y-2">
            <span className="text-[10px] text-slate-950 font-bold uppercase font-bold block flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-slate-950 font-bold" /> Marine Safety Clearance Checklist (IMDG 2.1)
            </span>
            <label className="flex items-center gap-2 text-slate-950 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={stage2ValvesSealed}
                onChange={(e) => onValvesSealedChange(e.target.checked)}
                className="rounded bg-white shadow-none border-slate-200 text-slate-950 font-bold focus:ring-purple-500"
              />
              <span>Primary liquid &amp; vapor valves closed, capped, and blind flanges tightened</span>
            </label>
            <label className="flex items-center gap-2 text-slate-950 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={stage2PressureWithinLimit}
                onChange={(e) => onPressureWithinLimitChange(e.target.checked)}
                className="rounded bg-white shadow-none border-slate-200 text-slate-950 font-bold focus:ring-purple-500"
              />
              <span>Holding pressure &lt; 0.40 MPa (adequate voyage safety holding margin)</span>
            </label>
            <label className="flex items-center gap-2 text-slate-950 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={stage2VacuumIntact}
                onChange={(e) => onVacuumIntactChange(e.target.checked)}
                className="rounded bg-white shadow-none border-slate-200 text-slate-950 font-bold focus:ring-purple-500"
              />
              <span>Outer jacket vacuum insulation intact (no shell condensation / frost observed)</span>
            </label>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-slate-950 font-bold mb-1 font-bold">Clearance Remarks:</label>
            <input
              type="text"
              value={stage2Remarks}
              onChange={(e) => onRemarksChange(e.target.value)}
              className="w-full win-panel border border-slate-200 rounded-none px-1.5 py-0.5 text-slate-950 font-bold text-xs"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-100 text-slate-950 font-bold rounded-none font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!allChecked}
              className={`flex-1 py-2.5 rounded-none font-bold transition-all ${
                allChecked
                  ? 'bg-purple-600 hover:bg-purple-500 text-slate-950 shadow-none shadow-purple-600/25 cursor-pointer'
                  : 'bg-slate-100 text-slate-950 font-bold cursor-not-allowed'
              }`}
            >
              Certify Manifest &amp; Dispatch to Saviour
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
