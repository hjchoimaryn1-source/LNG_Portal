// src/components/portal/routes/OverviewCalibrationRoutes.tsx
"use client";

import React from 'react';
import { SubProcessKey } from '../../../types/lng';
import CmmsOverviewDashboardView from '../../dashboard/CmmsOverviewDashboardView';
import JakartaHQDashboard from '../../dashboard/JakartaHQDashboard';
import { CalibrationComplianceView } from '../CalibrationComplianceView';
import { resolveEffectivePermission } from '../../../lib/rbac/guardrails';
import { useActiveSession } from '../../../lib/rbac/activeSessionStore';
import type { RoleCode } from '../../../types/rbac';

interface OverviewCalibrationRoutesProps {
  activeKey: SubProcessKey;
  calibrationFilter: string;
  handleSelectSubProcess: (key: SubProcessKey, focusId?: string) => void;
}

// Quick-Login(LoginGateway.tsx) 카드를 아직 거치지 않은 상태(activeSessionStore가
// null)에서 이 라우트가 렌더될 경우를 대비한 최후 방어 기본값 — 실제 세션은
// activeSessionStore.setActiveSession()이 기록한 값을 useActiveSession()으로 구독한다.
const FALLBACK_SESSION = {
  homeLocation: 'HQ' as const,
  userId: 'DEV_HQ_USER',
  roleCode: 'HQ_SUPERVISOR_AUDITOR' as RoleCode,
};

export default function OverviewCalibrationRoutes({ activeKey, calibrationFilter, handleSelectSubProcess }: OverviewCalibrationRoutesProps) {
  // HQ_OVERVIEW_DASHBOARD is an HQ-home view over Site-sourced data (fleetTanks/
  // settlementRecords), so this is exactly the HQ->SITE cross-context case
  // resolveEffectivePermission (guardrails.ts) is built for.
  const activeSession = useActiveSession() ?? FALLBACK_SESSION;
  const { readOnly: hqReadOnly } = resolveEffectivePermission(
    activeSession.homeLocation,
    'SITE',
    null,
    activeSession.userId
  );

  return (
    <>
      {/* ========================================================= */}
      {/* MODULE 6: CMMS OVERVIEW DASHBOARD                         */}
      {/* ========================================================= */}
      {activeKey === 'CMMS_OVERVIEW_DASHBOARD' && (
        <CmmsOverviewDashboardView onNavigate={handleSelectSubProcess} />
      )}

      {/* ========================================================= */}
      {/* MODULE 7: JAKARTA HQ OVERVIEW DASHBOARD                   */}
      {/* ========================================================= */}
      {activeKey === 'HQ_OVERVIEW_DASHBOARD' && (
        <JakartaHQDashboard
          readOnly={hqReadOnly}
          roleCode={activeSession.roleCode}
          onNavigate={handleSelectSubProcess}
        />
      )}

      {/* ========================================================= */}
      {/* MODULE FALLBACK: CALIBRATION & COMPLIANCE                 */}
      {/* ========================================================= */}
      {activeKey === 'CALIBRATION_COMPLIANCE' && (
        <CalibrationComplianceView filter={calibrationFilter} />
      )}
    </>
  );
}
