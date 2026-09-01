// src/data/ptwMasterData.ts
import { PTWPermit, PTWType, PTWWorkflowStatus, StaffPersonnel } from '../types/lng';
import { getStaffCompetencyStatus } from './manpowerMasterData';

export interface PTWSOPFormDef {
  type: PTWType;
  formNumber: string;
  title: string;
  shortTitle: string;
  category: string;
  colorBg: string;
  colorText: string;
  borderColor: string;
  description: string;
  mandatoryCerts: string[];
  gasRestrictions: {
    maxLelPercent?: number;
    minO2Percent?: number;
    maxO2Percent?: number;
    maxH2sPpm?: number;
    maxCoPpm?: number;
  };
  requiredChecklist: string[];
}

export const PTW_SOP_FORMS: Record<PTWType, PTWSOPFormDef> = {
  COLD_WORK: {
    type: 'COLD_WORK',
    formNumber: 'NP07-10',
    title: 'Cold Work Permit (일반 비열원 기계·배관 정비)',
    shortTitle: 'Cold Work (NP07-10)',
    category: 'MECHANICAL / PIPING',
    colorBg: 'bg-blue-100',
    colorText: 'text-blue-900',
    borderColor: 'border-blue-300',
    description: '비열원 일반 기계 분해, 배관 볼팅, 밸브 패킹 교체 및 극저온 이외 비화기성 정비 작업.',
    mandatoryCerts: ['CERT-HSE-01'],
    gasRestrictions: {
      maxLelPercent: 10,
      minO2Percent: 19.5,
      maxO2Percent: 23.5,
      maxH2sPpm: 10,
      maxCoPpm: 25,
    },
    requiredChecklist: ['PPE Verified', 'Barricade Set', 'Work Area Cleaned'],
  },
  HOT_WORK: {
    type: 'HOT_WORK',
    formNumber: 'NP07-11',
    title: 'Hot Work Permit (화기·용접·절단·열원 작업)',
    shortTitle: 'Hot Work (NP07-11)',
    category: 'CRITICAL HIGH RISK',
    colorBg: 'bg-rose-100',
    colorText: 'text-rose-900',
    borderColor: 'border-rose-400',
    description: '용접, 용단, 그라인딩, 샌드블라스팅 등 스파크 및 화염 발생 작업 (LEL 0.0% 엄격 통제).',
    mandatoryCerts: ['CERT-PTW-03', 'CERT-EMR-04'],
    gasRestrictions: {
      maxLelPercent: 0, // MUST BE 0.0% LEL FOR ACTIVE ISSUANCE
      minO2Percent: 19.5,
      maxO2Percent: 23.5,
      maxH2sPpm: 5,
      maxCoPpm: 25,
    },
    requiredChecklist: [
      'Fire Watch Assigned & Present',
      'Continuous Gas Detector Deployed',
      'Fire Extinguishers (Dry Powder/CO2) Staged',
      'Combustible Material Removed 15m Radius',
    ],
  },
  CONFINED_SPACE: {
    type: 'CONFINED_SPACE',
    formNumber: 'NP07-12',
    title: 'Confined Space Entry Permit (밀폐공간·저류조 진입 작업)',
    shortTitle: 'Confined Space (NP07-12)',
    category: 'CRITICAL HIGH RISK',
    colorBg: 'bg-amber-100',
    colorText: 'text-amber-900',
    borderColor: 'border-amber-400',
    description: 'ORU 집수정, 섬프 피트, LNG 저장조 내부 등 통풍 불충분 및 질식·유독가스 위험 공간 진입.',
    mandatoryCerts: ['CERT-PTW-03', 'CERT-EMR-04'],
    gasRestrictions: {
      maxLelPercent: 0,
      minO2Percent: 19.5, // STRICT SAFE BAND 19.5% ~ 23.5%
      maxO2Percent: 23.5,
      maxH2sPpm: 5,
      maxCoPpm: 25,
    },
    requiredChecklist: [
      'Continuous Forced Ventilation (Blower) Running',
      'Standby Watchman (First Aider) Stationed at Entrance',
      'Tripod & Rescue Harness Connected',
      'Multi-Gas Continuous Monitor (O2/LEL/H2S/CO) Active',
    ],
  },
  ELECTRICAL: {
    type: 'ELECTRICAL',
    formNumber: 'NP07-13',
    title: 'Electrical Isolation & Work Permit (전기·계장 차단 및 활선 작업)',
    shortTitle: 'Electrical Isolation (NP07-13)',
    category: 'ELECTRICAL / LOTO',
    colorBg: 'bg-purple-100',
    colorText: 'text-purple-900',
    borderColor: 'border-purple-300',
    description: '3.3kV / 400V 고·저압 수배전반 점검, 변압기 점검, LOTO 전기 격리 및 차단기 정비.',
    mandatoryCerts: ['CERT-HSE-01'],
    gasRestrictions: {
      maxLelPercent: 5,
      minO2Percent: 19.5,
      maxO2Percent: 23.5,
      maxH2sPpm: 10,
      maxCoPpm: 25,
    },
    requiredChecklist: [
      'LOTO (Lock-Out / Tag-Out) Padlocks Installed',
      'Zero Voltage Test Verified (Multimeter / Detector)',
      'Grounding Earth Clamps Attached',
      'Dielectric PPE (10kV Rated Gloves/Boots) Equipped',
    ],
  },
  EXCAVATION: {
    type: 'EXCAVATION',
    formNumber: 'NP07-14',
    title: 'Ground Excavation & Trenching Permit (지중 굴착 및 매설물 탐사)',
    shortTitle: 'Excavation (NP07-14)',
    category: 'CIVIL / INFRASTRUCTURE',
    colorBg: 'bg-emerald-100',
    colorText: 'text-emerald-900',
    borderColor: 'border-emerald-300',
    description: '지하 가스 배관, 소방 배관, 접지선 매설 구역 내 30cm 이상 깊이 터파기 및 굴착.',
    mandatoryCerts: ['CERT-HSE-01'],
    gasRestrictions: {
      maxLelPercent: 5,
      minO2Percent: 19.5,
      maxO2Percent: 23.5,
      maxH2sPpm: 10,
      maxCoPpm: 25,
    },
    requiredChecklist: [
      'Underground Cable/Pipeline Drawing Cross-Checked',
      'Cable Detector Ground Scan Completed',
      'Trench Shoring & Edge Barricades Erected',
    ],
  },
  RADIOGRAPHY: {
    type: 'RADIOGRAPHY',
    formNumber: 'NP07-15',
    title: 'NDT / Radiography Testing Permit (비파괴 방사선 투과 검사)',
    shortTitle: 'Radiography (NP07-15)',
    category: 'SPECIALIZED NDT',
    colorBg: 'bg-indigo-100',
    colorText: 'text-indigo-900',
    borderColor: 'border-indigo-300',
    description: '극저온 극후관 용접부 감마선(Ir-192 / Se-75) NDT 투과 검사 및 안전 구획선 통제.',
    mandatoryCerts: ['CERT-PTW-03', 'CERT-HSE-01'],
    gasRestrictions: {
      maxLelPercent: 5,
      minO2Percent: 19.5,
      maxO2Percent: 23.5,
      maxH2sPpm: 10,
      maxCoPpm: 25,
    },
    requiredChecklist: [
      'Radiation Warning Flashing Beacons & Banners Set (20m Exclusion Zone)',
      'Radiation Dosimeter (TLD & Survey Meter) Calibrated',
      'Night-time Inspection Coordination Completed',
    ],
  },
};

