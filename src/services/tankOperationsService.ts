// src/services/tankOperationsService.ts
import {
  ActiveBayState,
  BackhaulDepartureMetrics,
  DailyMasterRecord,
  DefectCategory,
  FleetTankItem,
  MaintenanceLocation,
  NodeState,
  OffloadHeelMetrics,
} from '../types/lng';

export interface TankRelocationParams {
  heelLevelPct?: number;
  heelPressureMPa?: number;
  heelTempC?: number;
  heelWeightKg?: number;
  depressActive?: boolean;
  remarks?: string;
}

export interface AddDepressPayload {
  tankNo: string;
  pressBeforeMPa: number;
  pressAfterMPa: number;
  date?: string;
  ventDurationMin?: number;
  lossesKg?: number;
  lossesPercent?: number;
  remarks: string;
}

export function validateInspectionRecord(record: Partial<DailyMasterRecord>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (record.level !== undefined && (record.level < 0 || record.level > 100)) {
    errors.push('Level must be between 0% and 100%');
  }
  if (record.pressureMPa !== undefined && record.pressureMPa < 0) {
    errors.push('Pressure must be >= 0 MPa');
  }
  if (record.tempC !== undefined && (record.tempC < -170 || record.tempC > 60)) {
    errors.push('Temperature must be between -170°C and 60°C');
  }
  return { isValid: errors.length === 0, errors };
}

export function applyTankUpdate(
  prev: FleetTankItem[],
  tankNo: string,
  updatedFields: Partial<FleetTankItem>
): FleetTankItem[] {
  return prev.map((t) => (t.tankNo === tankNo ? { ...t, ...updatedFields } : t));
}

export function applyBayTelemetryUpdate(
  prevBays: ActiveBayState[],
  tankNo: string,
  updatedFields: Partial<FleetTankItem>
): ActiveBayState[] {
  return prevBays.map((bay) => {
    if (bay.tankNo === tankNo) {
      return {
        ...bay,
        pressure: updatedFields.pressureMPa ?? bay.pressure,
        temp: updatedFields.tempC ?? bay.temp,
        level: updatedFields.level ?? bay.level,
      };
    }
    return bay;
  });
}

export function applyMountTankToBay(
  prevBays: ActiveBayState[],
  targetTank: FleetTankItem,
  bayId: string
): ActiveBayState[] {
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return prevBays.map((bay) => {
    if (bay.bayId === bayId) {
      return {
        ...bay,
        tankNo: targetTank.tankNo,
        serialNo: targetTank.serialNo,
        pressure: targetTank.pressureMPa || 0.78,
        temp: targetTank.tempC || -126.5,
        level: targetTank.level || 60,
        flowRate: 1700.0,
        status: 'RUNNING',
        startTime: timeStr,
      };
    }
    if (bay.tankNo === targetTank.tankNo) {
      return {
        ...bay,
        tankNo: null,
        serialNo: undefined,
        pressure: 0.0,
        temp: 28.0,
        level: 0,
        flowRate: 0.0,
        status: 'STANDBY',
        totalVaporizedM3: 0.0,
      };
    }
    return bay;
  });
}

export function applyUnmountBay(
  prevBays: ActiveBayState[],
  bayId: string
): { updatedBays: ActiveBayState[]; unmountedTankNo: string | null } {
  const currentBay = prevBays.find((b) => b.bayId === bayId);
  const unmountedTankNo = currentBay?.tankNo || null;

  const updatedBays = prevBays.map((bay) => {
    if (bay.bayId === bayId) {
      return {
        ...bay,
        tankNo: null,
        serialNo: undefined,
        pressure: 0,
        temp: 28.0,
        level: 0,
        flowRate: 0,
        status: 'DISCONNECTED' as const,
        startTime: undefined,
      };
    }
    return bay;
  });

  return { updatedBays, unmountedTankNo };
}

