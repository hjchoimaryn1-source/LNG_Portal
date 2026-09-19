// src/components/portal/PortalTitleBar.tsx
"use client";

import React from 'react';
import { Monitor } from 'lucide-react';
import { SubProcessKey } from '../../types/lng';
import { COMPANY_CONFIG, CMMS_MODULES } from '../../config/siteConfig';
import { WIN_TAB_ACTIVE, WIN_TAB_INACTIVE } from './utils/portalTabStyles';
import { useActiveSession } from '../../lib/rbac/activeSessionStore';
import { isNavItemVisible } from '../../lib/rbac/navPermissionMap';
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
  currentModuleId: string;
  onReturnToLauncher?: () => void;
  handleSelectSubProcess: (key: SubProcessKey) => void;
  onLogout?: () => void;
}

export default function PortalTitleBar({
  currentNav,
  currentModuleId,
  onReturnToLauncher,
  handleSelectSubProcess,
  onLogout,
}: PortalTitleBarProps) {
  const activeSession = useActiveSession();
  const visibleModules = CMMS_MODULES.filter((mod) => isNavItemVisible(mod.defaultKey, activeSession));

  return (
    <>
      {/* Windows Titlebar */}
      <div className="win-titlebar flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor className="w-3.5 h-3.5 text-white" />
          <span className="text-xs font-bold tracking-wide">
            {COMPANY_CONFIG.systemTitle} | {COMPANY_CONFIG.companyName} - [ {currentNav.location} &gt; {currentNav.process} ]
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
      {/* 1. ROW 1: CMMS Core 4 Modules Navigation Bar (Authentic Bevel Style)      */}
      {/* ========================================================================= */}
      <div className="bg-[#d4d0c8] border-b border-[#808080] px-2 py-1.5 flex items-center justify-between gap-2 flex-wrap shrink-0">
        {/* Left: Hub + 5 Core CMMS Modules Tabs (Bevel Outset / Inset Effect) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {visibleModules.map((mod) => {
            const isActive = currentModuleId === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => handleSelectSubProcess(mod.defaultKey as SubProcessKey)}
                className={isActive ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
                title={mod.description}
              >
                <span>{mod.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Launcher Shortcut */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onReturnToLauncher && (
            <button
              onClick={() => handleSelectSubProcess('CMMS_OVERVIEW_DASHBOARD')}
              className="win-btn text-xs px-2.5 py-1 cursor-pointer font-bold text-blue-950"
              title="Return to CMMS Overview Dashboard"
            >
              Dashboard
            </button>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              className="win-btn text-xs px-2 py-1 cursor-pointer text-slate-700"
              title="Lock Session / Logout"
            >
              Log Out
            </button>
          )}
        </div>
      </div>
    </>
  );
}
