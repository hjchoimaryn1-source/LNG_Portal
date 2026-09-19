// src/utils/rosterParsers.ts
//
// PURPOSE
//   Manpower CSV/text parsing & normalization into typed StaffPersonnel — 순수 함수
//   (React 미의존, AGENTS.md §3 Logic/Data Layer 컨벤션). Phase 13 Target B Sub-stage A:
//   extracted verbatim from manpowerCalculations.ts (logic move only, no behavior change).

import {
  DepartmentCode,
  StaffPersonnel,
  ShiftCode,
  TeamNameStandard,
  ERTRole,
} from '../types/lng';
import {
  generateRosterPattern,
  INITIAL_MANPOWER_MASTER_RECORDS,
} from '../data/manpowerMasterData';
import { calcOnSiteDays, calcReturnDueDate, calcRotationDueDate } from './cycleEngine';

/**
 * Standardize Position Titles to concise, professional industry names
 */
export function normalizePositionTitle(rawTitle: string): string {
  if (!rawTitle) return '';
  const t = rawTitle.trim();
  const lower = t.toLowerCase();
  if (lower === '-' || lower === '') return '';

  if (lower.includes('site manager')) return 'Site Manager';
  if (
    lower.includes('team leader') ||
    lower.includes('lead engineer') ||
    lower.includes('mechanical engineer') ||
    lower.includes('mech. team leader')
  ) {
    if (lower.includes('mech')) return 'Mechanical Lead Engineer';
    return 'OP Team Leader';
  }
  if (lower.includes('dcs') || lower.includes('scada')) return 'DCS Control Technician';
  if (
    lower.includes('valve mechanic') ||
    lower.includes('mechanical tech') ||
    lower.includes('cryogenic valve') ||
    lower.includes('mech. team') ||
    lower.includes('mechanic')
  )
    return 'Mechanical Technician';
  if (lower.includes('sr. hse') || lower.includes('senior hse') || lower.includes('fire chief'))
    return 'Senior HSE Officer';
  if (lower.includes('hse') || lower.includes('hsse')) return 'HSE Officer';
  if (lower.includes('electrical')) return 'Electrical Systems Engineer';
  if (lower.includes('instrumentation') || lower.includes('gas detector'))
    return 'Instrumentation Technician';
  if (lower.includes('coordinator') || lower.includes('admin staff')) return 'HR / GA Coordinator';
  if (lower.includes('hr') || lower.includes('ga')) return 'HR / GA Officer';
  if (lower.includes('truck driver')) return 'Truck Driver';
  if (lower.includes('super cargo')) return 'Super Cargo';
  if (lower.includes('reach stacker')) return 'Reach Stacker Operator';
  if (lower.includes('field operator')) return 'Field Operator';

  return t;
}

/**
 * Parse manpower CSV row data into strongly typed StaffPersonnel objects
 */
