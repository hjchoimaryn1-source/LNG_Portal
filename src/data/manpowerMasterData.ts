// src/data/manpowerMasterData.ts
import {
  DepartmentCode,
  StaffPersonnel,
  ShiftCode,
  TeamNameStandard,
  CompetencyCertification,
  CompetencyStatus,
  ERTRole,
} from '../types/lng';

export const AUGUST_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export interface CompetencyCourseDef {
  code: string;
  name: string;
  shortName: string;
  category: 'SAFETY_HSE' | 'CRYOGENIC_OPS' | 'ELECTRICAL_INST' | 'MECHANICAL' | 'LOGISTICS_MARINE' | 'MANAGEMENT';
  validityYears: number;
  issuingBody: string;
  description: string;
}

export const STANDARD_COMPETENCY_COURSES: CompetencyCourseDef[] = [
  {
    code: 'CERT-HSE-01',
    name: 'K3 Migas & Safety Leadership Certification',
    shortName: 'K3 Migas / HSE',
    category: 'SAFETY_HSE',
    validityYears: 3,
    issuingBody: 'BNSP / Kemenaker RI',
    description: 'Statutory safety leadership, hazard identification, risk assessment, and incident command.',
  },
  {
    code: 'CERT-CRY-02',
    name: 'Cryogenic LNG Decanting & Regasification Operator',
    shortName: 'Cryo Regas Ops',
    category: 'CRYOGENIC_OPS',
    validityYears: 2,
    issuingBody: 'Ditjen Migas / Global Cryo Inst.',
    description: 'Cryogenic liquid transfer, -162°C manifold safety, BOG control, and PRSS vaporization.',
  },
  {
    code: 'CERT-PTW-03',
    name: 'Permit to Work (PTW) & Authorized Gas Tester (AGT)',
    shortName: 'PTW / Gas Tester',
    category: 'SAFETY_HSE',
    validityYears: 2,
    issuingBody: 'Nias Terminal Safety Board',
    description: 'Hot work, confined space entry, cold work authorization, and continuous toxic/flammable gas testing.',
  },
  {
    code: 'CERT-EMR-04',
    name: 'Advanced Firefighting (AFF) & Industrial First Aid',
    shortName: 'Fire & First Aid',
    category: 'SAFETY_HSE',
    validityYears: 2,
    issuingBody: 'Pertamina Fire Training Center',
    description: 'Cryogenic LNG pool fire suppression, dry chemical skid operations, and emergency trauma triage.',
  },
  {
    code: 'CERT-TEC-05',
    name: 'DCS / SCADA Automation & Cryogenic Valve Overhaul',
    shortName: 'DCS & Cryo Mech',
    category: 'MECHANICAL',
    validityYears: 3,
    issuingBody: 'Emerson / Valve Tech Institute',
    description: 'DeltaV telemetry tuning, emergency shutdown (ESD) loop testing, and cryogenic valve gland torqueing.',
  },
  {
    code: 'CERT-LOG-06',
    name: 'SIO Reach Stacker / Heavy Vehicle Haulage & Super Cargo',
    shortName: 'Lifting & Logistics',
    category: 'LOGISTICS_MARINE',
    validityYears: 2,
    issuingBody: 'Kemenaker / Port Authority',
    description: '50T container reach stacker certified operator, heavy prime mover defensive driving, and jetty loading master.',
  },
];

export interface PositionStandardRequirement {
  positionKey: string;
  positionTitle: string;
  department: string;
  legalBasis: string;
  mandatoryCourseCodes: string[];
  description: string;
}

export const POSITION_STANDARD_REQUIREMENTS: Record<string, PositionStandardRequirement> = {
  SITE_MANAGER: {
    positionKey: 'SITE_MANAGER',
    positionTitle: 'Site Manager',
    department: 'MANAGEMENT',
    legalBasis: 'SKK Migas PTK-007 / K3 Migas Pengawas Utama',
    mandatoryCourseCodes: ['CERT-HSE-01', 'CERT-EMR-04'],
    description: 'K3 Migas (Supervisor) & ERT (Incident Commander) statutory requirements.',
  },
  OP_TEAM_LEADER: {
    positionKey: 'OP_TEAM_LEADER',
    positionTitle: 'OP Team Leader',
    department: 'OPERATIONS',
    legalBasis: 'Ditjen Migas / SKK Migas Level III',
    mandatoryCourseCodes: ['CERT-HSE-01', 'CERT-PTW-03', 'CERT-TEC-05', 'CERT-EMR-04'],
    description: 'K3 Migas, PTW/Gas Tester, DCS Ops, and ERT (Fire Chief) mandatory certification.',
  },
  FIELD_OPERATOR: {
    positionKey: 'FIELD_OPERATOR',
    positionTitle: 'Field Operator',
    department: 'OPERATIONS',
    legalBasis: 'Kemenaker K3 Operator / Ditjen Migas',
    mandatoryCourseCodes: ['CERT-HSE-01', 'CERT-CRY-02', 'CERT-PTW-03', 'CERT-EMR-04'],
    description: 'K3 Migas (Operator), Cryo Regas Ops, PTW Receiver, and ERT (First Aider) mandatory qualifications.',
  },
  MECHANICAL_TECH: {
    positionKey: 'MECHANICAL_TECH',
    positionTitle: 'Mechanical Technician',
    department: 'MAINTENANCE',
    legalBasis: 'BNSP / SKKNI Mekanik Migas',
    mandatoryCourseCodes: ['CERT-HSE-01', 'CERT-PTW-03', 'CERT-TEC-05'],
    description: 'K3 Mekanik, PTW Receiver, and Cryo Valve Overhaul / Bolting certification.',
  },
  ELECTRICAL_ENG: {
    positionKey: 'ELECTRICAL_ENG',
    positionTitle: 'Electrical Systems Engineer',
    department: 'MAINTENANCE',
    legalBasis: 'Permenaker Ahli K3 Listrik',
    mandatoryCourseCodes: ['CERT-HSE-01', 'CERT-PTW-03', 'CERT-TEC-05'],
    description: 'Ahli K3 Listrik, PTW Receiver, and Ex / DCS Automation qualification.',
  },
  INSTRUMENTATION_TECH: {
    positionKey: 'INSTRUMENTATION_TECH',
    positionTitle: 'Instrumentation Technician',
    department: 'MAINTENANCE',
    legalBasis: 'BNSP Instrumentasi Migas',
    mandatoryCourseCodes: ['CERT-HSE-01', 'CERT-PTW-03', 'CERT-TEC-05'],
    description: 'K3 Migas, PTW Receiver, and SCADA / Gas Detection Calibration.',
  },
  HSE_OFFICER: {
    positionKey: 'HSE_OFFICER',
    positionTitle: 'HSE Officer / Senior HSE Officer',
    department: 'HSSE',
    legalBasis: 'Permenaker No. 04 / Ahli K3 Umum & Migas',
    mandatoryCourseCodes: ['CERT-HSE-01', 'CERT-PTW-03', 'CERT-EMR-04'],
    description: 'Ahli K3 Umum/Migas, AGT (Authorized Gas Tester), and ERT Coordinator.',
  },
  HR_GA: {
    positionKey: 'HR_GA',
    positionTitle: 'HR / GA Coordinator & Officer',
    department: 'HR_GA',
    legalBasis: 'K3 Industrial Standard Induction',
    mandatoryCourseCodes: ['CERT-HSE-01'],
    description: 'General K3 Migas Safety Induction & Labor Regulations.',
  },
  LOGISTICS: {
    positionKey: 'LOGISTICS',
    positionTitle: 'Super Cargo & Logistics Operator',
    department: 'LOGISTICS',
    legalBasis: 'SIO Kemenaker Heavy Lifting / ADR Cryo',
    mandatoryCourseCodes: ['CERT-HSE-01', 'CERT-LOG-06'],
    description: 'K3 Safety, SIO Reach Stacker / Heavy Vehicle Haulage & Super Cargo.',
  },
};

