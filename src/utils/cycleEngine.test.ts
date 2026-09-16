import { describe, it, expect } from 'vitest';
import {
  calcReturnDueDate,
  calcRotationDueDate,
  calcOnSiteDays,
  get3to1Shift,
  sortRotationPersonnelList,
  generateMonthlyRoster,
  resolveStaffMonthlyRoster,
} from './cycleEngine';
import type { StaffPersonnel, ShiftCode } from '../types/lng';

function makeStaff(overrides: Partial<StaffPersonnel> = {}): StaffPersonnel {
  return {
    id: 'EMP-TEST',
    name: 'Test Staff',
    role: 'Field Operator',
    department: 'MAINTENANCE',
    teamName: 'Maintenance',
    currentStatus: 'ON_SITE',
    todayShift: 'D',
    onSiteDays: 10,
    targetCycleDays: 90,
    onSiteDate: '2026-08-01',
    nextRotationDueDate: '2026-10-30',
    relieverName: '-',
    contactNo: '-',
    radioChannel: '-',
    rosterDays: [],
    ...overrides,
  };
}

describe('calcReturnDueDate', () => {
  it('adds the default 30 days', () => {
    expect(calcReturnDueDate('2026-01-01')).toBe('2026-01-31');
  });

  it('adds a custom duration', () => {
    expect(calcReturnDueDate('2026-01-01', 45)).toBe('2026-02-15');
  });

  it('returns "-" for missing/placeholder input', () => {
    expect(calcReturnDueDate('')).toBe('-');
    expect(calcReturnDueDate('N/A')).toBe('-');
    expect(calcReturnDueDate('-')).toBe('-');
    expect(calcReturnDueDate('not-a-date')).toBe('-');
  });
});

describe('calcRotationDueDate', () => {
  it('adds the default 90 days', () => {
    expect(calcRotationDueDate('2026-01-01')).toBe('2026-04-01');
  });

  it('returns "-" for missing/placeholder input', () => {
    expect(calcRotationDueDate('N/A')).toBe('-');
  });
});

describe('calcOnSiteDays', () => {
  it('counts inclusive days between start and today', () => {
    expect(calcOnSiteDays('2026-09-01', '2026-09-15')).toBe(15);
    expect(calcOnSiteDays('2026-09-01', '2026-09-01')).toBe(1);
  });

  it('returns 0 when today is before the start date', () => {
    expect(calcOnSiteDays('2026-09-15', '2026-09-01')).toBe(0);
  });

  it('returns 0 for missing/placeholder start date', () => {
    expect(calcOnSiteDays('-', '2026-09-15')).toBe(0);
  });
});

