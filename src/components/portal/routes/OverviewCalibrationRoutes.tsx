// src/components/portal/routes/OverviewCalibrationRoutes.tsx
"use client";

import React from 'react';
import { SubProcessKey } from '../../../types/lng';
import CmmsOverviewDashboardView from '../../dashboard/CmmsOverviewDashboardView';
import { CalibrationComplianceView } from '../CalibrationComplianceView';

interface OverviewCalibrationRoutesProps {
  activeKey: SubProcessKey;
  calibrationFilter: string;
}

export default function OverviewCalibrationRoutes({ activeKey, calibrationFilter }: OverviewCalibrationRoutesProps) {
  return (
    <>
      {/* ========================================================= */}
      {/* MODULE 6: CMMS OVERVIEW DASHBOARD                         */}
      {/* ========================================================= */}
      {activeKey === 'CMMS_OVERVIEW_DASHBOARD' && (
        <CmmsOverviewDashboardView />
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
