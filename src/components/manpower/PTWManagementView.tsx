// src/components/manpower/PTWManagementView.tsx
"use client";

import React from 'react';
import { StaffPersonnel } from '../../types/lng';
import SafetyOverviewTab from './tabs/SafetyOverviewTab';
import PTWMasterRegisterTab from './tabs/PTWMasterRegisterTab';
import GasTestingLogTab from './tabs/GasTestingLogTab';
import ERTReadinessTab from './tabs/ERTReadinessTab';

export type PTWActiveTab = 'SAFETY_OVERVIEW' | 'MASTER_REGISTER' | 'GAS_TESTING_LOG' | 'ERT_READINESS';

interface PTWManagementViewProps {
  activeTab: PTWActiveTab;
  personnelList: StaffPersonnel[];
  isERTMet: boolean;
  // ERT Readiness 탭(Phase 4)에서 소비 예정 — Master Register / Gas Testing Log 탭은 사용하지 않는다.
  ertSummary: {
    icCount: number;
    fireChiefCount: number;
    firstAiderCount: number;
    gasResponseCount: number;
  };
  onNavigateToMatrix?: (empId: string) => void;
  onNavigateToDailyShift?: () => void;
  focusId?: string;
}

/**
 * PTW 관리 뷰의 경량 탭 라우터 셸.
 * 실제 화면 로직은 각 tabs/*Tab.tsx가 담당하며, permits 공유 상태는
 * PTWMasterRegisterTab 내부의 usePTWPermits 훅이 소유한다.
 */
export default function PTWManagementView({
  activeTab,
  personnelList,
  isERTMet,
  onNavigateToMatrix,
  focusId,
}: PTWManagementViewProps) {
  switch (activeTab) {
    case 'SAFETY_OVERVIEW':
      return <SafetyOverviewTab />;
    case 'GAS_TESTING_LOG':
      return <GasTestingLogTab />;
    case 'ERT_READINESS':
      return <ERTReadinessTab />;
    case 'MASTER_REGISTER':
    default:
      return (
        <PTWMasterRegisterTab
          personnelList={personnelList}
          isERTMet={isERTMet}
          onNavigateToMatrix={onNavigateToMatrix}
          focusId={focusId}
        />
      );
  }
}
