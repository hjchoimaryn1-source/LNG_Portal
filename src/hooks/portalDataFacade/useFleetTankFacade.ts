"use client";

import { usePortalData } from '../../context/PortalDataContext';

export function useFleetTankFacade() {
  const {
    fleetTanks,
    activeBays,
    updateTankLog,
    moveTankLocation,
    batchTransitionTanks,
    mountTankToBay,
    unmountBay,
    toggleBayRunning,
    markTankForMaintenance,
    releaseTankFromMaintenance,
    recordPostRegasOffload,
    authorizeBackhaulClearance,
  } = usePortalData();

  return {
    fleetTanks,
    activeBays,
    updateTankLog,
    moveTankLocation,
    batchTransitionTanks,
    mountTankToBay,
    unmountBay,
    toggleBayRunning,
    markTankForMaintenance,
    releaseTankFromMaintenance,
    recordPostRegasOffload,
    authorizeBackhaulClearance,
  };
}
