// src/components/locations/nias/hooks/useNiasLd2VentModal.ts
import { useState } from 'react';
import { DailyMasterRecord } from '../../../../types/lng';
import { NiasTankAsset } from '../../NiasTerminalView';

interface UseNiasLd2VentModalOptions {
  setTankInventory: React.Dispatch<React.SetStateAction<NiasTankAsset[]>>;
  saveDailyInspectionRecord: (record: DailyMasterRecord) => void;
  setToastMessage: (msg: string | null) => void;
}

/**
 * Encapsulates LD-2 (ORU LD-2) BOG Vent & Status Modal state and handlers.
 * Extracted from NiasTerminalView (lines 423–433, 1590–1655).
 */
export function useNiasLd2VentModal({
  setTankInventory,
  saveDailyInspectionRecord,
  setToastMessage,
}: UseNiasLd2VentModalOptions) {
  // Modal target tank (null = closed)
  const [ld2VentModalTank, setLd2VentModalTank] = useState<NiasTankAsset | null>(null);

  // Form state
  const [ld2ModalPress, setLd2ModalPress] = useState<number>(0.22);
  const [ld2ModalTemp, setLd2ModalTemp] = useState<number>(-135.0);
  const [ld2ModalLevelMm, setLd2ModalLevelMm] = useState<number>(50);
  const [ld2ModalIsVenting, setLd2ModalIsVenting] = useState<boolean>(false);
  const [ld2ModalPreVentPress, setLd2ModalPreVentPress] = useState<number>(0.70);
  const [ld2ModalPostVentPress, setLd2ModalPostVentPress] = useState<number>(0.22);
  const [ld2ModalVentKg, setLd2ModalVentKg] = useState<number>(0);
  const [ld2ModalRemarks, setLd2ModalRemarks] = useState<string>('Normal heel holding in LD-2');
  const [ld2ModalOperator, setLd2ModalOperator] = useState<string>('FIELD OP-1');

  // Open modal and seed form from tank telemetry
  const handleOpenLd2VentModal = (tank: NiasTankAsset) => {
    setLd2VentModalTank(tank);
    setLd2ModalPress(tank.pressureMpa || 0.22);
    setLd2ModalTemp(tank.tempC ?? -135.0);
    const mm = tank.levelMmH2O || (tank.levelPercent ? Math.round((tank.levelPercent / 100) * 950) : 50);
    setLd2ModalLevelMm(mm);
    setLd2ModalIsVenting(false);
    setLd2ModalPreVentPress(tank.pressureMpa || 0.70);
    setLd2ModalPostVentPress(0.22);
    setLd2ModalVentKg(0);
    setLd2ModalRemarks('Normal heel holding in LD-2');
    setLd2ModalOperator('FIELD OP-1');
  };

  // Reset / close helper
  const closeLd2Modal = () => setLd2VentModalTank(null);

  // Save BOG vent log and update inventory
  const handleSaveLd2VentLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ld2VentModalTank) return;
    const tankId = ld2VentModalTank.id;
    const finalPress = ld2ModalIsVenting ? ld2ModalPostVentPress : ld2ModalPress;
    const calcVol = parseFloat(((ld2ModalLevelMm / 950) * 44.0).toFixed(1));
    const calcPct = parseFloat(((ld2ModalLevelMm / 950) * 100).toFixed(1));

    // Update local inventory
    setTankInventory((prev) =>
      prev.map((t) =>
        t.id === tankId
          ? {
              ...t,
              pressureMpa: finalPress,
              tempC: ld2ModalTemp,
              levelPercent: calcPct,
              levelM3: calcVol,
              levelMmH2O: ld2ModalLevelMm,
            }
          : t
      )
    );

    // Record into DailyMasterRecord
    const newRecord: DailyMasterRecord = {
      id: `LD2-VENT-${Date.now()}`,
      reportDate: new Date().toISOString().slice(0, 10),
      tankNo: tankId,
      serialNo: ld2VentModalTank.serialNo || 'UNKNOWN',
      shipment: ld2VentModalTank.shipment || 'N1',
      position: 'Laydown 2',
      level: calcPct,
      levelM3: calcVol,
      levelMmH2O: ld2ModalLevelMm,
      pressureMPa: finalPress,
      tempC: ld2ModalTemp,
      battery: ld2VentModalTank.batteryPercent || 100,
      remarks: `[LD-2 STAGING] ${ld2ModalRemarks} | Operator: ${ld2ModalOperator}${
        ld2ModalIsVenting
          ? ` | Venting: ${ld2ModalPreVentPress.toFixed(2)} \u27a1 ${ld2ModalPostVentPress.toFixed(2)} MPa (Loss: ${ld2ModalVentKg} kg)`
          : ''
      }`,
      depress: ld2ModalIsVenting ? 'Vented' : 'None',
      pressBeforeMPa: ld2ModalIsVenting ? ld2ModalPreVentPress : 0,
      pressAfterMPa: ld2ModalIsVenting ? ld2ModalPostVentPress : 0,
      lossesKg: ld2ModalIsVenting ? ld2ModalVentKg : 0,
      lossesPercent: ld2ModalIsVenting
        ? parseFloat(((ld2ModalVentKg / 18200) * 100).toFixed(2))
        : 0,
    };

    saveDailyInspectionRecord(newRecord);
    setToastMessage(`\ud83d\udcbe LD-2 Log & BOG Vent Saved for ${tankId}`);
    setLd2VentModalTank(null);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return {
    // Modal trigger
    ld2VentModalTank,
    setLd2VentModalTank,
    closeLd2Modal,

    // Form values
    ld2ModalPress,
    ld2ModalTemp,
    ld2ModalLevelMm,
    ld2ModalIsVenting,
    ld2ModalPreVentPress,
    ld2ModalPostVentPress,
    ld2ModalVentKg,
    ld2ModalRemarks,
    ld2ModalOperator,

    // Form setters
    setLd2ModalPress,
    setLd2ModalTemp,
    setLd2ModalLevelMm,
    setLd2ModalIsVenting,
    setLd2ModalPreVentPress,
    setLd2ModalPostVentPress,
    setLd2ModalVentKg,
    setLd2ModalRemarks,
    setLd2ModalOperator,

    // Handlers
    handleOpenLd2VentModal,
    handleSaveLd2VentLog,
  };
}
