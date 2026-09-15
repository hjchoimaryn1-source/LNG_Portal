import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  getWibDate,
  formatIsoDate,
  calculateERTSummary,
  calculateRolling7Days,
  getEligibleRelieverCandidates,
  type ERTSummaryResult,
} from './manningCompliance';
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

afterEach(() => {
  vi.useRealTimers();
});

describe('getWibDate / formatIsoDate', () => {
  it('getWibDate offsets the current time by +7 hours (WIB, UTC+7)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-15T10:00:00.000Z'));
    expect(getWibDate().getTime()).toBe(new Date('2026-09-15T17:00:00.000Z').getTime());
  });

  it('formatIsoDate formats a Date as YYYY-MM-DD (UTC slice)', () => {
    expect(formatIsoDate(new Date('2026-09-15T23:59:59.000Z'))).toBe('2026-09-15');
  });
});

describe('calculateERTSummary', () => {
  const ic = makeStaff({ id: 'IC-1', ertRole: 'Incident Commander', department: 'MANAGEMENT' });
  const fireChief = makeStaff({ id: 'FC-1', ertRole: 'Fire Chief', department: 'HSSE' });
  const firstAider = makeStaff({ id: 'FA-1', ertRole: 'First Aider', department: 'MAINTENANCE' });
  const gasResponse1 = makeStaff({ id: 'GR-1', ertRole: 'Gas Leak Response', department: 'OP_BRAVO' });
  const gasResponse2 = makeStaff({ id: 'GR-2', ertRole: 'Gas Leak Response', department: 'OP_CHARLIE' });

  it('meets all ERT gates when every role has enough active, non-expired-competency staff', () => {
    const summary = calculateERTSummary(
      [ic, fireChief, firstAider, gasResponse1, gasResponse2],
      {},
      {}
    );
    expect(summary.icCount).toBe(1);
    expect(summary.fireChiefCount).toBe(1);
    expect(summary.firstAiderCount).toBe(1);
    expect(summary.gasResponseCount).toBe(2);
    expect(summary.isAllERTMet).toBe(true);
  });

  it('is not met when gas response coverage is below the required 2', () => {
    const summary = calculateERTSummary([ic, fireChief, firstAider, gasResponse1], {}, {});
    expect(summary.isGasResponseMet).toBe(false);
    expect(summary.isAllERTMet).toBe(false);
  });

  it('excludes staff with an expired competency certification from the active/certified pool', () => {
    const expiredIc = makeStaff({
      id: 'IC-EXPIRED',
      ertRole: 'Incident Commander',
      department: 'MANAGEMENT',
      competencies: [
        {
          code: 'C1',
          name: 'Incident Command',
          category: 'MANAGEMENT',
          issueDate: '2020-01-01',
          expiryDate: '2021-01-01',
          certNumber: 'X',
          issuingBody: 'X',
          status: 'EXPIRED',
        },
      ],
    });
    const summary = calculateERTSummary([expiredIc, fireChief, firstAider, gasResponse1, gasResponse2], {}, {});
    expect(summary.icCount).toBe(0);
    expect(summary.isICMet).toBe(false);
  });

  it('excludes an absent (non-PRESENT, unreplaced) staff member from the active pool', () => {
    const summary = calculateERTSummary(
      [ic, fireChief, firstAider, gasResponse1, gasResponse2],
      { 'GR-2': { status: 'ON_LEAVE' } }, // absent with no replacement
      {}
    );
    expect(summary.gasResponseCount).toBe(1);
    expect(summary.isGasResponseMet).toBe(false);
  });

  // Flagged behavior (not a fix): OP_ALPHA staff are unconditionally excluded from the ERT
  // active pool regardless of PRESENT status or ertRole — see completion report.
  it('[flagged current behavior] excludes an OP_ALPHA staff member from the ERT pool even when present and role-qualified', () => {
    const opAlphaIc = makeStaff({ id: 'IC-OPA', ertRole: 'Incident Commander', department: 'OP_ALPHA' });
    const summary = calculateERTSummary([opAlphaIc], {}, {});
    expect(summary.icCount).toBe(0);
    expect(summary.isICMet).toBe(false);
  });
});

