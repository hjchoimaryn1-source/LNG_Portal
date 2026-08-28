// src/components/locations/arun/ArunLoadingCoqTab.tsx
"use client";

import React, { useState, useMemo, useCallback } from 'react';
import {
  Calculator,
  FileCheck,
  Atom,
  Boxes,
  Weight,
  Search,
  Sparkles,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { usePortalData } from '../../../context/PortalDataContext';
import { NodeState } from '../../../types/lng';
import { exportToCSV } from '../../../utils/exportCsv';
import { FleetTankItem, getTankPhysicalMetrics, LNG_LIQUID_DENSITY_KG_M3 } from '../../../data/mockTankData';
import { sortTanksNaturally } from '../../../utils/scadaCalculations';

export interface CustodyRecord {
  tankNo: string;
  cargoNo: string; // e.g. "001-25-EPI-LN43"
  serialNo: string;
  tareKg: number;
  grossKg: number;
  netMassKg: number;
  liquidTempC: number; // e.g. -160.0
  densityKgM3: number; // e.g. 442.02
  ghvBtuScf: number;   // e.g. 1056.4
  // 8-Component GC Suite (% Mol)
  ch4: number;
  c2h6: number;
  c3h8: number;
  iC4: number;
  nC4: number;
  iC5: number;
  nC5: number;
  n2: number;
  netVolM3: number;
  deliveredMmbtu: number;
  certifiedAt: string;
  status: 'CERTIFIED / STAGED';
}

interface ArunLoadingCoqTabProps {
  onSuccessToast?: (msg: string) => void;
  activeBatchRecords?: any[];
  setActiveBatchRecords?: React.Dispatch<React.SetStateAction<any[]>>;
  addDeliveredMeasurement?: (record: any, coq?: any) => void;
  activeCandidateTankNo?: string | null;
  stagedForLoadingTankNos?: Set<string>;
  onProceedToLoading?: (certifiedTanks: any[]) => void;
  onProceedToVesselStowage?: (certifiedTanks: any[]) => void;
  onProceedToVesselDischarge?: (certifiedTanks: any[]) => void;
}

export default function ArunLoadingCoqTab({
  onSuccessToast,
  activeBatchRecords: propsActiveBatchRecords,
  setActiveBatchRecords: propsSetActiveBatchRecords,
  addDeliveredMeasurement: propsAddDeliveredMeasurement,
  activeCandidateTankNo,
  stagedForLoadingTankNos = new Set(),
  onProceedToLoading: propsOnProceedToLoading,
  onProceedToVesselStowage: propsOnProceedToVesselStowage,
  onProceedToVesselDischarge: propsOnProceedToVesselDischarge,
}: ArunLoadingCoqTabProps) {
  const portalData = usePortalData() || {};
  const fleetTanks: FleetTankItem[] = portalData.fleetTanks || [];

  // Local state fallback if not passed from container hook
  const [localBatchRecords, setLocalBatchRecords] = useState<any[]>([]);
  const activeBatchRecords = propsActiveBatchRecords !== undefined ? propsActiveBatchRecords : localBatchRecords;

  // Selection state for certified records rollback/edit
  const [selectedRevokeTankNos, setSelectedRevokeTankNos] = useState<Set<string>>(new Set());

  const toggleSelectRevokeTank = useCallback((tankNo: string) => {
    setSelectedRevokeTankNos((prev) => {
      const next = new Set(prev);
      if (next.has(tankNo)) {
        next.delete(tankNo);
      } else {
        next.add(tankNo);
      }
      return next;
    });
  }, []);

  const toggleSelectAllRevoke = useCallback(() => {
    if (selectedRevokeTankNos.size === activeBatchRecords.length && activeBatchRecords.length > 0) {
      setSelectedRevokeTankNos(new Set());
    } else {
      setSelectedRevokeTankNos(new Set(activeBatchRecords.map((r) => r.tankNo)));
    }
  }, [selectedRevokeTankNos.size, activeBatchRecords]);

  const addDeliveredMeasurement = useCallback(
    (record: any, coq?: any) => {
      if (propsAddDeliveredMeasurement) {
        propsAddDeliveredMeasurement(record, coq);
      } else {
        setLocalBatchRecords((prev) => {
          const existingIdx = prev.findIndex((r) => r.tankNo === record.tankNo);
          if (existingIdx >= 0) {
            const updated = [...prev];
            updated[existingIdx] = {
              ...updated[existingIdx],
              ...record,
              ...coq,
              status: 'CERTIFIED / STAGED',
              timestamp: new Date().toISOString(),
            };
            return updated;
          }
          return [
            {
              ...record,
              ...coq,
              status: 'CERTIFIED / STAGED',
              timestamp: new Date().toISOString(),
            },
            ...prev,
          ];
        });
      }
    },
    [propsAddDeliveredMeasurement]
  );

  const coqSpecifications: any[] =
    (portalData as any).coqSpecifications || (portalData as any).gasCompositions || [
      {
        methane: 95.5,
        ethane: 3.39,
        propane: 0.77,
        iButane: 0.15,
        nButane: 0.12,
        iPentane: 0.02,
        nPentane: 0.01,
        c6Plus: 0.00,
        nitrogen: 0.04,
        co2: 0.00,
        ghv: 1056.4,
      },
    ];

  const [consoleTankSearch, setConsoleTankSearch] = useState('');

  const activeCOQSpec = useMemo(() => {
    return (
      (Array.isArray(coqSpecifications) && coqSpecifications[0]) || {
        methane: 95.5,
        ethane: 3.39,
        propane: 0.77,
        iButane: 0.15,
        nButane: 0.12,
        iPentane: 0.02,
        nPentane: 0.01,
        c6Plus: 0.00,
        nitrogen: 0.04,
        co2: 0.00,
        ghv: 1056.4,
      }
    );
  }, [coqSpecifications]);

  // Form State
  const [formShipment, setFormShipment] = useState<string>('N-2');
  const [formTankNo, setFormTankNo] = useState<string>(() => fleetTanks[0]?.tankNo || 'ISOT-007');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formWeightBefore, setFormWeightBefore] = useState<number>(() => {
    const first = fleetTanks[0];
    if (!first) return 11295;
    const metrics = getTankPhysicalMetrics(first.tankNo, first.serialNo);
    const dry = first?.arrivalHeelMetrics?.tareWeightKg || metrics.dryTareKg;
    const heel = first?.arrivalHeelMetrics?.arrivalMassKg || metrics.heelMassKg;
    return dry + heel;
  });
  const [formWeightAfter, setFormWeightAfter] = useState<string | number>('');
  const [formDensity, setFormDensity] = useState<string | number>('442.02');
  const [formTemp, setFormTemp] = useState<string | number>(-160.0);
  const [formGHV, setFormGHV] = useState<string | number>('52214.94');
  const [formGUPVol, setFormGUPVol] = useState<number>(0);
  const [formGUPEnergy, setFormGUPEnergy] = useState<number>(0);
  const [formCDTemp, setFormCDTemp] = useState<number>(-160.0);
  const [formCDVol, setFormCDVol] = useState<number>(0);
  const [formCDEnergy, setFormCDEnergy] = useState<number>(0);

  // 11-Gas Components Form State (8 Primary Components for Lab GC)
  const [ch4, setCh4] = useState<string | number>('');
  const [c2h6, setC2h6] = useState<string | number>('');
  const [c3h8, setC3h8] = useState<string | number>('');
  const [iC4, setIC4] = useState<string | number>('');
  const [nC4, setNC4] = useState<string | number>('');
  const [iC5, setIC5] = useState<string | number>('');
  const [nC5, setNC5] = useState<string | number>('');
  const [c6Plus, setC6Plus] = useState<number>(0);
  const [n2, setN2] = useState<string | number>('');
  const [co2, setCo2] = useState<number>(0);
  const [coqGhv, setCoqGhv] = useState<string | number>('1056.4');

  const selectedTankMaster = useMemo(() => {
    if (!formTankNo) return null;
    return fleetTanks.find((t) => t.tankNo === formTankNo) || null;
  }, [fleetTanks, formTankNo]);

  const handleSelectTank = useCallback((tank: FleetTankItem) => {
    setFormTankNo(tank.tankNo);
    const metrics = getTankPhysicalMetrics(tank.tankNo, tank.serialNo);
    setFormTemp(tank.tempC && tank.tempC !== 0 ? tank.tempC : metrics.tempC);
    const dryTare = tank.arrivalHeelMetrics?.tareWeightKg || metrics.dryTareKg;
    const heelMass = tank.arrivalHeelMetrics?.arrivalMassKg || metrics.heelMassKg;
    const preLoadTare = dryTare + heelMass;
    setFormWeightBefore(preLoadTare);

    // Auto-fill Target Gross (95%) for instant 1-click testing
    const defaultDensity = 442.02;
    const nominalCapacityM3 = 43.0;
    const maxSafeVolM3 = nominalCapacityM3 * 0.95; // 40.85 m³
    const targetGross = Math.round(preLoadTare + (maxSafeVolM3 * defaultDensity));
    setFormWeightAfter(targetGross.toLocaleString());

    setFormGUPEnergy(0);
    setFormGUPVol(0);
    setFormCDEnergy(0);
    setFormCDVol(0);

    // Auto-fill standard Lab GC composition (sum 100.00%) for instant 1-click testing
    setCh4(95.50);
    setC2h6(3.39);
    setC3h8(0.77);
    setIC4(0.12);
    setNC4(0.14);
    setIC5(0.03);
    setNC5(0.01);
    setC6Plus(0.00);
    setN2(0.04);
    setCo2(0.00);
    setCoqGhv(1056.4);
    setFormGHV(52214.94);
  }, []);

  // Auto-select candidate tank when activeCandidateTankNo changes
  React.useEffect(() => {
    if (activeCandidateTankNo) {
      const found = fleetTanks.find((t) => t.tankNo === activeCandidateTankNo);
      if (found) {
        handleSelectTank(found);
      }
    }
  }, [activeCandidateTankNo, fleetTanks, handleSelectTank]);

  const handleLoadStandardSpec = () => {
    setCh4(95.50);
    setC2h6(3.39);
    setC3h8(0.77);
    setIC4(0.12);
    setNC4(0.14);
    setIC5(0.03);
    setNC5(0.01);
    setC6Plus(0.00);
    setN2(0.04);
    setCo2(0.00);
    setCoqGhv(1056.4);
    setFormGHV(52214.94);
  };

  const handleClearGasSpec = () => {
    setCh4('');
    setC2h6('');
    setC3h8('');
    setIC4('');
    setNC4('');
    setIC5('');
    setNC5('');
    setC6Plus(0);
    setN2('');
    setCo2(0);
  };

  const certifiedTankIds = useMemo(() => {
    return new Set((activeBatchRecords || []).map((record) => record.tankNo).filter(Boolean));
  }, [activeBatchRecords]);

  const consoleCandidateTanks = useMemo(() => {
    const stagedTankIds = new Set(stagedForLoadingTankNos || new Set());

    const list = fleetTanks.filter((t) => {
      const alreadyCertified = certifiedTankIds.has(t.tankNo);
      const isExplicitlyStaged = stagedTankIds.has(t.tankNo);
      if (!isExplicitlyStaged || alreadyCertified) return false;

      const q = consoleTankSearch.toLowerCase().trim();
      if (!q) return true;
      return (
        t.tankNo.toLowerCase().includes(q) ||
        t.serialNo.toLowerCase().includes(q) ||
        t.position.toLowerCase().includes(q)
      );
    });

    return sortTanksNaturally(list);
  }, [fleetTanks, consoleTankSearch, stagedForLoadingTankNos, activeBatchRecords, certifiedTankIds]);

  // Auto-focus first candidate tank if current tank is empty or already certified
  React.useEffect(() => {
    if (consoleCandidateTanks.length > 0) {
      const isCurrentSelectedCertified = formTankNo && certifiedTankIds.has(formTankNo);
      if (!formTankNo || isCurrentSelectedCertified) {
        handleSelectTank(consoleCandidateTanks[0]);
      }
    } else if (formTankNo && certifiedTankIds.has(formTankNo)) {
      setFormTankNo('');
      setFormWeightBefore(0);
      setFormWeightAfter('');
      setFormGUPVol(0);
      setFormGUPEnergy(0);
      setFormCDVol(0);
      setFormCDEnergy(0);
      handleClearGasSpec();
    }
  }, [consoleCandidateTanks, formTankNo, certifiedTankIds, handleSelectTank]);

  // 1. Tank nominal physical volume & safety limits
  const NOMINAL_TANK_CAPACITY_M3 = 43.0;
  const SAFE_FILLING_RATIO_LIMIT = 0.95; // 95%
  const MAX_SAFE_VOLUME_M3 = NOMINAL_TANK_CAPACITY_M3 * SAFE_FILLING_RATIO_LIMIT; // 40.85 m³

  // 2. Active density & GHV parsing (fallback to standard lab constants if invalid/0)
  const currentDensity = useMemo(() => {
    const parsed = typeof formDensity === 'number' ? formDensity : parseFloat(String(formDensity));
    return !isNaN(parsed) && parsed > 0 ? parsed : 442.02;
  }, [formDensity]);

  const parsedCoqGhv = useMemo(() => {
    const parsed = typeof coqGhv === 'number' ? coqGhv : parseFloat(String(coqGhv));
    return !isNaN(parsed) && parsed > 0 ? parsed : 1056.4;
  }, [coqGhv]);

  const parsedDelivGhv = useMemo(() => {
    const parsed = typeof formGHV === 'number' ? formGHV : parseFloat(String(formGHV));
    return !isNaN(parsed) && parsed > 0 ? parsed : 52214.94;
  }, [formGHV]);

  const parsedGrossWeight = useMemo(() => {
    if (!formWeightAfter) return 0;
    if (typeof formWeightAfter === 'number') return formWeightAfter;
    const cleanStr = String(formWeightAfter).replace(/,/g, '').trim();
    const parsed = parseFloat(cleanStr);
    return !isNaN(parsed) ? parsed : 0;
  }, [formWeightAfter]);

  const numCh4 = useMemo(() => (typeof ch4 === 'number' ? ch4 : parseFloat(ch4) || 0), [ch4]);
  const numC2h6 = useMemo(() => (typeof c2h6 === 'number' ? c2h6 : parseFloat(c2h6) || 0), [c2h6]);
  const numC3h8 = useMemo(() => (typeof c3h8 === 'number' ? c3h8 : parseFloat(c3h8) || 0), [c3h8]);
  const numIC4 = useMemo(() => (typeof iC4 === 'number' ? iC4 : parseFloat(iC4) || 0), [iC4]);
  const numNC4 = useMemo(() => (typeof nC4 === 'number' ? nC4 : parseFloat(nC4) || 0), [nC4]);
  const numIC5 = useMemo(() => (typeof iC5 === 'number' ? iC5 : parseFloat(iC5) || 0), [iC5]);
  const numNC5 = useMemo(() => (typeof nC5 === 'number' ? nC5 : parseFloat(nC5) || 0), [nC5]);
  const numN2 = useMemo(() => (typeof n2 === 'number' ? n2 : parseFloat(n2) || 0), [n2]);

  // 3. Dynamic 95% Net & Gross limits based on user-entered density and active preLoadTare
  const dynamicSafeNetMass = useMemo(() => {
    return MAX_SAFE_VOLUME_M3 * currentDensity;
  }, [currentDensity, MAX_SAFE_VOLUME_M3]);

  const dynamicSafeGrossLimit = useMemo(() => {
    return formWeightBefore + dynamicSafeNetMass;
  }, [formWeightBefore, dynamicSafeNetMass]);

  // 4. Live Net & Energy calculations linked to dynamic density and operator-entered DELIV GHV
  const calculatedLoadedWeight = useMemo(() => {
    if (parsedGrossWeight <= 0 || parsedGrossWeight <= formWeightBefore) return 0;
    return parsedGrossWeight - formWeightBefore;
  }, [parsedGrossWeight, formWeightBefore]);

  const calculatedVolumeM3 = useMemo(() => {
    if (calculatedLoadedWeight <= 0 || currentDensity <= 0) return 0;
    return parseFloat((calculatedLoadedWeight / currentDensity).toFixed(2));
  }, [calculatedLoadedWeight, currentDensity]);

  const calculatedBtuLoaded = useMemo(() => {
    if (calculatedLoadedWeight <= 0) return 0;
    return parseFloat((calculatedLoadedWeight * parsedDelivGhv).toFixed(0));
  }, [calculatedLoadedWeight, parsedDelivGhv]);

  const calculatedBtuLoadedMMBtu = useMemo(() => {
    if (calculatedLoadedWeight <= 0) return 0;
    return parseFloat(((calculatedLoadedWeight * parsedDelivGhv) / 1000000).toFixed(2));
  }, [calculatedLoadedWeight, parsedDelivGhv]);

  const calculatedTotalDeliveredVol = useMemo(() => {
    if (calculatedVolumeM3 <= 0 && formGUPVol <= 0 && formCDVol <= 0) return 0;
    return parseFloat((calculatedVolumeM3 + formGUPVol + formCDVol).toFixed(2));
  }, [calculatedVolumeM3, formGUPVol, formCDVol]);

  const calculatedTotalEnergyMMBtu = useMemo(() => {
    if (calculatedLoadedWeight <= 0 && formGUPEnergy <= 0 && formCDEnergy <= 0) return 0;
    return parseFloat((calculatedBtuLoadedMMBtu + formGUPEnergy + formCDEnergy).toFixed(2));
  }, [calculatedBtuLoadedMMBtu, formGUPEnergy, formCDEnergy, calculatedLoadedWeight]);

  const calculatedFillingRatio = useMemo(() => {
    if (calculatedVolumeM3 <= 0) return 0;
    return parseFloat(((calculatedVolumeM3 / NOMINAL_TANK_CAPACITY_M3) * 100).toFixed(1));
  }, [calculatedVolumeM3, NOMINAL_TANK_CAPACITY_M3]);

  const isOverfill = useMemo(() => {
    return calculatedFillingRatio > 95.0;
  }, [calculatedFillingRatio]);

  const isGrossValid = useMemo(() => {
    return parsedGrossWeight > formWeightBefore && parsedGrossWeight <= 36000;
  }, [parsedGrossWeight, formWeightBefore]);

  const gcSum = useMemo(() => {
    return parseFloat((numCh4 + numC2h6 + numC3h8 + numIC4 + numNC4 + numIC5 + numNC5 + numN2).toFixed(2));
  }, [numCh4, numC2h6, numC3h8, numIC4, numNC4, numIC5, numNC5, numN2]);

  const isGcValid = useMemo(() => {
    const allComponentsEntered =
      numCh4 > 0 && numC2h6 > 0 && numC3h8 > 0 && numIC4 > 0 && numNC4 > 0 && numIC5 > 0 && numNC5 > 0 && numN2 > 0;
    const isNormalized = gcSum >= 99.90 && gcSum <= 100.10;
    return allComponentsEntered && isNormalized;
  }, [numCh4, numC2h6, numC3h8, numIC4, numNC4, numIC5, numNC5, numN2, gcSum]);

  const isCertifyEnabled = isGrossValid && isGcValid && calculatedLoadedWeight > 0;

  const certifyButtonText = useMemo(() => {
    return `SAVE ${formTankNo || selectedTankMaster?.tankNo || 'ISOT-000'}`;
  }, [formTankNo, selectedTankMaster]);

  const handleCreateLoadingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isGrossValid) {
      alert(`Please enter a valid Gross Weight between ${(formWeightBefore + 1).toLocaleString()} kg and 36,000 kg.`);
      return;
    }
    if (!isGcValid) {
      alert('Please ensure all 8 Lab Gas Chromatography components are entered and sum to ~100.00%.');
      return;
    }

    const serialNo = selectedTankMaster?.serialNo || 'TRSU-ARUN';
    const activeShipment = formShipment.trim() || 'N-2';
    const activeDate = formDate || new Date().toISOString().split('T')[0];
    const parsedTemp = typeof formTemp === 'number' ? formTemp : parseFloat(formTemp) || -160.0;
    const cleanTankDigits = formTankNo.replace(/[^0-9]/g, '') || '01';
    const cargoNo = selectedTankMaster?.cargoNo || `001-25-EPI-LN${cleanTankDigits.padStart(2, '0')}`;
    const certifiedTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const custodyRecord: CustodyRecord = {
      tankNo: formTankNo,
      cargoNo,
      serialNo,
      tareKg: formWeightBefore,
      grossKg: parsedGrossWeight,
      netMassKg: calculatedLoadedWeight,
      liquidTempC: parsedTemp,
      densityKgM3: currentDensity,
      ghvBtuScf: parsedCoqGhv,
      ch4: numCh4 || 95.50,
      c2h6: numC2h6 || 3.39,
      c3h8: numC3h8 || 0.77,
      iC4: numIC4 || 0.12,
      nC4: numNC4 || 0.14,
      iC5: numIC5 || 0.03,
      nC5: numNC5 || 0.01,
      n2: numN2 || 0.04,
      netVolM3: calculatedVolumeM3,
      deliveredMmbtu: calculatedTotalEnergyMMBtu,
      certifiedAt: certifiedTime,
      status: 'CERTIFIED / STAGED',
    };

    addDeliveredMeasurement(
      {
        ...custodyRecord,
        shipment: activeShipment,
        weightBeforeKg: formWeightBefore,
        weightAfterKg: parsedGrossWeight,
        deliveredWeightKg: calculatedLoadedWeight,
        deliveredVolumeM3: calculatedVolumeM3,
        deliveredDensity: currentDensity,
        deliveredTempC: parsedTemp,
        deliveredGHV: parsedDelivGhv,
        gassingUpVolM3: formGUPVol,
        gassingUpEnergyMMBtu: formGUPEnergy,
        coolingDownTempC: formCDTemp,
        coolingDownVolM3: formCDVol,
        coolingDownEnergyMMBtu: formCDEnergy,
        btuLoaded: calculatedBtuLoaded,
        btuLoadedMMBtu: calculatedBtuLoadedMMBtu,
        totalDeliveredVolM3: calculatedTotalDeliveredVol,
        deliveredMMBtu: calculatedTotalEnergyMMBtu,
        date: activeDate,
        remarks: `Arun PAG Delivered Custody Certified (Batch ${activeShipment})`,
      },
      {
        source: 'Arun PAG COQ Lab',
        samplePoint: `${formTankNo} (${serialNo})`,
        reportDate: activeDate,
        methane: numCh4 || 95.50,
        ethane: numC2h6 || 3.39,
        propane: numC3h8 || 0.77,
        iButane: numIC4 || 0.12,
        nButane: numNC4 || 0.14,
        iPentane: numIC5 || 0.03,
        nPentane: numNC5 || 0.01,
        c6Plus: c6Plus || 0.00,
        nitrogen: numN2 || 0.04,
        co2: co2 || 0.00,
        ghv: parsedCoqGhv,
        shipment: activeShipment,
        tankNo: formTankNo,
      }
    );

    if (onSuccessToast) {
      onSuccessToast(`Successfully issued COQ Certificate for ${formTankNo} (${calculatedTotalEnergyMMBtu.toFixed(2)} MMBtu)`);
    }

    // Auto-advance to next uncertified candidate tank
    const remainingCandidates = consoleCandidateTanks.filter(
      (t) => t.tankNo !== formTankNo && !activeBatchRecords.some((r) => r.tankNo === t.tankNo)
    );
    if (remainingCandidates.length > 0) {
      handleSelectTank(remainingCandidates[0]);
    } else {
      setFormWeightAfter('');
      setFormGUPVol(0);
      setFormGUPEnergy(0);
      setFormCDVol(0);
      setFormCDEnergy(0);
      handleClearGasSpec();
    }
  };

  const handleRevokeSelected = useCallback(() => {
    if (selectedRevokeTankNos.size === 0) return;
    const targetNos = Array.from(selectedRevokeTankNos);

    if (propsSetActiveBatchRecords) {
      propsSetActiveBatchRecords((prev) => prev.filter((r) => !targetNos.includes(r.tankNo)));
    }
    setLocalBatchRecords((prev) => prev.filter((r) => !targetNos.includes(r.tankNo)));

    // Auto-select first revoked tank for editing in top candidate form
    const firstTank = fleetTanks.find((t) => targetNos.includes(t.tankNo));
    if (firstTank) {
      handleSelectTank(firstTank);
    }

    setSelectedRevokeTankNos(new Set());

    if (onSuccessToast) {
      onSuccessToast(`Restored ${targetNos.length} tank(s) to candidate queue for re-edit.`);
    }
  }, [selectedRevokeTankNos, propsSetActiveBatchRecords, fleetTanks, handleSelectTank, onSuccessToast]);

  const handleExportBatchCSV = () => {
    const formattedData = activeBatchRecords.map((r) => {
      const tare = r.tareKg ?? r.weightBeforeKg ?? 0;
      const gross = r.grossKg ?? r.weightAfterKg ?? 0;
      const netMass = r.netMassKg ?? r.deliveredWeightKg ?? (gross > tare ? gross - tare : 0);
      const netVol = r.netVolM3 ?? r.deliveredVolumeM3 ?? 0;
      const energy = r.deliveredMmbtu ?? r.deliveredMMBtu ?? r.energyMMBtu ?? 0;
      const density = r.densityKgM3 ?? r.deliveredDensity ?? 441.4;
      const temp = r.liquidTempC ?? r.deliveredTempC ?? -160.0;
      const ghv = r.ghvBtuScf ?? r.deliveredGHV ?? 1056.4;
      const cargo = r.cargoNo || `001-25-EPI-LN${(r.tankNo || '').replace(/[^0-9]/g, '').padStart(2, '0')}`;
      const certTime = r.certifiedAt || r.timestamp || new Date().toISOString();

      return {
        'ISO Tank No': r.tankNo,
        'Cargo No': cargo,
        'Serial No': r.serialNo,
        'Tare (kg)': tare,
        'Gross (kg)': gross,
        'Net Mass (kg)': netMass,
        'Liquid Temp (°C)': temp,
        'Density (kg/m³)': density,
        'GHV (Btu/Scf)': ghv,
        'CH4 (Mol %)': (r.ch4 ?? r.methane ?? 95.5).toFixed(2),
        'C2H6 (Mol %)': (r.c2h6 ?? r.ethane ?? 3.39).toFixed(2),
        'C3H8 (Mol %)': (r.c3h8 ?? r.propane ?? 0.77).toFixed(2),
        'i-C4H10 (Mol %)': (r.iC4 ?? r.iButane ?? 0.12).toFixed(2),
        'n-C4H10 (Mol %)': (r.nC4 ?? r.nButane ?? 0.14).toFixed(2),
        'i-C5H12 (Mol %)': (r.iC5 ?? r.iPentane ?? 0.03).toFixed(2),
        'n-C5H12 (Mol %)': (r.nC5 ?? r.nPentane ?? 0.01).toFixed(2),
        'N2 (Mol %)': (r.n2 ?? r.nitrogen ?? 0.04).toFixed(2),
        'Net Volume (m³)': netVol.toFixed(2),
        'Delivered Energy (MMBtu)': energy.toFixed(2),
        'Certified At': certTime,
        'Status': r.status || 'CERTIFIED / STAGED',
      };
    });

    exportToCSV(
      `PAGT_Arun_Custody_Master_Ledger_Batch_${formShipment.trim() || 'N-2'}_${new Date().toISOString().split('T')[0]}`,
      formattedData
    );
  };

  const handleProceedToVesselStowage = () => {
    if (selectedRevokeTankNos.size === 0) return;
    const selectedTankNos = Array.from(selectedRevokeTankNos);
    const selectedRecords = activeBatchRecords.filter((r) => selectedRevokeTankNos.has(r.tankNo));

    if (portalData.batchTransitionTanks) {
      portalData.batchTransitionTanks(selectedTankNos, NodeState.NODE_2_MV_SAVIOUR_TRANSIT);
    }
    if (propsOnProceedToLoading) {
      propsOnProceedToLoading(selectedRecords);
    } else if (propsOnProceedToVesselStowage) {
      propsOnProceedToVesselStowage(selectedRecords);
    } else if (propsOnProceedToVesselDischarge) {
      propsOnProceedToVesselDischarge(selectedRecords);
    }

    setSelectedRevokeTankNos(new Set());
  };

  const loadedCount = activeBatchRecords.length;
  const batchTargetCount = 10;
  const remainingCandidates = consoleCandidateTanks.length;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <form
        onSubmit={handleCreateLoadingSubmit}
        className="bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] win-panel p-2 space-y-2.5 shadow-sm"
      >
        <div className="bg-[#0a2558] text-white px-2.5 py-1.5 flex flex-col sm:flex-row justify-between sm:items-center gap-1.5 select-none">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-cyan-300" />
            <h3 className="text-xs sm:text-sm font-bold tracking-wide uppercase text-white">
              PAGT (Arun) Custody &amp; COQ
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
            <span className="bg-[#051636] border border-blue-400/40 px-2 py-0.5 text-emerald-300 font-bold">
              Ready: {loadedCount}/{batchTargetCount} Certified ({remainingCandidates} Pending)
            </span>
            <span className="bg-[#051636] border border-blue-400/40 px-2 py-0.5 text-cyan-300 font-bold">
              Target: Batch {formShipment || 'N-2'}
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-2.5 text-xs w-full">
          <div className="w-full lg:w-[44%] shrink-0 bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] win-panel p-2 flex flex-col justify-between gap-2">
            <div className="flex flex-col h-full">
              <div className="bg-[#0a2558] text-white text-xs font-bold px-2 py-1 flex items-center justify-between tracking-wide uppercase mb-2">
                <span className="flex items-center gap-1.5 text-white">
                  <Boxes className="w-3.5 h-3.5 text-cyan-300" />
                  1. SELECT ISO TANK
                </span>
                <span className="font-mono text-[10px] text-cyan-200 uppercase">
                  {remainingCandidates} CANDIDATES
                </span>
              </div>

              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-1.5" />
                <input
                  type="text"
                  placeholder="Search tank / serial..."
                  value={consoleTankSearch}
                  onChange={(e) => setConsoleTankSearch(e.target.value)}
                  className="w-full pl-7 pr-2 py-0.5 bg-white border border-t-[#808080] border-l-[#808080] border-b-white border-r-white text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-700"
                />
              </div>

              <div className="max-h-[380px] lg:max-h-[460px] overflow-x-auto overflow-y-auto border border-t-[#808080] border-l-[#808080] border-b-white border-r-white bg-white flex-1 select-none">
                <table className="w-full text-left border-collapse min-w-[360px] text-[11px] font-mono">
                  <thead className="sticky top-0 bg-[#dcd8c8] z-10 select-none shadow-sm border-b border-[#a09e90]">
                    <tr className="divide-x divide-[#b8b4ac]">
                      <th className="py-1 px-1.5 text-center bg-[#dcd8c8] border border-[#a09e90] align-middle">
                        <div className="text-[11px] font-bold text-[#0a2558] leading-tight text-center">ISO TANK NO</div>
                      </th>
                      <th className="py-1 px-1.5 text-center bg-[#dcd8c8] border border-[#a09e90] align-middle">
                        <div className="text-[11px] font-bold text-[#0a2558] leading-tight text-center">SERIAL NO.</div>
                      </th>
                      <th className="py-1 px-1 text-center bg-[#dcd8c8] border border-[#a09e90]">
                        <div className="text-[11px] font-bold text-[#0a2558] leading-tight text-center">HEEL VOL</div>
                        <div className="text-[10px] text-slate-600 font-mono text-center">[M³]</div>
                      </th>
                      <th className="py-1 px-1 text-center bg-[#dcd8c8] border border-[#a09e90]">
                        <div className="text-[11px] font-bold text-[#0a2558] leading-tight text-center">HEEL MASS</div>
                        <div className="text-[10px] text-slate-600 font-mono text-center">[KG]</div>
                      </th>
                      <th className="py-1 px-1 text-center bg-[#dcd8c8] border border-[#a09e90]">
                        <div className="text-[11px] font-bold text-[#0a2558] leading-tight text-center">PRESSURE</div>
                        <div className="text-[10px] text-slate-600 font-mono text-center">[MPA]</div>
                      </th>
                      <th className="py-1 px-1 text-center bg-[#dcd8c8] border border-[#a09e90]">
                        <div className="text-[11px] font-bold text-[#0a2558] leading-tight text-center">TEMP</div>
                        <div className="text-[10px] text-slate-600 font-mono text-center">[°C]</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e3dc]">
                    {consoleCandidateTanks.map((tank) => {
                      const isSelected = formTankNo === tank.tankNo;
                      const isTankCertified = activeBatchRecords.some((r) => r.tankNo === tank.tankNo);
                      const metrics = getTankPhysicalMetrics(tank.tankNo, tank.serialNo);
                      const heelMass = tank.arrivalHeelMetrics?.arrivalMassKg || metrics.heelMassKg;
                      const heelVol = metrics.heelVolumeM3 || (heelMass / LNG_LIQUID_DENSITY_KG_M3);
                      const pressMpa = tank.pressureMPa || metrics.pressureMPa;
                      const tempC = tank.tempC || metrics.tempC;

                      return (
                        <tr
                          key={tank.tankNo}
                          onClick={() => handleSelectTank(tank)}
                          className={`cursor-pointer transition-colors divide-x ${
                            isSelected
                              ? 'bg-[#0a2558] text-[#e5ff00] font-bold divide-[#1a386c] outline outline-2 outline-white -outline-offset-1'
                              : isTankCertified
                              ? 'bg-emerald-50/85 hover:bg-emerald-100/80 text-slate-900 divide-slate-200'
                              : 'bg-white hover:bg-blue-50/75 text-slate-900 divide-slate-200'
                          }`}
                        >
                          <td className="py-1 px-1.5 whitespace-nowrap text-left">
                            <div className="flex items-center gap-1">
                              <span
                                className={`font-bold ${
                                  isSelected
                                    ? 'text-[#e5ff00]'
                                    : isTankCertified
                                    ? 'text-emerald-800'
                                    : 'text-blue-900'
                                }`}
                              >
                                {tank.tankNo}
                              </span>
                              {isTankCertified && (
                                <span
                                  className={`text-[8.5px] px-1 py-0.2 font-bold ${
                                    isSelected
                                      ? 'bg-emerald-500 text-slate-950'
                                      : 'bg-emerald-700 text-white'
                                  }`}
                                  title="Certified / Loaded"
                                >
                                  ✓
                                </span>
                              )}
                            </div>
                          </td>
                          <td
                            className={`py-1 px-1.5 whitespace-nowrap text-left text-[10.5px] ${
                              isSelected
                                ? 'text-[#e5ff00]'
                                : isTankCertified
                                ? 'text-emerald-950'
                                : 'text-slate-600'
                            }`}
                          >
                            {tank.serialNo}
                          </td>
                          <td
                            className={`py-1 px-1.5 whitespace-nowrap text-center text-[10.5px] font-bold ${
                              isSelected
                                ? 'text-[#e5ff00]'
                                : isTankCertified
                                ? 'text-emerald-950'
                                : 'text-slate-950'
                            }`}
                          >
                            {heelVol.toFixed(2)}
                          </td>
                          <td
                            className={`py-1 px-1.5 whitespace-nowrap text-center text-[10.5px] font-bold ${
                              isSelected
                                ? 'text-[#e5ff00]'
                                : isTankCertified
                                ? 'text-emerald-950'
                                : 'text-slate-950'
                            }`}
                          >
                            {Math.round(heelMass)}
                          </td>
                          <td
                            className={`py-1 px-1.5 whitespace-nowrap text-center text-[10.5px] font-bold ${
                              isSelected
                                ? 'text-[#e5ff00]'
                                : isTankCertified
                                ? 'text-emerald-950'
                                : 'text-slate-800'
                            }`}
                          >
                            {pressMpa.toFixed(2)}
                          </td>
                          <td
                            className={`py-1 px-1.5 whitespace-nowrap text-center text-[10.5px] font-bold ${
                              isSelected
                                ? 'text-[#e5ff00]'
                                : isTankCertified
                                ? 'text-emerald-950'
                                : 'text-slate-800'
                            }`}
                          >
                            {tempC.toFixed(1)}
                          </td>
                        </tr>
                      );
                    })}
                    {consoleCandidateTanks.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-slate-500 font-sans text-xs">
                          No matching candidate tanks found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[56%] bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] win-panel p-2.5 flex flex-col justify-between gap-2.5">
            <div className="space-y-2.5">
              <div className="bg-[#0a2558] text-white text-xs font-bold px-2.5 py-1.5 flex items-center justify-between tracking-wide uppercase shadow-sm">
                <div className="flex items-center gap-2">
                  <Weight className="w-4 h-4 text-cyan-300" />
                  <span className="font-bold text-white tracking-wide">
                    {formTankNo ? '2. CUSTODY SPECIFICATION' : '2. CUSTODY SPECIFICATION (NO TANK SELECTED)'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span className="text-cyan-300 font-bold bg-[#051636] border border-blue-400/40 px-2 py-0.5">
                    {formTankNo ? `${formTankNo} (${selectedTankMaster?.serialNo || 'TRSU-ARUN'})` : 'NO TANK SELECTED'}
                  </span>
                </div>
              </div>

              {!formTankNo && (
                <div className="bg-[#f5f3e7] border border-[#a09e90] p-2 text-center text-xs text-slate-600 font-sans font-semibold">
                  No active ISO tank selected. Stage tanks from Tab 1 to proceed.
                </div>
              )}

              <div className="grid grid-cols-6 gap-1.5 w-full bg-[#e8e6df] p-2 rounded border border-[#cfccc0] items-end font-mono">
                {/* 1. Target Batch */}
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-[#0a2558] text-center truncate mb-0.5" title="Target Batch">
                    TARGET BATCH
                  </span>
                  <input
                    type="text"
                    list="shipment-batches"
                    value={formShipment}
                    onChange={(e) => setFormShipment(e.target.value)}
                    placeholder="N-2"
                    className="w-full text-center font-mono font-bold text-xs h-7 bg-white border border-[#a09e90] rounded text-[#0a2558] px-1 focus:outline-none focus:ring-1 focus:ring-[#0a2558]"
                  />
                  <datalist id="shipment-batches">
                    <option value="N-1" />
                    <option value="N-2" />
                    <option value="N-3" />
                    <option value="N-4" />
                    <option value="N-5" />
                  </datalist>
                </div>

                {/* 2. Cert. Date */}
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-[#0a2558] text-center truncate mb-0.5" title="Certification Date">
                    CERT. DATE
                  </span>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full text-center font-mono font-bold text-xs h-7 bg-white border border-[#a09e90] rounded text-[#0a2558] px-0.5 focus:outline-none focus:ring-1 focus:ring-[#0a2558]"
                  />
                </div>

                {/* 3. Density */}
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-[#0a2558] text-center truncate mb-0.5" title="Density">
                    DENSITY (kg/m³)
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={formDensity}
                    onChange={(e) => setFormDensity(e.target.value)}
                    placeholder="442.02"
                    className="w-full text-center font-mono font-bold text-xs h-7 bg-white border border-[#a09e90] rounded text-[#0a2558] px-1 focus:outline-none focus:ring-1 focus:ring-[#0a2558]"
                  />
                </div>

                {/* 4. Liquid Temp */}
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-[#0a2558] text-center truncate mb-0.5" title="Liquid Temperature">
                    LIQUID TEMP (°C)
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    value={formTemp}
                    onChange={(e) => setFormTemp(e.target.value)}
                    placeholder="-160.0"
                    className="w-full text-center font-mono font-bold text-xs h-7 bg-white border border-[#a09e90] rounded text-[#0a2558] px-1 focus:outline-none focus:ring-1 focus:ring-[#0a2558]"
                  />
                </div>

                {/* 5. COQ (Btu/Scf) */}
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-[#0a2558] text-center truncate mb-0.5" title="COQ GHV">
                    COQ (Btu/Scf)
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    value={coqGhv}
                    onChange={(e) => setCoqGhv(e.target.value)}
                    placeholder="1056.4"
                    className="w-full text-center font-mono font-bold text-xs h-7 bg-white border border-[#a09e90] rounded text-[#0a2558] px-1 focus:outline-none focus:ring-1 focus:ring-[#0a2558]"
                  />
                </div>

                {/* 6. Mass GHV */}
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-[#0a2558] text-center truncate mb-0.5" title="Delivered Mass GHV">
                    MASS GHV (Btu/kg)
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={formGHV}
                    onChange={(e) => setFormGHV(e.target.value)}
                    placeholder="52214.94"
                    className="w-full text-center font-mono font-bold text-xs h-7 bg-white border border-[#a09e90] rounded text-[#0a2558] px-1 focus:outline-none focus:ring-1 focus:ring-[#0a2558]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                <div className="md:col-span-5 flex flex-col justify-between gap-2.5 font-mono">
                  <div className="bg-[#d4d0c8] p-2.5 border border-t-[#808080] border-l-[#808080] border-b-white border-r-white text-center">
                    <span className="text-xs text-[#0a2558] font-bold uppercase block font-sans mb-1 text-center">
                      Pre-Load Tare (Kg)
                    </span>
                    <div className="font-mono text-xl font-bold text-[#0a2558] text-center py-0.5">
                      {formTankNo && formWeightBefore > 0 ? `${formWeightBefore.toLocaleString()} kg` : '--'}
                    </div>
                    <span className="text-[10px] text-slate-600 block text-center">Baseline 10,850 + Heel</span>
                  </div>

                  <div className={`p-2.5 border-2 text-center transition-colors ${
                    isOverfill
                      ? 'bg-red-50/70 border-red-600'
                      : parsedGrossWeight > 36000
                      ? 'bg-red-50/70 border-red-500'
                      : 'bg-[#e8f0fe] border-[#1c3a6b]'
                  }`}>
                    <span className="text-xs text-[#0a2558] font-bold uppercase block font-sans mb-1 text-center">
                      Gross Loaded (Kg) *
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      disabled={!formTankNo}
                      value={formWeightAfter}
                      placeholder={formTankNo ? `EX) ${Math.round(dynamicSafeGrossLimit).toLocaleString()} (95%)` : '--'}
                      onChange={(e) => {
                        const cleanDigits = e.target.value.replace(/[^0-9]/g, '');
                        if (!cleanDigits) {
                          setFormWeightAfter('');
                          return;
                        }
                        const num = parseInt(cleanDigits, 10);
                        setFormWeightAfter(isNaN(num) ? '' : num.toLocaleString());
                      }}
                      className={`w-full bg-white border-2 font-mono text-2xl font-black text-[#0a2558] text-center tracking-wider px-3 h-14 shadow-inner focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${
                        isOverfill || parsedGrossWeight > 36000
                          ? 'border-red-600 focus:ring-red-500'
                          : 'border-[#1c3a6b] focus:ring-[#0a2558]'
                      }`}
                    />
                    {isOverfill ? (
                      <span className="text-[10px] text-red-600 font-bold block mt-1 text-center animate-pulse">
                        ⚠️ WARNING: Liquid Volume exceeds 95% safety filling limit ({MAX_SAFE_VOLUME_M3.toFixed(2)} m³ / max ~{Math.round(dynamicSafeGrossLimit).toLocaleString()} kg)
                      </span>
                    ) : parsedGrossWeight > 36000 ? (
                      <span className="text-[10px] text-red-600 font-bold block mt-1 text-center">
                        ⚠️ Invalid Gross: Exceeds Max Weighbridge Scale (36,000 kg)
                      </span>
                    ) : parsedGrossWeight > 0 && parsedGrossWeight <= formWeightBefore ? (
                      <span className="text-[10px] text-amber-700 font-bold block mt-1 text-center">
                        Gross weight must exceed pre-load tare ({formWeightBefore.toLocaleString()} kg)
                      </span>
                    ) : (
                      <span className="text-[10px] text-blue-900 font-bold block mt-1 text-center font-mono">
                        Target Gross (95%): {formTankNo ? `${Math.round(dynamicSafeGrossLimit).toLocaleString()} kg` : '--'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="md:col-span-7 bg-[#d4d0c8] border border-t-[#808080] border-l-[#808080] border-b-white border-r-white p-2.5 flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between border-b border-slate-400 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Atom className="w-3.5 h-3.5 text-blue-900" />
                      <span className="text-[10.5px] font-bold text-slate-900 uppercase font-sans tracking-wide">
                        LAB GC SPECIFICATION (MOL %)
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={handleLoadStandardSpec}
                        className="bg-[#ece9d8] hover:bg-[#dfdbce] active:border-t-[#808080] active:border-l-[#808080] active:border-b-white active:border-r-white border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] text-[10px] font-bold text-blue-900 px-2 py-0.5 flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-blue-700" /> Auto-Fill
                      </button>
                      <button
                        type="button"
                        onClick={handleClearGasSpec}
                        className="bg-[#ece9d8] hover:bg-[#dfdbce] active:border-t-[#808080] active:border-l-[#808080] active:border-b-white active:border-r-white border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] text-[10px] font-bold text-slate-800 px-2 py-0.5 cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 font-mono">
                    <div>
                      <div className="flex flex-col items-center justify-center h-8 mb-1">
                        <span className="text-xs font-bold text-[#0a2558] leading-tight">CH₄</span>
                        <span className="text-[10px] text-slate-500 font-sans leading-tight">(Methane)</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={ch4}
                        placeholder="95.50"
                        onChange={(e) => setCh4(e.target.value)}
                        className="w-full text-center font-mono font-bold text-sm h-8 bg-white border border-[#a09e90] text-[#0a2558] focus:outline-none focus:ring-1 focus:ring-[#0a2558]"
                      />
                    </div>
                    <div>
                      <div className="flex flex-col items-center justify-center h-8 mb-1">
                        <span className="text-xs font-bold text-[#0a2558] leading-tight">C₂H₆</span>
                        <span className="text-[10px] text-slate-500 font-sans leading-tight">(Ethane)</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={c2h6}
                        placeholder="3.39"
                        onChange={(e) => setC2h6(e.target.value)}
                        className="w-full text-center font-mono font-bold text-sm h-8 bg-white border border-[#a09e90] text-[#0a2558] focus:outline-none focus:ring-1 focus:ring-[#0a2558]"
                      />
                    </div>
                    <div>
                      <div className="flex flex-col items-center justify-center h-8 mb-1">
                        <span className="text-xs font-bold text-[#0a2558] leading-tight">C₃H₈</span>
                        <span className="text-[10px] text-slate-500 font-sans leading-tight">(Propane)</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={c3h8}
                        placeholder="0.77"
                        onChange={(e) => setC3h8(e.target.value)}
                        className="w-full text-center font-mono font-bold text-sm h-8 bg-white border border-[#a09e90] text-[#0a2558] focus:outline-none focus:ring-1 focus:ring-[#0a2558]"
                      />
                    </div>
                    <div>
                      <div className="flex flex-col items-center justify-center h-8 mb-1">
                        <span className="text-xs font-bold text-[#0a2558] leading-tight">i-C₄H₁₀</span>
                        <span className="text-[10px] text-slate-500 font-sans leading-tight">(i-Butane)</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={iC4}
                        placeholder="0.12"
                        onChange={(e) => setIC4(e.target.value)}
                        className="w-full text-center font-mono font-bold text-sm h-8 bg-white border border-[#a09e90] text-[#0a2558] focus:outline-none focus:ring-1 focus:ring-[#0a2558]"
                      />
                    </div>

                    <div>
                      <div className="flex flex-col items-center justify-center h-8 mb-1">
                        <span className="text-xs font-bold text-[#0a2558] leading-tight">n-C₄H₁₀</span>
                        <span className="text-[10px] text-slate-500 font-sans leading-tight">(n-Butane)</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={nC4}
                        placeholder="0.14"
                        onChange={(e) => setNC4(e.target.value)}
                        className="w-full text-center font-mono font-bold text-sm h-8 bg-white border border-[#a09e90] text-[#0a2558] focus:outline-none focus:ring-1 focus:ring-[#0a2558]"
                      />
                    </div>
                    <div>
                      <div className="flex flex-col items-center justify-center h-8 mb-1">
                        <span className="text-xs font-bold text-[#0a2558] leading-tight">i-C₅H₁₂</span>
                        <span className="text-[10px] text-slate-500 font-sans leading-tight">(i-Pentane)</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={iC5}
                        placeholder="0.03"
                        onChange={(e) => setIC5(e.target.value)}
                        className="w-full text-center font-mono font-bold text-sm h-8 bg-white border border-[#a09e90] text-[#0a2558] focus:outline-none focus:ring-1 focus:ring-[#0a2558]"
                      />
                    </div>
                    <div>
                      <div className="flex flex-col items-center justify-center h-8 mb-1">
                        <span className="text-xs font-bold text-[#0a2558] leading-tight">n-C₅H₁₂</span>
                        <span className="text-[10px] text-slate-500 font-sans leading-tight">(n-Pentane)</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={nC5}
                        placeholder="0.01"
                        onChange={(e) => setNC5(e.target.value)}
                        className="w-full text-center font-mono font-bold text-sm h-8 bg-white border border-[#a09e90] text-[#0a2558] focus:outline-none focus:ring-1 focus:ring-[#0a2558]"
                      />
                    </div>
                    <div>
                      <div className="flex flex-col items-center justify-center h-8 mb-1">
                        <span className="text-xs font-bold text-[#0a2558] leading-tight">N₂</span>
                        <span className="text-[10px] text-slate-500 font-sans leading-tight">(Nitrogen)</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={n2}
                        placeholder="0.04"
                        onChange={(e) => setN2(e.target.value)}
                        className="w-full text-center font-mono font-bold text-sm h-8 bg-white border border-[#a09e90] text-[#0a2558] focus:outline-none focus:ring-1 focus:ring-[#0a2558]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-slate-300 font-mono">
                    <span className="text-slate-600 font-bold">Total Mole %:</span>
                    <span className={`font-bold text-right ${isGcValid ? 'text-emerald-700' : 'text-[#0a2558]'}`}>
                      {gcSum.toFixed(2)} %
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#dcd8c8] border-2 border-t-[#808080] border-l-[#808080] border-r-white border-b-white shadow-inner p-2.5 py-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-center">
                <div className="bg-[#f4f2e6] border border-[#a09e90] shadow-inner py-2.5 px-2 flex flex-col justify-center text-center">
                  <span className="text-xs font-bold text-[#0a2558] tracking-wider uppercase mb-0.5 font-sans text-center">
                    NET LOADED MASS
                  </span>
                  <div className="font-mono text-xl font-black text-[#0a2558] text-center tracking-wide">
                    {calculatedLoadedWeight > 0 ? `${calculatedLoadedWeight.toLocaleString()} kg` : '0 kg'}
                  </div>
                  <span className="text-[10px] text-slate-500 font-sans mt-0.5">(Gross - Pre-load Tare)</span>
                </div>

                <div className={`border shadow-inner py-2.5 px-2 flex flex-col justify-center text-center transition-colors ${
                  isOverfill ? 'bg-red-50 border-red-400' : 'bg-[#f4f2e6] border-[#a09e90]'
                }`}>
                  <span className={`text-xs font-bold tracking-wider uppercase mb-0.5 font-sans text-center ${
                    isOverfill ? 'text-red-700' : 'text-[#0a2558]'
                  }`}>
                    NET LIQUID VOLUME
                  </span>
                  <div className={`font-mono text-xl font-black text-center tracking-wide ${
                    isOverfill ? 'text-red-600' : 'text-[#0369a1]'
                  }`}>
                    {calculatedVolumeM3 > 0 ? `${calculatedVolumeM3.toFixed(2)} m³` : '0.00 m³'}
                  </div>
                  <div className="mt-0.5 flex justify-center items-center">
                    {calculatedFillingRatio <= 0 ? (
                      <span className="text-[10px] text-slate-500 font-mono">[ 0.0% / Max 95% ]</span>
                    ) : calculatedFillingRatio <= 95.0 ? (
                      <span className="text-[10px] font-bold text-emerald-800 font-mono">
                        [ {calculatedFillingRatio.toFixed(1)}% / Max 95% ]
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-red-700 font-mono animate-pulse">
                        [ ⚠️ {calculatedFillingRatio.toFixed(1)}% OVERFILL ]
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-[#f4f2e6] border border-[#a09e90] shadow-inner py-2.5 px-2 flex flex-col justify-center text-center">
                  <span className="text-xs font-bold text-[#0a2558] tracking-wider uppercase mb-0.5 font-sans text-center">
                    DELIV GHV (BTU/KG)
                  </span>
                  <div className="font-mono text-lg font-bold text-[#0a2558] text-center tracking-wide">
                    {parsedDelivGhv.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-slate-500 font-sans mt-0.5">Btu/kg (Mass Heating Value)</span>
                </div>

                <div className="bg-[#f4f2e6] border border-[#a09e90] shadow-inner py-2.5 px-2 flex flex-col justify-center text-center">
                  <span className="text-xs font-bold text-[#0a2558] tracking-wider uppercase mb-0.5 font-sans text-center">
                    DELIVERED ENERGY
                  </span>
                  <div className="font-mono text-xl font-black text-[#15803d] text-center tracking-wide">
                    {calculatedTotalEnergyMMBtu > 0 ? `${calculatedTotalEnergyMMBtu.toFixed(2)} MMBtu` : '0.00 MMBtu'}
                  </div>
                  <span className="text-[10px] text-slate-500 font-sans mt-0.5">(Net Mass × GHV Rate)</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!isCertifyEnabled}
                className={`w-full py-2.5 px-4 font-bold transition-all text-xs sm:text-sm flex items-center justify-center gap-2 border-2 ${
                  isCertifyEnabled
                    ? 'bg-[#0a2558] hover:bg-[#12397a] text-white border-t-blue-400 border-l-blue-400 border-b-[#001030] border-r-[#001030] cursor-pointer shadow-md active:border-t-[#001030] active:border-l-[#001030] active:border-b-blue-400 active:border-r-blue-400'
                    : 'bg-[#d4d0c8] text-slate-400 border-[#808080] cursor-not-allowed opacity-75'
                }`}
              >
                <FileCheck className={`w-4 h-4 ${isCertifyEnabled ? 'text-cyan-300' : 'text-slate-400'}`} />
                <span>{certifyButtonText}</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {activeBatchRecords.length > 0 && (
        <div className="bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] win-panel overflow-hidden transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-bottom-2 shadow-md">
          <div className="bg-[#0a2558] text-white px-3 py-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 select-none">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="font-extrabold text-xs md:text-sm uppercase tracking-wide text-white mr-2">
                  COQ &amp; Delivery Measurement
                </span>
              </div>
              <span className="px-2 py-0.5 bg-[#051636] text-cyan-300 border border-blue-400/40 text-[10px] font-mono font-bold">
                {activeBatchRecords.length} Certified
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={selectedRevokeTankNos.size === 0}
                onClick={handleRevokeSelected}
                className="bg-[#d4d0c8] hover:bg-[#e0dcd4] text-slate-900 border border-t-white border-l-white border-r-[#808080] border-b-[#808080] active:border-slate-800 text-xs font-bold px-3 py-1 rounded-sm shadow-sm transition-all whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-[#d4d0c8]"
              >
                Edit ({selectedRevokeTankNos.size})
              </button>

              <button
                type="button"
                disabled={selectedRevokeTankNos.size === 0}
                onClick={handleProceedToVesselStowage}
                className="bg-[#d4d0c8] hover:bg-[#e0dcd4] text-slate-900 border border-t-white border-l-white border-r-[#808080] border-b-[#808080] active:border-slate-800 text-xs font-bold px-3 py-1 rounded-sm shadow-sm transition-all whitespace-nowrap cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-[#d4d0c8]"
              >
                Loading ({selectedRevokeTankNos.size})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-80 overflow-y-auto border-t border-slate-300">
            <table className="w-full text-left border-collapse min-w-[1300px]">
              <thead className="sticky top-0 z-10 text-[11px] font-bold uppercase tracking-wider">
                <tr className="border-b border-[#a09e90] bg-[#e8e6df] text-[#0a2558] text-[10px] text-center font-bold">
                  <th colSpan={1} className="py-1 px-2 border-r border-[#a09e90] text-center font-bold"></th>
                  <th colSpan={2} className="py-1 px-2 border-r border-[#a09e90] text-center font-bold">Tank No.</th>
                  <th colSpan={3} className="py-1 px-2 border-r border-[#a09e90] text-center font-bold">Weight Scale</th>
                  <th colSpan={3} className="py-1 px-2 border-r border-[#a09e90] text-center font-bold">Properties</th>
                  <th colSpan={8} className="py-1 px-2 border-r border-[#a09e90] text-center font-bold">Component</th>
                  <th colSpan={2} className="py-1 px-2 border-r border-[#a09e90] text-center font-bold">Delivered</th>
                  <th colSpan={1} className="py-1 px-2 text-center font-bold">Certification</th>
                </tr>
                <tr className="border-b border-[#a09e90] bg-[#e8e6df] text-[#0a2558] text-[11px] font-bold">
                  <th className="p-2 border-r border-[#a09e90] text-center w-8">
                    <input
                      type="checkbox"
                      checked={
                        activeBatchRecords.length > 0 &&
                        selectedRevokeTankNos.size === activeBatchRecords.length
                      }
                      onChange={toggleSelectAllRevoke}
                      className="rounded-none border-slate-300 bg-white text-slate-900 cursor-pointer accent-blue-600"
                      title="Select all certified tanks"
                    />
                  </th>
                  <th className="p-2 border-r border-[#a09e90] text-center text-xs font-bold text-[#0a2558] tracking-wide">ISO TANK NO</th>
                  <th className="p-2 border-r border-[#a09e90] text-center text-xs font-bold text-[#0a2558] tracking-wide">SERIAL NO</th>
                  <th className="p-2 border-r border-[#a09e90] text-center text-xs font-bold text-[#0a2558] tracking-wide">TARE (KG)</th>
                  <th className="p-2 border-r border-[#a09e90] text-center text-xs font-bold text-[#0a2558] tracking-wide">GROSS (KG)</th>
                  <th className="p-2 border-r border-[#a09e90] text-center text-xs font-bold text-[#0a2558] tracking-wide">NET MASS (KG)</th>
                  <th className="p-2 border-r border-[#a09e90] text-center text-xs font-bold text-[#0a2558] tracking-wide">TEMP (°C)</th>
                  <th className="p-2 border-r border-[#a09e90] text-center text-xs font-bold text-[#0a2558] tracking-wide">DENSITY (KG/M³)</th>
                  <th className="p-2 border-r border-[#a09e90] text-center text-xs font-bold text-[#0a2558] tracking-wide">GHV (BTU/KG)</th>
                  <th className="p-1.5 border-r border-[#a09e90] text-[#0a2558] text-center text-xs font-bold font-mono tracking-wide">CH₄</th>
                  <th className="p-1.5 border-r border-[#a09e90] text-[#0a2558] text-center text-xs font-bold font-mono tracking-wide">C₂H₆</th>
                  <th className="p-1.5 border-r border-[#a09e90] text-[#0a2558] text-center text-xs font-bold font-mono tracking-wide">C₃H₈</th>
                  <th className="p-1.5 border-r border-[#a09e90] text-[#0a2558] text-center text-xs font-bold font-mono tracking-wide">i-C₄</th>
                  <th className="p-1.5 border-r border-[#a09e90] text-[#0a2558] text-center text-xs font-bold font-mono tracking-wide">n-C₄</th>
                  <th className="p-1.5 border-r border-[#a09e90] text-[#0a2558] text-center text-xs font-bold font-mono tracking-wide">i-C₅</th>
                  <th className="p-1.5 border-r border-[#a09e90] text-[#0a2558] text-center text-xs font-bold font-mono tracking-wide">n-C₅</th>
                  <th className="p-1.5 border-r border-[#a09e90] text-[#0a2558] text-center text-xs font-bold font-mono tracking-wide">N₂</th>
                  <th className="p-2 border-r border-[#a09e90] text-center text-xs font-bold text-[#0a2558] tracking-wide">NET VOL (M³)</th>
                  <th className="p-2 border-r border-[#a09e90] text-center text-xs font-bold text-[#0a2558] tracking-wide">ENERGY (MMBTU)</th>
                  <th className="p-2 text-center text-xs font-bold text-[#0a2558] tracking-wide">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-sm">
                {activeBatchRecords.map((r, idx) => {
                  const tare = r.tareKg ?? r.weightBeforeKg ?? 0;
                  const gross = r.grossKg ?? r.weightAfterKg ?? 0;
                  const netMass = r.netMassKg ?? r.deliveredWeightKg ?? (gross > tare ? gross - tare : 0);
                  const netVol = r.netVolM3 ?? r.deliveredVolumeM3 ?? 0;
                  const energy = r.deliveredMmbtu ?? r.deliveredMMBtu ?? r.energyMMBtu ?? 0;
                  const density = r.densityKgM3 ?? r.deliveredDensity ?? 442.02;
                  const temp = r.liquidTempC ?? r.deliveredTempC ?? -160.0;
                  const ghv = r.deliveredGHV ?? r.ghvBtuScf ?? 52214.94;
                  const isRevokeSelected = selectedRevokeTankNos.has(r.tankNo);

                  return (
                    <tr
                      key={`${r.tankNo}-${idx}`}
                      className={`hover:bg-blue-50/70 transition-colors ${
                        isRevokeSelected
                          ? 'bg-blue-50'
                          : idx % 2 === 0
                          ? 'bg-white'
                          : 'bg-[#fcfbf7]'
                      }`}
                    >
                      <td className="p-2 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={isRevokeSelected}
                          onChange={() => toggleSelectRevokeTank(r.tankNo)}
                          className="rounded-none border-slate-300 bg-white text-slate-900 cursor-pointer accent-blue-600"
                        />
                      </td>
                      <td className="p-2 text-center align-middle font-bold text-blue-950 font-mono text-sm">{r.tankNo}</td>
                      <td className="p-2 text-center align-middle font-mono font-bold text-sm text-[#0a2558]">{r.serialNo}</td>
                      <td className="p-2 text-center align-middle font-mono font-bold text-sm text-[#0a2558]">{tare.toLocaleString()}</td>
                      <td className="p-2 text-center align-middle font-mono font-bold text-sm text-[#0a2558]">{gross.toLocaleString()}</td>
                      <td className="p-2 text-center align-middle font-mono font-bold text-sm text-blue-950 bg-blue-50/40">{netMass.toLocaleString()}</td>
                      <td className="p-2 text-center align-middle font-mono font-bold text-sm text-[#0a2558]">{typeof temp === 'number' ? temp.toFixed(1) : temp}</td>
                      <td className="p-2 text-center align-middle font-mono font-bold text-sm text-[#0a2558]">{typeof density === 'number' ? density.toFixed(2) : density}</td>
                      <td className="p-2 text-center align-middle font-mono font-bold text-sm text-[#0a2558]">{typeof ghv === 'number' ? ghv.toFixed(2) : ghv}</td>
                      <td className="p-1.5 text-center align-middle font-mono font-bold text-sm text-[#0a2558] bg-slate-50/50">{(r.ch4 ?? r.methane ?? 95.5).toFixed(2)}</td>
                      <td className="p-1.5 text-center align-middle font-mono font-bold text-sm text-[#0a2558] bg-slate-50/50">{(r.c2h6 ?? r.ethane ?? 3.39).toFixed(2)}</td>
                      <td className="p-1.5 text-center align-middle font-mono font-bold text-sm text-[#0a2558] bg-slate-50/50">{(r.c3h8 ?? r.propane ?? 0.77).toFixed(2)}</td>
                      <td className="p-1.5 text-center align-middle font-mono font-bold text-sm text-[#0a2558] bg-slate-50/50">{(r.iC4 ?? r.iButane ?? 0.12).toFixed(2)}</td>
                      <td className="p-1.5 text-center align-middle font-mono font-bold text-sm text-[#0a2558] bg-slate-50/50">{(r.nC4 ?? r.nButane ?? 0.14).toFixed(2)}</td>
                      <td className="p-1.5 text-center align-middle font-mono font-bold text-sm text-[#0a2558] bg-slate-50/50">{(r.iC5 ?? r.iPentane ?? 0.03).toFixed(2)}</td>
                      <td className="p-1.5 text-center align-middle font-mono font-bold text-sm text-[#0a2558] bg-slate-50/50">{(r.nC5 ?? r.nPentane ?? 0.01).toFixed(2)}</td>
                      <td className="p-1.5 text-center align-middle font-mono font-bold text-sm text-[#0a2558] bg-slate-50/50">{(r.n2 ?? r.nitrogen ?? 0.04).toFixed(2)}</td>
                      <td className="p-2 text-center align-middle font-mono font-bold text-sm text-blue-900 bg-blue-50/40">{netVol.toFixed(2)}</td>
                      <td className="p-2 text-center align-middle font-mono font-bold text-sm text-emerald-800 bg-emerald-50/40">{energy.toFixed(2)}</td>
                      <td className="p-2 text-center align-middle font-sans">
                        <span className="mx-auto px-2.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-400 text-xs font-bold inline-flex items-center justify-center gap-1 shadow-sm">
                          CERTIFIED
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="sticky bottom-0 bg-[#e3dfd0] border-t-2 border-slate-400 font-mono text-sm font-bold text-[#0a2558]">
                <tr>
                  <td colSpan={3} className="p-2 text-center align-middle font-sans uppercase">
                    Batch Total ({activeBatchRecords.length} Tanks)
                  </td>
                  <td className="p-2 text-center align-middle">
                    {activeBatchRecords.reduce((acc, r) => acc + (r.tareKg ?? r.weightBeforeKg ?? 0), 0).toLocaleString()} kg
                  </td>
                  <td className="p-2 text-center align-middle">
                    {activeBatchRecords.reduce((acc, r) => acc + (r.grossKg ?? r.weightAfterKg ?? 0), 0).toLocaleString()} kg
                  </td>
                  <td className="p-2 text-center align-middle font-black text-blue-950 bg-blue-100/50">
                    {activeBatchRecords.reduce((acc, r) => acc + (r.netMassKg ?? r.deliveredWeightKg ?? 0), 0).toLocaleString()} kg
                  </td>
                  <td colSpan={3} className="p-2 text-center align-middle text-slate-500 font-normal">--</td>
                  <td colSpan={8} className="p-2 text-center align-middle text-slate-500 font-normal bg-slate-100/50">Avg Spec Normalized</td>
                  <td className="p-2 text-center align-middle font-black text-blue-950 bg-blue-100/50">
                    {activeBatchRecords.reduce((acc, r) => acc + (r.netVolM3 ?? r.deliveredVolumeM3 ?? 0), 0).toFixed(2)} m³
                  </td>
                  <td className="p-2 text-center align-middle font-black text-emerald-950 bg-emerald-100/50">
                    {activeBatchRecords.reduce((acc, r) => acc + (r.deliveredMmbtu ?? r.deliveredMMBtu ?? 0), 0).toFixed(2)} MMBtu
                  </td>
                  <td colSpan={1} className="p-2 text-center align-middle text-emerald-800 font-sans">
                    ✓ All Certified
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
