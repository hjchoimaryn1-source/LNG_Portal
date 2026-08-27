// src/components/manpower/ManpowerRosterView.tsx
"use client";

import React, { useState, useMemo } from 'react';
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
  ChevronDown,
} from 'lucide-react';
import { exportToCSV } from '../../utils/exportCsv';

export type ShiftCode = 'D' | 'N' | 'Off' | 'On' | 'AL' | 'O';

export interface StaffPersonnel {
  id: string;
  name: string;
  role: string;
  department: 'MANAGEMENT' | 'OP_ALPHA' | 'OP_BRAVO' | 'OP_CHARLIE' | 'MAINTENANCE' | 'HSSE' | 'LOGISTICS';
  teamName: string;
  currentStatus: 'ON_SITE' | 'OFF_DUTY' | 'MOBILIZING' | 'HANDOVER_PENDING';
  todayShift: ShiftCode;
  onSiteDays: number; // accumulated days on-site in current 3-month cycle (target ~90)
  targetCycleDays: number; // 90
  cycleStartDate: string;
  nextRotationDueDate: string;
  relieverName: string;
  contactNo: string;
  radioChannel: string;
  rosterDays: ShiftCode[]; // 31 days for August 2026
}

const AUGUST_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

// Generate August 2026 Roster Pattern for 3 Operation Teams & Support
function generateRosterPattern(dept: string, indexInDept: number): ShiftCode[] {
  return AUGUST_DAYS.map((day) => {
    // Team Alpha: Days 1-7 D, 8-14 N, 15-21 Off, 22-28 D, 29-31 N
    if (dept === 'OP_ALPHA') {
      const cycleDay = ((day - 1) % 21) + 1;
      if (cycleDay <= 7) return 'D';
      if (cycleDay <= 14) return 'N';
      return 'Off';
    }
    // Team Bravo: Days 1-7 N, 8-14 Off, 15-21 D, 22-28 N, 29-31 Off (Today Day 27: D)
    if (dept === 'OP_BRAVO') {
      const cycleDay = ((day + 6) % 21) + 1;
      if (cycleDay <= 7) return 'D';
      if (cycleDay <= 14) return 'N';
      return 'Off';
    }
    // Team Charlie: Days 1-7 Off, 8-14 D, 15-21 N, 22-28 Off, 29-31 D (Today Day 27: N)
    if (dept === 'OP_CHARLIE') {
      const cycleDay = ((day + 13) % 21) + 1;
      if (cycleDay <= 7) return 'D';
      if (cycleDay <= 14) return 'N';
      return 'Off';
    }
    // Management & General Support: Standard D (Mon-Sat), Off (Sun)
    if (dept === 'MANAGEMENT' || dept === 'LOGISTICS' || dept === 'HSSE' || dept === 'MAINTENANCE') {
      const dayOfWeek = (day + 5) % 7; // Aug 1 2026 was Saturday
      if (dayOfWeek === 1) return 'Off'; // Sunday
      return 'D';
    }
    return 'D';
  });
}