describe('calculateRolling7Days', () => {
  const metErtSummary: ERTSummaryResult = {
    icCount: 1,
    fireChiefCount: 1,
    firstAiderCount: 1,
    gasResponseCount: 2,
    isICMet: true,
    isFireChiefMet: true,
    isFirstAiderMet: true,
    isGasResponseMet: true,
    isAllERTMet: true,
  };

  it("today's headcount is the hardcoded totalPlanned=16 minus unreplaced absences — NOT derived from manpowerData.length (see completion report)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-15T00:00:00.000Z'));
    const threeStaff = [makeStaff({ id: 'A' }), makeStaff({ id: 'B' }), makeStaff({ id: 'C' })];
    const days = calculateRolling7Days(
      threeStaff, // only 3 staff passed in, far fewer than the hardcoded 16
      { X: { status: 'ON_LEAVE' } }, // 1 unreplaced absence
      metErtSummary,
      false,
      0,
      () => []
    );
    expect(days[0].isToday).toBe(true);
    expect(days[0].availableHeadcount).toBe(15); // 16 - 1, unrelated to threeStaff.length === 3
  });

  it('flags DANGER status today when ERT gates are not met, even with zero absences', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-15T00:00:00.000Z'));
    const days = calculateRolling7Days(
      [makeStaff()],
      {},
      { ...metErtSummary, isAllERTMet: false, isGasResponseMet: false, gasResponseCount: 1 },
      false,
      0,
      () => []
    );
    expect(days[0].status).toBe('DANGER');
    expect(days[0].detailText).toContain('ERT Deficit');
  });

  it('flags WARNING status today for a 154h fatigue violation when ERT/manning is otherwise fine', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-15T00:00:00.000Z'));
    const days = calculateRolling7Days([makeStaff()], {}, metErtSummary, true, 2, () => []);
    expect(days[0].status).toBe('WARNING');
    expect(days[0].detailText).toContain('154h Risk (2 staff)');
  });

  it('derives future-day headcount from the injected roster function, DANGER below 13 on-duty', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-15T00:00:00.000Z'));
    const staffList = Array.from({ length: 20 }, (_, i) => makeStaff({ id: `S-${i}` }));
    const allOffRoster = (): ShiftCode[] => Array.from({ length: 31 }, () => 'Off');
    const days = calculateRolling7Days(staffList, {}, metErtSummary, false, 0, allOffRoster);
    expect(days[1].isToday).toBe(false);
    expect(days[1].status).toBe('DANGER');
    expect(days[1].availableHeadcount).toBe(0);
  });
});

describe('getEligibleRelieverCandidates', () => {
  it('Site Manager (EMP-001) gets the Sr. OP Team Leader (EMP-002) as the primary delegate', () => {
    const siteManager = makeStaff({ id: 'EMP-001', role: 'Site Manager' });
    const shadiq = makeStaff({ id: 'EMP-002', name: 'Shadiq', role: 'OP Team Leader' });
    const candidates = getEligibleRelieverCandidates(siteManager, [siteManager, shadiq]);
    expect(candidates[0].staff.id).toBe('EMP-002');
    expect(candidates[0].isPrimary).toBe(true);
  });

  it('Field Operator only gets Field Operator / DCS pool candidates', () => {
    const target = makeStaff({ id: 'FO-1', role: 'Field Operator' });
    const otherFieldOp = makeStaff({ id: 'FO-2', role: 'Field Operator' });
    const dcsTech = makeStaff({ id: 'DCS-1', role: 'DCS Control Technician' });
    const hseOfficer = makeStaff({ id: 'HSE-1', role: 'HSE Officer', department: 'HSSE' });
    const candidates = getEligibleRelieverCandidates(target, [target, otherFieldOp, dcsTech, hseOfficer]);
    const ids = candidates.map((c) => c.staff.id);
    expect(ids).toContain('FO-2');
    expect(ids).toContain('DCS-1');
    expect(ids).not.toContain('HSE-1');
  });

  it('HSSE staff only cross-rotate within the HSSE pool', () => {
    const target = makeStaff({ id: 'HSE-1', role: 'HSE Officer', department: 'HSSE' });
    const otherHse = makeStaff({ id: 'HSE-2', role: 'HSE Officer', department: 'HSSE' });
    const maintenance = makeStaff({ id: 'MT-1', role: 'Mechanical Technician', department: 'MAINTENANCE' });
    const candidates = getEligibleRelieverCandidates(target, [target, otherHse, maintenance]);
    expect(candidates.map((c) => c.staff.id)).toEqual(['HSE-2']);
  });
});