export function getPositionMandatoryCourses(staff: StaffPersonnel): {
  positionTitle: string;
  mandatoryCourseCodes: string[];
  reqDef: PositionStandardRequirement;
} {
  const roleLower = staff.role.toLowerCase();
  let req = POSITION_STANDARD_REQUIREMENTS.FIELD_OPERATOR;

  if (staff.id === 'EMP-001' || roleLower.includes('site manager')) {
    req = POSITION_STANDARD_REQUIREMENTS.SITE_MANAGER;
  } else if (roleLower.includes('team leader') || roleLower.includes('lead')) {
    req = POSITION_STANDARD_REQUIREMENTS.OP_TEAM_LEADER;
  } else if (roleLower.includes('mechanic') || roleLower.includes('mechanical')) {
    req = POSITION_STANDARD_REQUIREMENTS.MECHANICAL_TECH;
  } else if (roleLower.includes('electrical')) {
    req = POSITION_STANDARD_REQUIREMENTS.ELECTRICAL_ENG;
  } else if (roleLower.includes('instrument')) {
    req = POSITION_STANDARD_REQUIREMENTS.INSTRUMENTATION_TECH;
  } else if (roleLower.includes('hse') || roleLower.includes('hsse') || roleLower.includes('fire chief')) {
    req = POSITION_STANDARD_REQUIREMENTS.HSE_OFFICER;
  } else if (roleLower.includes('hr') || roleLower.includes('ga') || staff.department === 'HR_GA') {
    req = POSITION_STANDARD_REQUIREMENTS.HR_GA;
  } else if (roleLower.includes('super cargo') || roleLower.includes('driver') || roleLower.includes('reach stacker') || staff.department === 'LOGISTICS') {
    req = POSITION_STANDARD_REQUIREMENTS.LOGISTICS;
  }

  return {
    positionTitle: req.positionTitle,
    mandatoryCourseCodes: req.mandatoryCourseCodes,
    reqDef: req,
  };
}

export function evaluateStaffJobQualification(staff: StaffPersonnel): {
  isQualified: boolean;
  missingMandatoryCodes: string[];
  expiredMandatoryCodes: string[];
  validMandatoryCount: number;
  totalMandatoryCount: number;
  positionTitle: string;
  reason: string;
} {
  const { mandatoryCourseCodes, positionTitle } = getPositionMandatoryCourses(staff);
  const certs = staff.competencies || [];
  
  const missingMandatoryCodes: string[] = [];
  const expiredMandatoryCodes: string[] = [];
  let validMandatoryCount = 0;

  mandatoryCourseCodes.forEach((code) => {
    const heldCert = certs.find((c) => c.code === code);
    if (!heldCert) {
      missingMandatoryCodes.push(code);
    } else if (heldCert.status === 'EXPIRED') {
      expiredMandatoryCodes.push(code);
    } else if (heldCert.status === 'VALID' || heldCert.status === 'EXPIRING_SOON' || heldCert.status === 'DUE_SOON') {
      validMandatoryCount++;
    }
  });

  const isQualified = missingMandatoryCodes.length === 0 && expiredMandatoryCodes.length === 0;
  let reason = 'Fully Qualified (All Mandatory Requirements Met)';
  if (expiredMandatoryCodes.length > 0) {
    reason = `Expired Mandatory Cert (${expiredMandatoryCodes.join(', ')})`;
  } else if (missingMandatoryCodes.length > 0) {
    reason = `Missing Mandatory Requirement (${missingMandatoryCodes.join(', ')})`;
  }

  return {
    isQualified,
    missingMandatoryCodes,
    expiredMandatoryCodes,
    validMandatoryCount,
    totalMandatoryCount: mandatoryCourseCodes.length,
    positionTitle,
    reason,
  };
}

// Helper: Check competency status helper
export function getStaffCompetencyStatus(staff: StaffPersonnel): {
  hasExpired: boolean;
  hasExpiringSoon: boolean;
  hasPendingApproval: boolean;
  expiredCerts: CompetencyCertification[];
  expiringCerts: CompetencyCertification[];
  pendingCerts: CompetencyCertification[];
  validCount: number;
  totalCount: number;
} {
  const certs = staff.competencies || [];
  const expiredCerts = certs.filter((c) => c.status === 'EXPIRED');
  const expiringCerts = certs.filter((c) => c.status === 'EXPIRING_SOON' || c.status === 'DUE_SOON');
  const pendingCerts = certs.filter((c) => c.status === 'PENDING_APPROVAL');
  const validCount = certs.filter((c) => c.status === 'VALID').length;

  return {
    hasExpired: expiredCerts.length > 0,
    hasExpiringSoon: expiringCerts.length > 0,
    hasPendingApproval: pendingCerts.length > 0,
    expiredCerts,
    expiringCerts,
    pendingCerts,
    validCount,
    totalCount: certs.length,
  };
}