describe('get3to1Shift', () => {
  it('gives HR_GA (local resident) weekdays D and weekends Off, matching the actual day-of-week', () => {
    const staff = makeStaff({ department: 'HR_GA' });
    const weekdayDate = '2026-09-14';
    const weekendDate = '2026-09-13';
    const isWeekdayActuallyWeekend = [0, 6].includes(new Date(weekdayDate + 'T00:00:00').getDay());
    const isWeekendActuallyWeekend = [0, 6].includes(new Date(weekendDate + 'T00:00:00').getDay());
    expect(get3to1Shift(staff, weekdayDate)).toBe(isWeekdayActuallyWeekend ? 'Off' : 'D');
    expect(get3to1Shift(staff, weekendDate)).toBe(isWeekendActuallyWeekend ? 'Off' : 'D');
  });

  it('gives MANAGEMENT/EMP-001 a fixed D shift regardless of date', () => {
    const staff = makeStaff({ department: 'MANAGEMENT', id: 'EMP-001' });
    expect(get3to1Shift(staff, '2026-09-15')).toBe('D');
    expect(get3to1Shift(staff, '2027-01-01')).toBe('D');
  });

  it('gives support departments (MAINTENANCE/HSSE/LOGISTICS) a fixed D shift', () => {
    expect(get3to1Shift(makeStaff({ department: 'MAINTENANCE' }), '2026-09-15')).toBe('D');
    expect(get3to1Shift(makeStaff({ department: 'HSSE' }), '2026-09-15')).toBe('D');
    expect(get3to1Shift(makeStaff({ department: 'LOGISTICS' }), '2026-09-15')).toBe('D');
  });

  it('cycles OP_ALPHA through D(0,1) / N(2,3) / Off(4,5) phases from codDate', () => {
    const staff = makeStaff({ department: 'OP_ALPHA' });
    expect(get3to1Shift(staff, '2026-09-15', '2026-09-15')).toBe('D'); // phase 0
    expect(get3to1Shift(staff, '2026-09-17', '2026-09-15')).toBe('N'); // phase 2
    expect(get3to1Shift(staff, '2026-09-19', '2026-09-15')).toBe('Off'); // phase 4
  });

  it('cycles OP_CHARLIE through N(0,1) / Off(2,3) / D(4,5) phases from codDate', () => {
    const staff = makeStaff({ department: 'OP_CHARLIE' });
    expect(get3to1Shift(staff, '2026-09-15', '2026-09-15')).toBe('N'); // phase 0
    expect(get3to1Shift(staff, '2026-09-17', '2026-09-15')).toBe('Off'); // phase 2
    expect(get3to1Shift(staff, '2026-09-19', '2026-09-15')).toBe('D'); // phase 4
  });

  it('cycles OP_BRAVO through Off(0,1) / D(2,3) / N(4,5) phases from codDate', () => {
    const staff = makeStaff({ department: 'OP_BRAVO' });
    expect(get3to1Shift(staff, '2026-09-15', '2026-09-15')).toBe('Off'); // phase 0
    expect(get3to1Shift(staff, '2026-09-17', '2026-09-15')).toBe('D'); // phase 2
    expect(get3to1Shift(staff, '2026-09-19', '2026-09-15')).toBe('N'); // phase 4
  });
});

describe('sortRotationPersonnelList', () => {
  const staffB = makeStaff({ id: 'EMP-002', currentStatus: 'ON_SITE' });
  const staffA = makeStaff({ id: 'EMP-001', currentStatus: 'OFF_DUTY' });
  const staffC = makeStaff({ id: 'EMP-010', currentStatus: 'ON_SITE' });

  it('DEFAULT sorts by numeric-aware id', () => {
    const result = sortRotationPersonnelList([staffC, staffA, staffB], 'DEFAULT');
    expect(result.map((s) => s.id)).toEqual(['EMP-001', 'EMP-002', 'EMP-010']);
  });

  it('OFF_FIRST puts off-duty/leave/rest staff before on-site staff', () => {
    const result = sortRotationPersonnelList([staffB, staffA, staffC], 'OFF_FIRST');
    expect(result[0].id).toBe('EMP-001'); // the only OFF_DUTY staff
  });

  it('ONSITE_FIRST puts on-site staff before off-duty/leave/rest staff', () => {
    const result = sortRotationPersonnelList([staffA, staffB, staffC], 'ONSITE_FIRST');
    expect(result[0].id).not.toBe('EMP-001'); // the OFF_DUTY staff isn't first
    expect(result[result.length - 1].id).toBe('EMP-001'); // OFF_DUTY sorted last
  });
});

