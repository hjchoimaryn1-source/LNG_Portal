// src/components/portal/PortalTitleBar.tsx
"use client";

import React from 'react';
import { SubProcessKey } from '../../types/lng';
import { COMPANY_CONFIG } from '../../config/siteConfig';
import { SIDEBAR_SECTIONS } from './sidebar/sidebarSections';
import { WIN_TAB_ACTIVE, WIN_TAB_INACTIVE } from './utils/portalTabStyles';
import { useActiveSession } from '../../lib/rbac/activeSessionStore';
import type { Stage1RoleCode } from '../../lib/rbac/userSecurityRolePermissionSeed';

// Approval Hub Phase 1 Stage 4 — 세션 role/권한 상태를 상시 보여주는 유일한 UI
// 요소(Step 0 확인: 이전까지 없었음). 새 세션 로직을 만들지 않고 기존
// useActiveSession()이 이미 들고 있는 roleCode/homeLocation만 읽는다.
const ROLE_ACCESS_LABELS: Record<Stage1RoleCode, string> = {
  ADMIN: 'Full System Access',
  SITE_MANAGER: 'Site Approval Access',
  OP_TEAM: 'Operations Team',
  HSSE: 'HSSE Team',
  MAINTENANCE: 'Maintenance Team',
  LOGISTIC: 'Logistics Team',
  HR: 'HR Team',
};

interface PortalTitleBarProps {
  currentNav: { location: string; process: string };
  activeKey: SubProcessKey;
  onReturnToLauncher?: () => void;
  handleSelectSubProcess: (key: SubProcessKey) => void;
  onLogout?: () => void;
}

// 2026-09-19(HJ 지시, 승인됨) — SidebarNav.tsx와 완전히 독립된 CMMS_MODULES
// 하드코딩 배열(siteConfig.ts)을 읽던 걸 SIDEBAR_SECTIONS(sidebarSections.ts)
// 직접 참조로 교체한다. 두 네비게이션이 물리적으로 같은 배열 하나만 참조하게
// 되어 "CMMS Overview Dashboard가 LNG-Process 옆 형제 탭으로 뜨는" 종류의
// 버그가 구조적으로 재발할 수 없다(진단 근거는 같은 세션의 이전 보고 참조) —
// DASHBOARD는 SIDEBAR_SECTIONS의 항목이 아니므로(SidebarNav.tsx 자체의
// 마스터 컨테이너 헤더) 여기서도 자동으로 탭 목록에서 빠진다.
export default function PortalTitleBar({
  currentNav,
  activeKey,
  onReturnToLauncher,
  handleSelectSubProcess,
  onLogout,
}: PortalTitleBarProps) {
  const activeSession = useActiveSession();
  const visibleSections = SIDEBAR_SECTIONS.filter((sec) => sec.visible(activeSession));

  return (
    <>
      {/* Breadcrumb bar — 위치 표시 전용(기능 추가 없음).
          2026-09-19(HJ 스크린샷 리뷰 후 재지시, 승인됨) — 이전 단계의 베이지(#e4e0d8) +
          경계 border는 화면상 부자연스러워 폐기. 사이드바 "NIAS CMMS" 헤더 블록과 하나의
          연속된 블루 밴드로 보이도록 DASHBOARD 마스터 헤더(win-titlebar, globals.css)와
          동일한 --win-blue-start→--win-blue-end 그라디언트를 재사용하고, 높이는
          --portal-topbar-h 공유 변수로 고정해 NIAS CMMS 블록과 일치시킨다(경계 border는
          제거 — 두 블록이 맞붙어 하나로 보이는 것이 이번 요구사항).
          2026-09-19(HJ 디자인 통일 승인) — TIER 1은 텍스트 전용, 아이콘 없음(Monitor 제거).
          2026-09-19(HJ 지시, 승인됨 → 정정) — 사이드바 로고 영역에 회사명이 이미 표시되어
          있어 회사명("BERKAT SAMUDRA GEMILANG LINES")만 제거한다. 시스템 정체성인
          "NIAS CMMS"는 유지("NIAS CMMS - [ ... ]" 구조, 사이드바 표기와 통일해 하이픈
          삭제). process가 빈 문자열인
          엔트리(예: CMMS_OVERVIEW_DASHBOARD)는 " > " 구분자 없이 location만 표시해
          in-page 제목과 동일한 단일 타이틀 형태로 보이게 한다. */}
      <div className="h-[var(--portal-topbar-h)] px-2 flex items-center justify-between bg-[linear-gradient(90deg,var(--win-blue-start)_0%,var(--win-blue-end)_100%)] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tracking-wide text-white">
            {COMPANY_CONFIG.systemTitle} - [ {currentNav.location}{currentNav.process ? <> &gt; {currentNav.process}</> : null} ]
          </span>
        </div>
        {activeSession && (
          <span
            className="text-[10px] font-mono font-bold tracking-wide text-white/90 bg-white/10 border border-white/30 rounded px-1.5 py-0.5 shrink-0"
            title={`Employee ${activeSession.employeeId} · ${activeSession.homeLocation}`}
          >
            {activeSession.roleCode} — {ROLE_ACCESS_LABELS[activeSession.roleCode]}
          </span>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. ROW 1: Top Sector Tab Bar — SIDEBAR_SECTIONS (Authentic Bevel Style)   */}
      {/* ========================================================================= */}
      <div className="bg-[#d4d0c8] border-b border-[#808080] px-2 py-1.5 flex items-center justify-between gap-2 flex-wrap shrink-0">
        {/* Left: one tab per visible SIDEBAR_SECTIONS entry (Bevel Outset / Inset Effect) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {visibleSections.map((sec) => {
            const isActive = sec.matches(activeKey);
            return (
              <button
                key={sec.id}
                onClick={() => handleSelectSubProcess(sec.entryKey)}
                className={isActive ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
                title={sec.label}
              >
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Launcher Shortcut — DASHBOARD/LOG OUT caps match the sidebar
            header's caps; LOG OUT gets its own divider + muted warning tone so
            it isn't mistaken for an equivalent action sitting next to DASHBOARD. */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onReturnToLauncher && (
            <button
              onClick={() => handleSelectSubProcess('CMMS_OVERVIEW_DASHBOARD')}
              className="win-btn text-sm px-2.5 py-1 cursor-pointer font-bold text-blue-950 tracking-wide"
              title="Return to CMMS Overview Dashboard"
            >
              DASHBOARD
            </button>
          )}
          {onReturnToLauncher && onLogout && (
            <div className="w-px h-5 bg-[#808080] mx-0.5" aria-hidden="true" />
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              className="win-btn text-sm px-2.5 py-1 cursor-pointer font-bold text-amber-800 tracking-wide"
              title="Lock Session / Logout"
            >
              LOG OUT
            </button>
          )}
        </div>
      </div>
    </>
  );
}
