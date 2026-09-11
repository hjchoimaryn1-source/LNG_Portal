// src/components/locations/nias/hooks/useNiasTankModalTriggers.ts
import { useState } from 'react';
import { NiasTankAsset } from '../../NiasTerminalView';

/**
 * Encapsulates the modal/drawer trigger state group used to open the Bay
 * Mount modal, Quick Mount modal, in-line Patrol/Disconnect drawer, MRO
 * modal, and Tank Detail modal, plus the mount-dropdown toggle.
 * Extracted verbatim from NiasTerminalView (lines 397-406).
 */
export function useNiasTankModalTriggers() {
  const [mountModalBayId, setMountModalBayId] = useState<string | null>(null);
  const [quickMountTankNo, setQuickMountTankNo] = useState<string | null>(null);

  // In-Line Drawer States for Sub-Tab 3
  const [activeDrawerBayId, setActiveDrawerBayId] = useState<string | null>(null);
  const [activeDrawerType, setActiveDrawerType] = useState<'PATROL' | 'DISCONNECT' | null>(null);

  const [mroModalTankNo, setMroModalTankNo] = useState<string | null>(null);
  const [selectedDetailTank, setSelectedDetailTank] = useState<NiasTankAsset | null>(null);
  const [openMountDropdownTankId, setOpenMountDropdownTankId] = useState<string | null>(null);

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
  };
}

export default useNiasTankModalTriggers;
