// src/components/portal/routes/HmiControlMapsRoutes.tsx
//
// "HMI CONTROL MAPS" 섹터 라우트 — EnvironmentRoutes.tsx/MocRoutes.tsx와 동일한
// "{activeKey === 'X' && (<Component/>)}" 패턴 대신, HMI_CONTROL_MAPS_REGISTRY를
// 조회해 렌더링한다(레지스트리 항목 추가만으로 신규 화면이 라우팅되도록).

'use client';

import { SubProcessKey } from '../../../types/lng';
import { HMI_CONTROL_MAPS_REGISTRY } from '../../../config/hmiControlMapsRegistry';

interface HmiControlMapsRoutesProps {
  activeKey: SubProcessKey;
}

export default function HmiControlMapsRoutes({ activeKey }: HmiControlMapsRoutesProps) {
  const entry = HMI_CONTROL_MAPS_REGISTRY.find((e) => e.key === activeKey);
  if (!entry) return null;
  const Component = entry.component;
  return <Component />;
}
