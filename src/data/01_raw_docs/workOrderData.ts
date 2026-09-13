// src/data/workOrderData.ts
// Work Order & Maintenance mock ledger (PMS/OVERHAUL/MRO). Extracted from the
// inline array formerly in LNGPortalApp.tsx's WorkOrderView. permitRefNo links
// a subset of items to INITIAL_PTW_PERMITS (src/data/ptwMasterData.ts) mock
// permits for the WO-PTW linkage demo — not every WO requires an e-PTW.

import { WOItem } from '../../types/lng';

export const ALL_WORK_ORDERS: WOItem[] = [
  {
    wo: 'WO-2026-0841',
    cat: 'PMS',
    tag: 'AAV-104',
    type: 'Preventive (PMS)',
    desc: 'Vaporizer 30-Day Defrost & Thermal Cycle Inspection',
    priority: 'Medium',
    due: '2026-08-30',
    tech: 'H. Siregar',
    status: 'IN_PROGRESS',
  },
  {
    wo: 'WO-2026-0839',
    cat: 'OVERHAUL',
    tag: 'GEN-02',
    type: 'Routine (500h)',
    desc: 'MAN 7L 51/60 DF Lube Oil Sampling & Filter Replacement',
    priority: 'High',
    due: '2026-09-02',
    tech: 'A. Fauzi',
    status: 'SCHEDULED',
    permitRefNo: 'PTW-2026-0901-04',
  },
  {
    wo: 'WO-2026-0835',
    cat: 'PMS',
    tag: 'PRSS-01',
    type: 'Calibration',
    desc: 'PRSS Dual Redundant Pilot Regulator Trim Inspection',
    priority: 'High',
    due: '2026-08-28',
    tech: 'B. Pratama',
    status: 'COMPLETED',
    permitRefNo: 'PTW-2026-0901-01',
  },
  {
    wo: 'WO-2026-0828',
    cat: 'MRO',
    tag: 'IT-5088',
    type: 'Corrective (MRO)',
    desc: 'Laydown 2 ISO Tank Secondary Relief Valve Gasket Replace',
    priority: 'Critical',
    due: '2026-08-26',
    tech: 'M. Yusuf',
    status: 'PARTS_PENDING',
    permitRefNo: 'PTW-2026-0901-02',
  },
];
