"use client";

import { useState } from 'react';
import type { StaffPersonnel } from '../../../types/lng';
import { DIRECTIVES_MAP } from '../../../data/manpowerMasterData';

type HandoverDirection = 'DAY_TO_NIGHT' | 'NIGHT_TO_DAY';

interface ShiftHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayShiftLeader?: StaffPersonnel;
  nightShiftLeader?: StaffPersonnel;
}

const EMPTY_CHECKLIST = {
  bogNormal: true,
  bayStatus: true,
  ptwReviewed: true,
  ertCleared: true,
  esdArmed: true,
};

export default function ShiftHandoverModal({
  isOpen,
  onClose,
  dayShiftLeader,
  nightShiftLeader,
}: ShiftHandoverModalProps) {
  const [handoverChecklist, setHandoverChecklist] = useState(EMPTY_CHECKLIST);
  const [handoverSignatures, setHandoverSignatures] = useState({
    offGoingSigned: false,
    incomingSigned: false,
    offGoingSignedAt: '',
    incomingSignedAt: '',
  });
  const [handoverDirection, setHandoverDirection] = useState<HandoverDirection>('DAY_TO_NIGHT');
  const [handoverRemarks, setHandoverRemarks] = useState('');
  const [handoverDate, setHandoverDate] = useState('2026-09-01');
  const [directivesAcknowledged, setDirectivesAcknowledged] = useState(false);

  if (!isOpen) return null;

  const offGoingLeader = handoverDirection === 'DAY_TO_NIGHT' ? dayShiftLeader : nightShiftLeader;
  const incomingLeader = handoverDirection === 'DAY_TO_NIGHT' ? nightShiftLeader : dayShiftLeader;
  const shiftKey = handoverDirection === 'DAY_TO_NIGHT' ? 'NIGHT' : 'DAY';
  const directive = DIRECTIVES_MAP[handoverDate]?.[shiftKey] ??
    'Normal operation protocol. No standing orders issued for this shift.';
  const resetApprovalState = () => {
    setHandoverSignatures({
      offGoingSigned: false,
      incomingSigned: false,
      offGoingSignedAt: '',
      incomingSignedAt: '',
    });
    setDirectivesAcknowledged(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
      <div className="bg-white border-2 border-slate-700 shadow-2xl rounded-sm w-[95vw] max-w-6xl max-h-[90vh] overflow-hidden flex flex-col font-sans">
        <div className="bg-[#0f2d59] text-white px-3 py-2 flex items-center justify-between border-b border-[#1b437c]">
          <span className="font-bold text-sm tracking-wide">SHIFT HAND OVER (SOP NP07-03)</span>
          <button onClick={onClose} className="text-white hover:text-rose-300 font-bold text-sm px-2 cursor-pointer" title="Close">
            CLOSE
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="bg-slate-100 border border-slate-300 p-2.5 rounded flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={handoverDate}
                onChange={(event) => {
                  setHandoverDate(event.target.value);
                  resetApprovalState();
                }}
                className="border border-slate-300 bg-white px-2 py-1 text-[11px] font-mono text-slate-800"
                aria-label="Handover date"
              />
              <select
                value={handoverDirection}
                onChange={(event) => {
                  setHandoverDirection(event.target.value as HandoverDirection);
                  resetApprovalState();
                }}
                className="border border-slate-300 bg-white px-2 py-1 text-[11px] font-bold text-slate-800"
                aria-label="Shift direction"
              >
                <option value="DAY_TO_NIGHT">DAY -&gt; NIGHT</option>
                <option value="NIGHT_TO_DAY">NIGHT -&gt; DAY</option>
              </select>
            </div>
            <span className={handoverSignatures.offGoingSigned && handoverSignatures.incomingSigned
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 px-2 py-0.5 rounded font-bold font-mono'
              : 'bg-amber-50 text-amber-700 border border-amber-300 px-2 py-0.5 rounded font-bold font-mono'}>
              {handoverSignatures.offGoingSigned && handoverSignatures.incomingSigned ? 'Shift Handover Verified' : 'Sign-off Pending'}
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3 space-y-2 p-3 border-r border-slate-300">
              <div className="font-bold text-slate-800 font-mono text-[12px] border-b border-slate-200 pb-1">CHECKLIST HANDOVER</div>
              <div className="space-y-2 font-mono text-[11px] pt-1">
                {([
                  ['bogNormal', '1. Cryogenic BOG Header Pressure Normal (< 0.25 MPa) & Comp running'],
                  ['bayStatus', '2. Loading Bay 01 & 02 Vaporizer Status & Mass Balance Verified'],
                  ['ptwReviewed', '3. Active PTW Permits (Hot Work / Confined Space) Reviewed'],
                  ['ertCleared', '4. ERT Minimum Manning Cleared (IC, FC, FA, GAS)'],
                  ['esdArmed', '5. Plant ESD Loops & Gas Detection 100% Armed'],
                ] as const).map(([key, label]) => (
                  <label key={key} className="flex items-start gap-2 cursor-pointer select-none p-2 border-b border-slate-200">
                    <input
                      type="checkbox"
                      checked={handoverChecklist[key]}
                      onChange={(event) => setHandoverChecklist((previous) => ({ ...previous, [key]: event.target.checked }))}
                      className="cursor-pointer accent-blue-900 mt-0.5"
                    />
                    <span className={handoverChecklist[key] ? 'text-slate-900 font-semibold' : 'text-slate-500'}>{label}</span>
                  </label>
                ))}
              </div>
              <label className="block pt-3">
                <span className="block mb-1 font-bold text-slate-800 text-[11px]">REMARKS</span>
                <textarea
                  value={handoverRemarks}
                  onChange={(event) => setHandoverRemarks(event.target.value)}
                  className="w-full h-20 resize-none border border-slate-300 p-2 text-[11px] text-slate-800"
                  placeholder="Record deviations, bypassed loops, pending tasks, or night patrol instructions..."
                />
              </label>
            </div>
            <div className="lg:col-span-2 space-y-3 p-3 border-l border-slate-300">
              <div className="font-bold text-slate-800 font-mono text-[12px] border-b border-slate-200 pb-1">APPROVAL</div>
              <div className="space-y-2 font-mono text-[11px]">
                {([
                  ['HANDOVER', offGoingLeader, 'offGoingSigned', 'offGoingSignedAt'],
                  ['TAKEOVER', incomingLeader, 'incomingSigned', 'incomingSignedAt'],
                ] as const).map(([label, leader, signedKey, timestampKey]) => (
                  <div key={label} className="flex justify-between items-center p-2 border-b border-slate-300">
                    <div>
                      <span className="font-bold text-slate-900">{label}</span>
                      <div className="text-slate-600">{leader?.name ?? 'Unassigned'}</div>
                      <div className="text-[11px] font-medium text-slate-500">{leader ? `${leader.role} · ${leader.teamName}` : 'No leader assigned'}</div>
                    </div>
                    {handoverSignatures[signedKey] ? (
                      <span className="text-emerald-600 font-semibold text-xs" title={`Signed at ${handoverSignatures[timestampKey]}`}>Signed</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setHandoverSignatures((previous) => ({
                          ...previous,
                          [signedKey]: true,
                          [timestampKey]: new Date().toLocaleString(),
                        }))}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1 rounded"
                      >
                        [ Sign ]
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-300 pt-3">
                <div className="text-[11px] font-bold text-slate-700 border-b border-slate-200 pb-1">SITE MANAGER DIRECTIVES</div>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-600">{directive}</p>
                <label className="mt-3 flex items-start gap-2 text-[11px] text-slate-600 cursor-pointer select-none">
                  <input type="checkbox" checked={directivesAcknowledged} onChange={(event) => setDirectivesAcknowledged(event.target.checked)} className="mt-0.5 cursor-pointer accent-blue-900" />
                  <span>[✔] Directives reviewed and acknowledged by incoming shift</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-slate-100 px-4 py-2.5 border-t border-slate-300 flex justify-end items-center gap-2">
          <button onClick={onClose} className="win-btn px-4 py-1 text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 cursor-pointer border border-slate-400 rounded">Close</button>
          <button onClick={onClose} className="win-btn px-5 py-1 text-xs font-bold bg-blue-900 hover:bg-blue-950 text-white cursor-pointer border border-blue-950 rounded">Submit</button>
        </div>
      </div>
    </div>
  );
}
