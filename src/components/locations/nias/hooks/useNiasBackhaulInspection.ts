// src/components/locations/nias/hooks/useNiasBackhaulInspection.ts
import { useState } from 'react';
import { BackhaulDepartureMetrics } from '../../../../types/lng';
import { NiasTankAsset } from '../../NiasTerminalView';

interface UseNiasBackhaulInspectionOptions {
  selectedBackhaulTanks: Set<string>;
  authorizeBackhaulClearance: (tankNos: string[], metrics: BackhaulDepartureMetrics) => void;
  setTankInventory: React.Dispatch<React.SetStateAction<NiasTankAsset[]>>;
  setSelectedBackhaulTanks: React.Dispatch<React.SetStateAction<Set<string>>>;
  setToastMessage: (msg: string | null) => void;
}

/**
 * Encapsulates Stage 2: Pre-Backhaul Departure Inspection form state and submit handler.
 * Extracted from NiasTerminalView (lines 480–492, 1568–1594).
 */
export function useNiasBackhaulInspection({
  selectedBackhaulTanks,
  authorizeBackhaulClearance,
  setTankInventory,
  setSelectedBackhaulTanks,
  setToastMessage,
}: UseNiasBackhaulInspectionOptions) {
  // Modal open/close
  const [isBackhaulModalOpen, setIsBackhaulModalOpen] = useState<boolean>(false);

  // Form state
  const [stage2Date, setStage2Date] = useState<string>(
    () => new Date().toISOString().slice(0, 16).replace('T', ' ')
  );
  const [stage2LevelPct, setStage2LevelPct] = useState<number>(3.8);
  const [stage2MassKg, setStage2MassKg] = useState<number>(335);
  const [stage2PressureMPa, setStage2PressureMPa] = useState<number>(0.25);
  const [stage2TempC, setStage2TempC] = useState<number>(-132.5);
  const [stage2ManifestNo, setStage2ManifestNo] = useState<string>(
    () => `BHM-${new Date().toISOString().slice(0, 7).replace('-', '')}-003`
  );
  const [stage2VesselName, setStage2VesselName] = useState<string>('MV. Saviour');
  const [stage2ValvesSealed, setStage2ValvesSealed] = useState<boolean>(true);
  const [stage2PressureWithinLimit, setStage2PressureWithinLimit] = useState<boolean>(true);
  const [stage2VacuumIntact, setStage2VacuumIntact] = useState<boolean>(true);
  const [stage2Remarks, setStage2Remarks] = useState<string>(
    'Valves locked and sealed. Ready for backhaul voyage to Arun PAG.'
  );

  // Stage 2: Submit Pre-Backhaul Inspection Form
  const handleBackhaulModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tankNos = Array.from(selectedBackhaulTanks);
    if (tankNos.length === 0) return;

    authorizeBackhaulClearance(tankNos, {
      departureDate: stage2Date,
      departureLevelPct: stage2LevelPct,
      departureMassKg: stage2MassKg,
      departurePressureMPa: stage2PressureMPa,
      departureTempC: stage2TempC,
      manifestNo: stage2ManifestNo,
      vesselName: stage2VesselName,
      safetyClearance: stage2ValvesSealed && stage2PressureWithinLimit && stage2VacuumIntact,
      remarks: stage2Remarks,
    });

    setTankInventory((prev) => prev.filter((t) => !tankNos.includes(t.id)));
    setIsBackhaulModalOpen(false);
    setSelectedBackhaulTanks(new Set());
    setToastMessage(
      `Backhaul Manifest ${stage2ManifestNo} Certified: ${tankNos.length} tanks dispatched aboard ${stage2VesselName} -> Arun PAG`
    );
    setTimeout(() => setToastMessage(null), 4000);
  };

  return {
    // Modal trigger
    isBackhaulModalOpen,
    setIsBackhaulModalOpen,

    // Form values
    stage2Date,
    stage2MassKg,
    stage2PressureMPa,
    stage2TempC,
    stage2ManifestNo,
    stage2VesselName,
    stage2ValvesSealed,
    stage2PressureWithinLimit,
    stage2VacuumIntact,
    stage2Remarks,

    // Form setters
    setStage2Date,
    setStage2MassKg,
    setStage2PressureMPa,
    setStage2TempC,
    setStage2ManifestNo,
    setStage2VesselName,
    setStage2ValvesSealed,
    setStage2PressureWithinLimit,
    setStage2VacuumIntact,
    setStage2Remarks,

    // Submit handler
    handleBackhaulModalSubmit,
  };
}
