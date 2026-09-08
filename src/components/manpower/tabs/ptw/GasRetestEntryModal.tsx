// src/components/manpower/tabs/ptw/GasRetestEntryModal.tsx
"use client";

import React, { useState } from 'react';
import { GasTestLogEntryInput, PTWPermit } from '../../../../types/lng';
import { validatePTWGasSafety } from '../../../../data/ptwMasterData';

export interface GasRetestEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePermit: PTWPermit;
  onSubmit: (permitId: string, entryInput: GasTestLogEntryInput) => void;
}

function nowWibTimestamp(): string {
  return `2026-09-01 ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
}

export default function GasRetestEntryModal({ isOpen, onClose, activePermit, onSubmit }: GasRetestEntryModalProps) {
  const [lel, setLel] = useState<string>('');
  const [o2, setO2] = useState<string>('20.9');
  const [h2s, setH2s] = useState<string>('0');
  const [testerName, setTesterName] = useState<string>('');
  const [testerId, setTesterId] = useState<string>('');
  const [note, setNote] = useState<string>('');

  if (!isOpen) return null;

  const lelNum = parseFloat(lel);
  const o2Num = parseFloat(o2);
  const h2sNum = parseFloat(h2s);
  const hasValidNumbers = [lelNum, o2Num, h2sNum].every((n) => Number.isFinite(n));

  // Real gate — never a reimplemented copy of the threshold logic.
  const liveSafety = hasValidNumbers
    ? validatePTWGasSafety(activePermit.type, {
        ...activePermit.gasReadings,
        lelPercent: lelNum,
        o2Percent: o2Num,
        h2sPpm: h2sNum,
      })
    : null;

  const canSubmit = hasValidNumbers && testerName.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const entryInput: GasTestLogEntryInput = {
      id: `GTL-${activePermit.id}-${Date.now()}`,
      lelPercent: lelNum,
      o2Percent: o2Num,
      h2sPpm: h2sNum,
      testedAt: nowWibTimestamp(),
      testerName: testerName.trim(),
      testerId: testerId.trim() || undefined,
      note: note.trim() || undefined,
    };
    onSubmit(activePermit.id, entryInput);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="max-w-md w-full bg-[#1B242C] border-2 border-[#0B192C] shadow-2xl rounded-none font-mono text-xs text-slate-100 overflow-hidden">
        <div className="bg-[#2A3B4C] text-white font-mono text-sm font-bold text-center py-1.5 flex items-center justify-between px-3">
          <span>RE-TEST GAS READING — {activePermit.id}</span>
          <button onClick={onClose} className="text-white/80 hover:text-white cursor-pointer px-1">
            ✕
          </button>
        </div>

        <div className="p-3 space-y-2.5">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-0.5">LEL (%)</label>
              <input
                type="number"
                step="0.1"
                value={lel}
                onChange={(e) => setLel(e.target.value)}
                className="w-full h-8 px-2 bg-[#0F1620] border border-slate-600 text-slate-100 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-0.5">O2 (%)</label>
              <input
                type="number"
                step="0.1"
                value={o2}
                onChange={(e) => setO2(e.target.value)}
                className="w-full h-8 px-2 bg-[#0F1620] border border-slate-600 text-slate-100 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-0.5">H2S (ppm)</label>
              <input
                type="number"
                step="0.1"
                value={h2s}
                onChange={(e) => setH2s(e.target.value)}
                className="w-full h-8 px-2 bg-[#0F1620] border border-slate-600 text-slate-100 font-mono text-xs"
              />
            </div>
          </div>

          <div
            className={`p-2 text-center font-bold text-xs border ${
              !liveSafety
                ? 'border-slate-600 text-slate-400'
                : liveSafety.isSafe
                ? 'border-emerald-700 text-emerald-400 bg-emerald-950/40'
                : 'border-red-700 text-red-400 bg-red-950/40'
            }`}
          >
            {!liveSafety
              ? 'ENTER ALL READINGS TO EVALUATE'
              : liveSafety.isSafe
              ? 'WILL SAVE AS: SAFE'
              : `WILL SAVE AS: UNSAFE — ${liveSafety.blockReason}`}
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-0.5">TESTER NAME</label>
            <input
              type="text"
              value={testerName}
              onChange={(e) => setTesterName(e.target.value)}
              className="w-full h-8 px-2 bg-[#0F1620] border border-slate-600 text-slate-100 font-mono text-xs"
            />
          </div>

          {/* TODO(gas-tester-cert-gate): SSHQE §3.2 requires Gas Tester certification validation before this signature is accepted — not yet implemented, hard-block missing */}
          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-0.5">TESTER ID (optional)</label>
            <input
              type="text"
              value={testerId}
              onChange={(e) => setTesterId(e.target.value)}
              className="w-full h-8 px-2 bg-[#0F1620] border border-slate-600 text-slate-100 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-0.5">NOTE (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full px-2 py-1 bg-[#0F1620] border border-slate-600 text-slate-100 font-mono text-xs resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-[11px] font-bold bg-slate-700 hover:bg-slate-600 text-white cursor-pointer"
            >
              CANCEL
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="px-3 py-1.5 text-[11px] font-bold bg-[#2A3B4C] hover:bg-[#354c62] disabled:opacity-40 disabled:cursor-not-allowed text-white cursor-pointer"
            >
              SUBMIT RE-TEST
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
