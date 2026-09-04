// src/components/locations/nias/modals/NiasMroModal.tsx
"use client";

import React from 'react';
import { Wrench, XCircle } from 'lucide-react';
import { DefectCategory } from '../../../../types/lng';

export interface NiasMroModalProps {
  isOpen: boolean;
  tankNo: string | null;
  defectCat: DefectCategory;
  setDefectCat: (cat: DefectCategory) => void;
  defectDesc: string;
  setDefectDesc: (desc: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function NiasMroModal({
  isOpen,
  tankNo,
  defectCat,
  setDefectCat,
  defectDesc,
  setDefectDesc,
  onSubmit,
  onClose,
}: NiasMroModalProps) {
  if (!isOpen || !tankNo) return null;

  return (
    <div className="fixed inset-0 z-50 win-panel/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white shadow-none border border-slate-200 rounded-none max-w-md w-full p-6 shadow-none animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-slate-950 font-bold flex items-center gap-2">
            <Wrench className="w-5 h-5 text-slate-950 font-bold" />
            Send {tankNo} to Nias MRO Bay
          </h3>
          <button
            onClick={onClose}
            className="text-slate-950 font-bold hover:text-slate-950"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-950 font-bold mb-1 font-bold">Defect Classification:</label>
            <select
              value={defectCat}
              onChange={(e) => setDefectCat(e.target.value as DefectCategory)}
              className="w-full win-panel border border-slate-200 rounded-none px-1.5 py-0.5 text-slate-950 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="VALVE_LEAK">Valve Leak (Liquid/Gas valve packing)</option>
              <option value="VACUUM_LOSS">Vacuum Loss (High BOG / Annular failure)</option>
              <option value="INSTRUMENT_FAULT">Instrument Fault (Transmitter / RTD / Battery)</option>
              <option value="STRUCTURE_DAMAGE">Structure Damage (Frame / Corner casting)</option>
              <option value="PERIODIC_INSPECTION">Periodic Statutory Inspection</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-950 font-bold mb-1 font-bold">Defect Description:</label>
            <textarea
              value={defectDesc}
              onChange={(e) => setDefectDesc(e.target.value)}
              placeholder="Observed leak, pressure rise, or sensor failure..."
              rows={3}
              className="w-full win-panel border border-slate-200 rounded-none px-1.5 py-0.5 text-slate-950 font-bold focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-slate-100 hover:bg-slate-100 text-slate-950 font-bold rounded-none font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-none font-bold"
            >
              Route to MRO Bay
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NiasMroModal;
