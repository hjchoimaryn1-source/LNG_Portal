// src/cmms-daily-ops/hooks/useIsoTankPrintBridge.ts
//
// PURPOSE
//   FORM-NP-08-33-N 인쇄 뷰(Section C/D)가 useDailyMasterFacade.ts(기존 export,
//   PortalDataContext.tsx 자체는 건드리지 않음)로 읽은 dailyMasterRecords를
//   isoTankPrintMapper.ts의 순수 함수로 변환해 넘겨준다. read-only — 어떤
//   setter도 호출하지 않는다.

'use client';

import { useMemo } from 'react';
import { useDailyMasterFacade } from '../../hooks/portalDataFacade/useDailyMasterFacade';
import {
  buildIsoTankUnloadingSkidDomain,
  buildIsoTankCargoDomain,
  buildIsoTankCargoSummary,
  type IsoTankCargoSummary,
} from '../utils/isoTankPrintMapper';
import type { PatrolValues } from '../dao/dailyOpsPatrolDao';

export interface IsoTankPrintBridgeResult {
  isoTankUnloadingSkid: Record<string, PatrolValues | null>;
  isoTankCargo: Record<string, PatrolValues>;
  isoTankCargoSummary: IsoTankCargoSummary;
}

export function useIsoTankPrintBridge(reportDate: string): IsoTankPrintBridgeResult {
  const { dailyMasterRecords } = useDailyMasterFacade();

  return useMemo(
    () => ({
      isoTankUnloadingSkid: buildIsoTankUnloadingSkidDomain(dailyMasterRecords, reportDate),
      isoTankCargo: buildIsoTankCargoDomain(dailyMasterRecords, reportDate),
      isoTankCargoSummary: buildIsoTankCargoSummary(dailyMasterRecords, reportDate),
    }),
    [dailyMasterRecords, reportDate]
  );
}
