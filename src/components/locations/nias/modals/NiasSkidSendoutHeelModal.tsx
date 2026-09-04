// src/components/locations/nias/modals/NiasSkidSendoutHeelModal.tsx
"use client";

import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { ActiveBayState } from '../../../../types/lng';
import { NiasTankAsset } from '../../NiasTerminalView';

export interface SkidSendoutHeelData {
  pressureMpa: number;
  levelMmH2O: number;
  heelVolM3: number;
  heelMassKg: number;
}

export interface NiasSkidSendoutHeelModalProps {
  isOpen?: boolean;
  targetTank: NiasTankAsset | null;
  activeBay?: ActiveBayState | null;
  rackTag?: string;
  currentMassKg?: number;
  remHours?: number;
  etaTimeStr?: string;
  onClose: () => void;
  onNavigateToSkid?: () => void;
  onConfirm?: (data: SkidSendoutHeelData) => void;
  onSubmit?: (data: SkidSendoutHeelData) => void;
  asModal?: boolean;
}

export function NiasSkidSendoutHeelModal({
  isOpen,
  targetTank,
  activeBay,
  rackTag,
  currentMassKg,
  remHours,
  etaTimeStr,
  onClose,
  onNavigateToSkid,
  onConfirm,
  onSubmit,
  asModal = false,
}: NiasSkidSendoutHeelModalProps) {
  const [modalFinalPressMpa, setModalFinalPressMpa] = useState<string>('0.22');
  const [modalFinalLevelMmH2O, setModalFinalLevelMmH2O] = useState<string>('50');
  const [modalFinalHeelVolM3, setModalFinalHeelVolM3] = useState<string>('1.0');
  const [modalFinalHeelMassKg, setModalFinalHeelMassKg] = useState<string>('420');

  if (isOpen === false || !targetTank) return null;

  const tank = targetTank;
  const resolvedMassKg = currentMassKg ?? Math.round((tank.levelPercent / 100) * 18200);
  const usableKg = Math.max(0, resolvedMassKg - 420);
  const resolvedRemHours = remHours ?? (usableKg / 900);
  const etaDate = new Date(Date.now() + resolvedRemHours * 3600 * 1000);
  const resolvedEtaTimeStr =
    etaTimeStr ??
    `${String(etaDate.getHours()).padStart(2, '0')}:${String(etaDate.getMinutes()).padStart(2, '0')}`;
  const resolvedRackTag =
    rackTag ??
    (activeBay
      ? activeBay.bayId
      : tank.currentZone.includes('01')
        ? 'T-201'
        : tank.currentZone.includes('02')
          ? 'T-202'
          : tank.currentZone.includes('03')
            ? 'T-203'
            : tank.currentZone.includes('04')
              ? 'T-204'
              : tank.currentZone);

  const handleCompleteClick = () => {
    const parsedVol = parseFloat(modalFinalHeelVolM3) || 1.0;
    const parsedMass = parseFloat(modalFinalHeelMassKg) || 420;
    const parsedMm = parseFloat(modalFinalLevelMmH2O) || 50;
    const parsedPress = parseFloat(modalFinalPressMpa) || 0.22;
    const submitFn = onConfirm || onSubmit;
    if (submitFn) {
      submitFn({
        pressureMpa: parsedPress,
        levelMmH2O: parsedMm,
        heelVolM3: parsedVol,
        heelMassKg: parsedMass,
      });
    }
  };

  const sectionsContent = (
    <div className="space-y-3.5">
      {/* Section 1: Heel Target */}
      <div className="win-panel p-3 bg-white border border-slate-300 space-y-2.5">
        <div className="flex justify-between items-center border-b border-slate-200 pb-1 text-slate-800">
          <h4 className="font-bold text-xs uppercase tracking-wider text-blue-950 font-sans">
            Heel Target
          </h4>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Card 1: Current vs Target Volume */}
          <div className="win-sunken bg-slate-50 border border-slate-200 min-h-[130px] flex flex-col justify-between py-2.5 px-2 items-center text-center">
            <span className="text-xs font-semibold text-slate-600 font-sans">Current Volume</span>
            <strong className="font-mono text-lg font-bold text-slate-800 my-0.5">
              {(tank.levelPercent * 0.44).toFixed(1)} m³
            </strong>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xs text-slate-500 font-mono">
                Target: 1.0 m³ Cutoff
              </span>
              <span className="text-xs font-semibold text-emerald-600 font-mono">
                ~{Math.max(0, (tank.levelPercent * 0.44) - 1.0).toFixed(1)} m³ Remaining
              </span>
            </div>
          </div>

          {/* Card 2: Liquid Level Gauge */}
          <div className="win-sunken bg-slate-50 border border-slate-200 min-h-[130px] flex flex-col justify-between py-2.5 px-2 items-center text-center">
            <span className="text-xs font-semibold text-slate-600 font-sans">Level Gauge (Field)</span>
            <strong className="font-mono text-lg font-bold text-slate-800 my-0.5">
              {tank.levelMmH2O || Math.round(tank.levelPercent * 10)} mmH2O
            </strong>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xs text-slate-500 font-mono">
                {tank.levelPercent.toFixed(1)}% ({(tank.levelPercent * 0.44).toFixed(1)} m³)
              </span>
              <span className="text-xs font-semibold text-blue-600 font-mono">
                Limit: 120 mmH2O
              </span>
            </div>
          </div>

          {/* Card 3: Active Tank Mass */}
          <div className="win-sunken bg-slate-50 border border-slate-200 min-h-[130px] flex flex-col justify-between py-2.5 px-2 items-center text-center">
            <span className="text-xs font-semibold text-slate-600 font-sans">Active Tank Mass</span>
            <strong className="font-mono text-lg font-bold text-emerald-700 my-0.5">
              {resolvedMassKg.toLocaleString()} kg
            </strong>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xs text-slate-500 font-mono">
                Swap Limit: 13,222 kg
              </span>
              <span
                className={`text-[11px] font-bold font-mono ${
                  resolvedMassKg <= 13222 ? 'text-amber-600' : 'text-emerald-700'
                }`}
              >
                {resolvedMassKg <= 13222 ? '[SWAP REQ ACTIVE]' : '[FEEDING STABLE]'}
              </span>
            </div>
          </div>

          {/* Card 4: Heel 1.0m³ Cutoff ETA */}
          <div className="win-sunken bg-slate-50 border border-slate-200 min-h-[130px] flex flex-col justify-between py-2.5 px-2 items-center text-center">
            <span className="text-xs font-semibold text-slate-600 font-sans">1.0m³ Cutoff ETA</span>
            <strong className="font-mono text-lg font-bold text-amber-600 my-0.5">
              ~{resolvedRemHours.toFixed(1)} Hours
            </strong>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xs font-semibold text-slate-700 font-mono">
                Target Time: {resolvedEtaTimeStr}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                PLTMG 18.5 MW Load
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Current Telemetry & Final Heel Input */}
      <div className="win-panel p-3 bg-white border border-slate-300 space-y-2">
        <div className="flex justify-between items-center border-b border-slate-200 pb-1">
          <h4 className="font-bold text-xs uppercase tracking-wider text-blue-950 font-sans">
            Current Telemetry &amp; Final Heel Input
          </h4>
        </div>
        <div className="overflow-x-auto border border-slate-300 rounded-none">
          <table className="w-full text-xs font-mono text-left border-collapse">
            <thead className="bg-slate-800 text-slate-200">
              <tr className="h-10">
                <th className="px-4 text-left font-semibold border-r border-slate-700 w-1/4">Parameter</th>
                <th className="px-3 text-center font-semibold border-r border-slate-700 w-1/4">SCADA Telemetry</th>
                <th className="px-3 text-center font-semibold border-r border-slate-700 w-1/4 bg-amber-950/40 text-amber-200">
                  Final Field Input (Dial / Gauge)
                </th>
                <th className="px-3 text-center font-semibold w-1/4">Target Limit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              <tr className="h-11 border-b border-slate-200 hover:bg-slate-50">
                <td className="px-4 font-bold text-slate-800 border-r border-slate-200">Tank Pressure</td>
                <td className="px-3 text-center text-slate-900 font-bold border-r border-slate-200">
                  {(tank.pressureMpa || 0.758).toFixed(3)} MPa
                </td>
                <td className="px-3 text-center border-r border-slate-200 bg-amber-50/40">
                  <div className="flex items-center justify-center gap-1.5">
                    <input
                      type="text"
                      value={modalFinalPressMpa}
                      onChange={(e) => setModalFinalPressMpa(e.target.value)}
                      className="w-16 h-7 text-center font-bold text-slate-800 bg-white border border-slate-300 rounded shadow-inner focus:outline-blue-500 text-xs font-mono"
                      placeholder="0.22"
                    />
                    <span className="w-12 text-left text-xs text-slate-600 font-medium font-mono">MPa</span>
                  </div>
                </td>
                <td className="px-3 text-center text-xs font-medium text-slate-600 font-mono">
                  0.400 MPa (Safe Vent)
                </td>
              </tr>
              <tr className="h-11 border-b border-slate-200 hover:bg-slate-50">
                <td className="px-4 font-bold text-slate-800 border-r border-slate-200">Liquid Level</td>
                <td className="px-3 text-center text-slate-900 font-bold border-r border-slate-200">
                  {tank.levelPercent.toFixed(1)}% ({(tank.levelPercent * 0.44).toFixed(1)} m³)
                </td>
                <td className="px-3 text-center border-r border-slate-200 bg-amber-50/40">
                  <div className="flex items-center justify-center gap-1.5">
                    <input
                      type="text"
                      value={modalFinalLevelMmH2O}
                      onChange={(e) => setModalFinalLevelMmH2O(e.target.value)}
                      className="w-16 h-7 text-center font-bold text-slate-800 bg-white border border-slate-300 rounded shadow-inner focus:outline-blue-500 text-xs font-mono"
                      placeholder="50"
                    />
                    <span className="w-12 text-left text-xs text-slate-600 font-medium font-mono">mmH2O</span>
                  </div>
                </td>
                <td className="px-3 text-center text-xs font-medium text-slate-600 font-mono">
                  50 mmH2O (Target)
                </td>
              </tr>
              <tr className="h-11 border-b border-slate-200 hover:bg-slate-50">
                <td className="px-4 font-bold text-slate-800 border-r border-slate-200">Final Heel Volume</td>
                <td className="px-3 text-center text-slate-900 font-bold border-r border-slate-200">
                  {(tank.levelPercent * 0.44).toFixed(1)} m³
                </td>
                <td className="px-3 text-center border-r border-slate-200 bg-amber-50/40">
                  <div className="flex items-center justify-center gap-1.5">
                    <input
                      type="text"
                      value={modalFinalHeelVolM3}
                      onChange={(e) => {
                        const val = e.target.value;
                        setModalFinalHeelVolM3(val);
                        const parsed = parseFloat(val);
                        if (!isNaN(parsed)) {
                          setModalFinalHeelMassKg(String(Math.round(parsed * 420)));
                        }
                      }}
                      className="w-16 h-7 text-center font-bold text-slate-800 bg-white border border-slate-300 rounded shadow-inner focus:outline-blue-500 text-xs font-mono"
                      placeholder="1.0"
                    />
                    <span className="w-12 text-left text-xs text-slate-600 font-medium font-mono">m³</span>
                  </div>
                </td>
                <td className="px-3 text-center text-xs font-medium text-slate-600 font-mono">
                  1.0 m³ (Cutoff)
                </td>
              </tr>
              <tr className="h-11 border-b border-slate-200 hover:bg-slate-50">
                <td className="px-4 font-bold text-slate-800 border-r border-slate-200">Final Heel Mass</td>
                <td className="px-3 text-center text-slate-900 font-bold border-r border-slate-200">
                  {resolvedMassKg.toLocaleString()} kg
                </td>
                <td className="px-3 text-center border-r border-slate-200 bg-amber-50/40">
                  <div className="flex items-center justify-center gap-1.5">
                    <input
                      type="text"
                      value={modalFinalHeelMassKg}
                      onChange={(e) => setModalFinalHeelMassKg(e.target.value)}
                      className="w-16 h-7 text-center font-bold text-slate-800 bg-white border border-slate-300 rounded shadow-inner focus:outline-blue-500 text-xs font-mono"
                      placeholder="420"
                    />
                    <span className="w-12 text-left text-xs text-slate-600 font-medium font-mono">kg</span>
                  </div>
                </td>
                <td className="px-3 text-center text-xs font-medium text-slate-600 font-mono">
                  ~420 kg (Heel)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Skid Operations */}
      <div className="win-panel p-3 bg-[#e5e3dc] border border-slate-300 space-y-2">
        <h4 className="font-bold text-xs uppercase tracking-wider text-blue-950 font-sans">
          Skid Operations
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onNavigateToSkid || onClose}
            className="win-btn bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-400 font-mono font-bold text-xs py-2 px-3 cursor-pointer text-center shadow-xs flex items-center justify-center gap-1.5"
          >
            To ORU ( ISO TK - SKID ) (Tab 3)
          </button>

          <button
            type="button"
            onClick={handleCompleteClick}
            className="win-btn bg-[#002b4d] hover:bg-[#003d6d] text-white border border-[#001e36] font-mono font-bold text-xs py-2 px-3 cursor-pointer text-center shadow-xs flex items-center justify-center gap-1.5"
          >
            Complete &amp; To LD-2
          </button>
        </div>
      </div>
    </div>
  );

  if (asModal) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        onClick={onClose}
      >
        <div
          className="win-window border-2 border-slate-400 max-w-4xl w-full p-0 shadow-2xl animate-in zoom-in-95 max-h-[92vh] flex flex-col overflow-hidden select-none bg-[#d4d0c8]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Titlebar */}
          <div className="bg-[#002b4d] text-white px-4 py-2 flex justify-between items-center select-none border-b border-blue-900">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-sm uppercase tracking-wider">
                Active Skid Sendout Monitor — {tank.id} ({resolvedRackTag})
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-300 hover:text-white font-mono font-bold text-sm px-2 py-0.5 rounded hover:bg-white/10 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="p-4 overflow-y-auto flex-1 text-xs sm:text-sm">
            {sectionsContent}
          </div>
        </div>
      </div>
    );
  }

  return sectionsContent;
}

export default NiasSkidSendoutHeelModal;
