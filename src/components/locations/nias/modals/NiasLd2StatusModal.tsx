// src/components/locations/nias/modals/NiasLd2StatusModal.tsx
"use client";

import React from 'react';
import { NiasTankAsset } from '../../NiasTerminalView';

export interface NiasLd2StatusModalProps {
  // Trigger / tank data
  tank: NiasTankAsset;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;

  // Controlled form state — values
  ld2ModalPress: number;
  ld2ModalTemp: number;
  ld2ModalLevelMm: number;
  ld2ModalIsVenting: boolean;
  ld2ModalPreVentPress: number;
  ld2ModalPostVentPress: number;
  ld2ModalVentKg: number;
  ld2ModalRemarks: string;
  ld2ModalOperator: string;

  // Controlled form state — setters
  onPressChange: (v: number) => void;
  onTempChange: (v: number) => void;
  onLevelMmChange: (v: number) => void;
  onIsVentingChange: (checked: boolean) => void;
  onPreVentPressChange: (v: number) => void;
  onPostVentPressChange: (v: number) => void;
  onVentKgChange: (v: number) => void;
  onRemarksChange: (v: string) => void;
  onOperatorChange: (v: string) => void;
}

/**
 * LD-2 TANK STATUS & BOG VENT DIALOG MODAL (WIDTH: 800px).
 * Extracted from NiasTerminalView (lines 3392–3646).
 * Derived values (calcVol, calcMassKg, calcMassTon) computed internally from ld2ModalLevelMm.
 */
