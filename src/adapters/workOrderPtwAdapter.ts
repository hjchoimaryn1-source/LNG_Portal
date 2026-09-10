// src/adapters/workOrderPtwAdapter.ts
//
// PURPOSE
//   Work Order(WOItem)와 PTW Permit을 permitRefNo(레거시 문자열 ref, PTWPermit.id
//   와 동일값)로 연결하는 순수 함수 계층. React 바인딩 없음 — WorkOrderListView /
//   WorkOrderDetailModal 양쪽에서 그대로 재사용한다.
//
//   SIMOPS 위험도는 새로 계산하지 않고 src/hooks/useSIMOPSCheck.ts의
//   evaluateSimopsDryRun()을 그대로 재사용한다 — WO에 연결된 permit이 "새로
//   제출되는 permit" 자리에 대입되어, 자기 자신을 제외한 다른 active permit들과
//   충돌하는지를 동일한 매트릭스로 판정한다.

import { PTWPermit, PTWWorkflowStatus, WOItem } from '../types/lng';
import { evaluateSimopsDryRun, SimopsCheckResult } from '../hooks/useSIMOPSCheck';

/** wo.permitRefNo가 없거나, 있어도 permits 목록에서 찾지 못한 경우까지 구분한다. */
export type WoPermitLinkState = 'NO_PERMIT' | 'PERMIT_NOT_FOUND' | 'LINKED';

export interface WoPermitLinkResult {
  state: WoPermitLinkState;
  permit: PTWPermit | null;
}

export function resolveLinkedPermit(wo: WOItem, permits: PTWPermit[]): WoPermitLinkResult {
  if (!wo.permitRefNo) {
    return { state: 'NO_PERMIT', permit: null };
  }
  const permit = permits.find((p) => p.id === wo.permitRefNo) || null;
  return { state: permit ? 'LINKED' : 'PERMIT_NOT_FOUND', permit };
}

export const WO_PERMIT_STATUS_BADGE: Record<PTWWorkflowStatus, string> = {
  DRAFT: 'text-slate-600 bg-slate-100 border-slate-400',
  PREPARED: 'text-amber-700 bg-amber-50 border-amber-500',
  APPROVED: 'text-blue-700 bg-blue-50 border-blue-500',
  ACTIVE: 'text-emerald-800 bg-emerald-50 border-emerald-700',
  CLOSED: 'text-neutral-500 bg-neutral-100 border-neutral-400',
};

/**
 * WO에 연결된 permit이 다른 활성(ACTIVE/APPROVED) permit과 SIMOPS 공간
 * 간섭을 일으키는지 판정한다. permit 자신은 후보 목록에서 제외한다.
 * permit이 없으면(NO_PERMIT/PERMIT_NOT_FOUND) null을 반환한다.
 */
export function getWoSimopsRisk(permit: PTWPermit | null, allPermits: PTWPermit[]): SimopsCheckResult | null {
  if (!permit) return null;
  const otherActivePermits = allPermits.filter((p) => p.id !== permit.id);
  return evaluateSimopsDryRun(permit.type, permit.workArea || '', permit.equipmentTag || '', otherActivePermits);
}
