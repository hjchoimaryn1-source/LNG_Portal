import React, { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { StaffPersonnel } from '../../../types/lng';
import {
  get10DayCycleInfo,
  resolveActiveShiftLeaders,
  validateSafeManning,
  SAFE_MANNING_THRESHOLD,
} from '../../../services/rosterPlanEngine';

export type OverviewTabTarget = 'DAILY_SHIFT_BOARD' | 'MONTHLY_GRID' | 'ROTATION_TRACKER';

export interface SiteManningOverviewTabProps {
  onNavigateTab: (tab: OverviewTabTarget) => void;
  manpowerData?: StaffPersonnel[];
  selectedDate?: string;
  onOpenHandoverModal?: () => void;
}

export default function SiteManningOverviewTab({
  onNavigateTab,
  manpowerData = [],
  selectedDate = '2026-09-01',
  onOpenHandoverModal,
}: SiteManningOverviewTabProps) {
  const currentDateObj = useMemo(
    () => new Date(`${selectedDate}T00:00:00`),
    [selectedDate]
  );

  const activeOnSite = useMemo(
    () => manpowerData.filter((s) => s.currentStatus === 'ON_SITE'),
    [manpowerData]
  );

  const offDuty = useMemo(
    () => manpowerData.filter((s) => s.currentStatus === 'OFF_DUTY'),
    [manpowerData]
  );

  const safeManning = useMemo(
    () => validateSafeManning(activeOnSite.length),
    [activeOnSite.length]
  );

  const cycle10 = useMemo(
    () => get10DayCycleInfo(currentDateObj),
    [currentDateObj]
  );

  const shiftLeaders = useMemo(
    () => resolveActiveShiftLeaders(manpowerData, currentDateObj),
    [manpowerData, currentDateObj]
  );

  const ertActive = useMemo(
    () => activeOnSite.filter((s) => s.ertRole && s.ertRole !== 'None'),
    [activeOnSite]
  );

  const ertCounts = useMemo(() => {
    return {
      ic: ertActive.filter((s) => s.ertRole === 'Incident Commander').length,
      fc: ertActive.filter((s) => s.ertRole === 'Fire Chief').length,
      fa: ertActive.filter((s) => s.ertRole === 'First Aider').length,
      glr: ertActive.filter((s) => s.ertRole === 'Gas Leak Response').length,
    };
  }, [ertActive]);

  const supportCount = useMemo(
    () =>
      activeOnSite.filter(
        (s) =>
          s.department === 'MAINTENANCE' ||
          s.department === 'HSSE' ||
          s.department === 'LOGISTICS' ||
          s.department === 'HR_GA'
      ).length,
    [activeOnSite]
  );

  const dayLeaderName = shiftLeaders.dayShiftLeader?.name || 'Unassigned Lead';
  const nightLeaderName = shiftLeaders.nightShiftLeader?.name || 'Unassigned Lead';

  const flowStages = [
    {
      label: 'OFF-DUTY ROTATION',
      value: `${offDuty.length} Personnel | 3:1 Rotation Leave`,
    },
    {
      label: 'LOGISTICS / RELIEF',
      value: `${manpowerData.filter((s) => s.currentStatus === 'MOBILIZING').length} in Transit | Next Boat Scheduled`,
    },
    {
      label: 'NIAS ON-SITE ACTIVE',
      value: `${activeOnSite.length} Personnel (${manpowerData.length ? Math.round((activeOnSite.length / manpowerData.length) * 100) : 0}%) | Min: ${SAFE_MANNING_THRESHOLD}p`,
    },
    {
      label: 'SHIFT OPS (10D SWAP)',
      value: `D: ${dayLeaderName.split(' ')[0]} | N: ${nightLeaderName.split(' ')[0]}`,
    },
    {
      label: 'SUPPORT COMPLEMENT',
      value: `${supportCount} Personnel (Maint, HSSE, Cargo, GA)`,
    },
  ];

  return (
    <div className="w-full space-y-1.5 bg-[#d4d0c8] text-slate-900">
      <div className="border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] bg-[#d4d0c8]">
        {/* Header bar */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-500 px-2 py-1.5">
          <div className="flex items-center gap-2 text-slate-800">
            <span className="text-amber-600 text-base">⚡</span>
            <span className="text-[11px] font-black uppercase tracking-[0.18em]">
              Site Manning &amp; Roster - Operational Overview
            </span>
          </div>

          <div className="win-sunken bg-[#eef4fb] border border-slate-400 px-2 py-0.5 text-[10px] font-mono font-black text-slate-700">
            {selectedDate} 07:00 WIB (10-Day Rotation Engine)
          </div>
        </div>

        {/* Banner Section */}
        <div className="flex items-center justify-between border-b border-[#163c6b] bg-[#183b6b] px-2 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white">
          <span>Personnel Rotation &amp; Deployment Flow</span>
          {safeManning.isUnderManning && (
            <span className="flex items-center gap-1 text-amber-300 font-bold bg-amber-950/60 px-2 py-0.5 border border-amber-500/50">
              <ShieldAlert className="w-3.5 h-3.5" />
              UNDER_MANNING: -{safeManning.deficit} Personnel
            </span>
          )}
        </div>

        {/* 5-Stage Flow Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-1 bg-[#d4d0c8] p-1.5 border-b-2 border-[#475569]">
          {flowStages.map((stage, index) => (
            <div
              key={stage.label}
              className="win-panel border-2 border-t-white border-l-white border-r-[#5f6b77] border-b-[#5f6b77] bg-[#e9eef4] p-1.5 min-h-[84px] flex flex-col justify-between"
            >
              <div className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-700">
                {index + 1}. {stage.label}
              </div>
              <div className="mt-1 font-mono text-[10px] font-black text-slate-900 leading-relaxed">
                {stage.value}
              </div>
            </div>
          ))}
        </div>

        {/* 2 Detail Cards */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-1.5 p-1.5 pt-1">
          {/* Duty Roster & 10-Day Cycle */}
          <div className="border-2 border-t-white border-l-white border-r-[#6b7280] border-b-[#6b7280] bg-[#dfe7ef]">
            <div className="bg-[#183b6b] text-white text-[10px] font-black uppercase tracking-[0.18em] px-2 py-1 border-b border-slate-600 flex items-center justify-between">
              <span>Duty Roster &amp; 10-Day Shift Rotation</span>
              <span className="text-amber-300 font-mono text-[9px]">Swap every 10d</span>
            </div>
            <div className="space-y-1.5 p-2 text-[11px] text-slate-800">
              <div className="win-sunken bg-white border border-slate-400 px-2 py-1 flex items-center justify-between gap-2">
                <span className="font-bold uppercase tracking-wide text-slate-700">Current Phase</span>
                <span className="font-mono font-black text-slate-900">
                  Cycle Day {String(cycle10.cycleDay).padStart(2, '0')} / 10
                </span>
              </div>
              <div className="win-sunken bg-white border border-slate-400 px-2 py-1 flex items-center justify-between gap-2">
                <span className="font-bold uppercase tracking-wide text-slate-700">Next Shift Swap</span>
                <span className="font-mono font-black text-blue-900">
                  {cycle10.nextSwapDate} ({cycle10.daysRemaining} days left)
                </span>
              </div>
              <div className="win-sunken bg-white border border-slate-400 px-2 py-1 flex items-center justify-between gap-2">
                <span className="font-bold uppercase tracking-wide text-slate-700">Active Shift Leads</span>
                <span className="font-mono font-black text-slate-900">
                  D: {dayLeaderName} | N: {nightLeaderName}
                </span>
              </div>
              {shiftLeaders.isBackupActive && (
                <div className="win-sunken bg-amber-100 border border-amber-400 px-2 py-1 flex items-center justify-between gap-2 text-amber-900">
                  <span className="font-bold text-[10px]">Exception Action</span>
                  <span className="font-mono font-black text-[10px]">{shiftLeaders.backupReason}</span>
                </div>
              )}
            </div>
          </div>

          {/* Safe Manning & ERT Quorum */}
          <div className="border-2 border-t-white border-l-white border-r-[#6b7280] border-b-[#6b7280] bg-[#dfe7ef]">
            <div className="bg-[#183b6b] text-white text-[10px] font-black uppercase tracking-[0.18em] px-2 py-1 border-b border-slate-600 flex items-center justify-between">
              <span>Safe Manning (21p Standard) &amp; ERT Gate</span>
              <span className="text-emerald-300 font-mono text-[9px]">Target: &gt;= 21p</span>
            </div>
            <div className="space-y-1.5 p-2 text-[11px] text-slate-800">
              <div className="win-sunken bg-white border border-slate-400 px-2 py-1 flex items-center justify-between gap-2">
                <span className="font-bold uppercase tracking-wide text-slate-700">On-Site Manning Standard</span>
                <span className={`font-mono font-black ${safeManning.isUnderManning ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {activeOnSite.length} / {SAFE_MANNING_THRESHOLD} Personnel ({safeManning.isValid ? 'PASSED' : 'DEFICIT'})
                </span>
              </div>
              <div className="win-sunken bg-white border border-slate-400 px-2 py-1 flex items-center justify-between gap-2">
                <span className="font-bold uppercase tracking-wide text-slate-700">ERT Quorum Readiness</span>
                <span className="font-mono font-black text-emerald-700">
                  {ertActive.length} Active Cleared
                </span>
              </div>
              <div className="win-sunken bg-white border border-slate-400 px-2 py-1 flex items-center justify-between gap-2">
                <span className="font-bold uppercase tracking-wide text-slate-700">ERT Role Distribution</span>
                <span className="font-mono font-black text-slate-900">
                  IC: {ertCounts.ic} | FC: {ertCounts.fc} | FA: {ertCounts.fa} | GLR: {ertCounts.glr}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Status Bar */}
      <div className="border-2 border-t-white border-l-white border-r-[#7c7c7c] border-b-[#7c7c7c] bg-[#183b6b] px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-white">
        <span className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-sky-300" />
          Manning: {activeOnSite.length} On-Site / {offDuty.length} Off-Duty
        </span>
        <span className="flex items-center gap-2">
          <Clock3 className="w-3.5 h-3.5 text-sky-300" />
          10-Day Rotation: Day {cycle10.cycleDay} of 10
        </span>
        <span className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
          ERT: {ertActive.length} Ready
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('DAILY_SHIFT_BOARD')}
            className="bg-amber-500 text-slate-900 font-black px-2 py-0.5 border border-amber-200 uppercase cursor-pointer hover:bg-amber-400 transition-colors"
          >
            Open Daily Board
          </button>
        </div>
      </div>
    </div>
  );
}