export function parseManpowerCsvData(
  parsedRows: Record<string, string>[],
  masterRecords: StaffPersonnel[] = INITIAL_MANPOWER_MASTER_RECORDS
): StaffPersonnel[] {
  return parsedRows
    .filter((row) => {
      const id = (row['ID'] || row.Emp_ID || row.id || '').trim();
      const name = (row['Personnel Name'] || row.Name || row.name || '').trim();
      // Filter out non-personnel header/summary rows in CSV
      return (id.startsWith('BSG') || id.startsWith('EMP') || (id.length > 0 && name.length > 0)) && !id.includes('Baseline');
    })
    .map((row, idx) => {
      const id = (row['ID'] || row.Emp_ID || row.id || `EMP-${String(idx + 1).padStart(3, '0')}`).trim();
      const name = (row['Personnel Name'] || row.Name || row.name || '').trim();
      const baseMaster = masterRecords.find((r) => r.id === id);

      const rawTeam = (row['Team'] || row.Team_Name || row.teamName || baseMaster?.teamName || 'Management').trim();
      const teamName = rawTeam as TeamNameStandard;

      const rawDept = (row['Department'] || row.Department_Code || row.department || '').trim();
      let dept: DepartmentCode = 'MANAGEMENT';
      if (/management/i.test(rawDept)) {
        dept = 'MANAGEMENT';
      } else if (/maintenance/i.test(rawDept)) {
        dept = 'MAINTENANCE';
      } else if (/hsse|hse/i.test(rawDept)) {
        dept = 'HSSE';
      } else if (/cargo|logistic/i.test(rawDept)) {
        dept = 'LOGISTICS';
      } else if (/hr|ga/i.test(rawDept)) {
        dept = 'HR_GA';
      } else if (/operation/i.test(rawDept)) {
        if (/team-?a|alpha/i.test(rawTeam)) dept = 'OP_ALPHA';
        else if (/team-?b|bravo/i.test(rawTeam)) dept = 'OP_BRAVO';
        else if (/team-?c|charlie/i.test(rawTeam)) dept = 'OP_CHARLIE';
        else dept = 'OP_BRAVO';
      } else if (baseMaster?.department) {
        dept = baseMaster.department;
      }

      const rawRole = (
        row['Position'] ||
        row.Position_Role_Title ||
        row.Role_Title ||
        row.position ||
        row.role ||
        baseMaster?.role ||
        ''
      ).trim();
      const role = normalizePositionTitle(rawRole) || normalizePositionTitle(baseMaster?.role || '') || 'Field Operator';

      const rawStatus = (row['Status'] || row.Current_Status || row.currentStatus || '').trim().toLowerCase();
      const currentStatus: StaffPersonnel['currentStatus'] =
        rawStatus === 'off-site' || rawStatus === 'off_duty' || rawStatus === 'off' || rawStatus === 'leave'
          ? 'OFF_DUTY'
          : 'ON_SITE';

      const rawShift = (row['Today Shift'] || row.Today_Shift || row.todayShift || 'D').trim();
      const todayShift: ShiftCode =
        rawShift === 'Off' || rawShift === 'AL' || rawShift === 'N' || rawShift === 'D'
          ? (rawShift as ShiftCode)
          : currentStatus === 'OFF_DUTY'
          ? 'Off'
          : 'D';

      const targetCycleDays =
        parseInt(row['Target Cycle/Day'] || row.Target_Cycle_Days || row.targetCycleDays || '90', 10) || 90;

      // Column 7: Actual on-site arrival date (if ON_SITE) or leave departure date (if OFF_DUTY)
      const rawCol7 = (row['On-Site Date'] || row['On-Site Days'] || row.onSiteDate || row.On_Site_Date || '').trim();
      const onSiteDate = /^\d{4}-\d{2}-\d{2}/.test(rawCol7)
        ? rawCol7
        : (baseMaster?.onSiteDate || new Date().toISOString().slice(0, 10)).trim();

      // Column 8: Integer on-site days count
      const rawCol8 = (row[''] || row['OnSiteDays'] || row['On-Site Days Count'] || row.onSiteDays || '').trim();
      const parsedCol8 = parseInt(rawCol8, 10);

      const isOffDuty = currentStatus === 'OFF_DUTY';
      let onSiteDays = 0;
      if (isOffDuty) {
        onSiteDays = 0;
      } else if (!isNaN(parsedCol8)) {
        onSiteDays = parsedCol8;
      } else if (!isNaN(parseInt(rawCol7, 10)) && !/^\d{4}-\d{2}-\d{2}/.test(rawCol7)) {
        onSiteDays = parseInt(rawCol7, 10);
      } else {
        onSiteDays = calcOnSiteDays(onSiteDate, new Date().toISOString().slice(0, 10));
      }

      // Dual-state logic for next rotation due date
      const explicitDueDate = (row['Next Rotation (AL)'] || row.Next_Rotation || row.nextRotationDueDate || '').trim();
      const nextRotationDueDate = explicitDueDate || (
        isOffDuty ? calcReturnDueDate(onSiteDate, 30) : calcRotationDueDate(onSiteDate, targetCycleDays)
      );

      const relieverName = (
        row['Designated Reliever'] ||
        row.Reliever_Name ||
        row.relieverName ||
        baseMaster?.relieverName ||
        '-'
      ).trim();

      const contactNo = (row['Contact No'] || row.Contact_No || row.contactNo || baseMaster?.contactNo || '').trim();
      const radioChannel = (row['Radio CH'] || row.Radio_Channel || row.radioChannel || baseMaster?.radioChannel || '').trim();
      const rosterDays = generateRosterPattern(dept, idx, id);

      const rawErt = (row['ERT Role'] || row.ERT_Role || row.ertRole || baseMaster?.ertRole || 'None').trim();
      const ertRole: ERTRole = (rawErt as ERTRole) || 'None';

      return {
        id,
        name,
        role,
        department: dept,
        teamName,
        currentStatus,
        todayShift,
        onSiteDays,
        targetCycleDays,
        onSiteDate,
        nextRotationDueDate,
        relieverName,
        contactNo,
        radioChannel,
        rosterDays,
        competencies: baseMaster?.competencies || [],
        complianceWarning: baseMaster?.complianceWarning || false,
        ertRole,
      };
    });
}
