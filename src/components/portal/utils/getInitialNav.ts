// src/components/portal/utils/getInitialNav.ts
import { SubProcessKey } from '../../../types/lng';

export function getInitialNav(key: SubProcessKey): { menu: string; subTab: string } {
  if (key === 'LNG_PROCESS_OVERVIEW' || key === 'NIAS_TERMINAL_OVERVIEW') {
    return { menu: 'lng-process', subTab: 'LNG_PROCESS_OVERVIEW' };
  }
  if (key === 'EQUIPMENT_ASSET_REGISTRY' || key === 'GLOBAL_FLEET_HUB' || key === 'DATA_INGESTION_HUB') {
    return { menu: 'equipment', subTab: key };
  }
  if (key === 'WORK_ORDER_DIRECTORY' || key === 'WORK_ORDER_MAINTENANCE' || key === 'PM_SCHEDULES') {
    return { menu: 'work-orders', subTab: key };
  }
  if (key === 'MANPOWER_DAILY_SHIFT' || key === 'MANPOWER_SHIFT_ROSTER') {
    return { menu: 'MANPOWER_SHIFT_ROSTER', subTab: key === 'MANPOWER_DAILY_SHIFT' ? 'OVERVIEW' : 'DAILY_SHIFT_BOARD' };
  }
  if (key.startsWith('MANPOWER')) {
    return { menu: key, subTab: key };
  }
  if (key === 'SAFETY_OVERVIEW' || key === 'PTW_PERMITS' || key === 'SAFETY_GAS_TESTING' || key === 'SAFETY_ERT_READINESS' || key === 'SAFETY_SOP_REFERENCE') {
    return { menu: 'ptw-permits', subTab: key };
  }
  if (key === 'CMMS_OVERVIEW_DASHBOARD') {
    return { menu: 'CMMS_OVERVIEW_DASHBOARD', subTab: key };
  }
  return { menu: 'lng-process', subTab: key };
}
