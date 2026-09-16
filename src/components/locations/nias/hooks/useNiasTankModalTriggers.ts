// src/components/locations/nias/hooks/useNiasTankModalTriggers.ts
import { useState } from 'react';
import { DefectCategory, MaintenanceLocation } from '../../../../types/lng';
import { NiasTankAsset } from '../../NiasTerminalView';

export interface UseNiasTankModalTriggersOptions {
  markTankForMaintenance: (tankNo: string, defectCategory: DefectCategory, bay: MaintenanceLocation, description: string) => void;
  setToastMessage: (msg: string | null) => void;
}

/**
 * Encapsulates the modal/drawer trigger state group used to open the Bay
 * Mount modal, Quick Mount modal, in-line Patrol/Disconnect drawer, MRO
 * modal, and Tank Detail modal, plus the mount-dropdown toggle.
 * Extracted verbatim from NiasTerminalView (lines 397-406).
 *
 * Phase 13 Target A: also absorbs the MRO defect form state + submit
 * handler (previously left behind in NiasTerminalView after mroModalTankNo
 * itself was extracted here) — same modal, same concern.
 */
export function useNiasTankModalTriggers({ markTankForMaintenance, setToastMessage }: UseNiasTankModalTriggersOptions) {
  const [mountModalBayId, setMountModalBayId] = useState<string | null>(null);
  const [quickMountTankNo, setQuickMountTankNo] = useState<string | null>(null);

  // In-Line Drawer States for Sub-Tab 3
  const [activeDrawerBayId, setActiveDrawerBayId] = useState<string | null>(null);
  const [activeDrawerType, setActiveDrawerType] = useState<'PATROL' | 'DISCONNECT' | null>(null);

  const [mroModalTankNo, setMroModalTankNo] = useState<string | null>(null);
  const [selectedDetailTank, setSelectedDetailTank] = useState<NiasTankAsset | null>(null);
  const [openMountDropdownTankId, setOpenMountDropdownTankId] = useState<string | null>(null);
  const [defectCat, setDefectCat] = useState<DefectCategory>('VALVE_LEAK');
  const [defectDesc, setDefectDesc] = useState<string>('');

  const handleMroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mroModalTankNo) return;
    markTankForMaintenance(mroModalTankNo, defectCat, 'NIAS_MRO_BAY', defectDesc || 'Field reported defect');
    setMroModalTankNo(null);
    setDefectDesc('');
    setToastMessage(`Tank ${mroModalTankNo} sent to Nias MRO Bay`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return {
    mountModalBayId,
    setMountModalBayId,
    quickMountTankNo,
    setQuickMountTankNo,
    activeDrawerBayId,
    setActiveDrawerBayId,
    activeDrawerType,
    setActiveDrawerType,
    mroModalTankNo,
    setMroModalTankNo,
    selectedDetailTank,
    setSelectedDetailTank,
    openMountDropdownTankId,
    setOpenMountDropdownTankId,
    defectCat,
    setDefectCat,
    defectDesc,
    setDefectDesc,
    handleMroSubmit,
  };
}

export default useNiasTankModalTriggers;
