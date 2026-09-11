// src/components/portal/hooks/usePortalNavigation.ts
import { useState } from 'react';
import { SubProcessKey } from '../../../types/lng';
import { getInitialNav } from '../utils/getInitialNav';
import { SUBPROCESS_TITLES } from '../utils/subProcessTitles';
import {
  ManpowerTabKey,
  MANPOWER_TAB_KEY_MAP,
  MANPOWER_TAB_LABELS,
  NORMALIZE_MANPOWER_TAB,
} from '../utils/manpowerTabConstants';
import { Users } from 'lucide-react';

export function usePortalNavigation(initialKey: SubProcessKey, onReturnToLauncher?: () => void) {
  const initNav = getInitialNav(initialKey);
  const [activeMenu, setActiveMenu] = useState<string>(initNav.menu);
  const [activeSubTab, setActiveSubTab] = useState<string>(initNav.subTab);
  const [activeKey, setActiveKey] = useState<SubProcessKey>(initialKey);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Sub-tab states for CMMS Modules
  const [equipmentFilter, setEquipmentFilter] = useState<string>('ALL');
  const [showCmmsRegistry, setShowCmmsRegistry] = useState(false);
  const [workOrderFilter, setWorkOrderFilter] = useState<string>('ALL');
  const [showWoSchedulerPreview, setShowWoSchedulerPreview] = useState(false);
  const [calibrationFilter, setCalibrationFilter] = useState<string>('ALL');

  const currentNav = (() => {
    if (activeKey.startsWith('MANPOWER')) {
      const manpowerTab = NORMALIZE_MANPOWER_TAB(activeSubTab || 'OVERVIEW');
      return {
        location: 'Site Manning & Roster',
        process: MANPOWER_TAB_LABELS[manpowerTab],
        icon: <Users className="w-3.5 h-3.5 text-black font-bold" />,
        color: 'text-black font-bold',
      };
    }

    return (
      SUBPROCESS_TITLES[activeKey] ||
      SUBPROCESS_TITLES[activeSubTab] ||
      SUBPROCESS_TITLES['LNG_PROCESS_OVERVIEW']
    );
  })();

  const handleSelectSubProcess = (key: SubProcessKey) => {
    if (key === 'SECTOR_LAUNCHER' && onReturnToLauncher) {
      onReturnToLauncher();
      return;
    }
    setActiveKey(key);
    if (key === 'SECTOR_LAUNCHER') {
      setActiveMenu('sector-launcher');
      setActiveSubTab('SECTOR_LAUNCHER');
    } else if (key === 'LNG_PROCESS_OVERVIEW' || key === 'NIAS_TERMINAL_OVERVIEW') {
      setActiveMenu('lng-process');
      setActiveSubTab('LNG_PROCESS_OVERVIEW');
    } else if (
      key === 'NIAS_TANK_OVERVIEW' ||
      key === 'NIAS_LAYDOWN_1_2_LOG' ||
      key === 'NIAS_ACTIVE_BAY_TANKS' ||
      key === 'NIAS_LAYDOWN_3_HEEL' ||
      key === 'NIAS_GAS_PROCESS_TELEMETRY' ||
      key === 'NIAS_GC_GAS_QUALITY' ||
      key === 'NIAS_GAS_METERING_LEDGER' ||
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
    } else if (key === 'MANPOWER_DAILY_SHIFT') {
      setActiveMenu('MANPOWER_SHIFT_ROSTER');
      setActiveSubTab('OVERVIEW');
    } else if (key === 'MANPOWER_SHIFT_ROSTER') {
      setActiveMenu('MANPOWER_SHIFT_ROSTER');
      setActiveSubTab('DAILY_SHIFT_BOARD');
    } else if (key === 'MANPOWER_MONTHLY_GRID') {
      setActiveMenu('MANPOWER_MONTHLY_GRID');
      setActiveSubTab('MONTHLY_GRID');
    } else if (key === 'MANPOWER_ROTATION_TRACKER') {
      setActiveMenu('MANPOWER_ROTATION_TRACKER');
      setActiveSubTab('ROTATION_TRACKER');
    } else if (key === 'MANPOWER_TRAINING_MATRIX') {
      setActiveMenu('MANPOWER_TRAINING_MATRIX');
      setActiveSubTab('TRAINING_MATRIX');
    } else {
      setActiveMenu(key);
      setActiveSubTab(key);
    }
  };

  const handleManpowerSubTab = (tab: ManpowerTabKey) => {
    setActiveSubTab(tab);
    setActiveKey(MANPOWER_TAB_KEY_MAP[tab]);
    setActiveMenu(MANPOWER_TAB_KEY_MAP[tab]);
  };

  // Determine current active top module (1 to 5)
  const currentModuleId =
    activeKey === 'SECTOR_LAUNCHER'
      ? 'MOD_0_LAUNCHER'
      : activeKey === 'CMMS_OVERVIEW_DASHBOARD'
      ? 'MOD_6_OVERVIEW'
      : activeKey === 'SAFETY_OVERVIEW' ||
        activeKey === 'PTW_PERMITS' ||
        activeKey === 'MANPOWER_PTW' ||
        activeKey === 'SAFETY_GAS_TESTING' ||
        activeKey === 'SAFETY_ERT_READINESS'
      ? 'MOD_5_SAFETY_PTW'
      : activeKey.startsWith('MANPOWER')
      ? 'MOD_4_MANPOWER'
      : activeKey === 'WORK_ORDER_DIRECTORY' ||
        activeKey === 'WORK_ORDER_MAINTENANCE' ||
        activeKey === 'PM_SCHEDULES' ||
        activeKey === 'MRO_PARTS_INVENTORY' ||
        (activeKey === 'MAINTENANCE_MRO_HUB' && activeMenu !== 'lng-process')
      ? 'MOD_3_WORK_ORDER'
      : activeKey === 'EQUIPMENT_ASSET_REGISTRY' ||
        activeKey === 'GLOBAL_FLEET_HUB' ||
        activeKey === 'DATA_INGESTION_HUB'
      ? 'MOD_2_EQUIPMENT'
      : 'MOD_1_LNG_PROCESS';

  // Internal state reset to the active module's Overview (Non-reloading Refresh)
  const handleRefreshCurrentModuleOverview = () => {
    switch (currentModuleId) {
      case 'MOD_1_LNG_PROCESS':
        handleSelectSubProcess('LNG_PROCESS_OVERVIEW');
        break;
      case 'MOD_2_EQUIPMENT':
        setEquipmentFilter('ALL');
        handleSelectSubProcess('EQUIPMENT_ASSET_REGISTRY');
        break;
      case 'MOD_3_WORK_ORDER':
        setWorkOrderFilter('ALL');
        handleSelectSubProcess('WORK_ORDER_DIRECTORY');
        break;
      case 'MOD_4_MANPOWER':
        handleManpowerSubTab('OVERVIEW');
        break;
      case 'MOD_5_SAFETY_PTW':
        handleSelectSubProcess('SAFETY_OVERVIEW');
        break;
      case 'MOD_6_OVERVIEW':
        handleSelectSubProcess('CMMS_OVERVIEW_DASHBOARD');
        break;
      default:
        handleSelectSubProcess('SECTOR_LAUNCHER');
        break;
    }
  };

  return {
    activeMenu,
    activeSubTab,
    activeKey,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    equipmentFilter,
    setEquipmentFilter,
    showCmmsRegistry,
    setShowCmmsRegistry,
    workOrderFilter,
    setWorkOrderFilter,
    showWoSchedulerPreview,
    setShowWoSchedulerPreview,
    calibrationFilter,
    setCalibrationFilter,
    currentNav,
    currentModuleId,
    handleSelectSubProcess,
    handleManpowerSubTab,
    handleRefreshCurrentModuleOverview,
  };
}
