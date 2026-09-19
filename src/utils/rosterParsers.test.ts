import { describe, it, expect } from 'vitest';
import { normalizePositionTitle, parseManpowerCsvData } from './rosterParsers';

describe('normalizePositionTitle', () => {
  it('returns empty string for empty/dash/blank input', () => {
    expect(normalizePositionTitle('')).toBe('');
    expect(normalizePositionTitle('-')).toBe('');
    expect(normalizePositionTitle('   ')).toBe('');
  });

  it('is case-insensitive and trims whitespace for known aliases', () => {
    expect(normalizePositionTitle('  SITE MANAGER  ')).toBe('Site Manager');
    expect(normalizePositionTitle('site manager')).toBe('Site Manager');
  });

  it('maps DCS/SCADA variants to DCS Control Technician', () => {
    expect(normalizePositionTitle('DCS Operator')).toBe('DCS Control Technician');
    expect(normalizePositionTitle('scada tech')).toBe('DCS Control Technician');
  });

  it('prefers the Mechanical Lead Engineer branch over generic Team Leader when "mech" appears', () => {
    expect(normalizePositionTitle('Mech. Team Leader')).toBe('Mechanical Lead Engineer');
    expect(normalizePositionTitle('Team Leader')).toBe('OP Team Leader');
  });

  it('falls back to the trimmed original title for unrecognized input', () => {
    expect(normalizePositionTitle('  Some Unknown Title  ')).toBe('Some Unknown Title');
  });
});

describe('parseManpowerCsvData', () => {
  it('returns an empty array for empty input', () => {
    expect(parseManpowerCsvData([])).toEqual([]);
  });

  it('filters out blank/summary rows with no ID and no name', () => {
    const rows = [{ ID: '', 'Personnel Name': '' }];
    expect(parseManpowerCsvData(rows, [])).toEqual([]);
  });

  it('filters out a "Baseline" total/summary row even if it has a populated name', () => {
    const rows = [{ ID: 'Baseline-Count', 'Personnel Name': 'Total' }];
    expect(parseManpowerCsvData(rows, [])).toEqual([]);
  });

  it('parses a well-formed row into a typed StaffPersonnel', () => {
    const rows = [
      {
        ID: 'EMP-101',
        'Personnel Name': 'John Doe',
        Team: 'TEAM-A',
        Department: 'Operation Team',
        Position: 'Field Operator',
        Status: 'On-Site',
        'Today Shift': 'D',
        'Target Cycle/Day': '90',
        'On-Site Date': '2026-08-01',
        OnSiteDays: '15', // explicit -> bypasses the wall-clock calcOnSiteDays() fallback
        'Designated Reliever': 'Jane Roe',
        'Contact No': '0812-000',
        'Radio CH': 'CH-02',
        'ERT Role': 'Gas Leak Response',
      },
    ];
    const [staff] = parseManpowerCsvData(rows, []);

    expect(staff.id).toBe('EMP-101');
    expect(staff.name).toBe('John Doe');
    expect(staff.department).toBe('OP_ALPHA'); // Operation + TEAM-A -> OP_ALPHA
    expect(staff.role).toBe('Field Operator');
    expect(staff.currentStatus).toBe('ON_SITE');
    expect(staff.todayShift).toBe('D');
    expect(staff.targetCycleDays).toBe(90);
    expect(staff.onSiteDate).toBe('2026-08-01');
    expect(staff.onSiteDays).toBe(15);
    expect(staff.nextRotationDueDate).toBe('2026-10-30'); // calcRotationDueDate(2026-08-01, 90d)
    expect(staff.relieverName).toBe('Jane Roe');
    expect(staff.ertRole).toBe('Gas Leak Response');
  });

  it('marks OFF_DUTY status from recognized status strings and forces onSiteDays to 0', () => {
    const rows = [
      {
        ID: 'EMP-102',
        'Personnel Name': 'Jane Off',
        Status: 'off-site',
        'On-Site Date': '2026-08-01',
      },
    ];
    const [staff] = parseManpowerCsvData(rows, []);
    expect(staff.currentStatus).toBe('OFF_DUTY');
    expect(staff.onSiteDays).toBe(0);
    expect(staff.nextRotationDueDate).toBe('2026-08-31'); // calcReturnDueDate(2026-08-01, 30d)
  });

  it('drops a row with no ID/Emp_ID/id field even when it has a name (see completion report: the .map() EMP-### auto-id fallback is unreachable dead code, since .filter() independently requires a non-empty id before a row ever reaches .map())', () => {
    const rows = [{ 'Personnel Name': 'No Id Guy' }];
    expect(parseManpowerCsvData(rows, [])).toEqual([]);
  });
});
