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

export interface StaffMasterRecord { id: string; name: string; position: string; team: string; department: 'MANAGEMENT' | 'Operation Team' | 'MAINTENANCE' | 'HSSE' | 'Cargo Logistic' | 'HR_GA'; isLocalResident: boolean; defaultShift: 'D' | 'N' | 'Off'; contactNo: string; radioCh: string; ertRole: string; designatedReliever: string; }
export const STAFF_MASTER_DATA: StaffMasterRecord[] = [
  { id: 'BSG259529', name: 'Edi Hermawan', position: 'Site Manager', team: 'Management', department: 'MANAGEMENT', isLocalResident: false, defaultShift: 'D', contactNo: '0812-3332-8894', radioCh: 'CH-01 (CMD)', ertRole: 'Incident Commander', designatedReliever: 'HQ Delegate' },
  { id: 'BSG259524', name: 'Shadiq M. Shalih', position: 'OP Team Leader', team: 'Management ( Team A )', department: 'MANAGEMENT', isLocalResident: false, defaultShift: 'Off', contactNo: '+62 811-6502-3341', radioCh: 'CH-01 (CMD)', ertRole: 'Incident Commander', designatedReliever: 'Asman Sampeaman' },
  { id: 'BSG259736', name: 'Yusuf', position: 'Field Operator', team: 'TEAM-A', department: 'Operation Team', isLocalResident: false, defaultShift: 'D', contactNo: '+62 813-8822-1044', radioCh: 'CH-02 (OPS)', ertRole: 'Gas Leak Response', designatedReliever: 'Muradi' },
  { id: 'BSG259743', name: 'Erwin Supriatna', position: 'Field Operator', team: 'TEAM-A', department: 'Operation Team', isLocalResident: false, defaultShift: 'Off', contactNo: '+62 812-4433-8890', radioCh: 'CH-02 (OPS)', ertRole: 'First Aider', designatedReliever: 'Ripal Fadiah' },
  { id: 'BSG259833', name: 'Asman Sampeaman', position: 'OP Team Leader', team: 'TEAM-B', department: 'Operation Team', isLocalResident: false, defaultShift: 'D', contactNo: '+62 812-9900-1122', radioCh: 'CH-02 (OPS)', ertRole: 'Incident Commander', designatedReliever: 'Juli Surungan' },
  { id: 'BSG258742', name: 'Muradi', position: 'Field Operator', team: 'TEAM-B', department: 'Operation Team', isLocalResident: false, defaultShift: 'D', contactNo: '+62 813-1122-3344', radioCh: 'CH-02 (OPS)', ertRole: 'Gas Leak Response', designatedReliever: 'Danang' },
  { id: 'BSG259735', name: 'Ripal Fadiah', position: 'Field Operator', team: 'TEAM-B', department: 'Operation Team', isLocalResident: false, defaultShift: 'D', contactNo: '+62 812-3344-5566', radioCh: 'CH-02 (OPS)', ertRole: 'First Aider', designatedReliever: 'Uliyansyah' },
  { id: 'BSG259530', name: 'Juli Surungan', position: 'OP Team Leader', team: 'TEAM-C', department: 'Operation Team', isLocalResident: false, defaultShift: 'D', contactNo: '+62 811-7788-9900', radioCh: 'CH-02 (OPS)', ertRole: 'Incident Commander', designatedReliever: 'Shadiq M. Shalih' },
  { id: 'BSG259634', name: 'Danang', position: 'Field Operator', team: 'TEAM-C', department: 'Operation Team', isLocalResident: false, defaultShift: 'D', contactNo: '+62 813-9988-7766', radioCh: 'CH-02 (OPS)', ertRole: 'Gas Leak Response', designatedReliever: 'Yusuf' },
  { id: 'BSG259532', name: 'Uliyansyah', position: 'Field Operator', team: 'TEAM-C', department: 'Operation Team', isLocalResident: false, defaultShift: 'D', contactNo: '+62 812-6655-4433', radioCh: 'CH-02 (OPS)', ertRole: 'First Aider', designatedReliever: 'Erwin Supriatna' },
  { id: 'BSG259237', name: 'Indra Prabayugo', position: 'Mechanic Engineer', team: 'Maintenance', department: 'MAINTENANCE', isLocalResident: false, defaultShift: 'D', contactNo: '+62 812-7766-5544', radioCh: 'CH-03 (MAINT)', ertRole: 'First Aider', designatedReliever: 'Agunawan' },
  { id: 'BSG259420', name: 'Agunawan', position: 'Maintenance E&I', team: 'Maintenance', department: 'MAINTENANCE', isLocalResident: false, defaultShift: 'D', contactNo: '+62 811-2233-4455', radioCh: 'CH-03 (MAINT)', ertRole: 'Gas Leak Response', designatedReliever: 'Indra Prabayugo' },
  { id: 'BSG259641', name: 'Arsyan AN', position: 'HSE Officer', team: 'HSSE Team', department: 'HSSE', isLocalResident: false, defaultShift: 'D', contactNo: '+62 812-1144-7788', radioCh: 'CH-04 (HSSE)', ertRole: 'Fire Chief', designatedReliever: 'Chandra R.D' },
  { id: 'BSG259919', name: 'Chandra R.D', position: 'HSE Officer', team: 'HSSE Team', department: 'HSSE', isLocalResident: false, defaultShift: 'D', contactNo: '+62 811-9988-1122', radioCh: 'CH-04 (HSSE)', ertRole: 'Fire Chief', designatedReliever: 'Arsyan AN' },
  { id: 'BSG259245', name: 'Indra Parulian', position: 'Super Cargo', team: 'Cargo Operation', department: 'Cargo Logistic', isLocalResident: false, defaultShift: 'D', contactNo: '+62 812-1144-7788', radioCh: 'CH-04 (HSSE)', ertRole: 'Fire Chief', designatedReliever: 'Rafi Anggara' },
  { id: 'BSG259646', name: 'Rafi Anggara', position: 'Crane Operator', team: 'Cargo Operation', department: 'Cargo Logistic', isLocalResident: false, defaultShift: 'D', contactNo: '+62 811-9988-1122', radioCh: 'CH-04 (HSSE)', ertRole: 'Fire Chief', designatedReliever: 'Indra Parulian' },
  { id: 'BSG259444', name: 'Albert A. Gea', position: 'HR / GA Officer', team: 'HR / GA', department: 'HR_GA', isLocalResident: true, defaultShift: 'D', contactNo: '+62 813-6655-2211', radioCh: 'CH-05 (LOG)', ertRole: 'First Aider', designatedReliever: 'Jefi R. Zega' },
  { id: 'BSG199551', name: 'Jefi R. Zega', position: 'HR / GA Coordinator', team: 'HR / GA', department: 'HR_GA', isLocalResident: true, defaultShift: 'D', contactNo: '082165171882', radioCh: 'CH-05 (LOG)', ertRole: 'First Aider', designatedReliever: 'Albert A. Gea' }
];

