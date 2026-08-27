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

interface ArunLoadingCoqTabProps {
  onSuccessToast?: (msg: string) => void;
  activeBatchRecords?: any[];
  addDeliveredMeasurement?: (record: any, coq?: any) => void;
  activeCandidateTankNo?: string | null;
  stagedForLoadingTankNos?: Set<string>;
}

export default function ArunLoadingCoqTab({
  onSuccessToast,
  activeBatchRecords: propsActiveBatchRecords,
  addDeliveredMeasurement: propsAddDeliveredMeasurement,
  activeCandidateTankNo,
  stagedForLoadingTankNos = new Set(),
}: ArunLoadingCoqTabProps) {
  const portalData = usePortalData() || {};
  const fleetTanks: FleetTankItem[] = portalData.fleetTanks || [];

  // Local state fallback if not passed from container hook
  const [localBatchRecords, setLocalBatchRecords] = useState<any[]>([]);
  const activeBatchRecords = propsActiveBatchRecords !== undefined ? propsActiveBatchRecords : localBatchRecords;

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
  const [formWeightAfter, setFormWeightAfter] = useState<number>(0);
  const [formDensity, setFormDensity] = useState<number>(445.0);
  const [formTemp, setFormTemp] = useState<number>(-160.0);
  const [formGHV, setFormGHV] = useState<number>(52214.94);
  const [formGUPVol, setFormGUPVol] = useState<number>(0);
  const [formGUPEnergy, setFormGUPEnergy] = useState<number>(0);
  const [formCDTemp, setFormCDTemp] = useState<number>(-160.0);
  const [formCDVol, setFormCDVol] = useState<number>(0);
  const [formCDEnergy, setFormCDEnergy] = useState<number>(0);

  // 11-Gas Components Form State
  const [ch4, setCh4] = useState<number>(0);
  const [c2h6, setC2h6] = useState<number>(0);
  const [c3h8, setC3h8] = useState<number>(0);
  const [iC4, setIC4] = useState<number>(0);
  const [nC4, setNC4] = useState<number>(0);
  const [iC5, setIC5] = useState<number>(0);
  const [nC5, setNC5] = useState<number>(0);
  const [c6Plus, setC6Plus] = useState<number>(0);
  const [n2, setN2] = useState<number>(0);
  const [co2, setCo2] = useState<number>(0);
  const [coqGhv, setCoqGhv] = useState<number>(0);

  const selectedTankMaster = useMemo(() => {
    return fleetTanks.find((t) => t.tankNo === formTankNo) || fleetTanks[0];
  }, [fleetTanks, formTankNo]);

  const handleSelectTank = useCallback((tank: FleetTankItem) => {
    setFormTankNo(tank.tankNo);
    const metrics = getTankPhysicalMetrics(tank.tankNo, tank.serialNo);
    setFormTemp(tank.tempC && tank.tempC !== 0 ? tank.tempC : metrics.tempC);
    const dryTare = tank.arrivalHeelMetrics?.tareWeightKg || metrics.dryTareKg;
    const heelMass = tank.arrivalHeelMetrics?.arrivalMassKg || metrics.heelMassKg;
    const preLoadTare = dryTare + heelMass;
    setFormWeightBefore(preLoadTare);
    setFormWeightAfter(0);
    setFormGUPEnergy(0);
    setFormGUPVol(0);
    setFormCDEnergy(0);
    setFormCDVol(0);
    setCh4(0);
    setC2h6(0);
    setC3h8(0);
    setIC4(0);
    setNC4(0);
    setIC5(0);
    setNC5(0);
    setC6Plus(0);
    setN2(0);
    setCo2(0);
    setCoqGhv(0);
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
    setCh4(activeCOQSpec.methane);
    setC2h6(activeCOQSpec.ethane);
    setC3h8(activeCOQSpec.propane);
    setIC4(activeCOQSpec.iButane);
    setNC4(activeCOQSpec.nButane);
    setIC5(activeCOQSpec.iPentane);
    setNC5(activeCOQSpec.nPentane);
    setC6Plus(activeCOQSpec.c6Plus || 0);
    setN2(activeCOQSpec.nitrogen);
    setCo2(activeCOQSpec.co2);
    setCoqGhv(activeCOQSpec.ghv);
    setFormGHV(52214.94);
  };

  const handleClearGasSpec = () => {
    setCh4(0);
    setC2h6(0);
    setC3h8(0);
    setIC4(0);
    setNC4(0);
    setIC5(0);
    setNC5(0);
    setC6Plus(0);
    setN2(0);
    setCo2(0);
    setCoqGhv(0);
  };

  const consoleCandidateTanks = useMemo(() => {
    const hasStaged = stagedForLoadingTankNos.size > 0 || activeBatchRecords.length > 0;
    const list = fleetTanks.filter((t) => {
      const isStagedOrCertified =
        stagedForLoadingTankNos.has(t.tankNo) ||
        activeBatchRecords.some((r) => r.tankNo === t.tankNo);

      const isCandidate = hasStaged
        ? isStagedOrCertified
        : t.node === NodeState.NODE_1_ARUN_PAG_TERMINAL ||
          t.location.includes('Aceh') ||
          t.location.includes('Arun');

      if (!isCandidate) return false;

      const q = consoleTankSearch.toLowerCase().trim();
      if (!q) return true;
      return (
        t.tankNo.toLowerCase().includes(q) ||
        t.serialNo.toLowerCase().includes(q) ||
        t.position.toLowerCase().includes(q)
      );
    });
    return sortTanksNaturally(list);
  }, [fleetTanks, consoleTankSearch, stagedForLoadingTankNos, activeBatchRecords]);

  const calculatedLoadedWeight = useMemo(() => {
    if (formWeightAfter <= 0 || formWeightAfter <= formWeightBefore) return 0;
    return formWeightAfter - formWeightBefore;
  }, [formWeightAfter, formWeightBefore]);

  const calculatedVolumeM3 = useMemo(() => {
    if (calculatedLoadedWeight <= 0 || formDensity <= 0) return 0;
    return parseFloat((calculatedLoadedWeight / formDensity).toFixed(2));
  }, [calculatedLoadedWeight, formDensity]);

  const calculatedBtuLoaded = useMemo(() => {
    if (calculatedLoadedWeight <= 0) return 0;
    return parseFloat((calculatedLoadedWeight * formGHV).toFixed(0));
  }, [calculatedLoadedWeight, formGHV]);

  const calculatedBtuLoadedMMBtu = useMemo(() => {
    if (calculatedLoadedWeight <= 0) return 0;
    return parseFloat((calculatedBtuLoaded / 1000000).toFixed(2));
  }, [calculatedBtuLoaded, calculatedLoadedWeight]);

  const calculatedTotalDeliveredVol = useMemo(() => {
    if (calculatedVolumeM3 <= 0 && formGUPVol <= 0 && formCDVol <= 0) return 0;
    return parseFloat((calculatedVolumeM3 + formGUPVol + formCDVol).toFixed(2));
  }, [calculatedVolumeM3, formGUPVol, formCDVol]);

  const calculatedTotalEnergyMMBtu = useMemo(() => {
    if (calculatedLoadedWeight <= 0 && formGUPEnergy <= 0 && formCDEnergy <= 0) return 0;
    return parseFloat((calculatedBtuLoadedMMBtu + formGUPEnergy + formCDEnergy).toFixed(2));
  }, [calculatedBtuLoadedMMBtu, formGUPEnergy, formCDEnergy, calculatedLoadedWeight]);

  const handleCreateLoadingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (calculatedLoadedWeight <= 0) {
      alert('Please enter a valid Gross Weight (Gross > Tare) before issuing certificate.');
      return;
    }

    const serialNo = selectedTankMaster?.serialNo || 'TRSU-ARUN';
    const activeShipment = formShipment.trim() || 'N-2';
    const activeDate = formDate || new Date().toISOString().split('T')[0];

    addDeliveredMeasurement(
      {
        tankNo: formTankNo,
        serialNo,
        shipment: activeShipment,
        weightBeforeKg: formWeightBefore,
        weightAfterKg: formWeightAfter,
        deliveredWeightKg: calculatedLoadedWeight,
        deliveredVolumeM3: calculatedVolumeM3,
        deliveredDensity: formDensity,
        deliveredTempC: formTemp,
        deliveredGHV: formGHV,
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
        status: 'CERTIFIED / STAGED',
        remarks: `Arun PAG Delivered Measurement Certified (Batch ${activeShipment})`,
      },
      {
        source: 'Arun PAG COQ Lab',
        samplePoint: `${formTankNo} (${serialNo})`,
        reportDate: activeDate,
        methane: ch4 || activeCOQSpec.methane,
        ethane: c2h6 || activeCOQSpec.ethane,
        propane: c3h8 || activeCOQSpec.propane,
        iButane: iC4 || activeCOQSpec.iButane,
        nButane: nC4 || activeCOQSpec.nButane,
        iPentane: iC5 || activeCOQSpec.iPentane,
        nPentane: nC5 || activeCOQSpec.nPentane,
        c6Plus: c6Plus || activeCOQSpec.c6Plus || 0.05,
        nitrogen: n2 || activeCOQSpec.nitrogen,
        co2: co2 || activeCOQSpec.co2,
        ghv: coqGhv || activeCOQSpec.ghv,
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
      setFormWeightAfter(0);
      setFormGUPVol(0);
      setFormGUPEnergy(0);
      setFormCDVol(0);
      setFormCDEnergy(0);
      handleClearGasSpec();
    }
  };

  const handleExportBatchCSV = () => {
    exportToCSV(
      activeBatchRecords,
      `PAGT_Arun_Loading_Delivered_Batch_${formShipment || 'Active'}_${new Date().toISOString().split('T')[0]}`
    );
  };

  const loadedCount = activeBatchRecords.length;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Main Console Box with Industrial SCADA Outset Bevel */}
      <form
        onSubmit={handleCreateLoadingSubmit}
        className="bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] win-panel p-2 space-y-2.5 shadow-sm"
      >
        {/* SCADA Console Main Title Bar */}
        <div className="bg-[#0a2558] text-white px-2.5 py-1.5 flex flex-col sm:flex-row justify-between sm:items-center gap-1.5 select-none">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-cyan-300" />
            <h3 className="text-xs sm:text-sm font-bold tracking-wide uppercase text-white">
              Arun PAG Live Loading & COQ Certification Console
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
            <span className="bg-[#051636] border border-blue-400/40 px-2 py-0.5 text-emerald-300 font-bold">
              Ready: {loadedCount}/10 Loaded ({consoleCandidateTanks.length} Candidates)
            </span>
            <span className="bg-[#051636] border border-blue-400/40 px-2 py-0.5 text-cyan-300 font-bold">
              Target: Batch {formShipment || 'N-2'}
            </span>
          </div>
        </div>

        {/* 3-Column SCADA Panel Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 text-xs">
          {/* ========================================================================= */}
          {/* Column 1: Select ISO Tank                                                 */}
          {/* ========================================================================= */}
          <div className="lg:col-span-4 bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] win-panel p-2 flex flex-col justify-between gap-2">
            <div className="flex flex-col h-full">
              {/* Section Header */}
              <div className="bg-[#0a2558] text-white text-xs font-bold px-2 py-1 flex items-center justify-between tracking-wide uppercase mb-2">
                <span className="flex items-center gap-1.5 text-white">
                  <Boxes className="w-3.5 h-3.5 text-cyan-300" />
                  1. SELECT ISO TANK
                </span>
                <span className="font-mono text-[10px] text-cyan-200 uppercase">
                  {consoleCandidateTanks.length} CANDIDATES
                </span>
              </div>

              {/* Quick Search */}
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

              {/* Scrollable Candidate Box - Expanded to fill panel cleanly */}
              <div className="max-h-72 overflow-y-auto space-y-1 border border-t-[#808080] border-l-[#808080] border-b-white border-r-white bg-white p-1 flex-1">
                {consoleCandidateTanks.map((tank) => {
                  const isSelected = formTankNo === tank.tankNo;
                  const isTankCertified = activeBatchRecords.some((r) => r.tankNo === tank.tankNo);
                  const metrics = getTankPhysicalMetrics(tank.tankNo, tank.serialNo);
                  const heelMass = tank.arrivalHeelMetrics?.arrivalMassKg || metrics.heelMassKg;
                  const heelVol = metrics.heelVolumeM3 || (heelMass / LNG_LIQUID_DENSITY_KG_M3);
                  const pressMpa = tank.pressureMPa || metrics.pressureMPa;
                  const tempC = tank.tempC || metrics.tempC;

                  return (
                    <div
                      key={tank.tankNo}
                      onClick={() => handleSelectTank(tank)}
                      className={`p-1.5 border transition-all cursor-pointer flex items-center justify-between text-xs select-none ${
                        isSelected
                          ? 'bg-[#0a2558] text-white border-[#0a2558] font-bold'
                          : isTankCertified
                          ? 'bg-emerald-50/70 border-emerald-300 text-slate-900 hover:bg-emerald-100/60'
                          : 'bg-white border-slate-200 text-slate-900 hover:bg-blue-50/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono font-bold ${isSelected ? 'text-white' : 'text-blue-900'}`}>
                            {tank.tankNo}
                          </span>
                          <span className={`text-[10px] font-mono ${isSelected ? 'text-blue-200' : 'text-slate-500'}`}>
                            ({tank.serialNo})
                          </span>
                          {isTankCertified && (
                            <span className="px-1.5 py-0.2 rounded-none bg-emerald-700 text-white font-mono text-[9px] font-bold">
                              ✓ CERTIFIED
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] block ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                          {isTankCertified ? 'Staged for Departure' : (tank.position || 'Arun PAG Yard')}
                        </span>
                      </div>
                      <div className="text-right font-mono">
                        <div className={`text-[11px] font-bold ${isSelected ? 'text-cyan-300' : isTankCertified ? 'text-emerald-800' : 'text-slate-950'}`}>
                          {heelVol.toFixed(2)} m³ (~{heelMass} kg)
                        </div>
                        <div className={`text-[10px] ${isSelected ? 'text-slate-200' : 'text-slate-600'}`}>
                          {pressMpa.toFixed(2)} MPa • {tempC.toFixed(1)}°C
                        </div>
                      </div>
                    </div>
                  );
                })}
                {consoleCandidateTanks.length === 0 && (
                  <div className="text-center py-6 text-slate-500 font-sans text-xs">
                    No matching candidate tanks found.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* Column 2: Weighbridge Scale & Physicals                                   */}
          {/* ========================================================================= */}
          <div className="lg:col-span-4 bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] win-panel p-2 flex flex-col justify-between gap-2">
            <div className="space-y-2">
              {/* Section Header */}
              <div className="bg-[#0a2558] text-white text-xs font-bold px-2 py-1 flex items-center justify-between tracking-wide uppercase">
                <span className="flex items-center gap-1.5 text-white">
                  <Weight className="w-3.5 h-3.5 text-cyan-300" />
                  2. Weighbridge Scale & Physicals
                </span>
                <span className="font-mono text-[10px] text-cyan-200">
                  {selectedTankMaster?.tankNo || 'ISOT-007'}
                </span>
              </div>

              {/* Batch Metadata: Target Shipment & Date Settings */}
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div>
                  <label className="text-slate-700 block mb-0.5 font-sans text-[10px] font-bold uppercase">
                    Shipment Target:
                  </label>
                  <input
                    type="text"
                    value={formShipment}
                    onChange={(e) => setFormShipment(e.target.value)}
                    className="w-full bg-white border border-t-[#808080] border-l-[#808080] border-b-white border-r-white font-mono text-xs font-bold text-blue-950 px-2 py-0.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-0.5 font-sans text-[10px] font-bold uppercase">
                    Loading Date:
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-white border border-t-[#808080] border-l-[#808080] border-b-white border-r-white font-mono text-xs font-bold text-slate-900 px-2 py-0.5 focus:outline-none"
                  />
                </div>
              </div>

              {/* Tare & Gross Scale Readings */}
              <div className="grid grid-cols-2 gap-2 font-mono">
                {/* Pre-Load Tare (Read-only Inset Display) */}
                <div className="bg-[#d4d0c8] p-1.5 border border-t-[#808080] border-l-[#808080] border-b-white border-r-white">
                  <span className="text-[10px] text-slate-700 font-bold uppercase block font-sans">
                    Pre-Load Tare (Kg)
                  </span>
                  <div className="font-mono text-sm font-bold text-slate-900 py-0.5">
                    {formWeightBefore.toLocaleString()} kg
                  </div>
                  <span className="text-[9px] text-slate-600 block">Baseline 10,850 + Heel</span>
                </div>

                {/* Gross Loaded Input (High-Contrast Active Operational Box) */}
                <div className="bg-[#e8f0fe] p-1.5 border-2 border-[#0a2558]">
                  <span className="text-[10px] text-blue-900 font-bold uppercase block font-sans">
                    Gross Loaded (Kg) *
                  </span>
                  <input
                    type="number"
                    value={formWeightAfter === 0 ? '' : formWeightAfter}
                    placeholder="e.g. 29,795"
                    onChange={(e) => setFormWeightAfter(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border-2 border-[#0a2558] font-mono text-sm font-bold text-blue-900 focus:outline-none focus:ring-1 focus:ring-[#0a2558] px-2 py-0.5"
                  />
                  <span className="text-[9px] text-blue-800 font-semibold block">Enter weighbridge gross</span>
                </div>
              </div>

              {/* Physical Parameters: Density & Temperature */}
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div>
                  <label className="text-slate-700 block mb-0.5 font-sans text-[10px] font-bold uppercase">
                    Density (kg/m³):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formDensity}
                    onChange={(e) => setFormDensity(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-t-[#808080] border-l-[#808080] border-b-white border-r-white px-2 py-0.5 text-slate-900 font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-0.5 font-sans text-[10px] font-bold uppercase">
                    Loading Temp (°C):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formTemp}
                    onChange={(e) => setFormTemp(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-t-[#808080] border-l-[#808080] border-b-white border-r-white px-2 py-0.5 text-slate-900 font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Calculated Outputs Summary Card (SCADA Inset Display) */}
              <div className="bg-[#d4d0c8] border border-t-[#808080] border-l-[#808080] border-b-white border-r-white p-2.5 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between border-b border-slate-300 pb-1">
                  <span className="text-slate-700 font-bold font-sans">Net Loaded Mass:</span>
                  <strong className="text-slate-950 font-black text-sm">
                    {calculatedLoadedWeight.toLocaleString()} kg
                  </strong>
                </div>
                <div className="flex justify-between border-b border-slate-300 pb-1">
                  <span className="text-slate-700 font-bold font-sans">Net Liquid Volume:</span>
                  <strong className="text-blue-950 font-bold text-sm">
                    {calculatedVolumeM3.toFixed(2)} m³
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700 font-bold font-sans">Delivered Energy:</span>
                  <strong className="text-blue-900 font-black text-sm">
                    {calculatedTotalEnergyMMBtu.toFixed(2)} MMBtu
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* Column 3: Lab Gas Chromatography & Certification                          */}
          {/* ========================================================================= */}
          <div className="lg:col-span-4 bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] win-panel p-2 flex flex-col justify-between gap-2">
            <div className="space-y-2">
              {/* Section Header with Quick Actions */}
              <div className="bg-[#0a2558] text-white text-xs font-bold px-2 py-1 flex items-center justify-between tracking-wide uppercase">
                <span className="flex items-center gap-1.5 text-white">
                  <Atom className="w-3.5 h-3.5 text-cyan-300" />
                  3. Lab Gas Chromatography
                </span>
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

              {/* 11 Component Inputs Grid */}
              <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
                <div>
                  <label className="text-slate-700 block text-[9px] font-bold">CH₄ (Methane):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ch4 === 0 ? '' : ch4}
                    placeholder="95.50"
                    onChange={(e) => setCh4(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-t-[#808080] border-l-[#808080] border-b-white border-r-white px-1.5 py-0.5 font-bold text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block text-[9px] font-bold">C₂H₆ (Ethane):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={c2h6 === 0 ? '' : c2h6}
                    placeholder="3.39"
                    onChange={(e) => setC2h6(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-t-[#808080] border-l-[#808080] border-b-white border-r-white px-1.5 py-0.5 font-bold text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block text-[9px] font-bold">C₃H₈ (Propane):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={c3h8 === 0 ? '' : c3h8}
                    placeholder="0.77"
                    onChange={(e) => setC3h8(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-t-[#808080] border-l-[#808080] border-b-white border-r-white px-1.5 py-0.5 font-bold text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block text-[9px] font-bold">i-C₄H₁₀:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={iC4 === 0 ? '' : iC4}
                    placeholder="0.15"
                    onChange={(e) => setIC4(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-t-[#808080] border-l-[#808080] border-b-white border-r-white px-1.5 py-0.5 font-bold text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block text-[9px] font-bold">n-C₄H₁₀:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={nC4 === 0 ? '' : nC4}
                    placeholder="0.12"
                    onChange={(e) => setNC4(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-t-[#808080] border-l-[#808080] border-b-white border-r-white px-1.5 py-0.5 font-bold text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block text-[9px] font-bold">N₂ (Nitrogen):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={n2 === 0 ? '' : n2}
                    placeholder="0.04"
                    onChange={(e) => setN2(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-t-[#808080] border-l-[#808080] border-b-white border-r-white px-1.5 py-0.5 font-bold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Submit Button */}
              <div className="pt-2 border-t border-slate-300">
                <button
                  type="submit"
                  disabled={calculatedLoadedWeight <= 0}
                  className={`w-full py-2 px-3 font-bold transition-all text-xs flex items-center justify-center gap-2 border-2 ${
                    calculatedLoadedWeight > 0
                      ? 'bg-[#0a2558] hover:bg-[#12397a] text-white border-t-blue-400 border-l-blue-400 border-b-[#001030] border-r-[#001030] cursor-pointer shadow-md active:border-t-[#001030] active:border-l-[#001030] active:border-b-blue-400 active:border-r-blue-400'
                      : 'bg-[#d4d0c8] text-slate-400 border-[#808080] cursor-not-allowed opacity-75'
                  }`}
                >
                  <FileCheck className="w-4 h-4" />
                  <span>
                    {calculatedLoadedWeight > 0
                      ? `Certify & Stage ${formTankNo} (${calculatedTotalEnergyMMBtu.toFixed(2)} MMBtu)`
                      : `Enter Gross Weight to Certify ${formTankNo}`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* ========================================================================= */}
      {/* 4. ACTIVE BATCH CERTIFIED LEDGER (Tabular Harmony with Deep Navy Header)  */}
      {/* ========================================================================= */}
      <div className="bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] win-panel overflow-hidden">
        {/* Ledger Panel Header Bar */}
        <div className="bg-[#0a2558] text-white px-3 py-1.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 select-none">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-xs uppercase tracking-wider text-white">
              Active Loading & Custody Measurement Ledger ({formShipment.trim() || 'N-2'})
            </span>
            <span className="px-2 py-0.5 bg-[#051636] text-cyan-300 border border-blue-400/40 text-[10px] font-mono font-bold">
              {activeBatchRecords.length} Certified
            </span>
          </div>
          <button
            type="button"
            onClick={handleExportBatchCSV}
            disabled={activeBatchRecords.length === 0}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold transition-all border-2 ${
              activeBatchRecords.length > 0
                ? 'bg-[#ece9d8] hover:bg-[#dfdbce] active:border-t-[#808080] active:border-l-[#808080] active:border-b-white active:border-r-white border-t-white border-l-white border-b-[#808080] border-r-[#808080] text-slate-900 cursor-pointer'
                : 'bg-[#d4d0c8] text-slate-400 border-[#808080] cursor-not-allowed opacity-60'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Active Batch (.CSV)</span>
          </button>
        </div>

        {/* Unified Table Container */}
        <div className="overflow-x-auto max-h-64 overflow-y-auto border-t border-slate-300">
          <table className="w-full text-left border-collapse text-xs min-w-[900px]">
            <thead className="sticky top-0 bg-[#0a2558] text-white z-10 font-bold uppercase tracking-wider border-b border-slate-400">
              <tr>
                <th className="p-2.5">TANK NO</th>
                <th className="p-2.5">SERIAL NO</th>
                <th className="p-2.5 text-right">TARE (KG)</th>
                <th className="p-2.5 text-right">GROSS (KG)</th>
                <th className="p-2.5 text-right">NET MASS (KG)</th>
                <th className="p-2.5 text-right">NET VOL (M³)</th>
                <th className="p-2.5 text-right">ENERGY (MMBTU)</th>
                <th className="p-2.5 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {activeBatchRecords.map((r, idx) => (
                <tr
                  key={`${r.tankNo}-${idx}`}
                  className={`hover:bg-blue-50/50 transition-colors ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                  }`}
                >
                  <td className="p-2.5 font-bold text-blue-900">{r.tankNo}</td>
                  <td className="p-2.5 text-slate-700">{r.serialNo}</td>
                  <td className="p-2.5 text-right text-slate-800">
                    {(r.weightBeforeKg || r.tareKg || 0).toLocaleString()} kg
                  </td>
                  <td className="p-2.5 text-right text-slate-800">
                    {(r.weightAfterKg || r.grossKg || 0).toLocaleString()} kg
                  </td>
                  <td className="p-2.5 text-right font-bold text-slate-950">
                    {(r.deliveredWeightKg || r.netMassKg || 0).toLocaleString()} kg
                  </td>
                  <td className="p-2.5 text-right text-slate-900">
                    {(r.deliveredVolumeM3 || r.netVolM3 || 0).toFixed(2)} m³
                  </td>
                  <td className="p-2.5 text-right font-bold text-blue-900">
                    {(r.deliveredMMBtu || r.energyMMBtu || 0).toFixed(2)} MMBtu
                  </td>
                  <td className="p-2.5 text-center font-sans">
                    <span className="px-2 py-0.5 rounded-none bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold inline-flex items-center gap-1">
                      CERTIFIED / STAGED
                    </span>
                  </td>
                </tr>
              ))}
              {activeBatchRecords.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-600 font-sans text-xs bg-white">
                    No tanks certified yet for active batch {formShipment.trim() || 'N-2'}. Select candidates above to load and certify.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