export const INITIAL_PTW_PERMITS: PTWPermit[] = [
  {
    id: 'PTW-2026-0901-01',
    formNumber: 'NP07-11',
    type: 'HOT_WORK',
    title: 'PRSS-01 BOG Compressor Suction Line Flange Tie-in Welding',
    location: 'Vaporization Skid #1 (PRSS Area)',
    status: 'ACTIVE',
    workLeaderId: 'EMP-005',
    workLeaderName: 'Asman Sampeaman',
    assignedWorkerIds: ['EMP-006', 'EMP-007'],
    assignedWorkerNames: ['Muradi', 'Ripal Fadiah'],
    agtStaffId: 'EMP-013', // Arsyan AN (HSE / AGT Certified)
    approverStaffId: 'EMP-001', // Ahmad Zarkasih (Site Manager)
    gasReadings: {
      lelPercent: 0.0,
      o2Percent: 20.9,
      h2sPpm: 0.0,
      coPpm: 2.0,
      testedAt: '2026-09-01 08:30 WIB',
      isSafeForWork: true,
    },
    safetyChecklist: {
      fireWatchAssigned: true,
      gasDetectorContinuous: true,
      lotoApplied: true,
      forcedVentilation: false,
      ppeVerified: true,
      barricadeSet: true,
    },
    validFrom: '2026-09-01 08:00',
    validTo: '2026-09-01 18:00',
    emergencyProtocol: 'Radio Ch 1 Emergency Muster / Fire Skid Foam Actuation',
    createdAt: '2026-09-01 07:45',
    hazardDescription: 'Cryogenic hydrocarbon residue potential. Nitrogen purging completed to 0.0% LEL.',
  },
  {
    id: 'PTW-2026-0901-02',
    formNumber: 'NP07-11',
    type: 'HOT_WORK',
    title: 'Laydown-2 Flare Header Structural Support Bracket Re-welding',
    location: 'Laydown Area 2 & Flare Header Riser',
    status: 'ACTIVE',
    workLeaderId: 'EMP-011',
    workLeaderName: 'Karyanto',
    assignedWorkerIds: ['EMP-012', 'EMP-015'],
    assignedWorkerNames: ['Syaiful', 'Andika Pratama'],
    agtStaffId: 'EMP-013',
    approverStaffId: 'EMP-001',
    gasReadings: {
      lelPercent: 0.0,
      o2Percent: 20.9,
      h2sPpm: 0.0,
      coPpm: 0.0,
      testedAt: '2026-09-01 09:15 WIB',
      isSafeForWork: true,
    },
    safetyChecklist: {
      fireWatchAssigned: true,
      gasDetectorContinuous: true,
      lotoApplied: false,
      forcedVentilation: false,
      ppeVerified: true,
      barricadeSet: true,
    },
    validFrom: '2026-09-01 09:00',
    validTo: '2026-09-01 17:00',
    emergencyProtocol: 'Stationary Dry Chemical 50kg Unit on Standby',
    createdAt: '2026-09-01 08:40',
    hazardDescription: 'High temperature arc welding. Fire blanket installed over adjacent instrument trays.',
  },
  {
    id: 'PTW-2026-0901-03',
    formNumber: 'NP07-12',
    type: 'CONFINED_SPACE',
    title: 'ORU Sump Pit #2 Internal Sediment Cleaning & Level Sensor Calibration',
    location: 'ORU Wastewater & Sump Area',
    status: 'APPROVED',
    workLeaderId: 'EMP-008',
    workLeaderName: 'Juli Surungan',
    assignedWorkerIds: ['EMP-009'],
    assignedWorkerNames: ['Danang'],
    agtStaffId: 'EMP-013',
    approverStaffId: 'EMP-001',
    gasReadings: {
      lelPercent: 0.0,
      o2Percent: 20.8,
      h2sPpm: 0.5,
      coPpm: 1.0,
      testedAt: '2026-09-01 10:00 WIB',
      isSafeForWork: true,
    },
    safetyChecklist: {
      fireWatchAssigned: false,
      gasDetectorContinuous: true,
      lotoApplied: true,
      forcedVentilation: true,
      ppeVerified: true,
      barricadeSet: true,
    },
    validFrom: '2026-09-01 10:30',
    validTo: '2026-09-01 16:30',
    emergencyProtocol: 'Rescue Tripod with Self-Retracting Lifeline stationed at manhole',
    createdAt: '2026-09-01 09:10',
    hazardDescription: 'Heavy gas accumulation risk. Forced draft ventilation required 30min prior to entry.',
  },
  {
    id: 'PTW-2026-0901-04',
    formNumber: 'NP07-13',
    type: 'ELECTRICAL',
    title: 'MCC Substation 3.3kV High-Voltage Busbar Thermographic Scan & LOTO Isolation',
    location: 'Main Substation MCC-01',
    status: 'PREPARED',
    workLeaderId: 'EMP-015',
    workLeaderName: 'Andika Pratama',
    assignedWorkerIds: ['EMP-016'],
    assignedWorkerNames: ['M. Taufik'],
    agtStaffId: 'EMP-013',
    approverStaffId: 'EMP-001',
    gasReadings: {
      lelPercent: 0.0,
      o2Percent: 20.9,
      h2sPpm: 0.0,
      coPpm: 0.0,
      testedAt: '2026-09-01 11:00 WIB',
      isSafeForWork: true,
    },
    safetyChecklist: {
      fireWatchAssigned: false,
      gasDetectorContinuous: false,
      lotoApplied: true,
      forcedVentilation: false,
      ppeVerified: true,
      barricadeSet: true,
    },
    validFrom: '2026-09-01 13:00',
    validTo: '2026-09-01 17:00',
    emergencyProtocol: 'Electrical Arc-Flash Suit / Insulated Rescue Hook present',
    createdAt: '2026-09-01 10:45',
    hazardDescription: 'High voltage electrical switchgear inspection. Zero energy verification required.',
  },
  {
    id: 'PTW-2026-0901-05',
    formNumber: 'NP07-10',
    type: 'COLD_WORK',
    title: 'Bay 02 Cryogenic Liquid Globe Valve Packing Gland Torqueing & Leak Test',
    location: 'Loading Bay 02',
    status: 'ACTIVE',
    workLeaderId: 'EMP-005',
    workLeaderName: 'Asman Sampeaman',
    assignedWorkerIds: ['EMP-006'],
    assignedWorkerNames: ['Muradi'],
    agtStaffId: 'EMP-013',
    approverStaffId: 'EMP-001',
    gasReadings: {
      lelPercent: 0.0,
      o2Percent: 20.9,
      h2sPpm: 0.0,
      coPpm: 0.0,
      testedAt: '2026-09-01 08:00 WIB',
      isSafeForWork: true,
    },
    safetyChecklist: {
      fireWatchAssigned: false,
      gasDetectorContinuous: true,
      lotoApplied: true,
      forcedVentilation: false,
      ppeVerified: true,
      barricadeSet: true,
    },
    validFrom: '2026-09-01 08:00',
    validTo: '2026-09-01 18:00',
    emergencyProtocol: 'Cryogenic Cryo-Gloves & Face Shield mandatory',
    createdAt: '2026-09-01 07:30',
    hazardDescription: '-162°C Liquid LNG contact hazard. Non-sparking bronze tools utilized.',
  },
  {
    id: 'PTW-2026-0901-06',
    formNumber: 'NP07-15',
    type: 'RADIOGRAPHY',
    title: 'Jetty Cryogenic Decanting Line Replacement Spool Seam Gamma NDT',
    location: 'Marine Jetty LNG Transfer Header',
    status: 'DRAFT',
    workLeaderId: 'EMP-013',
    workLeaderName: 'Arsyan AN',
    assignedWorkerIds: ['EMP-011'],
    assignedWorkerNames: ['Karyanto'],
    agtStaffId: 'EMP-013',
    approverStaffId: 'EMP-001',
    gasReadings: {
      lelPercent: 0.0,
      o2Percent: 20.9,
      h2sPpm: 0.0,
      coPpm: 0.0,
      testedAt: '2026-09-01 12:00 WIB',
      isSafeForWork: true,
    },
    safetyChecklist: {
      fireWatchAssigned: false,
      gasDetectorContinuous: false,
      lotoApplied: true,
      forcedVentilation: false,
      ppeVerified: true,
      barricadeSet: true,
    },
    validFrom: '2026-09-01 20:00',
    validTo: '2026-09-01 23:59',
    emergencyProtocol: 'Ir-192 Source Container Emergency Shielding Pot ready on site',
    createdAt: '2026-09-01 11:30',
    hazardDescription: 'Gamma radiation source exposure. Strict 30m exclusion perimeter during exposure.',
  },
];

