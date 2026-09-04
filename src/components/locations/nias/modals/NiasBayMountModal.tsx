// src/components/locations/nias/modals/NiasBayMountModal.tsx
"use client";

import React from 'react';
import { PlusCircle, XCircle } from 'lucide-react';
import { NiasTankAsset } from '../../NiasTerminalView';

export interface NiasBayMountModalProps {
  isOpen: boolean;
  bayId: string | null;
  availableTanks: NiasTankAsset[];
  onMount: (bayId: string, tankId: string) => void;
  onClose: () => void;
}

export function NiasBayMountModal({
  isOpen,
  bayId,
  availableTanks,
  onMount,
  onClose,
}: NiasBayMountModalProps) {
  if (!isOpen || !bayId) return null;

  return (
    <div className="fixed inset-0 z-50 win-panel/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white shadow-none border border-slate-200 rounded-none max-w-lg w-full p-6 shadow-none animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-slate-950 font-bold flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-slate-950 font-bold" />
            Mount ISO Tank to {bayId}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-950 font-bold hover:text-slate-950"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-slate-950 font-bold mb-4">
          Select an available ISO Tank from Nias Laydown Yard (Ready for Mount) or Yard 1/2:
        </p>

        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 mb-6">
          {availableTanks.map((tank) => (
            <div
              key={tank.id}
              onClick={() => {
                onMount(bayId, tank.id);
                onClose();
              }}
              className="p-3 rounded-none win-panel border border-slate-200 hover:border-blue-500 hover:bg-slate-100 cursor-pointer flex items-center justify-between transition-colors"
            >
              <div>
                <span className="font-mono font-bold text-sm text-slate-950 font-bold">{tank.id}</span>
                <span className="text-xs text-slate-950 font-bold font-mono ml-2">({tank.serialNo})</span>
                <span className="text-[10px] text-slate-950 font-bold block">{tank.currentZone}</span>
              </div>
              <div className="text-right text-xs font-mono">
                <span className="text-slate-950 font-bold font-bold block">{tank.levelPercent}% Level</span>
                <span className="text-slate-950 font-bold">{(tank.pressureMpa || 0).toFixed(2)} MPa</span>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 bg-slate-100 hover:bg-slate-100 text-slate-950 font-bold rounded-none text-xs font-bold transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default NiasBayMountModal;
