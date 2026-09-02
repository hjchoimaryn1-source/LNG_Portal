// src/components/manpower/ManpowerRosterView.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Papa from 'papaparse';
import {
  Users,
  Calendar,
  Clock,
  RotateCcw,
  Shield,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertTriangle,
  Radio,
  FileText,
  UserCheck,
  UserX,
  Briefcase,
  ArrowRightLeft,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Award,
  ShieldAlert,
  ShieldCheck,
  BookOpen,
  GraduationCap,
  AlertOctagon,
  Flame,
  HeartPulse,
  Wind,
  Check,
  X,
  UserPlus,
  ArrowUpDown,
  UserCog,
  CheckCheck,
  Lock,
  Zap,
} from 'lucide-react';
import { exportToCSV } from '../../utils/exportCsv';
import {
  DepartmentCode,
  StaffPersonnel,
  ShiftCode,
  TeamNameStandard,
  CompetencyCertification,
  ERTRole,
} from '../../types/lng';
import {
  INITIAL_MANPOWER_MASTER_RECORDS,
  generateRosterPattern,
  AUGUST_DAYS,
  getDaysInMonth,
  generateMonthlyRoster,
  getStaffExpiryStatusForMonth,
  getStaffCompetencyStatus,
} from '../../data/manpowerMasterData';
import TrainingMatrixView from './TrainingMatrixView';
import MonthlyPlanTab from './tabs/MonthlyPlanTab';
import RotationPlanTab from './tabs/RotationPlanTab';

export {
  INITIAL_MANPOWER_MASTER_RECORDS as MANPOWER_DIRECTORY,
  generateRosterPattern,
};
export type { StaffPersonnel, DepartmentCode, ShiftCode, TeamNameStandard };

interface ManpowerRosterViewProps {
  initialSubView?: 'MONTHLY_GRID' | 'ROTATION_TRACKER' | 'DAILY_SHIFT_BOARD' | 'TRAINING_MATRIX';
}

const MONTH_NAMES = [
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

// Helper: Standardize Position Titles to concise, professional industry names
export function normalizePositionTitle(rawTitle: string): string {
  if (!rawTitle) return '';
  const t = rawTitle.trim();
  const lower = t.toLowerCase();
  if (lower === '-' || lower === '') return '';

  if (lower.includes('site manager')) return 'Site Manager';
  if (lower.includes('team leader') || lower.includes('lead engineer') || lower.includes('mechanical engineer') || lower.includes('mech. team leader')) {
    if (lower.includes('mech')) return 'Mechanical Lead Engineer';
    return 'OP Team Leader';
  }
  if (lower.includes('dcs') || lower.includes('scada')) return 'DCS Control Technician';
  if (lower.includes('valve mechanic') || lower.includes('mechanical tech') || lower.includes('cryogenic valve') || lower.includes('mech. team') || lower.includes('mechanic')) return 'Mechanical Technician';
  if (lower.includes('sr. hse') || lower.includes('senior hse') || lower.includes('fire chief')) return 'Senior HSE Officer';
  if (lower.includes('hse') || lower.includes('hsse')) return 'HSE Officer';
  if (lower.includes('electrical')) return 'Electrical Systems Engineer';
  if (lower.includes('instrumentation') || lower.includes('gas detector')) return 'Instrumentation Technician';
  if (lower.includes('coordinator') || lower.includes('admin staff')) return 'HR / GA Coordinator';
  if (lower.includes('hr') || lower.includes('ga')) return 'HR / GA Officer';
  if (lower.includes('truck driver')) return 'Truck Driver';
  if (lower.includes('super cargo')) return 'Super Cargo';
  if (lower.includes('reach stacker')) return 'Reach Stacker Operator';
  if (lower.includes('field operator')) return 'Field Operator';

  return t;
}

// Helper: Calculate Return Due Date = Leave_Start_Date + 14 days (For Off-Day personnel e.g. Team-C)
const calcReturnDueDate = (leaveStartDateStr: string, leaveDurationDays: number = 14): string => {
  if (!leaveStartDateStr || leaveStartDateStr === 'N/A' || leaveStartDateStr === '-') return '-';
  const parts = leaveStartDateStr.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0])) return '-';
  const [y, m, d] = parts;
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + leaveDurationDays);
  const ry = dt.getFullYear();
  const rm = String(dt.getMonth() + 1).padStart(2, '0');
  const rd = String(dt.getDate()).padStart(2, '0');
  return `${ry}-${rm}-${rd}`;
};

// Helper: Calculate Leave Due = OnSite_Start_Date + 42 days (For On-Site personnel e.g. Team-A, Team-B)
const calcRotationDueDate = (startDateStr: string, cycleLengthDays: number = 42): string => {
  if (!startDateStr || startDateStr === 'N/A' || startDateStr === '-') return '-';
  const parts = startDateStr.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0])) return '-';
  const [y, m, d] = parts;
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + cycleLengthDays);
  const ry = dt.getFullYear();
  const rm = String(dt.getMonth() + 1).padStart(2, '0');
  const rd = String(dt.getDate()).padStart(2, '0');
  return `${ry}-${rm}-${rd}`;
};

// Helper: Calculate dynamic On-Site Days = (Today - Cycle_Start_Date) + 1
const calcOnSiteDays = (startDateStr: string, todayStr: string = '2026-09-02'): number => {
  if (!startDateStr || startDateStr === 'N/A' || startDateStr === '-') return 0;
  const sParts = startDateStr.split('-').map(Number);
  const tParts = todayStr.split('-').map(Number);
  if (sParts.length < 3 || isNaN(sParts[0])) return 0;
  const [sy, sm, sd] = sParts;
  const [ty, tm, td] = tParts;
  const startDt = new Date(sy, sm - 1, sd);
  const todayDt = new Date(ty, tm - 1, td);
  const diffTime = todayDt.getTime() - startDt.getTime();
  if (diffTime < 0) return 0;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};