export const MANPOWER_DIRECTORY: StaffPersonnel[] = [
  // 1. Management
  {
    id: 'EMP-001',
    name: 'Edi Hermawan',
    role: 'Site Terminal Manager',
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
    rosterDays: generateRosterPattern('MANAGEMENT', 0),
  },
  {
    id: 'EMP-002',
    name: 'Shadiq M. Shalih',
    role: 'Sr. Operation Leader & Plant Supt',
    department: 'MANAGEMENT',
    teamName: 'Management / Alpha Lead',
    currentStatus: 'ON_SITE',
    todayShift: 'Off',
    onSiteDays: 82,
    targetCycleDays: 90,
    cycleStartDate: '2026-06-07',
    nextRotationDueDate: '2026-09-04',
    relieverName: 'Asman Sampeaman',
    contactNo: '+62 811-6502-3341',
    radioChannel: 'CH-01 (CMD)',
    rosterDays: generateRosterPattern('OP_ALPHA', 0),
  },

  // 2. Operation Team Alpha
  {
    id: 'EMP-003',
    name: 'Yusuf',
    role: 'Cryogenic Field Operator',
    department: 'OP_ALPHA',
    teamName: 'Team Alpha',
    currentStatus: 'ON_SITE',
    todayShift: 'Off',
    onSiteDays: 45,
    targetCycleDays: 90,
    cycleStartDate: '2026-07-14',
    nextRotationDueDate: '2026-10-11',
    relieverName: 'Muradi',
    contactNo: '+62 813-8822-1044',
    radioChannel: 'CH-02 (OPS)',
    rosterDays: generateRosterPattern('OP_ALPHA', 1),
  },
  {
    id: 'EMP-004',
    name: 'Erwin Supriatna',
    role: 'DCS / SCADA Control Technician',
    department: 'OP_ALPHA',
    teamName: 'Team Alpha',
    currentStatus: 'ON_SITE',
    todayShift: 'Off',
    onSiteDays: 77,
    targetCycleDays: 90,
    cycleStartDate: '2026-06-12',
    nextRotationDueDate: '2026-09-09',
    relieverName: 'Ripal Fadiah',
    contactNo: '+62 812-4433-8890',
    radioChannel: 'CH-02 (OPS)',
    rosterDays: generateRosterPattern('OP_ALPHA', 2),
  },

  // 3. Operation Team Bravo (Today: Day Shift)
  {
    id: 'EMP-005',
    name: 'Asman Sampeaman',
    role: 'Shift Operation Leader (Bravo)',
    department: 'OP_BRAVO',
    teamName: 'Team Bravo',
    currentStatus: 'ON_SITE',
    todayShift: 'D',
    onSiteDays: 28,
    targetCycleDays: 90,
    cycleStartDate: '2026-07-31',
    nextRotationDueDate: '2026-10-28',
    relieverName: 'Juli Surungan',
    contactNo: '+62 812-9900-1122',
    radioChannel: 'CH-02 (OPS)',
    rosterDays: generateRosterPattern('OP_BRAVO', 0),
  },
  {
    id: 'EMP-006',
    name: 'Muradi',
    role: 'Cryogenic Bay & Decanting Operator',
    department: 'OP_BRAVO',
    teamName: 'Team Bravo',
    currentStatus: 'ON_SITE',
    todayShift: 'D',
    onSiteDays: 54,
    targetCycleDays: 90,
    cycleStartDate: '2026-07-05',
    nextRotationDueDate: '2026-10-02',
    relieverName: 'Danang',
    contactNo: '+62 813-1122-3344',
    radioChannel: 'CH-02 (OPS)',
    rosterDays: generateRosterPattern('OP_BRAVO', 1),
  },
  {
    id: 'EMP-007',
    name: 'Ripal Fadiah',
    role: 'PRSS & Vaporizer Panel Technician',
    department: 'OP_BRAVO',
    teamName: 'Team Bravo',
    currentStatus: 'ON_SITE',
    todayShift: 'D',
    onSiteDays: 36,
    targetCycleDays: 90,
    cycleStartDate: '2026-07-23',
    nextRotationDueDate: '2026-10-20',
    relieverName: 'Uliyansyah',
    contactNo: '+62 812-3344-5566',
    radioChannel: 'CH-02 (OPS)',
    rosterDays: generateRosterPattern('OP_BRAVO', 2),
  },

  // 4. Operation Team Charlie (Today: Night Shift)
  {
    id: 'EMP-008',
    name: 'Juli Surungan',
    role: 'Shift Operation Leader (Charlie)',
    department: 'OP_CHARLIE',
    teamName: 'Team Charlie',
    currentStatus: 'ON_SITE',
    todayShift: 'N',
    onSiteDays: 15,
    targetCycleDays: 90,
    cycleStartDate: '2026-08-13',
    nextRotationDueDate: '2026-11-10',
    relieverName: 'Shadiq M. Shalih',
    contactNo: '+62 811-7788-9900',
    radioChannel: 'CH-02 (OPS)',
    rosterDays: generateRosterPattern('OP_CHARLIE', 0),
  },
  {
    id: 'EMP-009',
    name: 'Danang',
    role: 'Cryogenic Bay & Decanting Operator',
    department: 'OP_CHARLIE',
    teamName: 'Team Charlie',
    currentStatus: 'ON_SITE',
    todayShift: 'N',
    onSiteDays: 62,
    targetCycleDays: 90,
    cycleStartDate: '2026-06-27',
    nextRotationDueDate: '2026-09-24',
    relieverName: 'Yusuf',
    contactNo: '+62 813-9988-7766',
    radioChannel: 'CH-02 (OPS)',
    rosterDays: generateRosterPattern('OP_CHARLIE', 1),
  },
  {
    id: 'EMP-010',
    name: 'Uliyansyah',
    role: 'DCS / SCADA Control Technician',
    department: 'OP_CHARLIE',
    teamName: 'Team Charlie',
    currentStatus: 'HANDOVER_PENDING',
    todayShift: 'N',
    onSiteDays: 88,
    targetCycleDays: 90,
    cycleStartDate: '2026-06-01',
    nextRotationDueDate: '2026-08-29',
    relieverName: 'Erwin Supriatna',
    contactNo: '+62 812-6655-4433',
    radioChannel: 'CH-02 (OPS)',
    rosterDays: generateRosterPattern('OP_CHARLIE', 2),
  },

  // 5. Maintenance & Engineering
  {
    id: 'EMP-011',
    name: 'Indra',
    role: 'Mechanical Lead Engineer',
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
    rosterDays: generateRosterPattern('MAINTENANCE', 0),
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
    rosterDays: AUGUST_DAYS.map((d) => (d >= 20 ? 'AL' : 'D')),
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
    rosterDays: generateRosterPattern('MAINTENANCE', 2),
  },
  {
    id: 'EMP-014',
    name: 'M. Taufik',
    role: 'Rigger & Cryogenic Valve Mechanic',
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
    rosterDays: AUGUST_DAYS.map((d) => (d >= 15 ? 'AL' : 'D')),
  },

  // 6. HSSE & Safety
  {
    id: 'EMP-015',
    name: 'Arsyan AN',
    role: 'HSSE Plant Safety Officer',
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
    rosterDays: generateRosterPattern('HSSE', 0),
  },
  {
    id: 'EMP-016',
    name: 'Chandra R.D',
    role: 'HSSE Supervisor & Fire Chief',
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
    rosterDays: AUGUST_DAYS.map((d) => (d >= 18 ? 'AL' : 'D')),
  },

  // 7. Logistics, Transport & General Affairs
  {
    id: 'EMP-017',
    name: 'Albert A. Gea',
    role: 'Cryo ISO Tank Inventory Controller',
    department: 'LOGISTICS',
    teamName: 'Logistics',
    currentStatus: 'ON_SITE',
    todayShift: 'D',
    onSiteDays: 55,
    targetCycleDays: 90,
    cycleStartDate: '2026-07-04',
    nextRotationDueDate: '2026-10-01',
    relieverName: 'Jefi R. Zega',
    contactNo: '+62 813-6655-2211',
    radioChannel: 'CH-05 (LOG)',
    rosterDays: generateRosterPattern('LOGISTICS', 0),
  },
  {
    id: 'EMP-018',
    name: 'Jefi R. Zega',
    role: 'HR & Site General Affairs Coordinator',
    department: 'LOGISTICS',
    teamName: 'HR/GA',
    currentStatus: 'ON_SITE',
    todayShift: 'D',
    onSiteDays: 22,
    targetCycleDays: 90,
    cycleStartDate: '2026-08-06',
    nextRotationDueDate: '2026-11-03',
    relieverName: 'Albert A. Gea',
    contactNo: '+62 812-8899-0011',
    radioChannel: 'CH-05 (LOG)',
    rosterDays: generateRosterPattern('LOGISTICS', 1),
  },
  {
    id: 'EMP-019',
    name: 'Buyung',
    role: 'Heavy Prime Mover Driver (ISOT Truck 1)',
    department: 'LOGISTICS',
    teamName: 'Logistics / Transport',
    currentStatus: 'ON_SITE',
    todayShift: 'D',
    onSiteDays: 68,
    targetCycleDays: 90,
    cycleStartDate: '2026-06-21',
    nextRotationDueDate: '2026-09-18',
    relieverName: 'Zulham',
    contactNo: '+62 813-2211-4433',
    radioChannel: 'CH-05 (LOG)',
    rosterDays: generateRosterPattern('LOGISTICS', 2),
  },
  {
    id: 'EMP-020',
    name: 'Zulham',
    role: 'Heavy Prime Mover Driver (ISOT Truck 2)',
    department: 'LOGISTICS',
    teamName: 'Logistics / Transport',
    currentStatus: 'OFF_DUTY',
    todayShift: 'AL',
    onSiteDays: 90,
    targetCycleDays: 90,
    cycleStartDate: '2026-05-26',
    nextRotationDueDate: '2026-08-25',
    relieverName: 'Buyung',
    contactNo: '+62 812-4455-9988',
    radioChannel: 'CH-05 (LOG)',
    rosterDays: AUGUST_DAYS.map((d) => (d >= 10 ? 'AL' : 'D')),
  },
  {
    id: 'EMP-021',
    name: 'Rahmat Hidayat',
    role: 'Super Cargo & Jetty Marine Inspector',
    department: 'LOGISTICS',
    teamName: 'Logistics / Marine',
    currentStatus: 'ON_SITE',
    todayShift: 'D',
    onSiteDays: 30,
    targetCycleDays: 90,
    cycleStartDate: '2026-07-29',
    nextRotationDueDate: '2026-10-26',
    relieverName: 'Port Agent',
    contactNo: '+62 811-3344-5566',
    radioChannel: 'CH-06 (JETTY)',
    rosterDays: generateRosterPattern('LOGISTICS', 3),
  },
  {
    id: 'EMP-022',
    name: 'Ferry Irawan',
    role: '50T Hydraulic Crane Operator',
    department: 'LOGISTICS',
    teamName: 'Logistics / Heavy Lifting',
    currentStatus: 'ON_SITE',
    todayShift: 'D',
    onSiteDays: 72,
    targetCycleDays: 90,
    cycleStartDate: '2026-06-17',
    nextRotationDueDate: '2026-09-14',
    relieverName: 'Subcon Rigger',
    contactNo: '+62 813-7700-1199',
    radioChannel: 'CH-05 (LOG)',
    rosterDays: generateRosterPattern('LOGISTICS', 4),
  },
];

