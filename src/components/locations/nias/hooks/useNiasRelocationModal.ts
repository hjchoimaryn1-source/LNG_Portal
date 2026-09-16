// src/components/locations/nias/hooks/useNiasRelocationModal.ts
//
// PURPOSE
//   Interactive Tank Relocation Modal (Method A) — state + confirm handler,
//   extracted verbatim from NiasTerminalView.tsx (Phase 13 Target A, no
//   logic change).

import { useState } from 'react';
import { FleetTankItem } from '../../../../types/lng';
import { NiasTankAsset } from '../../NiasTerminalView';

export interface NiasRelocationConfirmData {
  tankNo: string;
  origin: string;
  targetZone: string;
  slotNumber: number;
  heelPct: number;
  heelPressMPa: number;
  heelTempC: number;
  heelWeightKg: number;
  remarks: string;
}

export interface UseNiasRelocationModalOptions {
  setTankInventory: React.Dispatch<React.SetStateAction<NiasTankAsset[]>>;
  moveTankLocation: (tankNo: string, targetZone: string, slotNumber?: number, metadata?: any) => void;
  setEventStream: React.Dispatch<
    React.SetStateAction<Array<{ id: string; time: string; text: string; tag: string; tagColor: string }>>
  >;
  setToastMessage: (msg: string | null) => void;
}

export function useNiasRelocationModal({
  setTankInventory,
  moveTankLocation,
  setEventStream,
  setToastMessage,
}: UseNiasRelocationModalOptions) {
  const [relocateModalTank, setRelocateModalTank] = useState<FleetTankItem | null>(null);

  const handleConfirmRelocation = (data: NiasRelocationConfirmData) => {
    const { tankNo, origin, targetZone, slotNumber, heelPct, heelPressMPa, heelTempC, heelWeightKg, remarks } = data;
    const targetZoneEnum = targetZone === 'Laydown 2' || targetZone === 'Laydown 3' ? 'LAYDOWN_2' : 'LAYDOWN_1';
    setTankInventory(prev => prev.map(t => t.id === tankNo ? { ...t, currentZone: targetZoneEnum, slotIndex: slotNumber } : t));

    moveTankLocation(tankNo, targetZone, slotNumber, {
      heelLevelPct: heelPct,
      heelPressureMPa: heelPressMPa,
      heelTempC: heelTempC,
      heelWeightKg: heelWeightKg,
      remarks: remarks || `Relocated from ${origin} to ${targetZone}`,
    });

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setEventStream((prev) => [
      {
        id: `ev-${Date.now()}`,
        time: nowTime,
        text: `[${tankNo}] Relocated from ${origin} ➔ ${targetZone} (Slot ${slotNumber})`,
        tag: 'RELOCATED',
        tagColor: 'text-slate-950 font-bold',
      },
      ...prev,
    ]);

    setToastMessage(`✅ ${tankNo} relocated to ${targetZone} (Slot ${slotNumber})`);
    setRelocateModalTank(null);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return {
    relocateModalTank,
    setRelocateModalTank,
    handleConfirmRelocation,
  };
}

export default useNiasRelocationModal;