export default function ManpowerRosterView({
  initialSubView = 'DAILY_SHIFT_BOARD',
}: ManpowerRosterViewProps) {
  const [activeTab, setActiveTab] = useState<'MONTHLY_GRID' | 'ROTATION_TRACKER' | 'DAILY_SHIFT_BOARD' | 'TRAINING_MATRIX'>(initialSubView);

  // Always sync activeTab when initialSubView prop updates
  useEffect(() => {
    if (initialSubView) {
      setActiveTab(initialSubView);
    }
  }, [initialSubView]);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [manpowerData, setManpowerData] = useState<StaffPersonnel[]>(INITIAL_MANPOWER_MASTER_RECORDS);

  // Accordion Collapsible States for Daily Shift Board
  const [isErtGateExpanded, setIsErtGateExpanded] = useState<boolean>(false);
  const [isFatigueExpanded, setIsFatigueExpanded] = useState<boolean>(false);
  const [isHandoverProtocolModalOpen, setIsHandoverProtocolModalOpen] = useState<boolean>(false);

  // Multi-Month State for Tab 1
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(9); // 1-indexed (9 = September 2026 / Current)
  const [monthOverrides, setMonthOverrides] = useState<Record<string, ShiftCode[]>>({});

  // Rotation Tab Status Sorting Mode: OFF_FIRST <-> ONSITE_FIRST
  const [statusSortMode, setStatusSortMode] = useState<'OFF_FIRST' | 'ONSITE_FIRST'>('OFF_FIRST');

  // 1. Cross-Tab Deep Linking State
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);

  // 2. Interactive Handover & Delegation Protocol Modal State
  const [handoverModalStaff, setHandoverModalStaff] = useState<StaffPersonnel | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [handoverSuccessToast, setHandoverSuccessToast] = useState<{
    offGoingName: string;
    relieverName: string;
    roleTitle: string;
  } | null>(null);

  // 5. Fatigue Limit Hard-Lock Alert Modal
  const [fatigueAlertModal, setFatigueAlertModal] = useState<{
    staffName: string;
    dayNum: number;
    violationReason: string;
  } | null>(null);

  // 6. Site Manager Exception Rest (R) Approval Modal
  const [siteManagerApprovalModal, setSiteManagerApprovalModal] = useState<{
    staff: StaffPersonnel;
    dayIndex: number;
    dayNum: number;
    reason: string;
  } | null>(null);
  const [approvalReason, setApprovalReason] = useState<string>('Medical');
  const [siteManagerRestToast, setSiteManagerRestToast] = useState<{
    staffName: string;
    dayNum: number;
  } | null>(null);

  // 7. Monthly Plan Past Date / Daily Shift Board Read-Only Lock State
  const [pastDateLockModal, setPastDateLockModal] = useState<{
    dateStr: string;
    staffName: string;
    isConfirmedToday?: boolean;
  } | null>(null);
  const [confirmedDailyDates, setConfirmedDailyDates] = useState<string[]>(['2026-09-01']);
  const [dailyShiftSavedToast, setDailyShiftSavedToast] = useState<boolean>(false);

  // 7.5. SSOT Daily Staff Status & Standby Replacement State (Tab 3 Inline Controls)
  const [dailyStaffStatus, setDailyStaffStatus] = useState<Record<string, { status: 'PRESENT' | 'SICK' | 'EMERGENCY' | 'LEAVE'; replacementId: string }>>({});
  const [isLockModalOpen, setIsLockModalOpen] = useState<boolean>(false);
  const [lockModalSmApproved, setLockModalSmApproved] = useState<boolean>(true);
  const [teamShortageDialog, setTeamShortageDialog] = useState<string | null>(null);

  // 7.6. COD Simulator & [3:1] Roster Engine State
  const [codBaselineDate, setCodBaselineDate] = useState<string>('2026-09-15');
  const [simMode, setSimMode] = useState<'SIMULATION' | 'LIVE'>('SIMULATION');
  const [isCodRosterApplied, setIsCodRosterApplied] = useState<boolean>(true);
  const [codResetToast, setCodResetToast] = useState<string | null>(null);

  // 8. Daily Shift Board (Tab 3) Stand-down / Rest Request & Standby Cover State
  const [dailyRestModalOpen, setDailyRestModalOpen] = useState<boolean>(false);
  const [dailyRestApplicantId, setDailyRestApplicantId] = useState<string>('EMP-005');
  const [dailyRestReason, setDailyRestReason] = useState<'Medical' | 'Emergency' | 'Fatigue 154h'>('Medical');
  const [dailyRestCoverId, setDailyRestCoverId] = useState<string>('EMP-003');
  const [dailyRestSmApproved, setDailyRestSmApproved] = useState<boolean>(true);
  const [dailyRestAssignments, setDailyRestAssignments] = useState<
    Record<string, { reason: string; coveringStaffId: string; approvedAt: string }>
  >({});
  const [fatigueOverrideApproved, setFatigueOverrideApproved] = useState<boolean>(false);

  // 8.5. Fit-to-Work Site Manager Override Modal State (ESDM / IMO STCW Exemption)
  const [isFitToWorkModalOpen, setIsFitToWorkModalOpen] = useState<boolean>(false);
  const [fitToWorkVitalsChecked, setFitToWorkVitalsChecked] = useState<boolean>(true);
  const [fitToWorkRestChecked, setFitToWorkRestChecked] = useState<boolean>(true);
  const [fitToWorkDrugsChecked, setFitToWorkDrugsChecked] = useState<boolean>(true);
  const [fitToWorkHsseOfficer, setFitToWorkHsseOfficer] = useState<string>('Arsyan AN (HSE Officer)');
  const [fitToWorkReason, setFitToWorkReason] = useState<string>(
    'Critical Operational Continuity during Island Shift Cover - SOP-NP07-03 Section 4.2 Exemption'
  );
  const [isFitToWorkOverridden, setIsFitToWorkOverridden] = useState<boolean>(false);

  // 9. Pre-Shift Handover Checklist & Sign-off State for Tab 3
  const [handoverChecklist, setHandoverChecklist] = useState({
    bogNormal: true,
    bayStatus: true,
    ptwReviewed: true,
    ertCleared: true,
    esdArmed: true,
  });
  const [handoverSignatures, setHandoverSignatures] = useState({
    offGoingSigned: true,
    incomingSigned: true,
    smApproved: true,
  });
  const [dailyRestSuccessToast, setDailyRestSuccessToast] = useState<{
    applicantName: string;
    coverName: string;
    reason: string;
  } | null>(null);

  // Synchronize when initialSubView prop changes
  useEffect(() => {
    if (initialSubView) {
      setActiveTab(initialSubView);
    }
  }, [initialSubView]);

  // Dynamic CSV synchronization on mount
  useEffect(() => {
    let isMounted = true;
    fetch('/data/manpower_job_database.csv')
      .then((res) => {
        if (!res.ok) throw new Error('CSV not found');
        return res.text();
      })
      .then((csvText) => {
        if (!isMounted || !csvText) return;
        const parsed = Papa.parse<Record<string, string>>(csvText, {
          header: true,
          skipEmptyLines: true,
        });
        if (parsed.data && parsed.data.length > 0) {
          const records: StaffPersonnel[] = parsed.data
            .filter((row) => row.Emp_ID || row.id || row.Name)
            .map((row, idx) => {
              const id = row.Emp_ID || row.id || `EMP-${String(idx + 1).padStart(3, '0')}`;
              const name = row.Name || row.name || '';
              const dept = (row.Department_Code || row.department || 'MANAGEMENT') as DepartmentCode;
              const teamName = (row.Team_Name || row.teamName || 'Management') as TeamNameStandard;
              const baseMaster = INITIAL_MANPOWER_MASTER_RECORDS.find((r) => r.id === id);
              const rawRole =
                row.Position ||
                row.Role_Title ||
                row.Position_Role_Title ||
                row.position ||
                row.role ||
                baseMaster?.role ||
                '';
              const role = normalizePositionTitle(rawRole) || normalizePositionTitle(baseMaster?.role || '') || 'Field Operator';
              const currentStatus = (row.Current_Status || row.currentStatus || baseMaster?.currentStatus || 'ON_SITE') as StaffPersonnel['currentStatus'];
              const todayShift = (row.Today_Shift || row.todayShift || baseMaster?.todayShift || 'D') as ShiftCode;
              const isOpDept = dept === 'OP_ALPHA' || dept === 'OP_BRAVO' || dept === 'OP_CHARLIE' || id === 'EMP-001' || id === 'EMP-002';
              const targetCycleDays = parseInt(row.Target_Cycle_Days || row.targetCycleDays || (isOpDept ? '42' : '90'), 10) || (isOpDept ? 42 : 90);
              const cycleStartDate = row.Cycle_Start_Date || row.cycleStartDate || baseMaster?.cycleStartDate || '2026-08-15';
              const isOffDuty = currentStatus === 'OFF_DUTY';
              const onSiteDays = isOffDuty ? 0 : calcOnSiteDays(cycleStartDate, '2026-09-02');
              const nextRotationDueDate = isOffDuty
                ? calcReturnDueDate(cycleStartDate, 14)
                : calcRotationDueDate(cycleStartDate, targetCycleDays);
              const relieverName = row.Reliever_Name || row.relieverName || baseMaster?.relieverName || '-';
              const contactNo = row.Contact_No || row.contactNo || '';
              const radioChannel = row.Radio_Channel || row.radioChannel || '';
              const rosterDays = generateRosterPattern(dept, idx, id);

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
                cycleStartDate,
                nextRotationDueDate,
                relieverName,
                contactNo,
                radioChannel,
                rosterDays,
                competencies: baseMaster?.competencies || [],
                complianceWarning: baseMaster?.complianceWarning || false,
                ertRole: (row.ERT_Role as ERTRole) || baseMaster?.ertRole || 'None',
              };
            });
          if (records.length > 0) {
            setManpowerData(records);
          }
        }
      })
      .catch((err) => {
        console.warn('[ManpowerRosterView] Fallback to INITIAL_MANPOWER_MASTER_RECORDS:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 1. Cross-Tab Deep Link Helper
  const navigateToMatrix = useCallback((empId: string) => {
    setSelectedEmpId(empId);
    setActiveTab('TRAINING_MATRIX');
  }, []);

  // 2. Real-Time Certification Update & Approval Handler
  const handleUpdatePersonnelCertification = useCallback(
    (empId: string, certCode: string, updatedCert: CompetencyCertification) => {
      setManpowerData((prev) =>
        prev.map((staff) => {
          if (staff.id !== empId) return staff;

          const updatedCompetencies = (staff.competencies || []).map((c) =>
            c.code === certCode ? updatedCert : c
          );

          // Check if any expired certs remain
          const hasExpired = updatedCompetencies.some((c) => c.status === 'EXPIRED');

          return {
            ...staff,
            competencies: updatedCompetencies,
            complianceWarning: hasExpired,
          };
        })
      );
    },
    []
  );

  // 3:1 Rotation Pattern Helper (2D-2N-2Off 6-day cycle from COD date)
  const get3to1Shift = useCallback((staff: StaffPersonnel, dateStr: string, codDate: string) => {
    const isResident = staff.department === 'HR_GA';
    if (isResident) {
      const d = new Date(dateStr + 'T00:00:00');
      const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
      return dayOfWeek === 0 || dayOfWeek === 6 ? 'Off' : 'D';
    }

    // Management / Site Manager
    if (staff.department === 'MANAGEMENT' && staff.id === 'EMP-001') {
      return 'D';
    }

    // Support teams: Maintenance, HSSE, Logistics
    if (staff.department === 'MAINTENANCE' || staff.department === 'HSSE' || staff.department === 'LOGISTICS') {
      return 'D';
    }

    // Operations Teams (OP_ALPHA, OP_BRAVO, OP_CHARLIE)
    const d1 = new Date(dateStr + 'T00:00:00');
    const d0 = new Date(codDate + 'T00:00:00');
    const diffDays = Math.floor((d1.getTime() - d0.getTime()) / (1000 * 60 * 60 * 24));
    const phase = ((diffDays % 6) + 6) % 6; // 0, 1, 2, 3, 4, 5

    // 3조 2교대 (2D-2N-2Off 6일 주기):
    // Team-A (8/15 복귀 -> COD 시점 On-Site 상주): Days 0,1: D (Day 08:00-20:00) | Days 2,3: N | Days 4,5: Off
    if (staff.department === 'OP_ALPHA' || staff.id === 'EMP-002') {
      if (phase === 0 || phase === 1) return 'D';
      if (phase === 2 || phase === 3) return 'N';
      return 'Off';
    }

    // Team-C (8/24 휴무 -> 9/7 복귀 -> COD 시점 On-Site 상주): Days 0,1: N (Night 20:00-08:00) | Days 2,3: Off | Days 4,5: D
    if (staff.department === 'OP_CHARLIE') {
      if (phase === 0 || phase === 1) return 'N';
      if (phase === 2 || phase === 3) return 'Off';
      return 'D';
    }

    // Team-B (8월 풀가동 -> 9/1~9/14 휴무 -> 9/15 COD 복귀): Days 0,1: Off (Camp Rest) | Days 2,3: D | Days 4,5: N
    if (staff.department === 'OP_BRAVO') {
      if (phase === 0 || phase === 1) return 'Off';
      if (phase === 2 || phase === 3) return 'D';
      return 'N';
    }

    return 'D';
  }, []);

  // Helper to get active roster for staff in (selectedYear, selectedMonth)
  const getStaffRosterForSelectedMonth = useCallback(
    (staff: StaffPersonnel) => {
      const key = `${staff.id}_${selectedYear}_${selectedMonth}`;
      const overrides = monthOverrides[key];
      const totalDays = getDaysInMonth(selectedYear, selectedMonth);
      const defaultRoster = generateMonthlyRoster(staff, selectedYear, selectedMonth);

      if (overrides) {
        return Array.from({ length: totalDays }, (_, i) => (overrides[i] !== undefined ? overrides[i] : defaultRoster[i]));
      }
      return defaultRoster;
    },
    [selectedYear, selectedMonth, monthOverrides]
  );

  // Top KPI Metrics (Dynamically Computed)
  const totalStaff = manpowerData.length; // 22
  const onSiteCount = manpowerData.filter((m) => m.currentStatus === 'ON_SITE' || m.currentStatus === 'HANDOVER_PENDING').length;
  const offDutyCount = manpowerData.filter((m) => m.currentStatus === 'OFF_DUTY').length;
  const dayShiftCount = manpowerData.filter((m) => m.todayShift === 'D' && (m.currentStatus === 'ON_SITE' || m.currentStatus === 'HANDOVER_PENDING')).length;
  const nightShiftCount = manpowerData.filter((m) => m.todayShift === 'N' && (m.currentStatus === 'ON_SITE' || m.currentStatus === 'HANDOVER_PENDING')).length;

  // Update Staff Start Date & Recalculate Rotation Timeline
  const handleUpdateStartDate = useCallback((staffId: string, newDateStr: string) => {
    setManpowerData((prev) =>
      prev.map((staff) => {
        if (staff.id !== staffId) return staff;
        const isOffDuty = staff.currentStatus === 'OFF_DUTY';
        const isOp = staff.department === 'OP_ALPHA' || staff.department === 'OP_BRAVO' || staff.department === 'OP_CHARLIE' || staff.id === 'EMP-002';
        const cycleDays = isOp ? 42 : (staff.targetCycleDays || 90);
        const nextDue = isOffDuty ? calcReturnDueDate(newDateStr, 14) : calcRotationDueDate(newDateStr, cycleDays);
        const onSiteDays = isOffDuty ? 0 : calcOnSiteDays(newDateStr, '2026-09-02');
        return {
          ...staff,
          cycleStartDate: newDateStr,
          onSiteDays,
          nextRotationDueDate: nextDue,
        };
      })
    );
  }, []);

  // Dynamic Shift Groups
  const teamBPersonnel = useMemo(() => manpowerData.filter((m) => m.department === 'OP_BRAVO'), [manpowerData]);
  const teamCPersonnel = useMemo(() => manpowerData.filter((m) => m.department === 'OP_CHARLIE'), [manpowerData]);
  const teamAPersonnel = useMemo(() => manpowerData.filter((m) => m.department === 'OP_ALPHA' || m.id === 'EMP-002'), [manpowerData]);
  const standbyPoolCandidates = useMemo(
    () => manpowerData.filter((m) => m.department === 'OP_ALPHA' || m.id === 'EMP-002' || m.todayShift === 'Off' || m.currentStatus === 'OFF_DUTY'),
    [manpowerData]
  );

  // Cumulative 14-Day Hours of Service calculator (Includes today's cover duty if assigned)
  const get14dHours = useCallback(
    (staff: StaffPersonnel, isAssignedCoverToday: boolean = false, targetDateStr: string = '2026-09-02') => {
      // If simulated targetDate is on or after COD
      if (simMode === 'SIMULATION' && isCodRosterApplied && targetDateStr >= codBaselineDate) {
        // Cumulative hours reset to 0h at COD 00:00 WIB and accumulate only from COD date
        const dTarget = new Date(targetDateStr + 'T00:00:00');
        const dCod = new Date(codBaselineDate + 'T00:00:00');
        const daysSinceCod = Math.floor((dTarget.getTime() - dCod.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const daysInWindow = Math.min(Math.max(daysSinceCod, 1), 14);

        let shiftsWorked = 0;
        for (let i = 0; i < daysInWindow; i++) {
          const pastDate = new Date(dTarget);
          pastDate.setDate(dTarget.getDate() - i);
          const pStr = pastDate.toISOString().split('T')[0];
          if (pStr < codBaselineDate) break; // Don't count hours before COD
          const shift = get3to1Shift(staff, pStr, codBaselineDate);
          if (shift === 'D' || shift === 'N') {
            shiftsWorked++;
          }
        }
        let hours = shiftsWorked * 12;
        if (isAssignedCoverToday) hours += 12;
        return hours;
      }

      // Pre-COD Construction / Island 2-Team Phase (with Day Support Relief):
      // Active operators receive 2 staggered rest days per 14 days, capping steady fatigue at 144h <= 154h.
      let baseHours = 144;
      if (staff.currentStatus === 'OFF_DUTY') baseHours = 0;
      else if (staff.id === 'EMP-005' || staff.id === 'EMP-007') baseHours = 132;
      else if (staff.id === 'EMP-006' || staff.id === 'EMP-003' || staff.id === 'EMP-002' || staff.id === 'EMP-004') baseHours = 144;

      if (isAssignedCoverToday) {
        baseHours += 12; // Extra 12h shift duty pushes to 156h -> prompts Fit-to-Work Override Checklist
      }
      return baseHours;
    },
    [simMode, isCodRosterApplied, codBaselineDate, get3to1Shift]
  );

  // Sync Roster Engine — clears month overrides and recomputes every cell algorithmically
  const handleApplyCodRoster = useCallback(() => {
    // 1. Wipe any manual overrides for the current viewed month so the
    //    pure generateMonthlyRoster() output drives the grid.
    const clearedOverrides: Record<string, ShiftCode[]> = { ...monthOverrides };
    manpowerData.forEach((staff) => {
      const key = `${staff.id}_${selectedYear}_${selectedMonth}`;
      delete clearedOverrides[key];
    });
    setMonthOverrides(clearedOverrides);

    // 2. Reset daily operational state
    setIsCodRosterApplied(true);
    setSimMode('SIMULATION');
    setDailyStaffStatus({});
    setDailyRestAssignments({});

    // 3. Show confirmation toast
    setCodResetToast(
      `✓ Roster Engine synced from ${codBaselineDate}. ` +
      `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear} grid recalculated (10-day D/N rotation applied).`
    );
    setTimeout(() => setCodResetToast(null), 5000);
  }, [codBaselineDate, manpowerData, selectedYear, selectedMonth, monthOverrides]);

  // 3. ERT Manning & Compliance Gate Calculation (Dynamic with Inline Absences & Standby Replacements)
  const ertSummary = useMemo(() => {
    const activeStaffIds = new Set<string>();

    // Team B, Team C, and support on-site staff
    manpowerData.forEach((m) => {
      if (m.currentStatus === 'OFF_DUTY' || m.department === 'OP_ALPHA') return;
      const st = dailyStaffStatus[m.id];
      const isRestLegacy = !!dailyRestAssignments[m.id];
      if ((!st || st.status === 'PRESENT') && !isRestLegacy) {
        activeStaffIds.add(m.id);
      }
    });

    // Add assigned standby replacements
    Object.values(dailyStaffStatus).forEach((st) => {
      if (st.status !== 'PRESENT' && st.replacementId) {
        activeStaffIds.add(st.replacementId);
      }
    });

    // Add legacy dailyRest covers if any
    Object.values(dailyRestAssignments).forEach((assign) => {
      if (assign.coveringStaffId) {
        activeStaffIds.add(assign.coveringStaffId);
      }
    });

    const activeCertifiedPersonnel = manpowerData.filter(
      (m) => activeStaffIds.has(m.id) && !getStaffCompetencyStatus(m).hasExpired
    );

    const icCount = activeCertifiedPersonnel.filter((m) => m.ertRole === 'Incident Commander').length;
    const fireChiefCount = activeCertifiedPersonnel.filter((m) => m.ertRole === 'Fire Chief').length;
    const firstAiderCount = activeCertifiedPersonnel.filter((m) => m.ertRole === 'First Aider').length;
    const gasResponseCount = activeCertifiedPersonnel.filter((m) => m.ertRole === 'Gas Leak Response').length;

    const isICMet = icCount >= 1;
    const isFireChiefMet = fireChiefCount >= 1;
    const isFirstAiderMet = firstAiderCount >= 1;
    const isGasResponseMet = gasResponseCount >= 2;

    const isAllERTMet = isICMet && isFireChiefMet && isFirstAiderMet && isGasResponseMet;

    return {
      icCount,
      fireChiefCount,
      firstAiderCount,
      gasResponseCount,
      isICMet,
      isFireChiefMet,
      isFirstAiderMet,
      isGasResponseMet,
      isAllERTMet,
    };
  }, [manpowerData, dailyStaffStatus, dailyRestAssignments]);

  // Active On-Duty Shift Personnel with 154h Fatigue Exceeded
  const exceeded154hPersonnel = useMemo(() => {
    const activeOnDutyStaff: StaffPersonnel[] = [];

    // Check Team B
    teamBPersonnel.forEach((m) => {
      const st = dailyStaffStatus[m.id];
      if ((!st || st.status === 'PRESENT') && !dailyRestAssignments[m.id]) {
        activeOnDutyStaff.push(m);
      }
    });
    // Check Team C
    teamCPersonnel.forEach((m) => {
      const st = dailyStaffStatus[m.id];
      if ((!st || st.status === 'PRESENT') && !dailyRestAssignments[m.id]) {
        activeOnDutyStaff.push(m);
      }
    });
    // Check Standby replacements
    Object.values(dailyStaffStatus).forEach((st) => {
      if (st.status !== 'PRESENT' && st.replacementId) {
        const cover = manpowerData.find((s) => s.id === st.replacementId);
        if (cover && !activeOnDutyStaff.some((s) => s.id === cover.id)) {
          activeOnDutyStaff.push(cover);
        }
      }
    });
    // Check legacy covers
    Object.values(dailyRestAssignments).forEach((assign) => {
      const cover = manpowerData.find((s) => s.id === assign.coveringStaffId);
      if (cover && !activeOnDutyStaff.some((s) => s.id === cover.id)) {
        activeOnDutyStaff.push(cover);
      }
    });

    return activeOnDutyStaff.filter((m) => {
      const isCover = Object.values(dailyStaffStatus).some((st) => st.status !== 'PRESENT' && st.replacementId === m.id)
        || Object.values(dailyRestAssignments).some((assign) => assign.coveringStaffId === m.id);
      return get14dHours(m, isCover) >= 154;
    });
  }, [teamBPersonnel, teamCPersonnel, dailyStaffStatus, dailyRestAssignments, manpowerData, get14dHours]);

  const has154hViolation = exceeded154hPersonnel.length > 0;

  // 7-Day Rolling Horizon Risk Strip Forecast Calculator (Today 9/2 to +6 Days 9/8)
  const rolling7Days = useMemo(() => {
    const days: Array<{
      dateStr: string;
      dayLabel: string;
      dayNum: number;
      month: number;
      year: number;
      isToday: boolean;
      availableHeadcount: number;
      status: 'OK' | 'WARNING' | 'DANGER';
      badgeText: string;
      detailText: string;
    }> = [];

    const baseYear = 2026;
    const baseMonth = 9;
    const startDay = 2; // Sep 2 is today

    for (let offset = 0; offset < 7; offset++) {
      const currentDayNum = startDay + offset;
      const isToday = offset === 0;
      const dateStr = `2026-09-${String(currentDayNum).padStart(2, '0')}`;
      const dayLabel = isToday ? `09/${String(currentDayNum).padStart(2, '0')} (Today)` : `09/${String(currentDayNum).padStart(2, '0')} (+${offset}D)`;

      if (isToday) {
        // Day 0 (Today SSOT): Evaluates active headcount, ERT compliance, and 154h fatigue
        const totalPlanned = 16;
        const unreplacedAbsence = Object.values(dailyStaffStatus).filter(
          (s) => s.status !== 'PRESENT' && !s.replacementId
        ).length;
        const activeHeadcount = totalPlanned - unreplacedAbsence;

        let status: 'OK' | 'WARNING' | 'DANGER' = 'OK';
        let badgeText = `${activeHeadcount}p OK`;
        let detailText = '100% Manning Cleared';

        if (!ertSummary.isAllERTMet || unreplacedAbsence > 0) {
          status = 'DANGER';
          badgeText = unreplacedAbsence > 0 ? `${activeHeadcount}p Shortage` : 'ERT Deficit';
          detailText = !ertSummary.isAllERTMet
            ? `ERT Deficit (Gas:${ertSummary.gasResponseCount}/2)`
            : `${unreplacedAbsence}p Unreplaced`;
        } else if (has154hViolation) {
          status = 'WARNING';
          badgeText = `${activeHeadcount}p Fatigue Alert`;
          detailText = `154h Risk (${exceeded154hPersonnel.length} staff)`;
        }

        days.push({
          dateStr,
          dayLabel,
          dayNum: currentDayNum,
          month: baseMonth,
          year: baseYear,
          isToday,
          availableHeadcount: activeHeadcount,
          status,
          badgeText,
          detailText,
        });
      } else {
        // Days 1..6: Monthly Roster Forecast & Rotation Due Check
        let onDutyCount = 0;
        let hasRotationRisk = false;

        manpowerData.forEach((m) => {
          const roster = getStaffRosterForSelectedMonth(m);
          const shift = roster[currentDayNum - 1];
          if (shift === 'D' || shift === 'N') {
            onDutyCount++;
          }
          if (dateStr < codBaselineDate) {
            if (m.id === 'EMP-010' && currentDayNum >= 3) {
              hasRotationRisk = true; // Uliyansyah due for AL
            }
            if (m.id === 'EMP-004' && currentDayNum >= 4) {
              hasRotationRisk = true;
            }
          }
        });

        let status: 'OK' | 'WARNING' | 'DANGER' = 'OK';
        let badgeText = `${onDutyCount}p OK`;
        let detailText = 'Normal Operations';

        if (onDutyCount < 13) {
          status = 'DANGER';
          badgeText = `${onDutyCount}p Shortage`;
          detailText = 'Deficit Below Threshold';
        } else if (hasRotationRisk) {
          status = 'WARNING';
          badgeText = `${onDutyCount}p Fatigue / AL Due`;
          detailText = 'Rotation Overdue Risk';
        }

        days.push({
          dateStr,
          dayLabel,
          dayNum: currentDayNum,
          month: baseMonth,
          year: baseYear,
          isToday,
          availableHeadcount: onDutyCount,
          status,
          badgeText,
          detailText,
        });
      }
    }

    return days;
  }, [dailyStaffStatus, ertSummary, has154hViolation, exceeded154hPersonnel, manpowerData, getStaffRosterForSelectedMonth]);

  // Operator Status Change Handler (With Team Shortage Guardrail Rule 1)
  const handleOperatorStatusChange = (staffId: string, newStatus: 'PRESENT' | 'SICK' | 'EMERGENCY' | 'LEAVE') => {
    const targetStaff = manpowerData.find((s) => s.id === staffId);
    setDailyStaffStatus((prev) => {
      const current = prev[staffId] || { status: 'PRESENT', replacementId: '' };
      const updatedReplacementId = newStatus === 'PRESENT' ? '' : current.replacementId;
      const nextState = {
        ...prev,
        [staffId]: {
          status: newStatus,
          replacementId: updatedReplacementId,
        },
      };

      // Check Team Shortage Constraint (Rule 1: If 2+ members in the same team are non-PRESENT)
      if (targetStaff && (targetStaff.department === 'OP_BRAVO' || targetStaff.department === 'OP_CHARLIE')) {
        const sameTeamMembers = manpowerData.filter((m) => m.department === targetStaff.department);
        const absenceCount = sameTeamMembers.filter((m) => {
          const st = m.id === staffId ? { status: newStatus, replacementId: updatedReplacementId } : nextState[m.id];
          return st && st.status !== 'PRESENT';
        }).length;

        if (absenceCount >= 2 && newStatus !== 'PRESENT') {
          setTeamShortageDialog(
            `⚠️ Team Shortage Critical: ${absenceCount} personnel in ${targetStaff.teamName} are marked off-duty. Please assign Standby Pool cover to maintain operational safety minimum.`
          );
        }
      }

      return nextState;
    });
  };

  // Replacement Change Handler
  const handleReplacementChange = (staffId: string, replacementId: string) => {
    setDailyStaffStatus((prev) => {
      const current = prev[staffId] || { status: 'SICK', replacementId: '' };
      return {
        ...prev,
        [staffId]: {
          ...current,
          replacementId,
        },
      };
    });
  };

  // Lock Roster and Propagate to Monthly Plan Handler (SSOT Sync)
  const handleLockAndPropagateRoster = () => {
    const targetDay = 2; // September 2, 2026
    const targetDayIndex = targetDay - 1; // 1

    // Update monthOverrides for Sep 2026
    const newOverrides = { ...monthOverrides };

    manpowerData.forEach((staff) => {
      const staffState = dailyStaffStatus[staff.id];
      if (!staffState) return;

      const key = `${staff.id}_2026_9`;
      const currentRoster = [...(newOverrides[key] || generateMonthlyRoster(staff, 2026, 9))];

      if (staffState.status !== 'PRESENT') {
        // Marked as Off (SICK / EMERGENCY / LEAVE)
        currentRoster[targetDayIndex] = 'Off';
        newOverrides[key] = currentRoster;

        // If replacement assigned
        if (staffState.replacementId) {
          const repKey = `${staffState.replacementId}_2026_9`;
          const repStaff = manpowerData.find((m) => m.id === staffState.replacementId);
          if (repStaff) {
            const repRoster = [...(newOverrides[repKey] || generateMonthlyRoster(repStaff, 2026, 9))];
            const shiftToAssign: ShiftCode = staff.department === 'OP_CHARLIE' ? 'N' : 'D';
            repRoster[targetDayIndex] = shiftToAssign;
            newOverrides[repKey] = repRoster;
          }
        }
      }
    });

    setMonthOverrides(newOverrides);
    setConfirmedDailyDates((prev) => (prev.includes('2026-09-02') ? prev : [...prev, '2026-09-02']));
    setFatigueOverrideApproved(lockModalSmApproved);
    setIsLockModalOpen(false);
    setDailyShiftSavedToast(true);
    setTimeout(() => setDailyShiftSavedToast(false), 5000);
  };

  // 5. Fatigue & Hours of Service Validation Across All Roster
  const fatigueViolationCount = useMemo(() => {
    let violations = 0;
    manpowerData.forEach((staff) => {
      const roster = getStaffRosterForSelectedMonth(staff);
      let consecutiveN = 0;
      roster.forEach((code) => {
        if (code === 'N') {
          consecutiveN++;
          if (consecutiveN > 7) {
            violations++;
          }
        } else {
          consecutiveN = 0;
        }
      });
    });
    return violations;
  }, [manpowerData, getStaffRosterForSelectedMonth]);

  // 5. Shift Cell Click with Past Date Lock, Fatigue Hard-Lock & Site Manager Approval Gate
  const handleShiftCellClick = (staffId: string, dayIndex: number) => {
    const target = manpowerData.find((s) => s.id === staffId);
    if (!target) return;

    const dayNum = dayIndex + 1;
    const dateKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const cellDate = new Date(selectedYear, selectedMonth - 1, dayNum);
    const baselineDate = new Date(2026, 8, 1); // 2026-09-01 (Month 8 in 0-indexed JS Date)

    // 1. Past Date Read-Only Lock & Daily Shift Board Confirmed Freeze
    const isPastDate = cellDate < baselineDate;
    const isConfirmedDate = confirmedDailyDates.includes(dateKey);

    if (isPastDate || isConfirmedDate) {
      setPastDateLockModal({
        dateStr: `${MONTH_NAMES[selectedMonth - 1]} ${dayNum}, ${selectedYear}`,
        staffName: target.name,
        isConfirmedToday: isConfirmedDate && !isPastDate,
      });
      return;
    }

    const currentRoster = getStaffRosterForSelectedMonth(target);
    const currentCode = currentRoster[dayIndex];
    const nextCode: ShiftCode =
      currentCode === 'D' ? 'N' : currentCode === 'N' ? 'Off' : currentCode === 'Off' ? 'AL' : 'D';

    const isResident =
      target.department === 'HR_GA' ||
      target.id === 'EMP-017' ||
      target.id === 'EMP-018' ||
      target.cycleStartDate === 'N/A' ||
      target.cycleStartDate === '-';

    // 3:1 Continuous Operation Policy: Assigning Rest Day (R) during 90d on-site duty requires Site Manager Authorization
    if (nextCode === 'Off' && !isResident) {
      setSiteManagerApprovalModal({
        staff: target,
        dayIndex,
        dayNum: dayIndex + 1,
        reason: approvalReason,
      });
      return;
    }

    if (nextCode === 'N') {
      const tempRoster = [...currentRoster];
      tempRoster[dayIndex] = 'N';

      let maxConsecutiveN = 0;
      let runningN = 0;
      tempRoster.forEach((c) => {
        if (c === 'N') {
          runningN++;
          if (runningN > maxConsecutiveN) maxConsecutiveN = runningN;
        } else {
          runningN = 0;
        }
      });

      if (maxConsecutiveN > 7) {
        setFatigueAlertModal({
          staffName: target.name,
          dayNum: dayIndex + 1,
          violationReason: `Proposed assignment creates ${maxConsecutiveN} consecutive night shifts in ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear} (Maximum allowed: 7 Days under SKK Migas Fatigue Policy).`,
        });
        return;
      }
    }

    const updatedRoster = [...currentRoster];
    updatedRoster[dayIndex] = nextCode;

    const key = `${staffId}_${selectedYear}_${selectedMonth}`;
    setMonthOverrides((prev) => ({
      ...prev,
      [key]: updatedRoster,
    }));
  };

  const handleConfirmDailyShiftBoard = () => {
    if (has154hViolation && !fatigueOverrideApproved) {
      alert(`⚠️ 154h Fatigue Limit Violation:\n${exceeded154hPersonnel.map(s => `• ${s.name} (${s.role}): ${get14dHours(s)}h worked in 14 days`).join('\n')}\n\nSite Manager Fatigue Override authorization is required to submit and lock today's roster.`);
      return;
    }
    const todayKey = '2026-09-01';
    setConfirmedDailyDates((prev) => (prev.includes(todayKey) ? prev : [...prev, todayKey]));
    setDailyShiftSavedToast(true);
    setTimeout(() => setDailyShiftSavedToast(false), 4000);
  };

  const handleOpenDailyRestModal = () => {
    const firstOnDuty = teamBPersonnel[0] || teamCPersonnel[0];
    if (firstOnDuty) {
      setDailyRestApplicantId(firstOnDuty.id);
    }
    const firstStandby = teamAPersonnel[0];
    if (firstStandby) {
      setDailyRestCoverId(firstStandby.id);
    }
    setDailyRestModalOpen(true);
  };

  const handleApplyDailyRestRequest = () => {
    const applicant = manpowerData.find((m) => m.id === dailyRestApplicantId);
    const cover = manpowerData.find((m) => m.id === dailyRestCoverId);
    if (!applicant || !cover) return;

    setDailyRestAssignments((prev) => ({
      ...prev,
      [applicant.id]: {
        reason: dailyRestReason,
        coveringStaffId: cover.id,
        approvedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      },
    }));

    setDailyRestSuccessToast({
      applicantName: applicant.name,
      coverName: cover.name,
      reason: dailyRestReason,
    });
    setTimeout(() => setDailyRestSuccessToast(null), 5000);
    setDailyRestModalOpen(false);
  };

  const handleConfirmSiteManagerApproval = () => {
    if (!siteManagerApprovalModal) return;
    const { staff, dayIndex, dayNum } = siteManagerApprovalModal;
    const currentRoster = getStaffRosterForSelectedMonth(staff);
    const updatedRoster = [...currentRoster];
    updatedRoster[dayIndex] = 'Off'; // Sets Site Manager Authorized Exception Rest (R)

    const key = `${staff.id}_${selectedYear}_${selectedMonth}`;
    setMonthOverrides((prev) => ({
      ...prev,
      [key]: updatedRoster,
    }));

    setSiteManagerRestToast({
      staffName: staff.name,
      dayNum,
    });
    setSiteManagerApprovalModal(null);
  };

  // 2. Rule-Based Delegation & Eligible Reliever Candidate Generator
  const getEligibleRelieverCandidates = useCallback((targetStaff: StaffPersonnel) => {
    const targetRole = targetStaff.role;
    const targetDept = targetStaff.department;
    const candidates: { staff: StaffPersonnel; label: string; isPrimary: boolean }[] = [];

    // Rule 1: Site Manager (EMP-001) -> Sr. OP Team Leader as Primary Acting Delegate
    if (targetStaff.id === 'EMP-001' || targetRole === 'Site Manager') {
      const shadiq = manpowerData.find((m) => m.id === 'EMP-002');
      if (shadiq) {
        candidates.push({
          staff: shadiq,
          label: `${shadiq.name} (Acting Site Manager - Primary Delegate)`,
          isPrimary: true,
        });
      }
      manpowerData
        .filter((m) => m.id !== 'EMP-001' && m.id !== 'EMP-002' && m.role.includes('OP Team Leader'))
        .forEach((m) => {
          candidates.push({
            staff: m,
            label: `${m.name} (OP Team Leader - Secondary Delegate)`,
            isPrimary: false,
          });
        });
      return candidates;
    }

    // Rule 2: Sr. OP Team Leader (EMP-002) -> Other OP Team Leaders as Rotation Relievers
    if (targetStaff.id === 'EMP-002') {
      manpowerData
        .filter((m) => m.id !== 'EMP-002' && m.role.includes('OP Team Leader'))
        .forEach((m) => {
          candidates.push({
            staff: m,
            label: `${m.name} (OP Team Leader - Rotation Reliever)`,
            isPrimary: true,
          });
        });
      manpowerData
        .filter((m) => m.role.includes('DCS'))
        .forEach((m) => {
          candidates.push({
            staff: m,
            label: `${m.name} (DCS Control Technician - Shift Lead Delegate)`,
            isPrimary: false,
          });
        });
      return candidates;
    }

    // Rule 3: OP Team Leaders (Asman, Juli) -> Other Team Leaders or Sr. DCS Control Technicians
    if (targetRole.includes('OP Team Leader')) {
      manpowerData
        .filter((m) => m.id !== targetStaff.id && (m.role.includes('OP Team Leader') || m.id === 'EMP-002'))
        .forEach((m) => {
          candidates.push({
            staff: m,
            label: `${m.name} (OP Team Leader Pool)`,
            isPrimary: true,
          });
        });
      manpowerData
        .filter((m) => m.role.includes('DCS'))
        .forEach((m) => {
          candidates.push({
            staff: m,
            label: `${m.name} (DCS Control Technician - Shift Lead Delegate)`,
            isPrimary: false,
          });
        });
      return candidates;
    }

    // Rule 4: Field Operator -> Only Field Operator & DCS Control Technician Pool
    if (targetRole.includes('Field Operator')) {
      manpowerData
        .filter((m) => m.id !== targetStaff.id && (m.role.includes('Field Operator') || m.role.includes('DCS')))
        .forEach((m) => {
          candidates.push({
            staff: m,
            label: `${m.name} (${m.role} • ${m.teamName})`,
            isPrimary: true,
          });
        });
      return candidates;
    }

    // Rule 5: DCS Control Technician -> Same Operations DCS / Operator Pool
    if (targetRole.includes('DCS Control Technician')) {
      manpowerData
        .filter((m) => m.id !== targetStaff.id && (m.role.includes('DCS') || m.role.includes('Field Operator')))
        .forEach((m) => {
          candidates.push({
            staff: m,
            label: `${m.name} (${m.role} • ${m.teamName})`,
            isPrimary: true,
          });
        });
      return candidates;
    }

    // Rule 6: HSSE Team -> Direct mutual cross-rotation (Arsyan AN <-> Chandra R.D)
    if (targetDept === 'HSSE' || targetRole.includes('HSE')) {
      manpowerData
        .filter((m) => m.id !== targetStaff.id && (m.department === 'HSSE' || m.role.includes('HSE')))
        .forEach((m) => {
          candidates.push({
            staff: m,
            label: `${m.name} (${m.role} - Direct HSSE Cross-Rotation)`,
            isPrimary: true,
          });
        });
      return candidates;
    }

    // Rule 7: Maintenance, Logistics, HR/GA -> Same department acting/reliever pool
    manpowerData
      .filter((m) => m.id !== targetStaff.id && m.department === targetDept)
      .forEach((m) => {
        candidates.push({
          staff: m,
          label: `${m.name} (${m.role} • ${m.teamName})`,
          isPrimary: true,
        });
      });

    return candidates;
  }, [manpowerData]);

  // Click Handover button handler
  const handleOpenHandoverModal = (staff: StaffPersonnel) => {
    setHandoverModalStaff(staff);
    const candidateList = getEligibleRelieverCandidates(staff);
    // Find pre-assigned reliever or fallback to primary candidate
    const existingMatch = candidateList.find((c) =>
      c.staff.name.toLowerCase().includes(staff.relieverName.toLowerCase()) ||
      staff.relieverName.toLowerCase().includes(c.staff.name.toLowerCase())
    );
    if (existingMatch) {
      setSelectedCandidateId(existingMatch.staff.id);
    } else if (candidateList.length > 0) {
      setSelectedCandidateId(candidateList[0].staff.id);
    } else {
      setSelectedCandidateId('');
    }
  };

  // Execute Handover Protocol
  const handleExecuteHandover = (offGoingStaff: StaffPersonnel, relieverStaff: StaffPersonnel) => {
    setManpowerData((prev) =>
      prev.map((s) => (s.id === offGoingStaff.id ? { ...s, relieverName: relieverStaff.name } : s))
    );
    setHandoverSuccessToast({
      offGoingName: offGoingStaff.name,
      relieverName: relieverStaff.name,
      roleTitle: offGoingStaff.role,
    });
    setHandoverModalStaff(null);
  };

  // Toggle Status Sort handler (3-stage: DEFAULT -> ONSITE_FIRST -> OFF_FIRST -> DEFAULT)
  const handleToggleStatusSort = () => {
    setStatusSortMode((prev: any) => {
      if (prev === 'DEFAULT' || !prev) return 'ONSITE_FIRST' as any;
      if (prev === 'ONSITE_FIRST') return 'OFF_FIRST' as any;
      return 'DEFAULT' as any;
    });
  };

  const filteredPersonnel = useMemo(() => {
    return manpowerData.filter((m) => {
      const matchDept = selectedDept === 'ALL' || m.department === selectedDept;
      const matchSearch =
        searchQuery === '' ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.teamName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDept && matchSearch;
    });
  }, [manpowerData, selectedDept, searchQuery]);

  // Tab 2 Sorted List according to 3-stage statusSortMode (DEFAULT -> ONSITE_FIRST -> OFF_FIRST)
  const rotationPersonnelList = useMemo(() => {
    const list = [...filteredPersonnel];

    // 1) as any 캐스팅으로 TypeScript 유니온 비교 에러 방지
    const currentMode = statusSortMode as any;
    if (!currentMode || currentMode === 'DEFAULT') {
      return list.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
    }

    // 2) 토글 버튼을 눌렀을 때만 동작하는 상태 가중치 판별
    const getStatusWeight = (staff: StaffPersonnel) => {
      const s = String((staff as any).currentStatus || (staff as any).status || '').toUpperCase();
      const isOffDuty = s.includes('OFF') || s.includes('LEAVE') || s.includes('REST');

      if (currentMode === 'OFF_FIRST') {
        return isOffDuty ? 1 : 2;
      }
      // ONSITE_FIRST
      return isOffDuty ? 2 : 1;
    };

    // 3) 1차 상태 그룹핑 -> 2차 무조건 EMP 고유번호 순서 유지
    list.sort((a, b) => {
      const wa = getStatusWeight(a);
      const wb = getStatusWeight(b);
      if (wa !== wb) return wa - wb;
      return a.id.localeCompare(b.id, undefined, { numeric: true });
    });

    return list;
  }, [filteredPersonnel, statusSortMode]);

  return (
    <div className="h-full flex flex-col min-h-0 gap-1.5 w-full bg-[#d4d0c8] p-2 overflow-hidden select-none font-sans text-xs">


      {/* ========================================================================= */}
      {/* 3. MAIN CONTENT AREA (Direct Tab Rendering without Duplicate Nav Bar)     */}
      {/* ========================================================================= */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-[#d4d0c8] p-1.5">

        {/* ===================================================================== */}
        {/* TAB 1: MONTHLY PLAN (Simplified Compact Controller & Single-Row Grid) */}
        {activeTab === 'MONTHLY_GRID' && (
          <MonthlyPlanTab
            manpowerData={manpowerData}
            filteredPersonnel={filteredPersonnel}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            selectedEmpId={selectedEmpId}
            confirmedDailyDates={confirmedDailyDates}
            monthNames={MONTH_NAMES}
            getStaffRosterForSelectedMonth={getStaffRosterForSelectedMonth}
            onSelectEmployee={(empId) => setSelectedEmpId(empId)}
            setSelectedYear={setSelectedYear}
            setSelectedMonth={setSelectedMonth}
          />
        )}

        {/* ===================================================================== */}
        {/* TAB 2: ROTATION (8 Simplified Columns, Delegation & Compliance Gate)  */}
        {/* ===================================================================== */}
        {activeTab === 'ROTATION_TRACKER' && (
          <RotationPlanTab
            filteredPersonnel={rotationPersonnelList}
            selectedEmpId={selectedEmpId}
            statusSortMode={statusSortMode}
            onToggleStatusSort={handleToggleStatusSort}
            onSelectEmployee={(empId) => setSelectedEmpId(empId)}
            onUpdateStartDate={handleUpdateStartDate}
            onNavigateToMatrix={navigateToMatrix}
          />
        )}

        {/* ===================================================================== */}
        {/* TAB 3: DAILY SHIFT BOARD (Unified Single Safety & Compliance Gate)    */}
        {/* ===================================================================== */}
        {activeTab === 'DAILY_SHIFT_BOARD' && (
          <div className="space-y-2 p-1.5 bg-[#d4d0c8]">

            {/* ================================================================= */}
            {/* DAILY SUMMARY header + action buttons                             */}
            {/* ================================================================= */}
            <div className="bg-[#d4d0c8] text-slate-900 font-extrabold text-xs px-3 py-1.5 border-t-2 border-l-2 border-r-2 border-b-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] tracking-wider uppercase flex items-center justify-between shadow-xs shrink-0 select-none">
              <div className="flex items-center">
                <span className="text-emerald-700 font-black mr-2 text-sm">■</span>
                <span className="uppercase tracking-wider">DAILY SUMMARY</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsHandoverProtocolModalOpen(true)}
                  className="win-btn text-xs font-bold px-3 py-1 text-slate-900 flex items-center gap-1.5 cursor-pointer"
                  title="Open Pre-Shift Handover & Safety Delegation Protocol (SOP NP07-03)"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-blue-950" />
                  <span>Shift Handover &amp; Delegation</span>
                </button>
                <button
                  onClick={handleOpenDailyRestModal}
                  className="win-btn text-xs font-bold px-3 py-1 text-slate-900 flex items-center gap-1.5 cursor-pointer"
                  title="Apply for on-duty rest/stand-down, shift swap, or assign standby cover"
                >
                  <UserPlus className="w-3.5 h-3.5 text-blue-950" />
                  <span>+ Shift / Leave Request</span>
                </button>
                <button
                  onClick={() => setIsLockModalOpen(true)}
                  className="win-btn text-xs font-bold px-3 py-1 text-slate-900 flex items-center gap-1.5 cursor-pointer"
                  title="Open Operations Override & Impact Summary to lock daily roster in SSOT"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Submit &amp; Lock Roster</span>
                </button>
              </div>
            </div>

            {/* ================================================================= */}
            {/* 3 KPI Cards: ON-SITE TOTAL / SHIFT OPERATIONS / LEAVE & SHORTAGE  */}
            {/* ================================================================= */}
            {(() => {
              const unplannedTotal = Object.values(dailyStaffStatus).filter(s => s.status !== 'PRESENT').length + Object.keys(dailyRestAssignments).length;
              const unreplacedCount = Object.values(dailyStaffStatus).filter(s => s.status !== 'PRESENT' && !s.replacementId).length;
              const activeHeadcount = 13 - unreplacedCount;
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 shrink-0">
                  <div className="border-2 border-slate-400 bg-slate-200 overflow-hidden shadow-xs flex flex-col justify-between">
                    <div className="bg-[#183b6b] text-white font-bold text-xs px-2.5 py-1 text-center tracking-wide uppercase border-b border-slate-400">ON-SITE TOTAL</div>
                    <div className="p-1 space-y-0.5">
                      <div className="flex justify-between items-center px-2.5 py-0.5 border-b border-slate-300 bg-slate-100 text-xs">
                        <span className="text-slate-700 font-medium whitespace-nowrap">Total Headcount</span>
                        <span className="text-slate-900 font-bold font-mono text-right">16 / 19 (84%)</span>
                      </div>
                      <div className="flex justify-between items-center px-2.5 py-0.5 border-b border-slate-300 bg-slate-100 text-xs">
                        <span className="text-slate-700 font-medium whitespace-nowrap">Active Duty</span>
                        <span className={`font-bold font-mono text-right ${unreplacedCount > 0 ? 'text-red-700' : 'text-slate-900'}`}>
                          {activeHeadcount} Personnel {unreplacedCount > 0 ? `(-${unreplacedCount}p)` : ''}
                        </span>
                      </div>
                      <div className="flex justify-between items-center px-2.5 py-0.5 bg-slate-100 text-xs">
                        <span className="text-slate-700 font-medium whitespace-nowrap">ERT Compliance</span>
                        <span className={`font-bold font-mono text-right ${ertSummary.isAllERTMet ? 'text-emerald-800' : 'text-red-700 animate-pulse'}`}>
                          {ertSummary.isAllERTMet ? '16 / 16 (100%)' : '[CRITICAL DEFICIT]'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="border-2 border-slate-400 bg-slate-200 overflow-hidden shadow-xs flex flex-col justify-between">
                    <div className="bg-[#183b6b] text-white font-bold text-xs px-2.5 py-1 text-center tracking-wide uppercase border-b border-slate-400">SHIFT OPERATIONS</div>
                    <div className="p-1 space-y-0.5">
                      <div className="flex justify-between items-center px-2.5 py-0.5 border-b border-slate-300 bg-slate-100 text-xs">
                        <span className="text-slate-700 font-medium whitespace-nowrap">Day Shift (OP)</span>
                        <span className="text-slate-900 font-bold font-mono text-right">TEAM-B (3p) · Asman S.</span>
                      </div>
                      <div className="flex justify-between items-center px-2.5 py-0.5 border-b border-slate-300 bg-slate-100 text-xs">
                        <span className="text-slate-700 font-medium whitespace-nowrap">Night Shift (OP)</span>
                        <span className="text-slate-900 font-bold font-mono text-right">TEAM-C (3p) · Juli S.</span>
                      </div>
                      <div className="flex justify-between items-center px-2.5 py-0.5 bg-slate-100 text-xs">
                        <span className="text-slate-700 font-medium whitespace-nowrap">Day Support</span>
                        <span className="text-slate-900 font-bold font-mono text-right">7 Staff (General)</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-2 border-slate-400 bg-slate-200 overflow-hidden shadow-xs flex flex-col justify-between">
                    <div className="bg-[#183b6b] text-white font-bold text-xs px-2.5 py-1 text-center tracking-wide uppercase border-b border-slate-400">LEAVE &amp; SHORTAGE</div>
                    <div className="p-1 space-y-0.5">
                      <div className="flex justify-between items-center px-2.5 py-0.5 border-b border-slate-300 bg-slate-100 text-xs">
                        <span className="text-slate-700 font-medium whitespace-nowrap">Off-Duty Team</span>
                        <span className="text-slate-900 font-bold font-mono text-right">TEAM-A (3 Standby)</span>
                      </div>
                      <div className="flex justify-between items-center px-2.5 py-0.5 border-b border-slate-300 bg-slate-100 text-xs">
                        <span className="text-slate-700 font-medium whitespace-nowrap">Unplanned Leave</span>
                        <span className={`font-mono font-bold text-right ${unplannedTotal > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
                          {unplannedTotal} Sick / Emergency
                        </span>
                      </div>
                      <div className="flex justify-between items-center px-2.5 py-0.5 bg-slate-100 text-xs">
                        <span className="text-slate-700 font-medium whitespace-nowrap">Manning Status</span>
                        <span className="font-mono font-bold text-right">
                          {unreplacedCount > 0 ? (
                            <span className="text-red-700 font-black">Deficit Alert (-{unreplacedCount}p)</span>
                          ) : unplannedTotal > 0 ? (
                            <span className="text-emerald-800 font-bold">Covered (0 Deficit)</span>
                          ) : (
                            <span className="text-slate-900 font-bold">Normal (0 Deficit)</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ================================================================= */}
            {/* 7-DAY ROLLING RISK HORIZON (scoped exclusively to Daily Board tab) */}
            {/* ================================================================= */}
            <div className="bg-[#334155] border-2 border-t-slate-600 border-l-slate-600 border-r-slate-800 border-b-slate-800 p-1.5 shrink-0 shadow-xs">
              <div className="flex items-center justify-between mb-1 px-1">
                <div className="flex items-center gap-1.5 font-bold text-[11px] text-slate-200 tracking-wide">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span className="uppercase font-mono">7-DAY ROLLING RISK HORIZON (MANNING &amp; ERT REPUTATION GATE)</span>
                </div>
                {/* Inline COD DatePicker + Sync Roster */}
                <div className="flex items-center gap-2">
                  <div className="win-sunken bg-white px-2 py-0.5 border border-slate-500 shadow-inner flex items-center">
                    <input
                      type="date"
                      value={codBaselineDate}
                      onChange={(e) => {
                        setCodBaselineDate(e.target.value);
                        setCodResetToast(`Baseline updated to ${e.target.value}. Roster recalculated.`);
                        setTimeout(() => setCodResetToast(null), 3000);
                      }}
                      className="bg-white text-[#0f172a] font-mono font-extrabold text-[11px] focus:outline-none cursor-pointer"
                      title="Select COD Baseline Date"
                    />
                  </div>
                  <button
                    onClick={handleApplyCodRoster}
                    className="win-btn px-3 py-0.5 text-[11px] font-mono font-extrabold bg-[#e2e8f0] hover:bg-[#cbd5e1] text-[#0f172a] border border-t-white border-l-white border-r-[#64748b] border-b-[#64748b] flex items-center gap-1 cursor-pointer shadow-xs"
                    title="Synchronize and calculate 3:1 roster"
                  >
                    <RotateCcw className="w-3 h-3 text-blue-900 shrink-0" />
                    <span>↺ Sync Roster</span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 font-mono text-[10px]">
                {rolling7Days.map((dayItem) => (
                  <div
                    key={dayItem.dateStr}
                    className={`win-sunken p-1.5 flex flex-col justify-between border ${dayItem.isToday
                      ? 'bg-[#0f172a] border-sky-400 ring-1 ring-sky-400 shadow-md'
                      : 'bg-[#1e293b] border-slate-700'
                      }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-700 pb-0.5 mb-1 bg-[#1e293b] px-1 rounded-xs">
                      <span className="font-bold text-white tracking-tight">{dayItem.dayLabel}</span>
                      {dayItem.isToday && (
                        <span className="px-1 bg-amber-400 text-black font-black text-[8px] rounded-xs">TODAY</span>
                      )}
                    </div>
                    <div className="my-0.5">
                      <span
                        className={`px-1.5 py-0.5 rounded-xs font-black text-[10px] inline-block w-full text-center ${dayItem.status === 'DANGER'
                          ? 'bg-rose-700 text-white animate-pulse'
                          : dayItem.status === 'WARNING'
                            ? 'bg-amber-400 text-black font-black'
                            : 'bg-emerald-600 text-white font-bold'
                          }`}
                      >
                        {dayItem.badgeText}
                      </span>
                    </div>
                    <div className="text-[9px] text-white font-semibold truncate text-center mt-0.5">
                      {dayItem.detailText}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 1. Unified Single Safety & Compliance Gate Bar */}
            <div className={`win-panel p-2 border-2 ${ertSummary.isAllERTMet ? 'border-emerald-800 bg-emerald-50/40' : 'border-red-600 bg-red-50/60'}`}>
              <div
                onClick={() => setIsErtGateExpanded(!isErtGateExpanded)}
                className="flex items-center justify-between flex-wrap gap-2 cursor-pointer select-none hover:opacity-90 transition-opacity"
                title="Click to expand/collapse details"
              >
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900 flex-wrap">
                  <span className="text-emerald-700 font-black">■</span>
                  <span>SAFETY &amp; COMPLIANCE GATE:</span>
                  <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${ertSummary.isAllERTMet ? 'bg-emerald-800 text-white' : 'bg-red-600 text-white animate-pulse'
                    }`}>
                    {ertSummary.isAllERTMet
                      ? `[PASSED] ERT Minimum Manning Cleared ([IC]: ${ertSummary.icCount}/1, [FC]: ${ertSummary.fireChiefCount}/1, [FA]: ${ertSummary.firstAiderCount}/1, [GAS]: ${ertSummary.gasResponseCount}/2)`
                      : `[CRITICAL] ERT Deficit ([IC]: ${ertSummary.icCount}/1, [FC]: ${ertSummary.fireChiefCount}/1, [FA]: ${ertSummary.firstAiderCount}/1, [GAS]: ${ertSummary.gasResponseCount}/2)`}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {isFitToWorkOverridden ? (
                    <span className="px-2.5 py-0.5 text-[10.5px] font-mono font-black rounded bg-emerald-800 text-white border border-emerald-400 flex items-center gap-1.5 shadow-xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-yellow-300" />
                      <span>[OVERRIDDEN (AUDITED)]</span>
                    </span>
                  ) : has154hViolation ? (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsFatigueExpanded(!isFatigueExpanded);
                      }}
                      className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-rose-700 text-white flex items-center gap-1 cursor-pointer shadow-xs hover:bg-rose-800"
                      title="Click to view 154h fatigue details and override"
                    >
                      <AlertTriangle className="w-3 h-3 text-amber-300 animate-pulse" />
                      <span>154h Fatigue Alert: {exceeded154hPersonnel.length} Exceeded (Override Req.)</span>
                    </span>
                  ) : null}

                  {/* Site Manager Override Trigger Button (Method B Backup) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFitToWorkModalOpen(true);
                    }}
                    className="win-btn px-2.5 py-0.5 text-[10px] font-mono font-bold bg-[#183b6b] hover:bg-[#1e4985] text-white border border-blue-400 flex items-center gap-1 cursor-pointer shadow-xs"
                    title="Open ESDM / IMO STCW Fit-to-Work Site Manager Override Modal (SOP-NP07-03)"
                  >
                    <Lock className="w-3 h-3 text-amber-300" />
                    <span>[Site Manager Override]</span>
                  </button>

                  <span className={`px-2 py-0.5 text-[10px] font-mono font-bold border ${ertSummary.isAllERTMet || isFitToWorkOverridden ? 'bg-white border-emerald-600 text-emerald-950' : 'bg-white border-red-600 text-red-900'
                    }`}>
                    {ertSummary.isAllERTMet || isFitToWorkOverridden ? '[OPERATION AUTHORIZED]' : '[OPERATION ON HOLD]'} {isErtGateExpanded ? '▲' : '▾'}
                  </span>
                </div>
              </div>

              {/* ERT Role Specific Headcount Chips (Standard Plant Text Codes) */}
              {isErtGateExpanded && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono mt-2 pt-2 border-t border-slate-300 animate-in fade-in duration-150">
                  {/* 1. Incident Commander */}
                  <div className={`p-1.5 border flex items-center justify-between ${ertSummary.isICMet ? 'bg-white border-emerald-300' : 'bg-red-100 border-red-400 font-bold'}`}>
                    <span className="flex items-center gap-1 text-slate-800 font-bold">
                      <span className="px-1 bg-blue-900 text-white text-[9px] rounded-xs font-mono">[IC]</span>
                      <span>Incident Commander (≥1):</span>
                    </span>
                    <span className={`px-1.5 font-bold ${ertSummary.isICMet ? 'text-emerald-900' : 'text-red-700'}`}>
                      {ertSummary.icCount} / 1 {ertSummary.isICMet ? '[OK]' : '[DEFICIT]'}
                    </span>
                  </div>

                  {/* 2. Fire Chief */}
                  <div className={`p-1.5 border flex items-center justify-between ${ertSummary.isFireChiefMet ? 'bg-white border-emerald-300' : 'bg-red-100 border-red-400 font-bold'}`}>
                    <span className="flex items-center gap-1 text-slate-800 font-bold">
                      <span className="px-1 bg-amber-700 text-white text-[9px] rounded-xs font-mono">[FC]</span>
                      <span>Fire Chief (≥1):</span>
                    </span>
                    <span className={`px-1.5 font-bold ${ertSummary.isFireChiefMet ? 'text-emerald-900' : 'text-red-700'}`}>
                      {ertSummary.fireChiefCount} / 1 {ertSummary.isFireChiefMet ? '[OK]' : '[DEFICIT]'}
                    </span>
                  </div>

                  {/* 3. First Aider */}
                  <div className={`p-1.5 border flex items-center justify-between ${ertSummary.isFirstAiderMet ? 'bg-white border-emerald-300' : 'bg-red-100 border-red-400 font-bold'}`}>
                    <span className="flex items-center gap-1 text-slate-800 font-bold">
                      <span className="px-1 bg-rose-700 text-white text-[9px] rounded-xs font-mono">[FA]</span>
                      <span>First Aiders (≥1):</span>
                    </span>
                    <span className={`px-1.5 font-bold ${ertSummary.isFirstAiderMet ? 'text-emerald-900' : 'text-red-700'}`}>
                      {ertSummary.firstAiderCount} / 1 {ertSummary.isFirstAiderMet ? '[OK]' : '[DEFICIT]'}
                    </span>
                  </div>

                  {/* 4. Gas Leak Response */}
                  <div className={`p-1.5 border flex items-center justify-between ${ertSummary.isGasResponseMet ? 'bg-white border-emerald-300' : 'bg-red-100 border-red-400 font-bold'}`}>
                    <span className="flex items-center gap-1 text-slate-800 font-bold">
                      <span className="px-1 bg-cyan-800 text-white text-[9px] rounded-xs font-mono">[GAS]</span>
                      <span>Gas Response (≥2):</span>
                    </span>
                    <span className={`px-1.5 font-bold ${ertSummary.isGasResponseMet ? 'text-emerald-900' : 'text-red-700'}`}>
                      {ertSummary.gasResponseCount} / 2 {ertSummary.isGasResponseMet ? '[OK]' : '[DEFICIT]'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Shift Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

              {/* Column 1: TEAM-B (Active Day Shift 08:00 - 20:00) */}
              <div className="bg-slate-200 border-2 border-slate-400 shadow-xs p-2 flex flex-col justify-between">
                <div>
                  <div className="bg-[#334155] text-white font-bold text-xs px-2.5 py-1 flex justify-between items-center mb-2 border-b border-slate-700 shadow-2xs">
                    <span className="font-black text-xs flex items-center gap-1.5 text-white tracking-wide">
                      <Clock className="w-3.5 h-3.5 text-yellow-300" />
                      TEAM-B - Day Shift
                    </span>
                    <span className="text-[10px] font-mono bg-white text-slate-900 px-1.5 py-0.5 font-bold">
                      ACTIVE (08:00 - 20:00)
                    </span>
                  </div>

                  {/* Team-level Shortage Alert Banner (Rule 1: 2+ members off-duty) */}
                  {teamBPersonnel.filter((m) => (dailyStaffStatus[m.id]?.status && dailyStaffStatus[m.id]?.status !== 'PRESENT') || !!dailyRestAssignments[m.id]).length >= 2 && (
                    <div className="mb-2 bg-red-100 border-2 border-red-500 p-1.5 text-red-950 font-bold font-mono text-[10px] flex items-center gap-1.5 animate-pulse rounded-xs">
                      <AlertOctagon className="w-4 h-4 text-red-700 shrink-0" />
                      <span>[CRITICAL ALERT] 2+ Personnel Off-Duty in TEAM-B</span>
                    </div>
                  )}

                  {/* Safety Compliance Gate Header */}
                  <div className={`p-1.5 mb-2 border font-mono text-[10px] flex items-center justify-between ${teamBPersonnel.some((m) => getStaffCompetencyStatus(m).hasExpired)
                    ? 'bg-red-100 border-red-400 text-red-950 font-bold'
                    : 'bg-slate-100 border-slate-300 text-slate-900 font-bold'
                    }`}>
                    <span className="flex items-center gap-1">
                      {teamBPersonnel.every((m) => !getStaffCompetencyStatus(m).hasExpired) ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-800" /> : <ShieldAlert className="w-3.5 h-3.5 text-red-700" />}
                      Safety Compliance Gate:
                    </span>
                    <span className={`px-1 rounded text-[9px] ${teamBPersonnel.every((m) => !getStaffCompetencyStatus(m).hasExpired) ? 'bg-emerald-800 text-white' : 'bg-red-600 text-white animate-pulse'
                      }`}>
                      {teamBPersonnel.every((m) => !getStaffCompetencyStatus(m).hasExpired) ? '100% CLEARED' : 'ACTION REQUIRED'}
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    {teamBPersonnel.map((member) => {
                      const memberComp = getStaffCompetencyStatus(member);
                      const memberDaily = dailyStaffStatus[member.id] || { status: 'PRESENT', replacementId: '' };
                      const isLegacyRest = !!dailyRestAssignments[member.id];
                      const legacyAssign = dailyRestAssignments[member.id];
                      const isAbsence = memberDaily.status !== 'PRESENT' || isLegacyRest;
                      const activeReplacementId = memberDaily.replacementId || legacyAssign?.coveringStaffId || '';
                      const replacementStaff = activeReplacementId ? manpowerData.find((s) => s.id === activeReplacementId) : null;
                      const hours14d = get14dHours(member);
                      const is154h = hours14d >= 154;

                      return (
                        <div key={member.id} className="space-y-1">
                          <div
                            className={`${isAbsence
                              ? 'bg-amber-50 border-2 border-amber-400 opacity-90'
                              : 'bg-slate-100 border border-slate-300'
                              } p-1.5`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-bold text-slate-600 uppercase">{member.role}</span>
                                {is154h && !isAbsence && (
                                  <span className="px-1 bg-rose-600 text-white font-bold text-[8px] rounded animate-pulse" title={`${hours14d} hours worked in 14 days`}>
                                    154h Exceeded
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                {/* 3D Sunken Status Select Control */}
                                <select
                                  value={memberDaily.status}
                                  onChange={(e) => handleOperatorStatusChange(member.id, e.target.value as any)}
                                  className={`win-sunken font-mono font-bold text-[9px] px-1 py-0.5 border cursor-pointer ${memberDaily.status === 'SICK'
                                    ? 'bg-rose-100 text-rose-900 border-rose-400 font-black'
                                    : memberDaily.status === 'EMERGENCY'
                                      ? 'bg-amber-100 text-amber-950 border-amber-400 font-black'
                                      : memberDaily.status === 'LEAVE'
                                        ? 'bg-purple-100 text-purple-950 border-purple-400 font-black'
                                        : 'bg-white text-slate-900 border-slate-400'
                                    }`}
                                  title="Change daily attendance / absence status"
                                >
                                  <option value="PRESENT">PRESENT</option>
                                  <option value="SICK">SICK</option>
                                  <option value="EMERGENCY">EMERGENCY</option>
                                  <option value="LEAVE">LEAVE</option>
                                </select>

                                {isAbsence ? (
                                  <span className="px-1.5 py-0.5 bg-amber-500 text-black font-black text-[9px] rounded shadow-xs">
                                    {memberDaily.status !== 'PRESENT' ? memberDaily.status : 'REST'}
                                  </span>
                                ) : memberComp.hasExpired ? (
                                  <button
                                    onClick={() => navigateToMatrix(member.id)}
                                    className="px-1 bg-red-600 text-white font-bold text-[8px] rounded animate-pulse cursor-pointer"
                                    title="Click to open Matrix & approve certification renewal"
                                  >
                                    EXPIRED CERT
                                  </button>
                                ) : memberComp.hasExpiringSoon ? (
                                  <button
                                    onClick={() => navigateToMatrix(member.id)}
                                    className="px-1 bg-amber-500 text-black font-bold text-[8px] rounded cursor-pointer"
                                    title="Click to open Matrix"
                                  >
                                    REFRESH DUE
                                  </button>
                                ) : (
                                  <span className="px-1 bg-emerald-700 text-white font-bold text-[8px] rounded">
                                    CERTIFIED
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className={`text-xs font-bold ${member.role.toLowerCase().includes('leader') ? 'text-blue-950' : 'text-slate-900'} ${isAbsence ? 'line-through text-[#808080] opacity-75' : ''}`}>
                              {member.name}
                            </div>
                            <div className={`text-[10px] font-mono flex justify-between ${isAbsence ? 'text-[#808080]' : 'text-slate-600'}`}>
                              <span>{member.teamName} | Radio: {member.radioChannel}</span>
                              <span className="font-bold text-slate-700">ERT: {member.ertRole}</span>
                            </div>
                          </div>

                          {/* Standby Pool Cover Selection & Swapped In Slot */}
                          {isAbsence && (
                            <div className="win-sunken bg-amber-50/90 border border-amber-400 p-1.5 space-y-1.5 ml-1 rounded-xs">
                              <div className="flex items-center justify-between text-[10px] font-bold text-amber-950">
                                <span className="flex items-center gap-1">
                                  <UserCheck className="w-3.5 h-3.5 text-amber-800" />
                                  <span>[Standby Pool 대체자 지정]</span>
                                </span>
                                <span className={`text-[9px] font-mono font-bold ${replacementStaff ? 'text-emerald-800' : 'text-red-700 animate-pulse'}`}>
                                  {replacementStaff ? 'Cover Assigned ✓' : '대체자 미지정 (Deficit)'}
                                </span>
                              </div>
                              <select
                                value={activeReplacementId}
                                onChange={(e) => handleReplacementChange(member.id, e.target.value)}
                                className="w-full win-sunken bg-white font-mono font-bold text-[10px] px-1.5 py-0.5 border border-slate-400 focus:outline-none cursor-pointer"
                              >
                                <option value="">-- Standby Pool 대체자 선택 (Select Cover) --</option>
                                {standbyPoolCandidates
                                  .filter((c) => c.id !== member.id)
                                  .map((c) => {
                                    const coverHours = get14dHours(c, true);
                                    const isOver154 = coverHours >= 154;
                                    return (
                                      <option key={c.id} value={c.id}>
                                        {c.name} ({c.role} • {c.teamName}) | ERT: {c.ertRole} | 14d: {coverHours}h {isOver154 ? '[⚠️ 154h Risk]' : ''}
                                      </option>
                                    );
                                  })}
                              </select>

                              {/* Swapped In Cover Card */}
                              {replacementStaff && (
                                <div className="bg-emerald-50 border-2 border-emerald-500 p-1.5 rounded-xs shadow-2xs">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                                      <span className="px-1 bg-emerald-700 text-white text-[8px] rounded">SWAPPED IN</span>
                                      <span>{replacementStaff.name} ({replacementStaff.role})</span>
                                    </span>
                                    {get14dHours(replacementStaff, true) >= 154 && (
                                      <span className="px-1 bg-rose-600 text-white font-bold text-[8px] rounded animate-pulse">
                                        154h Exceeded ({get14dHours(replacementStaff, true)}h)
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] font-mono text-emerald-800 flex justify-between mt-0.5">
                                    <span>Radio: {replacementStaff.radioChannel}</span>
                                    <span className="font-bold">ERT: {replacementStaff.ertRole}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-300 text-[11px] font-mono space-y-1">
                  <div className="flex justify-between">
                    <span>Shift Status:</span>
                    <span className="text-emerald-800 font-bold">RUNNING NORMAL</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Active PTW Permits:</span>
                    <span className="font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                      2 Hot Work / 1 Confined
                    </span>
                  </div>
                </div>
              </div>

              {/* Column 2: TEAM-C (Upcoming Night Shift 20:00 - 08:00) */}
              <div className="bg-slate-200 border-2 border-slate-400 shadow-xs p-2 flex flex-col justify-between">
                <div>
                  <div className="bg-[#334155] text-white font-bold text-xs px-2.5 py-1 flex justify-between items-center mb-2 border-b border-slate-700 shadow-2xs">
                    <span className="font-black text-xs flex items-center gap-1.5 text-white tracking-wide">
                      <Clock className="w-3.5 h-3.5 text-yellow-300" />
                      TEAM-C - Night Shift
                    </span>
                    <span className="text-[10px] font-mono bg-white text-slate-900 px-1.5 py-0.5 font-bold">
                      STANDBY (20:00 - 08:00)
                    </span>
                  </div>

                  {/* Team-level Shortage Alert Banner (Rule 1: 2+ members off-duty) */}
                  {teamCPersonnel.filter((m) => (dailyStaffStatus[m.id]?.status && dailyStaffStatus[m.id]?.status !== 'PRESENT') || !!dailyRestAssignments[m.id]).length >= 2 && (
                    <div className="mb-2 bg-red-100 border-2 border-red-500 p-1.5 text-red-950 font-bold font-mono text-[10px] flex items-center gap-1.5 animate-pulse rounded-xs">
                      <AlertOctagon className="w-4 h-4 text-red-700 shrink-0" />
                      <span>[CRITICAL ALERT] 2+ Personnel Off-Duty in TEAM-C</span>
                    </div>
                  )}

                  {/* Safety Compliance Gate Header */}
                  <div className={`p-1.5 mb-2 border font-mono text-[10px] flex items-center justify-between ${teamCPersonnel.some((m) => getStaffCompetencyStatus(m).hasExpired)
                    ? 'bg-red-100 border-red-400 text-red-950 font-bold'
                    : teamCPersonnel.some((m) => getStaffCompetencyStatus(m).hasExpiringSoon)
                      ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold'
                      : 'bg-slate-100 border-slate-300 text-slate-900 font-bold'
                    }`}>
                    <span className="flex items-center gap-1">
                      {teamCPersonnel.every((m) => !getStaffCompetencyStatus(m).hasExpired) ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-800" /> : <ShieldAlert className="w-3.5 h-3.5 text-red-700" />}
                      Safety Compliance Gate:
                    </span>
                    <span className={`px-1 rounded text-[9px] ${teamCPersonnel.every((m) => !getStaffCompetencyStatus(m).hasExpired)
                      ? 'bg-emerald-800 text-white'
                      : 'bg-red-600 text-white animate-pulse'
                      }`}>
                      {teamCPersonnel.every((m) => !getStaffCompetencyStatus(m).hasExpired) ? '100% CLEARED' : 'EXPIRED CERT'}
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    {teamCPersonnel.map((member) => {
                      const memberComp = getStaffCompetencyStatus(member);
                      const memberDaily = dailyStaffStatus[member.id] || { status: 'PRESENT', replacementId: '' };
                      const isLegacyRest = !!dailyRestAssignments[member.id];
                      const legacyAssign = dailyRestAssignments[member.id];
                      const isAbsence = memberDaily.status !== 'PRESENT' || isLegacyRest;
                      const activeReplacementId = memberDaily.replacementId || legacyAssign?.coveringStaffId || '';
                      const replacementStaff = activeReplacementId ? manpowerData.find((s) => s.id === activeReplacementId) : null;
                      const hours14d = get14dHours(member);
                      const is154h = hours14d >= 154;

                      return (
                        <div key={member.id} className="space-y-1">
                          <div
                            className={`${isAbsence
                              ? 'bg-amber-50 border-2 border-amber-400 opacity-90'
                              : 'bg-slate-100 border border-slate-300'
                              } p-1.5`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-bold text-slate-600 uppercase">{member.role}</span>
                                {is154h && !isAbsence && (
                                  <span className="px-1 bg-rose-600 text-white font-bold text-[8px] rounded animate-pulse" title={`${hours14d} hours worked in 14 days`}>
                                    154h Exceeded
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                {/* 3D Sunken Status Select Control */}
                                <select
                                  value={memberDaily.status}
                                  onChange={(e) => handleOperatorStatusChange(member.id, e.target.value as any)}
                                  className={`win-sunken font-mono font-bold text-[9px] px-1 py-0.5 border cursor-pointer ${memberDaily.status === 'SICK'
                                    ? 'bg-rose-100 text-rose-900 border-rose-400 font-black'
                                    : memberDaily.status === 'EMERGENCY'
                                      ? 'bg-amber-100 text-amber-950 border-amber-400 font-black'
                                      : memberDaily.status === 'LEAVE'
                                        ? 'bg-purple-100 text-purple-950 border-purple-400 font-black'
                                        : 'bg-white text-slate-900 border-slate-400'
                                    }`}
                                  title="Change daily attendance / absence status"
                                >
                                  <option value="PRESENT">PRESENT</option>
                                  <option value="SICK">SICK</option>
                                  <option value="EMERGENCY">EMERGENCY</option>
                                  <option value="LEAVE">LEAVE</option>
                                </select>

                                {isAbsence ? (
                                  <span className="px-1.5 py-0.5 bg-amber-500 text-black font-black text-[9px] rounded shadow-xs">
                                    {memberDaily.status !== 'PRESENT' ? memberDaily.status : 'REST'}
                                  </span>
                                ) : memberComp.hasExpired ? (
                                  <button
                                    onClick={() => navigateToMatrix(member.id)}
                                    className="px-1 bg-red-600 text-white font-bold text-[8px] rounded animate-pulse cursor-pointer"
                                    title="Click to open Matrix & approve certification renewal"
                                  >
                                    EXPIRED CERT
                                  </button>
                                ) : memberComp.hasExpiringSoon ? (
                                  <button
                                    onClick={() => navigateToMatrix(member.id)}
                                    className="px-1 bg-amber-500 text-black font-bold text-[8px] rounded cursor-pointer"
                                    title="Click to open Matrix"
                                  >
                                    REFRESH DUE
                                  </button>
                                ) : (
                                  <span className="px-1 bg-emerald-700 text-white font-bold text-[8px] rounded">
                                    CERTIFIED
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className={`text-xs font-bold ${member.role.toLowerCase().includes('leader') ? 'text-purple-950' : 'text-slate-900'} ${isAbsence ? 'line-through text-[#808080] opacity-75' : ''}`}>
                              {member.name}
                            </div>
                            <div className={`text-[10px] font-mono flex justify-between ${isAbsence ? 'text-[#808080]' : 'text-slate-600'}`}>
                              <span>{member.teamName} | Radio: {member.radioChannel}</span>
                              <span className="font-bold text-slate-700">ERT: {member.ertRole}</span>
                            </div>
                          </div>

                          {/* Standby Pool Cover Selection & Swapped In Slot */}
                          {isAbsence && (
                            <div className="win-sunken bg-amber-50/90 border border-amber-400 p-1.5 space-y-1.5 ml-1 rounded-xs">
                              <div className="flex items-center justify-between text-[10px] font-bold text-amber-950">
                                <span className="flex items-center gap-1">
                                  <UserCheck className="w-3.5 h-3.5 text-amber-800" />
                                  <span>[Standby Pool 대체자 지정]</span>
                                </span>
                                <span className={`text-[9px] font-mono font-bold ${replacementStaff ? 'text-emerald-800' : 'text-red-700 animate-pulse'}`}>
                                  {replacementStaff ? 'Cover Assigned ✓' : '대체자 미지정 (Deficit)'}
                                </span>
                              </div>
                              <select
                                value={activeReplacementId}
                                onChange={(e) => handleReplacementChange(member.id, e.target.value)}
                                className="w-full win-sunken bg-white font-mono font-bold text-[10px] px-1.5 py-0.5 border border-slate-400 focus:outline-none cursor-pointer"
                              >
                                <option value="">-- Standby Pool 대체자 선택 (Select Cover) --</option>
                                {standbyPoolCandidates
                                  .filter((c) => c.id !== member.id)
                                  .map((c) => {
                                    const coverHours = get14dHours(c, true);
                                    const isOver154 = coverHours >= 154;
                                    return (
                                      <option key={c.id} value={c.id}>
                                        {c.name} ({c.role} • {c.teamName}) | ERT: {c.ertRole} | 14d: {coverHours}h {isOver154 ? '[⚠️ 154h Risk]' : ''}
                                      </option>
                                    );
                                  })}
                              </select>

                              {/* Swapped In Cover Card */}
                              {replacementStaff && (
                                <div className="bg-emerald-50 border-2 border-emerald-500 p-1.5 rounded-xs shadow-2xs">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                                      <span className="px-1 bg-emerald-700 text-white text-[8px] rounded">SWAPPED IN</span>
                                      <span>{replacementStaff.name} ({replacementStaff.role})</span>
                                    </span>
                                    {get14dHours(replacementStaff, true) >= 154 && (
                                      <span className="px-1 bg-rose-600 text-white font-bold text-[8px] rounded animate-pulse">
                                        154h Exceeded ({get14dHours(replacementStaff, true)}h)
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] font-mono text-emerald-800 flex justify-between mt-0.5">
                                    <span>Radio: {replacementStaff.radioChannel}</span>
                                    <span className="font-bold">ERT: {replacementStaff.ertRole}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-300 text-[11px] font-mono space-y-1">
                  <div className="flex justify-between">
                    <span>Pre-Shift Handover:</span>
                    <span className="text-blue-900 font-bold">Scheduled 19:45 WIB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Night Safety Briefing:</span>
                    <span className="font-bold">Pending Muster</span>
                  </div>
                </div>
              </div>

              {/* Column 3: TEAM-A (Rest / Standby Shift) */}
              <div className="bg-slate-200 border-2 border-slate-400 shadow-xs p-2 flex flex-col justify-between">
                <div>
                  <div className="bg-[#334155] text-white font-bold text-xs px-2.5 py-1 flex justify-between items-center mb-2 border-b border-slate-700 shadow-2xs">
                    <span className="font-black text-xs flex items-center gap-1.5 text-white tracking-wide">
                      <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
                      TEAM-A - Rest / Standby Cycle
                    </span>
                    <span className="text-[10px] font-mono bg-white text-slate-900 px-1.5 py-0.5 font-bold">
                      STANDBY REST
                    </span>
                  </div>

                  {/* Safety Compliance Gate Header */}
                  <div className="p-1.5 mb-2 border border-slate-300 bg-slate-100 font-mono text-[10px] flex items-center justify-between text-slate-800">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-slate-600" />
                      Rest Status:
                    </span>
                    <span className="bg-slate-300 text-slate-800 px-1 rounded text-[9px] font-bold">
                      STANDBY COVER POOL
                    </span>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    {teamAPersonnel.map((member) => {
                      const memberComp = getStaffCompetencyStatus(member);
                      // Check if member is assigned as replacement in dailyStaffStatus or legacy dailyRestAssignments
                      const inlineAssign = Object.entries(dailyStaffStatus).find(([_, st]) => st.status !== 'PRESENT' && st.replacementId === member.id);
                      const legacyAssign = Object.entries(dailyRestAssignments).find(([_, a]) => a.coveringStaffId === member.id);
                      const targetStaffId = inlineAssign ? inlineAssign[0] : legacyAssign ? legacyAssign[0] : null;
                      const replacedStaff = targetStaffId ? manpowerData.find((s) => s.id === targetStaffId) : null;
                      const isCovering = !!targetStaffId;
                      const current14dHours = get14dHours(member, isCovering);
                      const is154h = current14dHours >= 154;

                      return (
                        <div
                          key={member.id}
                          className={`${isCovering
                            ? 'bg-blue-50 border-2 border-blue-500'
                            : 'bg-slate-100 border border-slate-300'
                            } p-1.5`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-bold text-slate-600 uppercase">{member.role}</span>
                              {is154h && (
                                <span className="px-1 bg-rose-600 text-white font-bold text-[8px] rounded animate-pulse" title={`${current14dHours} hours worked in 14 days`}>
                                  154h Exceeded ({current14dHours}h)
                                </span>
                              )}
                            </div>
                            {isCovering ? (
                              <span className="px-1 bg-blue-900 text-white font-bold text-[8px] rounded animate-pulse">
                                COVERING: {replacedStaff?.name ? replacedStaff.name.split(' ')[0] : 'ACTIVE'} ({replacedStaff?.teamName})
                              </span>
                            ) : memberComp.hasExpired ? (
                              <span className="px-1 bg-red-600 text-white font-bold text-[8px] rounded">
                                EXPIRED
                              </span>
                            ) : memberComp.hasExpiringSoon ? (
                              <span className="px-1 bg-amber-500 text-black font-bold text-[8px] rounded">
                                REFRESH
                              </span>
                            ) : (
                              <span className="px-1 bg-emerald-700 text-white font-bold text-[8px] rounded">
                                VALID
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-bold text-slate-900">{member.name}</div>
                          <div className="text-[10px] font-mono text-slate-600 flex justify-between">
                            <span>{member.teamName} | Radio: {member.radioChannel}</span>
                            <span className="font-bold text-slate-700">ERT: {member.ertRole}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-300 text-[11px] font-mono space-y-1">
                  <div className="flex justify-between">
                    <span>Next Shift Call:</span>
                    <span className="text-slate-800 font-bold">Tomorrow 08:00 WIB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>14-Day Limit (154h):</span>
                    {has154hViolation ? (
                      <span className="bg-rose-100 text-rose-900 px-1 py-0.5 border border-rose-300 rounded text-[9px] font-bold">
                        154h Exceeded ({exceeded154hPersonnel.map((s) => {
                          const isCover = Object.values(dailyStaffStatus).some((st) => st.status !== 'PRESENT' && st.replacementId === s.id)
                            || Object.values(dailyRestAssignments).some((assign) => assign.coveringStaffId === s.id);
                          return `${s.name.split(' ')[0]} ${get14dHours(s, isCover)}h`;
                        }).join(', ')})
                      </span>
                    ) : (
                      <span className="text-emerald-800 font-bold">100% (Passed)</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Site Manager Override:</span>
                    <span className={fatigueOverrideApproved ? 'text-emerald-700 font-bold text-[10px]' : has154hViolation ? 'text-rose-700 font-bold text-[10px]' : 'text-slate-500 text-[10px]'}>
                      {fatigueOverrideApproved ? 'AUTHORIZED (EMP-001)' : has154hViolation ? 'REQUIRED TO LOCK' : 'NOT REQUIRED'}
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 4: TRAINING & COMPETENCY MATRIX (With Deep Link & Workflow)       */}
        {/* ===================================================================== */}
        {activeTab === 'TRAINING_MATRIX' && (
          <TrainingMatrixView
            personnelList={filteredPersonnel}
            highlightedEmpId={selectedEmpId}
            onUpdatePersonnelCertification={handleUpdatePersonnelCertification}
          />
        )}

      </div>

      {/* ========================================================================= */}
      {/* 5. Modals & Protocol Interventions                   {/* 5-A: Rule-Based Handover & Delegation Protocol Modal */}
      {handoverModalStaff && (() => {
        const offGoing = handoverModalStaff;
        const candidateList = getEligibleRelieverCandidates(offGoing);
        const selectedCandidate = candidateList.find((c) => c.staff.id === selectedCandidateId)?.staff || candidateList[0]?.staff || null;
        const candidateComp = selectedCandidate ? getStaffCompetencyStatus(selectedCandidate) : null;
        const isBlocked = !selectedCandidate || (candidateComp ? candidateComp.hasExpired : false);

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="win-panel p-6 sm:p-7 max-w-2xl w-full bg-white shadow-2xl border-2 border-blue-950 text-slate-900 font-sans rounded-xl overflow-hidden">

              {/* Header Title */}
              <div className="win-titlebar bg-blue-950 text-white p-3 px-4 flex justify-between items-center rounded-lg mb-4 shadow-sm">
                <span className="font-black text-lg flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-amber-300 shrink-0" />
                  <span>3:1 Rotation Handover Gate & Duty Delegation Protocol</span>
                </span>
                <button
                  onClick={() => setHandoverModalStaff(null)}
                  className="text-white font-black px-2.5 py-1 bg-red-600 hover:bg-red-700 text-xs rounded transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-sm font-sans">

                {/* 1. Off-Going Staff Details */}
                <div className="bg-slate-50 p-4 border border-slate-300 rounded-lg space-y-2 shadow-xs">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                    [Off-Going Personnel Information]
                  </div>
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <span className="text-base font-black text-blue-950">{offGoing.name}</span>
                      <span className="ml-2 text-xs font-bold text-slate-600 font-mono">({offGoing.id})</span>
                    </div>
                    <div className="font-bold text-xs text-blue-950 bg-blue-100 px-3 py-1 border border-blue-300 rounded-md">
                      {normalizePositionTitle(offGoing.role)} • {offGoing.teamName}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs pt-1 text-slate-800 font-mono border-t border-slate-200">
                    <span>On-Site Cumulative: <strong>{calcOnSiteDays(offGoing.cycleStartDate)} / 90 Days</strong></span>
                    <span>Rotation Leave Due: <strong className="text-blue-900">{calcRotationDueDate(offGoing.cycleStartDate)}</strong></span>
                  </div>
                </div>

                {/* 2. Acting & Reliever Candidate Selection Dropdown */}
                <div className="bg-blue-50/70 p-4 border border-blue-200 rounded-lg space-y-2 shadow-xs">
                  <label className="block text-sm font-bold text-blue-950 flex items-center gap-1.5">
                    <UserCog className="w-4 h-4 text-blue-900" />
                    <span>Select Qualified Reliever / Acting Delegate:</span>
                  </label>

                  {candidateList.length > 0 ? (
                    <select
                      value={selectedCandidateId}
                      onChange={(e) => setSelectedCandidateId(e.target.value)}
                      className="w-full h-11 bg-white border-2 border-slate-300 rounded-lg px-3 font-semibold text-slate-900 text-sm focus:border-blue-700 focus:outline-none cursor-pointer"
                    >
                      {candidateList.map((c) => (
                        <option key={c.staff.id} value={c.staff.id}>
                          {c.isPrimary ? '★ [PRIMARY DELEGATE] ' : '• [QUALIFIED POOL] '}
                          {c.label} - {c.staff.id}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-rose-700 font-bold p-2 bg-rose-50 border border-rose-200 rounded text-xs">
                      No matching personnel found in the active roster. Mobilize HQ delegate.
                    </div>
                  )}

                  <div className="text-xs text-slate-600 leading-normal">
                    * Selection applies statutory delegation hierarchy and cross-rotation rules for {offGoing.department}.
                  </div>
                </div>

                {/* 3. Real-Time Competency & Compliance Verification Gate */}
                {selectedCandidate && candidateComp && (
                  <div>
                    {candidateComp.hasExpired ? (
                      <div className="bg-rose-50 border-2 border-rose-400 p-4 rounded-lg space-y-2 shadow-xs">
                        <div className="text-rose-950 font-black text-sm flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <AlertOctagon className="w-4 h-4 text-rose-600 animate-pulse" />
                            [COMPLIANCE GATE DEFICIT] Handover Blocked
                          </span>
                          <span className="bg-rose-600 text-white font-bold px-2 py-0.5 rounded text-xs">
                            UNAUTHORIZED
                          </span>
                        </div>
                        <div className="text-xs text-rose-900 leading-relaxed font-medium">
                          Candidate <strong>{selectedCandidate.name}</strong> holds {candidateComp.expiredCerts.length} expired statutory certification(s):
                        </div>
                        <div className="bg-white p-2 border border-rose-200 rounded space-y-1 text-xs font-mono">
                          {candidateComp.expiredCerts.map((c) => (
                            <div key={c.code} className="text-rose-700 font-bold flex justify-between">
                              <span>• {c.code}: {c.name}</span>
                              <span>(Expired: {c.expiryDate})</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => {
                              navigateToMatrix(selectedCandidate.id);
                              setHandoverModalStaff(null);
                            }}
                            className="text-blue-900 underline font-bold text-xs hover:text-blue-950 cursor-pointer"
                          >
                            Inspect & Approve Certification Renewal in Training Matrix ➔
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border-2 border-emerald-400 p-4 rounded-lg space-y-2 shadow-xs">
                        <div className="text-emerald-950 font-black text-sm flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            [COMPLIANCE GATE CLEARED] 100% Valid Certifications
                          </span>
                          <span className="bg-emerald-800 text-white font-bold px-2.5 py-0.5 rounded text-xs">
                            AUTHORIZED
                          </span>
                        </div>
                        <div className="text-xs text-emerald-900 leading-relaxed font-medium">
                          Candidate <strong>{selectedCandidate.name}</strong> satisfies all mandatory SKK Migas safety leadership, cryogenic, and PTW compliance standards ({candidateComp.validCount} / {candidateComp.totalCount} Valid).
                        </div>
                        {candidateComp.hasExpiringSoon && (
                          <div className="text-xs text-amber-900 bg-amber-50 p-2 border border-amber-200 rounded mt-1 font-mono">
                            Refresher Due Notice: {candidateComp.expiringCerts.map(c => `${c.code} (${c.expiryDate})`).join('; ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Action Buttons */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-300 flex-wrap gap-2">
                  <button
                    onClick={() => {
                      if (selectedCandidate) {
                        navigateToMatrix(selectedCandidate.id);
                        setHandoverModalStaff(null);
                      }
                    }}
                    className="px-2 py-1 text-xs font-bold cursor-pointer text-blue-900 underline hover:text-blue-950"
                  >
                    View in Training Matrix ➔
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setHandoverModalStaff(null)}
                      className="px-5 py-2.5 text-xs font-bold rounded-lg cursor-pointer hover:bg-slate-200 border border-slate-300 text-slate-800 transition-colors"
                    >
                      취소 (Cancel)
                    </button>

                    <button
                      disabled={isBlocked}
                      onClick={() => {
                        if (selectedCandidate) {
                          handleExecuteHandover(offGoing, selectedCandidate);
                        }
                      }}
                      className={`px-6 py-2.5 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 shadow transition-all ${isBlocked
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed border-slate-400'
                        : 'bg-blue-950 text-white hover:bg-blue-900'
                        }`}
                    >
                      <CheckCheck className="w-4 h-4 text-emerald-300" />
                      <span>소장 승인 및 인수인계 확정 (Approve & Authorize)</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>
        );
      })()}

      {/* 5-B: Handover Success Confirmation Banner */}
      {handoverSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white p-3 rounded shadow-2xl border-2 border-emerald-400 font-mono text-xs flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <div>
            <div className="font-bold text-sm">Handover Protocol Authorized</div>
            <div className="text-[11px] text-emerald-100">
              {handoverSuccessToast.offGoingName} ({handoverSuccessToast.roleTitle}) ➔ Reliever: <strong>{handoverSuccessToast.relieverName}</strong>
            </div>
          </div>
          <button
            onClick={() => setHandoverSuccessToast(null)}
            className="ml-2 bg-emerald-950 px-2 py-0.5 font-bold hover:bg-emerald-800 text-white rounded text-[10px]"
          >
            OK
          </button>
        </div>
      )}

      {/* 5-C: Fatigue Limit Exceeded Hard-Lock Modal */}
      {fatigueAlertModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="win-panel p-3 max-w-md w-full bg-white shadow-2xl border-2 border-red-700 text-slate-900 font-sans">
            <div className="win-titlebar bg-red-800 text-white p-1 px-2 flex justify-between items-center mb-2">
              <span className="font-bold text-xs flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-yellow-300" />
                [FATIGUE LIMIT EXCEEDED - Maximum 7 Consecutive Nights]
              </span>
              <button
                onClick={() => setFatigueAlertModal(null)}
                className="text-white font-bold px-1.5 py-0.2 bg-red-600 hover:bg-red-700 text-[10px]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="bg-red-50 p-2 border border-red-300 text-red-950 space-y-1">
                <div className="font-bold text-sm">Hard-Lock Intervention Activated:</div>
                <div>Staff: <strong>{fatigueAlertModal.staffName}</strong> (Day {fatigueAlertModal.dayNum})</div>
                <div className="text-[11px] text-red-900 pt-1">{fatigueAlertModal.violationReason}</div>
              </div>

              <div className="bg-slate-100 p-2 border border-slate-300 text-[10px] text-slate-700">
                <strong>Statutory Regulation:</strong> Under SKK Migas & Indonesian Labor Law, consecutive night shift duty is strictly capped at 7 consecutive cycles without a mandatory 48-hour rest break to prevent cryogenic operational fatigue incidents.
              </div>

              <div className="flex justify-end gap-2 pt-1 border-t border-slate-200">
                <button
                  onClick={() => setFatigueAlertModal(null)}
                  className="win-btn px-4 py-1 text-xs font-bold cursor-pointer bg-red-800 text-white hover:bg-red-900"
                >
                  Acknowledge & Revert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5-D: 예외 휴무 신청서 (Rest Day Request Modal) */}
      {siteManagerApprovalModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="win-panel max-w-xl w-full bg-white shadow-2xl border-2 border-blue-950 text-slate-900 rounded-xl overflow-hidden font-sans">
            {/* Modal Titlebar */}
            <div className="bg-blue-950 text-white px-5 py-3.5 flex justify-between items-center border-b border-blue-800">
              <span className="font-bold text-base sm:text-lg flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-amber-400 shrink-0" />
                <span>예외 휴무 신청서 (Rest Day Request)</span>
              </span>
              <button
                onClick={() => setSiteManagerApprovalModal(null)}
                className="text-white font-bold p-1 px-2.5 bg-slate-800 hover:bg-slate-700 rounded-md text-xs transition-colors cursor-pointer"
                title="Close"
              >
                ✕
              </button>
            </div>

            <div className="p-6 sm:p-7 space-y-5">
              {/* Section 1: Clean Summary Block */}
              <div className="bg-slate-50 border border-slate-300 rounded-lg p-4 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-md border border-slate-200 shadow-xs">
                    <span className="text-xs text-slate-500 font-semibold block mb-0.5">대상자 (Applicant)</span>
                    <div className="text-sm sm:text-base font-bold text-slate-900">
                      {siteManagerApprovalModal.staff.name}
                    </div>
                    <div className="text-xs text-blue-900 font-medium">
                      {normalizePositionTitle(siteManagerApprovalModal.staff.role) || siteManagerApprovalModal.staff.role}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-md border border-slate-200 shadow-xs">
                    <span className="text-xs text-slate-500 font-semibold block mb-0.5">대상일자 (Requested Date)</span>
                    <div className="text-sm sm:text-base font-bold text-slate-900 font-mono">
                      {selectedYear}-{String(selectedMonth).padStart(2, '0')}-{String(siteManagerApprovalModal.dayNum).padStart(2, '0')}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {MONTH_NAMES[selectedMonth - 1]} {siteManagerApprovalModal.dayNum}, {selectedYear}
                    </div>
                  </div>
                </div>

                {/* Section 2: Reason Select Box */}
                <div className="pt-1">
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                    휴무 사유 (Reason)
                  </label>
                  <select
                    value={approvalReason}
                    onChange={(e) => setApprovalReason(e.target.value)}
                    className="w-full h-11 px-3 text-sm font-medium border border-slate-300 rounded-md bg-white shadow-xs focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
                  >
                    <option value="Medical">Medical (진료 / 건강 관리)</option>
                    <option value="Emergency">Emergency (긴급 상황 / 개인 사유)</option>
                    <option value="Special Task">Special Task (특별 업무 조정)</option>
                    <option value="Fatigue">Fatigue (피로도 완화 / 안전 휴식)</option>
                  </select>
                </div>
              </div>

              {/* Section 3: Audit Sign-off Bar */}
              <div className="bg-blue-50/80 p-3 rounded-lg border border-blue-200 text-xs sm:text-sm text-blue-950 flex items-center justify-between flex-wrap gap-2">
                <span>승인 권한: <strong>소장 (Site Manager)</strong></span>
                <span className="text-emerald-700 font-bold flex items-center gap-1.5 text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  소장 승인 로그 자동 기록
                </span>
              </div>

              {/* Section 4: Action Buttons */}
              <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-200">
                <button
                  onClick={() => setSiteManagerApprovalModal(null)}
                  className="win-btn px-5 py-2.5 text-sm font-semibold cursor-pointer hover:bg-slate-200 rounded-md"
                >
                  취소 (Cancel)
                </button>
                <button
                  onClick={handleConfirmSiteManagerApproval}
                  className="win-btn px-6 py-2.5 text-sm font-bold cursor-pointer bg-blue-900 hover:bg-blue-950 text-white flex items-center gap-2 rounded-md shadow-md transition-all"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>소장 승인 및 등록 (Approve & Submit)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5-E: Site Manager Exception Rest Toast Banner */}
      {siteManagerRestToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-950 text-white p-3.5 rounded-lg shadow-2xl border-2 border-sky-400 font-mono text-xs flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-5 h-5 text-sky-300 shrink-0" />
          <div>
            <div className="font-bold text-sm">Site Manager Exception Authorized</div>
            <div className="text-xs text-sky-100">
              Rest Day (R) granted for <strong>{siteManagerRestToast.staffName}</strong> (Day {siteManagerRestToast.dayNum})
            </div>
          </div>
          <button
            onClick={() => setSiteManagerRestToast(null)}
            className="ml-2 bg-blue-900 px-2.5 py-1 font-bold hover:bg-blue-800 text-white rounded text-xs cursor-pointer"
          >
            OK
          </button>
        </div>
      )}

      {/* 5-F: Past Operational Record Read-Only Lock Modal */}
      {pastDateLockModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="win-panel p-4 max-w-lg w-full bg-white shadow-2xl border-2 border-slate-700 text-slate-900 rounded-lg overflow-hidden font-sans">
            <div className="win-titlebar bg-slate-800 text-white p-2 px-3 flex justify-between items-center mb-3">
              <span className="font-bold text-sm sm:text-base flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-300" />
                [RECORD LOCKED: Read-Only Historical Shift]
              </span>
              <button
                onClick={() => setPastDateLockModal(null)}
                className="text-white font-bold px-2 py-0.5 bg-slate-600 hover:bg-slate-700 rounded text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm font-mono p-2">
              <div className="bg-slate-50 p-3.5 border border-slate-300 text-slate-900 space-y-2 rounded">
                <div className="font-bold text-sm sm:text-base text-blue-950 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-slate-700 shrink-0" />
                  <span>Historical Record Locked (소급 수정 불가)</span>
                </div>
                <div className="text-xs sm:text-sm text-slate-700">
                  Target: <strong>{pastDateLockModal.staffName}</strong> ({pastDateLockModal.dateStr})
                </div>
                <div className="text-xs sm:text-sm text-red-900 bg-red-50 p-2.5 border border-red-200 rounded leading-relaxed">
                  과거 근무 실적은 Daily Shift Board에 의해 잠금(Locked) 처리되었습니다. 소급 수정은 관리자(HQ Admin) 승인이 필요합니다.
                </div>
              </div>

              <div className="bg-slate-100 p-2.5 border border-slate-300 text-[11px] text-slate-600 leading-normal rounded">
                <strong>Audit Compliance:</strong> Closed operational logs are permanently archived in the terminal ledger. Any alteration requires an official management change request (MOC) and HQ approval.
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-200">
                <button
                  onClick={() => setPastDateLockModal(null)}
                  className="win-btn px-5 py-2 text-xs sm:text-sm font-bold cursor-pointer bg-slate-800 text-white hover:bg-slate-900 rounded"
                >
                  확인 (Acknowledge)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5-H: Daily Shift Board Rest / Stand-down & Standby Cover Modal */}
      {dailyRestModalOpen && (() => {
        const onDutyCandidates = [...teamBPersonnel, ...teamCPersonnel].filter(m => !dailyRestAssignments[m.id]);
        const standbyCoverCandidates = teamAPersonnel;
        const currentApplicant = manpowerData.find(m => m.id === dailyRestApplicantId);
        const currentCover = manpowerData.find(m => m.id === dailyRestCoverId);
        const coverComp = currentCover ? getStaffCompetencyStatus(currentCover) : null;

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 animate-in fade-in duration-200">
            <div className="win-panel max-w-xl w-full bg-white shadow-2xl border-2 border-blue-950 text-slate-900 rounded-xl overflow-hidden font-sans">
              <div className="bg-blue-950 text-white px-5 py-3.5 flex justify-between items-center border-b border-blue-800">
                <span className="font-bold text-base sm:text-lg flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>예외 휴무 신청 및 대체자 배정 (Daily Rest & Cover)</span>
                </span>
                <button
                  onClick={() => setDailyRestModalOpen(false)}
                  className="text-white font-bold p-1 px-2.5 bg-slate-800 hover:bg-slate-700 rounded text-xs transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 sm:p-7 space-y-4 text-xs sm:text-sm">
                {/* 1. Applicant Selection */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-800">
                    1. 휴무 신청 대상자 (Applicant - Active On-Duty):
                  </label>
                  <select
                    value={dailyRestApplicantId}
                    onChange={(e) => setDailyRestApplicantId(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-300 rounded-md bg-white font-medium cursor-pointer shadow-xs focus:ring-2 focus:ring-blue-500"
                  >
                    {onDutyCandidates.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role} • {m.teamName}) - {m.ertRole} {get14dHours(m) >= 154 ? `[⚠️ ${get14dHours(m)}h/14d]` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Reason Selection */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-800">
                    2. 휴무/비번 사유 (Reason for Stand-down):
                  </label>
                  <select
                    value={dailyRestReason}
                    onChange={(e) => setDailyRestReason(e.target.value as any)}
                    className="w-full h-10 px-3 border border-slate-300 rounded-md bg-white font-medium cursor-pointer shadow-xs focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Medical">Medical (진료 / 건강 이상 및 관찰)</option>
                    <option value="Emergency">Emergency (긴급 상황 / 개인 사유)</option>
                    <option value="Fatigue 154h">Fatigue 154h (14일 누적 154시간 피로도 초과 안전 대기)</option>
                  </select>
                </div>

                {/* 3. Standby Cover Selection */}
                <div className="space-y-1.5 bg-blue-50/70 p-3 rounded-lg border border-blue-200">
                  <label className="block font-bold text-blue-950">
                    3. 비번 대기조 내 대체 투입자 (Standby Cover):
                  </label>
                  <select
                    value={dailyRestCoverId}
                    onChange={(e) => setDailyRestCoverId(e.target.value)}
                    className="w-full h-10 px-3 border border-blue-300 rounded-md bg-white font-medium cursor-pointer shadow-xs focus:ring-2 focus:ring-blue-500"
                  >
                    {standbyCoverCandidates.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role} • {m.teamName}) - ERT: {m.ertRole} (Radio: {m.radioChannel})
                      </option>
                    ))}
                  </select>

                  {currentCover && coverComp && (
                    <div className="text-[11px] pt-1 flex justify-between items-center text-slate-700">
                      <span>ERT Role: <strong>{currentCover.ertRole}</strong></span>
                      <span className={coverComp.hasExpired ? 'text-red-700 font-bold' : 'text-emerald-700 font-bold'}>
                        {coverComp.hasExpired ? 'Expired Cert' : '100% Certified Valid'}
                      </span>
                    </div>
                  )}
                </div>

                {/* 4. Site Manager Verification Checkbox */}
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-300">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-950">
                    <input
                      type="checkbox"
                      checked={dailyRestSmApproved}
                      onChange={(e) => setDailyRestSmApproved(e.target.checked)}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span>소장(Site Manager) 예외 휴무 및 대체자 투입 승인 확인 (EMP-001)</span>
                  </label>
                  <div className="text-[10px] text-amber-900 mt-1 pl-6">
                    승인 즉시 Daily Shift Board에 대체자가 반영되며, ERT 조직 적격성이 자동 재계산됩니다.
                  </div>
                </div>

                {/* 5. Action Buttons */}
                <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-200">
                  <button
                    onClick={() => setDailyRestModalOpen(false)}
                    className="win-btn px-5 py-2 text-sm font-semibold cursor-pointer hover:bg-slate-200 rounded-md"
                  >
                    취소 (Cancel)
                  </button>
                  <button
                    disabled={!dailyRestSmApproved}
                    onClick={handleApplyDailyRestRequest}
                    className={`win-btn px-6 py-2 text-sm font-bold flex items-center gap-2 rounded-md shadow-md transition-all ${!dailyRestSmApproved
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed border-slate-400'
                      : 'bg-blue-900 hover:bg-blue-950 text-white cursor-pointer'
                      }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>승인 및 대체 투입 (Approve &amp; Swap Cover)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 5-I: Daily Rest & Cover Success Toast */}
      {dailyRestSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-950 text-white p-3.5 rounded-lg shadow-2xl border-2 border-emerald-400 font-mono text-xs flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <div>
            <div className="font-bold text-sm">Stand-down &amp; Standby Cover Swapped</div>
            <div className="text-xs text-sky-100">
              {dailyRestSuccessToast.applicantName} (Rest: {dailyRestSuccessToast.reason}) ➔ Cover: <strong>{dailyRestSuccessToast.coverName}</strong>
            </div>
          </div>
          <button
            onClick={() => setDailyRestSuccessToast(null)}
            className="ml-2 bg-blue-900 px-2.5 py-1 font-bold hover:bg-blue-800 text-white rounded text-xs cursor-pointer"
          >
            OK
          </button>
        </div>
      )}

      {/* 5-J: Pre-Shift Handover & Safety Delegation Protocol Modal Window */}
      {isHandoverProtocolModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
          <div className="bg-white border-2 border-slate-700 shadow-2xl rounded-sm w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col font-sans">
            {/* Modal Titlebar */}
            <div className="bg-[#0f2d59] text-white px-3 py-2 flex items-center justify-between border-b border-[#1b437c]">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm tracking-wide">
                  Pre-Shift Handover &amp; Safety Delegation Protocol (SOP NP07-03)
                </span>
              </div>
              <button
                onClick={() => setIsHandoverProtocolModalOpen(false)}
                className="text-white hover:text-rose-300 font-bold text-sm px-2 cursor-pointer"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {/* Header Status Bar */}
              <div className="bg-slate-100 border border-slate-300 p-2.5 rounded flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">Shift Target:</span>
                  <span className="font-mono bg-blue-900 text-white px-2 py-0.5 rounded text-[11px] font-bold">
                    DAY SHIFT (TEAM-B) ➔ NIGHT SHIFT (TEAM-C)
                  </span>
                  <span className="text-slate-600 font-mono">Date: 2026-09-01</span>
                </div>
                <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded font-bold font-mono">
                  {handoverSignatures.offGoingSigned && handoverSignatures.incomingSigned && handoverSignatures.smApproved
                    ? '3-Party Handover Verified & Authorized'
                    : 'Handover Pending Sign-Off'}
                </span>
              </div>

              {/* Grid: 5-Point Checklist & Signatures */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left: 5-Point Process & Safety Checklist */}
                <div className="lg:col-span-7 space-y-2 bg-slate-50 p-3 border border-slate-300 rounded">
                  <div className="font-bold text-slate-800 font-mono text-xs border-b border-slate-200 pb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-900" />
                    <span>Process &amp; Safety Shift Handover Checklist:</span>
                  </div>
                  <div className="space-y-2 font-mono text-[11px] pt-1">
                    <label className="flex items-start gap-2 cursor-pointer select-none bg-white p-2 border border-slate-200 rounded">
                      <input
                        type="checkbox"
                        checked={handoverChecklist.bogNormal}
                        onChange={(e) => setHandoverChecklist(prev => ({ ...prev, bogNormal: e.target.checked }))}
                        className="cursor-pointer accent-blue-900 mt-0.5"
                      />
                      <span className={handoverChecklist.bogNormal ? 'text-slate-900 font-semibold' : 'text-slate-500'}>
                        1. Cryogenic BOG Header Pressure Normal (&lt; 0.25 MPa) &amp; Comp running
                      </span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer select-none bg-white p-2 border border-slate-200 rounded">
                      <input
                        type="checkbox"
                        checked={handoverChecklist.bayStatus}
                        onChange={(e) => setHandoverChecklist(prev => ({ ...prev, bayStatus: e.target.checked }))}
                        className="cursor-pointer accent-blue-900 mt-0.5"
                      />
                      <span className={handoverChecklist.bayStatus ? 'text-slate-900 font-semibold' : 'text-slate-500'}>
                        2. Loading Bay 01 &amp; 02 Vaporizer Operational Status &amp; Mass Balance Verified
                      </span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer select-none bg-white p-2 border border-slate-200 rounded">
                      <input
                        type="checkbox"
                        checked={handoverChecklist.ptwReviewed}
                        onChange={(e) => setHandoverChecklist(prev => ({ ...prev, ptwReviewed: e.target.checked }))}
                        className="cursor-pointer accent-blue-900 mt-0.5"
                      />
                      <span className={handoverChecklist.ptwReviewed ? 'text-slate-900 font-semibold' : 'text-slate-500'}>
                        3. Active PTW Permits (2 Hot Work / 1 Confined) Handover Reviewed
                      </span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer select-none bg-white p-2 border border-slate-200 rounded">
                      <input
                        type="checkbox"
                        checked={handoverChecklist.ertCleared}
                        onChange={(e) => setHandoverChecklist(prev => ({ ...prev, ertCleared: e.target.checked }))}
                        className="cursor-pointer accent-blue-900 mt-0.5"
                      />
                      <span className={handoverChecklist.ertCleared ? 'text-slate-900 font-semibold' : 'text-slate-500'}>
                        4. ERT Minimum Manning Cleared (Incident Commander, Fire Chief, First Aider, Gas Response)
                      </span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer select-none bg-white p-2 border border-slate-200 rounded">
                      <input
                        type="checkbox"
                        checked={handoverChecklist.esdArmed}
                        onChange={(e) => setHandoverChecklist(prev => ({ ...prev, esdArmed: e.target.checked }))}
                        className="cursor-pointer accent-blue-900 mt-0.5"
                      />
                      <span className={handoverChecklist.esdArmed ? 'text-slate-900 font-semibold' : 'text-slate-500'}>
                        5. Plant Emergency Shutdown (ESD) Loops &amp; Gas Detection 100% Armed
                      </span>
                    </label>
                  </div>
                </div>

                {/* Right: Signatures & Delegation */}
                <div className="lg:col-span-5 space-y-3 bg-slate-50 p-3 border border-slate-300 rounded">
                  <div className="font-bold text-slate-800 font-mono text-xs border-b border-slate-200 pb-1 flex justify-between items-center">
                    <span>3-Party Sign-off Authorization:</span>
                  </div>
                  <div className="space-y-2 font-mono text-[11px]">
                    <div className="flex justify-between items-center bg-white p-2.5 border border-slate-200 rounded shadow-2xs">
                      <div>
                        <span className="font-bold text-slate-900">Off-Going (Day TL):</span>
                        <div className="text-slate-600">Asman S. (TEAM-B)</div>
                      </div>
                      <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-bold border border-emerald-300">
                        Signed (19:40 WIB)
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-white p-2.5 border border-slate-200 rounded shadow-2xs">
                      <div>
                        <span className="font-bold text-slate-900">Incoming (Night TL):</span>
                        <div className="text-slate-600">Juli S. (TEAM-C)</div>
                      </div>
                      <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-bold border border-emerald-300">
                        Signed (19:45 WIB)
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-white p-2.5 border border-slate-200 rounded shadow-2xs">
                      <div>
                        <span className="font-bold text-slate-900">Site Manager Gate:</span>
                        <div className="text-slate-600">Ahmad Zarkasih (EMP-001)</div>
                      </div>
                      <span className="bg-blue-100 text-blue-950 px-2 py-0.5 rounded font-bold border border-blue-300">
                        Authorized &amp; Locked
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <button
                      onClick={() => {
                        setIsHandoverProtocolModalOpen(false);
                        handleOpenHandoverModal(manpowerData.find(s => s.id === 'EMP-004') || manpowerData[3]);
                      }}
                      className="w-full win-btn py-1.5 text-xs font-bold text-blue-950 bg-slate-200 hover:bg-slate-300 border border-slate-400 flex items-center justify-center gap-1.5 cursor-pointer rounded"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Open Staff Duty Delegation Gate...</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 px-4 py-2.5 border-t border-slate-300 flex justify-end items-center gap-2">
              <button
                onClick={() => setIsHandoverProtocolModalOpen(false)}
                className="win-btn px-4 py-1 text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 cursor-pointer border border-slate-400 rounded"
              >
                닫기 (Close)
              </button>
              <button
                onClick={() => {
                  setIsHandoverProtocolModalOpen(false);
                }}
                className="win-btn px-5 py-1 text-xs font-bold bg-blue-900 hover:bg-blue-950 text-white cursor-pointer border border-blue-950 rounded flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>체크리스트 저장 및 완료 (Confirm Handover)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5-K: Operations Override & Impact Summary Modal (SSOT Confirmation)        */}
      {/* ========================================================================= */}
      {isLockModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="win-panel p-5 max-w-2xl w-full bg-[#d4d0c8] shadow-2xl border-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] text-slate-900 font-sans">

            {/* Titlebar */}
            <div className="bg-[#183b6b] text-white p-2 px-3 flex justify-between items-center mb-3 shadow-xs">
              <span className="font-bold text-xs flex items-center gap-2 tracking-wide">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>OPERATIONS ROSTER LOCK &amp; IMPACT SUMMARY (2026-09-02)</span>
              </span>
              <button
                onClick={() => setIsLockModalOpen(false)}
                className="text-white font-bold px-2 py-0.5 bg-red-700 hover:bg-red-800 text-xs cursor-pointer rounded-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">

              {/* Section 1: Today's Variations */}
              <div className="win-sunken bg-white p-3 border border-slate-400 space-y-1.5">
                <div className="font-bold text-blue-950 font-mono text-[11px] border-b border-slate-200 pb-1 flex justify-between items-center">
                  <span>[1. 당일 인원 변동 사항 요약 (Today's SSOT Variations)]</span>
                  <span className="text-[10px] font-normal text-slate-600">
                    Total Variations: {Object.keys(dailyStaffStatus).filter((k) => dailyStaffStatus[k].status !== 'PRESENT').length}p
                  </span>
                </div>

                {Object.entries(dailyStaffStatus).filter(([_, s]) => s.status !== 'PRESENT').length === 0 ? (
                  <div className="text-slate-600 italic py-1 font-mono text-[11px]">
                    No unplanned absences recorded today. All scheduled shift personnel marked PRESENT (Standard Muster).
                  </div>
                ) : (
                  <div className="space-y-1.5 pt-1">
                    {Object.entries(dailyStaffStatus)
                      .filter(([_, s]) => s.status !== 'PRESENT')
                      .map(([staffId, s]) => {
                        const staff = manpowerData.find((m) => m.id === staffId);
                        const cover = s.replacementId ? manpowerData.find((m) => m.id === s.replacementId) : null;
                        return (
                          <div key={staffId} className="flex justify-between items-center p-1.5 bg-slate-50 border border-slate-300 font-mono text-[11px]">
                            <div>
                              <span className="font-bold text-slate-900">{staff?.name}</span>
                              <span className="text-slate-500 text-[10px]"> ({staff?.role} • {staff?.teamName})</span>
                              <span className="mx-1.5 font-bold text-rose-700">➔ {s.status}</span>
                            </div>
                            <div>
                              {cover ? (
                                <span className="bg-emerald-100 text-emerald-950 px-2 py-0.5 border border-emerald-300 rounded font-bold text-[10px]">
                                  Cover: {cover.name} ({cover.teamName})
                                </span>
                              ) : (
                                <span className="bg-red-100 text-red-800 px-2 py-0.5 border border-red-300 rounded font-bold text-[10px] animate-pulse">
                                  ⚠️ UNCOVERED SHORTAGE
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Section 2: Monthly Plan Propagation Impact */}
              <div className="win-sunken bg-white p-3 border border-slate-400 space-y-1.5">
                <div className="font-bold text-blue-950 font-mono text-[11px] border-b border-slate-200 pb-1">
                  [2. 월간 플랜(Monthly Plan) 역반영 영향도 분석]
                </div>
                <div className="text-[11px] font-mono text-slate-800 space-y-1 pt-1">
                  <div className="flex items-start gap-1.5">
                    <span className="text-blue-900 font-bold">• Target Date:</span>
                    <span>September 2, 2026 (Monthly Calendar Day 2 Grid Sync)</span>
                  </div>
                  {Object.entries(dailyStaffStatus).filter(([_, s]) => s.status !== 'PRESENT').length === 0 ? (
                    <div className="pl-3 border-l-2 border-slate-300 text-[10.5px] text-slate-500 italic">
                      No status adjustments to propagate. Monthly Plan retains standard shift roster codes.
                    </div>
                  ) : (
                    Object.entries(dailyStaffStatus).filter(([_, s]) => s.status !== 'PRESENT').map(([staffId, s]) => {
                      const staff = manpowerData.find((m) => m.id === staffId);
                      const cover = s.replacementId ? manpowerData.find((m) => m.id === s.replacementId) : null;
                      const coverHours = cover ? get14dHours(cover, true) : 0;
                      return (
                        <div key={staffId} className="pl-3 border-l-2 border-blue-400 text-[10.5px] space-y-0.5">
                          <div>
                            Monthly Plan Day 9/2: <strong>{staff?.name}</strong> shift updated to <span className="px-1 bg-amber-200 text-amber-950 font-bold rounded">Off ({s.status})</span>
                          </div>
                          {cover && (
                            <div>
                              Monthly Plan Day 9/2: <strong>{cover.name}</strong> shift swapped in as <span className="px-1 bg-emerald-200 text-emerald-950 font-bold rounded">{staff?.department === 'OP_BRAVO' ? 'D' : 'N'}</span> (14d Cumulative Hours: <span className={coverHours >= 154 ? 'text-rose-700 font-bold' : 'font-bold'}>{coverHours}h / 154h Limit</span>)
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Section 3: Safety & ERT Compliance Gate Review */}
              <div className="grid grid-cols-2 gap-2 font-mono text-[10.5px]">
                <div className={`p-2 border ${ertSummary.isAllERTMet ? 'bg-emerald-50 border-emerald-400 text-emerald-950' : 'bg-red-50 border-red-400 text-red-950 font-bold'}`}>
                  <div className="font-bold flex items-center justify-between mb-1">
                    <span>ERT Minimum Manning:</span>
                    <span className={`px-1 text-[9px] rounded ${ertSummary.isAllERTMet ? 'bg-emerald-800 text-white' : 'bg-red-600 text-white'}`}>
                      {ertSummary.isAllERTMet ? '[PASSED]' : '[DEFICIT]'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-700">
                    IC: {ertSummary.icCount}/1 | FC: {ertSummary.fireChiefCount}/1 | FA: {ertSummary.firstAiderCount}/1 | Gas: {ertSummary.gasResponseCount}/2
                  </div>
                </div>

                <div className={`p-2 border ${has154hViolation ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold' : 'bg-slate-100 border-slate-300 text-slate-800'}`}>
                  <div className="font-bold flex items-center justify-between mb-1">
                    <span>14-Day Limit (154h):</span>
                    <span className={`px-1 text-[9px] rounded ${has154hViolation ? 'bg-rose-700 text-white' : 'bg-emerald-800 text-white'}`}>
                      {has154hViolation ? '[OVERRIDE REQ.]' : '[PASSED]'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-700">
                    {has154hViolation
                      ? `${exceeded154hPersonnel.map((s) => {
                        const isCover = Object.values(dailyStaffStatus).some((st) => st.status !== 'PRESENT' && st.replacementId === s.id)
                          || Object.values(dailyRestAssignments).some((assign) => assign.coveringStaffId === s.id);
                        return `${s.name.split(' ')[0]} (${get14dHours(s, isCover)}h)`;
                      }).join(', ')}`
                      : 'All Active Personnel ≤ 154h'}
                  </div>
                </div>
              </div>

              {/* Section 4: Site Manager Override & Authorization Checkbox */}
              <div className="win-sunken bg-amber-50/80 p-2.5 border border-amber-300 space-y-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-950 text-xs">
                  <input
                    type="checkbox"
                    checked={lockModalSmApproved}
                    onChange={(e) => setLockModalSmApproved(e.target.checked)}
                    className="w-4 h-4 cursor-pointer accent-blue-900"
                  />
                  <span>Acknowledge Fatigue &amp; Manning Override (Statutory SKK Migas Exemption SOP-NP07-03)</span>
                </label>
                <div className="text-[10px] text-amber-900 pl-6 flex justify-between items-center font-mono">
                  <span>Authorizing Signatory: <strong>Site Manager Edi Hermawan (EMP-001)</strong></span>
                  <span>Status: {lockModalSmApproved ? 'Authorized ✓' : 'Pending Signature'}</span>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-300">
                <button
                  onClick={() => setIsLockModalOpen(false)}
                  className="win-btn px-4 py-1.5 text-xs font-bold text-slate-800 cursor-pointer hover:bg-slate-200"
                >
                  Cancel (Revert Changes)
                </button>
                <button
                  disabled={has154hViolation && !lockModalSmApproved}
                  onClick={handleLockAndPropagateRoster}
                  className={`win-btn px-5 py-1.5 text-xs font-bold flex items-center gap-1.5 ${has154hViolation && !lockModalSmApproved
                    ? 'opacity-50 cursor-not-allowed bg-slate-300 text-slate-600'
                    : 'bg-blue-950 text-white cursor-pointer hover:bg-blue-900'
                    }`}
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Lock Roster &amp; Propagate to Monthly Plan</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5-L: Team Shortage Guardrail Alert Dialog (Rule 1 Modal)                  */}
      {/* ========================================================================= */}
      {teamShortageDialog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="win-panel p-5 max-w-md w-full bg-white shadow-2xl border-2 border-red-700 text-slate-900 font-sans rounded-xs">
            <div className="bg-red-800 text-white p-2 px-3 flex justify-between items-center mb-3">
              <span className="font-bold text-xs flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-amber-300" />
                <span>[CONSTRAINT GUARDRAIL: Team Shortage Alert]</span>
              </span>
              <button
                onClick={() => setTeamShortageDialog(null)}
                className="text-white font-bold px-2 py-0.5 bg-red-950 hover:bg-red-900 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs p-1">
              <div className="bg-red-50 p-3 border border-red-300 text-red-950 rounded-xs space-y-1.5">
                <div className="font-bold text-sm text-red-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-700 shrink-0" />
                  <span>동일 팀 내 다중 결원 발생 (2+ Members Off-Duty)</span>
                </div>
                <div className="text-[11px] leading-relaxed">
                  {teamShortageDialog}
                </div>
              </div>

              <div className="text-[10px] text-slate-600 bg-slate-100 p-2 border border-slate-300 rounded-xs">
                <strong>SOP Standard NP07-03:</strong> An operating shift team must maintain a minimum complement of certified personnel. Immediate standby pool relief deployment is mandatory.
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-200">
                <button
                  onClick={() => setTeamShortageDialog(null)}
                  className="win-btn px-4 py-1 text-xs font-bold cursor-pointer bg-red-800 text-white hover:bg-red-900"
                >
                  Acknowledge &amp; Assign Relief
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5-K2: Fit-to-Work Site Manager Override Modal (ESDM / IMO STCW Exemption) */}
      {/* ========================================================================= */}
      {isFitToWorkModalOpen && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="win-panel p-0 max-w-xl w-full bg-[#d4d0c8] shadow-2xl border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] text-slate-900 font-sans">

            {/* Modal Title Bar */}
            <div className="bg-[#183b6b] text-white p-2 px-3 flex justify-between items-center border-b-2 border-slate-700">
              <span className="font-extrabold text-xs flex items-center gap-1.5 text-white tracking-wide">
                <ShieldAlert className="w-4 h-4 text-amber-300" />
                <span>[ESDM / IMO STCW COMPLIANCE: Fit-to-Work Site Manager Override]</span>
              </span>
              <button
                onClick={() => setIsFitToWorkModalOpen(false)}
                className="text-white font-bold px-2 py-0.5 bg-red-900 hover:bg-red-800 text-xs cursor-pointer border border-red-950"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3 font-mono text-xs">

              {/* Target Personnel Box */}
              <div className="win-sunken bg-slate-900 text-sky-300 p-2.5 border border-slate-700 space-y-1">
                <div className="flex justify-between items-center text-[10.5px] text-slate-300">
                  <span className="font-bold">Subject Personnel (154h Statutory Exemption):</span>
                  <span className="text-amber-400 font-extrabold uppercase">SKK Migas SOP-NP07-03 Sec 4.2</span>
                </div>
                <div className="font-bold text-sm text-white flex items-center gap-2">
                  <span className="text-amber-300">▶</span>
                  <span>
                    {exceeded154hPersonnel.length > 0
                      ? exceeded154hPersonnel.map((s) => `${s.name} (${s.role || 'Operator'})`).join(', ')
                      : 'Danang (Field Operator), Uliyansyah (DCS Control Tech)'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Authority: ESDM SKK Migas Emergency Island Manning &amp; IMO STCW 2010 Rest Hours Exemption Clause
                </div>
              </div>

              {/* ESDM / IMO STCW Compliance Checklist */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
                  <span>■</span>
                  <span>MANDATORY FIT-TO-WORK VERIFICATION CHECKLIST:</span>
                </div>

                <div className="space-y-1.5 text-xs bg-slate-100 p-2.5 border border-slate-300 rounded-xs">
                  {/* Item 1: Vital Signs */}
                  <label className="flex items-start gap-2 cursor-pointer font-bold text-slate-900">
                    <input
                      type="checkbox"
                      checked={fitToWorkVitalsChecked}
                      onChange={(e) => setFitToWorkVitalsChecked(e.target.checked)}
                      className="mt-0.5 w-4 h-4 cursor-pointer accent-blue-900"
                    />
                    <div>
                      <div>생체 징후 적합 (Vital Signs Normal)</div>
                      <div className="text-[10px] text-slate-600 font-normal">
                        Blood Pressure &lt; 140/90 mmHg, Body Temp &lt; 37.5℃, Resting Pulse 60-95 bpm verified.
                      </div>
                    </div>
                  </label>

                  {/* Item 2: Rest Hours */}
                  <label className="flex items-start gap-2 cursor-pointer font-bold text-slate-900">
                    <input
                      type="checkbox"
                      checked={fitToWorkRestChecked}
                      onChange={(e) => setFitToWorkRestChecked(e.target.checked)}
                      className="mt-0.5 w-4 h-4 cursor-pointer accent-blue-900"
                    />
                    <div>
                      <div>최소 수면 시간 확보 (Rest Hours Compliance)</div>
                      <div className="text-[10px] text-slate-600 font-normal">
                        Confirmed minimum 6 hours continuous undisturbed rest period within past 24 hours.
                      </div>
                    </div>
                  </label>

                  {/* Item 3: Drug / Alcohol Fitness */}
                  <label className="flex items-start gap-2 cursor-pointer font-bold text-slate-900">
                    <input
                      type="checkbox"
                      checked={fitToWorkDrugsChecked}
                      onChange={(e) => setFitToWorkDrugsChecked(e.target.checked)}
                      className="mt-0.5 w-4 h-4 cursor-pointer accent-blue-900"
                    />
                    <div>
                      <div>무알코올 / 무약물 적합 (Zero Substance &amp; Fatigue Clearance)</div>
                      <div className="text-[10px] text-slate-600 font-normal">
                        Alcohol Breathalyzer 0.00% verified &amp; zero drowsiness-inducing medication consumed.
                      </div>
                    </div>
                  </label>

                  {/* Item 4: HSSE Officer Field Verification */}
                  <div className="pt-1.5 border-t border-slate-300 flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-slate-900 text-xs">
                      HSSE Officer 현장 확인관:
                    </span>
                    <select
                      value={fitToWorkHsseOfficer}
                      onChange={(e) => setFitToWorkHsseOfficer(e.target.value)}
                      className="win-sunken bg-white p-1 text-xs font-bold text-slate-900 border border-slate-400 cursor-pointer"
                    >
                      <option value="Arsyan AN (HSE Officer)">Arsyan AN (HSE Officer - EMP-015)</option>
                      <option value="Chandra R.D (Sr. HSE Officer / Fire Chief)">Chandra R.D (Sr. HSE Officer / Fire Chief - EMP-016)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Override Justification Textarea */}
              <div className="space-y-1">
                <label className="font-bold text-slate-900 text-xs block">
                  ■ Override Justification &amp; Operational Rationale:
                </label>
                <textarea
                  value={fitToWorkReason}
                  onChange={(e) => setFitToWorkReason(e.target.value)}
                  rows={2}
                  className="w-full win-sunken bg-white p-2 text-xs font-mono font-bold text-[#0f172a] border border-slate-400 focus:outline-none"
                  placeholder="Enter specific operational justification..."
                />
              </div>

              {/* Signatory Authorization Box */}
              <div className="win-sunken bg-amber-50 p-2 border border-amber-300 text-amber-950 text-[11px] flex items-center justify-between">
                <div>
                  <strong>Authorizing Signatory:</strong> Site Manager Edi Hermawan (EMP-001)
                </div>
                <div className="font-mono font-black text-emerald-900">
                  {fitToWorkVitalsChecked && fitToWorkRestChecked && fitToWorkDrugsChecked
                    ? 'READY TO SIGN ✓'
                    : 'CHECKLIST INCOMPLETE ✕'}
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-300">
                <button
                  onClick={() => setIsFitToWorkModalOpen(false)}
                  className="win-btn px-4 py-1.5 text-xs font-bold text-slate-800 cursor-pointer hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  disabled={!fitToWorkVitalsChecked || !fitToWorkRestChecked || !fitToWorkDrugsChecked}
                  onClick={() => {
                    setIsFitToWorkOverridden(true);
                    setIsFitToWorkModalOpen(false);
                    setCodResetToast('✓ [FIT-TO-WORK OVERRIDE] Site Manager Edi Hermawan authorized 154h exemption under SOP-NP07-03. Audit log saved.');
                    setTimeout(() => setCodResetToast(null), 5000);
                  }}
                  className={`win-btn px-5 py-1.5 text-xs font-mono font-black flex items-center gap-1.5 ${!fitToWorkVitalsChecked || !fitToWorkRestChecked || !fitToWorkDrugsChecked
                    ? 'opacity-50 cursor-not-allowed bg-slate-300 text-slate-600'
                    : 'bg-emerald-900 hover:bg-emerald-800 text-white cursor-pointer'
                    }`}
                >
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                  <span>🔒 Authorize Override &amp; Sign</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5-M: COD Simulator Toast Banner                                           */}
      {/* ========================================================================= */}
      {codResetToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0f172a] text-white p-3 px-4 rounded-md shadow-2xl border-2 border-sky-400 font-mono text-xs flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-200 select-none">
          <Zap className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
          <div>
            <div className="font-bold text-sky-200">COD Simulator &amp; 3:1 Roster Engine</div>
            <div className="text-slate-300 text-[11px]">{codResetToast}</div>
          </div>
          <button
            onClick={() => setCodResetToast(null)}
            className="ml-2 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded text-white font-bold text-xs cursor-pointer border border-slate-600"
          >
            OK
          </button>
        </div>
      )}

    </div>
  );
}
