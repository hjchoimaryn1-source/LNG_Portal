// src/components/portal/sidebar/useSidebarFleetCounts.ts
//
// Extracted out of SidebarSectionMenu.tsx (2026-09-19, sidebar submenu
// inline-expansion stage) so SidebarSectorListView.tsx can show the same
// per-item badge counts (e.g. arunCount) for its now-visible second-level
// items without re-deriving this logic a second time — one more instance of
// the "two independently hand-maintained copies drift apart" pattern this
// stage is specifically trying to avoid (see PortalTitleBar.tsx's old
// CMMS_MODULES array, since unified onto sidebarSections.ts SIDEBAR_SECTIONS,
// same session).

import { useMemo } from 'react';
import { NodeState } from '../../../types/lng';
import { useFleetTankFacade } from '../../../hooks/portalDataFacade/useFleetTankFacade';
import type { SidebarFleetCounts } from './sidebarSections';

export function useSidebarFleetCounts(): SidebarFleetCounts {
  const { fleetTanks } = useFleetTankFacade();

  return useMemo(() => {
    let arunCount = 0;
    let sailingCount = 0;
    let laydownCount = 0;
    let regasBayCount = 0;
    let emptyReturnCount = 0;

    fleetTanks.forEach((t) => {
      if (t.node === NodeState.NODE_1_ARUN_PAG_TERMINAL) arunCount++;
      else if (t.node === NodeState.NODE_2_MV_SAVIOUR_TRANSIT) sailingCount++;
      else if (t.node === NodeState.NODE_3_NIAS_LAYDOWN_YARD) laydownCount++;
      else if (t.node === NodeState.NODE_4_REGAS_ACTIVE_BAY) regasBayCount++;
      else if (t.node === NodeState.NODE_5_EMPTY_RETURN_CYCLE) emptyReturnCount++;
    });

    return {
      arunCount,
      sailingCount,
      niasTotal: laydownCount + regasBayCount + emptyReturnCount,
      totalFleet: fleetTanks.length,
    };
  }, [fleetTanks]);
}
