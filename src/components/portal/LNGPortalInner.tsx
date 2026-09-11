// src/components/portal/LNGPortalInner.tsx
"use client";

import React from 'react';
import { usePortalData } from '../../context/CmmsAwarePortalProvider';
import { useTheme } from '../../context/ThemeContext';
import { SubProcessKey } from '../../types/lng';
import SidebarNav from '../SidebarNav';
import { Loader2 } from 'lucide-react';
import { usePortalNavigation } from './hooks/usePortalNavigation';
import PortalHeader from './PortalHeader';
import PortalRouteView from './routes/PortalRouteView';

interface LNGPortalInnerProps {
  initialKey?: SubProcessKey;
  onReturnToLauncher?: () => void;
  onLogout?: () => void;
}

export default function LNGPortalInner({
  initialKey = 'LNG_PROCESS_OVERVIEW',
  onReturnToLauncher,
  onLogout,
}: LNGPortalInnerProps) {
  const { theme, setTheme } = useTheme();
  const { isLoading } = usePortalData();

  const {
    activeSubTab,
    activeKey,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    focusRecordId,
    equipmentFilter,
    setEquipmentFilter,
    showCmmsRegistry,
    setShowCmmsRegistry,
    workOrderFilter,
    setWorkOrderFilter,
    showWoSchedulerPreview,
    setShowWoSchedulerPreview,
    calibrationFilter,
    currentNav,
    currentModuleId,
    handleSelectSubProcess,
    handleManpowerSubTab,
    handleRefreshCurrentModuleOverview,
  } = usePortalNavigation(initialKey, onReturnToLauncher);

  return (
    <div className="h-screen w-screen bg-[#d4d0c8] text-black font-sans flex flex-col md:flex-row overflow-hidden select-none">
      {/* Left Sidebar Navigation */}
      <SidebarNav
        activeKey={activeKey}
        activeSubTab={activeSubTab}
        onSelectKey={handleSelectSubProcess}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Mobile Sidebar Overlay Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}

      {/* Right Main Content Body */}
      <div className="flex-1 h-full flex flex-col min-w-0 min-h-0 overflow-hidden bg-[#d4d0c8]">
        {/* Top Application Window Bar & 2-Tier Header Navigation */}
        <PortalHeader
          currentNav={currentNav}
          currentModuleId={currentModuleId}
          activeKey={activeKey}
          activeSubTab={activeSubTab}
          equipmentFilter={equipmentFilter}
          setEquipmentFilter={setEquipmentFilter}
          workOrderFilter={workOrderFilter}
          setWorkOrderFilter={setWorkOrderFilter}
          handleSelectSubProcess={handleSelectSubProcess}
          handleManpowerSubTab={handleManpowerSubTab}
          handleRefreshCurrentModuleOverview={handleRefreshCurrentModuleOverview}
          onReturnToLauncher={onReturnToLauncher}
          onLogout={onLogout}
        />

        {/* Dynamic Workspace Route View - 100% Full Height Container */}
        <main className="flex-1 h-full flex flex-col min-h-0 w-full p-1.5 overflow-hidden bg-[#d4d0c8]">
          {isLoading ? (
            <div className="win-panel p-8 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-900 animate-spin" />
              <p className="text-xs font-bold font-mono">Hydrating 7 CSV operational datasets ...</p>
            </div>
          ) : (
            <PortalRouteView
              activeKey={activeKey}
              activeSubTab={activeSubTab}
              focusRecordId={focusRecordId}
              handleSelectSubProcess={handleSelectSubProcess}
              handleManpowerSubTab={handleManpowerSubTab}
              equipmentFilter={equipmentFilter}
              showCmmsRegistry={showCmmsRegistry}
              setShowCmmsRegistry={setShowCmmsRegistry}
              workOrderFilter={workOrderFilter}
              showWoSchedulerPreview={showWoSchedulerPreview}
              setShowWoSchedulerPreview={setShowWoSchedulerPreview}
              calibrationFilter={calibrationFilter}
            />
          )}
        </main>
      </div>
    </div>
  );
}
