"use client";

import { usePortalData } from '../../context/PortalDataContext';

export function useGasQualityFacade() {
  const { gasQualityRecords, saveGasQualityRecord } = usePortalData();

  return {
    gasQualityRecords,
    saveGasQualityRecord,
  };
}