interface ManpowerRosterViewProps {
  initialSubView?: 'MONTHLY_GRID' | 'ROTATION_TRACKER' | 'DAILY_SHIFT_BOARD';
}

export default function ManpowerRosterView({
  initialSubView = 'MONTHLY_GRID',
}: ManpowerRosterViewProps) {
  const [activeTab, setActiveTab] = useState<'MONTHLY_GRID' | 'ROTATION_TRACKER' | 'DAILY_SHIFT_BOARD'>(initialSubView);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Top KPI Metrics
  const totalStaff = MANPOWER_DIRECTORY.length; // 22
  const onSiteCount = MANPOWER_DIRECTORY.filter((m) => m.currentStatus === 'ON_SITE' || m.currentStatus === 'HANDOVER_PENDING').length; // 18
  const offDutyCount = MANPOWER_DIRECTORY.filter((m) => m.currentStatus === 'OFF_DUTY').length; // 4
  const dayShiftCount = MANPOWER_DIRECTORY.filter((m) => m.todayShift === 'D' && (m.currentStatus === 'ON_SITE' || m.currentStatus === 'HANDOVER_PENDING')).length;
  const nightShiftCount = MANPOWER_DIRECTORY.filter((m) => m.todayShift === 'N' && (m.currentStatus === 'ON_SITE' || m.currentStatus === 'HANDOVER_PENDING')).length;

  // Filtered List
  const filteredPersonnel = useMemo(() => {
    return MANPOWER_DIRECTORY.filter((m) => {
      const matchDept = selectedDept === 'ALL' || m.department === selectedDept;
      const matchSearch =
        searchQuery === '' ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.teamName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDept && matchSearch;
    });
  }, [selectedDept, searchQuery]);

  const handleExportCSV = () => {
    const csvData = MANPOWER_DIRECTORY.map((m) => ({
      ID: m.id,
      Name: m.name,
      Role: m.role,
      Team: m.teamName,
      Department: m.department,
      Status: m.currentStatus,
      Today_Shift: m.todayShift,
      OnSite_Days: m.onSiteDays,
      Target_Cycle: `${m.targetCycleDays} Days (3:1)`,
      Cycle_Start: m.cycleStartDate,
      Next_Rotation: m.nextRotationDueDate,
      Reliever: m.relieverName,
      Contact: m.contactNo,
      Radio: m.radioChannel,
    }));
    exportToCSV(csvData, `NIAS_CMMS_Manpower_Roster_August_2026.csv`);
  };

  return (
    <div className="h-full flex flex-col min-h-0 gap-1.5 w-full win-panel p-2 overflow-hidden select-none font-sans text-xs">
      {/* ========================================================================= */}
      {/* 1. Header Title Bar                                                       */}
      {/* ========================================================================= */}
      <div className="win-titlebar px-2 py-1 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 text-white font-bold text-xs">
          <Users className="w-4 h-4" />
          <span>Manpower & Shift Roster - 3:1 Rotation Cycle Management (NIAS CMMS)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="win-btn text-[11px] px-2 py-0.5 flex items-center gap-1 cursor-pointer"
            title="Export Roster to CSV"
          >
            <Download className="w-3 h-3" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Top KPI Summary Metric Cards (4 Cards)                                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-1.5 shrink-0">
        {/* Card 1: On-site Total */}
        <div className="win-panel p-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-700 font-bold text-[11px] mb-1">
            <span className="flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-blue-900" />
              On-Site Active
            </span>
            <span className="win-sunken px-1 text-[9px] bg-emerald-100 text-emerald-950 font-mono font-bold">
              {((onSiteCount / totalStaff) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black font-mono text-blue-950">{onSiteCount}</span>
            <span className="text-xs font-mono text-slate-600">/ {totalStaff} Personnel</span>
          </div>
        </div>

        {/* Card 2: 3:1 Off-Duty Leave */}
        <div className="win-panel p-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-700 font-bold text-[11px] mb-1">
            <span className="flex items-center gap-1">
              <UserX className="w-3.5 h-3.5 text-amber-800" />
              3:1 Off-Duty Leave
            </span>
            <span className="win-sunken px-1 text-[9px] bg-amber-100 text-amber-950 font-mono font-bold">
              Off-Island
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black font-mono text-amber-900">{offDutyCount}</span>
            <span className="text-xs font-mono text-slate-600">Personnel on Leave</span>
          </div>
        </div>

        {/* Card 3: Today Day Shift Team */}
        <div className="win-panel p-2 flex flex-col justify-between bg-blue-50/50">
          <div className="flex items-center justify-between text-slate-800 font-bold text-[11px] mb-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-900" />
              Day Shift (08:00 - 20:00)
            </span>
            <span className="win-sunken px-1 text-[9px] bg-blue-900 text-white font-mono font-bold">
              Team Bravo
            </span>
          </div>
          <div className="flex justify-between items-baseline text-xs font-mono">
            <span className="text-blue-950 font-bold">Asman S. / Muradi / Ripal</span>
            <span className="font-bold text-blue-900">{dayShiftCount} On Duty</span>
          </div>
        </div>

        {/* Card 4: Today Night Shift Team */}
        <div className="win-panel p-2 flex flex-col justify-between bg-purple-50/50">
          <div className="flex items-center justify-between text-slate-800 font-bold text-[11px] mb-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-purple-900" />
              Night Shift (20:00 - 08:00)
            </span>
            <span className="win-sunken px-1 text-[9px] bg-purple-900 text-white font-mono font-bold">
              Team Charlie
            </span>
          </div>
          <div className="flex justify-between items-baseline text-xs font-mono">
            <span className="text-purple-950 font-bold">Juli S. / Danang / Uli</span>
            <span className="font-bold text-purple-900">{nightShiftCount} On Duty</span>
          </div>
        </div>

        {/* Card 5: Standby / Rest Team */}
        <div className="win-panel p-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-700 font-bold text-[11px] mb-1">
            <span className="flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5 text-slate-700" />
              Rest / Standby Team
            </span>
            <span className="win-sunken px-1 text-[9px] bg-slate-200 text-slate-800 font-mono font-bold">
              Team Alpha
            </span>
          </div>
          <div className="text-xs font-mono text-slate-700 truncate font-semibold">
            Shadiq M. / Yusuf / Erwin S.
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. Sub-View Navigation Bar & Filters                                      */}
      {/* ========================================================================= */}
      <div className="bg-[#e4e0d8] border border-slate-300 px-2 py-1 flex items-center justify-between gap-2 flex-wrap shrink-0">
        {/* Left: View Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('MONTHLY_GRID')}
            className={activeTab === 'MONTHLY_GRID' ? 'win-tab-active' : 'win-tab-inactive'}
          >
            <span>Monthly Roster Grid (August 2026)</span>
          </button>

          <button
            onClick={() => setActiveTab('ROTATION_TRACKER')}
            className={activeTab === 'ROTATION_TRACKER' ? 'win-tab-active' : 'win-tab-inactive'}
          >
            <span>3:1 Rotation Cycle Tracker</span>
          </button>

          <button
            onClick={() => setActiveTab('DAILY_SHIFT_BOARD')}
            className={activeTab === 'DAILY_SHIFT_BOARD' ? 'win-tab-active' : 'win-tab-inactive'}
          >
            <span>Daily Shift Board (Alpha / Bravo / Charlie)</span>
          </button>
        </div>

        {/* Right: Department Filter & Search */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-slate-700">Dept:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="win-panel bg-white border border-slate-300 text-xs px-1.5 py-0.5 cursor-pointer font-bold"
            >
              <option value="ALL">All Departments (22)</option>
              <option value="MANAGEMENT">Management (2)</option>
              <option value="OP_ALPHA">Team Alpha (3)</option>
              <option value="OP_BRAVO">Team Bravo (3)</option>
              <option value="OP_CHARLIE">Team Charlie (3)</option>
              <option value="MAINTENANCE">Maintenance (4)</option>
              <option value="HSSE">HSSE Safety (2)</option>
              <option value="LOGISTICS">Logistics & Support (5)</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <Search className="w-3.5 h-3.5 text-slate-600" />
            <input
              type="text"
              placeholder="Search personnel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="win-panel bg-white border border-slate-300 px-2 py-0.5 text-xs w-36 outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MAIN CONTENT AREA (Tab Specific)                                       */}
      {/* ========================================================================= */}
      <div className="flex-1 min-h-0 overflow-y-auto win-sunken bg-white p-1">
        
        {/* ===================================================================== */}
        {/* TAB 1: MONTHLY ROSTER GRID (August 2026 1-31 Spreadsheet View)        */}
        {/* ===================================================================== */}
        {activeTab === 'MONTHLY_GRID' && (
          <div className="overflow-x-auto min-w-full">
            {/* Shift Legend Bar */}
            <div className="bg-slate-100 p-1.5 border-b border-slate-300 flex items-center justify-between text-[11px] mb-1 font-mono flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-800">Shift Codes:</span>
                <span className="inline-flex items-center gap-1">
                  <span className="px-1.5 py-0.2 bg-blue-900 text-white font-bold text-[10px]">D</span> Day Shift (08:00 - 20:00)
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="px-1.5 py-0.2 bg-purple-900 text-white font-bold text-[10px]">N</span> Night Shift (20:00 - 08:00)
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="px-1.5 py-0.2 bg-slate-300 text-slate-800 font-bold text-[10px]">Off</span> Rest / Off Duty
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="px-1.5 py-0.2 bg-amber-500 text-black font-bold text-[10px]">AL</span> 3:1 Annual Leave
                </span>
              </div>
              <div className="text-slate-600 font-bold">
                Today: <span className="bg-yellow-200 px-1 text-black font-bold">Day 27 (2026-08-27)</span>
              </div>
            </div>

            <table className="w-full text-left border-collapse font-mono text-[11px] win-grid">
              <thead>
                <tr className="bg-slate-200 border-b border-slate-400 text-[10px]">
                  <th className="p-1 border-r border-slate-300 w-20">Emp ID</th>
                  <th className="p-1 border-r border-slate-300 w-36">Name</th>
                  <th className="p-1 border-r border-slate-300 w-44">Position / Role</th>
                  <th className="p-1 border-r border-slate-300 w-24">Team</th>
                  <th className="p-1 border-r border-slate-300 text-center w-16">Today</th>
                  {/* Days 1 to 31 */}
                  {AUGUST_DAYS.map((day) => (
                    <th
                      key={day}
                      className={`p-0.5 text-center border-r border-slate-300 min-w-[20px] ${
                        day === 27 ? 'bg-yellow-300 font-black text-black' : ''
                      }`}
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPersonnel.map((m, i) => (
                  <tr
                    key={m.id}
                    className={i % 2 === 0 ? 'bg-white hover:bg-slate-100' : 'bg-slate-50 hover:bg-slate-100'}
                  >
                    <td className="p-1 font-bold text-blue-950 border-r border-slate-300">{m.id}</td>
                    <td className="p-1 font-bold text-slate-900 border-r border-slate-300 whitespace-nowrap">
                      {m.name}
                    </td>
                    <td className="p-1 text-slate-700 border-r border-slate-300 whitespace-nowrap">{m.role}</td>
                    <td className="p-1 border-r border-slate-300 whitespace-nowrap font-semibold">{m.teamName}</td>
                    <td className="p-1 text-center border-r border-slate-300 font-bold">
                      {m.todayShift === 'D' && <span className="bg-blue-900 text-white px-1.5 py-0.2">D</span>}
                      {m.todayShift === 'N' && <span className="bg-purple-900 text-white px-1.5 py-0.2">N</span>}
                      {m.todayShift === 'Off' && <span className="bg-slate-300 text-slate-800 px-1">Off</span>}
                      {m.todayShift === 'AL' && <span className="bg-amber-500 text-black px-1">AL</span>}
                    </td>
                    {/* Render 31 day shift codes */}
                    {m.rosterDays.map((code, dayIdx) => {
                      const dayNum = dayIdx + 1;
                      const isToday = dayNum === 27;
                      return (
                        <td
                          key={dayIdx}
                          className={`p-0.5 text-center border-r border-slate-200 text-[10px] ${
                            isToday ? 'bg-yellow-100 font-bold' : ''
                          }`}
                        >
                          {code === 'D' && <span className="text-blue-900 font-bold">D</span>}
                          {code === 'N' && <span className="text-purple-900 font-bold">N</span>}
                          {code === 'Off' && <span className="text-slate-400">·</span>}
                          {code === 'AL' && <span className="bg-amber-400 text-black px-0.5 font-bold">AL</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: 3:1 ROTATION CYCLE TRACKER (3 Months On / 1 Month Off)         */}
        {/* ===================================================================== */}
        {activeTab === 'ROTATION_TRACKER' && (
          <div className="space-y-2 p-1">
            <div className="bg-blue-50 border border-blue-200 p-2 text-slate-800 text-[11px] font-mono flex items-center justify-between">
              <div>
                <strong>3:1 Rotation Policy:</strong> 3 Months On-site Continuous Operations (approx. 90 days)
                followed by 1 Month Paid Off-Duty Leave (approx. 30 days).
              </div>
              <div className="text-blue-950 font-bold">
                Cycle Progress Overhaul Baseline: August 2026
              </div>
            </div>

            <table className="w-full text-left border-collapse font-mono text-[11px] win-grid">
              <thead>
                <tr className="bg-slate-200 border-b border-slate-400">
                  <th className="p-1.5 border-r border-slate-300">Staff Personnel</th>
                  <th className="p-1.5 border-r border-slate-300">Department / Role</th>
                  <th className="p-1.5 border-r border-slate-300">Current Status</th>
                  <th className="p-1.5 border-r border-slate-300 w-48">On-Site Progress (90 Days Target)</th>
                  <th className="p-1.5 border-r border-slate-300">Cycle Start</th>
                  <th className="p-1.5 border-r border-slate-300">Next Rotation Due</th>
                  <th className="p-1.5 border-r border-slate-300">Designated Reliever</th>
                  <th className="p-1.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPersonnel.map((m, i) => {
                  const pct = Math.min(100, Math.round((m.onSiteDays / m.targetCycleDays) * 100));
                  const isDueSoon = m.onSiteDays >= 75 && m.currentStatus === 'ON_SITE';
                  const isPending = m.currentStatus === 'HANDOVER_PENDING';
                  const isOffDuty = m.currentStatus === 'OFF_DUTY';

                  return (
                    <tr
                      key={m.id}
                      className={i % 2 === 0 ? 'bg-white hover:bg-slate-100' : 'bg-slate-50 hover:bg-slate-100'}
                    >
                      <td className="p-1.5 font-bold border-r border-slate-300">
                        <div className="text-blue-950">{m.name}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{m.id}</div>
                      </td>
                      <td className="p-1.5 border-r border-slate-300">
                        <div className="font-semibold text-slate-900">{m.role}</div>
                        <div className="text-[10px] text-slate-500">{m.teamName}</div>
                      </td>
                      <td className="p-1.5 border-r border-slate-300">
                        {isOffDuty ? (
                          <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 font-bold border border-amber-300">
                            3:1 Leave (Off-Duty)
                          </span>
                        ) : isPending ? (
                          <span className="bg-red-100 text-red-900 px-1.5 py-0.5 font-bold border border-red-300 animate-pulse">
                            Handover Ready (90d)
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-950 px-1.5 py-0.5 font-bold border border-emerald-300">
                            On-Site Active
                          </span>
                        )}
                      </td>
                      {/* Progress Bar */}
                      <td className="p-1.5 border-r border-slate-300">
                        <div className="flex justify-between items-center text-[10px] mb-1">
                          <span className="font-bold">{m.onSiteDays} / 90 Days</span>
                          <span className={pct >= 90 ? 'text-red-700 font-bold' : 'text-slate-700'}>{pct}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2.5 border border-slate-400 overflow-hidden">
                          <div
                            className={`h-full ${
                              isOffDuty
                                ? 'bg-amber-500'
                                : pct >= 90
                                ? 'bg-red-600'
                                : pct >= 75
                                ? 'bg-amber-500'
                                : 'bg-blue-800'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                      <td className="p-1.5 border-r border-slate-300 font-mono text-slate-700">{m.cycleStartDate}</td>
                      <td className="p-1.5 border-r border-slate-300 font-mono font-bold">
                        <span className={isDueSoon || isPending ? 'text-red-800 bg-red-50 px-1 border border-red-200' : 'text-slate-800'}>
                          {m.nextRotationDueDate}
                        </span>
                      </td>
                      <td className="p-1.5 border-r border-slate-300 font-semibold text-slate-800">
                        <div className="flex items-center gap-1">
                          <ArrowRightLeft className="w-3 h-3 text-slate-500" />
                          <span>{m.relieverName}</span>
                        </div>
                      </td>
                      <td className="p-1.5 text-center">
                        <button
                          onClick={() => alert(`Rotation Handover workflow opened for ${m.name} (Reliever: ${m.relieverName})`)}
                          className="win-btn text-[10px] px-2 py-0.5 cursor-pointer font-bold"
                        >
                          Handover
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 3: DAILY SHIFT BOARD (Alpha / Bravo / Charlie Teams)               */}
        {/* ===================================================================== */}
        {activeTab === 'DAILY_SHIFT_BOARD' && (
          <div className="space-y-3 p-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              
              {/* Column 1: Team Bravo (Active Day Shift 08:00 - 20:00) */}
              <div className="win-panel p-2 flex flex-col justify-between border-2 border-blue-900">
                <div>
                  <div className="win-titlebar bg-blue-900 text-white p-1 px-2 flex justify-between items-center mb-2">
                    <span className="font-black text-xs flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-yellow-300" />
                      Team Bravo - Day Shift
                    </span>
                    <span className="text-[10px] font-mono bg-white text-blue-950 px-1 font-bold">
                      ACTIVE (08:00 - 20:00)
                    </span>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    <div className="bg-blue-50 border border-blue-200 p-1.5">
                      <div className="text-[10px] font-bold text-slate-600 uppercase">Shift Leader</div>
                      <div className="text-xs font-bold text-blue-950">Asman Sampeaman</div>
                      <div className="text-[10px] font-mono text-slate-600">Radio: CH-02 (OPS) | +62 812-9900-1122</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-1.5">
                      <div className="text-[10px] font-bold text-slate-600 uppercase">Field Decanting Operator</div>
                      <div className="text-xs font-bold text-slate-900">Muradi</div>
                      <div className="text-[10px] font-mono text-slate-600">Bay 01-04 Active Manifold Patrol</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-1.5">
                      <div className="text-[10px] font-bold text-slate-600 uppercase">DCS / SCADA Panel Tech</div>
                      <div className="text-xs font-bold text-slate-900">Ripal Fadiah</div>
                      <div className="text-[10px] font-mono text-slate-600">Vaporizer & PRSS Telemetry Watch</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-300 text-[11px] font-mono space-y-1">
                  <div className="flex justify-between">
                    <span>Shift Status:</span>
                    <span className="text-emerald-800 font-bold">RUNNING NORMAL</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active PTW Permits:</span>
                    <span className="font-bold">2 Hot Work / 1 Confined</span>
                  </div>
                </div>
              </div>

              {/* Column 2: Team Charlie (Upcoming Night Shift 20:00 - 08:00) */}
              <div className="win-panel p-2 flex flex-col justify-between border-2 border-purple-900">
                <div>
                  <div className="win-titlebar bg-purple-900 text-white p-1 px-2 flex justify-between items-center mb-2">
                    <span className="font-black text-xs flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-yellow-300" />
                      Team Charlie - Night Shift
                    </span>
                    <span className="text-[10px] font-mono bg-white text-purple-950 px-1 font-bold">
                      STANDBY (20:00 - 08:00)
                    </span>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    <div className="bg-purple-50 border border-purple-200 p-1.5">
                      <div className="text-[10px] font-bold text-slate-600 uppercase">Shift Leader</div>
                      <div className="text-xs font-bold text-purple-950">Juli Surungan</div>
                      <div className="text-[10px] font-mono text-slate-600">Radio: CH-02 (OPS) | +62 811-7788-9900</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-1.5">
                      <div className="text-[10px] font-bold text-slate-600 uppercase">Field Decanting Operator</div>
                      <div className="text-xs font-bold text-slate-900">Danang</div>
                      <div className="text-[10px] font-mono text-slate-600">Night Log & Flare Staging Patrol</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-1.5">
                      <div className="text-[10px] font-bold text-slate-600 uppercase">DCS / SCADA Panel Tech</div>
                      <div className="text-xs font-bold text-slate-900">Uliyansyah</div>
                      <div className="text-[10px] font-mono text-slate-600">Night Peak GC Heat Balance</div>
                    </div>
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

              {/* Column 3: Team Alpha (Rest / Off-Duty Shift) */}
              <div className="win-panel p-2 flex flex-col justify-between border border-slate-400">
                <div>
                  <div className="win-titlebar bg-slate-700 text-white p-1 px-2 flex justify-between items-center mb-2">
                    <span className="font-black text-xs flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
                      Team Alpha - Rest Cycle
                    </span>
                    <span className="text-[10px] font-mono bg-white text-slate-950 px-1 font-bold">
                      OFF-DUTY REST
                    </span>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    <div className="bg-slate-50 border border-slate-200 p-1.5">
                      <div className="text-[10px] font-bold text-slate-600 uppercase">Sr. Operation Leader</div>
                      <div className="text-xs font-bold text-slate-900">Shadiq M. Shalih</div>
                      <div className="text-[10px] font-mono text-slate-600">Emergency Standby On-Call</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-1.5">
                      <div className="text-[10px] font-bold text-slate-600 uppercase">Field Operator</div>
                      <div className="text-xs font-bold text-slate-900">Yusuf</div>
                      <div className="text-[10px] font-mono text-slate-600">Dormitory Rest (Camp Nias)</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-1.5">
                      <div className="text-[10px] font-bold text-slate-600 uppercase">DCS / SCADA Panel Tech</div>
                      <div className="text-xs font-bold text-slate-900">Erwin Supriatna</div>
                      <div className="text-[10px] font-mono text-slate-600">Dormitory Rest (Camp Nias)</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-300 text-[11px] font-mono space-y-1">
                  <div className="flex justify-between">
                    <span>Next Shift Call:</span>
                    <span className="text-slate-800 font-bold">Tomorrow 08:00 WIB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fatigue Compliance:</span>
                    <span className="text-emerald-800 font-bold">100% (Passed)</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
