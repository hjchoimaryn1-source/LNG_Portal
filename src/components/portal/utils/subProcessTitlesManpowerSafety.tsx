// src/components/portal/utils/subProcessTitlesManpowerSafety.tsx
import React from 'react';
import { Globe, Sliders, Shield, Users, LayoutDashboard } from 'lucide-react';
import type { SubProcessTitleEntry } from './subProcessTitleTypes';

export const SUBPROCESS_TITLES_MANPOWER_SAFETY: Record<string, SubProcessTitleEntry> = {
  MANPOWER_SHIFT_ROSTER: {
    location: 'Site Manning & Roster',
    process: 'Site Manning & Shift Roster',
    icon: <Users className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  MANPOWER_DAILY_SHIFT: {
    location: 'Site Manning & Roster',
    process: 'Daily Board',
    icon: <Users className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  MANPOWER_ROTATION_TRACKER: {
    location: 'Site Manning & Roster',
    process: 'Rotation',
    icon: <Users className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  MANPOWER_MONTHLY_GRID: {
    location: 'Site Manning & Roster',
    process: 'Monthly Plan',
    icon: <Users className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  MANPOWER_TRAINING_MATRIX: {
    location: 'Site Manning & Roster',
    process: 'Training Matrix',
    icon: <Users className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  MANPOWER_PTW: {
    location: 'Safety & PTW',
    process: 'PTW Master Register',
    icon: <Shield className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  SAFETY_OVERVIEW: {
    location: 'Safety & PTW',
    process: 'Safety Overview',
    icon: <Shield className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  PTW_PERMITS: {
    location: 'Safety & PTW',
    process: 'PTW Master Register',
    icon: <Shield className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  SAFETY_GAS_TESTING: {
    location: 'Safety & PTW',
    process: 'Gas Testing Log',
    icon: <Shield className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  SAFETY_ERT_READINESS: {
    location: 'Safety & PTW',
    process: 'ERT Readiness',
    icon: <Shield className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  SAFETY_SOP_REFERENCE: {
    location: 'Safety & PTW',
    process: 'SOP Reference',
    icon: <Shield className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  WORK_ORDER_DIRECTORY: {
    location: 'Maintenance & Work Orders',
    process: 'Work Order Directory',
    icon: <Sliders className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  PM_SCHEDULES: {
    location: 'Maintenance & Work Orders',
    process: 'Preventive Maintenance Schedules',
    icon: <Sliders className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  SECTOR_LAUNCHER: {
    location: 'Sector Hub',
    process: 'SCADA Sector Launcher',
    icon: <Globe className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  CMMS_OVERVIEW_DASHBOARD: {
    // 2026-09-19(HJ 지시, 승인됨) — in-page 제목(CmmsOverviewDashboardView.tsx)이
    // "DASHBOARD - CMMS Overview"로 바뀐 뒤 이 매핑이 갱신되지 않아 브레드크럼과
    // 페이지 제목이 서로 다른 문구를 보여주고 있었다. 이 페이지는 다단계 경로가
    // 아니므로 process를 비워 단일 타이틀로 표시(PortalTitleBar.tsx 참고).
    location: 'DASHBOARD - CMMS Overview',
    process: '',
    icon: <LayoutDashboard className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  HQ_OVERVIEW_DASHBOARD: {
    location: 'Jakarta HQ Overview',
    process: 'HQ Command Center — Fleet & Settlement',
    icon: <LayoutDashboard className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
};
