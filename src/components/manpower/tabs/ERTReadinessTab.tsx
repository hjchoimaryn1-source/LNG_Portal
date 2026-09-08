// src/components/manpower/tabs/ERTReadinessTab.tsx
"use client";

import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function ERTReadinessTab() {
  return (
    <div className="win-panel p-8 border-2 border-slate-400 bg-white text-center text-slate-500 font-mono space-y-2">
      <ShieldAlert className="w-8 h-8 mx-auto text-slate-400" />
      <div className="font-bold text-slate-700">ERT Readiness (SOP NP08-33 / NP08-37)</div>
      <div className="text-xs">POB 대비 비상대응팀 편성, Fire Watch, SCBA/DCP 방재 장비 현황 — 구현 예정 (Phase 4)</div>
    </div>
  );
}
