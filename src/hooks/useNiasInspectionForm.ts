// src/hooks/useNiasInspectionForm.ts
import React, { useState, useMemo, useEffect } from 'react';
import { DailyMasterRecord, FleetTankItem, SettlementLedgerEntry } from '../types/lng';
import { NiasTankAsset } from '../components/locations/NiasTerminalView';
import { calcVolumeFromMmH2O, calcPctFromMmH2O } from '../utils/tankPhysicsCalculations';

export interface UseNiasInspectionFormOptions {
  selectedDate: string;
  dailyMasterRecords: DailyMasterRecord[];
  fleetTanks: FleetTankItem[];
  tankInventory: NiasTankAsset[];
  settlementRecords: SettlementLedgerEntry[];
  masterInspectionList?: DailyMasterRecord[];
  setTankInventory: React.Dispatch<React.SetStateAction<NiasTankAsset[]>>;
  saveDailyInspectionRecord: (record: DailyMasterRecord) => void;
  setToastMessage?: (msg: string | null) => void;
  setSelectedTanks?: React.Dispatch<React.SetStateAction<Set<string>>>;
  getTankLossData?: (tankNo: string) => { lossKg: number; lossPct: number; shipment: string };
}

export function useNiasInspectionForm({
  selectedDate,
  dailyMasterRecords,
  fleetTanks,
  tankInventory,
  settlementRecords,
  masterInspectionList,
  setTankInventory,
  saveDailyInspectionRecord,
  setToastMessage,
  setSelectedTanks,
  getTankLossData,
}: UseNiasInspectionFormOptions) {
  // Modal / Target States
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState<boolean>(false);
  const [deletedRecordIds, setDeletedRecordIds] = useState<Set<string>>(new Set());
  const [recordToDelete, setRecordToDelete] = useState<{
    id: string;
    tankNo: string;
    serialNo: string;
    reportDate: string;
  } | null>(null);
  const [isWorkstationCollapsed, setIsWorkstationCollapsed] = useState<boolean>(false);

  // Full 14-Column Master DB Workstation Direct State
  const [wsReportDate, setWsReportDate] = useState<string>('2026-08-13');
  const [wsTankNo, setWsTankNo] = useState<string>('ISOT-014');
  const [wsSerialNo, setWsSerialNo] = useState<string>('SIMU-8101513');
  const [wsShipment, setWsShipment] = useState<string>('N1');
  const [wsSelectedZone, setWsSelectedZone] = useState<'LAYDOWN_1' | 'SKID' | 'LAYDOWN_2'>('LAYDOWN_1');
  const [wsSelectedZoneFilter, setWsSelectedZoneFilter] = useState<'LAYDOWN_1' | 'LAYDOWN_2'>('LAYDOWN_1');
  const [wsLevelPct, setWsLevelPct] = useState<number>(51);
  const [wsLevelM3, setWsLevelM3] = useState<number>(23.0);
  const [wsLevelMmH2O, setWsLevelMmH2O] = useState<number>(465);
  const [wsBattery, setWsBattery] = useState<number>(72);
  const [wsPressureMPa, setWsPressureMPa] = useState<number>(0.76);
  const [wsTempC, setWsTempC] = useState<number>(-126.7);
  const [wsBogVentedKg, setWsBogVentedKg] = useState<number>(0);
  const [wsPressBefore, setWsPressBefore] = useState<number>(0.80);
  const [wsPressAfter, setWsPressAfter] = useState<number>(0.73);
  const [wsEnableDepress, setWsEnableDepress] = useState<boolean>(false);
  const [wsRemarks, setWsRemarks] = useState<string>('Normal daily inspection');

  // Manual SMT Device Inputs
  const [wsSmtLevel, setWsSmtLevel] = useState<number>(51.5);
  const [wsSmtPress, setWsSmtPress] = useState<number>(0.76);
  const [wsSmtTemp, setWsSmtTemp] = useState<number>(-126.5);
  const [wsSmtBattery, setWsSmtBattery] = useState<number>(85);
  const [wsVentStartTime, setWsVentStartTime] = useState<string>('10:00');
  const [wsVentEndTime, setWsVentEndTime] = useState<string>('10:30');

  // Synchronize Workstation Report Date with selectedDate
  useEffect(() => {
    setWsReportDate(selectedDate);
  }, [selectedDate]);

  const resolveLoss = (tankNo: string) => {
    if (getTankLossData) return getTankLossData(tankNo);
    const s = settlementRecords.find((rec) => rec.tankNo === tankNo);
    return {
      lossKg: s?.lossesKg || 426,
      lossPct: s?.lossesPercent || 4.17,
      shipment: s?.shipment || 'N-1',
    };
  };

  const handleMmH2OChange = (mm: number) => {
    setWsLevelMmH2O(mm);
    const vol = calcVolumeFromMmH2O(mm);
    const pct = calcPctFromMmH2O(mm);
    setWsLevelPct(pct);
    setWsLevelM3(vol);
  };

  const handleLevelPctChange = (pct: number) => {
    setWsLevelPct(pct);
    const mm = Math.round((pct / 100) * 950);
    const vol = parseFloat(((pct / 100) * 44.0).toFixed(1));
    setWsLevelMmH2O(mm);
    setWsLevelM3(vol);
  };

  const handleLevelM3Change = (m3: number) => {
    setWsLevelM3(m3);
    const pct = parseFloat(((m3 / 44.0) * 100).toFixed(1));
    const mm = Math.round((m3 / 44.0) * 950);
    setWsLevelPct(pct);
    setWsLevelMmH2O(mm);
  };

  const wsActiveTank = useMemo(() => {
    return fleetTanks.find((t) => t.tankNo === wsTankNo);
  }, [fleetTanks, wsTankNo]);

  const wsActiveSettlement = useMemo(() => {
    return settlementRecords.find((s) => s.tankNo === wsTankNo);
  }, [settlementRecords, wsTankNo]);

  const wsTankDensity = wsActiveSettlement?.deliveredDensity || 426;

  // Quick Entry Available Tanks based on selected zone
  const quickEntryAvailableTanks = useMemo(() => {
    if (wsSelectedZone === 'LAYDOWN_1') {
      const yard1 = tankInventory.filter((t) => t.currentZone === 'LAYDOWN_1');
      return yard1.length > 0 ? yard1 : tankInventory;
    }
    if (wsSelectedZone === 'LAYDOWN_2') {
      const yard2 = tankInventory.filter((t) => t.currentZone === 'LAYDOWN_2');
      return yard2.length > 0 ? yard2 : tankInventory;
    }
    if (wsSelectedZone === 'SKID') {
      const bay = tankInventory.filter((t) => t.currentZone.startsWith('BAY'));
      return bay.length > 0 ? bay : tankInventory;
    }
    return tankInventory;
  }, [tankInventory, wsSelectedZone]);

  const handleSelectTankForQuickEntry = (tNo: string) => {
    const tank = tankInventory.find((t) => t.id === tNo);
    const existingLog = dailyMasterRecords.find((r) => r.tankNo === tNo && r.reportDate === wsReportDate);
    const loss = resolveLoss(tNo);

    setWsTankNo(tNo);
    setWsSerialNo(tank?.serialNo || 'SIMU-8101513');
    setWsShipment(tank?.shipment || loss.shipment || 'N1');

    if (tank?.currentZone === 'LAYDOWN_2') {
      setWsSelectedZone('LAYDOWN_2');
    } else if (tank?.currentZone?.startsWith('BAY')) {
      setWsSelectedZone('SKID');
    } else {
      setWsSelectedZone('LAYDOWN_1');
    }

    setWsLevelPct(existingLog?.level ?? tank?.levelPercent ?? 51);
    const resolvedMm = existingLog?.levelMmH2O ?? tank?.levelMmH2O ?? 465;
    setWsLevelMmH2O(resolvedMm);
    setWsLevelM3(calcVolumeFromMmH2O(resolvedMm));
    setWsPressureMPa(existingLog?.pressureMPa ?? tank?.pressureMpa ?? 0.76);
    setWsTempC(existingLog?.tempC ?? tank?.tempC ?? -126.7);
    setWsBogVentedKg(existingLog?.lossesKg ?? 0);
    setWsPressBefore(existingLog?.pressBeforeMPa ?? 0.80);
    setWsPressAfter(existingLog?.pressAfterMPa ?? (existingLog?.pressureMPa ?? tank?.pressureMpa ?? 0.73));

    // SMT Remote Sensor Telemetry
    setWsSmtPress(existingLog?.pressureMPa ?? tank?.pressureMpa ?? 0.76);
    setWsSmtLevel(existingLog?.level ?? tank?.levelPercent ?? 51.5);
    setWsSmtTemp(existingLog?.tempC ?? tank?.tempC ?? -126.5);
    setWsSmtBattery(existingLog?.battery ?? 85);

    setWsRemarks(existingLog?.remarks || 'Normal daily inspection');
  };

  const handleSaveQuickEntry = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalPress = wsPressureMPa;
    const zoneLabel = wsSelectedZone === 'LAYDOWN_2' ? 'Laydown 2' : wsSelectedZone === 'SKID' ? 'Bay 01' : 'Laydown 1';
    const deltaP = Math.max(0, parseFloat((wsPressBefore - wsPressAfter).toFixed(3)));
    const calculatedLossKg = deltaP > 0 ? Math.round(deltaP * 100 * 25.5) : (wsBogVentedKg || 0);
    const isVentingDone = calculatedLossKg > 0;
    const ventTimeStr = isVentingDone && wsVentStartTime && wsVentEndTime ? ` [${wsVentStartTime}~${wsVentEndTime}]` : '';

    const newRecord: DailyMasterRecord = {
      id: `DM-${wsReportDate}-${wsTankNo}-${Date.now()}`,
      reportDate: wsReportDate,
      serialNo: wsSerialNo,
      tankNo: wsTankNo,
      shipment: wsShipment,
      position: zoneLabel,
      level: wsSmtLevel || wsLevelPct,
      levelM3: wsLevelM3,
      levelMmH2O: wsLevelMmH2O,
      battery: wsSmtBattery || wsBattery || 85,
      pressureMPa: wsPressureMPa || wsSmtPress || finalPress,
      tempC: wsSmtTemp || wsTempC,
      depress: isVentingDone ? 'Depressurized' : 'Normal',
      pressBeforeMPa: wsPressBefore || wsPressureMPa,
      pressAfterMPa: wsPressAfter || (isVentingDone ? parseFloat(Math.max(0.2, wsPressureMPa - (calculatedLossKg / 2550)).toFixed(2)) : wsPressureMPa),
      remarks: wsRemarks || (isVentingDone ? `BOG Vented ${calculatedLossKg} kg${ventTimeStr} (ΔP: ${deltaP.toFixed(2)} MPa, ${wsPressBefore} -> ${wsPressAfter} MPa)` : 'Daily Inspection Entry'),
      lossesKg: calculatedLossKg,
      lossesPercent: calculatedLossKg > 0 ? parseFloat(((calculatedLossKg / 18500) * 100).toFixed(2)) : 0,
    };

    saveDailyInspectionRecord(newRecord);

    setTankInventory((prev) =>
      prev.map((t) =>
        t.id === wsTankNo
          ? {
            ...t,
            pressureMpa: wsPressureMPa || wsSmtPress || newRecord.pressureMPa,
            levelPercent: wsSmtLevel || wsLevelPct,
            levelM3: wsLevelM3,
            levelMmH2O: wsLevelMmH2O,
            tempC: wsSmtTemp || wsTempC,
          }
          : t
      )
    );

    if (setToastMessage) {
      setToastMessage(`✅ Committed inspection & BOG log for ${wsTankNo} to Master DB`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleEditRow = (record: DailyMasterRecord) => {
    setWsReportDate(record.reportDate || selectedDate);
    setWsTankNo(record.tankNo);
    setWsSerialNo(record.serialNo);
    setWsShipment(record.shipment || 'N1');
    const pos = (record.position || '').toLowerCase();
    if (pos.includes('2') || pos.includes('yard 2') || pos.includes('ld-2')) setWsSelectedZone('LAYDOWN_2');
    else if (pos.includes('bay') || pos.includes('skid')) setWsSelectedZone('SKID');
    else setWsSelectedZone('LAYDOWN_1');
    setWsLevelMmH2O(record.levelMmH2O || (record.level ? Math.round((record.level / 100) * 950) : 465));
    setWsLevelM3(record.levelM3 || calcVolumeFromMmH2O(record.levelMmH2O || 465));
    setWsLevelPct(record.level || 50);
    setWsPressureMPa(record.pressureMPa || 0.76);
    setWsSmtPress(record.pressureMPa || 0.76);
    setWsSmtLevel(record.level || 50);
    setWsSmtTemp(record.tempC || -126.5);
    setWsSmtBattery(record.battery || 85);
    setWsTempC(record.tempC || -126.7);
    setWsBogVentedKg(record.lossesKg || 0);
    setWsPressBefore(record.pressBeforeMPa || 0.80);
    setWsPressAfter(record.pressAfterMPa || 0.73);
    setWsRemarks(record.remarks || '');
    setIsQuickEntryOpen(true);
  };

  const handleDeleteRow = (recordId: string, tankNo: string) => {
    setDeletedRecordIds((prev) => new Set(prev).add(recordId));
    if (setToastMessage) {
      setToastMessage(`🗑️ Deleted record for ${tankNo}`);
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  const handleConfirmDeleteRecord = () => {
    if (!recordToDelete) return;
    setDeletedRecordIds((prev) => new Set(prev).add(recordToDelete.id));
    if (setToastMessage) {
      setToastMessage(`🗑️ Deleted record for ${recordToDelete.tankNo} (${recordToDelete.reportDate})`);
      setTimeout(() => setToastMessage(null), 2500);
    }
    setRecordToDelete(null);
  };

  // Calculated Live BOG Loss in Workstation
  const wsDeltaP = useMemo(() => {
    if (wsEnableDepress && wsPressBefore > wsPressAfter && wsPressAfter > 0) {
      return parseFloat((wsPressBefore - wsPressAfter).toFixed(2));
    }
    return 0;
  }, [wsPressBefore, wsPressAfter, wsEnableDepress]);

  const wsCalculatedLossKg = useMemo(() => {
    if (wsDeltaP > 0) {
      return Math.round(wsDeltaP * (wsTankDensity / 426) * 6000);
    }
    return 0;
  }, [wsDeltaP, wsTankDensity]);

  const wsInitialLoadedMass = wsActiveSettlement?.deliveredWeightKg || 18500;

  const wsCalculatedLossPct = useMemo(() => {
    if (wsCalculatedLossKg > 0) {
      if (wsInitialLoadedMass > 0) {
        return parseFloat(((wsCalculatedLossKg / wsInitialLoadedMass) * 100).toFixed(2));
      }
    }
    return 0;
  }, [wsCalculatedLossKg, wsInitialLoadedMass]);

  const handleSelectTankForWorkstation = (tNo: string) => {
    const tank = tankInventory.find((t) => t.id === tNo);
    const existingLog =
      dailyMasterRecords.find((r) => r.tankNo === tNo && r.reportDate === wsReportDate) ||
      dailyMasterRecords.find((r) => r.tankNo === tNo);
    const loss = resolveLoss(tNo);

    setWsTankNo(tNo);
    if (setSelectedTanks) {
      setSelectedTanks(new Set([tNo]));
    }

    if (tank) {
      if (tank.currentZone === 'LAYDOWN_1') setWsSelectedZoneFilter('LAYDOWN_1');
      else if (tank.currentZone === 'LAYDOWN_2') setWsSelectedZoneFilter('LAYDOWN_2');
    }

    setWsSerialNo(tank?.serialNo || 'SIMU-8101513');
    setWsShipment(tank?.shipment || loss.shipment || 'N1');
    setWsLevelPct(tank?.levelPercent ?? 51);
    setWsLevelM3(tank?.levelM3 ?? 23.0);
    setWsLevelMmH2O(tank?.levelMmH2O ?? 465);
    setWsBattery(tank?.batteryPercent ?? 72);
    setWsPressureMPa(tank?.pressureMpa ?? 0.76);
    setWsTempC(tank?.tempC ?? -126.7);

    // Auto-populate SMT with actual tank values for realism
    setWsSmtLevel(tank?.levelPercent || 0);
    setWsSmtPress(tank?.pressureMpa || 0);
    setWsSmtTemp(tank?.tempC || 0);
    setWsSmtBattery(tank?.batteryPercent || 0);

    setWsPressBefore(existingLog?.pressBeforeMPa ?? (tank?.pressureMpa || 0.80));
    setWsPressAfter(existingLog?.pressAfterMPa ?? 0.73);
    setWsRemarks(existingLog?.remarks || 'Normal daily inspection');
  };

  // Submit Daily Inspection & Depress Workstation
  const handleSaveDailyInspection = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalPress =
      (wsEnableDepress && wsPressBefore > wsPressAfter && wsPressAfter > 0) ? wsPressAfter : wsPressureMPa;

    const newRecord: DailyMasterRecord = {
      id: `DM-${wsReportDate}-${wsTankNo}-${Date.now()}`,
      reportDate: wsReportDate,
      serialNo: wsSerialNo,
      tankNo: wsTankNo,
      shipment: wsShipment,
      position: wsActiveTank?.position || 'Laydown 1',
      level: wsLevelPct,
      levelM3: wsLevelM3,
      levelMmH2O: wsLevelMmH2O,
      battery: wsBattery,
      pressureMPa: finalPress,
      tempC: wsTempC,
      depress: (wsEnableDepress && wsPressBefore > wsPressAfter && wsPressAfter > 0) ? 'Depressurized' : 'None',
      pressBeforeMPa: wsEnableDepress ? wsPressBefore : 0,
      pressAfterMPa: wsEnableDepress ? wsPressAfter : 0,
      remarks: wsRemarks,
      lossesKg: wsCalculatedLossKg,
      lossesPercent: wsCalculatedLossPct,
    };

    saveDailyInspectionRecord(newRecord);
    if (setToastMessage) {
      setToastMessage(`Saved & Committed 14-Column Daily Log for ${wsTankNo} (${wsReportDate})`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Reset Workstation
  const handleResetWorkstation = () => {
    handleSelectTankForWorkstation(wsTankNo);
    if (setToastMessage) {
      setToastMessage('Workstation form reset to saved DB values');
      setTimeout(() => setToastMessage(null), 2000);
    }
  };

  // Quick 1-Click Depress for any row or tank
  const handleQuickDepress = (recordOrTankNo: DailyMasterRecord | string) => {
    let record: DailyMasterRecord;
    if (typeof recordOrTankNo === 'string') {
      const tankNo = recordOrTankNo;
      const foundTank = fleetTanks.find((t) => t.tankNo === tankNo);
      const existing =
        masterInspectionList?.find((r) => r.tankNo === tankNo) ||
        dailyMasterRecords.find((r) => r.tankNo === tankNo);
      record = existing || {
        id: `DM-${selectedDate}-${tankNo}`,
        reportDate: selectedDate,
        serialNo: foundTank?.serialNo || 'ISOT-SIM',
        tankNo: tankNo,
        shipment: 'N1',
        position: foundTank?.position || 'Laydown 2',
        level: foundTank?.level || 90,
        levelM3: foundTank?.levelM3 || 40.5,
        levelMmH2O: foundTank?.levelMmH2O || 500,
        battery: foundTank?.battery || 95,
        pressureMPa: foundTank?.pressureMPa || 0.80,
        tempC: foundTank?.tempC || -126.7,
        depress: 'Depress Active',
        pressBeforeMPa: foundTank?.pressBeforeMPa || 0.80,
        pressAfterMPa: 0.73,
        remarks: 'Manual quick depress from Yard 2 map',
        lossesKg: 385,
        lossesPercent: 2.1,
      };
    } else {
      record = recordOrTankNo;
    }

    const pressBefore = record.pressureMPa > 0.74 ? record.pressureMPa : 0.80;
    const pressAfter = 0.73;
    const delta = parseFloat((pressBefore - pressAfter).toFixed(2));
    const lossKg = Math.round(delta * 5500);
    const lossPct = parseFloat(((lossKg / 18500) * 100).toFixed(2));

    const updated: DailyMasterRecord = {
      ...record,
      pressureMPa: pressAfter,
      depress: 'Depressurized',
      pressBeforeMPa: pressBefore,
      pressAfterMPa: pressAfter,
      lossesKg: lossKg,
      lossesPercent: lossPct,
      remarks: `Quick Depress: ${pressBefore} ➔ ${pressAfter} MPa (ΔP: ${delta} MPa)`,
    };

    saveDailyInspectionRecord(updated);
    if (setToastMessage) {
      setToastMessage(
        `Quick Depressurized ${record.tankNo}: ${pressBefore} ➔ ${pressAfter} MPa (${lossKg} kg BOG vented)`
      );
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return {
    isQuickEntryOpen,
    setIsQuickEntryOpen,
    deletedRecordIds,
    setDeletedRecordIds,
    recordToDelete,
    setRecordToDelete,
    isWorkstationCollapsed,
    setIsWorkstationCollapsed,
    wsReportDate,
    setWsReportDate,
    wsTankNo,
    setWsTankNo,
    wsSerialNo,
    setWsSerialNo,
    wsShipment,
    setWsShipment,
    wsSelectedZone,
    setWsSelectedZone,
    wsSelectedZoneFilter,
    setWsSelectedZoneFilter,
    wsLevelPct,
    setWsLevelPct,
    wsLevelM3,
    setWsLevelM3,
    wsLevelMmH2O,
    setWsLevelMmH2O,
    wsBattery,
    setWsBattery,
    wsPressureMPa,
    setWsPressureMPa,
    wsTempC,
    setWsTempC,
    wsBogVentedKg,
    setWsBogVentedKg,
    wsPressBefore,
    setWsPressBefore,
    wsPressAfter,
    setWsPressAfter,
    wsEnableDepress,
    setWsEnableDepress,
    wsRemarks,
    setWsRemarks,
    wsSmtLevel,
    setWsSmtLevel,
    wsSmtPress,
    setWsSmtPress,
    wsSmtTemp,
    setWsSmtTemp,
    wsSmtBattery,
    setWsSmtBattery,
    wsVentStartTime,
    setWsVentStartTime,
    wsVentEndTime,
    setWsVentEndTime,
    handleMmH2OChange,
    handleLevelPctChange,
    handleLevelM3Change,
    wsActiveTank,
    wsActiveSettlement,
    wsTankDensity,
    quickEntryAvailableTanks,
    handleSelectTankForQuickEntry,
    handleSaveQuickEntry,
    handleEditRow,
    handleDeleteRow,
    handleConfirmDeleteRecord,
    wsDeltaP,
    wsCalculatedLossKg,
    wsInitialLoadedMass,
    wsCalculatedLossPct,
    handleSelectTankForWorkstation,
    handleSaveDailyInspection,
    handleResetWorkstation,
    handleQuickDepress,
  };
}
