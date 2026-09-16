// src/components/portal/PortalTitleBar.tsx
"use client";

import React from 'react';
import { Monitor } from 'lucide-react';
import { SubProcessKey } from '../../types/lng';
import { COMPANY_CONFIG, CMMS_MODULES } from '../../config/siteConfig';
import { WIN_TAB_ACTIVE, WIN_TAB_INACTIVE } from './utils/portalTabStyles';

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
  return (
    <>
      {/* Windows Titlebar */}
      <div className="win-titlebar">
        <div className="flex items-center gap-2">
          <Monitor className="w-3.5 h-3.5 text-white" />
          <span className="text-xs font-bold tracking-wide">
            {COMPANY_CONFIG.systemTitle} | {COMPANY_CONFIG.companyName} - [ {currentNav.location} &gt; {currentNav.process} ]
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. ROW 1: CMMS Core 4 Modules Navigation Bar (Authentic Bevel Style)      */}
      {/* ========================================================================= */}
      <div className="bg-[#d4d0c8] border-b border-[#808080] px-2 py-1.5 flex items-center justify-between gap-2 flex-wrap shrink-0">
        {/* Left: Hub + 5 Core CMMS Modules Tabs (Bevel Outset / Inset Effect) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {CMMS_MODULES.map((mod) => {
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
              onClick={onReturnToLauncher}
              className="win-btn text-xs px-2.5 py-1 cursor-pointer font-bold text-blue-950"
              title="Return to 5 Sector Launcher Hub"
            >
              To Main
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