export function applyToggleBayRunning(
  prevBays: ActiveBayState[],
  bayId: string
): ActiveBayState[] {
  return prevBays.map((bay) => {
    if (bay.bayId === bayId) {
      const nextStatus = bay.status === 'RUNNING' ? 'STANDBY' : 'RUNNING';
      return {
        ...bay,
        status: nextStatus,
        flowRate: nextStatus === 'RUNNING' ? 2.3 : 0.0,
      };
    }
    return bay;
  });
}

export function calculateTankRelocation(
  fleetTanks: FleetTankItem[],
  activeBays: ActiveBayState[],
  tankIdOrNo: string,
  newZone: string,
  slotNumber?: number,
  params?: TankRelocationParams
): {
  targetTankNo: string;
  mountToBayId?: string;
  disconnectBayId?: string;
  tankUpdatePayload?: Partial<FleetTankItem>;
} | null {
  const targetTank = fleetTanks.find((t) => t.tankNo === tankIdOrNo || t.serialNo === tankIdOrNo);
  if (!targetTank) return null;
  const tankNo = targetTank.tankNo;

  const isBayTarget =
    newZone.startsWith('Bay') ||
    newZone.startsWith('BAY') ||
    newZone.toLowerCase().includes('bay') ||
    newZone === 'FOUR_BAY_REGAS';

  if (isBayTarget) {
    const matchedBay =
      activeBays.find((b) => newZone.includes(b.bayId) || b.bayId === newZone) ||
      activeBays.find((b) => !b.tankNo) ||
      activeBays[0];

    if (matchedBay) {
      return { targetTankNo: tankNo, mountToBayId: matchedBay.bayId };
    }
  }

  let disconnectBayId: string | undefined;
  const mountedBay = activeBays.find((b) => b.tankNo === tankNo);
  if (mountedBay) {
    disconnectBayId = mountedBay.bayId;
  }

  if (
    newZone.toLowerCase().includes('laydown 1') ||
    newZone.toLowerCase().includes('yard 1') ||
    newZone === 'LAYDOWN_1'
  ) {
    return {
      targetTankNo: tankNo,
      disconnectBayId,
      tankUpdatePayload: {
        node: NodeState.NODE_3_NIAS_LAYDOWN_YARD,
        position: slotNumber ? `Laydown 1 (Slot ${slotNumber})` : 'Laydown 1',
        isMountedToBay: null,
        location: 'ORU NIAS',
        remarks: params?.remarks || 'Relocated to Laydown Yard 1 (Receiving & BOG Buffer)',
      },
    };
  }

  if (
    newZone.toLowerCase().includes('laydown 2') ||
    newZone.toLowerCase().includes('yard 2') ||
    newZone === 'LAYDOWN_2' ||
    newZone.toLowerCase().includes('laydown 3') ||
    newZone === 'LAYDOWN_3'
  ) {
    const updatePayload: Partial<FleetTankItem> = {
      node: NodeState.NODE_5_EMPTY_RETURN_CYCLE,
      position: slotNumber ? `Laydown 2 (Slot ${slotNumber})` : 'Laydown 2',
      isMountedToBay: null,
      location: 'ORU NIAS',
      remarks: params?.remarks || `Relocated to Laydown Yard 2${slotNumber ? ` (Slot ${slotNumber})` : ''}`,
    };

    if (params?.heelLevelPct !== undefined) {
      updatePayload.level = params.heelLevelPct;
      updatePayload.levelM3 = parseFloat(((params.heelLevelPct / 100) * 45).toFixed(1));
    }
    if (params?.heelPressureMPa !== undefined) {
      updatePayload.pressureMPa = params.heelPressureMPa;
    }
    if (params?.heelTempC !== undefined) {
      updatePayload.tempC = params.heelTempC;
    }

    return { targetTankNo: tankNo, disconnectBayId, tankUpdatePayload: updatePayload };
  }

  return {
    targetTankNo: tankNo,
    disconnectBayId,
    tankUpdatePayload: {
      position: newZone,
      isMountedToBay: null,
      location: 'ORU NIAS',
      remarks: params?.remarks || `Relocated to ${newZone}`,
    },
  };
}

