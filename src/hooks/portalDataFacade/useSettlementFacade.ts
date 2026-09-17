"use client";

import { usePortalData } from '../../context/PortalDataContext';

export function useSettlementFacade() {
  const {
    settlementRecords,
    gasCompositions,
    addDeliveredMeasurement,
    addConsumptionRecord,
    addFlobossAndGCLog,
  } = usePortalData();

  return {
    settlementRecords,
    gasCompositions,
    addDeliveredMeasurement,
    addConsumptionRecord,
    addFlobossAndGCLog,
  };
}
