// src/components/portal/routes/OverviewCalibrationRoutes.tsx
"use client";

import React from 'react';
import { SubProcessKey } from '../../../types/lng';
import CmmsOverviewDashboardView from '../../dashboard/CmmsOverviewDashboardView';
import JakartaHQDashboard from '../../dashboard/JakartaHQDashboard';
import { CalibrationComplianceView } from '../CalibrationComplianceView';
import { resolveEffectivePermission } from '../../../lib/rbac/guardrails';
import type { RoleCode } from '../../../types/rbac';

interface OverviewCalibrationRoutesProps {
  activeKey: SubProcessKey;
  calibrationFilter: string;
  handleSelectSubProcess: (key: SubProcessKey, focusId?: string) => void;
}

// TODO: replace with real user_accounts session once auth backend exists.
// HQ_OVERVIEW_DASHBOARD is an HQ-home view over Site-sourced data (fleetTanks/
// settlementRecords), so this is exactly the HQ->SITE cross-context case
// resolveEffectivePermission (guardrails.ts) is built for.
const HQ_DASHBOARD_SESSION_STUB = {
  homeLocation: 'HQ' as const,
  userId: 'DEV_HQ_USER',
  roleCode: 'HQ_SUPERVISOR_AUDITOR' as RoleCode,
};

export default function OverviewCalibrationRoutes({ activeKey, calibrationFilter, handleSelectSubProcess }: OverviewCalibrationRoutesProps) {
  const { readOnly: hqReadOnly } = resolveEffectivePermission(
    HQ_DASHBOARD_SESSION_STUB.homeLocation,
    'SITE',
    null,
    HQ_DASHBOARD_SESSION_STUB.userId
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
          roleCode={HQ_DASHBOARD_SESSION_STUB.roleCode}
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