export function applyBatchTransitionTanks(
  prev: FleetTankItem[],
  tankNos: string[],
  targetNode: NodeState
): FleetTankItem[] {
  return prev.map((t) => {
    if (tankNos.includes(t.tankNo)) {
      let newLocation = t.location;
      let newPosition = t.position;
      if (targetNode === NodeState.NODE_1_ARUN_PAG_TERMINAL) {
        newLocation = 'Aceh';
        newPosition = 'LAYDOWN PAG';
      } else if (targetNode === NodeState.NODE_2_MV_SAVIOUR_TRANSIT) {
        newLocation = 'Ship';
        newPosition = 'MV. SAVIOUR';
      } else if (targetNode === NodeState.NODE_3_NIAS_LAYDOWN_YARD) {
        newLocation = 'ORU NIAS';
        newPosition = 'LAYDOWN 1';
      } else if (targetNode === NodeState.NODE_4_REGAS_ACTIVE_BAY) {
        newLocation = 'ORU NIAS';
        newPosition = 'REGAS BAY';
      } else if (targetNode === NodeState.NODE_5_EMPTY_RETURN_CYCLE) {
        newLocation = 'ORU NIAS';
        newPosition = 'LAYDOWN 1 (EMPTY)';
      }
      return {
        ...t,
        node: targetNode,
        location: newLocation,
        position: newPosition,
        isUnderMaintenance: false,
      };
    }
    return t;
  });
}

