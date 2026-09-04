// src/components/manpower/ManpowerRosterView.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Papa from 'papaparse';
import { CheckCircle2 } from 'lucide-react';
import {
  StaffPersonnel,
  ShiftCode,
  TeamNameStandard,
  CompetencyCertification,
} from '../../types/lng';
import {
  INITIAL_MANPOWER_MASTER_RECORDS,
  generateRosterPattern,
  getStaffCompetencyStatus,
  MONTH_NAMES,
  DEFAULT_CONFIRMED_DAILY_DATES,
  DEFAULT_COD_BASELINE_DATE,
  DEFAULT_FIT_TO_WORK_HSSE_OFFICER,
  DEFAULT_FIT_TO_WORK_REASON,
  DailyRestReason,
} from '../../data/manpowerMasterData';
import {
  normalizePositionTitle,
  calcOnSiteDays,
  calcRotationDueDate,
  calcReturnDueDate,
  get14dHours,
  calculateERTSummary,
  calculateExceeded154hPersonnel,
  checkHas154hViolation,
  calculateRolling7Days,
  getEligibleRelieverCandidates,
  sortRotationPersonnelList,
  resolveStaffMonthlyRoster,
  parseManpowerCsvData,
} from '../../utils/manpowerCalculations';

import MonthlyPlanTab from './tabs/MonthlyPlanTab';
import RotationPlanTab from './tabs/RotationPlanTab';
import DailyBoardTab from './tabs/DailyBoardTab';
import TrainingMatrixTab from './tabs/TrainingMatrixTab';
import SiteManningOverviewTab from './tabs/SiteManningOverviewTab';

import ShiftHandoverModal from './modals/ShiftHandoverModal';
import RotationDelegationModal from './modals/RotationDelegationModal';
import DailyRestCoverModal from './modals/DailyRestCoverModal';
import FitToWorkOverrideModal from './modals/FitToWorkOverrideModal';
import FatigueLimitModal from './modals/FatigueLimitModal';
import ExceptionRestModal from './modals/ExceptionRestModal';
import PastDateLockModal from './modals/PastDateLockModal';
import OperationsOverrideModal from './modals/OperationsOverrideModal';
import TeamShortageModal from './modals/TeamShortageModal';
import CodSimulatorToast from './CodSimulatorToast';

export {
  INITIAL_MANPOWER_MASTER_RECORDS as MANPOWER_DIRECTORY,
  generateRosterPattern,
  normalizePositionTitle,
  calcOnSiteDays,
  calcRotationDueDate,
};
export type { StaffPersonnel, ShiftCode, TeamNameStandard };

type ManpowerTabKey = 'OVERVIEW' | 'MONTHLY_GRID' | 'ROTATION_TRACKER' | 'DAILY_SHIFT_BOARD' | 'TRAINING_MATRIX';

interface ManpowerRosterViewProps {
  initialSubView?: ManpowerTabKey;
  activeTab?: ManpowerTabKey;
  onTabChange?: (tab: ManpowerTabKey) => void;
}

