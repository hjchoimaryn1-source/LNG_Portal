// src/utils/monthlyRosterGenerator.ts
//
// PURPOSE
//   Monthly roster generation (4-rule engine) and manual-override resolution — 순수 함수
//   (React 미의존, AGENTS.md §3 Logic/Data Layer 컨벤션). Phase 13 Target B Sub-stage C:
//   extracted verbatim from cycleEngine.ts (250-line cap cleanup, logic move only, no
//   behavior change).

import { StaffPersonnel, ShiftCode } from '../types/lng';
import { getDaysInMonth } from '../data/manpowerMasterData';

/**
 * Generate monthly roster enforcing:
 * Rule 1: HR/GA (Local Resident) Logic (Mon-Fri D, Sat-Sun R)
 * Rule 2: Leadership Guard (Site Manager & Acting SM with non-overlapping 30d OFF, Edi OFF forces Shadiq to D)
 * Rule 3: Operations (Team A, B, C) - 3:1 Cycle (90d ON / 30d OFF), 10-day flip between D and N, Fatigue Rest R on N->D transition
 * Rule 4: Support Departments (90d ON / 30d OFF, D default, 14th day R fatigue block for 154h compliance)
 */
export function generateMonthlyRoster(
  staff: StaffPersonnel | any,
  year: number,
  month: number
): ShiftCode[] {
  const totalDays = getDaysInMonth(year, month);

  // Rule 1: HR/GA (Local Resident) Logic
  const isLocalResident =
    staff.isLocalResident === true ||
    staff.department === 'HR_GA' ||
    staff.teamName === 'HR / GA' ||
    staff.team === 'HR / GA' ||
    staff.id === 'BSG259444' ||
    staff.id === 'BSG199551' ||
    staff.id === 'EMP-017' ||
    staff.id === 'EMP-018';

  if (isLocalResident) {
    return Array.from({ length: totalDays }, (_, i) => {
      const day = i + 1;
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay(); // 0 = Sun, 6 = Sat
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return 'R';
      }
      return 'D';
    });
  }

  // Identify Leadership
  const isSiteManager =
    staff.id === 'BSG259529' ||
    staff.id === 'EMP-001' ||
    staff.name === 'Edi Hermawan' ||
    (staff.role && staff.role.toLowerCase().includes('site manager')) ||
    (staff.position && staff.position.toLowerCase().includes('site manager'));

  const isActingSmOrShadiq =
    staff.id === 'BSG259524' ||
    staff.id === 'EMP-002' ||
    (staff.name && staff.name.toLowerCase().includes('shadiq'));

  // Identify Operations Teams
  const isTeamA =
    staff.teamName === 'TEAM-A' ||
    staff.team === 'TEAM-A' ||
    staff.department === 'OP_ALPHA' ||
    staff.id === 'BSG259736' ||
    staff.id === 'BSG259743' ||
    staff.id === 'EMP-003' ||
    staff.id === 'EMP-004';

  const isTeamB =
    staff.teamName === 'TEAM-B' ||
    staff.team === 'TEAM-B' ||
    staff.department === 'OP_BRAVO' ||
    staff.id === 'BSG259833' ||
    staff.id === 'BSG258742' ||
    staff.id === 'BSG259735' ||
    staff.id === 'EMP-005' ||
    staff.id === 'EMP-006' ||
    staff.id === 'EMP-007';

  const isTeamC =
    staff.teamName === 'TEAM-C' ||
    staff.team === 'TEAM-C' ||
    staff.department === 'OP_CHARLIE' ||
    staff.id === 'BSG259530' ||
    staff.id === 'BSG259634' ||
    staff.id === 'BSG259532' ||
    staff.id === 'EMP-008' ||
    staff.id === 'EMP-009' ||
    staff.id === 'EMP-010';

  const isOpTeam =
    isTeamA ||
    isTeamB ||
    isTeamC ||
    staff.department === 'Operation Team' ||
    staff.department === 'OP_ALPHA' ||
    staff.department === 'OP_BRAVO' ||
    staff.department === 'OP_CHARLIE';

  // Base anchors for 90/30 rotation (120-day cycle)
  const ediAnchorUtc = Date.UTC(2026, 7, 15); // 2026-08-15
  // Shadiq anchor offset by 60 days to guarantee non-overlapping 30d OFF periods (anti-phase)
  const shadiqAnchorUtc = Date.UTC(2026, 9, 14); // 2026-10-14 (+60 days from Edi)

  // Staggered team anchors for continuous 2-team coverage
  const teamAAnchorUtc = Date.UTC(2026, 7, 15); // 2026-08-15
  const teamBAnchorUtc = Date.UTC(2026, 6, 6);  // 2026-07-06 (-40 days)
  const teamCAnchorUtc = Date.UTC(2026, 8, 24); // 2026-09-24 (+40 days)

  return Array.from({ length: totalDays }, (_, i) => {
    const day = i + 1;
    const currentUtc = Date.UTC(year, month - 1, day);

    // Rule 2: Leadership Guard (Site Manager & Acting SM)
    const ediDiff = Math.floor((currentUtc - ediAnchorUtc) / (1000 * 60 * 60 * 24));
    const ediCycleDay = ((ediDiff % 120) + 120) % 120; // 0..119 (0..89 ON, 90..119 OFF)
    const isEdiOffDay = ediCycleDay >= 90;

    if (isSiteManager) {
      return isEdiOffDay ? 'Off' : 'D';
    }

    if (isActingSmOrShadiq) {
      // When Edi is OFF, Shadiq MUST be forced to 'D' (Acting SM), overriding any OP Team rotation logic
      if (isEdiOffDay) {
        return 'D';
      }
      // Shadiq's own 90/30 cycle
      const shadiqDiff = Math.floor((currentUtc - shadiqAnchorUtc) / (1000 * 60 * 60 * 24));
      const shadiqCycleDay = ((shadiqDiff % 120) + 120) % 120;
      if (shadiqCycleDay >= 90) {
        return 'Off';
      }
      // When On-Site and Edi is present, Shadiq follows Day shift
      return 'D';
    }

    // Rule 3: Operations (Team A, B, C) - 3:1 Cycle & 10-day Flip
    if (isOpTeam) {
      let teamAnchorUtc = teamAAnchorUtc;
      let startsWithNight = false;

      if (isTeamB) {
        teamAnchorUtc = teamBAnchorUtc;
        startsWithNight = true;
      } else if (isTeamC) {
        teamAnchorUtc = teamCAnchorUtc;
        startsWithNight = false;
      }

      const teamAnchorDate = staff.onSiteDate;
      if (teamAnchorDate && teamAnchorDate !== 'N/A' && teamAnchorDate !== '-') {
        const parsed = new Date(teamAnchorDate);
        if (!isNaN(parsed.getTime())) {
          teamAnchorUtc = Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
        }
      }

      const teamDiff = Math.floor((currentUtc - teamAnchorUtc) / (1000 * 60 * 60 * 24));
      const cycleDay = ((teamDiff % 120) + 120) % 120;

      // 30-day Off-Duty period
      if (cycleDay >= 90) {
        return 'Off';
      }

      // 90-day On-Site period: Flip between 'D' and 'N' every 10 days
      const onSiteDay = cycleDay; // 0..89
      const subBlock = Math.floor(onSiteDay / 10); // 0..8
      const dayInBlock = onSiteDay % 10; // 0..9

      const isNightBlock = startsWithNight ? subBlock % 2 === 0 : subBlock % 2 === 1;

      if (isNightBlock) {
        return 'N';
      } else {
        // FATIGUE BLOCK: When transitioning from a 10-day 'N' block to a 'D' block,
        // the first transition day MUST be assigned 'R' (Rest) instead of 'D'
        if (subBlock > 0 && dayInBlock === 0) {
          return 'R';
        }
        return 'D';
      }
    }

    // Rule 4: Support Departments (Maintenance, HSSE, Cargo Logistic)
    let supportAnchorUtc = Date.UTC(2026, 7, 1);
    const supportAnchorDate = staff.onSiteDate;
    if (supportAnchorDate && supportAnchorDate !== 'N/A' && supportAnchorDate !== '-') {
      const parsed = new Date(supportAnchorDate);
      if (!isNaN(parsed.getTime())) {
        supportAnchorUtc = Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
      }
    }

    const supportDiff = Math.floor((currentUtc - supportAnchorUtc) / (1000 * 60 * 60 * 24));
    const supportCycleDay = ((supportDiff % 120) + 120) % 120;

    // 30-day Off-Duty period
    if (supportCycleDay >= 90) {
      return 'Off';
    }

    // 90-day On-Site period: Default shift is 'D'
    // FATIGUE BLOCK: To comply with the max 154 hours / 14 days limit,
    // automatically inject 1 day of 'R' for every 13 consecutive 'D' days (14th day is 'R')
    const onSiteDay = supportCycleDay; // 0..89
    if ((onSiteDay + 1) % 14 === 0) {
      return 'R';
    }
    return 'D';
  });
}

/**
 * Resolve staff monthly roster considering manual overrides
 */
export function resolveStaffMonthlyRoster(
  staff: StaffPersonnel,
  selectedYear: number,
  selectedMonth: number,
  monthOverrides: Record<string, ShiftCode[]>
): ShiftCode[] {
  const key = `${staff.id}_${selectedYear}_${selectedMonth}`;
  const overrides = monthOverrides[key];
  const totalDays = getDaysInMonth(selectedYear, selectedMonth);
  const defaultRoster = generateMonthlyRoster(staff, selectedYear, selectedMonth);

  if (overrides) {
    return Array.from({ length: totalDays }, (_, i) => (overrides[i] !== undefined ? overrides[i] : defaultRoster[i]));
  }
  return defaultRoster;
}
