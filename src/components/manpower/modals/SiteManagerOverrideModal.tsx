"use client";

import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldCheck, ShieldAlert, X, UserCheck, CheckCircle2, Trash2 } from 'lucide-react';
import type { StaffPersonnel } from '../../../types/lng';
import { ManagerOverrideRecord, evaluateOverstayGuardrail } from '../../../types/manpowerOverride';

export interface SiteManagerOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffPersonnel | null;
  targetDate: string; // YYYY-MM-DD
  currentShift: 'D' | 'N' | 'R' | 'OFF';
  onSiteDays: number;
  prevDayShift?: 'D' | 'N' | 'R' | 'OFF';
  nextDayShift?: 'D' | 'N' | 'R' | 'OFF';
  isEdiOffOnDate: boolean;
  onSave: (record: ManagerOverrideRecord) => void;
  onRevoke: (staffId: string, targetDate: string) => void;
  existingRecord?: ManagerOverrideRecord;
}

const PRESET_REASONS = [
  'Minimum Manning Deficit (21p)',
  'Night Shift Coverage',
  'Emergency Plant Operation',
  'Custom Entry',
];

export default function SiteManagerOverrideModal({
  isOpen,
  onClose,
  staff,
  targetDate,
  currentShift,
  onSiteDays,
  prevDayShift,
  nextDayShift,
  isEdiOffOnDate,
  onSave,
  onRevoke,
  existingRecord,
}: SiteManagerOverrideModalProps) {
  const [assignedShift, setAssignedShift] = useState<'D' | 'N' | 'R' | 'OFF'>('D');
  const [reasonPreset, setReasonPreset] = useState<string>(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [overrideType, setOverrideType] = useState<'EXTEND_STAY_14D' | 'FORCE_SHIFT'>('EXTEND_STAY_14D');

  const defaultApprover = isEdiOffOnDate
    ? 'Shadiq M. Shalih (Acting Site Manager)'
    : 'Edi Hermawan (Site Manager)';

  useEffect(() => {
    if (existingRecord) {
      setAssignedShift(existingRecord.assignedShift);
      setOverrideType(existingRecord.overrideType);
      if (PRESET_REASONS.includes(existingRecord.reason)) {
        setReasonPreset(existingRecord.reason);
      } else {
        setReasonPreset('Custom Entry');
        setCustomReason(existingRecord.reason);
      }
    } else {
      setAssignedShift(currentShift === 'OFF' ? 'D' : currentShift);
      setOverrideType(onSiteDays > 90 ? 'EXTEND_STAY_14D' : 'FORCE_SHIFT');
      setReasonPreset(PRESET_REASONS[0]);
      setCustomReason('');
    }
  }, [existingRecord, currentShift, onSiteDays, isOpen]);

  if (!isOpen || !staff) return null;

  const guardrail = evaluateOverstayGuardrail(onSiteDays);

  // SSHQE Element 2: 24-Hour Continuous Duty Prohibited
  const isNightToDayViolation = assignedShift === 'D' && prevDayShift === 'N';
  const isDayAfterNightViolation = assignedShift === 'N' && nextDayShift === 'D';
  const isContinuousDutyBlocked = isNightToDayViolation || isDayAfterNightViolation;

  const finalReason = reasonPreset === 'Custom Entry' ? customReason.trim() : reasonPreset;
  const isSaveDisabled = isContinuousDutyBlocked || !finalReason;

  const handleApprove = () => {
    if (isSaveDisabled) return;
    const record: ManagerOverrideRecord = {
      id: existingRecord?.id || `OVR-${staff.id}-${targetDate}`,
      staffId: staff.id,
      staffName: staff.name,
      targetDate,
      overrideType,
      assignedShift,
      reason: finalReason,
      approvedBy: defaultApprover,
      approvedAt: new Date().toISOString(),
    };
    onSave(record);
    onClose();
  };

  const handleRevoke = () => {
    onRevoke(staff.id, targetDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="win-panel w-full max-w-lg bg-[#d4d0c8] border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] p-1 shadow-2xl font-sans text-xs">
        {/* Title Bar */}
        <div className="bg-blue-950 text-white px-3 py-1.5 flex justify-between items-center font-bold tracking-wide">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Site Manager Shift & Stay Extension Override</span>
          </span>
          <button onClick={onClose} className="win-btn px-1.5 py-0.5 text-black font-black bg-[#d4d0c8] border border-gray-600 hover:bg-slate-300">
            <X className="w-3 h-3" />
          </button>
        </div>

        <div className="p-3 space-y-3 bg-[#d4d0c8]">
          {/* Staff & Date SCADA Display */}
          <div className="grid grid-cols-2 gap-2 bg-white p-2.5 border border-[#808080] rounded">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Personnel</span>
              <div className="font-bold text-slate-900 text-sm">{staff.name}</div>
              <div className="text-[11px] font-mono text-slate-600">{staff.id} • {staff.teamName || (staff as any).team || 'OP Team'}</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Target Date & Shift</span>
              <div className="font-bold text-blue-950 text-sm font-mono">{targetDate}</div>
              <div className="text-[11px] font-semibold text-slate-700">Planned: <strong className="text-amber-800">{currentShift}</strong> | Days: <strong>{onSiteDays}d</strong></div>
            </div>
          </div>

          {/* Fatigue Limit Guardrail Badge */}
          <div className={`p-2 border rounded flex items-start gap-2 ${guardrail.tier === 'NORMAL' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : guardrail.tier === 'TIER_1_MANAGER_14D' ? 'bg-amber-50 border-amber-400 text-amber-950' : 'bg-rose-50 border-rose-400 text-rose-950'}`}>
            {guardrail.tier === 'NORMAL' ? <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
            <div>
              <div className="font-bold text-[11px]">{guardrail.notice}</div>
              <div className="text-[10px] opacity-85">Cumulative on-site duration: {onSiteDays} / 90 Days (Overstay: {Math.max(0, onSiteDays - 90)}d)</div>
            </div>
          </div>

          {/* 24h Rest Period Hard Block Warning */}
          {isContinuousDutyBlocked && (
            <div className="bg-rose-100 border border-rose-500 text-rose-900 p-2 rounded flex items-center gap-2 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
              <div className="font-bold text-[11px]">Hard Block: 24-Hour Continuous Duty Prohibited (SSHQE Element 2)</div>
            </div>
          )}

          {/* Configuration Form */}
          <div className="space-y-2 border border-[#808080] p-2.5 bg-slate-50 rounded">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-1">Override Type</label>
                <select value={overrideType} onChange={(e) => setOverrideType(e.target.value as any)} className="w-full win-sunken p-1 text-xs font-semibold bg-white border border-gray-400">
                  <option value="EXTEND_STAY_14D">14-Day Overstay Extension</option>
                  <option value="FORCE_SHIFT">Shift Swap / Manual Roster</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-1">Assigned Shift</label>
                <select value={assignedShift} onChange={(e) => setAssignedShift(e.target.value as any)} className="w-full win-sunken p-1 text-xs font-bold bg-white border border-gray-400">
                  <option value="D">D (Day Shift 07:00-19:00)</option>
                  <option value="N">N (Night Shift 19:00-07:00)</option>
                  <option value="R">R (Rest Day)</option>
                  <option value="OFF">OFF (Scheduled Rotation Leave)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-1">Operational Justification</label>
              <select value={reasonPreset} onChange={(e) => setReasonPreset(e.target.value)} className="w-full win-sunken p-1 text-xs bg-white border border-gray-400 mb-1.5 font-medium">
                {PRESET_REASONS.map((r) => (<option key={r} value={r}>{r}</option>))}
              </select>
              {reasonPreset === 'Custom Entry' && (
                <input type="text" placeholder="Specify technical rationale..." value={customReason} onChange={(e) => setCustomReason(e.target.value)} className="w-full win-sunken p-1 text-xs bg-white border border-gray-400 font-medium" />
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Authorizing Authority (Auto-bound)</label>
              <div className="win-sunken px-2 py-1 text-xs font-bold text-slate-800 bg-slate-200 border border-gray-400 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-900" />
                <span>{defaultApprover}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-2">
            <div>
              {existingRecord && (
                <button type="button" onClick={handleRevoke} className="win-btn px-2.5 py-1 text-xs font-bold text-rose-800 bg-[#d4d0c8] border border-gray-600 shadow-sm flex items-center gap-1 hover:bg-rose-100 active:translate-y-0.5">
                  <Trash2 className="w-3 h-3 text-rose-700" /> Revoke Override
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="win-btn px-3 py-1 text-xs font-bold text-slate-800 bg-[#d4d0c8] border border-gray-600 shadow-sm hover:bg-slate-200 active:translate-y-0.5">
                Cancel
              </button>
              <button type="button" disabled={isSaveDisabled} onClick={handleApprove} className="win-btn px-3 py-1 text-xs font-bold text-white bg-blue-950 border border-black shadow-sm flex items-center gap-1.5 hover:bg-blue-900 disabled:opacity-50 disabled:pointer-events-none active:translate-y-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Authorize Override
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