export default function ManpowerRosterView({
  initialSubView = 'OVERVIEW',
  activeTab: controlledTab,
  onTabChange,
}: ManpowerRosterViewProps) {
  const [internalTab, setInternalTab] = useState<ManpowerTabKey>(initialSubView);

  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = useCallback(
    (nextTab: ManpowerTabKey) => {
      if (onTabChange) {
        onTabChange(nextTab);
      } else {
        setInternalTab(nextTab);
      }
    },
    [onTabChange]
  );

  useEffect(() => {
    if (!controlledTab && initialSubView) {
      setInternalTab(initialSubView);
    }
  }, [controlledTab, initialSubView]);

  const [selectedDept] = useState<string>('ALL');
  const [searchQuery] = useState<string>('');
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
  const [confirmedDailyDates, setConfirmedDailyDates] = useState<string[]>(DEFAULT_CONFIRMED_DAILY_DATES);
  const [dailyShiftSavedToast, setDailyShiftSavedToast] = useState<boolean>(false);

  // 7.5. SSOT Daily Staff Status & Standby Replacement State (Tab 3 Inline Controls)
  const [dailyStaffStatus, setDailyStaffStatus] = useState<
    Record<string, { status: 'PRESENT' | 'SICK' | 'EMERGENCY' | 'LEAVE'; replacementId: string }>
  >({});
  const [isLockModalOpen, setIsLockModalOpen] = useState<boolean>(false);
  const [lockModalSmApproved, setLockModalSmApproved] = useState<boolean>(true);
  const [teamShortageDialog, setTeamShortageDialog] = useState<string | null>(null);

  // 7.6. COD Simulator & [3:1] Roster Engine State
  const [codBaselineDate, setCodBaselineDate] = useState<string>(DEFAULT_COD_BASELINE_DATE);
  const [simMode, setSimMode] = useState<'SIMULATION' | 'LIVE'>('SIMULATION');
  const [isCodRosterApplied, setIsCodRosterApplied] = useState<boolean>(true);
  const [codResetToast, setCodResetToast] = useState<string | null>(null);

  // 8. Daily Shift Board (Tab 3) Stand-down / Rest Request & Standby Cover State
  const [dailyRestModalOpen, setDailyRestModalOpen] = useState<boolean>(false);
  const [dailyRestApplicantId, setDailyRestApplicantId] = useState<string>('EMP-005');
  const [dailyRestReason, setDailyRestReason] = useState<DailyRestReason>('Medical');
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
  const [fitToWorkHsseOfficer, setFitToWorkHsseOfficer] = useState<string>(DEFAULT_FIT_TO_WORK_HSSE_OFFICER);
  const [fitToWorkReason, setFitToWorkReason] = useState<string>(DEFAULT_FIT_TO_WORK_REASON);
  const [isFitToWorkOverridden, setIsFitToWorkOverridden] = useState<boolean>(false);

  // 8.5a. Fit-to-Work Authorization Callback (Site Manager 154h Override)
  const handleFitToWorkAuthorize = useCallback(() => {
    setIsFitToWorkOverridden(true);
    setIsFitToWorkModalOpen(false);
    setCodResetToast(
      '✓ [FIT-TO-WORK OVERRIDE] Site Manager Edi Hermawan authorized 154h exemption under SOP-NP07-03. Audit log saved.'
    );
    setTimeout(() => setCodResetToast(null), 5000);
  }, []);

  // 9. Pre-Shift Handover Checklist & Sign-off State for Tab 3
  const [dailyRestSuccessToast, setDailyRestSuccessToast] = useState<{
    applicantName: string;
    coverName: string;
    reason: string;
  } | null>(null);



  // 1. Cross-Tab Deep Link Helper
  const navigateToMatrix = useCallback(
    (empId: string) => {
      setSelectedEmpId(empId);
      setActiveTab('TRAINING_MATRIX');
    },
    [setActiveTab]
  );

  // 2. Real-Time Certification Update & Approval Handler
  const handleUpdatePersonnelCertification = useCallback(
    (empId: string, certCode: string, updatedCert: CompetencyCertification) => {
      setManpowerData((prev) =>
        prev.map((staff) => {
          if (staff.id !== empId) return staff;
          const updatedCompetencies = (staff.competencies || []).map((c) =>
            c.code === certCode ? updatedCert : c
          );
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

  // Cache for staff monthly roster to prevent redundant cyclic calculations
  const rosterCacheRef = React.useRef<Map<string, ShiftCode[]>>(new Map());

  useEffect(() => {
    rosterCacheRef.current.clear();
  }, [selectedYear, selectedMonth, monthOverrides, manpowerData]);

  // Helper to get active roster for staff in (selectedYear, selectedMonth)
  const getStaffRosterForSelectedMonth = useCallback(
    (staff: StaffPersonnel) => {
      const cacheKey = `${staff.id}_${selectedYear}_${selectedMonth}`;
      const cached = rosterCacheRef.current.get(cacheKey);
      if (cached) return cached;
      const roster = resolveStaffMonthlyRoster(staff, selectedYear, selectedMonth, monthOverrides);
      rosterCacheRef.current.set(cacheKey, roster);
      return roster;
    },
    [selectedYear, selectedMonth, monthOverrides]
  );

  // Update Staff Start Date & Recalculate Rotation Timeline
  const handleUpdateStartDate = useCallback((staffId: string, newDateStr: string) => {
    setManpowerData((prev) =>
      prev.map((staff) => {
        if (staff.id !== staffId) return staff;
        const isOffDuty = staff.currentStatus === 'OFF_DUTY';
        const isOp =
          staff.department === 'OP_ALPHA' ||
          staff.department === 'OP_BRAVO' ||
          staff.department === 'OP_CHARLIE' ||
          staff.id === 'EMP-002';
        const cycleDays = isOp ? 42 : staff.targetCycleDays || 90;
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
  const teamAPersonnel = useMemo(
    () => manpowerData.filter((m) => m.department === 'OP_ALPHA' || m.id === 'EMP-002'),
    [manpowerData]
  );
  const standbyPoolCandidates = useMemo(
    () =>
      manpowerData.filter(
        (m) =>
          m.department === 'OP_ALPHA' ||
          m.id === 'EMP-002' ||
          m.todayShift === 'Off' ||
          m.currentStatus === 'OFF_DUTY'
      ),
    [manpowerData]
  );

  // Cumulative 14-Day Hours of Service calculator (wrapped for state binding)
  const get14dHoursCallback = useCallback(
    (staff: StaffPersonnel, isAssignedCoverToday: boolean = false, targetDateStr: string = '2026-09-02') => {
      return get14dHours(staff, isAssignedCoverToday, targetDateStr, {
        simMode,
        isCodRosterApplied,
        codBaselineDate,
      });
    },
    [simMode, isCodRosterApplied, codBaselineDate]
  );

  // Sync Roster Engine — clears month overrides and recomputes every cell algorithmically
  const handleApplyCodRoster = useCallback(() => {
    const clearedOverrides: Record<string, ShiftCode[]> = { ...monthOverrides };
    manpowerData.forEach((staff) => {
      const key = `${staff.id}_${selectedYear}_${selectedMonth}`;
      delete clearedOverrides[key];
    });
    setMonthOverrides(clearedOverrides);

    setIsCodRosterApplied(true);
    setSimMode('SIMULATION');
    setDailyStaffStatus({});
    setDailyRestAssignments({});

    setCodResetToast(
      `✓ Roster Engine synced from ${codBaselineDate}. ` +
        `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear} grid recalculated (10-day D/N rotation applied).`
    );
    setTimeout(() => setCodResetToast(null), 5000);
  }, [codBaselineDate, manpowerData, selectedYear, selectedMonth, monthOverrides]);

  // 3. ERT Manning & Compliance Gate Calculation
  const ertSummary = useMemo(() => {
    return calculateERTSummary(manpowerData, dailyStaffStatus, dailyRestAssignments);
  }, [manpowerData, dailyStaffStatus, dailyRestAssignments]);

  // Active On-Duty Shift Personnel with 154h Fatigue Exceeded (Lazy-evaluated only for Daily Shift Board)
  const exceeded154hPersonnel = useMemo(() => {
    if (activeTab !== 'DAILY_SHIFT_BOARD') return [];
    return calculateExceeded154hPersonnel(
      manpowerData,
      teamBPersonnel,
      teamCPersonnel,
      dailyStaffStatus,
      dailyRestAssignments,
      get14dHoursCallback
    );
  }, [activeTab, manpowerData, teamBPersonnel, teamCPersonnel, dailyStaffStatus, dailyRestAssignments, get14dHoursCallback]);

  const has154hViolation = useMemo(() => checkHas154hViolation(exceeded154hPersonnel), [exceeded154hPersonnel]);

  // 7-Day Rolling Horizon Risk Strip Forecast Calculator (Lazy-evaluated only for Daily Shift Board)
  const rolling7Days = useMemo(() => {
    if (activeTab !== 'DAILY_SHIFT_BOARD') return [];
    return calculateRolling7Days(
      manpowerData,
      dailyStaffStatus,
      ertSummary,
      has154hViolation,
      exceeded154hPersonnel.length,
      getStaffRosterForSelectedMonth,
      codBaselineDate
    );
  }, [
    activeTab,
    manpowerData,
    dailyStaffStatus,
    ertSummary,
    has154hViolation,
    exceeded154hPersonnel.length,
    getStaffRosterForSelectedMonth,
    codBaselineDate,
  ]);

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
    const targetDayIndex = 1; // September 2, 2026

    const newOverrides = { ...monthOverrides };

    manpowerData.forEach((staff) => {
      const staffState = dailyStaffStatus[staff.id];
      if (!staffState) return;

      const key = `${staff.id}_2026_9`;
      const currentRoster = [...(newOverrides[key] || resolveStaffMonthlyRoster(staff, 2026, 9, {}))];

      if (staffState.status !== 'PRESENT') {
        currentRoster[targetDayIndex] = 'Off';
        newOverrides[key] = currentRoster;

        if (staffState.replacementId) {
          const repKey = `${staffState.replacementId}_2026_9`;
          const repStaff = manpowerData.find((m) => m.id === staffState.replacementId);
          if (repStaff) {
            const repRoster = [...(newOverrides[repKey] || resolveStaffMonthlyRoster(repStaff, 2026, 9, {}))];
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
    if (!applicant || !cover || (dailyRestReason === 'Rotation Leave' && !dailyRestCoverId)) return;

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
    updatedRoster[dayIndex] = 'Off';

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

  // Tab 2 Sorted List according to statusSortMode
  const rotationPersonnelList = useMemo(() => {
    return sortRotationPersonnelList(filteredPersonnel, statusSortMode as any);
  }, [filteredPersonnel, statusSortMode]);

  return (
    <div className="h-full w-full flex flex-col min-h-0 overflow-hidden bg-[#d4d0c8] select-none font-sans text-xs">
      {/* 3. MAIN CONTENT AREA */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-[#d4d0c8] p-0">
        {/* TAB 0: OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
          <SiteManningOverviewTab onNavigateTab={(nextTab) => setActiveTab(nextTab)} />
        )}

        {/* TAB 1: MONTHLY PLAN */}
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

        {/* TAB 2: ROTATION TRACKER */}
        {activeTab === 'ROTATION_TRACKER' && (
          <RotationPlanTab
            manpowerData={manpowerData}
            filteredPersonnel={rotationPersonnelList}
            selectedEmpId={selectedEmpId}
            onSelectEmployee={(empId) => setSelectedEmpId(empId)}
            onUpdateStartDate={handleUpdateStartDate}
            onNavigateToMatrix={navigateToMatrix}
          />
        )}

        {/* TAB 3: DAILY SHIFT BOARD */}
        {activeTab === 'DAILY_SHIFT_BOARD' && (
          <DailyBoardTab
            manpowerData={manpowerData}
            dailyStaffStatus={dailyStaffStatus}
            dailyRestAssignments={dailyRestAssignments}
            teamBPersonnel={teamBPersonnel}
            teamCPersonnel={teamCPersonnel}
            teamAPersonnel={teamAPersonnel}
            standbyPoolCandidates={standbyPoolCandidates}
            ertSummary={ertSummary}
            exceeded154hPersonnel={exceeded154hPersonnel}
            has154hViolation={has154hViolation}
            rolling7Days={rolling7Days}
            codBaselineDate={codBaselineDate}
            isErtGateExpanded={isErtGateExpanded}
            isFatigueExpanded={isFatigueExpanded}
            isFitToWorkOverridden={fatigueOverrideApproved || isFitToWorkOverridden}
            onToggleErtGate={() => setIsErtGateExpanded(!isErtGateExpanded)}
            onToggleFatigue={() => setIsFatigueExpanded(!isFatigueExpanded)}
            onOpenHandoverProtocol={() => setIsHandoverProtocolModalOpen(true)}
            onOpenDailyRestModal={handleOpenDailyRestModal}
            onOpenLockModal={() => setIsLockModalOpen(true)}
            onApplyCodRoster={handleApplyCodRoster}
            onSetCodBaselineDate={(nextValue) => {
              setCodBaselineDate(nextValue);
              setCodResetToast(`Baseline updated to ${nextValue}. Roster recalculated.`);
              setTimeout(() => setCodResetToast(null), 3000);
            }}
            onOpenFitToWorkModal={() => setIsFitToWorkModalOpen(true)}
            onOperatorStatusChange={handleOperatorStatusChange}
            onReplacementChange={handleReplacementChange}
            onNavigateToMatrix={navigateToMatrix}
            get14dHours={get14dHoursCallback}
          />
        )}

        {/* TAB 4: TRAINING & COMPETENCY MATRIX */}
        {activeTab === 'TRAINING_MATRIX' && (
          <TrainingMatrixTab
            personnelList={filteredPersonnel}
            highlightedEmpId={selectedEmpId}
            onUpdatePersonnelCertification={handleUpdatePersonnelCertification}
          />
        )}
      </div>

      {/* 5. Modals & Protocol Interventions */}
      {/* 5-A: Rule-Based Handover & Delegation Protocol Modal */}
      {handoverModalStaff && (() => {
        const offGoing = handoverModalStaff;
        const candidateList = getEligibleRelieverCandidates(offGoing, manpowerData);
        const selectedCandidate =
          candidateList.find((c) => c.staff.id === selectedCandidateId)?.staff || candidateList[0]?.staff || null;
        const candidateComp = selectedCandidate ? getStaffCompetencyStatus(selectedCandidate) : null;
        const isBlocked = !selectedCandidate || (candidateComp ? candidateComp.hasExpired : false);

        return (
          <RotationDelegationModal
            offGoing={offGoing}
            candidateList={candidateList}
            selectedCandidateId={selectedCandidateId}
            selectedCandidate={selectedCandidate}
            candidateComp={candidateComp}
            isBlocked={isBlocked}
            onSelectedCandidateChange={setSelectedCandidateId}
            onClose={() => setHandoverModalStaff(null)}
            onNavigateToMatrix={(staffId) => {
              navigateToMatrix(staffId);
              setHandoverModalStaff(null);
            }}
            onExecuteHandover={handleExecuteHandover}
            normalizePositionTitle={normalizePositionTitle}
            calcOnSiteDays={calcOnSiteDays}
            calcRotationDueDate={calcRotationDueDate}
          />
        );
      })()}

      {/* 5-B: Handover Success Confirmation Banner */}
      {handoverSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white p-3 rounded shadow-2xl border-2 border-emerald-400 font-mono text-xs flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <div>
            <div className="font-bold text-sm">Handover Protocol Authorized</div>
            <div className="text-[11px] text-emerald-100">
              {handoverSuccessToast.offGoingName} ({handoverSuccessToast.roleTitle}) ➔ Reliever:{' '}
              <strong>{handoverSuccessToast.relieverName}</strong>
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
      <FatigueLimitModal
        alert={fatigueAlertModal}
        onClose={() => setFatigueAlertModal(null)}
      />

      {/* 5-D: 예외 휴무 신청서 (Rest Day Request Modal) */}
      <ExceptionRestModal
        request={siteManagerApprovalModal}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        approvalReason={approvalReason}
        normalizePositionTitle={normalizePositionTitle}
        onApprovalReasonChange={setApprovalReason}
        onClose={() => setSiteManagerApprovalModal(null)}
        onConfirm={handleConfirmSiteManagerApproval}
      />

      {/* 5-E: Site Manager Exception Rest Toast Banner */}
      {siteManagerRestToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-950 text-white p-3.5 rounded-lg shadow-2xl border-2 border-sky-400 font-mono text-xs flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-5 h-5 text-sky-300 shrink-0" />
          <div>
            <div className="font-bold text-sm">Site Manager Exception Authorized</div>
            <div className="text-xs text-sky-100">
              Rest Day (R) granted for <strong>{siteManagerRestToast.staffName}</strong> (Day{' '}
              {siteManagerRestToast.dayNum})
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
      <PastDateLockModal
        lock={pastDateLockModal}
        onClose={() => setPastDateLockModal(null)}
      />

      {/* 5-H: Daily Shift Board Rest / Stand-down & Standby Cover Modal */}
      <DailyRestCoverModal
        isOpen={dailyRestModalOpen}
        dailyRestApplicantId={dailyRestApplicantId}
        dailyRestReason={dailyRestReason}
        dailyRestCoverId={dailyRestCoverId}
        dailyRestSmApproved={dailyRestSmApproved}
        dailyRestAssignments={dailyRestAssignments}
        manpowerData={manpowerData}
        teamBPersonnel={teamBPersonnel}
        teamCPersonnel={teamCPersonnel}
        teamAPersonnel={teamAPersonnel}
        get14dHours={get14dHoursCallback}
        getStaffCompetencyStatus={getStaffCompetencyStatus}
        onApplicantChange={setDailyRestApplicantId}
        onReasonChange={setDailyRestReason}
        onCoverChange={setDailyRestCoverId}
        onSmApprovedChange={setDailyRestSmApproved}
        onClose={() => setDailyRestModalOpen(false)}
        onApply={handleApplyDailyRestRequest}
      />

      {/* 5-I: Daily Rest & Cover Success Toast */}
      {dailyRestSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-950 text-white p-3.5 rounded-lg shadow-2xl border-2 border-emerald-400 font-mono text-xs flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <div>
            <div className="font-bold text-sm">Stand-down &amp; Standby Cover Swapped</div>
            <div className="text-xs text-sky-100">
              {dailyRestSuccessToast.applicantName} (Rest: {dailyRestSuccessToast.reason}) ➔ Cover:{' '}
              <strong>{dailyRestSuccessToast.coverName}</strong>
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

      {/* Shift Handover Modal */}
      <ShiftHandoverModal
        isOpen={isHandoverProtocolModalOpen}
        onClose={() => setIsHandoverProtocolModalOpen(false)}
        dayShiftLeader={teamBPersonnel.find((member) => /leader/i.test(member.role)) ?? teamBPersonnel[0]}
        nightShiftLeader={teamCPersonnel.find((member) => /leader/i.test(member.role)) ?? teamCPersonnel[0]}
      />

      {/* 5-K: Operations Override & Impact Summary Modal (SSOT Confirmation) */}
      <OperationsOverrideModal
        isOpen={isLockModalOpen}
        dailyStaffStatus={dailyStaffStatus}
        dailyRestAssignments={dailyRestAssignments}
        manpowerData={manpowerData}
        ertSummary={ertSummary}
        exceeded154hPersonnel={exceeded154hPersonnel}
        has154hViolation={has154hViolation}
        get14dHours={get14dHoursCallback}
        lockModalSmApproved={lockModalSmApproved}
        onLockModalSmApprovedChange={setLockModalSmApproved}
        onClose={() => setIsLockModalOpen(false)}
        onLockAndPropagate={handleLockAndPropagateRoster}
      />

      {/* 5-L: Team Shortage Guardrail Alert Dialog */}
      <TeamShortageModal
        message={teamShortageDialog}
        onClose={() => setTeamShortageDialog(null)}
      />

      {/* 5-K2: Fit-to-Work Site Manager Override Modal */}
      <FitToWorkOverrideModal
        isOpen={isFitToWorkModalOpen}
        exceeded154hPersonnel={exceeded154hPersonnel}
        fitToWorkVitalsChecked={fitToWorkVitalsChecked}
        fitToWorkRestChecked={fitToWorkRestChecked}
        fitToWorkDrugsChecked={fitToWorkDrugsChecked}
        fitToWorkHsseOfficer={fitToWorkHsseOfficer}
        fitToWorkReason={fitToWorkReason}
        onVitalsCheckedChange={setFitToWorkVitalsChecked}
        onRestCheckedChange={setFitToWorkRestChecked}
        onDrugsCheckedChange={setFitToWorkDrugsChecked}
        onHsseOfficerChange={setFitToWorkHsseOfficer}
        onReasonChange={setFitToWorkReason}
        onClose={() => setIsFitToWorkModalOpen(false)}
        onAuthorizeOverride={handleFitToWorkAuthorize}
      />

      {/* 5-M: COD Simulator Toast Banner */}
      {codResetToast && (
        <CodSimulatorToast
          message={codResetToast}
          onDismiss={() => setCodResetToast(null)}
        />
      )}
    </div>
  );
}
