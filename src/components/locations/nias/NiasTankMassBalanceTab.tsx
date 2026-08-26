'use client';

import React, { useState, useMemo } from 'react';
import {
  Scale,
  Search,
  Download,
  AlertTriangle,
  CheckCircle2,
  Box,
  Wind,
  Flame,
  RotateCcw,
} from 'lucide-react';
import { usePortalData } from '@/context/PortalDataContext';

export interface TankMassBalanceRow {
  tankNo: string;
  serialNo: string;
  shipment: string;
  reportDate: string;
  initialWeightArunKg: number;
  arrivalStockM3: number;
  arrivalStockKg: number;
  postDepressStockM3: number;
  postDepressStockKg: number;
  bogLossKg: number;
  bogLossPercent: number;
  liquidDensity: number;
  availableBayStockKg: number;
  remarks: string;
  operationalStatus: 'DEPRESSURIZED' | 'OVERPRESSURE_VENT_REQUIRED' | 'OPTIMAL';
}

// Master Static Reference Data from NIAS - ISO Tank Consumption & Master DB
const DEFAULT_MASS_BALANCE_DATA: TankMassBalanceRow[] = [
  {
    tankNo: 'ISOT-009',
    serialNo: 'SIMU-8101426',
    shipment: 'N1',
    reportDate: '2026-07-26',
    initialWeightArunKg: 15092,
    arrivalStockM3: 24.0,
    arrivalStockKg: 10224.0,
    postDepressStockM3: 23.0,
    postDepressStockKg: 9798.0,
    bogLossKg: 426.0,
    bogLossPercent: 4.17,
    liquidDensity: 428.0,
    availableBayStockKg: 9798.0,
    remarks: 'Depressurized (Used for Gas Trial / Bay 01)',
    operationalStatus: 'DEPRESSURIZED',
  },
  {
    tankNo: 'ISOT-014',
    serialNo: 'SIMU-8101513',
    shipment: 'N1',
    reportDate: '2026-07-26',
    initialWeightArunKg: 17337,
    arrivalStockM3: 28.4,
    arrivalStockKg: 12098.4,
    postDepressStockM3: 26.1,
    postDepressStockKg: 11118.6,
    bogLossKg: 979.8,
    bogLossPercent: 8.1,
    liquidDensity: 428.0,
    availableBayStockKg: 11118.6,
    remarks: 'Overpressured - Vent Required (High Boil-Off)',
    operationalStatus: 'OVERPRESSURE_VENT_REQUIRED',
  },
  {
    tankNo: 'ISOT-017',
    serialNo: 'SIMU-8101581',
    shipment: 'N1',
    reportDate: '2026-07-26',
    initialWeightArunKg: 17896,
    arrivalStockM3: 31.0,
    arrivalStockKg: 13206.0,
    postDepressStockM3: 30.0,
    postDepressStockKg: 12780.0,
    bogLossKg: 426.0,
    bogLossPercent: 3.23,
    liquidDensity: 428.0,
    availableBayStockKg: 12780.0,
    remarks: 'Depressurized',
    operationalStatus: 'DEPRESSURIZED',
  },
  {
    tankNo: 'ISOT-026',
    serialNo: 'SIMU-8101750',
    shipment: 'N1',
    reportDate: '2026-07-26',
    initialWeightArunKg: 17942,
    arrivalStockM3: 31.7,
    arrivalStockKg: 13504.2,
    postDepressStockM3: 30.1,
    postDepressStockKg: 12822.6,
    bogLossKg: 681.6,
    bogLossPercent: 5.05,
    liquidDensity: 428.0,
    availableBayStockKg: 12822.6,
    remarks: 'Overpressured - Vent Required',
    operationalStatus: 'OVERPRESSURE_VENT_REQUIRED',
  },
  {
    tankNo: 'ISOT-031',
    serialNo: 'SIMU-8101848',
    shipment: 'N1',
    reportDate: '2026-07-26',
    initialWeightArunKg: 17790,
    arrivalStockM3: 28.6,
    arrivalStockKg: 12183.6,
    postDepressStockM3: 26.6,
    postDepressStockKg: 11331.6,
    bogLossKg: 852.0,
    bogLossPercent: 6.99,
    liquidDensity: 428.0,
    availableBayStockKg: 11331.6,
    remarks: 'Overpressured - Vent Required',
    operationalStatus: 'OVERPRESSURE_VENT_REQUIRED',
  },
  {
    tankNo: 'ISOT-036',
    serialNo: 'SIMU-8101909',
    shipment: 'N1',
    reportDate: '2026-07-26',
    initialWeightArunKg: 17363,
    arrivalStockM3: 29.9,
    arrivalStockKg: 12737.4,
    postDepressStockM3: 27.3,
    postDepressStockKg: 11629.8,
    bogLossKg: 1107.6,
    bogLossPercent: 8.7,
    liquidDensity: 428.0,
    availableBayStockKg: 11629.8,
    remarks: 'Overpressured - Vent Required (Elevated BOG)',
    operationalStatus: 'OVERPRESSURE_VENT_REQUIRED',
  },
  {
    tankNo: 'ISOT-120',
    serialNo: 'SIMU-8113176',
    shipment: 'N1',
    reportDate: '2026-07-26',
    initialWeightArunKg: 17465,
    arrivalStockM3: 35.0,
    arrivalStockKg: 14910.0,
    postDepressStockM3: 34.0,
    postDepressStockKg: 14484.0,
    bogLossKg: 426.0,
    bogLossPercent: 2.86,
    liquidDensity: 428.0,
    availableBayStockKg: 14484.0,
    remarks: 'Depressurized',
    operationalStatus: 'DEPRESSURIZED',
  },
  {
    tankNo: 'ISOT-086',
    serialNo: 'SIMU-8103711',
    shipment: 'N1',
    reportDate: '2026-07-26',
    initialWeightArunKg: 17342,
    arrivalStockM3: 30.0,
    arrivalStockKg: 12780.0,
    postDepressStockM3: 29.0,
    postDepressStockKg: 12354.0,
    bogLossKg: 426.0,
    bogLossPercent: 3.33,
    liquidDensity: 428.0,
    availableBayStockKg: 12354.0,
    remarks: 'Depressurized',
    operationalStatus: 'DEPRESSURIZED',
  },
  {
    tankNo: 'ISOT-088',
    serialNo: 'SIMU-8103732',
    shipment: 'N1',
    reportDate: '2026-07-26',
    initialWeightArunKg: 17447,
    arrivalStockM3: 29.0,
    arrivalStockKg: 12354.0,
    postDepressStockM3: 28.0,
    postDepressStockKg: 11928.0,
    bogLossKg: 426.0,
    bogLossPercent: 3.45,
    liquidDensity: 428.0,
    availableBayStockKg: 11928.0,
    remarks: 'Depressurized',
    operationalStatus: 'DEPRESSURIZED',
  },
  {
    tankNo: 'ISOT-103',
    serialNo: 'SIMU-8111297',
    shipment: 'N1',
    reportDate: '2026-07-26',
    initialWeightArunKg: 17167,
    arrivalStockM3: 32.0,
    arrivalStockKg: 13632.0,
    postDepressStockM3: 31.0,
    postDepressStockKg: 13206.0,
    bogLossKg: 426.0,
    bogLossPercent: 3.12,
    liquidDensity: 428.0,
    availableBayStockKg: 13206.0,
    remarks: 'Depressurized',
    operationalStatus: 'DEPRESSURIZED',
  },
];