export function applyMarkTankForMaintenance(
  prevTanks: FleetTankItem[],
  prevBays: ActiveBayState[],
  tankNo: string,
  defect: DefectCategory,
  location: MaintenanceLocation,
  desc: string
): { updatedTanks: FleetTankItem[]; updatedBays: ActiveBayState[] } {
  const updatedBays = prevBays.map((bay) => {
    if (bay.tankNo === tankNo) {
      return {
        ...bay,
        tankNo: null,
        serialNo: undefined,
        pressure: 0,
        temp: 28.0,
        level: 0,
        flowRate: 0,
        status: 'DISCONNECTED' as const,
      };
    }
    return bay;
  });

  const nowStr = new Date().toLocaleString([], {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const updatedTanks = prevTanks.map((t) => {
    if (t.tankNo === tankNo) {
      return {
        ...t,
        node: NodeState.NODE_MAINTENANCE_MRO,
        isUnderMaintenance: true,
        defectCategory: defect,
        maintenanceLocation: location,
        defectDescription: desc,
        repairStartedAt: nowStr,
        location: location === 'ARUN_WORKSHOP' ? 'Aceh' : 'ORU NIAS',
        position: location === 'ARUN_WORKSHOP' ? 'ARUN MRO WORKSHOP' : 'NIAS MRO BAY',
        isMountedToBay: null,
      };
    }
    return t;
  });

  return { updatedTanks, updatedBays };
}

export function applyReleaseTankFromMaintenance(
  prev: FleetTankItem[],
  tankNo: string,
  targetNode: NodeState
): FleetTankItem[] {
  return prev.map((t) => {
    if (t.tankNo === tankNo) {
      let newLocation = 'Aceh';
      let newPosition = 'LAYDOWN PAG';
      if (targetNode === NodeState.NODE_3_NIAS_LAYDOWN_YARD) {
        newLocation = 'ORU NIAS';
        newPosition = 'LAYDOWN 1';
      } else if (targetNode === NodeState.NODE_1_ARUN_PAG_TERMINAL) {
        newLocation = 'Aceh';
        newPosition = 'LAYDOWN PAG';
      }

      return {
        ...t,
        node: targetNode,
        isUnderMaintenance: false,
        defectCategory: undefined,
        maintenanceLocation: undefined,
        defectDescription: undefined,
        repairStartedAt: undefined,
        location: newLocation,
        position: newPosition,
        remarks: 'Released from MRO - Inspection Certified',
      };
    }
    return t;
  });
}

export function applyAuthorizeBackhaulClearance(
  prev: FleetTankItem[],
  tankNos: string[],
  metrics: BackhaulDepartureMetrics
): FleetTankItem[] {
  return prev.map((t) => {
    if (tankNos.includes(t.tankNo)) {
      return {
        ...t,
        node: NodeState.NODE_2_MV_SAVIOUR_TRANSIT,
        location: 'Ship',
        position: 'MV. Saviour (Backhaul)',
        level: metrics.departureLevelPct,
        pressureMPa: metrics.departurePressureMPa,
        tempC: metrics.departureTempC,
        backhaulDepartureMetrics: metrics,
        remarks:
          metrics.remarks ||
          `Authorized for MV. Saviour backhaul manifest ${metrics.manifestNo} (${metrics.departureMassKg} kg heel, ${metrics.departurePressureMPa} MPa)`,
      };
    }
    return t;
  });
}

export function buildInspectionRecordWithMeta(
  record: DailyMasterRecord
): DailyMasterRecord {
  const localTimeWib = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Jakarta' }) + ' WIB';
  return {
    ...record,
    remarks: record.remarks ? `${record.remarks} [Logged: ${localTimeWib}]` : `Field Log [${localTimeWib}]`,
  };
}

export function processDailyInspectionEntry(
  record: DailyMasterRecord,
  prevRecords: DailyMasterRecord[]
): {
  nextRecords: DailyMasterRecord[];
  tankUpdates: Partial<FleetTankItem>;
  depressPayload?: AddDepressPayload;
} {
  const validation = validateInspectionRecord(record);
  if (!validation.isValid) {
    console.warn('Inspection record validation warnings:', validation.errors);
  }

  const recordWithMeta = buildInspectionRecordWithMeta(record);

  const existingIdx = prevRecords.findIndex(
    (r) => r.tankNo === record.tankNo && r.reportDate === record.reportDate
  );
  let nextRecords: DailyMasterRecord[];
  if (existingIdx >= 0) {
    nextRecords = [...prevRecords];
    nextRecords[existingIdx] = { ...nextRecords[existingIdx], ...recordWithMeta };
  } else {
    const newRec: DailyMasterRecord = {
      ...recordWithMeta,
      id: record.id || `DM-${record.reportDate}-${record.tankNo}-${Date.now()}`,
    };
    nextRecords = [newRec, ...prevRecords];
  }

  const tankUpdates: Partial<FleetTankItem> = {
    position: record.position,
    level: record.level,
    levelM3: record.levelM3,
    levelMmH2O: record.levelMmH2O,
    battery: record.battery,
    pressureMPa:
      record.pressAfterMPa > 0 && record.depress.toLowerCase().includes('depress')
        ? record.pressAfterMPa
        : record.pressureMPa,
    tempC: record.tempC,
    depress: record.depress,
    pressBeforeMPa: record.pressBeforeMPa,
    pressAfterMPa: record.pressAfterMPa,
    remarks: record.remarks,
    lastReportDate: record.reportDate,
  };

  let depressPayload: AddDepressPayload | undefined;
  if (
    record.depress.toLowerCase().includes('depress') ||
    (record.pressBeforeMPa > 0 &&
      record.pressAfterMPa > 0 &&
      record.pressBeforeMPa > record.pressAfterMPa)
  ) {
    const deltaP = Math.max(0, record.pressBeforeMPa - record.pressAfterMPa);
    const lossKg = record.lossesKg || Math.round(deltaP * 5500) || 426;
    const lossPct =
      record.lossesPercent || parseFloat(((lossKg / 18500) * 100).toFixed(2)) || 2.3;

    depressPayload = {
      tankNo: record.tankNo,
      pressBeforeMPa: record.pressBeforeMPa,
      pressAfterMPa: record.pressAfterMPa,
      lossesKg: lossKg,
      lossesPercent: lossPct,
      remarks: record.remarks || `Controlled BOG Venting (${record.pressBeforeMPa} ➔ ${record.pressAfterMPa} MPa)`,
    };
  }

  return { nextRecords, tankUpdates, depressPayload };
}