export default function NiasLd2StatusModal({
  tank,
  onClose,
  onSubmit,
  ld2ModalPress,
  ld2ModalTemp,
  ld2ModalLevelMm,
  ld2ModalIsVenting,
  ld2ModalPreVentPress,
  ld2ModalPostVentPress,
  ld2ModalVentKg,
  ld2ModalRemarks,
  ld2ModalOperator,
  onPressChange,
  onTempChange,
  onLevelMmChange,
  onIsVentingChange,
  onPreVentPressChange,
  onPostVentPressChange,
  onVentKgChange,
  onRemarksChange,
  onOperatorChange,
}: NiasLd2StatusModalProps) {
  // Derived telemetry (previously computed inside the IIFE)
  const calcVol = parseFloat(((ld2ModalLevelMm / 950) * 44.0).toFixed(1));
  const calcMassKg = Math.round(calcVol * 441.0);
  const calcMassTon = parseFloat(((calcVol * 441.0) / 1000).toFixed(2));

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150 font-mono"
      onClick={onClose}
    >
      <div
        className="w-[800px] max-w-[90vw] max-h-[92vh] flex flex-col bg-[#ece9d8] border-2 border-white border-b-2 border-r-2 border-slate-700 shadow-2xl rounded-xs overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#1e293b] text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-[#334155] shadow-xs shrink-0 select-none">
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-black tracking-wider uppercase text-white font-mono flex items-center gap-1.5">
              <span>💨</span>
              <span>LD-2 TANK STATUS &amp; BOG VENT: {tank.id}</span>
              <span className="text-amber-300 ml-1 font-bold">(SERIAL: {tank.serialNo || 'SIMU-820201'})</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="bg-[#c53030] hover:bg-[#e53e3e] active:bg-[#9b2c2c] text-white font-bold text-xs px-3.5 py-1.5 rounded-xs border-t border-l border-[#fc8181] border-b-2 border-r-2 border-[#742a2a] shadow-xs cursor-pointer select-none flex items-center gap-1 font-mono"
          >
            <span>✕ CLOSE</span>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={onSubmit} className="p-4 space-y-3.5 overflow-y-auto custom-scada-scrollbar bg-[#f0ede6]">
          {/* Status Info Strip */}
          <div className="bg-[#f4f1ea] border-2 border-[#b0aaa0] rounded-xs p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-inner text-xs">
            <div>
              <span className="font-bold text-slate-600 uppercase">ZONE: </span>
              <span className="font-black text-[#002b4d]">LAYDOWN YARD 2 (ORU LD-2)</span>
            </div>
            <div>
              <span className="font-bold text-slate-600 uppercase">STAGED: </span>
              <span className="font-bold text-slate-900">2026-08-28 (D+2 Days)</span>
            </div>
            <div>
              <span className="font-bold text-slate-600 uppercase">TARGET: </span>
              <span className="font-bold text-purple-900">MV. Saviour Backhaul</span>
            </div>
          </div>

          {/* Section 1: Real-time Gauge Telemetry */}
          <div className="bg-[#e8e4dc] border border-[#b0aaa0] rounded-xs p-3 shadow-xs space-y-2">
            <div className="text-[11px] font-black uppercase tracking-wider text-[#002b4d] border-b border-[#c8c2b5] pb-1 flex items-center gap-1.5">
              <span>[1] PHYSICAL GAUGE MEASUREMENTS &amp; RESIDUAL HEEL</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-700 uppercase mb-1 truncate text-center">
                  PRESSURE (MPa)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={ld2ModalPress}
                  onChange={(e) => onPressChange(parseFloat(e.target.value) || 0)}
                  className="bg-white border border-[#8b9aa8] rounded-xs px-2 py-1 text-slate-950 font-bold font-mono text-center text-sm shadow-inner focus:bg-amber-50 focus:outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-700 uppercase mb-1 truncate text-center">
                  TEMP (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={ld2ModalTemp}
                  onChange={(e) => onTempChange(parseFloat(e.target.value) || 0)}
                  className="bg-white border border-[#8b9aa8] rounded-xs px-2 py-1 text-slate-950 font-bold font-mono text-center text-sm shadow-inner focus:bg-amber-50 focus:outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-700 uppercase mb-1 truncate text-center">
                  LEVEL (mmH2O)
                </label>
                <input
                  type="number"
                  step="1"
                  value={ld2ModalLevelMm}
                  onChange={(e) => onLevelMmChange(parseFloat(e.target.value) || 0)}
                  className="bg-white border border-[#8b9aa8] rounded-xs px-2 py-1 text-slate-950 font-bold font-mono text-center text-sm shadow-inner focus:bg-amber-50 focus:outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-[#004a99] uppercase mb-1 truncate text-center">
                  CALC VOL (m³)
                </label>
                <div className="h-[30px] bg-[#f0f7ff] border border-[#7ba4cc] rounded-xs px-2 py-1 text-[#004a99] font-black font-mono text-center text-sm shadow-inner flex items-center justify-center">
                  {calcVol.toFixed(1)}
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-[#004a99] uppercase mb-1 truncate text-center">
                  CALC MASS (kg)
                </label>
                <div className="h-[30px] bg-[#f0f7ff] border border-[#7ba4cc] rounded-xs px-2 py-1 text-[#004a99] font-black font-mono text-center text-sm shadow-inner flex items-center justify-center">
                  {calcMassKg} kg ({calcMassTon} T)
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: BOG Venting & Controlled Depressurization Action */}
          <div className="bg-[#e8e4dc] border border-[#b0aaa0] rounded-xs p-3 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#c8c2b5] pb-1">
              <div className="text-[11px] font-black uppercase tracking-wider text-[#002b4d] flex items-center gap-1.5">
                <span>[2] BOG VENTING &amp; CONTROLLED DEPRESSURIZATION</span>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={ld2ModalIsVenting}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    onIsVentingChange(checked);
                    if (checked) {
                      onPreVentPressChange(ld2ModalPress || 0.70);
                      onPostVentPressChange(0.22);
                      const deltaP = Math.max(0, (ld2ModalPress || 0.70) - 0.22);
                      onVentKgChange(Math.round(deltaP * 450));
                    }
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800 font-mono">Perform BOG Venting</span>
              </label>
            </div>

            {ld2ModalIsVenting ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 animate-in fade-in duration-150">
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-slate-700 uppercase mb-1 truncate text-center">
                    PRE-VENT PRESS (MPa)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={ld2ModalPreVentPress}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      onPreVentPressChange(val);
                      const delta = Math.max(0, val - ld2ModalPostVentPress);
                      onVentKgChange(Math.round(delta * 450));
                    }}
                    className="bg-white border border-[#8b9aa8] rounded-xs px-2 py-1 text-slate-950 font-bold font-mono text-center text-sm shadow-inner focus:bg-amber-50 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-slate-700 uppercase mb-1 truncate text-center">
                    POST-VENT PRESS (MPa)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={ld2ModalPostVentPress}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      onPostVentPressChange(val);
                      const delta = Math.max(0, ld2ModalPreVentPress - val);
                      onVentKgChange(Math.round(delta * 450));
                    }}
                    className="bg-white border border-[#8b9aa8] rounded-xs px-2 py-1 text-slate-950 font-bold font-mono text-center text-sm shadow-inner focus:bg-amber-50 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-purple-900 uppercase mb-1 truncate text-center">
                    VENTED BOG AMOUNT (kg)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={ld2ModalVentKg}
                    onChange={(e) => onVentKgChange(parseFloat(e.target.value) || 0)}
                    className="bg-purple-50 border border-purple-400 rounded-xs px-2 py-1 text-purple-950 font-black font-mono text-center text-sm shadow-inner focus:bg-purple-100 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="p-2.5 bg-[#f4f1ea] border border-[#b0aaa0] rounded-xs text-center text-[11px] text-slate-600 font-bold">
                Holding pressure is within normal safe storage range. Check the box above if controlled venting is required before vessel backhaul.
              </div>
            )}
          </div>

          {/* Section 3: Operator Remarks & Inspector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2 flex flex-col">
              <label className="text-[11px] font-bold text-slate-700 uppercase mb-1">
                OPERATOR REMARKS
              </label>
              <input
                type="text"
                value={ld2ModalRemarks}
                onChange={(e) => onRemarksChange(e.target.value)}
                className="bg-white border border-[#8b9aa8] rounded-xs px-2.5 py-1.5 text-slate-950 font-semibold font-mono text-xs shadow-inner focus:bg-amber-50 focus:outline-none"
                placeholder="Staging inspection notes..."
              />
            </div>

            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-slate-700 uppercase mb-1">
                INSPECTOR
              </label>
              <input
                type="text"
                value={ld2ModalOperator}
                onChange={(e) => onOperatorChange(e.target.value)}
                className="bg-white border border-[#8b9aa8] rounded-xs px-2.5 py-1.5 text-slate-950 font-semibold font-mono text-xs shadow-inner focus:bg-amber-50 focus:outline-none"
                placeholder="Operator Name"
              />
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex justify-end items-center gap-2 pt-2 border-t border-[#c8c2b5]">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-4 bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-900 font-bold text-xs rounded-xs border-t border-l border-white border-b-2 border-r-2 border-slate-600 shadow-xs cursor-pointer select-none font-mono"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="h-8 px-6 bg-[#2f855a] hover:bg-[#38a169] active:bg-[#22543d] text-white font-bold text-xs rounded-xs border-t border-l border-[#48bb78] border-b-2 border-r-2 border-[#1c4d35] shadow-xs cursor-pointer select-none font-mono flex items-center gap-1.5"
            >
              <span>💾 SAVE STATUS &amp; VENT LOG</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