describe('generateMonthlyRoster', () => {
  it('HR_GA local resident follows the real weekday calendar (Mon-Fri D, Sat-Sun R)', () => {
    const staff = makeStaff({ department: 'HR_GA' });
    const roster = generateMonthlyRoster(staff, 2026, 9); // September 2026, 30 days
    const expected: ShiftCode[] = Array.from({ length: 30 }, (_, i) => {
      const dow = new Date(2026, 8, i + 1).getDay();
      return dow === 0 || dow === 6 ? 'R' : 'D';
    });
    expect(roster).toEqual(expected);
  });

  it('Site Manager (EMP-001) follows the 90d-ON/30d-OFF leadership cycle anchored 2026-08-15', () => {
    const staff = makeStaff({ id: 'EMP-001', department: 'MANAGEMENT' });
    const roster = generateMonthlyRoster(staff, 2026, 8); // August 2026
    expect(roster[0]).toBe('Off'); // Aug 1 — before the anchor, still in prior OFF window
    expect(roster[19]).toBe('D'); // Aug 20 — 5 days into the ON window
  });

  it('Team A (OP_ALPHA) flips D/N every 10 days from its 2026-08-15 anchor', () => {
    const staff = makeStaff({ department: 'OP_ALPHA', onSiteDate: '-' });
    const augRoster = generateMonthlyRoster(staff, 2026, 8);
    expect(augRoster[14]).toBe('D'); // Aug 15 — cycle day 0 (day block)
    expect(augRoster[24]).toBe('N'); // Aug 25 — cycle day 10 (night block)
  });

  it('injects a fatigue "R" day on the first day after a Team A night-block flip', () => {
    const staff = makeStaff({ department: 'OP_ALPHA', onSiteDate: '-' });
    const sepRoster = generateMonthlyRoster(staff, 2026, 9);
    expect(sepRoster[3]).toBe('R'); // Sep 4 — cycle day 20, first day of the 3rd (day) sub-block
  });

  it('injects a 14th-day fatigue "R" for support departments on a 90/30 cycle', () => {
    const staff = makeStaff({ department: 'LOGISTICS', onSiteDate: '-' }); // default anchor 2026-08-01
    const augRoster = generateMonthlyRoster(staff, 2026, 8);
    expect(augRoster[12]).toBe('D'); // Aug 13 — on-site day 12
    expect(augRoster[13]).toBe('R'); // Aug 14 — on-site day 13 -> (13+1)%14===0
  });

  // Phase 13 Target B Sub-stage C: coverage gap flagged during the cycleEngine.ts split —
  // the Acting SM (Shadiq) branch and Team B/C anchors had no prior test coverage.
  it('Acting SM (EMP-002/Shadiq) is forced to D whenever the Site Manager (Edi) is in the OFF window', () => {
    const staff = makeStaff({ id: 'EMP-002', name: 'Shadiq', department: 'OP_ALPHA' });
    const roster = generateMonthlyRoster(staff, 2026, 11); // Nov 2026 — Edi's OFF window (cycle day 90..119)
    expect(roster.every((s) => s === 'D')).toBe(true);
  });

  it('Team B (OP_BRAVO) starts its 10-day block on Night per its anchor', () => {
    const staff = makeStaff({ department: 'OP_BRAVO', onSiteDate: '-' }); // default anchor 2026-07-06
    const julRoster = generateMonthlyRoster(staff, 2026, 7);
    expect(julRoster[5]).toBe('N'); // Jul 6 — cycle day 0, Team B starts with Night
  });

  it('Team C (OP_CHARLIE) starts its 10-day block on Day per its anchor', () => {
    const staff = makeStaff({ department: 'OP_CHARLIE', onSiteDate: '-' }); // default anchor 2026-09-24
    const sepRoster = generateMonthlyRoster(staff, 2026, 9);
    expect(sepRoster[23]).toBe('D'); // Sep 24 — cycle day 0, Team C starts with Day
  });
});

describe('resolveStaffMonthlyRoster', () => {
  it('returns the generated default roster when there is no override', () => {
    const staff = makeStaff({ department: 'HR_GA', id: 'EMP-050' });
    const result = resolveStaffMonthlyRoster(staff, 2026, 9, {});
    expect(result).toEqual(generateMonthlyRoster(staff, 2026, 9));
  });

  it('applies a manual override on top of the default roster at the overridden index only', () => {
    const staff = makeStaff({ department: 'HR_GA', id: 'EMP-050' });
    const overrides: Record<string, ShiftCode[]> = {
      'EMP-050_2026_9': [undefined as unknown as ShiftCode, undefined as unknown as ShiftCode, 'AL'],
    };
    const result = resolveStaffMonthlyRoster(staff, 2026, 9, overrides);
    const defaultRoster = generateMonthlyRoster(staff, 2026, 9);
    expect(result[2]).toBe('AL');
    expect(result[0]).toBe(defaultRoster[0]);
    expect(result[1]).toBe(defaultRoster[1]);
  });
});
