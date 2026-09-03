// src/data/manpowerMasterData.ts
import {
  StaffPersonnel,
  ShiftCode,
  CompetencyCertification,
} from '../types/lng';

export const AUGUST_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const DIRECTIVES_MAP: Record<string, Partial<Record<'DAY' | 'NIGHT', string>>> = {
  '2026-09-01': {
    DAY: 'Monitor ORU pit level; enforce strict PPE on Bay 2.',
    NIGHT: 'Verify night patrol rounds; monitor ORU pit level and Bay 2 access.',
  },
  '2026-09-02': {
    DAY: 'Confirm loading bay vaporizer balance before cargo operations.',
    NIGHT: 'Maintain enhanced gas detection checks during night operations.',
  },
  '2026-09-03': {
    DAY: 'Review active PTW permits before starting planned maintenance.',
    NIGHT: 'Monitor ORU pit level; enforce strict PPE on Bay 2.',
  },
};

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

// Generate August 2026 Roster Pattern for 3 Operation Teams & Support (Official Operation Manpower Arrangement)
export function generateRosterPattern(dept: string, indexInDept: number = 0, staffId?: string): ShiftCode[] {
  return AUGUST_DAYS.map((day) => {
    // 0. Site Manager (EMP-001 Edi Hermawan): 8/1~8/20 D -> 8/21~8/31 AL (Shadiq takes over as Acting SM)
    if (staffId === 'EMP-001' || (dept === 'MANAGEMENT' && indexInDept === 0)) {
      return day <= 20 ? 'D' : 'AL';
    }

    // 1. Team-A (EMP-002 Shadiq, EMP-003 Yusuf, EMP-004 Erwin): 100% 결속 스케줄
    //    8/1~8/14 AL (Off-Duty 집중 휴가) -> 8/15~8/31 D (현장 주간 복귀, Shadiq Acting SM)
    if (dept === 'OP_ALPHA' || staffId === 'EMP-002' || (dept === 'MANAGEMENT' && indexInDept === 1)) {
      if (day <= 14) return 'AL';
      return 'D';
    }

    // 2. Team-C (Juli, Danang, Uliyansyah): 8/1~8/23 Worked (D/N) -> 8/24~8/31 AL (Off-Duty 2-week leave)
    if (dept === 'OP_CHARLIE') {
      if (day >= 24) return 'AL';
      return day <= 11 ? 'D' : 'N';
    }

    // 3. Team-B (Asman, Muradi, Ripal): 8/1~8/31 On-Site Full Duty (D)
    if (dept === 'OP_BRAVO') {
      return 'D';
    }

    // HR/GA Resident Day Workers: Mon-Fri D, Sat-Sun Off
    if (dept === 'HR_GA') {
      const dayOfWeek = (day + 5) % 7; // Aug 1 2026 was Saturday
      if (dayOfWeek === 0 || dayOfWeek === 1) return 'Off'; // Sat/Sun
      return 'D';
    }

    // Support Departments (Logistics, HSSE, Maintenance): On-Site Continuous Duty
    return 'D';
  });
}

