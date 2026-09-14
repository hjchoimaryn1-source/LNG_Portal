// src/components/portal/routes/ManpowerSafetyRoutes.tsx
"use client";

import React from 'react';
import { SubProcessKey } from '../../../types/lng';
import ManpowerRosterView from '../../manpower/ManpowerRosterView';
import PTWManagementView from '../../manpower/PTWManagementView';
import { INITIAL_MANPOWER_MASTER_RECORDS } from '../../../data/manpowerMasterData';
import { ManpowerTabKey, NORMALIZE_MANPOWER_TAB } from '../utils/manpowerTabConstants';
import { SopReferenceViewer } from '../../sop';
import { decodeSopQuickLinkTarget } from '../../sop/utils/sopQuickLinkTarget';

interface ManpowerSafetyRoutesProps {
  activeKey: SubProcessKey;
  activeSubTab: string;
  handleSelectSubProcess: (key: SubProcessKey, focusId?: string) => void;
  handleManpowerSubTab: (tab: ManpowerTabKey) => void;
  focusRecordId?: string | null;
}

export default function ManpowerSafetyRoutes({
  activeKey,
  activeSubTab,
  handleSelectSubProcess,
  handleManpowerSubTab,
  focusRecordId,
}: ManpowerSafetyRoutesProps) {
  return (
    <>
      {/* ========================================================= */}
      {/* MODULE 4: SITE MANNING & ROSTER (PRIMARY PROMOTED)        */}
      {/* ========================================================= */}
      {(activeKey === 'MANPOWER_SHIFT_ROSTER' || activeKey === 'MANPOWER_DAILY_SHIFT') && (
        <ManpowerRosterView
          activeTab={NORMALIZE_MANPOWER_TAB(activeSubTab || 'OVERVIEW')}
          onTabChange={(tab) => handleManpowerSubTab(tab)}
          initialSubView={NORMALIZE_MANPOWER_TAB(activeSubTab || 'OVERVIEW')}
        />
      )}
      {activeKey === 'MANPOWER_MONTHLY_GRID' && (
        <ManpowerRosterView
          activeTab={NORMALIZE_MANPOWER_TAB(activeSubTab || 'MONTHLY_GRID')}
          onTabChange={(tab) => handleManpowerSubTab(tab)}
          initialSubView={NORMALIZE_MANPOWER_TAB(activeSubTab || 'MONTHLY_GRID')}
        />
      )}
      {activeKey === 'MANPOWER_ROTATION_TRACKER' && (
        <ManpowerRosterView
          activeTab={NORMALIZE_MANPOWER_TAB(activeSubTab || 'ROTATION_TRACKER')}
          onTabChange={(tab) => handleManpowerSubTab(tab)}
          initialSubView={NORMALIZE_MANPOWER_TAB(activeSubTab || 'ROTATION_TRACKER')}
        />
      )}
      {activeKey === 'MANPOWER_TRAINING_MATRIX' && (
        <ManpowerRosterView
          activeTab={NORMALIZE_MANPOWER_TAB(activeSubTab || 'TRAINING_MATRIX')}
          onTabChange={(tab) => handleManpowerSubTab(tab)}
          initialSubView={NORMALIZE_MANPOWER_TAB(activeSubTab || 'TRAINING_MATRIX')}
        />
      )}

      {/* ========================================================= */}
      {/* MODULE 5: SAFETY & PTW (PRIMARY PROMOTED)                 */}
      {/* ========================================================= */}
      {(activeKey === 'MANPOWER_PTW' ||
        activeKey === 'SAFETY_OVERVIEW' ||
        activeKey === 'PTW_PERMITS' ||
        activeKey === 'SAFETY_GAS_TESTING' ||
        activeKey === 'SAFETY_ERT_READINESS') && (
        <PTWManagementView
          activeTab={
            activeKey === 'SAFETY_OVERVIEW'
              ? 'SAFETY_OVERVIEW'
              : activeKey === 'SAFETY_GAS_TESTING'
              ? 'GAS_TESTING_LOG'
              : activeKey === 'SAFETY_ERT_READINESS'
              ? 'ERT_READINESS'
              : 'MASTER_REGISTER'
          }
          personnelList={INITIAL_MANPOWER_MASTER_RECORDS}
          isERTMet={true}
          ertSummary={{
            icCount: 1,
            fireChiefCount: 2,
            firstAiderCount: 3,
            gasResponseCount: 4,
          }}
          onNavigateToMatrix={() => handleSelectSubProcess('MANPOWER_TRAINING_MATRIX')}
          onNavigateToDailyShift={() => handleSelectSubProcess('MANPOWER_DAILY_SHIFT')}
          onNavigateToSopReference={(target) => handleSelectSubProcess('SAFETY_SOP_REFERENCE', target)}
          focusId={focusRecordId ?? undefined}
        />
      )}

      {activeKey === 'SAFETY_SOP_REFERENCE' && (
        <SopReferenceViewer initialTarget={decodeSopQuickLinkTarget(focusRecordId)} />
      )}
    </>
  );
}
