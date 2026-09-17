"use client";

import { usePortalData } from '../../context/PortalDataContext';

export function usePortalSystemFacade() {
  const {
    ingestionStatuses,
    isLoading,
    error,
    uploadCustomCSV,
    reloadAllData,
    exportAllLogsToExcel,
  } = usePortalData();

  return {
    ingestionStatuses,
    isLoading,
    error,
    uploadCustomCSV,
    reloadAllData,
    exportAllLogsToExcel,
  };
}