/**
 * Gatekeeper Worker Eligibility Check
 * Determines if worker or work leader has valid certifications and is medically cleared
 */
export function validatePTWWorkerEligibility(
  staff: StaffPersonnel,
  ptwType: PTWType
): {
  isEligible: boolean;
  reason: string;
  isMCUValid: boolean;
  hasExpiredCerts: boolean;
} {
  const compStatus = getStaffCompetencyStatus(staff);
  const isMCUValid = !staff.complianceWarning; // MCU or medical check clearance

  if (compStatus.hasExpired) {
    const expiredList = compStatus.expiredCerts.map((c) => c.code).join(', ');
    return {
      isEligible: false,
      reason: `Mandatory Certificate Expired (${expiredList}) - Renewal Required in Matrix`,
      isMCUValid,
      hasExpiredCerts: true,
    };
  }

  const ptwDef = PTW_SOP_FORMS[ptwType];
  if (ptwDef && ptwDef.mandatoryCerts.length > 0) {
    const staffCertCodes = (staff.competencies || []).map((c) => c.code);
    const missingCerts = ptwDef.mandatoryCerts.filter((req) => !staffCertCodes.includes(req));
    if (missingCerts.length > 0) {
      return {
        isEligible: false,
        reason: `Missing Special Endorsement: ${missingCerts.join(', ')}`,
        isMCUValid,
        hasExpiredCerts: false,
      };
    }
  }

  return {
    isEligible: true,
    reason: 'Fully Certified & Medically Cleared',
    isMCUValid: true,
    hasExpiredCerts: false,
  };
}

