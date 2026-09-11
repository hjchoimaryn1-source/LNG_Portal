// src/components/sop/constants/sopQuickLinkMap.ts
// Static context -> SOP deep-link table for SopQuickLinkBar. Consumer screens
// (NewPTWPermitModal, WorkOrderListView, CargoHandlingPermitForm) pass a
// context key; this file owns the mapping so those screens never hardcode
// npCode/anchorId literals.

export type SopQuickLinkContext =
  | 'PTW_COLD_WORK'
  | 'PTW_HOT_WORK'
  | 'PTW_CONFINED_SPACE'
  | 'PTW_ELECTRICAL'
  | 'PTW_EXCAVATION'
  | 'PTW_RADIOGRAPHY'
  | 'PTW_CARGO_HANDLING_UNLOADING'
  | 'PTW_CARGO_HANDLING_LIFTING'
  | 'WORK_ORDER_MAINTENANCE';

export interface SopQuickLink {
  npCode: string;
  anchorId: string;
  label: string;
}

export const SOP_QUICK_LINK_MAP: Record<SopQuickLinkContext, SopQuickLink[]> = {
  PTW_COLD_WORK: [
    { npCode: 'NP-07', anchorId: 'np-07-10-to-15-ptw-forms', label: 'NP07-10 Cold Work' },
  ],
  PTW_HOT_WORK: [
    { npCode: 'NP-07', anchorId: 'np-07-10-to-15-ptw-forms', label: 'NP07-14 Hot Work' },
  ],
  PTW_CONFINED_SPACE: [
    { npCode: 'NP-07', anchorId: 'np-07-10-to-15-ptw-forms', label: 'NP07-11 Confined Space' },
  ],
  PTW_ELECTRICAL: [
    { npCode: 'NP-07', anchorId: 'np-07-10-to-15-ptw-forms', label: 'NP07-12 Electrical' },
  ],
  PTW_EXCAVATION: [
    { npCode: 'NP-07', anchorId: 'np-07-10-to-15-ptw-forms', label: 'NP07-13 Excavation' },
  ],
  PTW_RADIOGRAPHY: [
    { npCode: 'NP-07', anchorId: 'np-07-10-to-15-ptw-forms', label: 'NP07-15 Radiography' },
  ],
  PTW_CARGO_HANDLING_UNLOADING: [
    { npCode: 'NP-08', anchorId: 'np-08-ch04-unloading-skid-operation', label: 'NP08-04 Unloading Skid' },
    { npCode: 'NP-08', anchorId: 'np-08-ch05-iso-tank-management', label: 'NP08 ISO Tank Mgmt' },
  ],
  PTW_CARGO_HANDLING_LIFTING: [
    { npCode: 'NP-08', anchorId: 'np-08-ch02-lifting-lng-iso-tank', label: 'NP08-02 Lifting' },
  ],
  WORK_ORDER_MAINTENANCE: [
    { npCode: 'NP-09', anchorId: 'np-09-np09-01-risk-assessment-procedure', label: 'NP-09 Risk Assessment' },
  ],
};
