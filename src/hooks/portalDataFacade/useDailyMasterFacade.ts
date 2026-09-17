"use client";

import { usePortalData } from '../../context/PortalDataContext';

export function useDailyMasterFacade() {
  const {
    dailyMasterRecords,
    addDailyMasterLog,
    saveDailyInspectionRecord,
    batchUpdateDailyMasterRecords,
    addDepressurizationLog,
  } = usePortalData();

  return {
    dailyMasterRecords,
    addDailyMasterLog,
    saveDailyInspectionRecord,
    batchUpdateDailyMasterRecords,
    addDepressurizationLog,
  };
}
