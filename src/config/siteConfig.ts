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
    name: "Equipment & Asset Registry",
    code: "ASSET",
    description: "Plant Master Equipment, Vaporizers, ISO Tanks & Sensor Hierarchy",
    defaultKey: "EQUIPMENT_ASSET_REGISTRY",
  },
  {
    id: "MOD_3_WORK_ORDER",
    name: "Work Order & Maintenance",
    code: "PMS/WO",
    description: "Preventive Maintenance Schedule (PMS), Work Orders & Inspection Logs",
    defaultKey: "WORK_ORDER_MAINTENANCE",
  },
  {
    id: "MOD_4_CALIBRATION",
    name: "Calibration & Compliance",
    code: "CAL/COMP",
    description: "PRSS Relief Valves, Gas Detectors & Custody Transfer Audit Certs",
    defaultKey: "CALIBRATION_COMPLIANCE",
  },
];
