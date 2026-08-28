// src/components/locations/arun/ArunMasterHistoryTab.tsx
"use client";

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileCheck,
  Zap,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { usePortalData } from '../../../context/PortalDataContext';
import { exportToCSV } from '../../../utils/exportCsv';
import { exportLedgerToExcel } from '../../../utils/exportExcelLedger';
import { exportTransitLossAuditToExcel } from '../../../utils/exportTransitLossAuditExcel';
import { calculateGaugeDriftError, sortTanksNaturally } from '../../../utils/scadaCalculations';

export default function ArunMasterHistoryTab() {
  const portalData = usePortalData() || {};
  const fleetTanks = portalData.fleetTanks || [];
  const certificateRecords: any[] = (portalData as any).certificateRecords || portalData.settlementRecords || [];

  const [ledgerMode, setLedgerMode] = useState<'CUSTODY_ENERGY' | 'GAUGE_CALIBRATION'>('CUSTODY_ENERGY');
  const [historySearch, setHistorySearch] = useState('');
  const [historyShipmentFilter, setHistoryShipmentFilter] = useState('ALL');
  const [historyDateFilter, setHistoryDateFilter] = useState('ALL');
  const [calibVoyageFilter, setCalibVoyageFilter] = useState('ALL');
  const [calibStatusFilter, setCalibStatusFilter] = useState('ALL');
  const [calibSearch, setCalibSearch] = useState('');
  const [sortField, setSortField] = useState<
    'tankNo' | 'date' | 'deliveredWeightKg' | 'deliveredVolumeM3' | 'deliveredMMBtu'
  >('date');
  const [sortAsc, setSortAsc] = useState(false);

  // Excel Export Preview Modal States
  const [isExportPreviewOpen, setIsExportPreviewOpen] = useState(false);
  const [previewActiveSheet, setPreviewActiveSheet] = useState<string>('');

  // Loss Audit & Breakdown Modal State
  const [activeLossAuditModal, setActiveLossAuditModal] = useState<{
    record: any;
    mode: 'NIAS_GROSS' | 'BOG_LOSS_SHEET';
  } | null>(null);

  const distinctShipments = useMemo(() => {
    const list = certificateRecords.map((r) => r.shipment || 'N-1');
    return Array.from(new Set(list));
  }, [certificateRecords]);

  const filteredHistoryRecords = useMemo(() => {
    const filtered = certificateRecords.filter((cert) => {
      const q = historySearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        cert.tankNo.toLowerCase().includes(q) ||
        cert.serialNo.toLowerCase().includes(q) ||
        (cert.shipment && cert.shipment.toLowerCase().includes(q));

      const matchShipment =
        historyShipmentFilter === 'ALL' || (cert.shipment || 'N-1') === historyShipmentFilter;
      const matchDate = historyDateFilter === 'ALL' || cert.date === historyDateFilter;

      return matchSearch && matchShipment && matchDate;
    });

    return filtered.sort((a, b) => {
      if (sortField === 'tankNo') {
        const numA = parseInt((a.tankNo || '').replace(/\D/g, ''), 10) || 0;
        const numB = parseInt((b.tankNo || '').replace(/\D/g, ''), 10) || 0;
        if (numA !== numB) {
          return sortAsc ? numA - numB : numB - numA;
        }
        return sortAsc
          ? (a.tankNo || '').localeCompare(b.tankNo || '')
          : (b.tankNo || '').localeCompare(a.tankNo || '');
      }

      const valA = a[sortField];
      const valB = b[sortField];

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? Number(valA || 0) - Number(valB || 0) : Number(valB || 0) - Number(valA || 0);
    });
  }, [
    certificateRecords,
    historySearch,
    historyShipmentFilter,
    historyDateFilter,
    sortField,
    sortAsc,
  ]);

  const calibrationRecords = useMemo(() => {
    const baseSource = certificateRecords.length > 0 ? certificateRecords : fleetTanks.slice(0, 14);

    const list = baseSource.map((rec: any, idx: number) => {
      const BASE_DRY_TARE_KG = 10850;
      const LOADED_CARGO_BASE_KG = 18100;
      const MAX_DESIGN_LOSS_LIMIT_PCT = 1.78;

      const rawShipment = rec.shipment || rec.batchId || `N-${Math.floor(idx / 7) + 1}`;
      const voyageNo = String(rawShipment).startsWith('VOY-')
        ? String(rawShipment)
        : `VOY-2026-${String(rawShipment).replace(/^Batch\s+/i, '')}`;

      const tankNo = rec.tankNo || rec.isoTankNo || `ISOT-${String(idx + 1).padStart(3, '0')}`;
      const serialNo = rec.serialNo || `SN-${90100 + idx}`;

      const densityKgM3 = Number(rec.deliveredDensity ?? rec.densityKgM3 ?? rec.density ?? 442.02);
      const stage1HeelKg = Number(rec.offloadHeelMassKg ?? 310 + (idx % 6) * 18);
      const niasHeelM3 = Number((stage1HeelKg / densityKgM3).toFixed(2));
      const niasEstGrossKg = BASE_DRY_TARE_KG + stage1HeelKg;

      const arunWeighbridgeKg = Number(
        rec.preLoadTare ?? rec.tareKg ?? rec.arrivalGrossKg ?? (10980 + (idx % 5) * 35)
      );

      const transitLossKg = Math.max(0, niasEstGrossKg - arunWeighbridgeKg);
      const actualLossPct = Number(((transitLossKg / LOADED_CARGO_BASE_KG) * 100).toFixed(2));
      const status = actualLossPct <= MAX_DESIGN_LOSS_LIMIT_PCT ? 'PASS' : 'HIGH_LOSS';

      return {
        id: `reconcile-${tankNo}-${idx}`,
        tankNo,
        serialNo,
        voyageNo,
        shipment: rawShipment,
        niasInitPress: 8.0,
        niasTargetPress: 3.0,
        niasHeelM3,
        tempC: -126.5,
        densityKgM3,
        niasEstGrossKg,
        arunWeighbridgeKg,
        transitLossKg,
        actualLossPct,
        designLimitPct: MAX_DESIGN_LOSS_LIMIT_PCT,
        status,
      };
    });
    return list;
  }, [certificateRecords, fleetTanks]);

  const distinctVoyages = useMemo(() => {
    const list = calibrationRecords.map((r) => r.voyageNo);
    return Array.from(new Set(list));
  }, [calibrationRecords]);

  const filteredCalibrationRecords = useMemo(() => {
    return calibrationRecords.filter((r) => {
      const matchVoyage = calibVoyageFilter === 'ALL' || r.voyageNo === calibVoyageFilter;
      const matchStatus = calibStatusFilter === 'ALL' || r.status === calibStatusFilter;
      const matchSearch =
        !calibSearch ||
        r.tankNo.toLowerCase().includes(calibSearch.toLowerCase()) ||
        r.serialNo.toLowerCase().includes(calibSearch.toLowerCase());
      return matchVoyage && matchStatus && matchSearch;
    });
  }, [calibrationRecords, calibVoyageFilter, calibStatusFilter, calibSearch]);

  const calibSums = useMemo(() => {
    if (filteredCalibrationRecords.length === 0) {
      return { totalTransitLoss: 0, avgLossPct: 0, overallPass: true };
    }
    const totalTransitLoss = filteredCalibrationRecords.reduce((acc, r) => acc + r.transitLossKg, 0);
    const avgLossPct =
      filteredCalibrationRecords.reduce((acc, r) => acc + r.actualLossPct, 0) /
      filteredCalibrationRecords.length;
    const overallPass = filteredCalibrationRecords.every((r) => r.status === 'PASS');
    return { totalTransitLoss, avgLossPct, overallPass };
  }, [filteredCalibrationRecords]);

  const historySums = useMemo(() => {
    return filteredHistoryRecords.reduce(
      (acc, r) => {
        const tare = r.tareKg ?? r.preLoadTare ?? r.weightBeforeKg ?? 10850;
        const netMass = r.netMassKg ?? r.deliveredWeightKg ?? 0;
        const gross = r.grossKg ?? r.weightAfterKg ?? (tare + netMass);
        const density = r.deliveredDensity ?? r.densityKgM3 ?? r.density ?? 442.02;
        const netVol = r.deliveredVolumeM3 ?? r.netVolM3 ?? (density > 0 ? netMass / density : 0);
        const energy = r.deliveredMmbtu ?? r.deliveredMMBtu ?? r.energyMMBtu ?? 0;

        return {
          tare: acc.tare + tare,
          gross: acc.gross + gross,
          netMass: acc.netMass + netMass,
          netVol: acc.netVol + netVol,
          energy: acc.energy + energy,
        };
      },
      { tare: 0, gross: 0, netMass: 0, netVol: 0, energy: 0 }
    );
  }, [filteredHistoryRecords]);

  // Multi-Sheet Preview Calculation
  const previewSheets = useMemo(() => {
    const sheets: Record<string, any[]> = {};
    if (historyShipmentFilter === 'ALL') {
      filteredHistoryRecords.forEach((r) => {
        const rawBatch = r.shipment || r.batchId || 'N-1';
        const key = `Batch ${String(rawBatch).replace(/^Batch\s+/i, '')}`;
        if (!sheets[key]) sheets[key] = [];
        sheets[key].push(r);
      });
      if (Object.keys(sheets).length === 0) {
        sheets['Batch N-1'] = [];
      }
    } else {
      const key = `Batch ${String(historyShipmentFilter).replace(/^Batch\s+/i, '')}`;
      sheets[key] = filteredHistoryRecords;
    }
    return sheets;
  }, [filteredHistoryRecords, historyShipmentFilter]);

  const sheetNames = useMemo(() => Object.keys(previewSheets), [previewSheets]);

  React.useEffect(() => {
    if (sheetNames.length > 0 && !sheetNames.includes(previewActiveSheet)) {
      setPreviewActiveSheet(sheetNames[0]);
    }
  }, [sheetNames, previewActiveSheet]);

  const activeSheetRecords = useMemo(
    () => previewSheets[previewActiveSheet] || [],
    [previewSheets, previewActiveSheet]
  );

  const activeSheetKPIs = useMemo(() => {
    const count = activeSheetRecords.length;
    const netMass = activeSheetRecords.reduce(
      (sum, r) => sum + (r.netMassKg ?? r.deliveredWeightKg ?? 0),
      0
    );
    const energy = activeSheetRecords.reduce(
      (sum, r) => sum + (r.deliveredMmbtu ?? r.deliveredMMBtu ?? r.energyMMBtu ?? 0),
      0
    );
    return { count, netMass, energy };
  }, [activeSheetRecords]);

  const handleOpenExportPreview = () => {
    if (sheetNames.length > 0) {
      setPreviewActiveSheet(sheetNames[0]);
    }
    setIsExportPreviewOpen(true);
  };

  const handleConfirmDownload = async () => {
    await exportLedgerToExcel(filteredHistoryRecords, historyShipmentFilter);
    setIsExportPreviewOpen(false);
  };

  const handleExportCalibrationCSV = async () => {
    await exportTransitLossAuditToExcel(filteredCalibrationRecords);
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const renderSortIcon = (field: typeof sortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 inline-block ml-1" />;
    }
    return sortAsc ? (
      <ArrowUp className="w-3 h-3 text-blue-600 inline-block ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-600 inline-block ml-1" />
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-none overflow-hidden flex flex-col animate-in fade-in duration-200">
      {/* Custody Energy Ledger Toolbar */}
      <div className="p-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by Tank, Serial, Date..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-slate-300 rounded-none text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-700 font-bold">Batch:</span>
                <select
                  value={historyShipmentFilter}
                  onChange={(e) => setHistoryShipmentFilter(e.target.value)}
                  className="win-panel rounded-none px-2 py-0.5 text-xs text-slate-900 focus:outline-none"
                >
                  <option value="ALL">All Shipments</option>
                  {distinctShipments.map((shp) => (
                    <option key={shp} value={shp}>
                      Shipment {shp}
                    </option>
                  ))}
                </select>
              </div>

              {(historySearch || historyShipmentFilter !== 'ALL' || historyDateFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setHistorySearch('');
                    setHistoryShipmentFilter('ALL');
                    setHistoryDateFilter('ALL');
                  }}
                  className="win-btn flex items-center gap-1 text-[11px] px-2 py-0.5 cursor-pointer font-bold"
                >
                  <RefreshCw className="w-3 h-3" /> Reset Filters
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-600 font-bold">
                {filteredHistoryRecords.length} of {certificateRecords.length} Records
              </span>
              <button
                type="button"
                onClick={handleOpenExportPreview}
                className="bg-[#d4d0c8] hover:bg-[#e0dcd4] text-slate-900 border border-t-white border-l-white border-r-[#808080] border-b-[#808080] active:border-slate-800 text-xs font-bold px-3 py-1 rounded-sm shadow-sm transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-slate-800" />
                <span>Export Ledger (.XLSX)</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[calc(100vh-320px)] overflow-y-auto border-t border-slate-300">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead className="sticky top-0 z-10 text-[11px] font-bold uppercase tracking-wider select-none">
                {/* Tier 1: Group Category Headers */}
                <tr className="border-b border-[#a09e90] bg-[#e8e6df] text-[#0a2558] text-[10px] text-center font-bold">
                  <th rowSpan={2} className="w-14 py-1 px-1 border-r border-[#a09e90] text-center font-bold whitespace-nowrap">BATCH</th>
                  <th rowSpan={2} className="w-24 py-1 px-1 border-r border-[#a09e90] text-center font-bold whitespace-nowrap">DATE</th>
                  <th colSpan={2} className="w-52 py-1 px-1 border-r border-[#a09e90] text-center font-bold whitespace-nowrap">TANK NO.</th>
                  <th colSpan={3} className="w-60 py-1 px-1 border-r border-[#a09e90] text-center font-bold whitespace-nowrap">WEIGHT SCALE</th>
                  <th colSpan={3} className="w-48 py-1 px-1 border-r border-[#a09e90] text-center font-bold whitespace-nowrap">PROPERTIES</th>
                  <th colSpan={8} className="w-88 py-1 px-1 border-r border-[#a09e90] text-center font-bold whitespace-nowrap">COMPONENT (MOL %)</th>
                  <th colSpan={2} className="w-40 py-1 px-1 border-r border-[#a09e90] text-center font-bold whitespace-nowrap">DELIVERED</th>
                  <th rowSpan={2} className="w-20 py-1 px-1 text-center font-bold whitespace-nowrap">STATUS</th>
                </tr>
                {/* Tier 2: Individual Column Headers */}
                <tr className="border-b border-[#a09e90] bg-[#e8e6df] text-[#0a2558] text-[10px] text-center font-bold">
                  <th className="w-24 py-1 px-1 border-r border-[#a09e90] text-center cursor-pointer whitespace-nowrap" onClick={() => handleSort('tankNo')}>
                    ISO TANK NO {renderSortIcon('tankNo')}
                  </th>
                  <th className="w-28 py-1 px-1 border-r border-[#a09e90] text-center whitespace-nowrap">SERIAL NO</th>
                  <th className="w-20 py-1 px-1 border-r border-[#a09e90] text-right whitespace-nowrap">
                    TARE<br/><span className="text-[10px] text-slate-500 font-normal">(KG)</span>
                  </th>
                  <th className="w-20 py-1 px-1 border-r border-[#a09e90] text-right whitespace-nowrap">
                    GROSS<br/><span className="text-[10px] text-slate-500 font-normal">(KG)</span>
                  </th>
                  <th className="w-20 py-1 px-1 border-r border-[#a09e90] text-right cursor-pointer whitespace-nowrap" onClick={() => handleSort('deliveredWeightKg')}>
                    NET MASS<br/><span className="text-[10px] text-slate-500 font-normal">(KG)</span> {renderSortIcon('deliveredWeightKg')}
                  </th>
                  <th className="w-16 py-1 px-1 border-r border-[#a09e90] text-right whitespace-nowrap">
                    TEMP<br/><span className="text-[10px] text-slate-500 font-normal">(°C)</span>
                  </th>
                  <th className="w-16 py-1 px-1 border-r border-[#a09e90] text-right whitespace-nowrap">
                    DENSITY<br/><span className="text-[10px] text-slate-500 font-normal">(KG/M³)</span>
                  </th>
                  <th className="w-16 py-1 px-1 border-r border-[#a09e90] text-right whitespace-nowrap">
                    GHV<br/><span className="text-[10px] text-slate-500 font-normal">(BTU/KG)</span>
                  </th>
                  <th className="w-11 py-1 px-0.5 border-r border-[#a09e90] text-center text-[10px]">CH₄</th>
                  <th className="w-11 py-1 px-0.5 border-r border-[#a09e90] text-center text-[10px]">C₂H₆</th>
                  <th className="w-11 py-1 px-0.5 border-r border-[#a09e90] text-center text-[10px]">C₃H₈</th>
                  <th className="w-11 py-1 px-0.5 border-r border-[#a09e90] text-center text-[10px]">i-C₄</th>
                  <th className="w-11 py-1 px-0.5 border-r border-[#a09e90] text-center text-[10px]">n-C₄</th>
                  <th className="w-11 py-1 px-0.5 border-r border-[#a09e90] text-center text-[10px]">i-C₅</th>
                  <th className="w-11 py-1 px-0.5 border-r border-[#a09e90] text-center text-[10px]">n-C₅</th>
                  <th className="w-11 py-1 px-0.5 border-r border-[#a09e90] text-center text-[10px]">N₂</th>
                  <th className="w-20 py-1 px-1 border-r border-[#a09e90] text-right cursor-pointer whitespace-nowrap" onClick={() => handleSort('deliveredVolumeM3')}>
                    NET VOL<br/><span className="text-[10px] text-slate-500 font-normal">(M³)</span> {renderSortIcon('deliveredVolumeM3')}
                  </th>
                  <th className="w-20 py-1 px-1 border-r border-[#a09e90] text-right cursor-pointer whitespace-nowrap" onClick={() => handleSort('deliveredMMBtu')}>
                    ENERGY<br/><span className="text-[10px] text-slate-500 font-normal">(MMBTU)</span> {renderSortIcon('deliveredMMBtu')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {filteredHistoryRecords.map((r, idx) => {
                  const tare = r.tareKg ?? r.preLoadTare ?? r.weightBeforeKg ?? 10850;
                  const gross = r.grossKg ?? r.weightAfterKg ?? (tare + (r.netMassKg ?? r.deliveredWeightKg ?? 0));
                  const netMass = r.netMassKg ?? r.deliveredWeightKg ?? (gross > tare ? gross - tare : 0);
                  const temp = r.deliveredTempC ?? r.tempC ?? -160.0;
                  const density = r.deliveredDensity ?? r.densityKgM3 ?? r.density ?? 442.02;
                  const ghv = r.deliveredGHV ?? r.massGhv ?? r.ghv ?? 52214.94;

                  const ch4 = (r.ch4 ?? r.methane ?? 95.50).toFixed(2);
                  const c2h6 = (r.c2h6 ?? r.ethane ?? 3.39).toFixed(2);
                  const c3h8 = (r.c3h8 ?? r.propane ?? 0.77).toFixed(2);
                  const iC4 = (r.iC4 ?? r.iButane ?? 0.12).toFixed(2);
                  const nC4 = (r.nC4 ?? r.nButane ?? 0.14).toFixed(2);
                  const iC5 = (r.iC5 ?? r.iPentane ?? 0.03).toFixed(2);
                  const nC5 = (r.nC5 ?? r.nPentane ?? 0.01).toFixed(2);
                  const n2 = (r.n2 ?? r.nitrogen ?? 0.04).toFixed(2);

                  const netVol = r.deliveredVolumeM3 ?? r.netVolM3 ?? (density > 0 ? netMass / density : 0);
                  const energy = r.deliveredMmbtu ?? r.deliveredMMBtu ?? r.energyMMBtu ?? 0;

                  return (
                    <tr key={`${r.tankNo}-${idx}`} className="bg-white even:bg-[#f5f7fa] hover:bg-blue-50/70 transition-colors whitespace-nowrap">
                      <td className="w-14 py-1 px-1 text-center font-sans font-bold text-blue-800 whitespace-nowrap">{r.shipment || r.batchId || 'N-1'}</td>
                      <td className="w-24 py-1 px-1 text-center text-slate-700 whitespace-nowrap">{r.date || new Date().toISOString().split('T')[0]}</td>
                      <td className="w-24 py-1 px-1 text-center font-mono font-bold text-[#0a2558] whitespace-nowrap">{r.tankNo}</td>
                      <td className="w-28 py-1 px-1 text-center text-slate-700 whitespace-nowrap">{r.serialNo}</td>
                      <td className="w-20 py-1 px-1 text-right whitespace-nowrap">{tare.toLocaleString()}</td>
                      <td className="w-20 py-1 px-1 text-right whitespace-nowrap">{gross.toLocaleString()}</td>
                      <td className="w-20 py-1 px-1 text-right font-bold text-[#0a2558] bg-blue-50/40 whitespace-nowrap">{netMass.toLocaleString()}</td>
                      <td className="w-16 py-1 px-1 text-right whitespace-nowrap">{typeof temp === 'number' ? temp.toFixed(1) : temp}</td>
                      <td className="w-16 py-1 px-1 text-right whitespace-nowrap">{typeof density === 'number' ? density.toFixed(2) : density}</td>
                      <td className="w-16 py-1 px-1 text-right whitespace-nowrap">{typeof ghv === 'number' ? ghv.toLocaleString() : ghv}</td>
                      <td className="w-11 py-1 px-0.5 text-center text-[10px] text-slate-700 whitespace-nowrap">{ch4}</td>
                      <td className="w-11 py-1 px-0.5 text-center text-[10px] text-slate-700 whitespace-nowrap">{c2h6}</td>
                      <td className="w-11 py-1 px-0.5 text-center text-[10px] text-slate-700 whitespace-nowrap">{c3h8}</td>
                      <td className="w-11 py-1 px-0.5 text-center text-[10px] text-slate-700 whitespace-nowrap">{iC4}</td>
                      <td className="w-11 py-1 px-0.5 text-center text-[10px] text-slate-700 whitespace-nowrap">{nC4}</td>
                      <td className="w-11 py-1 px-0.5 text-center text-[10px] text-slate-700 whitespace-nowrap">{iC5}</td>
                      <td className="w-11 py-1 px-0.5 text-center text-[10px] text-slate-700 whitespace-nowrap">{nC5}</td>
                      <td className="w-11 py-1 px-0.5 text-center text-[10px] text-slate-700 whitespace-nowrap">{n2}</td>
                      <td className="w-20 py-1 px-1 text-right font-bold text-blue-900 bg-blue-50/40 whitespace-nowrap">{netVol.toFixed(2)}</td>
                      <td className="w-20 py-1 px-1 text-right font-bold text-emerald-800 bg-emerald-50/40 whitespace-nowrap">{energy.toFixed(2)}</td>
                      <td className="w-20 py-1 px-1 text-center font-sans whitespace-nowrap">
                        <span className="inline-flex items-center justify-center rounded px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Archived
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#dfe6ee] text-[#0a2558] font-bold uppercase whitespace-nowrap text-center text-xs">
                  <td className="w-38 py-1.5 px-1 text-center font-black whitespace-nowrap" colSpan={2}>
                    SUM
                  </td>
                  <td className="w-52 py-1.5 px-1 text-center whitespace-nowrap" colSpan={2}>
                    Selected Items ({filteredHistoryRecords.length})
                  </td>
                  <td className="w-20 py-1.5 px-1 text-right whitespace-nowrap font-mono">
                    {historySums.tare.toLocaleString()}
                  </td>
                  <td className="w-20 py-1.5 px-1 text-right whitespace-nowrap font-mono">
                    {historySums.gross.toLocaleString()}
                  </td>
                  <td className="w-20 py-1.5 px-1 text-right font-black text-blue-950 bg-blue-100/50 whitespace-nowrap font-mono">
                    {historySums.netMass.toLocaleString()}
                  </td>
                  <td className="w-48 py-1.5 px-1 text-center whitespace-nowrap" colSpan={3}>
                    —
                  </td>
                  <td className="w-88 py-1.5 px-1 text-center text-slate-600 font-normal bg-slate-100/50 whitespace-nowrap" colSpan={8}>
                    Avg Spec Normalized
                  </td>
                  <td className="w-20 py-1.5 px-1 text-right font-black text-blue-950 bg-blue-100/50 whitespace-nowrap font-mono">
                    {historySums.netVol.toFixed(2)}
                  </td>
                  <td className="w-20 py-1.5 px-1 text-right font-black text-emerald-950 bg-emerald-100/50 whitespace-nowrap font-mono">
                    {historySums.energy.toFixed(2)}
                  </td>
                  <td className="w-20 py-1.5 px-1 text-center whitespace-nowrap font-sans">
                    Archived
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

      {/* Excel Export Preview Modal */}
      {isExportPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] shadow-2xl max-w-5xl w-full flex flex-col max-h-[90vh] overflow-hidden select-none font-sans">
            {/* Modal Header */}
            <div className="bg-[#0a2558] text-white px-3 py-1.5 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2 font-bold text-xs md:text-sm tracking-wide uppercase">
                <FileSpreadsheet className="w-4 h-4 text-cyan-300" />
                <span>Ledger Export Preview (.xlsx)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsExportPreviewOpen(false)}
                className="text-slate-300 hover:text-white font-bold p-0.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Toolbar & Sub-Sheet Tabs */}
            <div className="p-2.5 bg-[#e8e6df] border-b border-slate-300 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                <span className="text-xs font-bold text-slate-700 mr-1">Worksheets:</span>
                {sheetNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setPreviewActiveSheet(name)}
                    className={`px-3 py-1 text-xs font-bold transition-all rounded-t cursor-pointer ${
                      previewActiveSheet === name
                        ? 'bg-[#0a2558] text-white shadow-sm'
                        : 'bg-[#d4d0c8] hover:bg-[#e0dcd4] text-slate-900 border border-t-white border-l-white border-r-[#808080] border-b-[#808080]'
                    }`}
                  >
                    {name} ({previewSheets[name]?.length || 0})
                  </button>
                ))}
              </div>

              {/* Sheet KPI Summary */}
              <div className="flex items-center gap-4 text-xs font-mono bg-white px-3 py-1 border border-slate-300 rounded shadow-inner">
                <div>
                  <span className="text-slate-500 font-sans text-[11px] mr-1">Total Tanks:</span>
                  <span className="font-bold text-[#0a2558]">{activeSheetKPIs.count} Units</span>
                </div>
                <div>
                  <span className="text-slate-500 font-sans text-[11px] mr-1">Net Mass:</span>
                  <span className="font-bold text-[#0a2558]">{activeSheetKPIs.netMass.toLocaleString()} kg</span>
                </div>
                <div>
                  <span className="text-slate-500 font-sans text-[11px] mr-1">Energy:</span>
                  <span className="font-bold text-emerald-800">{activeSheetKPIs.energy.toFixed(2)} MMBtu</span>
                </div>
              </div>
            </div>

            {/* Preview Table Body */}
            <div className="p-3 overflow-y-auto max-h-[350px] bg-white">
              <div className="border border-slate-300 overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                  <thead className="sticky top-0 z-10 text-[10px] font-bold uppercase tracking-wider select-none">
                    <tr className="border-b border-[#a09e90] bg-[#0a2558] text-white text-center font-bold">
                      <th rowSpan={2} className="w-14 py-1 px-1 border-r border-[#23457a]">BATCH</th>
                      <th rowSpan={2} className="w-24 py-1 px-1 border-r border-[#23457a]">DATE</th>
                      <th colSpan={2} className="w-52 py-1 px-1 border-r border-[#23457a]">TANK NO.</th>
                      <th colSpan={3} className="w-60 py-1 px-1 border-r border-[#23457a]">WEIGHT SCALE</th>
                      <th colSpan={3} className="w-48 py-1 px-1 border-r border-[#23457a]">PROPERTIES</th>
                      <th colSpan={8} className="w-88 py-1 px-1 border-r border-[#23457a]">COMPONENT (MOL %)</th>
                      <th colSpan={2} className="w-40 py-1 px-1 border-r border-[#23457a]">DELIVERED</th>
                      <th rowSpan={2} className="w-20 py-1 px-1">STATUS</th>
                    </tr>
                    <tr className="border-b border-[#a09e90] bg-[#e8e6df] text-[#0a2558] text-center font-bold">
                      <th className="w-24 py-1 px-1 border-r border-[#a09e90]">ISO TANK NO</th>
                      <th className="w-28 py-1 px-1 border-r border-[#a09e90]">SERIAL NO</th>
                      <th className="w-20 py-1 px-1 border-r border-[#a09e90] text-right">TARE (KG)</th>
                      <th className="w-20 py-1 px-1 border-r border-[#a09e90] text-right">GROSS (KG)</th>
                      <th className="w-20 py-1 px-1 border-r border-[#a09e90] text-right">NET MASS (KG)</th>
                      <th className="w-16 py-1 px-1 border-r border-[#a09e90] text-right">TEMP (°C)</th>
                      <th className="w-16 py-1 px-1 border-r border-[#a09e90] text-right">DENSITY (KG/M³)</th>
                      <th className="w-16 py-1 px-1 border-r border-[#a09e90] text-right">GHV (BTU/KG)</th>
                      <th className="w-11 py-1 px-0.5 border-r border-[#a09e90] text-center text-[10px]">CH₄</th>
                      <th className="w-11 py-1 px-0.5 border-r border-[#a09e90] text-center text-[10px]">C₂H₆</th>
                      <th className="w-11 py-1 px-0.5 border-r border-[#a09e90] text-center text-[10px]">C₃H₈</th>
                      <th className="w-11 py-1 px-0.5 border-r border-[#a09e90] text-center text-[10px]">i-C₄</th>
                      <th className="w-11 py-1 px-0.5 border-r border-[#a09e90] text-center text-[10px]">n-C₄</th>
                      <th className="w-11 py-1 px-0.5 border-r border-[#a09e90] text-center text-[10px]">i-C₅</th>
                      <th className="w-11 py-1 px-0.5 border-r border-[#a09e90] text-center text-[10px]">n-C₅</th>
                      <th className="w-11 py-1 px-0.5 border-r border-[#a09e90] text-center text-[10px]">N₂</th>
                      <th className="w-20 py-1 px-1 border-r border-[#a09e90] text-right">NET VOL (M³)</th>
                      <th className="w-20 py-1 px-1 border-r border-[#a09e90] text-right">ENERGY (MMBTU)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                    {activeSheetRecords.map((r, idx) => {
                      const tare = r.tareKg ?? r.preLoadTare ?? r.weightBeforeKg ?? 10850;
                      const gross = r.grossKg ?? r.weightAfterKg ?? (tare + (r.netMassKg ?? r.deliveredWeightKg ?? 0));
                      const netMass = r.netMassKg ?? r.deliveredWeightKg ?? (gross > tare ? gross - tare : 0);
                      const temp = r.deliveredTempC ?? r.tempC ?? -160.0;
                      const density = r.deliveredDensity ?? r.densityKgM3 ?? r.density ?? 442.02;
                      const ghv = r.deliveredGHV ?? r.massGhv ?? r.ghv ?? 52214.94;

                      const ch4 = (r.ch4 ?? r.methane ?? 95.50).toFixed(2);
                      const c2h6 = (r.c2h6 ?? r.ethane ?? 3.39).toFixed(2);
                      const c3h8 = (r.c3h8 ?? r.propane ?? 0.77).toFixed(2);
                      const iC4 = (r.iC4 ?? r.iButane ?? 0.12).toFixed(2);
                      const nC4 = (r.nC4 ?? r.nButane ?? 0.14).toFixed(2);
                      const iC5 = (r.iC5 ?? r.iPentane ?? 0.03).toFixed(2);
                      const nC5 = (r.nC5 ?? r.nPentane ?? 0.01).toFixed(2);
                      const n2 = (r.n2 ?? r.nitrogen ?? 0.04).toFixed(2);

                      const netVol = r.deliveredVolumeM3 ?? r.netVolM3 ?? (density > 0 ? netMass / density : 0);
                      const energy = r.deliveredMmbtu ?? r.deliveredMMBtu ?? r.energyMMBtu ?? 0;

                      return (
                        <tr key={`prev-${r.tankNo}-${idx}`} className="bg-white even:bg-[#f5f7fa]">
                          <td className="w-14 py-1 px-1 text-center font-sans font-bold text-blue-800">{r.shipment || r.batchId || 'N-1'}</td>
                          <td className="w-24 py-1 px-1 text-center text-slate-700">{r.date || new Date().toISOString().split('T')[0]}</td>
                          <td className="w-24 py-1 px-1 text-center font-mono font-bold text-[#0a2558]">{r.tankNo}</td>
                          <td className="w-28 py-1 px-1 text-center text-slate-700">{r.serialNo}</td>
                          <td className="w-20 py-1 px-1 text-right">{tare.toLocaleString()}</td>
                          <td className="w-20 py-1 px-1 text-right">{gross.toLocaleString()}</td>
                          <td className="w-20 py-1 px-1 text-right font-bold text-[#0a2558] bg-blue-50/40">{netMass.toLocaleString()}</td>
                          <td className="w-16 py-1 px-1 text-right">{typeof temp === 'number' ? temp.toFixed(1) : temp}</td>
                          <td className="w-16 py-1 px-1 text-right">{typeof density === 'number' ? density.toFixed(2) : density}</td>
                          <td className="w-16 py-1 px-1 text-right">{typeof ghv === 'number' ? ghv.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ghv}</td>
                          <td className="w-11 py-1 px-0.5 text-center text-[10px] text-slate-700">{ch4}</td>
                          <td className="w-11 py-1 px-0.5 text-center text-[10px] text-slate-700">{c2h6}</td>
                          <td className="w-11 py-1 px-0.5 text-center text-[10px] text-slate-700">{c3h8}</td>
                          <td className="w-11 py-1 px-0.5 text-center text-[10px] text-slate-700">{iC4}</td>
                          <td className="w-11 py-1 px-0.5 text-center text-[10px] text-slate-700">{nC4}</td>
                          <td className="w-11 py-1 px-0.5 text-center text-[10px] text-slate-700">{iC5}</td>
                          <td className="w-11 py-1 px-0.5 text-center text-[10px] text-slate-700">{nC5}</td>
                          <td className="w-11 py-1 px-0.5 text-center text-[10px] text-slate-700">{n2}</td>
                          <td className="w-20 py-1 px-1 text-right font-bold text-blue-900 bg-blue-50/40">{netVol.toFixed(2)}</td>
                          <td className="w-20 py-1 px-1 text-right font-bold text-emerald-800 bg-emerald-50/40">{energy.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="w-20 py-1 px-1 text-center font-sans text-[10px] text-emerald-700 font-bold">Archived</td>
                        </tr>
                      );
                    })}
                    {activeSheetRecords.length === 0 && (
                      <tr>
                        <td colSpan={21} className="py-6 text-center text-slate-500 font-sans text-xs">
                          No records in this worksheet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-2.5 bg-[#e8e6df] border-t border-slate-300 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsExportPreviewOpen(false)}
                className="bg-[#d4d0c8] hover:bg-[#e0dcd4] text-slate-900 border border-t-white border-l-white border-r-[#808080] border-b-[#808080] active:border-slate-800 text-xs font-bold px-4 py-1.5 rounded-sm shadow-sm transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleConfirmDownload}
                className="bg-[#0a2558] hover:bg-[#16325c] text-white border border-t-blue-400 border-l-blue-400 border-r-[#051636] border-b-[#051636] active:border-slate-900 text-xs font-bold px-4 py-1.5 rounded-sm shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-cyan-300" />
                <span>Confirm &amp; Download (.xlsx)</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Loss Audit & Breakdown Modal */}
      {activeLossAuditModal && (() => {
        const rec = activeLossAuditModal.record;
        const initialPressure = rec.niasInitPress ?? 8.0;
        const targetPressure = rec.niasTargetPress ?? 3.0;
        const deltaP = initialPressure - targetPressure;
        const temp = rec.tempC ?? rec.temp ?? -126.5;
        const density = rec.densityKgM3 ?? rec.density ?? 442.02;

        const depressurizationLossNm3 = 45.5 * deltaP * 1.0;
        const tempCorrFactor = 288 / (273.15 + temp);
        const lossOfLiquidM3 = (depressurizationLossNm3 * tempCorrFactor) / 600;

        const baselineDryTare = 10850;
        const niasHeelVol = rec.niasHeelM3 ?? Number(((rec.niasEstGrossKg - baselineDryTare) / density).toFixed(2));
        const niasEstGrossKg = baselineDryTare + (niasHeelVol * density);
        const arunWeighbridgeKg = rec.arunWeighbridgeKg;
        const transitLossKg = Math.max(0, niasEstGrossKg - arunWeighbridgeKg);
        const actualLossPct = Number(((transitLossKg / 18100) * 100).toFixed(2));
        const isPass = actualLossPct <= 1.78;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] shadow-2xl w-[92vw] max-w-5xl flex flex-col max-h-[90vh] overflow-hidden select-none font-sans">
              {/* Modal Header */}
              <div className="bg-[#0a2558] text-white px-5 py-3 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3 font-bold text-base md:text-lg tracking-wide uppercase">
                  <FileCheck className="w-5 h-5 text-cyan-300" />
                  <span>
                    {activeLossAuditModal.mode === 'NIAS_GROSS'
                      ? `NIAS Est Gross Calculation Model - [${rec.tankNo}] (Serial: ${rec.serialNo})`
                      : `BOG LOSS ESTIMATION & AUDIT - [${rec.tankNo}] (Serial: ${rec.serialNo})`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveLossAuditModal(null)}
                  className="text-slate-300 hover:text-white font-bold p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 md:p-6 overflow-y-auto bg-white space-y-6 text-sm md:text-base text-slate-800 max-h-[calc(90vh-100px)]">
                {activeLossAuditModal.mode === 'NIAS_GROSS' ? (
                  <div className="space-y-5">
                    <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-md">
                      <h4 className="font-extrabold text-[#0a2558] text-base md:text-lg mb-1">
                        NIAS Est Gross Weight Breakdown - {rec.tankNo}
                      </h4>
                      <p className="text-slate-600 text-xs md:text-sm">
                        Calculated from Dry Tare baseline ({baselineDryTare.toLocaleString()} kg) plus real-time residual Heel volume ({niasHeelVol.toFixed(2)} m³ @ {density.toFixed(2)} kg/m³).
                      </p>
                    </div>

                    <div className="border border-slate-300 rounded-md overflow-hidden shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-[#e8e6df] text-[#0a2558] font-bold text-sm md:text-base">
                          <tr>
                            <th className="py-3 px-4 border-b border-slate-300">Parameter / Component</th>
                            <th className="py-3 px-4 border-b border-slate-300 text-right">Value</th>
                            <th className="py-3 px-4 border-b border-slate-300">Unit / Reference</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-mono text-sm md:text-base">
                          <tr>
                            <td className="py-3 px-4 font-sans font-bold text-slate-800">Baseline Dry Tare Weight</td>
                            <td className="py-3 px-4 text-right font-extrabold text-[#0a2558]">{baselineDryTare.toLocaleString()}</td>
                            <td className="py-3 px-4 font-sans text-slate-600 text-xs md:text-sm">kg (Standard ISO Tank Spec)</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-sans font-bold text-slate-800">Heel Volume (Nias DP)</td>
                            <td className="py-3 px-4 text-right font-extrabold text-[#0a2558]">
                              {niasHeelVol.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 font-sans text-slate-600 text-xs md:text-sm">m³ (@ {targetPressure.toFixed(1)} barg)</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-sans font-bold text-slate-800">Liquid LNG Density</td>
                            <td className="py-3 px-4 text-right font-extrabold text-[#0a2558]">{density.toFixed(2)}</td>
                            <td className="py-3 px-4 font-sans text-slate-600 text-xs md:text-sm">kg/m³ (Standard Molecular Density)</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-sans font-bold text-slate-800">Residual Heel Fuel Mass</td>
                            <td className="py-3 px-4 text-right font-extrabold text-blue-900">
                              {Math.round(niasHeelVol * density).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 font-sans text-slate-600 text-xs md:text-sm">kg ({niasHeelVol.toFixed(2)} m³ × {density.toFixed(2)} kg/m³)</td>
                          </tr>
                          <tr className="bg-blue-50/70 font-bold">
                            <td className="py-3.5 px-4 font-sans text-[#0a2558] text-base md:text-lg">TOTAL NIAS EST GROSS</td>
                            <td className="py-3.5 px-4 text-right text-[#0a2558] font-black text-lg md:text-xl">
                              {Math.round(niasEstGrossKg).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 font-sans text-blue-900 font-bold text-xs md:text-sm">kg (Dry Tare + Heel Fuel)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-md text-amber-950 font-mono text-sm md:text-base font-bold shadow-sm">
                      <span className="font-extrabold font-sans text-[#0a2558] block mb-1">Calculation Formula:</span>
                      {baselineDryTare.toLocaleString()} kg (Dry Tare) + {Math.round(niasHeelVol * density).toLocaleString()} kg (Heel Fuel) = {Math.round(niasEstGrossKg).toLocaleString()} kg (Total Nias Est Gross)
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-md flex flex-wrap items-center justify-between gap-3 shadow-sm">
                      <div>
                        <h4 className="font-extrabold text-emerald-950 text-base md:text-lg">
                          BOG LOSS ESTIMATION &amp; AUDIT - [{rec.tankNo}]
                        </h4>
                        <p className="text-emerald-800 text-xs md:text-sm mt-0.5">
                          Serial: {rec.serialNo} | Nias Departure Pressure: {initialPressure.toFixed(1)} barg &rarr; Target: {targetPressure.toFixed(1)} barg
                        </p>
                      </div>
                      <span
                        className={`px-4 py-1.5 text-xs md:text-sm font-extrabold rounded-md shadow-sm ${
                          isPass
                            ? 'bg-emerald-600 text-white'
                            : 'bg-red-600 text-white'
                        }`}
                      >
                        {isPass
                          ? 'PASS (Integrity Verified)'
                          : 'HIGH_LOSS / INSPECT REQUIRED'}
                      </span>
                    </div>

                    <div className="border border-slate-300 rounded-md overflow-hidden shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-[#0a2558] text-white font-bold text-sm md:text-base">
                          <tr>
                            <th className="py-3 px-4 border-b border-[#23457a]">Category / Audit Step</th>
                            <th className="py-3 px-4 border-b border-[#23457a] text-right">Metric Value</th>
                            <th className="py-3 px-4 border-b border-[#23457a]">Reference / Basis</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-mono text-sm md:text-base">
                          {/* 1. Loaded LNG */}
                          <tr className="bg-slate-200/80 font-extrabold">
                            <td colSpan={3} className="py-2.5 px-4 text-[#0a2558] font-sans text-sm md:text-base">1. LOADED SPECIFICATION</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 pl-6 font-sans text-slate-800 font-medium">Gross Container Volume</td>
                            <td className="py-2.5 px-4 text-right font-extrabold text-[#0a2558]">45.50</td>
                            <td className="py-2.5 px-4 font-sans text-slate-600 text-xs md:text-sm">m³</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 pl-6 font-sans text-slate-800 font-medium">Filling Ratio Limit</td>
                            <td className="py-2.5 px-4 text-right font-extrabold text-[#0a2558]">90.00</td>
                            <td className="py-2.5 px-4 font-sans text-slate-600 text-xs md:text-sm">% (IMO Safety Fill Limit)</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 pl-6 font-sans text-slate-800 font-medium">Loaded LNG Volume</td>
                            <td className="py-2.5 px-4 text-right font-extrabold text-blue-900">40.95</td>
                            <td className="py-2.5 px-4 font-sans text-slate-600 text-xs md:text-sm">m³ (45.5 × 90%)</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 pl-6 font-sans text-slate-800 font-medium">Base Cargo Liquid Mass</td>
                            <td className="py-2.5 px-4 text-right font-extrabold text-blue-900">18,100</td>
                            <td className="py-2.5 px-4 font-sans text-slate-600 text-xs md:text-sm">kg (@ 442.02 kg/m³)</td>
                          </tr>

                          {/* 2. Potential Leaked Loss */}
                          <tr className="bg-slate-200/80 font-extrabold">
                            <td colSpan={3} className="py-2.5 px-4 text-[#0a2558] font-sans text-sm md:text-base">2. POTENTIAL LEAKED LOSS</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 pl-6 font-sans text-slate-800 font-medium">Valves &amp; Gasket Leakage Rate</td>
                            <td className="py-2.5 px-4 text-right font-extrabold text-[#0a2558]">0.20</td>
                            <td className="py-2.5 px-4 font-sans text-slate-600 text-xs md:text-sm">% (approx. 0.082 m³ / 36.25 kg)</td>
                          </tr>

                          {/* 3. Depressurization Loss */}
                          <tr className="bg-slate-200/80 font-extrabold">
                            <td colSpan={3} className="py-2.5 px-4 text-[#0a2558] font-sans text-sm md:text-base">3. DEPRESSURIZATION LOSS ({initialPressure.toFixed(1)} &rarr; {targetPressure.toFixed(1)} barg)</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 pl-6 font-sans text-slate-800 font-medium">Loss of Natural Gas (Vapor)</td>
                            <td className="py-2.5 px-4 text-right font-extrabold text-[#0a2558]">{depressurizationLossNm3.toFixed(2)}</td>
                            <td className="py-2.5 px-4 font-sans text-slate-600 text-xs md:text-sm">Nm³ (45.5 × {deltaP.toFixed(1)} barg)</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 pl-6 font-sans text-slate-800 font-medium">Temp &amp; Density Correction Factor</td>
                            <td className="py-2.5 px-4 text-right font-extrabold text-[#0a2558]">{tempCorrFactor.toFixed(2)}</td>
                            <td className="py-2.5 px-4 font-sans text-slate-600 text-xs md:text-sm">Ratio (288 K / (273.15 + {temp.toFixed(1)} °C))</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 pl-6 font-sans text-slate-800 font-medium">Loss of Liquid LNG Equivalent</td>
                            <td className="py-2.5 px-4 text-right font-extrabold text-amber-800">{lossOfLiquidM3.toFixed(3)}</td>
                            <td className="py-2.5 px-4 font-sans text-slate-600 text-xs md:text-sm">m³ (~{Math.round(lossOfLiquidM3 * density)} kg LNG)</td>
                          </tr>

                          {/* 4. Design Loss Benchmark */}
                          <tr className="bg-slate-200/80 font-extrabold">
                            <td colSpan={3} className="py-2.5 px-4 text-[#0a2558] font-sans text-sm md:text-base">4. DESIGN LOSS BENCHMARK</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 pl-6 font-sans text-slate-800 font-medium">Nominal Total Design Loss</td>
                            <td className="py-2.5 px-4 text-right font-extrabold text-slate-900">1.62</td>
                            <td className="py-2.5 px-4 font-sans text-slate-600 text-xs md:text-sm">% of Loaded Cargo</td>
                          </tr>
                          <tr className="bg-amber-100/60 font-bold">
                            <td className="py-2.5 px-4 pl-6 font-sans text-amber-950 font-extrabold">Max Design Limit (10% Margin)</td>
                            <td className="py-2.5 px-4 text-right font-black text-amber-950 text-base">1.78</td>
                            <td className="py-2.5 px-4 font-sans text-amber-950 font-extrabold text-xs md:text-sm">% (Allowable Threshold)</td>
                          </tr>

                          {/* 5. Actual Verified Loss */}
                          <tr className="bg-blue-100/80 font-bold">
                            <td colSpan={3} className="py-2.5 px-4 text-[#0a2558] font-sans text-sm md:text-base">5. ACTUAL VERIFIED FIELD LOSS (RECONCILIATION)</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 pl-6 font-sans text-slate-800 font-medium">Nias Est Gross Weight</td>
                            <td className="py-2.5 px-4 text-right font-extrabold text-[#0a2558]">{Math.round(niasEstGrossKg).toLocaleString()}</td>
                            <td className="py-2.5 px-4 font-sans text-slate-600 text-xs md:text-sm">kg</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 pl-6 font-sans text-slate-800 font-medium">Arun Weighbridge Gross Weight</td>
                            <td className="py-2.5 px-4 text-right font-extrabold text-[#0a2558]">{arunWeighbridgeKg.toLocaleString()}</td>
                            <td className="py-2.5 px-4 font-sans text-slate-600 text-xs md:text-sm">kg</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 pl-6 font-sans text-slate-800 font-medium">Measured Transit Loss</td>
                            <td className="py-2.5 px-4 text-right font-extrabold text-amber-900">{transitLossKg.toLocaleString()}</td>
                            <td className="py-2.5 px-4 font-sans text-slate-600 text-xs md:text-sm">kg (Nias Gross - Arun Weighbridge)</td>
                          </tr>
                          <tr className="bg-emerald-100/80 font-black">
                            <td className="py-3 px-4 pl-6 font-sans text-emerald-950 text-base md:text-lg">ACTUAL VERIFIED LOSS RATE</td>
                            <td className="py-3 px-4 text-right text-emerald-950 font-black text-lg md:text-xl">{actualLossPct.toFixed(2)}</td>
                            <td className="py-3 px-4 font-sans text-emerald-900 font-extrabold text-xs md:text-sm">% (Loss / 18,100 kg × 100)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="p-3.5 bg-[#e8e6df] border-t border-slate-300 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveLossAuditModal(null)}
                  className="bg-[#0a2558] hover:bg-[#16325c] text-white border border-t-blue-400 border-l-blue-400 border-r-[#051636] border-b-[#051636] text-sm font-bold px-6 py-2.5 rounded-sm shadow-md transition-all cursor-pointer"
                >
                  Close Audit Window
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
