// src/config/hmiControlMapsRegistry.tsx
//
// "HMI CONTROL MAPS" 섹터의 단일 등록 지점. Metering/Buffering/Vapor 등 향후
// 화면은 여기에 항목 1개만 추가하면 SidebarNav.tsx / getInitialNav.ts /
// HmiControlMapsRoutes.tsx 수정 없이 자동 반영된다.

import type { ComponentType } from 'react';
import { SubProcessKey } from '../types/lng';
import { PIDOverlayView } from '../cmms-daily-ops/pid/PIDOverlayView';
import { HmiOverviewContainer } from '../cmms-daily-ops/hmi-overview/HmiOverviewContainer';
import { today } from '../cmms-daily-ops/utils/dailyOpsDateHelpers';
import { MeteringHmiPlaceholderView } from '../cmms-hmi-control-maps/MeteringHmiPlaceholderView';
import { BufferingHmiPlaceholderView } from '../cmms-hmi-control-maps/BufferingHmiPlaceholderView';
import { VaporHmiPlaceholderView } from '../cmms-hmi-control-maps/VaporHmiPlaceholderView';

export interface HmiControlMapEntry {
  key: SubProcessKey;
  label: string;
  component: ComponentType;
}

// SidebarNav.tsx / getInitialNav.ts가 쓰는 "메뉴 그룹" 문자열. 별도 Sector enum은
// 존재하지 않으며(usePortalNavigation.tsx의 activeMenu는 평범한 string state),
// 형제 섹터 값(lng-process, nias-terminal, trucking, environment, moc)과 동일한
// kebab-case 컨벤션을 따른다.
export const HMI_CONTROL_MAPS_MENU = 'hmi-visual';

export const HMI_CONTROL_MAPS_REGISTRY: HmiControlMapEntry[] = [
  {
    key: 'DAILY_OPS_LIVE_PID_MAP',
    label: 'Live P&ID Map',
    component: PIDOverlayView,
  },
  {
    key: 'DAILY_OPS_HMI_OVERVIEW',
    label: 'HMI Overview',
    component: () => <HmiOverviewContainer reportDate={today()} />,
  },
  {
    key: 'HMI_METERING_MAP',
    label: 'Metering',
    component: MeteringHmiPlaceholderView,
  },
  {
    key: 'HMI_BUFFERING_MAP',
    label: 'Buffering',
    component: BufferingHmiPlaceholderView,
  },
  {
    key: 'HMI_VAPOR_MAP',
    label: 'Vapor',
    component: VaporHmiPlaceholderView,
  },
];
