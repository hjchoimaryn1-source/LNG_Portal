// src/components/launcher/SectorLauncherHub.tsx
"use client";

import React from 'react';
import { SubProcessKey } from '../../types/lng';

interface SectorButton {
  id: string;
  name: string;
  targetKey: SubProcessKey;
}

const SECTOR_BUTTONS: SectorButton[] = [
  { id: 'MOD_1', name: '[ LNG-Process ]', targetKey: 'LNG_PROCESS_OVERVIEW' },
  { id: 'MOD_2', name: '[ Equipment & Asset ]', targetKey: 'EQUIPMENT_ASSET_REGISTRY' },
  { id: 'MOD_3', name: '[ Maintenance & Work Orders ]', targetKey: 'WORK_ORDER_DIRECTORY' },
  { id: 'MOD_4', name: '[ Site Manning & Roster ]', targetKey: 'MANPOWER_DAILY_SHIFT' },
  { id: 'MOD_5', name: '[ Safety & PTW ]', targetKey: 'PTW_PERMITS' },
];

interface SectorLauncherHubProps {
  onSelectSector: (targetKey: SubProcessKey) => void;
  onLogout?: () => void;
}

export default function SectorLauncherHub({ onSelectSector, onLogout }: SectorLauncherHubProps) {
  return (
    <div className="flex flex-col items-center justify-center select-none py-6 animate-fadeIn">
      {/* 1. 중앙 항공 사진 프레임 */}
      <div 
        className="p-1 bg-[#d4d0c8] rounded shadow-xl border-2"
        style={{
          borderColor: '#ffffff #808080 #808080 #ffffff',
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
        }}
      >
        <img
          src="/images/nias_aerial.png"
          alt="NIAS LNG Terminal Aerial View"
          className="max-h-[52vh] w-auto max-w-[85vw] object-contain rounded-sm block"
        />
      </div>

      {/* 2. 사진 바로 아래 가로 1열 클래식 버튼 모음 */}
      <div 
        className="mt-4 p-2 rounded flex flex-wrap items-center justify-center gap-2 border shadow-lg bg-[#d4d0c8]"
        style={{
          borderColor: '#ffffff #808080 #808080 #ffffff',
        }}
      >
        {SECTOR_BUTTONS.map((btn) => (
          <button
            key={btn.id}
            onClick={() => onSelectSector(btn.targetKey)}
            className="px-4 py-2 text-sm font-bold text-slate-900 tracking-wide active:translate-y-[1px] transition-all cursor-pointer"
            style={{
              backgroundColor: '#ece9d8',
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: '#ffffff #707070 #707070 #ffffff',
              boxShadow: 'inset 1px 1px 0px #fff, 1px 1px 2px rgba(0,0,0,0.2)',
              fontFamily: "'Segoe UI', Tahoma, sans-serif"
            }}
          >
            {btn.name}
          </button>
        ))}
      </div>

      {/* 3. 하단 로그아웃 버튼 */}
      {onLogout && (
        <button
          onClick={onLogout}
          className="mt-4 px-3 py-1 text-xs font-semibold text-slate-700 bg-[#d4d0c8] hover:bg-[#c0bbb0] border rounded cursor-pointer transition-colors"
          style={{
            borderColor: '#ffffff #707070 #707070 #ffffff'
          }}
        >
          [ TERMINATE SESSION ]
        </button>
      )}
    </div>
  );
}