export default function NiasTankMassBalanceTab() {
  const { settlementRecords } = usePortalData();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DEPRESSURIZED' | 'OVERPRESSURE_VENT_REQUIRED'>('ALL');
  const [shipmentFilter, setShipmentFilter] = useState<string>('ALL');

  // Selected Tank IDs state for dynamic KPI calculation (defaults to all selected)
  const [selectedTankNos, setSelectedTankNos] = useState<Set<string>>(() => {
    return new Set(DEFAULT_MASS_BALANCE_DATA.map((d) => d.tankNo));
  });

  // Derive rows combining dynamic settlement data with default dataset
  const rows: TankMassBalanceRow[] = useMemo(() => {
    if (settlementRecords && settlementRecords.length > 0) {
      return DEFAULT_MASS_BALANCE_DATA.map((d) => {
        const s = settlementRecords.find((r) => r.tankNo === d.tankNo);
        if (!s) return d;

        const initialWeight = s.deliveredWeightKg || d.initialWeightArunKg;
        const lossKg = s.lossesKg > 0 ? s.lossesKg : d.bogLossKg;
        const lossPct = s.lossesPercent > 0 ? s.lossesPercent : d.bogLossPercent;
        const density = d.liquidDensity || 428.0;
        const arrivalKg = d.arrivalStockKg;
        const postDepressKg = arrivalKg - lossKg;
        const postDepressM3 = parseFloat((postDepressKg / density).toFixed(1));
        const isOverpressured = lossPct > 5.0 || s.disputeStatus === 'DISPUTE_ALERT';

        return {
          ...d,
          shipment: s.shipment || d.shipment,
          initialWeightArunKg: initialWeight,
          postDepressStockKg: postDepressKg,
          postDepressStockM3: postDepressM3,
          bogLossKg: lossKg,
          bogLossPercent: lossPct,
          availableBayStockKg: postDepressKg,
          operationalStatus: isOverpressured ? 'OVERPRESSURE_VENT_REQUIRED' : 'DEPRESSURIZED',
          remarks: isOverpressured
            ? 'Overpressured - Vent Required'
            : (s.remarks || d.remarks),
        };
      });
    }
    return DEFAULT_MASS_BALANCE_DATA;
  }, [settlementRecords]);

  // Filtered rows for table display
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.tankNo.toLowerCase().includes(q) ||
        r.serialNo.toLowerCase().includes(q) ||
        r.remarks.toLowerCase().includes(q) ||
        r.shipment.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'ALL' || r.operationalStatus === statusFilter;

      const matchesShipment =
        shipmentFilter === 'ALL' || r.shipment === shipmentFilter;

      return matchesSearch && matchesStatus && matchesShipment;
    });
  }, [rows, searchQuery, statusFilter, shipmentFilter]);

  // Selected rows (used for dynamic KPI metrics & summary calculation)
  const selectedRows = useMemo(() => {
    return rows.filter((r) => selectedTankNos.has(r.tankNo));
  }, [rows, selectedTankNos]);

  // Aggregate KPI Metrics dynamically based on checked tanks
  const metrics = useMemo(() => {
    const selectedCount = selectedRows.length;
    const totalInitialWeightArunKg = selectedRows.reduce((acc, r) => acc + r.initialWeightArunKg, 0);
    const totalArrivalStockKg = selectedRows.reduce((acc, r) => acc + r.arrivalStockKg, 0);
    const totalArrivalStockM3 = selectedRows.reduce((acc, r) => acc + r.arrivalStockM3, 0);
    const totalBogLossKg = selectedRows.reduce((acc, r) => acc + r.bogLossKg, 0);
    const netUsableStockKg = selectedRows.reduce((acc, r) => acc + r.availableBayStockKg, 0);
    const netUsableStockM3 = selectedRows.reduce((acc, r) => acc + r.postDepressStockM3, 0);
    const avgLossPct = totalArrivalStockKg > 0 ? (totalBogLossKg / totalArrivalStockKg) * 100 : 0;
    const usablePct = totalArrivalStockKg > 0 ? (netUsableStockKg / totalArrivalStockKg) * 100 : 0;
    const overpressureCount = selectedRows.filter((r) => r.operationalStatus === 'OVERPRESSURE_VENT_REQUIRED').length;

    return {
      selectedCount,
      totalTanks: rows.length,
      totalInitialWeightArunKg,
      totalArrivalStockKg,
      totalArrivalStockM3,
      totalBogLossKg,
      netUsableStockKg,
      netUsableStockM3,
      avgLossPct,
      usablePct,
      overpressureCount,
    };
  }, [selectedRows, rows.length]);

  // Checkbox handlers
  const toggleSelectTank = (tankNo: string) => {
    setSelectedTankNos((prev) => {
      const next = new Set(prev);
      if (next.has(tankNo)) next.delete(tankNo);
      else next.add(tankNo);
      return next;
    });
  };

  const isAllFilteredSelected =
    filteredRows.length > 0 &&
    filteredRows.every((r) => selectedTankNos.has(r.tankNo));

  const isIndeterminate =
    filteredRows.some((r) => selectedTankNos.has(r.tankNo)) &&
    !isAllFilteredSelected;

  const toggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      setSelectedTankNos((prev) => {
        const next = new Set(prev);
        filteredRows.forEach((r) => next.delete(r.tankNo));
        return next;
      });
    } else {
      setSelectedTankNos((prev) => {
        const next = new Set(prev);
        filteredRows.forEach((r) => next.add(r.tankNo));
        return next;
      });
    }
  };

  const handleResetToAll = () => {
    setSelectedTankNos(new Set(rows.map((r) => r.tankNo)));
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    const exportData = selectedRows.length > 0 ? selectedRows : filteredRows;
    const headers = [
      'No',
      'Tank No',
      'Serial No',
      'Shipment',
      'Initial Weight Arun [kg]',
      'Arrival Stock [m3]',
      'Arrival Stock [kg]',
      'Post-Depress Stock [m3]',
      'Post-Depress Stock [kg]',
      'BOG Venting Loss [kg]',
      'BOG Venting Loss [%]',
      'Density [kg/m3]',
      'Available Bay Stock [kg]',
      'Status',
      'Remarks',
    ];

    const csvRows = exportData.map((r, idx) => [
      idx + 1,
      r.tankNo,
      r.serialNo,
      r.shipment,
      r.initialWeightArunKg,
      r.arrivalStockM3,
      r.arrivalStockKg,
      r.postDepressStockM3,
      r.postDepressStockKg,
      r.bogLossKg,
      r.bogLossPercent,
      r.liquidDensity,
      r.availableBayStockKg,
      r.operationalStatus,
      `"${r.remarks.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `NIAS_ISO_Tank_Mass_Balance_Depress_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Header Information Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Domain 1: Physical Asset Accounting
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Density: 428.0 kg/m³
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2 mt-1">
            <Scale className="w-4 h-4 text-cyan-400" />
            ISO Tank Mass Balance & Yard Depressurization Log
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Physical tracking of arrival stock, depressurization venting losses, and available bay vaporizer inventory across Nias terminal vessels.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Selected (CSV)</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary Controls & Dynamic 3 KPI Cards */}
      <div className="space-y-3">
        {/* Dynamic Selection Indicator Strip */}
        <div className="flex flex-wrap justify-between items-center gap-2 px-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Active Calculation Scope:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-bold border transition-colors ${
                metrics.selectedCount === metrics.totalTanks
                  ? 'bg-slate-800 text-slate-300 border-slate-700'
                  : 'bg-cyan-950/60 text-cyan-300 border-cyan-700/60 ring-1 ring-cyan-500/30'
              }`}
            >
              Showing {metrics.selectedCount} of {metrics.totalTanks} Selected Tanks
            </span>
          </div>

          {metrics.selectedCount !== metrics.totalTanks && (
            <button
              type="button"
              onClick={handleResetToAll}
              className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 bg-slate-900 hover:bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 shadow-sm transition-all cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to All Tanks</span>
            </button>
          )}
        </div>

        {/* 3 Clean & De-cluttered KPI Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Initial Terminal Inventory */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4.5 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Box className="w-4 h-4 text-blue-400" />
                Initial Terminal Inventory
              </span>
              <span className="text-xs font-mono text-slate-400">
                {metrics.selectedCount} Tanks
              </span>
            </div>

            <div className="my-2 space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-100">
                  {metrics.totalInitialWeightArunKg.toLocaleString()}
                </span>
                <span className="text-xs font-mono text-slate-400 font-medium">kg</span>
              </div>
              <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <span>Arrival:</span>
                <span className="text-slate-200 font-semibold">{metrics.totalArrivalStockKg.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg</span>
                <span className="text-slate-500">({metrics.totalArrivalStockM3.toFixed(1)} m³)</span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-800/80 flex justify-between">
              <span>Arun Net Certified</span>
              <span className="text-slate-400">Tare & Net Baseline</span>
            </div>
          </div>

          {/* Card 2: Total Yard BOG Venting Losses */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4.5 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-amber-400" />
                Total Yard BOG Venting Losses
              </span>
              <span className="text-xs font-mono font-semibold text-amber-400">
                ~{metrics.avgLossPct.toFixed(1)}%
              </span>
            </div>

            <div className="my-2 space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-rose-400">
                  -{metrics.totalBogLossKg.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </span>
                <span className="text-xs font-mono text-slate-400 font-medium">kg</span>
              </div>
              <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <span>Overpressure:</span>
                <span className={metrics.overpressureCount > 0 ? 'text-amber-400 font-semibold' : 'text-slate-300'}>
                  {metrics.overpressureCount} Tanks (&gt; 5.0%)
                </span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-800/80 flex justify-between">
              <span>Depress: 0.81 ➔ 0.73 MPa</span>
              <span className="text-slate-400">Vented Margin</span>
            </div>
          </div>

          {/* Card 3: Net Usable Stock for Bay Vaporizers */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4.5 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-emerald-400" />
                Net Usable Stock for Bay Vaporizers
              </span>
              <span className="text-xs font-mono font-semibold text-emerald-400">
                {metrics.usablePct.toFixed(1)}% Usable
              </span>
            </div>

            <div className="my-2 space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
                  {metrics.netUsableStockKg.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </span>
                <span className="text-xs font-mono text-slate-400 font-medium">kg</span>
              </div>
              <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <span>Liquid Volume:</span>
                <span className="text-slate-200 font-semibold">{metrics.netUsableStockM3.toFixed(1)} m³</span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-800/80 flex justify-between">
              <span>Bay Sendout Ready</span>
              <span className="text-emerald-400/90 font-medium">4-Bay Active Feed</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter and Search Controls */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
        <div className="flex flex-1 items-center gap-2 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ISO Tank No (e.g. ISOT-009), Serial No, Shipment, or Action..."
            className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-slate-500 hover:text-slate-300 text-xs px-1"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded font-semibold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({rows.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('DEPRESSURIZED')}
              className={`px-2.5 py-1 rounded font-semibold transition-all cursor-pointer ${
                statusFilter === 'DEPRESSURIZED'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Depressurized ({rows.filter((r) => r.operationalStatus === 'DEPRESSURIZED').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('OVERPRESSURE_VENT_REQUIRED')}
              className={`px-2.5 py-1 rounded font-semibold transition-all cursor-pointer ${
                statusFilter === 'OVERPRESSURE_VENT_REQUIRED'
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Overpressured ({rows.filter((r) => r.operationalStatus === 'OVERPRESSURE_VENT_REQUIRED').length})
            </button>
          </div>
        </div>
      </div>

      {/* 4. 10-Column Master ISO Tank Mass Balance & Depressurization Table with Checkboxes */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-bold text-slate-100">
              ISO Tank Physical Inventory & Depressurization Mass Balance Ledger
            </h4>
            <span className="text-xs font-mono text-slate-400">
              ({selectedRows.length}/{rows.length} Active in Calculation)
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline-block">
            Physical Accounting (kg & m³) • Interactive Checkbox Selection
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/90">
                {/* 0. Multi-Select Master Checkbox */}
                <th className="py-3 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={isAllFilteredSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={toggleSelectAllFiltered}
                    title={isAllFilteredSelected ? "Deselect All Filtered" : "Select All Filtered"}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 accent-cyan-500 focus:ring-cyan-500 cursor-pointer"
                  />
                </th>

                {/* 1. ISO Tank & Serial */}
                <th className="py-3 px-4 text-left">
                  <div className="text-xs font-semibold text-slate-200">ISO Tank & Serial</div>
                  <div className="text-[10px] font-normal text-slate-400 tracking-wider">[ ID / Prefix ]</div>
                </th>

                {/* 2. Shipment */}
                <th className="py-3 px-3 text-center">
                  <div className="text-xs font-semibold text-slate-200">Shipment</div>
                  <div className="text-[10px] font-normal text-slate-400 tracking-wider">[ Batch ]</div>
                </th>

                {/* 3. Initial Weight (Arun) */}
                <th className="py-3 px-4 text-right">
                  <div className="text-xs font-semibold text-slate-200">Initial Weight (Arun)</div>
                  <div className="text-[10px] font-normal text-slate-400 tracking-wider">[ kg ]</div>
                </th>

                {/* 4. Arrival Stock (IoT) */}
                <th className="py-3 px-4 text-right">
                  <div className="text-xs font-semibold text-slate-200">Arrival Stock (IoT)</div>
                  <div className="text-[10px] font-normal text-slate-400 tracking-wider">[ m³ / kg ]</div>
                </th>

                {/* 5. Post-Depress. Stock */}
                <th className="py-3 px-4 text-right">
                  <div className="text-xs font-semibold text-slate-200">Post-Depress. Stock</div>
                  <div className="text-[10px] font-normal text-slate-400 tracking-wider">[ m³ / kg ]</div>
                </th>

                {/* 6. BOG Venting Losses */}
                <th className="py-3 px-4 text-right">
                  <div className="text-xs font-semibold text-slate-200">BOG Venting Losses</div>
                  <div className="text-[10px] font-normal text-slate-400 tracking-wider">[ kg / % ]</div>
                </th>

                {/* 7. Liquid Density */}
                <th className="py-3 px-3 text-center">
                  <div className="text-xs font-semibold text-slate-200">Liquid Density</div>
                  <div className="text-[10px] font-normal text-slate-400 tracking-wider">[ kg/m³ ]</div>
                </th>

                {/* 8. Available Bay Stock */}
                <th className="py-3 px-4 text-right">
                  <div className="text-xs font-semibold text-slate-200">Available Bay Stock</div>
                  <div className="text-[10px] font-normal text-slate-400 tracking-wider">[ kg ]</div>
                </th>

                {/* 9. Operational Status */}
                <th className="py-3 px-4 text-center">
                  <div className="text-xs font-semibold text-slate-200">Operational Status</div>
                  <div className="text-[10px] font-normal text-slate-400 tracking-wider">[ State ]</div>
                </th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 font-sans text-xs">
                    No matching ISO Tank mass balance records found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => {
                  const isSelected = selectedTankNos.has(row.tankNo);
                  const zebraBg = idx % 2 === 0 ? 'bg-slate-900/60' : 'bg-slate-900/25';
                  const rowClass = isSelected
                    ? 'bg-sky-950/30 hover:bg-sky-950/40'
                    : `${zebraBg} hover:bg-slate-800/40`;

                  return (
                    <tr
                      key={row.tankNo}
                      className={`${rowClass} transition-colors border-b border-slate-800/80`}
                    >
                      {/* 0. Row Checkbox */}
                      <td className="py-3 px-3 text-center w-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectTank(row.tankNo)}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 accent-cyan-500 focus:ring-cyan-500 cursor-pointer"
                        />
                      </td>

                      {/* 1. ISO Tank & Serial */}
                      <td className="py-3 px-4 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-mono text-[10px] w-4">#{idx + 1}</span>
                          <div>
                            <span className="font-bold font-mono text-cyan-300 text-sm block">
                              {row.tankNo}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 block">
                              {row.serialNo}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Shipment Batch */}
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-bold font-mono">
                          {row.shipment}
                        </span>
                      </td>

                      {/* 3. Initial Weight (Arun) [kg] */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono text-slate-200 font-medium text-xs">
                          {row.initialWeightArunKg.toLocaleString()}
                        </span>
                      </td>

                      {/* 4. Arrival Stock (IoT) [m³ / kg] */}
                      <td className="py-3 px-4 text-right font-mono">
                        <div className="text-slate-200 font-medium text-xs">
                          {row.arrivalStockKg.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {row.arrivalStockM3.toFixed(1)} m³
                        </div>
                      </td>

                      {/* 5. Post-Depress. Stock [m³ / kg] */}
                      <td className="py-3 px-4 text-right font-mono">
                        <div className="text-slate-200 font-medium text-xs">
                          {row.postDepressStockKg.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {row.postDepressStockM3.toFixed(1)} m³
                        </div>
                      </td>

                      {/* 6. BOG Venting Losses [kg / %] */}
                      <td className="py-3 px-4 text-right font-mono">
                        <div className="text-rose-400 font-semibold text-xs">
                          -{row.bogLossKg.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                        </div>
                        <div className="text-[10px] text-rose-400/80">
                          ({row.bogLossPercent.toFixed(2)}%)
                        </div>
                      </td>

                      {/* 7. Liquid Density [kg/m³] */}
                      <td className="py-3 px-3 text-center font-mono text-slate-300 text-xs">
                        {row.liquidDensity.toFixed(1)}
                      </td>

                      {/* 8. Available Bay Stock [kg] */}
                      <td className="py-3 px-4 text-right font-mono">
                        <span className="text-emerald-400 font-bold text-sm">
                          {row.availableBayStockKg.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                        </span>
                      </td>

                      {/* 9. Operational Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            row.operationalStatus === 'OVERPRESSURE_VENT_REQUIRED'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {row.operationalStatus === 'OVERPRESSURE_VENT_REQUIRED' ? (
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          )}
                          <span>
                            {row.operationalStatus === 'OVERPRESSURE_VENT_REQUIRED'
                              ? 'Overpressured - Vent Required'
                              : 'Depressurized'}
                          </span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredRows.length > 0 && (
              <tfoot>
                <tr className="bg-slate-950 border-t-2 border-slate-800 font-mono font-bold text-xs text-slate-200">
                  <td className="py-3.5 px-4 text-left" colSpan={3}>
                    <span className="text-cyan-400 uppercase tracking-wider text-[11px]">
                      Selected Total ({selectedRows.length} Tanks)
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right text-blue-400">
                    {selectedRows.reduce((acc, r) => acc + r.initialWeightArunKg, 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-200">
                    <div>{selectedRows.reduce((acc, r) => acc + r.arrivalStockKg, 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      {selectedRows.reduce((acc, r) => acc + r.arrivalStockM3, 0).toFixed(1)} m³
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-200">
                    <div>{selectedRows.reduce((acc, r) => acc + r.postDepressStockKg, 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      {selectedRows.reduce((acc, r) => acc + r.postDepressStockM3, 0).toFixed(1)} m³
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right text-rose-400">
                    <div>-{selectedRows.reduce((acc, r) => acc + r.bogLossKg, 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}</div>
                    <div className="text-[10px] text-rose-400/80 font-normal">
                      (~{(selectedRows.reduce((acc, r) => acc + r.bogLossKg, 0) / (selectedRows.reduce((acc, r) => acc + r.arrivalStockKg, 0) || 1) * 100).toFixed(2)}%)
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-center text-slate-400 font-normal">
                    428.0
                  </td>
                  <td className="py-3.5 px-4 text-right text-emerald-400 text-sm">
                    {selectedRows.reduce((acc, r) => acc + r.availableBayStockKg, 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  </td>
                  <td className="py-3.5 px-4 text-center text-[10px] text-slate-400 font-sans font-normal">
                    Reconciled Mass Balance
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
