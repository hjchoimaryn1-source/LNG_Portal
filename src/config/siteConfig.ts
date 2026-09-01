// src/config/siteConfig.ts

export const COMPANY_CONFIG = {
  companyName: "BERKAT SAMUDRA GEMILANG LINES",
  shortName: "BSG Lines",
  logoPath: "/images/bsg-lines-logo.png",
  systemTitle: "NIAS - CMMS",
  subTitle: "NIAS CMMS Portal",
};

export interface CMMSModule {
  id: string;
  name: string;
  code: string;
  description: string;
  defaultKey: string;
}

export const CMMS_MODULES: CMMSModule[] = [
  {
    id: "MOD_1_LNG_PROCESS",
    name: "LNG-Process",
    code: "PROCESS",
    description: "Virtual Pipeline LNG Supply & Regas Process Chain",
    defaultKey: "LNG_PROCESS_OVERVIEW",
  },
  {
    id: "MOD_2_EQUIPMENT",
    name: "Equipment & Asset",
    code: "ASSET",
    description: "Plant Master Equipment, Vaporizers, ISO Tanks & Sensor Hierarchy",
    defaultKey: "EQUIPMENT_ASSET_REGISTRY",
  },
  {
    id: "MOD_3_WORK_ORDER",
    name: "Maintenance & Work Orders",
    code: "PMS/WO",
    description: "Work Orders, Preventive Maintenance Schedule (PMS) & MRO Depot",
    defaultKey: "WORK_ORDER_DIRECTORY",
  },
  {
    id: "MOD_4_MANPOWER",
    name: "Site Manning & Roster",
    code: "MANNING",
    description: "Daily Shift Board, Monthly Plan, 3:1 Rotation & Training Matrix",
    defaultKey: "MANPOWER_DAILY_SHIFT",
  },
  {
    id: "MOD_5_SAFETY_PTW",
    name: "Safety & PTW",
    code: "SAFETY",
    description: "PTW 6-Form Master, AGT Gas Testing Log & ERT Readiness",
    defaultKey: "PTW_PERMITS",
  },
];
