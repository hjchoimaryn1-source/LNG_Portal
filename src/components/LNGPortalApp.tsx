// src/components/LNGPortalApp.tsx
"use client";

import React, { useState } from 'react';
import { PortalDataProvider, usePortalData } from '../context/PortalDataContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { SubProcessKey } from '../types/lng';
import { COMPANY_CONFIG, CMMS_MODULES } from '../config/siteConfig';
import SidebarNav from './SidebarNav';
import ArunTerminalView from './locations/ArunTerminalView';
import ArunHeelBogLossView from './locations/arun/ArunHeelBogLossView';
import MvSaviourView from './locations/MvSaviourView';
import NiasTerminalView from './locations/NiasTerminalView';
import NiasOperationalOverviewTab from './locations/nias/NiasOperationalOverviewTab';
import MaintenanceHubView from './MaintenanceHubView';
import DataIngestionHub from './DataIngestionHub';
import GlobalFleetHubView from './GlobalFleetHubView';
import ManpowerRosterView from './manpower/ManpowerRosterView';
import {
  RefreshCw,
  Monitor,
  Loader2,
  Building2,
  Ship,
  MapPin,
  Database,
  Wrench,
  Globe,
  Activity,
  ClipboardList,
  Sliders,
  ShieldCheck,
  Users,
} from 'lucide-react';

const SUBPROCESS_TITLES: Record<
  string,
  { location: string; process: string; icon: React.ReactNode; color: string }
