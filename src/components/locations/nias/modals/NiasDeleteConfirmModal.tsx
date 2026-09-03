// src/components/locations/nias/modals/NiasDeleteConfirmModal.tsx
"use client";

import React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

export interface DeleteRecord {
  id: string;
  tankNo: string;
  serialNo: string;
  reportDate: string;
}

interface NiasDeleteConfirmModalProps {
  recordToDelete: DeleteRecord;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Delete Confirmation Modal — Tab 2 Master Inspection Log.
 * Extracted from NiasTerminalView (lines 4580–4652).
 */
export default function NiasDeleteConfirmModal({
  recordToDelete,
  onClose,
  onConfirm,
}: NiasDeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[#f0ede6] border-2 border-[#555] rounded-none shadow-2xl max-w-md w-full p-4 space-y-4 font-mono select-none">
        {/* Title Bar (Classic Windows Style) */}
        <div className="bg-[#002b4d] text-white px-3 py-1.5 flex items-center justify-between font-bold text-xs">
          <div className="flex items-center gap-2">
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Delete Master Inspection Record</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white font-bold px-1.5 py-0.5 hover:bg-red-700/50 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body Content */}
        <div className="space-y-3 bg-white p-3.5 border border-slate-300">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-red-100 border border-red-300 flex items-center justify-center shrink-0 text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <p className="font-bold text-slate-900 font-sans">
                Are you sure you want to delete this inspection record?
              </p>
              <p className="text-[11px] text-slate-600">
                This action will remove the record from the active daily yard telemetry master view.
              </p>
            </div>
          </div>

          {/* Target Details Card */}
          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-none text-xs space-y-1 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500 font-bold">Report Date:</span>
              <span className="font-bold text-slate-900">{recordToDelete.reportDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-bold">Tank ID:</span>
              <span className="font-bold text-blue-950">{recordToDelete.tankNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-bold">Serial No:</span>
              <span className="text-slate-700">{recordToDelete.serialNo}</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="win-btn bg-[#d4d0c8] hover:bg-[#dedad2] text-slate-800 border border-slate-400 font-mono font-bold text-xs px-3.5 py-1.5 cursor-pointer shadow-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="win-btn bg-red-600 hover:bg-red-700 text-white border border-red-800 font-mono font-bold text-xs px-3.5 py-1.5 cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Confirm Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
