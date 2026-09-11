// src/components/dashboard/JakartaHQDashboard.tsx
//
// PURPOSE
//   CMMS_Architecture.md §3.1.1 HQ Overview Dashboard 구현체 (재구현, Sector 7
//   진입점 — SectorLauncherHub.tsx 참조). 120 ISO Tank Fleet Status / Energy
//   Reconciliation / Settlement Ledger & Dispute Audit 3개 패널을 배치하는
//   순수 UI Layer. 계산 로직은 utils/hqEnergyReconciliation.ts, 데이터는
//   usePortalData()(PortalDataContext, 기존 무수정)에서 가져온다.
//
//   Auditor Mode: readOnly/roleCode는 이 컴포넌트가 마운트되는 지점
//   (OverviewCalibrationRoutes.tsx)에서 resolveEffectivePermission으로 미리
//   계산되어 prop으로 전달된다. 여기서는 (1) 배너 표시, (2) 하위 패널에
//   readOnly/roleCode를 전달해 뮤테이션 컨트롤을 비활성화하는 역할만 한다 —
//   실제 defense-in-depth 차단(blockIfAuditorMode 호출)은 뮤테이션 핸들러를
//   가진 HqSettlementDisputePanel 내부에서 수행한다.

'use client';

import React, { useMemo } from 'react';
import { AlertTriangle, LayoutDashboard } from 'lucide-react';
import { usePortalData } from '../../context/PortalDataContext';
import type { SubProcessKey } from '../../types/lng';
import type { RoleCode } from '../../types/rbac';
import { CRITICALITY_BADGE, TITLE_BAR } from '../cmms/scadaStyles';
import HqTankFleetStatusPanel from './panels/HqTankFleetStatusPanel';
import HqEnergyReconciliationPanel from './panels/HqEnergyReconciliationPanel';
import HqSettlementDisputePanel from './panels/HqSettlementDisputePanel';
import { computeEnergyReconciliation } from './utils/hqEnergyReconciliation';

interface JakartaHQDashboardProps {
  readOnly: boolean;
  roleCode: RoleCode;
  onNavigate?: (key: SubProcessKey, focusId?: string) => void;
}

export default function JakartaHQDashboard({ readOnly, roleCode, onNavigate }: JakartaHQDashboardProps) {
  const { fleetTanks, settlementRecords } = usePortalData();
  const reconciliation = useMemo(
    () => computeEnergyReconciliation(settlementRecords),
    [settlementRecords]
  );

  return (
    <div className="h-full flex flex-col min-h-0 gap-2 w-full p-2 overflow-hidden">
      {readOnly && (
        <div className={`${TITLE_BAR} flex items-center justify-center gap-2 shrink-0`}>
          <AlertTriangle className="w-3.5 h-3.5" />
          <span className={`px-2 py-0.5 border font-bold tracking-wide ${CRITICALITY_BADGE.CRITICAL}`}>
            AUDITOR MODE — READ ONLY
          </span>
        </div>
      )}

      <div className="win-panel px-2 py-1.5 flex items-center justify-between shrink-0">
        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <LayoutDashboard className="w-3.5 h-3.5" />
          Jakarta HQ Overview — Fleet & Settlement Command Center
        </span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2">
        <HqTankFleetStatusPanel fleetTanks={fleetTanks} />
        <HqEnergyReconciliationPanel summary={reconciliation} />
        <HqSettlementDisputePanel
          disputeRecords={reconciliation.disputeRecords}
          readOnly={readOnly}
          roleCode={roleCode}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}