> = {
  MANPOWER_SHIFT_ROSTER: {
    location: 'Work Order & Maintenance',
    process: 'Manpower & Shift Roster (3:1 Rotation Management)',
    icon: <Users className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  MANPOWER_DAILY_SHIFT: {
    location: 'Work Order & Maintenance',
    process: 'Manpower & Shift Roster > Daily Shift Board (Alpha / Bravo / Charlie)',
    icon: <Users className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  MANPOWER_ROTATION_TRACKER: {
    location: 'Work Order & Maintenance',
    process: 'Manpower & Shift Roster > 3:1 Rotation Cycle Tracker',
    icon: <Users className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  MANPOWER_MONTHLY_GRID: {
    location: 'Work Order & Maintenance',
    process: 'Manpower & Shift Roster > Monthly Roster Grid (August 2026 ~)',
    icon: <Users className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  WORK_ORDER_DIRECTORY: {
    location: 'Work Order & Maintenance',
    process: 'Work Order Directory',
    icon: <Sliders className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  PM_SCHEDULES: {
    location: 'Work Order & Maintenance',
    process: 'Preventive Maintenance Schedules',
    icon: <Sliders className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  LNG_PROCESS_OVERVIEW: {
    location: 'LNG-Process',
    process: 'Overview',
    icon: <Activity className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  NIAS_TERMINAL_OVERVIEW: {
    location: 'LNG-Process',
    process: 'Overview',
    icon: <Activity className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  'terminal-overview': {
    location: 'LNG-Process',
    process: 'Overview',
    icon: <Activity className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  ARUN_LOADING_COQ: {
    location: 'LNG-Process',
    process: 'PAGT ( Arun ) > Loading Operations',
    icon: <Building2 className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  ARUN_MASTER_HISTORY: {
    location: 'LNG-Process',
    process: 'PAGT ( Arun ) > Master History Archive',
    icon: <Building2 className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  ARUN_HEEL_BOG_LOSS: {
    location: 'LNG-Process',
    process: 'PAGT ( Arun ) > Heel & BOG Loss',
    icon: <Building2 className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  SAVIOUR_VOYAGE_MONITORING: {
    location: 'LNG-Process',
    process: 'Marine Transit > Voyage Monitoring',
    icon: <Ship className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  SAVIOUR_MARINE_PRESSURE: {
    location: 'LNG-Process',
    process: 'Marine Transit > Marine Pressure Log',
    icon: <Ship className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  NIAS_TANK_OVERVIEW: {
    location: 'LNG-Process',
    process: 'Nias Regas Unit > ISO Tank Management > Overview & Yard Map',
    icon: <Building2 className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  NIAS_LAYDOWN_1_2_LOG: {
    location: 'LNG-Process',
    process: 'Nias Regas Unit > ISO Tank Management > Laydown 1 Log & BOG',
    icon: <MapPin className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  NIAS_ACTIVE_BAY_TANKS: {
    location: 'LNG-Process',
    process: 'Nias Regas Unit > ISO Tank Management > Active Bay Mounted Tanks',
    icon: <Activity className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  NIAS_LAYDOWN_3_HEEL: {
    location: 'LNG-Process',
    process: 'Nias Regas Unit > ISO Tank Management > Laydown 2 (Heel 4%)',
    icon: <MapPin className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  NIAS_GAS_PROCESS_TELEMETRY: {
    location: 'LNG-Process',
    process: 'Nias Regas Unit > Regas & Power > Gas Process Telemetry',
    icon: <Activity className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  NIAS_GC_GAS_QUALITY: {
    location: 'LNG-Process',
    process: 'Nias Regas Unit > Regas & Power > GC Gas Quality Stream',
    icon: <Activity className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  NIAS_PLTMG_POWER_OUTPUT: {
    location: 'LNG-Process',
    process: 'Nias Regas Unit > Regas & Power > PLTMG Power & Output',
    icon: <Activity className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  NIAS_HEAT_SETTLEMENT: {
    location: 'LNG-Process',
    process: 'Nias Regas Unit > Regas & Power > Custody Heat Settlement',
    icon: <Activity className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  MAINTENANCE_MRO_HUB: {
    location: 'LNG-Process',
    process: 'Maintenance & Depot',
    icon: <Wrench className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  GLOBAL_FLEET_HUB: {
    location: 'Equipment & Asset Registry',
    process: 'Global 120-Fleet Hub',
    icon: <Globe className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  DATA_INGESTION_HUB: {
    location: 'Equipment & Asset Registry',
    process: 'CSV Ingestion Hub',
    icon: <Database className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  EQUIPMENT_ASSET_REGISTRY: {
    location: 'Equipment & Asset Registry',
    process: 'All Assets Directory',
    icon: <ClipboardList className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  WORK_ORDER_MAINTENANCE: {
    location: 'Work Order & Maintenance',
    process: 'PMS Preventive Maintenance Ledger',
    icon: <Sliders className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  CALIBRATION_COMPLIANCE: {
    location: 'Calibration & Compliance',
    process: 'Regulatory Instrumentation Audit Certs',
    icon: <ShieldCheck className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
};

// Classic Windows 3D Bevel Outset (Inactive) & Inset Sunken (Active) Styles
const WIN_TAB_ACTIVE =
  "bg-[#e8e7e3] text-blue-900 font-extrabold text-xs px-3 py-1 border-t-2 border-l-2 border-r-2 border-b-2 border-t-[#404040] border-l-[#404040] border-r-white border-b-white shadow-inner cursor-pointer transition-none select-none";

const WIN_TAB_INACTIVE =
  "bg-[#d4d0c8] text-slate-800 font-semibold text-xs px-3 py-1 border-t-2 border-l-2 border-r-2 border-b-2 border-t-white border-l-white border-r-[#404040] border-b-[#404040] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white hover:bg-slate-200 cursor-pointer transition-none select-none";

function EquipmentRegistryView({ filter = 'ALL' }: { filter?: string }) {
  const allAssets = [
    { tag: 'AAV-101', type: 'PLANT', name: 'Ambient Air Vaporizer Train 1 (Duty A)', loc: 'Nias Regas Unit', maker: 'Cryonorm B.V.', crit: 'Class A (Critical)', lastMaint: '2026-06-15', status: 'RUNNING' },
    { tag: 'AAV-102', type: 'PLANT', name: 'Ambient Air Vaporizer Train 1 (Duty B)', loc: 'Nias Regas Unit', maker: 'Cryonorm B.V.', crit: 'Class A (Critical)', lastMaint: '2026-06-15', status: 'RUNNING' },
    { tag: 'AAV-103', type: 'PLANT', name: 'Ambient Air Vaporizer Train 2 (Duty A)', loc: 'Nias Regas Unit', maker: 'Cryonorm B.V.', crit: 'Class A (Critical)', lastMaint: '2026-07-02', status: 'RUNNING' },
    { tag: 'AAV-104', type: 'PLANT', name: 'Ambient Air Vaporizer Train 2 (Duty B)', loc: 'Nias Regas Unit', maker: 'Cryonorm B.V.', crit: 'Class A (Critical)', lastMaint: '2026-07-02', status: 'RUNNING' },
    { tag: 'PRSS-01', type: 'PLANT', name: 'Pressure Reduction & Metering Skid (0.35 MPa)', loc: 'Nias Regas Unit', maker: 'Emerson Process', crit: 'Class A (Critical)', lastMaint: '2026-05-20', status: 'RUNNING' },
    { tag: 'GC-ABB-01', type: 'INSTRUMENTS', name: 'Process Gas Chromatograph (C1-C6+ GHV)', loc: 'Nias Regas Unit', maker: 'ABB Danalyzer', crit: 'Class B (Major)', lastMaint: '2026-07-25', status: 'CALIBRATED' },
    { tag: 'GEN-01..05', type: 'PLANT', name: 'MAN 7L 51/60 DF Gas Engines (5 x 7.35MW)', loc: 'PLTMG Nias Power Hall', maker: 'MAN Energy Solutions', crit: 'Class A (Critical)', lastMaint: '2026-07-10', status: 'DISPATCHED' },
    { tag: 'ISO-FLEET-120', type: 'ISO_TANK', name: '20ft T75 Cryogenic ISO Containers (120 Units)', loc: 'Virtual Pipeline Fleet', maker: 'CIMC / U-LBC', crit: 'Class A (Critical)', lastMaint: 'Continuous', status: 'ACTIVE' },
    { tag: 'PT-101..104', type: 'INSTRUMENTS', name: 'Cryogenic Pressure Transmitters (0-1.6 MPa)', loc: '4-Bay Vaporizer Header', maker: 'Yokogawa EJX', crit: 'Class B (Major)', lastMaint: '2026-06-20', status: 'VERIFIED' },
  ];

  const assets = filter === 'ALL' ? allAssets : allAssets.filter((a) => a.type === filter);

  return (
    <div className="h-full flex flex-col min-h-0 gap-1.5 w-full win-panel p-2 overflow-hidden">
      <div className="win-titlebar px-2 py-1">
        <span className="text-xs font-bold text-white flex items-center gap-1.5">
          <ClipboardList className="w-3.5 h-3.5" />
          Equipment & Asset Registry - Plant Master Asset Hierarchy (NIAS CMMS)
        </span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto win-sunken">
        <table className="w-full text-left border-collapse font-mono text-[11px] win-grid">
          <thead>
            <tr className="bg-slate-200 border-b border-slate-400">
              <th className="p-1.5 border-r border-slate-300">Asset Tag</th>
              <th className="p-1.5 border-r border-slate-300">Equipment Description</th>
              <th className="p-1.5 border-r border-slate-300">Operational Site</th>
              <th className="p-1.5 border-r border-slate-300">OEM Manufacturer</th>
              <th className="p-1.5 border-r border-slate-300">Criticality</th>
              <th className="p-1.5 border-r border-slate-300">Last Overhaul</th>
              <th className="p-1.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((a, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white hover:bg-slate-100' : 'bg-slate-50 hover:bg-slate-100'}>
                <td className="p-1.5 font-bold border-r border-slate-300 text-blue-950">{a.tag}</td>
                <td className="p-1.5 font-medium border-r border-slate-300">{a.name}</td>
                <td className="p-1.5 border-r border-slate-300">{a.loc}</td>
                <td className="p-1.5 border-r border-slate-300">{a.maker}</td>
                <td className="p-1.5 border-r border-slate-300 font-bold text-slate-800">{a.crit}</td>
                <td className="p-1.5 border-r border-slate-300">{a.lastMaint}</td>
                <td className="p-1.5 text-center font-bold text-emerald-800 bg-emerald-50">{a.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WorkOrderView({ filter = 'ALL' }: { filter?: string }) {
  const allWorkOrders = [
    { wo: 'WO-2026-0841', cat: 'PMS', tag: 'AAV-104', type: 'Preventive (PMS)', desc: 'Vaporizer 30-Day Defrost & Thermal Cycle Inspection', priority: 'Medium', due: '2026-08-30', tech: 'H. Siregar', status: 'IN_PROGRESS' },
    { wo: 'WO-2026-0839', cat: 'OVERHAUL', tag: 'GEN-02', type: 'Routine (500h)', desc: 'MAN 7L 51/60 DF Lube Oil Sampling & Filter Replacement', priority: 'High', due: '2026-09-02', tech: 'A. Fauzi', status: 'SCHEDULED' },
    { wo: 'WO-2026-0835', cat: 'PMS', tag: 'PRSS-01', type: 'Calibration', desc: 'PRSS Dual Redundant Pilot Regulator Trim Inspection', priority: 'High', due: '2026-08-28', tech: 'B. Pratama', status: 'COMPLETED' },
    { wo: 'WO-2026-0828', cat: 'MRO', tag: 'IT-5088', type: 'Corrective (MRO)', desc: 'Laydown 2 ISO Tank Secondary Relief Valve Gasket Replace', priority: 'Critical', due: '2026-08-26', tech: 'M. Yusuf', status: 'PARTS_PENDING' },
  ];

  const workOrders = filter === 'ALL' ? allWorkOrders : allWorkOrders.filter((w) => w.cat === filter);

  return (
    <div className="h-full flex flex-col min-h-0 gap-1.5 w-full win-panel p-2 overflow-hidden">
      <div className="win-titlebar px-2 py-1">
        <span className="text-xs font-bold text-white flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5" />
          Work Order & Maintenance - Planned Maintenance System (PMS Ledger)
        </span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto win-sunken">
        <table className="w-full text-left border-collapse font-mono text-[11px] win-grid">
          <thead>
            <tr className="bg-slate-200 border-b border-slate-400">
              <th className="p-1.5 border-r border-slate-300">WO Number</th>
              <th className="p-1.5 border-r border-slate-300">Target Asset</th>
              <th className="p-1.5 border-r border-slate-300">Work Type</th>
              <th className="p-1.5 border-r border-slate-300">Task Scope</th>
              <th className="p-1.5 border-r border-slate-300">Priority</th>
              <th className="p-1.5 border-r border-slate-300">Due Date</th>
              <th className="p-1.5 border-r border-slate-300">Engineer</th>
              <th className="p-1.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {workOrders.map((w, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white hover:bg-slate-100' : 'bg-slate-50 hover:bg-slate-100'}>
                <td className="p-1.5 font-bold border-r border-slate-300 text-blue-950">{w.wo}</td>
                <td className="p-1.5 font-bold border-r border-slate-300">{w.tag}</td>
                <td className="p-1.5 border-r border-slate-300">{w.type}</td>
                <td className="p-1.5 border-r border-slate-300">{w.desc}</td>
                <td className="p-1.5 border-r border-slate-300 font-bold text-slate-800">{w.priority}</td>
                <td className="p-1.5 border-r border-slate-300">{w.due}</td>
                <td className="p-1.5 border-r border-slate-300">{w.tech}</td>
                <td className="p-1.5 text-center font-bold text-blue-900 bg-blue-50">{w.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CalibrationComplianceView({ filter = 'ALL' }: { filter?: string }) {
  const allCerts = [
    { cert: 'CAL-ABB-2026-Q3', cat: 'INSTRUMENT', equip: 'GC-ABB-01', param: 'C1-C6 Hydrocarbon Gas Composition', calDate: '2026-07-28', nextDue: '2026-08-28', agency: 'PT. Sucofindo / SKG Migas', result: 'CERTIFIED (PASS)' },
    { cert: 'CAL-FM-2026-01', cat: 'INSTRUMENT', equip: 'PRSS Ultrasonic Meter', param: 'Custody Gas Mass Flow Rate (Nm3/h)', calDate: '2026-05-15', nextDue: '2026-11-15', agency: 'Ditjen Migas Calibration', result: 'CERTIFIED (PASS)' },
    { cert: 'CAL-PRV-2026-44', cat: 'PRV', equip: 'ISO Tank Relief PRV-04', param: 'Set-point Lift Pressure 0.85 MPa', calDate: '2026-06-10', nextDue: '2026-12-10', agency: 'BKI (Bureau Klasifikasi Indonesia)', result: 'CERTIFIED (PASS)' },
    { cert: 'COMP-SAFETY-2026', cat: 'AUDIT', equip: 'Terminal Cryogenic ESD', param: 'Emergency Shut-Down & Gas Leak Sensors', calDate: '2026-07-01', nextDue: '2027-07-01', agency: 'BSG Lines Marine HSE', result: 'COMPLIANT (ACTIVE)' },
  ];

  const certs = filter === 'ALL' ? allCerts : allCerts.filter((c) => c.cat === filter);

  return (
    <div className="h-full flex flex-col min-h-0 gap-1.5 w-full win-panel p-2 overflow-hidden">
      <div className="win-titlebar px-2 py-1">
        <span className="text-xs font-bold text-white flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          Calibration & Compliance - Regulatory Inspection & Audit Certificates (NIAS CMMS)
        </span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto win-sunken">
        <table className="w-full text-left border-collapse font-mono text-[11px] win-grid">
          <thead>
            <tr className="bg-slate-200 border-b border-slate-400">
              <th className="p-1.5 border-r border-slate-300">Cert / Record #</th>
              <th className="p-1.5 border-r border-slate-300">Calibrated Instrument</th>
              <th className="p-1.5 border-r border-slate-300">Measurement Parameter</th>
              <th className="p-1.5 border-r border-slate-300">Calibration Date</th>
              <th className="p-1.5 border-r border-slate-300">Next Due Date</th>
              <th className="p-1.5 border-r border-slate-300">Certifying Authority</th>
              <th className="p-1.5 text-center">Compliance Result</th>
            </tr>
          </thead>
          <tbody>
            {certs.map((c, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white hover:bg-slate-100' : 'bg-slate-50 hover:bg-slate-100'}>
                <td className="p-1.5 font-bold border-r border-slate-300 text-blue-950">{c.cert}</td>
                <td className="p-1.5 font-bold border-r border-slate-300">{c.equip}</td>
                <td className="p-1.5 border-r border-slate-300">{c.param}</td>
                <td className="p-1.5 border-r border-slate-300">{c.calDate}</td>
                <td className="p-1.5 border-r border-slate-300">{c.nextDue}</td>
                <td className="p-1.5 border-r border-slate-300">{c.agency}</td>
                <td className="p-1.5 text-center font-bold text-emerald-800 bg-emerald-50">{c.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LNGPortalInner() {
  const { theme, setTheme } = useTheme();

  const [activeMenu, setActiveMenu] = useState<string>('lng-process');
  const [activeSubTab, setActiveSubTab] = useState<string>('LNG_PROCESS_OVERVIEW');
  const [activeKey, setActiveKey] = useState<SubProcessKey>('LNG_PROCESS_OVERVIEW');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Sub-tab states for CMMS Modules
  const [equipmentFilter, setEquipmentFilter] = useState<string>('ALL');
  const [workOrderFilter, setWorkOrderFilter] = useState<string>('ALL');
  const [calibrationFilter, setCalibrationFilter] = useState<string>('ALL');

  const { isLoading } = usePortalData();

  const currentNav =
    SUBPROCESS_TITLES[activeKey] ||
    SUBPROCESS_TITLES[activeSubTab] ||
    SUBPROCESS_TITLES['LNG_PROCESS_OVERVIEW'];

  const handleSelectSubProcess = (key: SubProcessKey) => {
    setActiveKey(key);
    if (key === 'LNG_PROCESS_OVERVIEW' || key === 'NIAS_TERMINAL_OVERVIEW') {
      setActiveMenu('lng-process');
      setActiveSubTab('LNG_PROCESS_OVERVIEW');
    } else if (
      key === 'NIAS_TANK_OVERVIEW' ||
      key === 'NIAS_LAYDOWN_1_2_LOG' ||
      key === 'NIAS_ACTIVE_BAY_TANKS' ||
      key === 'NIAS_LAYDOWN_3_HEEL' ||
      key === 'NIAS_GAS_PROCESS_TELEMETRY' ||
      key === 'NIAS_GC_GAS_QUALITY' ||
      key === 'NIAS_PLTMG_POWER_OUTPUT' ||
      key === 'NIAS_HEAT_SETTLEMENT'
    ) {
      setActiveMenu('nias-terminal');
      setActiveSubTab(key);
    } else if (key === 'ARUN_LOADING_COQ' || key === 'ARUN_MASTER_HISTORY') {
      setActiveMenu('arun-terminal');
      setActiveSubTab(key);
    } else if (key === 'SAVIOUR_VOYAGE_MONITORING' || key === 'SAVIOUR_MARINE_PRESSURE') {
      setActiveMenu('saviour-transit');
      setActiveSubTab(key);
    } else {
      setActiveMenu(key);
      setActiveSubTab(key);
    }
  };

  // Determine current active top module (1 to 4)
  const currentModuleId =
    activeKey === 'EQUIPMENT_ASSET_REGISTRY' || activeKey === 'GLOBAL_FLEET_HUB' || activeKey === 'DATA_INGESTION_HUB'
      ? 'MOD_2_EQUIPMENT'
      : activeKey.startsWith('WORK_ORDER') || activeKey.startsWith('MANPOWER') || activeKey === 'PM_SCHEDULES'
      ? 'MOD_3_WORK_ORDER'
      : activeKey === 'CALIBRATION_COMPLIANCE'
      ? 'MOD_4_CALIBRATION'
      : 'MOD_1_LNG_PROCESS';

  return (
    <div className="h-screen w-screen bg-[#d4d0c8] text-black font-sans flex flex-col md:flex-row overflow-hidden select-none">
      {/* Left Sidebar Navigation */}
      <SidebarNav
        activeKey={activeKey}
        onSelectKey={handleSelectSubProcess}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Mobile Sidebar Overlay Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}

      {/* Right Main Content Body */}
      <div className="flex-1 h-full flex flex-col min-w-0 min-h-0 overflow-hidden bg-[#d4d0c8]">
        {/* Top Application Window Bar & 2-Tier Header Navigation */}
        <header className="shrink-0 z-20 bg-[#d4d0c8] border-b-2 border-[#808080] shadow-xs select-none">
          {/* Windows Titlebar */}
          <div className="win-titlebar">
            <div className="flex items-center gap-2">
              <Monitor className="w-3.5 h-3.5 text-white" />
              <span className="text-xs font-bold tracking-wide">
                {COMPANY_CONFIG.systemTitle} | {COMPANY_CONFIG.companyName} - [ {currentNav.location} &gt; {currentNav.process} ]
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 1. ROW 1: CMMS Core 4 Modules Navigation Bar (Authentic Bevel Style)      */}
          {/* ========================================================================= */}
          <div className="bg-[#d4d0c8] border-b border-[#808080] px-2 py-1.5 flex items-center justify-between gap-2 flex-wrap shrink-0">
            {/* Left: 4 Core CMMS Modules Tabs (Bevel Outset / Inset Effect) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {CMMS_MODULES.map((mod) => {
                const isActive = currentModuleId === mod.id;
                return (
                  <button
                    key={mod.id}
                    onClick={() => handleSelectSubProcess(mod.defaultKey as SubProcessKey)}
                    className={isActive ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
                    title={mod.description}
                  >
                    <span>{mod.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Right: Clean Refresh Button Only */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => window.location.reload()}
                className="win-btn text-xs px-2.5 py-1 flex items-center gap-1.5 cursor-pointer"
                title="Refresh Telemetry Data"
              >
                <RefreshCw className="w-3 h-3 text-slate-800" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. ROW 2: Module Sub-Sections Bar (Contextual Bevel Sub-Tabs)             */}
          {/* ========================================================================= */}
          <div className="bg-[#e4e0d8] border-b-2 border-white px-2 py-1 flex items-center gap-1.5 overflow-x-auto shrink-0">
            {/* Sub-Tabs for LNG-Process */}
            {currentModuleId === 'MOD_1_LNG_PROCESS' && (
              <>
                <button
                  onClick={() => handleSelectSubProcess('LNG_PROCESS_OVERVIEW')}
                  className={
                    activeKey === 'LNG_PROCESS_OVERVIEW' || activeKey === 'NIAS_TERMINAL_OVERVIEW'
                      ? WIN_TAB_ACTIVE
                      : WIN_TAB_INACTIVE
                  }
                >
                  <span>Overview</span>
                </button>

                <button
                  onClick={() => handleSelectSubProcess('ARUN_LOADING_COQ')}
                  className={activeKey.startsWith('ARUN') ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
                >
                  <span>PAGT ( Arun )</span>
                </button>

                <button
                  onClick={() => handleSelectSubProcess('SAVIOUR_VOYAGE_MONITORING')}
                  className={activeKey.startsWith('SAVIOUR') ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
                >
                  <span>Marine Transit</span>
                </button>

                <button
                  onClick={() => handleSelectSubProcess('NIAS_TANK_OVERVIEW')}
                  className={
                    activeKey.startsWith('NIAS') &&
                    activeKey !== 'LNG_PROCESS_OVERVIEW' &&
                    activeKey !== 'NIAS_TERMINAL_OVERVIEW'
                      ? WIN_TAB_ACTIVE
                      : WIN_TAB_INACTIVE
                  }
                >
                  <span>Nias Regas Unit</span>
                </button>

                <button
                  onClick={() => handleSelectSubProcess('MAINTENANCE_MRO_HUB')}
                  className={activeKey === 'MAINTENANCE_MRO_HUB' ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
                >
                  <span>Maintenance & Depot</span>
                </button>
              </>
            )}

            {/* Sub-Tabs for Equipment & Asset Registry */}
            {currentModuleId === 'MOD_2_EQUIPMENT' && (
              <>
                <button
                  onClick={() => {
                    handleSelectSubProcess('EQUIPMENT_ASSET_REGISTRY');
                    setEquipmentFilter('ALL');
                  }}
                  className={activeKey === 'EQUIPMENT_ASSET_REGISTRY' && equipmentFilter === 'ALL' ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
                >
                  <span>All Assets Directory</span>
                </button>

                <button
                  onClick={() => handleSelectSubProcess('GLOBAL_FLEET_HUB')}
                  className={activeKey === 'GLOBAL_FLEET_HUB' ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
                >
                  <span>120-Fleet Hub</span>
                </button>

                <button
                  onClick={() => handleSelectSubProcess('DATA_INGESTION_HUB')}
                  className={activeKey === 'DATA_INGESTION_HUB' ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
                >
                  <span>CSV Ingestion</span>
                </button>

                <button
                  onClick={() => {
                    handleSelectSubProcess('EQUIPMENT_ASSET_REGISTRY');
                    setEquipmentFilter('PLANT');
                  }}
                  className={activeKey === 'EQUIPMENT_ASSET_REGISTRY' && equipmentFilter === 'PLANT' ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
                >
                  <span>Plant Machinery</span>
                </button>

                <button
                  onClick={() => {
                    handleSelectSubProcess('EQUIPMENT_ASSET_REGISTRY');
                    setEquipmentFilter('INSTRUMENTS');
                  }}
                  className={activeKey === 'EQUIPMENT_ASSET_REGISTRY' && equipmentFilter === 'INSTRUMENTS' ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
                >
                  <span>Sensors & Instruments</span>
                </button>
              </>
            )}

            {/* Sub-Tabs for Work Order & Maintenance */}
            {currentModuleId === 'MOD_3_WORK_ORDER' && (
              <>
                <button
                  onClick={() => {
                    handleSelectSubProcess('WORK_ORDER_DIRECTORY');
                    setWorkOrderFilter('ALL');
                  }}
                  className={
                    (activeKey === 'WORK_ORDER_MAINTENANCE' || activeKey === 'WORK_ORDER_DIRECTORY') && workOrderFilter === 'ALL'
                      ? WIN_TAB_ACTIVE
                      : WIN_TAB_INACTIVE
                  }
                >
                  <span>Work Orders</span>
                </button>

                <button
                  onClick={() => {
                    handleSelectSubProcess('PM_SCHEDULES');
                    setWorkOrderFilter('PMS');
                  }}
                  className={
                    (activeKey === 'WORK_ORDER_MAINTENANCE' || activeKey === 'PM_SCHEDULES') && workOrderFilter === 'PMS'
                      ? WIN_TAB_ACTIVE
                      : WIN_TAB_INACTIVE
                  }
                >
                  <span>Preventive Maintenance</span>
                </button>

                <button
                  onClick={() => handleSelectSubProcess('MANPOWER_SHIFT_ROSTER')}
                  className={activeKey.startsWith('MANPOWER') ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
                >
                  <span>Manpower & Roster (3:1)</span>
                </button>

                <button
                  onClick={() => handleSelectSubProcess('MAINTENANCE_MRO_HUB')}
                  className={activeKey === 'MAINTENANCE_MRO_HUB' ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
                >
                  <span>MRO Depot</span>
                </button>
              </>
            )}

            {/* Sub-Tabs for Calibration & Compliance */}
            {currentModuleId === 'MOD_4_CALIBRATION' && (
              <>
                <button
                  onClick={() => setCalibrationFilter('ALL')}
                  className={calibrationFilter === 'ALL' ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
                >
                  <span>All Certificates</span>
                </button>
                <button
                  onClick={() => setCalibrationFilter('INSTRUMENT')}
                  className={calibrationFilter === 'INSTRUMENT' ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
                >
                  <span>Instrument Calibration</span>
                </button>
                <button
                  onClick={() => setCalibrationFilter('PRV')}
                  className={calibrationFilter === 'PRV' ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
                >
                  <span>PRV Safety Valves</span>
                </button>
                <button
                  onClick={() => setCalibrationFilter('AUDIT')}
                  className={calibrationFilter === 'AUDIT' ? WIN_TAB_ACTIVE : WIN_TAB_INACTIVE}
                >
                  <span>Regulatory Audits</span>
                </button>
              </>
            )}
          </div>
        </header>

        {/* Dynamic Workspace Route View - 100% Full Height Container */}
        <main className="flex-1 h-full flex flex-col min-h-0 w-full p-1.5 overflow-hidden bg-[#d4d0c8]">
          {isLoading ? (
            <div className="win-panel p-8 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-900 animate-spin" />
              <p className="text-xs font-bold font-mono">Hydrating 7 CSV operational datasets ...</p>
            </div>
          ) : (
            <div className="flex-1 h-full flex flex-col min-h-0 w-full overflow-hidden">
              {/* ========================================================= */}
              {/* 1. LNG-PROCESS MAIN OVERVIEW (INTEGRATED 5-NODE PFD)      */}
              {/* ========================================================= */}
              {(activeKey === 'LNG_PROCESS_OVERVIEW' || activeKey === 'NIAS_TERMINAL_OVERVIEW' || activeSubTab === 'LNG_PROCESS_OVERVIEW' || (!activeKey && !activeSubTab)) && (
                <NiasOperationalOverviewTab
                  onNavigateSubTab={(targetTab, domain) => {
                    if (targetTab.startsWith('ARUN_') || targetTab.startsWith('SAVIOUR_')) {
                      handleSelectSubProcess(targetTab as SubProcessKey);
                    } else if (domain === 'ISO_TANK_MGMT') {
                      handleSelectSubProcess((targetTab as SubProcessKey) || 'NIAS_TANK_OVERVIEW');
                    } else if (domain === 'REGAS_SYSTEM') {
                      handleSelectSubProcess((targetTab as SubProcessKey) || 'NIAS_GAS_PROCESS_TELEMETRY');
                    } else {
                      handleSelectSubProcess((targetTab as SubProcessKey) || 'LNG_PROCESS_OVERVIEW');
                    }
                  }}
                />
              )}

              {/* Nias Regas Terminal - Domain 1: ISO Tank Management */}
              {(activeKey === 'NIAS_TANK_OVERVIEW' || activeSubTab === 'NIAS_TANK_OVERVIEW') && (
                <NiasTerminalView initialDomain="ISO_TANK_MGMT" initialSubTab="TANK_OVERVIEW" />
              )}
              {(activeKey === 'NIAS_LAYDOWN_1_2_LOG' || activeSubTab === 'NIAS_LAYDOWN_1_2_LOG') && (
                <NiasTerminalView initialDomain="ISO_TANK_MGMT" initialSubTab="LAYDOWN_1_2_LOG" />
              )}
              {(activeKey === 'NIAS_ACTIVE_BAY_TANKS' || activeSubTab === 'NIAS_ACTIVE_BAY_TANKS') && (
                <NiasTerminalView initialDomain="ISO_TANK_MGMT" initialSubTab="ACTIVE_BAY_TANKS" />
              )}
              {(activeKey === 'NIAS_LAYDOWN_3_HEEL' || activeSubTab === 'NIAS_LAYDOWN_3_HEEL') && (
                <NiasTerminalView initialDomain="ISO_TANK_MGMT" initialSubTab="LAYDOWN_3_HEEL" />
              )}

              {/* Nias Regas Terminal - Domain 2: Regas System & Gas-to-Power */}
              {(activeKey === 'NIAS_GAS_PROCESS_TELEMETRY' || activeSubTab === 'NIAS_GAS_PROCESS_TELEMETRY') && (
                <NiasTerminalView initialDomain="REGAS_SYSTEM" initialSubTab="GAS_PROCESS_TELEMETRY" />
              )}
              {(activeKey === 'NIAS_GC_GAS_QUALITY' || activeSubTab === 'NIAS_GC_GAS_QUALITY') && (
                <NiasTerminalView initialDomain="REGAS_SYSTEM" initialSubTab="GC_GAS_QUALITY" />
              )}
              {(activeKey === 'NIAS_PLTMG_POWER_OUTPUT' || activeSubTab === 'NIAS_PLTMG_POWER_OUTPUT') && (
                <NiasTerminalView initialDomain="REGAS_SYSTEM" initialSubTab="PLTMG_POWER_OUTPUT" />
              )}
              {(activeKey === 'NIAS_HEAT_SETTLEMENT' || activeSubTab === 'NIAS_HEAT_SETTLEMENT') && (
                <NiasTerminalView initialDomain="REGAS_SYSTEM" initialSubTab="CUSTODY_HEAT_SETTLEMENT" />
              )}

              {/* Arun PAG Terminal */}
              {activeKey === 'ARUN_LOADING_COQ' && (
                <ArunTerminalView
                  initialSubTab="OPERATIONS_YARD"
                  onNavigateToSaviourModule={() => handleSelectSubProcess('SAVIOUR_VOYAGE_MONITORING')}
                />
              )}
              {activeKey === 'ARUN_MASTER_HISTORY' && (
                <ArunTerminalView
                  initialSubTab="MASTER_HISTORY_SHEET"
                  onNavigateToSaviourModule={() => handleSelectSubProcess('SAVIOUR_VOYAGE_MONITORING')}
                />
              )}
              {activeKey === 'ARUN_HEEL_BOG_LOSS' && (
                <ArunHeelBogLossView />
              )}

              {/* MV. Saviour Transit */}
              {activeKey === 'SAVIOUR_VOYAGE_MONITORING' && (
                <MvSaviourView initialSubTab="STOWAGE_PLAN" />
              )}
              {activeKey === 'SAVIOUR_MARINE_PRESSURE' && (
                <MvSaviourView initialSubTab="STOWAGE_PLAN" />
              )}

              {/* Maintenance & Depot */}
              {activeKey === 'MAINTENANCE_MRO_HUB' && (
                <MaintenanceHubView />
              )}

              {/* ========================================================= */}
              {/* MODULE 2: EQUIPMENT & ASSET REGISTRY                      */}
              {/* ========================================================= */}
              {activeKey === 'EQUIPMENT_ASSET_REGISTRY' && (
                <EquipmentRegistryView filter={equipmentFilter} />
              )}
              {activeKey === 'GLOBAL_FLEET_HUB' && (
                <GlobalFleetHubView />
              )}
              {activeKey === 'DATA_INGESTION_HUB' && (
                <DataIngestionHub />
              )}

              {/* ========================================================= */}
              {/* MODULE 3: WORK ORDER & MAINTENANCE & MANPOWER ROSTER      */}
              {/* ========================================================= */}
              {(activeKey === 'WORK_ORDER_MAINTENANCE' || activeKey === 'WORK_ORDER_DIRECTORY' || activeKey === 'PM_SCHEDULES') && (
                <WorkOrderView filter={activeKey === 'PM_SCHEDULES' ? 'PMS' : workOrderFilter} />
              )}
              {activeKey === 'MANPOWER_SHIFT_ROSTER' && (
                <ManpowerRosterView initialSubView="MONTHLY_GRID" />
              )}
              {activeKey === 'MANPOWER_MONTHLY_GRID' && (
                <ManpowerRosterView initialSubView="MONTHLY_GRID" />
              )}
              {activeKey === 'MANPOWER_ROTATION_TRACKER' && (
                <ManpowerRosterView initialSubView="ROTATION_TRACKER" />
              )}
              {activeKey === 'MANPOWER_DAILY_SHIFT' && (
                <ManpowerRosterView initialSubView="DAILY_SHIFT_BOARD" />
              )}

              {/* ========================================================= */}
              {/* MODULE 4: CALIBRATION & COMPLIANCE                        */}
              {/* ========================================================= */}
              {activeKey === 'CALIBRATION_COMPLIANCE' && (
                <CalibrationComplianceView filter={calibrationFilter} />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function LNGPortalApp() {
  return (
    <ThemeProvider>
      <PortalDataProvider>
        <LNGPortalInner />
      </PortalDataProvider>
    </ThemeProvider>
  );
}
