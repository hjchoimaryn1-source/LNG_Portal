// src/components/portal/routes/OverviewCalibrationRoutes.tsx
"use client";

import React from 'react';
import { SubProcessKey } from '../../../types/lng';
import CmmsOverviewDashboardView from '../../dashboard/CmmsOverviewDashboardView';
import JakartaHQDashboard from '../../dashboard/JakartaHQDashboard';
import { CalibrationComplianceView } from '../CalibrationComplianceView';
import { resolveEffectivePermission } from '../../../lib/rbac/guardrails';
import { useActiveSession } from '../../../lib/rbac/activeSessionStore';
import { SESSION_EXPIRED_MESSAGE } from '../../../lib/rbac/sessionExpiryMessage';

interface OverviewCalibrationRoutesProps {
  activeKey: SubProcessKey;
  calibrationFilter: string;
  handleSelectSubProcess: (key: SubProcessKey, focusId?: string) => void;
}

export default function OverviewCalibrationRoutes({ activeKey, calibrationFilter, handleSelectSubProcess }: OverviewCalibrationRoutesProps) {
  // HQ_OVERVIEW_DASHBOARD is an HQ-home view over Site-sourced data (fleetTanks/
  // settlementRecords), so this is exactly the HQ->SITE cross-context case
  // resolveEffectivePermission (guardrails.ts) is built for.
  // Stage 3 Step 3: activeSession can go null mid-use (activeSessionStore is an
  // in-memory singleton reset without remounting the login gate) — this used to
  // silently substitute a FALLBACK_SESSION (DEV_HQ_USER) identity; now the
  // HQ_OVERVIEW_DASHBOARD branch below shows a session-expired notice instead.
  const activeSession = useActiveSession();
  const hqReadOnly = activeSession
    ? resolveEffectivePermission(activeSession.homeLocation, 'SITE', null, activeSession.userId).readOnly
    : false;

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
        activeSession ? (
          <JakartaHQDashboard
            readOnly={hqReadOnly}
            roleCode={activeSession.roleCode}
            onNavigate={handleSelectSubProcess}
          />
        ) : (
          <div className="p-4 text-[12px] font-mono text-red-700 bg-red-50 border border-red-700">
            {SESSION_EXPIRED_MESSAGE}
          </div>
        )
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