/**
 * Validates Gas Safety readings for specific PTW types
 */
export function validatePTWGasSafety(
  type: PTWType,
  gasReadings: PTWPermit['gasReadings']
): {
  isSafe: boolean;
  blockReason: string | null;
} {
  const formDef = PTW_SOP_FORMS[type];

  // Hot Work Strict Rule: LEL must be 0%
  if (type === 'HOT_WORK' && gasReadings.lelPercent > 0) {
    return {
      isSafe: false,
      blockReason: `[HOT WORK BLOCKED] LEL is ${gasReadings.lelPercent}% (Must be strictly 0.0% LEL in cryogenic zone).`,
    };
  }

  // Confined Space Strict Rule: O2 must be 19.5% ~ 23.5%
  if (type === 'CONFINED_SPACE') {
    if (gasReadings.o2Percent < 19.5 || gasReadings.o2Percent > 23.5) {
      return {
        isSafe: false,
        blockReason: `[CONFINED SPACE BLOCKED] O2 concentration is ${gasReadings.o2Percent}% (Safe atmospheric band: 19.5% ~ 23.5%).`,
      };
    }
  }

  // General LEL threshold
  if (formDef.gasRestrictions.maxLelPercent !== undefined && gasReadings.lelPercent > formDef.gasRestrictions.maxLelPercent) {
    return {
      isSafe: false,
      blockReason: `LEL concentration exceeds safety ceiling (${gasReadings.lelPercent}% > ${formDef.gasRestrictions.maxLelPercent}%).`,
    };
  }

  return {
    isSafe: true,
    blockReason: null,
  };
}