// Calculate days in a given month
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// Generate August 2026 Roster Pattern for 3 Operation Teams & Support (Continuous 3:1 Rotation)
export function generateRosterPattern(dept: string, indexInDept: number = 0): ShiftCode[] {
  return AUGUST_DAYS.map((day) => {
    // Continuous 2-Shift Operations without regular rest on-site
    if (dept === 'OP_ALPHA') {
      const cycleDay = ((day - 1) % 14) + 1;
      return cycleDay <= 7 ? 'D' : 'N';
    }
    if (dept === 'OP_BRAVO') {
      const cycleDay = ((day + 6) % 14) + 1;
      return cycleDay <= 7 ? 'D' : 'N';
    }
    if (dept === 'OP_CHARLIE') {
      const cycleDay = ((day + 3) % 14) + 1;
      return cycleDay <= 7 ? 'D' : 'N';
    }
    // HR/GA Resident Day Workers: Mon-Fri D, Sat-Sun Off
    if (dept === 'HR_GA') {
      const dayOfWeek = (day + 5) % 7; // Aug 1 2026 was Saturday
      if (dayOfWeek === 0 || dayOfWeek === 1) return 'Off'; // Sat/Sun
      return 'D';
    }
    // Support Departments (Management, Logistics, HSSE, Maintenance): Continuous Daily D on 3:1 cycle
    return 'D';
  });
}

// Generate dynamic roster pattern with 3:1 continuous rotation cycle for any Year and Month
export function generateMonthlyRoster(
  staff: StaffPersonnel,
  year: number,
  month: number // 1-indexed (1 = Jan, 9 = Sep, 12 = Dec)
): ShiftCode[] {
  const totalDays = getDaysInMonth(year, month);

  // Non-Rotation / Resident Day Worker (HR/GA: EMP-017, EMP-018)
  const isResident =
    staff.department === 'HR_GA' ||
    staff.id === 'EMP-017' ||
    staff.id === 'EMP-018' ||
    staff.cycleStartDate === 'N/A' ||
    staff.cycleStartDate === '-';

  if (isResident) {
    // Fixed Day Work schedule: Mon-Fri: D (Day), Sat-Sun: Off (Rest)
    return Array.from({ length: totalDays }, (_, i) => {
      const day = i + 1;
      const currentDate = new Date(year, month - 1, day);
      const dayOfWeek = currentDate.getDay(); // 0 = Sun, 6 = Sat
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return 'Off';
      }
      return 'D';
    });
  }

  const cycleStart = new Date(staff.cycleStartDate || '2026-06-01');

  return Array.from({ length: totalDays }, (_, i) => {
    const day = i + 1;
    const currentDate = new Date(year, month - 1, day);

    // Day difference from staff's cycleStartDate
    const diffTime = currentDate.getTime() - cycleStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // 120-day 3:1 rotation cycle (90 days On-site continuous duty, 30 days Off-duty leave)
    const cycleDay = ((diffDays % 120) + 120) % 120; // 0 to 119

    // If in the 30-day off-island leave block (Days 90 to 119)
    if (cycleDay >= 90) {
      return 'AL';
    }

    // 3:1 Continuous On-Site Operations (Days 0 to 89: 90 Continuous Days)
    const dept = staff.department;

    // Operation Teams: Continuous rolling Day / Night schedule (No regular Rest days)
    const baseRefDate = new Date(2026, 7, 1);
    const refDiffDays = Math.floor((currentDate.getTime() - baseRefDate.getTime()) / (1000 * 60 * 60 * 24));

    if (dept === 'OP_ALPHA') {
      const shiftPhase = ((refDiffDays % 14) + 14) % 14;
      return shiftPhase < 7 ? 'D' : 'N';
    }

    if (dept === 'OP_BRAVO') {
      const shiftPhase = (((refDiffDays + 7) % 14) + 14) % 14;
      return shiftPhase < 7 ? 'D' : 'N';
    }

    if (dept === 'OP_CHARLIE') {
      const shiftPhase = (((refDiffDays + 4) % 14) + 14) % 14;
      return shiftPhase < 7 ? 'D' : 'N';
    }

    // Support Teams (Management, Maintenance, HSSE, Logistics): Continuous Daily Day Duty (D) for 90 Days
    return 'D';
  });
}

// Proactive Future Expiry Check for specific Month & Year
export function getStaffExpiryStatusForMonth(
  staff: StaffPersonnel,
  year: number,
  month: number
): {
  hasExpiredInMonth: boolean;
  expiredCerts: CompetencyCertification[];
} {
  const monthEndStr = `${year}-${String(month).padStart(2, '0')}-${String(getDaysInMonth(year, month)).padStart(2, '0')}`;
  const certs = staff.competencies || [];
  const expiredCerts = certs.filter((c) => {
    if (c.status === 'EXPIRED') return true;
    if (c.status === 'PENDING_APPROVAL') return false;
    if (!c.expiryDate) return false;
    return c.expiryDate <= monthEndStr;
  });

  return {
    hasExpiredInMonth: expiredCerts.length > 0,
    expiredCerts,
  };
}

