// src/components/manpower/tabs/GasTestingLogTab.tsx
"use client";

import React from 'react';
import { Wind } from 'lucide-react';

export default function GasTestingLogTab() {
  return (
    <div className="win-panel p-8 border-2 border-slate-400 bg-white text-center text-slate-500 font-mono space-y-2">
      <Wind className="w-8 h-8 mx-auto text-slate-400" />
      <div className="font-bold text-slate-700">Gas Testing Log (SOP NP08-15)</div>
      <div className="text-xs">T-201~204 하역 구역 및 기화기 4시간 주기 AGT 계측 대장 — 구현 예정 (Phase 4)</div>
    </div>
  );
}
