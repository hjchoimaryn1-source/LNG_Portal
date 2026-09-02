import React from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  Briefcase,
  CalendarRange,
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
  const cards = [
    {
      title: 'Manning Operations',
      accent: 'bg-[#183b6b]',
      icon: <Users className="w-4 h-4" />,
      primary: 'On-Site 16 / 19p',
      secondary: 'Today D/N Leaders: Asman S. / Juli S.',
      tone: 'text-emerald-700',
    },
    {
      title: '10-Day Shift Countdown',
      accent: 'bg-[#2b4d7a]',
      icon: <Clock3 className="w-4 h-4" />,
      primary: 'Cycle Day 05 / 10',
      secondary: 'Next Swap Date: 2026-09-12',
      tone: 'text-blue-700',
    },
    {
      title: 'Rotation & Demob',
      accent: 'bg-[#355f8d]',
      icon: <CalendarRange className="w-4 h-4" />,
      primary: 'Standby: TEAM-A',
      secondary: 'Mob / Demob: 2026-09-09 → 2026-09-18',
      tone: 'text-amber-700',
    },
    {
      title: 'Compliance & ERT Gate',
      accent: 'bg-[#4b6e8b]',
      icon: <ShieldCheck className="w-4 h-4" />,
      primary: 'ERT Quorum: READY (4/4 min)',
      secondary: 'Certificates expiring <30d: 2 alerts',
      tone: 'text-red-700',
    },
  ];

  return (
    <div className="space-y-3 bg-[#d4d0c8] p-1.5 text-slate-900">
      <div className="win-panel border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] bg-[#d4d0c8] p-2 shadow-inner">
        <div className="flex items-center justify-between gap-3 border-b border-slate-500 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-900" />
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-800">
              Site Manning &amp; Roster Overview
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('DAILY_SHIFT_BOARD')}
              className="win-btn px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-900"
            >
              Daily
            </button>
            <button
              onClick={() => onNavigateTab('MONTHLY_GRID')}
              className="win-btn px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-900"
            >
              Monthly
            </button>
            <button
              onClick={() => onNavigateTab('ROTATION_TRACKER')}
              className="win-btn px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-900"
            >
              Rotation
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
          {cards.map((card) => (
            <div key={card.title} className="win-panel border-2 border-t-[#9ca3af] border-l-[#9ca3af] border-r-[#475569] border-b-[#475569] bg-[#e2e8f0] p-0 overflow-hidden">
              <div className={`flex items-center justify-between px-2 py-1.5 text-white text-[10px] font-black uppercase tracking-[0.16em] ${card.accent}`}>
                <span className="flex items-center gap-1.5">
                  {card.icon}
                  {card.title}
                </span>
                <span className="inline-flex items-center gap-1 text-[9px] opacity-90">
                  {card.title === 'Compliance & ERT Gate' ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                  Status
                </span>
              </div>

              <div className="space-y-1.5 p-2.5">
                <div className={`text-[13px] font-black ${card.tone}`}>{card.primary}</div>
                <div className="text-[11px] text-slate-700 font-medium">{card.secondary}</div>

                <div className="win-sunken bg-[#dfe7ee] border border-slate-400 p-1.5 text-[10px] text-slate-700 flex items-center justify-between gap-2">
                  <span className="font-bold uppercase tracking-wide">Gate</span>
                  <span className="font-black text-slate-900">
                    {card.title === 'Manning Operations' && 'STABLE'}
                    {card.title === '10-Day Shift Countdown' && 'ON TRACK'}
                    {card.title === 'Rotation & Demob' && 'READY'}
                    {card.title === 'Compliance & ERT Gate' && 'ALERT'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="win-panel border-2 border-t-white border-l-white border-r-[#7c7c7c] border-b-[#7c7c7c] bg-[#d4d0c8] p-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">
          <ArrowRightLeft className="w-3.5 h-3.5 text-blue-900" />
          Quick Jump
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigateTab('DAILY_SHIFT_BOARD')}
            className="win-btn px-3 py-1 text-[11px] font-black uppercase text-slate-900"
          >
            Daily
          </button>
          <button
            onClick={() => onNavigateTab('MONTHLY_GRID')}
            className="win-btn px-3 py-1 text-[11px] font-black uppercase text-slate-900"
          >
            Monthly
          </button>
          <button
            onClick={() => onNavigateTab('ROTATION_TRACKER')}
            className="win-btn px-3 py-1 text-[11px] font-black uppercase text-slate-900"
          >
            Rotation
          </button>
        </div>
      </div>
    </div>
  );
}