export const INITIAL_MANPOWER_MASTER_RECORDS: StaffPersonnel[] = [
  // 1. Management (2)
  {
    id: 'EMP-001',
    name: 'Edi Hermawan',
    role: 'Site Manager',
    department: 'MANAGEMENT',
    teamName: 'Management',
    currentStatus: 'ON_SITE',
    todayShift: 'D',
    onSiteDays: 64,
    targetCycleDays: 90,
    cycleStartDate: '2026-06-25',
    nextRotationDueDate: '2026-09-22',
    relieverName: 'HQ Delegate',
    contactNo: '+62 812-7001-9001',
    radioChannel: 'CH-01 (CMD)',
    ertRole: 'Incident Commander',
    rosterDays: generateRosterPattern('MANAGEMENT', 0),
    competencies: [
      { code: 'CERT-HSE-01', name: 'K3 Migas & Safety Leadership', category: 'SAFETY_HSE', issueDate: '2024-05-10', expiryDate: '2027-05-09', certNumber: 'BNSP-MIGAS-2024-0981', issuingBody: 'BNSP RI', status: 'VALID' },
      { code: 'CERT-CRY-02', name: 'Cryogenic LNG Regas Manager', category: 'CRYOGENIC_OPS', issueDate: '2024-06-15', expiryDate: '2026-12-14', certNumber: 'MIGAS-CRY-2024-0112', issuingBody: 'Ditjen Migas', status: 'VALID' },
      { code: 'CERT-PTW-03', name: 'PTW Signatory & Level-1 Authorizer', category: 'SAFETY_HSE', issueDate: '2025-01-20', expiryDate: '2027-01-19', certNumber: 'PTW-AUTH-001', issuingBody: 'Nias Terminal', status: 'VALID' },
      { code: 'CERT-EMR-04', name: 'Incident Command & ERP Lead', category: 'SAFETY_HSE', issueDate: '2024-08-01', expiryDate: '2026-11-30', certNumber: 'ERP-CMD-2024-88', issuingBody: 'Pertamina FTC', status: 'VALID' },
    ],
  },
  {
    id: 'EMP-002',
    name: 'Shadiq M. Shalih',
    role: 'OP Team Leader & Plant Supt',
    department: 'MANAGEMENT',
    teamName: 'Management ( Team A )',
    currentStatus: 'ON_SITE',
    todayShift: 'Off',
    onSiteDays: 82,
    targetCycleDays: 90,
    cycleStartDate: '2026-06-07',
    nextRotationDueDate: '2026-09-04',
    relieverName: 'Asman Sampeaman',
    contactNo: '+62 811-6502-3341',
    radioChannel: 'CH-01 (CMD)',
    ertRole: 'Incident Commander',
    rosterDays: generateRosterPattern('OP_ALPHA', 0),
    competencies: [
      { code: 'CERT-HSE-01', name: 'K3 Migas Safety Supervisor', category: 'SAFETY_HSE', issueDate: '2024-04-12', expiryDate: '2027-04-11', certNumber: 'BNSP-MIGAS-2024-1142', issuingBody: 'BNSP RI', status: 'VALID' },
      { code: 'CERT-CRY-02', name: 'Cryogenic LNG Decanting Lead', category: 'CRYOGENIC_OPS', issueDate: '2024-09-01', expiryDate: '2026-12-31', certNumber: 'MIGAS-CRY-2024-0451', issuingBody: 'Ditjen Migas', status: 'VALID' },
      { code: 'CERT-PTW-03', name: 'PTW Issuer & Gas Tester', category: 'SAFETY_HSE', issueDate: '2025-02-10', expiryDate: '2027-02-09', certNumber: 'PTW-ISS-002', issuingBody: 'Nias Terminal', status: 'VALID' },
      { code: 'CERT-EMR-04', name: 'Advanced Firefighting Team Lead', category: 'SAFETY_HSE', issueDate: '2024-10-05', expiryDate: '2026-10-04', certNumber: 'AFF-TL-2024-12', issuingBody: 'Pertamina FTC', status: 'VALID' },
    ],
  },

  // 2. Operation TEAM-A (2)
  {
    id: 'EMP-003',
    name: 'Yusuf',
    role: 'Field Operator',
    department: 'OP_ALPHA',
    teamName: 'TEAM-A',
    currentStatus: 'ON_SITE',
    todayShift: 'Off',
    onSiteDays: 45,
    targetCycleDays: 90,
    cycleStartDate: '2026-07-14',
    nextRotationDueDate: '2026-10-11',
    relieverName: 'Muradi',
    contactNo: '+62 813-8822-1044',
    radioChannel: 'CH-02 (OPS)',
    ertRole: 'Gas Leak Response',
    rosterDays: generateRosterPattern('OP_ALPHA', 1),
    competencies: [
      { code: 'CERT-CRY-02', name: 'Cryogenic LNG Decanting Operator', category: 'CRYOGENIC_OPS', issueDate: '2024-11-20', expiryDate: '2026-11-19', certNumber: 'MIGAS-CRY-2024-0891', issuingBody: 'Ditjen Migas', status: 'VALID' },
      { code: 'CERT-PTW-03', name: 'Authorized Gas Tester (AGT)', category: 'SAFETY_HSE', issueDate: '2025-03-01', expiryDate: '2027-02-28', certNumber: 'AGT-2025-014', issuingBody: 'Nias Terminal', status: 'VALID' },
      { code: 'CERT-EMR-04', name: 'Industrial Firefighting & First Aid', category: 'SAFETY_HSE', issueDate: '2024-12-15', expiryDate: '2026-12-14', certNumber: 'AFF-2024-099', issuingBody: 'Pertamina FTC', status: 'VALID' },
    ],
  },
  {
    id: 'EMP-004',
    name: 'Erwin Supriatna',
    role: 'DCS / SCADA Control Technician',
    department: 'OP_ALPHA',
    teamName: 'TEAM-A',
    currentStatus: 'ON_SITE',
    todayShift: 'Off',
    onSiteDays: 77,
    targetCycleDays: 90,
    cycleStartDate: '2026-06-12',
    nextRotationDueDate: '2026-09-09',
    relieverName: 'Ripal Fadiah',
    contactNo: '+62 812-4433-8890',
    radioChannel: 'CH-02 (OPS)',
    ertRole: 'First Aider',
    rosterDays: generateRosterPattern('OP_ALPHA', 2),
    competencies: [
      { code: 'CERT-TEC-05', name: 'DeltaV DCS & SCADA Operations', category: 'ELECTRICAL_INST', issueDate: '2024-07-10', expiryDate: '2027-07-09', certNumber: 'DCS-SCADA-2024-331', issuingBody: 'Emerson Process', status: 'VALID' },
      { code: 'CERT-PTW-03', name: 'PTW Receiver & Gas Safety', category: 'SAFETY_HSE', issueDate: '2024-09-18', expiryDate: '2026-09-17', certNumber: 'PTW-REC-2024-04', issuingBody: 'Nias Terminal', status: 'EXPIRING_SOON' },
      { code: 'CERT-EMR-04', name: 'First Aid & ESD Response', category: 'SAFETY_HSE', issueDate: '2025-01-10', expiryDate: '2027-01-09', certNumber: 'FA-ESD-2025-11', issuingBody: 'Pertamina FTC', status: 'VALID' },
    ],
  },

  // 3. Operation TEAM-B (3) - (Today: Day Shift)
  {
    id: 'EMP-005',
    name: 'Asman Sampeaman',
    role: 'OP Team Leader (TEAM-B)',
    department: 'OP_BRAVO',
    teamName: 'TEAM-B',
    currentStatus: 'ON_SITE',
    todayShift: 'D',
    onSiteDays: 28,
    targetCycleDays: 90,
    cycleStartDate: '2026-07-31',
    nextRotationDueDate: '2026-10-28',
    relieverName: 'Juli Surungan',
    contactNo: '+62 812-9900-1122',
    radioChannel: 'CH-02 (OPS)',
    ertRole: 'Incident Commander',
    rosterDays: generateRosterPattern('OP_BRAVO', 0),
    competencies: [
      { code: 'CERT-HSE-01', name: 'K3 Migas Safety Supervisor', category: 'SAFETY_HSE', issueDate: '2024-06-01', expiryDate: '2027-05-31', certNumber: 'BNSP-MIGAS-2024-1560', issuingBody: 'BNSP RI', status: 'VALID' },
      { code: 'CERT-CRY-02', name: 'Cryogenic LNG Decanting Lead', category: 'CRYOGENIC_OPS', issueDate: '2024-10-15', expiryDate: '2026-10-14', certNumber: 'MIGAS-CRY-2024-0552', issuingBody: 'Ditjen Migas', status: 'VALID' },
      { code: 'CERT-PTW-03', name: 'PTW Issuer & Gas Tester', category: 'SAFETY_HSE', issueDate: '2025-04-01', expiryDate: '2027-03-31', certNumber: 'PTW-ISS-005', issuingBody: 'Nias Terminal', status: 'VALID' },
      { code: 'CERT-EMR-04', name: 'Advanced Firefighting Team Lead', category: 'SAFETY_HSE', issueDate: '2024-11-10', expiryDate: '2026-11-09', certNumber: 'AFF-TL-2024-18', issuingBody: 'Pertamina FTC', status: 'VALID' },
    ],
  },
  {
    id: 'EMP-006',
    name: 'Muradi',
    role: 'Field Operator',
    department: 'OP_BRAVO',
    teamName: 'TEAM-B',
    currentStatus: 'ON_SITE',
    todayShift: 'D',
    onSiteDays: 54,
    targetCycleDays: 90,
    cycleStartDate: '2026-07-05',
    nextRotationDueDate: '2026-10-02',
    relieverName: 'Danang',
    contactNo: '+62 813-1122-3344',
    radioChannel: 'CH-02 (OPS)',
    ertRole: 'Gas Leak Response',
    rosterDays: generateRosterPattern('OP_BRAVO', 1),
    competencies: [
      { code: 'CERT-CRY-02', name: 'Cryogenic LNG Decanting Operator', category: 'CRYOGENIC_OPS', issueDate: '2024-08-20', expiryDate: '2026-12-19', certNumber: 'MIGAS-CRY-2024-0711', issuingBody: 'Ditjen Migas', status: 'VALID' },
      { code: 'CERT-PTW-03', name: 'Authorized Gas Tester (AGT)', category: 'SAFETY_HSE', issueDate: '2025-02-15', expiryDate: '2027-02-14', certNumber: 'AGT-2025-022', issuingBody: 'Nias Terminal', status: 'VALID' },
      { code: 'CERT-EMR-04', name: 'Industrial Firefighting & First Aid', category: 'SAFETY_HSE', issueDate: '2024-09-10', expiryDate: '2026-11-09', certNumber: 'AFF-2024-112', issuingBody: 'Pertamina FTC', status: 'VALID' },
    ],
  },
  {
    id: 'EMP-007',
    name: 'Ripal Fadiah',
    role: 'DCS / SCADA Control Technician',
    department: 'OP_BRAVO',
    teamName: 'TEAM-B',
    currentStatus: 'ON_SITE',
    todayShift: 'D',
    onSiteDays: 36,
    targetCycleDays: 90,
    cycleStartDate: '2026-07-23',
    nextRotationDueDate: '2026-10-20',
    relieverName: 'Uliyansyah',
    contactNo: '+62 812-3344-5566',
    radioChannel: 'CH-02 (OPS)',
    ertRole: 'First Aider',
    rosterDays: generateRosterPattern('OP_BRAVO', 2),
    competencies: [
      { code: 'CERT-TEC-05', name: 'DeltaV DCS & SCADA Operations', category: 'ELECTRICAL_INST', issueDate: '2025-01-15', expiryDate: '2028-01-14', certNumber: 'DCS-SCADA-2025-108', issuingBody: 'Emerson Process', status: 'VALID' },
      { code: 'CERT-PTW-03', name: 'PTW Receiver & Gas Safety', category: 'SAFETY_HSE', issueDate: '2025-03-10', expiryDate: '2027-03-09', certNumber: 'PTW-REC-2025-19', issuingBody: 'Nias Terminal', status: 'VALID' },
      { code: 'CERT-EMR-04', name: 'First Aid & ESD Response', category: 'SAFETY_HSE', issueDate: '2025-02-01', expiryDate: '2027-01-31', certNumber: 'FA-ESD-2025-24', issuingBody: 'Pertamina FTC', status: 'VALID' },
    ],
  },

  // 4. Operation TEAM-C (3) - (Today: Night Shift)
  {
    id: 'EMP-008',
    name: 'Juli Surungan',
    role: 'OP Team Leader (TEAM-C)',
    department: 'OP_CHARLIE',
    teamName: 'TEAM-C',
    currentStatus: 'ON_SITE',
    todayShift: 'N',
    onSiteDays: 15,
    targetCycleDays: 90,
    cycleStartDate: '2026-08-13',
    nextRotationDueDate: '2026-11-10',
    relieverName: 'Shadiq M. Shalih',
    contactNo: '+62 811-7788-9900',
    radioChannel: 'CH-02 (OPS)',
    ertRole: 'Incident Commander',
    rosterDays: generateRosterPattern('OP_CHARLIE', 0),
    competencies: [
      { code: 'CERT-HSE-01', name: 'K3 Migas Safety Supervisor', category: 'SAFETY_HSE', issueDate: '2024-07-20', expiryDate: '2027-07-19', certNumber: 'BNSP-MIGAS-2024-1890', issuingBody: 'BNSP RI', status: 'VALID' },
      { code: 'CERT-CRY-02', name: 'Cryogenic LNG Decanting Lead', category: 'CRYOGENIC_OPS', issueDate: '2024-11-01', expiryDate: '2026-12-31', certNumber: 'MIGAS-CRY-2024-0619', issuingBody: 'Ditjen Migas', status: 'VALID' },
      { code: 'CERT-PTW-03', name: 'PTW Issuer & Gas Tester', category: 'SAFETY_HSE', issueDate: '2025-01-15', expiryDate: '2027-01-14', certNumber: 'PTW-ISS-008', issuingBody: 'Nias Terminal', status: 'VALID' },
      { code: 'CERT-EMR-04', name: 'Advanced Firefighting Team Lead', category: 'SAFETY_HSE', issueDate: '2024-12-05', expiryDate: '2026-12-04', certNumber: 'AFF-TL-2024-31', issuingBody: 'Pertamina FTC', status: 'VALID' },
    ],
  },
  {
    id: 'EMP-009',
    name: 'Danang',
    role: 'Field Operator',
    department: 'OP_CHARLIE',
    teamName: 'TEAM-C',
    currentStatus: 'ON_SITE',
    todayShift: 'N',
    onSiteDays: 62,
    targetCycleDays: 90,
    cycleStartDate: '2026-06-27',
    nextRotationDueDate: '2026-09-24',
    relieverName: 'Yusuf',
    contactNo: '+62 813-9988-7766',
    radioChannel: 'CH-02 (OPS)',
    ertRole: 'Gas Leak Response',
    rosterDays: generateRosterPattern('OP_CHARLIE', 1),
    competencies: [
      { code: 'CERT-CRY-02', name: 'Cryogenic LNG Decanting Operator', category: 'CRYOGENIC_OPS', issueDate: '2024-09-15', expiryDate: '2026-11-14', certNumber: 'MIGAS-CRY-2024-0774', issuingBody: 'Ditjen Migas', status: 'VALID' },
      { code: 'CERT-PTW-03', name: 'Authorized Gas Tester (AGT)', category: 'SAFETY_HSE', issueDate: '2025-03-20', expiryDate: '2027-03-19', certNumber: 'AGT-2025-045', issuingBody: 'Nias Terminal', status: 'VALID' },
      { code: 'CERT-EMR-04', name: 'Industrial Firefighting & First Aid', category: 'SAFETY_HSE', issueDate: '2024-10-25', expiryDate: '2026-12-24', certNumber: 'AFF-2024-135', issuingBody: 'Pertamina FTC', status: 'VALID' },
    ],
  },
  {
    id: 'EMP-010',
    name: 'Uliyansyah',
    role: 'DCS / SCADA Control Technician',
    department: 'OP_CHARLIE',
    teamName: 'TEAM-C',
    currentStatus: 'HANDOVER_PENDING',
    todayShift: 'N',
    onSiteDays: 88,
    targetCycleDays: 90,
    cycleStartDate: '2026-06-01',
    nextRotationDueDate: '2026-08-29',
    relieverName: 'Erwin Supriatna',
    contactNo: '+62 812-6655-4433',
    radioChannel: 'CH-02 (OPS)',
    ertRole: 'First Aider',
    rosterDays: generateRosterPattern('OP_CHARLIE', 2),
    competencies: [
      { code: 'CERT-TEC-05', name: 'DeltaV DCS & SCADA Operations', category: 'ELECTRICAL_INST', issueDate: '2023-09-10', expiryDate: '2026-09-10', certNumber: 'DCS-SCADA-2023-099', issuingBody: 'Emerson Process', status: 'EXPIRING_SOON' },
      { code: 'CERT-PTW-03', name: 'PTW Receiver & Gas Safety', category: 'SAFETY_HSE', issueDate: '2024-10-01', expiryDate: '2026-10-01', certNumber: 'PTW-REC-2024-28', issuingBody: 'Nias Terminal', status: 'VALID' },
      { code: 'CERT-EMR-04', name: 'First Aid & ESD Response', category: 'SAFETY_HSE', issueDate: '2025-02-18', expiryDate: '2027-02-17', certNumber: 'FA-ESD-2025-39', issuingBody: 'Pertamina FTC', status: 'VALID' },
    ],
    complianceWarning: true,
  },

  // 5. Maintenance & Engineering (4)
  {
    id: 'EMP-011',
    name: 'Indra',
    role: 'Mech. Team Leader & Lead Engineer',
    department: 'MAINTENANCE',
    teamName: 'Maintenance',
    currentStatus: 'ON_SITE',
    todayShift: 'D',
    onSiteDays: 50,
    targetCycleDays: 90,
    cycleStartDate: '2026-07-09',
    nextRotationDueDate: '2026-10-06',
    relieverName: 'M. Taufik',
    contactNo: '+62 813-4455-6677',
    radioChannel: 'CH-03 (MAINT)',
    ertRole: 'Gas Leak Response',
    rosterDays: generateRosterPattern('MAINTENANCE', 0),
    competencies: [
      { code: 'CERT-TEC-05', name: 'Cryogenic Pump & Vaporizer Maintenance', category: 'MECHANICAL', issueDate: '2024-04-18', expiryDate: '2027-04-17', certNumber: 'MECH-CRYO-2024-019', issuingBody: 'Ditjen Migas', status: 'VALID' },
      { code: 'CERT-HSE-01', name: 'K3 Migas Maintenance Specialist', category: 'SAFETY_HSE', issueDate: '2024-08-10', expiryDate: '2027-08-09', certNumber: 'BNSP-MIGAS-2024-2201', issuingBody: 'BNSP RI', status: 'VALID' },
      { code: 'CERT-PTW-03', name: 'PTW Signatory & Hot Work Inspector', category: 'SAFETY_HSE', issueDate: '2025-01-25', expiryDate: '2027-01-24', certNumber: 'PTW-HW-011', issuingBody: 'Nias Terminal', status: 'VALID' },
    ],
  },
  {
    id: 'EMP-012',
    name: 'Aginawari',
    role: 'Electrical Systems Engineer',
    department: 'MAINTENANCE',
    teamName: 'Maintenance',
    currentStatus: 'OFF_DUTY',
    todayShift: 'AL',
    onSiteDays: 90,
    targetCycleDays: 90,
    cycleStartDate: '2026-05-30',
    nextRotationDueDate: '2026-08-28',
    relieverName: 'Prabayugo',
    contactNo: '+62 812-7766-5544',
    radioChannel: 'CH-03 (MAINT)',
    ertRole: 'First Aider',
    rosterDays: AUGUST_DAYS.map((d) => (d >= 20 ? 'AL' : 'D')),
    competencies: [
      { code: 'CERT-TEC-05', name: 'Hazardous Area Explosion-Proof Electrical (ATEX/IECEx)', category: 'ELECTRICAL_INST', issueDate: '2024-06-15', expiryDate: '2027-06-14', certNumber: 'ATEX-EE-2024-118', issuingBody: 'TUV Rheinland', status: 'VALID' },
      { code: 'CERT-HSE-01', name: 'K3 Electrical Safety Expert', category: 'SAFETY_HSE', issueDate: '2024-10-01', expiryDate: '2027-09-30', certNumber: 'BNSP-ELEC-2024-041', issuingBody: 'Kemenaker RI', status: 'VALID' },
      { code: 'CERT-PTW-03', name: 'LOTO & Electrical Isolation Authorizer', category: 'SAFETY_HSE', issueDate: '2025-02-11', expiryDate: '2027-02-10', certNumber: 'LOTO-AUTH-012', issuingBody: 'Nias Terminal', status: 'VALID' },
    ],
  },
  {
    id: 'EMP-013',
    name: 'Prabayugo',
    role: 'Instrumentation & Gas Detector Tech',
    department: 'MAINTENANCE',
    teamName: 'Maintenance',
    currentStatus: 'ON_SITE',
    todayShift: 'D',
    onSiteDays: 12,
    targetCycleDays: 90,
    cycleStartDate: '2026-08-16',
    nextRotationDueDate: '2026-11-14',
    relieverName: 'Aginawari',
    contactNo: '+62 811-2233-4455',
    radioChannel: 'CH-03 (MAINT)',
    ertRole: 'Gas Leak Response',
    rosterDays: generateRosterPattern('MAINTENANCE', 2),
    competencies: [
      { code: 'CERT-TEC-05', name: 'F&G Flame & Gas Detector Calibration', category: 'ELECTRICAL_INST', issueDate: '2025-01-20', expiryDate: '2028-01-19', certNumber: 'INST-FG-2025-032', issuingBody: 'Crowcon / Honeywell', status: 'VALID' },
      { code: 'CERT-PTW-03', name: 'FloBoss Flow Computer Custody Metering', category: 'ELECTRICAL_INST', issueDate: '2024-11-05', expiryDate: '2027-11-04', certNumber: 'MTR-FB-2024-81', issuingBody: 'Ditjen Migas', status: 'VALID' },
      { code: 'CERT-EMR-04', name: 'First Aid & ESD Response', category: 'SAFETY_HSE', issueDate: '2025-03-01', expiryDate: '2027-02-28', certNumber: 'FA-ESD-2025-50', issuingBody: 'Pertamina FTC', status: 'VALID' },
    ],
  },
  {
    id: 'EMP-014',
    name: 'M. Taufik',
    role: 'Mech. Team / Cryogenic Valve Mechanic',
    department: 'MAINTENANCE',
    teamName: 'Maintenance',
    currentStatus: 'OFF_DUTY',
    todayShift: 'AL',
    onSiteDays: 90,
    targetCycleDays: 90,
    cycleStartDate: '2026-05-25',
    nextRotationDueDate: '2026-08-24',
    relieverName: 'Indra',
    contactNo: '+62 813-7788-9911',
    radioChannel: 'CH-03 (MAINT)',
    ertRole: 'Gas Leak Response',
    rosterDays: AUGUST_DAYS.map((d) => (d >= 15 ? 'AL' : 'D')),
    competencies: [
      { code: 'CERT-TEC-05', name: 'Cryogenic Valve Overhaul & Flange Torqueing', category: 'MECHANICAL', issueDate: '2023-08-20', expiryDate: '2026-08-20', certNumber: 'VALVE-TECH-2023-08', issuingBody: 'Valve Tech Institute', status: 'EXPIRED' },
      { code: 'CERT-LOG-06', name: 'Certified Rigger & Lifting Safety Level-2', category: 'LOGISTICS_MARINE', issueDate: '2024-05-12', expiryDate: '2026-11-11', certNumber: 'RIG-LV2-2024-419', issuingBody: 'Kemenaker RI', status: 'VALID' },
      { code: 'CERT-PTW-03', name: 'Confined Space & Hot Work Permit Receiver', category: 'SAFETY_HSE', issueDate: '2024-09-01', expiryDate: '2026-09-01', certNumber: 'PTW-CS-2024-14', issuingBody: 'Nias Terminal', status: 'VALID' },
    ],
    complianceWarning: true,
  },

  // 6. HSSE & Safety (2)
  {
    id: 'EMP-015',
    name: 'Arsyan AN',
    role: 'HSE Officer',
    department: 'HSSE',
    teamName: 'HSSE Team',
    currentStatus: 'ON_SITE',
    todayShift: 'D',
    onSiteDays: 40,
    targetCycleDays: 90,
    cycleStartDate: '2026-07-19',
    nextRotationDueDate: '2026-10-16',
    relieverName: 'Chandra R.D',
    contactNo: '+62 812-1144-7788',
    radioChannel: 'CH-04 (HSSE)',
    ertRole: 'Fire Chief',
    rosterDays: generateRosterPattern('HSSE', 0),
    competencies: [
      { code: 'CERT-HSE-01', name: 'Ahli K3 Umum & K3 Migas Certified', category: 'SAFETY_HSE', issueDate: '2024-03-10', expiryDate: '2027-03-09', certNumber: 'AK3-BNSP-2024-092', issuingBody: 'Kemenaker RI', status: 'VALID' },
      { code: 'CERT-PTW-03', name: 'Master PTW & Continuous Gas Testing (AGT)', category: 'SAFETY_HSE', issueDate: '2025-01-10', expiryDate: '2027-01-09', certNumber: 'AGT-MST-2025-01', issuingBody: 'Nias Terminal', status: 'VALID' },
      { code: 'CERT-EMR-04', name: 'Hazardous Materials & Cryogenic Spill Response', category: 'SAFETY_HSE', issueDate: '2024-08-20', expiryDate: '2026-12-19', certNumber: 'HAZMAT-2024-51', issuingBody: 'Pertamina FTC', status: 'VALID' },
    ],
  },
  {
    id: 'EMP-016',
    name: 'Chandra R.D',
    role: 'Sr. HSE Officer & Fire Chief',
    department: 'HSSE',
    teamName: 'HSSE Team',
    currentStatus: 'OFF_DUTY',
    todayShift: 'AL',
    onSiteDays: 90,
    targetCycleDays: 90,
    cycleStartDate: '2026-05-28',
    nextRotationDueDate: '2026-08-27',
    relieverName: 'Arsyan AN',
    contactNo: '+62 811-9988-1122',
    radioChannel: 'CH-04 (HSSE)',
    ertRole: 'Fire Chief',
    rosterDays: AUGUST_DAYS.map((d) => (d >= 18 ? 'AL' : 'D')),
    competencies: [
      { code: 'CERT-HSE-01', name: 'NEBOSH IGC & Senior K3 Migas Expert', category: 'SAFETY_HSE', issueDate: '2024-02-15', expiryDate: '2027-02-14', certNumber: 'NEBOSH-IGC-2024-77', issuingBody: 'NEBOSH UK', status: 'VALID' },
      { code: 'CERT-EMR-04', name: 'Certified Industrial Fire Chief & NFPA Specialist', category: 'SAFETY_HSE', issueDate: '2024-05-01', expiryDate: '2027-04-30', certNumber: 'NFPA-CHIEF-2024-03', issuingBody: 'NFPA / Pertamina', status: 'VALID' },
      { code: 'CERT-PTW-03', name: 'Emergency Command System & Safety Audit Lead', category: 'SAFETY_HSE', issueDate: '2025-01-05', expiryDate: '2027-01-04', certNumber: 'AUD-HSE-2025-09', issuingBody: 'Nias Terminal', status: 'VALID' },
    ],
  },

  // 7. HR / GA (2 - Resident Day Workers, Non-Rotation)
  {
    id: 'EMP-017',
    name: 'Albert A. Gea',
    role: 'HR / GA Officer',
    department: 'HR_GA',
    teamName: 'HR / GA',
    currentStatus: 'ON_SITE',
    todayShift: 'D',
    onSiteDays: 0,
    targetCycleDays: 0,
    cycleStartDate: 'N/A',
    nextRotationDueDate: 'N/A',
    relieverName: 'N/A (Resident Day Worker)',
    contactNo: '+62 813-6655-2211',
    radioChannel: 'CH-05 (LOG)',
    ertRole: 'First Aider',
    rosterDays: AUGUST_DAYS.map((d) => {
      const date = new Date(2026, 7, d);
      return date.getDay() === 0 || date.getDay() === 6 ? 'Off' : 'D';
    }),
    competencies: [
      { code: 'CERT-HSE-01', name: 'Basic Industrial Safety & HR Compliance', category: 'MANAGEMENT', issueDate: '2024-09-10', expiryDate: '2027-09-09', certNumber: 'HR-SAFE-2024-11', issuingBody: 'Kemenaker RI', status: 'VALID' },
      { code: 'CERT-EMR-04', name: 'First Aid & Camp Health Protocol', category: 'SAFETY_HSE', issueDate: '2025-02-01', expiryDate: '2027-01-31', certNumber: 'FA-CAMP-2025-08', issuingBody: 'Indonesian Red Cross', status: 'VALID' },
    ],
  },
  {
    id: 'EMP-018',
    name: 'Jefi R. Zega',
    role: 'Admin Staff & HR / GA Coordinator',
    department: 'HR_GA',
    teamName: 'HR / GA',
    currentStatus: 'ON_SITE',
    todayShift: 'D',
    onSiteDays: 0,
    targetCycleDays: 0,
    cycleStartDate: 'N/A',
    nextRotationDueDate: 'N/A',
    relieverName: 'N/A (Resident Day Worker)',
    contactNo: '+62 812-8899-0011',
    radioChannel: 'CH-05 (LOG)',
    ertRole: 'First Aider',
    rosterDays: AUGUST_DAYS.map((d) => {
      const date = new Date(2026, 7, d);
      return date.getDay() === 0 || date.getDay() === 6 ? 'Off' : 'D';
    }),
    competencies: [
      { code: 'CERT-HSE-01', name: 'Basic Safety Induction & Office Ergonomics', category: 'MANAGEMENT', issueDate: '2024-11-15', expiryDate: '2027-11-14', certNumber: 'ADM-SAFE-2024-04', issuingBody: 'Kemenaker RI', status: 'VALID' },
      { code: 'CERT-EMR-04', name: 'First Aid & Emergency Muster Assistant', category: 'SAFETY_HSE', issueDate: '2025-02-10', expiryDate: '2027-02-09', certNumber: 'FA-ADM-2025-14', issuingBody: 'Indonesian Red Cross', status: 'VALID' },
    ],
  },

  // 8. Logistic Team (1 Direct Personnel)
  {
    id: 'EMP-021',
    name: 'Rahmat Hidayat',
    role: 'Super Cargo & Jetty Marine Inspector',
    department: 'LOGISTICS',
    teamName: 'Logistic Team',
    currentStatus: 'ON_SITE',
    todayShift: 'D',
    onSiteDays: 30,
    targetCycleDays: 90,
    cycleStartDate: '2026-07-29',
    nextRotationDueDate: '2026-10-26',
    relieverName: 'Port Agent',
    contactNo: '+62 811-3344-5566',
    radioChannel: 'CH-06 (JETTY)',
    ertRole: 'None',
    rosterDays: generateRosterPattern('LOGISTICS', 0),
    competencies: [
      { code: 'CERT-LOG-06', name: 'Marine Jetty Loading Master & Super Cargo', category: 'LOGISTICS_MARINE', issueDate: '2024-07-01', expiryDate: '2027-06-30', certNumber: 'LM-MRN-2024-05', issuingBody: 'Port Authority Gunungsitoli', status: 'VALID' },
      { code: 'CERT-CRY-02', name: 'Marine Cryogenic ISO Tank Offload Inspection', category: 'CRYOGENIC_OPS', issueDate: '2024-10-01', expiryDate: '2026-12-31', certNumber: 'CRY-MRN-2024-33', issuingBody: 'Ditjen Migas', status: 'VALID' },
      { code: 'CERT-PTW-03', name: 'Marine PTW & Jetty Gas Clearance Inspector', category: 'SAFETY_HSE', issueDate: '2025-02-20', expiryDate: '2027-02-19', certNumber: 'PTW-JTY-2025-02', issuingBody: 'Nias Terminal', status: 'VALID' },
    ],
  },
];
