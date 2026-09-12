// src/components/cmms/mockWorkOrderGenerator.ts
//
// PURPOSE
//   Derive a bounded, deterministic WOItem[] from real CMMS asset snapshot rows
//   (CmmsAssetRow), replacing the previously hardcoded ALL_WORK_ORDERS mock ledger
//   in WorkOrderListView.tsx. Pure function — no React, no side effects.
//
// WO-PTW LINKING
//   permitRefNo is populated only when a permit in `activePermits` has an
//   equipmentTag matching the asset's equipmentTag AND is currently in force
//   (status APPROVED/ACTIVE — see LINKABLE_PERMIT_STATUSES below; see also
//   resolveLinkedPermit in src/adapters/workOrderPtwAdapter.ts, which matches on
//   permitRefNo === permit.id, not on tag). A DRAFT/PREPARED permit is not yet
//   issued and a CLOSED one is no longer in effect, so neither should make a WO
//   display as if a live PTW were backing it. Most generated entries are still
//   expected to resolve to NO_PERMIT today, since INITIAL_PTW_PERMITS
//   (src/data/ptwMasterData.ts) is separate mock data with its own equipment
//   tags — this is expected, not a bug.

import type { CmmsAssetRow } from '../../context/CmmsAwarePortalProvider';
import type { PTWPermit, PTWWorkflowStatus, WOItem, WorkOrderCategory, WorkOrderPriority, WorkOrderStatus } from '../../types/lng';

/** WO에 "유효한 PTW가 걸려있다"고 표시할 수 있는 permit 상태 — 발효 전(DRAFT/PREPARED)이거나
 *  종료된(CLOSED) permit은 링크 대상에서 제외한다. */
const LINKABLE_PERMIT_STATUSES: readonly PTWWorkflowStatus[] = ['APPROVED', 'ACTIVE'];

const MAX_GENERATED_WORK_ORDERS = 25;

const CRITICALITY_RANK: Record<CmmsAssetRow['criticality'], number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

function criticalityToPriority(c: CmmsAssetRow['criticality']): WorkOrderPriority {
  switch (c) {
    case 'CRITICAL':
      return 'Critical';
    case 'HIGH':
      return 'High';
    case 'MEDIUM':
      return 'Medium';
    default:
      return 'Low';
  }
}

function criticalityToCategory(c: CmmsAssetRow['criticality']): WorkOrderCategory {
  if (c === 'CRITICAL') return 'OVERHAUL';
  if (c === 'HIGH') return 'PMS';
  return 'MRO';
}

// Deterministic due-date offset (0-27 days) derived from equipmentTag, so the
// same assets array always produces the same due dates across re-renders/reloads.
function deterministicDueDateOffsetDays(equipmentTag: string): number {
  let hash = 0;
  for (let i = 0; i < equipmentTag.length; i += 1) {
    hash = (hash * 31 + equipmentTag.charCodeAt(i)) >>> 0;
  }
  return hash % 28;
}

const BASE_DUE_DATE = Date.UTC(2026, 8, 10); // 2026-09-10, fixed — not `new Date()`

function toDueDateIso(offsetDays: number): string {
  const d = new Date(BASE_DUE_DATE + offsetDays * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

const FIXED_STATUS: WorkOrderStatus = 'SCHEDULED';
const UNASSIGNED_TECH = '미배정';

export function buildMockWorkOrdersFromAssets(assets: CmmsAssetRow[], activePermits: PTWPermit[]): WOItem[] {
  const prioritized = [...assets]
    .sort((a, b) => CRITICALITY_RANK[a.criticality] - CRITICALITY_RANK[b.criticality])
    .slice(0, MAX_GENERATED_WORK_ORDERS);

  return prioritized.map((asset, i) => {
    const matchedPermit = activePermits.find(
      (p) => p.equipmentTag === asset.equipmentTag && LINKABLE_PERMIT_STATUSES.includes(p.status)
    );

    return {
      wo: `WO-2026-${String(i + 1).padStart(4, '0')}`,
      cat: criticalityToCategory(asset.criticality),
      tag: asset.equipmentTag,
      type: asset.isoClass,
      desc: `[MOCK] ${asset.assetName} — routine inspection`,
      priority: criticalityToPriority(asset.criticality),
      due: toDueDateIso(deterministicDueDateOffsetDays(asset.equipmentTag)),
      tech: UNASSIGNED_TECH,
      status: FIXED_STATUS,
      permitRefNo: matchedPermit?.id,
    };
  });
}