// Generate dynamic roster pattern with 2-Team On-Site + 1-Team Off-Island (3:1) for any Year and Month
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

  const isTeamA = staff.department === 'OP_ALPHA' || staff.id === 'EMP-002' || staff.id === 'EMP-003' || staff.id === 'EMP-004';
  const isTeamB = staff.department === 'OP_BRAVO' || staff.id === 'EMP-005' || staff.id === 'EMP-006' || staff.id === 'EMP-007';
  const isTeamC = staff.department === 'OP_CHARLIE' || staff.id === 'EMP-008' || staff.id === 'EMP-009' || staff.id === 'EMP-010';
  const isSiteManager = staff.id === 'EMP-001';

  // Support Teams (Logistics, HSSE, Maintenance): Continuous Daily Day Duty (D)
  if (!isTeamA && !isTeamB && !isTeamC && !isSiteManager) {
    return Array.from({ length: totalDays }, () => 'D');
  }

  // =========================================================================
  // Unified 2-Team On-Site [3:1] Rotation Engine (Team-A, Team-B, Team-C & Site Manager)
  // =========================================================================
  return Array.from({ length: totalDays }, (_, i) => {
    const day = i + 1;
    const currentDate = new Date(year, month - 1, day);

    // -----------------------------------------------------------------------
    // 1. August 2026 (Actual Performance Record)
    // -----------------------------------------------------------------------
    if (year === 2026 && month === 8) {
      if (isSiteManager) {
        return day <= 20 ? 'D' : 'AL'; // Edi leave on 8/21 (Shadiq Acting SM on-site)
      }
      if (isTeamA) {
        // Team-A (Shadiq, Yusuf, Erwin): 8/1~8/14 AL -> 8/15~8/31 D (100% 동일)
        if (day <= 14) return 'AL';
        return 'D';
      }
      if (isTeamC) {
        if (day >= 24) return 'AL';
        return day <= 11 ? 'D' : 'N';
      }
      if (isTeamB) {
        return 'D';
      }
    }

    // -----------------------------------------------------------------------
    // 2. Early September 2026 (Pre-COD: 2026-09-01 ~ 2026-09-14)
    //    Commissioning phase: Team-A Day, Team-B Night, Team-C returns 9/8.
    //    No hardcoded rest overrides — engine drives all assignments.
    // -----------------------------------------------------------------------
    if (year === 2026 && month === 9 && day < 15) {
      if (isSiteManager) {
        return day <= 10 ? 'AL' : 'D'; // Edi returns 9/11 for COD commissioning
      }
      if (isTeamA) {
        // Team-A (Shadiq, Yusuf, Erwin): 9/1~9/14 full Day Shift D — 100% in sync
        return 'D';
      }
      if (isTeamC) {
        return day <= 7 ? 'AL' : 'N'; // Team-C returns from leave 9/8, straight to Night
      }
      if (isTeamB) {
        return 'N'; // Team-B: Night through to COD
      }
    }

    // -----------------------------------------------------------------------
    // 3. Post-COD Perpetual Engine (from 2026-09-15)
    //
    // CYCLE MATH:
    //   Each OP team has a 120-day personal cycle: 90 days ON-SITE → 30 days OFF.
    //   The 3 teams are staggered so exactly 2 are always on-site:
    //     Team-A anchor: COD + 0  days → ON days 0-89, OFF days 90-119, repeat
    //     Team-B anchor: COD + 40 days → ON days 0-89 of its own cycle, OFF 90-119
    //     Team-C anchor: COD + 80 days → ON days 0-89 of its own cycle, OFF 90-119
    //   (Stagger = 120/3 = 40 days)
    //
    // 10-DAY D/N FLIP (within on-site window):
    //   dayInOnSite = 0-89 (day within the 90-day on-site block, 0-indexed)
    //   subBlock = floor(dayInOnSite / 10)   → 0..8  (9 sub-blocks of 10d each)
    //   Team assignment at COD:
    //     Team-A primary (starts Day):  even subBlock → D, odd subBlock → N
    //     Team-B secondary (starts Night): opposite of Team-A
    //     Team-C: tracks with Team-B (also secondary) when B is already off,
    //             otherwise computed from its own on-site position.
    //   When both Team-A and Team-B are on-site simultaneously (always, except
    //   for the 30-day off windows), their sub-block positions differ because
    //   their on-site clocks started on different absolute days.
    // -----------------------------------------------------------------------
    const COD = new Date(2026, 8, 15); // 2026-09-15 (month 8 = Sep in JS 0-idx)
    const diffFromCOD = Math.floor(
      (currentDate.getTime() - COD.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Helper: given an absolute day offset from COD and a team's stagger (0, 40, 80),
    // return the team's current phase and sub-block.
    function teamPhase(stagger: number) {
      const teamDay = ((diffFromCOD - stagger) % 120 + 120) % 120; // 0-119
      const isOnSite = teamDay < 90;
      const subBlock10 = Math.floor(teamDay / 10); // 0..11 (only 0..8 matter when on-site)
      return { isOnSite, teamDay, subBlock10 };
    }

    // Team stagger offsets from COD (days)
    const phaseA = teamPhase(0);   // Team-A: on-site days 0-89, off 90-119
    const phaseB = teamPhase(40);  // Team-B: on-site days 40-129 of COD scale
    const phaseC = teamPhase(80);  // Team-C: on-site days 80-169 of COD scale

    // Determine D/N for an on-site team based on its sub-block.
    // Team-A starts Day on sub-block 0 → even sub-blocks = D, odd = N.
    // Stagger is 40 days → 4 sub-blocks → Team-B starts on sub-block 4 of its own,
    // which is even, so Team-B ALSO starts Day? No: we want them opposite at any point.
    // Simple rule: if the two on-site teams must be opposite, derive one from the other.
    // Use Team-A's subBlock as the absolute phase reference:
    //   globalSubBlock = floor(diffFromCOD / 10)  → flips every 10 calendar days for everyone
    const globalSubBlock = Math.floor(diffFromCOD / 10); // same clock for all

    // D/N assignment: teams are opposite each other based on global 10-day clock.
    // Team-A "primary": even globalSubBlock → D, odd → N
    // Team-B "secondary": opposite of A
    // Team-C "tertiary": same as A (they share the same parity relative to B)
    const teamAShift: ShiftCode = globalSubBlock % 2 === 0 ? 'D' : 'N';
    const teamBShift: ShiftCode = globalSubBlock % 2 === 0 ? 'N' : 'D';
    const teamCShift: ShiftCode = globalSubBlock % 2 === 0 ? 'D' : 'N'; // same as A

    // Return result per team
    if (isTeamA) {
      return phaseA.isOnSite ? teamAShift : 'AL';
    }
    if (isTeamB) {
      return phaseB.isOnSite ? teamBShift : 'AL';
    }
    if (isTeamC) {
      return phaseC.isOnSite ? teamCShift : 'AL';
    }

    // Site Manager (EMP-001 Edi): on-site (D) whenever Team-A is off-island,
    // otherwise on leave (AL) — Shadiq covers as Acting SM when on-site.
    if (isSiteManager) {
      return phaseA.isOnSite ? 'AL' : 'D';
    }

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
  // 1. Management (2) - 1:1 Mutual Interlock [3:1] Rotation
  {
    id: 'EMP-001',
    name: 'Edi Hermawan',
    role: 'Site Manager',
    department: 'MANAGEMENT',
    teamName: 'Management',
    currentStatus: 'OFF_DUTY',
    todayShift: 'AL',
    onSiteDays: 0,
    targetCycleDays: 42,
    cycleStartDate: '2026-08-21',
    nextRotationDueDate: '2026-09-11',
    relieverName: 'Shadiq M. Shalih',
    contactNo: '+62 812-7001-9001',
    radioChannel: 'CH-01 (CMD)',
    ertRole: 'Incident Commander',
    rosterDays: generateRosterPattern('MANAGEMENT', 0, 'EMP-001'),
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
    todayShift: 'D',
    onSiteDays: 19,
    targetCycleDays: 42,
    cycleStartDate: '2026-08-15',
    nextRotationDueDate: '2026-09-26',
    relieverName: 'Edi Hermawan',
    contactNo: '+62 811-6502-3341',
    radioChannel: 'CH-01 (CMD)',
    ertRole: 'Incident Commander',
    rosterDays: generateRosterPattern('MANAGEMENT', 1, 'EMP-002'),
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
    todayShift: 'D',
    onSiteDays: 19,
    targetCycleDays: 42,
    cycleStartDate: '2026-08-15',
    nextRotationDueDate: '2026-09-26',
    relieverName: 'Muradi',
    contactNo: '+62 813-8822-1044',
    radioChannel: 'CH-02 (OPS)',
    ertRole: 'Gas Leak Response',
    rosterDays: generateRosterPattern('OP_ALPHA', 1, 'EMP-003'),
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
    todayShift: 'D',
    onSiteDays: 19,
    targetCycleDays: 42,
    cycleStartDate: '2026-08-15',
    nextRotationDueDate: '2026-09-26',
    relieverName: 'Ripal Fadiah',
    contactNo: '+62 812-4433-8890',
    radioChannel: 'CH-02 (OPS)',
    ertRole: 'First Aider',
    rosterDays: generateRosterPattern('OP_ALPHA', 2, 'EMP-004'),
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
    targetCycleDays: 42,
    cycleStartDate: '2026-07-31',
    nextRotationDueDate: '2026-09-11',
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
    onSiteDays: 33,
    targetCycleDays: 42,
    cycleStartDate: '2026-07-31',
    nextRotationDueDate: '2026-09-11',
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
    onSiteDays: 33,
    targetCycleDays: 42,
    cycleStartDate: '2026-07-31',
    nextRotationDueDate: '2026-09-11',
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
    currentStatus: 'OFF_DUTY',
    todayShift: 'AL',
    onSiteDays: 0,
    targetCycleDays: 42,
    cycleStartDate: '2026-08-24',
    nextRotationDueDate: '2026-09-07',
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
    currentStatus: 'OFF_DUTY',
    todayShift: 'AL',
    onSiteDays: 0,
    targetCycleDays: 42,
    cycleStartDate: '2026-08-24',
    nextRotationDueDate: '2026-09-07',
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
    currentStatus: 'OFF_DUTY',
    todayShift: 'AL',
    onSiteDays: 0,
    targetCycleDays: 42,
    cycleStartDate: '2026-08-24',
    nextRotationDueDate: '2026-09-07',
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

export type DailyRestReason = 'Medical' | 'Emergency' | 'Fatigue 154h' | 'Rotation Leave';

export const DEFAULT_CONFIRMED_DAILY_DATES: string[] = ['2026-09-01'];
export const DEFAULT_COD_BASELINE_DATE = '2026-09-15';
export const DEFAULT_FIT_TO_WORK_HSSE_OFFICER = 'Arsyan AN (HSE Officer)';
export const DEFAULT_FIT_TO_WORK_REASON =
  'Critical Operational Continuity during Island Shift Cover - SOP-NP07-03 Section 4.2 Exemption';

export const HSSE_OFFICER_OPTIONS = [
  { value: 'Arsyan AN (HSE Officer)', label: 'Arsyan AN (HSE Officer - EMP-015)' },
  { value: 'Chandra R.D (Sr. HSE Officer / Fire Chief)', label: 'Chandra R.D (Sr. HSE Officer / Fire Chief - EMP-016)' },
] as const;

export const DAILY_REST_REASONS = [
  { value: 'Medical', label: 'Medical (진료 / 건강 이상 및 관찰)' },
  { value: 'Emergency', label: 'Emergency (긴급 상황 / 개인 사유)' },
  { value: 'Fatigue 154h', label: 'Fatigue 154h (14일 누적 154시간 피로도 초과 안전 대기)' },
  { value: 'Rotation Leave', label: 'Rotation Leave (3:1 Rotation Handover)' },
] as const;
