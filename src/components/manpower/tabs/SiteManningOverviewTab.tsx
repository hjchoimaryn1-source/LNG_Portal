import React from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Users,
} from 'lucide-react';

export type OverviewTabTarget = 'DAILY_SHIFT_BOARD' | 'MONTHLY_GRID' | 'ROTATION_TRACKER';

interface SiteManningOverviewTabProps {
  onNavigateTab: (tab: OverviewTabTarget) => void;
}

export default function SiteManningOverviewTab({ onNavigateTab }: SiteManningOverviewTabProps) {
  const flowStages = [
    { label: 'ARUN / OFF-DUTY', value: 'Team-A (3p) | 30d Rest / Mob Standby' },
    { label: 'LOGISTICS / TRANSIT', value: '0p in Transit | Next Boat 2026-09-09' },
    { label: 'NIAS ON-SITE', value: '16 Personnel (84%) | Normal Floor' },
    { label: 'SHIFT OPS (24/7)', value: 'Team-B (Day 3p) + Team-C (Night 3p)' },
    { label: 'SUPPORT STAFF', value: '10 Personnel (Maint, Marine, Tech, HSSE)' },
  ];

  return (
    <div className="w-full space-y-1.5 bg-[#d4d0c8] text-slate-900">
      <div className="border-t-2 border-l-2 border-r-2 border-b-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] bg-[#d4d0c8]">
        <div className="flex items-center justify-between gap-3 border-b border-slate-500 px-2 py-1.5">
          <div className="flex items-center gap-2 text-slate-800">
            <span className="text-amber-600 text-base">⚡</span>
            <span className="text-[11px] font-black uppercase tracking-[0.18em]">
              Site Manning &amp; Roster - Operational Overview
            </span>
          </div>

          <div className="win-sunken bg-[#eef4fb] border border-slate-400 px-2 py-0.5 text-[10px] font-mono font-black text-slate-700">
            2026-09-02 08:45 WIB
          </div>
        </div>

        <div className="border-b border-[#163c6b] bg-[#183b6b] px-2 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white">
          Personnel Rotation &amp; Deployment Flow
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-1 bg-[#d4d0c8] p-1.5 border-b-2 border-[#475569]">
          {flowStages.map((stage, index) => (
            <div key={stage.label} className="win-panel border-2 border-t-white border-l-white border-r-[#5f6b77] border-b-[#5f6b77] bg-[#e9eef4] p-1.5 min-h-[86px] flex flex-col justify-between">
              <div className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-700">
                {index + 1}. {stage.label}
              </div>
              <div className="mt-2 font-mono text-[10px] font-black text-slate-900 leading-relaxed">
                {stage.value}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-1.5 p-1.5 pt-1">
          <div className="border-t-2 border-l-2 border-r-2 border-b-2 border-t-white border-l-white border-r-[#6b7280] border-b-[#6b7280] bg-[#dfe7ef]">
            <div className="bg-[#183b6b] text-white text-[10px] font-black uppercase tracking-[0.18em] px-2 py-1 border-b border-slate-600">
              Duty Roster &amp; 10-Day Rotation Engine
            </div>
            <div className="space-y-1.5 p-2 text-[11px] text-slate-800">
              <div className="win-sunken bg-white border border-slate-400 px-2 py-1 flex items-center justify-between gap-2">
                <span className="font-bold uppercase tracking-wide text-slate-700">Current 10-Day Phase</span>
                <span className="font-mono font-black text-slate-900">Cycle Day 05 / 10</span>
              </div>
              <div className="win-sunken bg-white border border-slate-400 px-2 py-1 flex items-center justify-between gap-2">
                <span className="font-bold uppercase tracking-wide text-slate-700">Next Swap</span>
                <span className="font-mono font-black text-blue-900">2026-09-12</span>
              </div>
              <div className="win-sunken bg-white border border-slate-400 px-2 py-1 flex items-center justify-between gap-2">
                <span className="font-bold uppercase tracking-wide text-slate-700">Active Shift Leads</span>
                <span className="font-mono font-black text-slate-900">D / N (Asman S. / Juli S.)</span>
              </div>
              <div className="win-sunken bg-emerald-50 border border-emerald-300 px-2 py-1 flex items-center justify-between gap-2">
                <span className="font-bold uppercase tracking-wide text-emerald-900">Handover Protocol</span>
                <span className="font-mono font-black text-emerald-800">100% Cleared</span>
              </div>
            </div>
          </div>

          <div className="border-t-2 border-l-2 border-r-2 border-b-2 border-t-white border-l-white border-r-[#6b7280] border-b-[#6b7280] bg-[#dfe7ef]">
            <div className="bg-[#183b6b] text-white text-[10px] font-black uppercase tracking-[0.18em] px-2 py-1 border-b border-slate-600">
              ERT Reputational &amp; Fatigue Compliance Gate
            </div>
            <div className="space-y-1.5 p-2 text-[11px] text-slate-800">
              <div className="win-sunken bg-white border border-slate-400 px-2 py-1 flex items-center justify-between gap-2">
                <span className="font-bold uppercase tracking-wide text-slate-700">ERT Quorum</span>
                <span className="font-mono font-black text-emerald-700">16/16 Active</span>
              </div>
              <div className="win-sunken bg-white border border-slate-400 px-2 py-1 flex items-center justify-between gap-2">
                <span className="font-bold uppercase tracking-wide text-slate-700">Composition</span>
                <span className="font-mono font-black text-slate-900">IC: 3 | FC: 1 | FA: 4 | RT: 8</span>
              </div>
              <div className="win-sunken bg-white border border-slate-400 px-2 py-1 flex items-center justify-between gap-2">
                <span className="font-bold uppercase tracking-wide text-slate-700">Fatigue Rules</span>
                <span className="font-mono font-black text-emerald-700">0 Violation (100% Compliant)</span>
              </div>
              <div className="win-sunken bg-amber-50 border border-amber-300 px-2 py-1 flex items-center justify-between gap-2">
                <span className="font-bold uppercase tracking-wide text-amber-900">Certificate Alert</span>
                <span className="font-mono font-black text-amber-800">2 Expiring within 30 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t-2 border-l-2 border-r-2 border-b-2 border-t-white border-l-white border-r-[#7c7c7c] border-b-[#7c7c7c] bg-[#d4d0c8] px-2 py-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
          Live Operational Status
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-mono font-bold text-slate-700">
          <span className="win-sunken bg-white px-2 py-0.5 border border-slate-400">Manning: 16/19p</span>
          <span className="win-sunken bg-white px-2 py-0.5 border border-slate-400">ERT: 16/16 Ready</span>
          <span className="win-sunken bg-white px-2 py-0.5 border border-slate-400">Fatigue: Compliant</span>
        </div>
      </div>

      <div className="border-t-2 border-l-2 border-r-2 border-b-2 border-t-white border-l-white border-r-[#7c7c7c] border-b-[#7c7c7c] bg-[#183b6b] px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-white">
        <span className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-sky-300" />
          Site Status OK
        </span>
        <span className="flex items-center gap-2">
          <Clock3 className="w-3.5 h-3.5 text-sky-300" />
          Shift Watch Continuity Active
        </span>
        <span className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
          2 Credential Alerts under review
        </span>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
          <button onClick={() => onNavigateTab('DAILY_SHIFT_BOARD')} className="bg-amber-500 text-slate-900 font-black px-2 py-0.5 border border-amber-200 uppercase cursor-pointer">
            Open Daily Board
          </button>
        </div>
      </div>
    </div>
  );
}