export const INITIAL_MANPOWER_MASTER_RECORDS: StaffPersonnel[] = STAFF_MASTER_DATA.map((s, idx) => {
  const isResident = s.isLocalResident || s.department === 'HR_GA';
  const cycleStart = isResident
    ? '-'
    : s.team.includes('TEAM-B')
      ? '2026-07-31'
      : s.team.includes('TEAM-C')
        ? '2026-07-26'
        : s.department === 'MAINTENANCE' || s.department === 'HSSE' || s.department === 'Cargo Logistic'
          ? '2026-08-01'
          : '2026-08-15';

  const isOff = s.defaultShift === 'Off';

  return {
    id: s.id,
    name: s.name,
    role: s.position,
    position: s.position,
    department: s.department as any,
    teamName: s.team as any,
    team: s.team,
    currentStatus: isOff ? 'OFF_DUTY' : 'ON_SITE',
    todayShift: s.defaultShift as ShiftCode,
    onSiteDays: isResident || isOff ? 0 : 19,
    targetCycleDays: 90,
    cycleStartDate: cycleStart,
    nextRotationDueDate: isResident ? '-' : '2026-11-13',
    relieverName: s.designatedReliever,
    contactNo: s.contactNo,
    radioChannel: s.radioCh,
    rosterDays: generateRosterPattern(s.department as any, idx, s.id),
    isLocalResident: s.isLocalResident,
    ertRole: s.ertRole as any,
    competencies: [],
  };
});

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
