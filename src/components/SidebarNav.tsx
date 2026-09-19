// src/components/SidebarNav.tsx
"use client";

import React from 'react';
import { SubProcessKey } from '../types/lng';
import { COMPANY_CONFIG } from '../config/siteConfig';
import SidebarSectorListView from './portal/sidebar/SidebarSectorListView';
import SidebarSectionMenu from './portal/sidebar/SidebarSectionMenu';

interface SidebarNavProps {
  activeKey: SubProcessKey;
  activeSubTab?: string;
  onSelectKey: (key: SubProcessKey) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

// Stage 1 (contextual sidebar, 2026-09-18): Dashboard shows a flat sector-picker
// list (SidebarSectorListView); inside any sector, that sector's own leaf
// sub-menu fully replaces the list (SidebarSectionMenu) — see sidebarSections.ts
// for the shared section data both views render from.
export default function SidebarNav({
  activeKey,
  activeSubTab,
  onSelectKey,
  isOpenMobile = false,
  onCloseMobile,
}: SidebarNavProps) {
  const isDashboardActive = activeKey === 'CMMS_OVERVIEW_DASHBOARD';

  const handleItemClick = (key: SubProcessKey) => {
    onSelectKey(key);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside
      className={`fixed lg:sticky top-0 left-0 z-40 h-full w-72 sm:w-80 shrink-0 bg-[#d4d0c8] border-r-2 border-[#404040] flex flex-col justify-between transition-transform duration-150 select-none ${
        isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* 1. 최상단 프로그램 타이틀 바 — NIAS CMMS는 실제 제품/시스템명이므로
          1차 헤딩으로 강조(대형 폰트/최대 굵기); 로고 박스 안 회사명은 2차 브랜딩으로 유지.
          높이는 --portal-topbar-h(globals.css) 공유 변수로 고정해 PortalTitleBar.tsx의
          브레드크럼 바와 정확히 일치시킨다(2026-09-19 HJ 지시, 승인됨).
          2026-09-19(HJ 스크린샷 재검토, 승인됨) — 배경/텍스트를 브레드크럼 바·DASHBOARD
          마스터 헤더와 동일한 --win-blue-start→--win-blue-end 그라디언트 + 흰 글자로
          맞춘다: 사이드바 좌상단 "NIAS CMMS"부터 화면 상단 브레드크럼 바를 거쳐 그
          아래 DASHBOARD 헤더까지 하나의 연속된 블루 밴드로 읽히게 한다. 바로 아래
          로고/회사명 블록(2. 로고 블록)은 이번 변경 대상이 아니다 — 그대로 유지. */}
      <div className="h-[var(--portal-topbar-h)] py-2 border-b border-slate-400 bg-[linear-gradient(90deg,var(--win-blue-start)_0%,var(--win-blue-end)_100%)] text-center select-none shrink-0 shadow-2xs">
        <span className="text-lg font-black tracking-wider text-white uppercase">
          NIAS CMMS
        </span>
      </div>

      {/* 2. 로고 블록 — 2026-09-19(HJ 지시): 회사명을 로고 박스 안/아래에서 분리해
          로고 위 별도 줄로 이동(LoginGateway.tsx는 반대로 로고 아래→위였지만
          그건 별개 컴포넌트/화면이라 여기 배치와 무관), 로고 자체는 36px(h-9)
          -> 64px(h-16)로 확대. */}
      <div className="p-1.5 shrink-0 bg-[#d4d0c8] border-b border-[#808080]">
        <div className="flex flex-col items-center justify-center p-2 bg-[#d4d0c8] border border-slate-400 win-panel shadow-2xs">
          <h1 className="text-[10px] font-bold text-slate-900 text-center uppercase tracking-tight leading-tight mb-1">
            {COMPANY_CONFIG.companyName}
          </h1>
          <img
            src="/images/bsg-lines-logo.png"
            alt="BSG Lines Logo"
            className="h-16 w-auto object-contain mx-auto"
          />
        </div>
      </div>

      {/* 3. DASHBOARD master container — 헤더가 그 아래 섹터 목록/서브메뉴 전체를 지배 (Stage 2, 2026-09-18) */}
      <div className="win-panel m-1.5 p-0 flex-1 overflow-hidden flex flex-col">
        <button
          onClick={() => handleItemClick('CMMS_OVERVIEW_DASHBOARD')}
          className="win-titlebar w-full cursor-pointer"
        >
          <span className="block w-full text-center text-sm font-bold text-white tracking-wide">
            DASHBOARD
          </span>
        </button>
        <div className="win-well p-0 flex-1 overflow-y-auto font-sans text-xs bg-[#d4d0c8] border border-[#808080] space-y-1">
          {isDashboardActive ? (
            <SidebarSectorListView onSelectKey={handleItemClick} />
          ) : (
            <SidebarSectionMenu activeKey={activeKey} activeSubTab={activeSubTab} onSelectKey={handleItemClick} />
          )}
        </div>
      </div>

      {/* 4. Windows Statusbar Footer */}
      <div className="bg-[#d4d0c8] border-t border-[#808080] px-2 py-1 text-[10px] font-mono text-black flex items-center justify-between shrink-0">
        <div className="win-sunken px-1.5 py-0 flex-1 truncate mr-1">BSG CMMS Online</div>
        <div className="win-sunken px-1.5 py-0 text-blue-900 font-bold">SYS: OK</div>
      </div>
    </aside>
  );
}
