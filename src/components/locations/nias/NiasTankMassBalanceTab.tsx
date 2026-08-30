'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  AlertTriangle,
  CheckCircle2,
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

      return matchesSearch && matchesStatus;
    });
  }, [rows, searchQuery, statusFilter]);

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
      'data:text/csv;charset=utf-8,\uFEFF' +
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
    <div className="space-y-3 animate-in fade-in duration-200 font-mono">
      {/* 1. Header Information Banner (SCADA Navy Theme) */}
      <div className="bg-[#0a2540] text-white p-3 rounded-t-xs border-b-2 border-[#071a2e] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5 select-none">
        <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white font-mono">
          ISO TANK MASS BALANCE &amp; YARD DEPRESSURIZATION LOG
        </h3>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xs text-xs font-bold font-mono bg-[#2f855a] hover:bg-[#38a169] active:bg-[#22543d] text-white border-t border-l border-[#48bb78] border-b-2 border-r-2 border-[#1c4d35] shadow-xs transition-all cursor-pointer select-none"
          >
            <Download className="w-3.5 h-3.5" />
            <span>[ EXPORT CSV ]</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary Scope & 3 Slim KPI Cards (Height-Optimized & Centered) */}
      <div className="space-y-2.5 font-mono">
        {/* Dynamic Selection Scope Bar */}
        <div className="flex flex-wrap justify-between items-center gap-2 px-2 py-1 text-xs bg-[#dfdbd1] rounded-xs border border-[#8a8579]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 uppercase tracking-tight text-[11px]">CALCULATION SCOPE:</span>
            <span
              className={`px-2 py-0.5 rounded-xs font-mono text-xs font-black border shadow-2xs ${
                metrics.selectedCount === metrics.totalTanks
                  ? 'bg-[#002b4d] text-cyan-300 border-blue-900'
                  : 'bg-[#7c3aed] text-white border-purple-900'
              }`}
            >
              {metrics.selectedCount} / {metrics.totalTanks} TANKS SELECTED
            </span>
          </div>

          {metrics.selectedCount !== metrics.totalTanks && (
            <button
              type="button"
              onClick={handleResetToAll}
              className="flex items-center gap-1 text-[11px] font-bold bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-900 px-2 py-0.5 rounded-xs border-t border-l border-white border-b-2 border-r-2 border-slate-600 shadow-xs transition-all cursor-pointer font-mono"
            >
              <RotateCcw className="w-3 h-3" />
              <span>RESET TO ALL TANKS</span>
            </button>
          )}
        </div>

        {/* 3 Compact Centered 3D KPI Cards with #4e5d6e Headers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {/* Card 1: INITIAL ARRIVAL INVENTORY */}
          <div className="bg-[#e8e4dc] border-2 border-[#8a8579] rounded-xs overflow-hidden shadow-xs flex flex-col justify-between">
            <div className="bg-[#4e5d6e] text-white px-3 py-1.5 flex items-center justify-between border-b border-[#334155]">
              <span className="text-[11px] font-black uppercase tracking-wider text-white">
                INITIAL ARRIVAL INVENTORY
              </span>
              <span className="text-[9.5px] font-bold font-mono px-1.5 py-0.2 bg-[#334155] text-slate-200 border border-[#64748b] rounded-xs">
                {metrics.selectedCount} TANKS
              </span>
            </div>

            <div className="p-2.5 flex flex-col items-center justify-center text-center space-y-0.5">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-xl sm:text-2xl font-black font-mono text-slate-900">
                  {metrics.totalInitialWeightArunKg.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-slate-600">kg</span>
              </div>
              <div className="text-[11px] font-bold text-slate-600">
                Arrival: <strong className="text-slate-900">{metrics.totalArrivalStockKg.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg</strong>{' '}
                <span className="text-[#0055aa]">({metrics.totalArrivalStockM3.toFixed(1)} m³)</span>
              </div>
              <div className="pt-1.5 mt-1 border-t border-[#c8c2b5] w-full text-[9.5px] font-bold text-slate-500 text-center">
                Arun Baseline • Tare &amp; Net Certified
              </div>
            </div>
          </div>

          {/* Card 2: TOTAL YARD BOG LOSS */}
          <div className="bg-[#e8e4dc] border-2 border-[#8a8579] rounded-xs overflow-hidden shadow-xs flex flex-col justify-between">
            <div className="bg-[#4e5d6e] text-white px-3 py-1.5 flex items-center justify-between border-b border-[#334155]">
              <span className="text-[11px] font-black uppercase tracking-wider text-white">
                TOTAL YARD BOG LOSS
              </span>
              <span className="text-[9.5px] font-bold font-mono px-1.5 py-0.2 bg-red-950/80 text-red-200 border border-red-700 rounded-xs">
                ~{metrics.avgLossPct.toFixed(1)}%
              </span>
            </div>

            <div className="p-2.5 flex flex-col items-center justify-center text-center space-y-0.5">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-xl sm:text-2xl font-black font-mono text-[#c53030]">
                  -{metrics.totalBogLossKg.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </span>
                <span className="text-xs font-bold text-red-800">kg</span>
              </div>
              <div className="text-[11px] font-bold text-slate-600">
                Overpressure:{' '}
                <span className={metrics.overpressureCount > 0 ? 'text-[#c53030] font-black' : 'text-slate-700'}>
                  {metrics.overpressureCount} Tanks (&gt; 5.0%)
                </span>
              </div>
              <div className="pt-1.5 mt-1 border-t border-[#c8c2b5] w-full text-[9.5px] font-bold text-red-700 text-center">
                Depress: 0.81 ➔ 0.73 MPa • Vented Boil-Off
              </div>
            </div>
          </div>

          {/* Card 3: NET USABLE STOCK (SKID FEED) */}
          <div className="bg-[#f0f7ff] border-2 border-[#7ba4cc] rounded-xs overflow-hidden shadow-xs flex flex-col justify-between">
            <div className="bg-[#4e5d6e] text-white px-3 py-1.5 flex items-center justify-between border-b border-[#334155]">
              <span className="text-[11px] font-black uppercase tracking-wider text-white">
                NET USABLE STOCK (SKID FEED)
              </span>
              <span className="text-[9.5px] font-bold font-mono px-1.5 py-0.2 bg-blue-950/80 text-cyan-200 border border-blue-700 rounded-xs">
                {metrics.usablePct.toFixed(1)}% Usable
              </span>
            </div>

            <div className="p-2.5 flex flex-col items-center justify-center text-center space-y-0.5">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-xl sm:text-2xl font-black font-mono text-[#004a99]">
                  {metrics.netUsableStockKg.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </span>
                <span className="text-xs font-bold text-[#004a99]">kg</span>
              </div>
              <div className="text-[11px] font-bold text-[#004a99]">
                Liquid Volume: <strong className="text-[#002b4d]">{metrics.netUsableStockM3.toFixed(1)} m³</strong>
              </div>
              <div className="pt-1.5 mt-1 border-t border-[#b8d2eb] w-full text-[9.5px] font-bold text-[#004a99] text-center">
                Bay Sendout Ready • 4-Bay Active Feed
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter and Search Controls (Inline Compact Layout) */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5 bg-[#dfdbd1] p-2 rounded-xs border-2 border-[#8a8579] font-mono select-none">
        {/* Compact Search Input (Max Width Constrained) */}
        <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xs border-2 border-[#8a8579] shadow-inner max-w-full sm:max-w-[420px] w-full">
          <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ISO Tank No, Serial, Shipment..."
            className="w-full bg-transparent text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 px-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* 3D Filter Buttons */}
        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 font-bold text-xs rounded-xs border-t border-l border-white border-b-2 border-r-2 shadow-xs transition-all cursor-pointer font-mono whitespace-nowrap ${
              statusFilter === 'ALL'
                ? 'bg-[#002b4d] text-cyan-300 border-blue-900 border-b-black border-r-black'
                : 'bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-900 border-slate-600'
            }`}
          >
            [ ALL ({rows.length}) ]
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('DEPRESSURIZED')}
            className={`px-3 py-1 font-bold text-xs rounded-xs border-t border-l border-white border-b-2 border-r-2 shadow-xs transition-all cursor-pointer font-mono whitespace-nowrap ${
              statusFilter === 'DEPRESSURIZED'
                ? 'bg-[#002b4d] text-cyan-300 border-blue-900 border-b-black border-r-black'
                : 'bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-900 border-slate-600'
            }`}
          >
            [ DEPRESSURIZED ({rows.filter((r) => r.operationalStatus === 'DEPRESSURIZED').length}) ]
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('OVERPRESSURE_VENT_REQUIRED')}
            className={`px-3 py-1 font-bold text-xs rounded-xs border-t border-l border-white border-b-2 border-r-2 shadow-xs transition-all cursor-pointer font-mono whitespace-nowrap ${
              statusFilter === 'OVERPRESSURE_VENT_REQUIRED'
                ? 'bg-[#002b4d] text-cyan-300 border-blue-900 border-b-black border-r-black'
                : 'bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-900 border-slate-600'
            }`}
          >
            [ OVERPRESSURED ({rows.filter((r) => r.operationalStatus === 'OVERPRESSURE_VENT_REQUIRED').length}) ]
          </button>
        </div>
      </div>

      {/* 4. 2-Tier Master ISO Tank Mass Balance Table (13 Separate Columns & Sticky Header/Footer) */}
      <div className="bg-white border-2 border-[#8a8579] rounded-xs overflow-hidden shadow-md">
        <div className="max-h-[480px] overflow-y-auto overflow-x-auto custom-scada-scrollbar">
          <table className="w-full text-xs text-center border-collapse font-mono">
            {/* 1행: 7대 그룹 헤더 (Cool Slate Gray #4e5d6e, White Text, Crisp Silver Borders) */}
            <thead className="sticky top-0 z-20 shadow-xs">
              <tr className="bg-[#4e5d6e] text-white font-extrabold uppercase text-[11px] tracking-wider border-b border-[#8b9aa8]">
                <th colSpan={4} className="py-2 px-2 border-r border-[#8b9aa8] text-center bg-[#4e5d6e]">
                  [1] IDENTIFICATION
                </th>
                <th colSpan={1} className="py-2 px-2 border-r border-[#8b9aa8] text-center bg-[#475768]">
                  [2] INITIAL
                </th>
                <th colSpan={2} className="py-2 px-2 border-r border-[#8b9aa8] text-center bg-[#3a506b]">
                  [3] ARRIVAL YARD
                </th>
                <th colSpan={2} className="py-2 px-2 border-r border-[#8b9aa8] text-center bg-[#344d6b]">
                  [4] POST-DEPRESS SKID READY
                </th>
                <th colSpan={2} className="py-2 px-2 border-r border-[#8b9aa8] text-center bg-[#2b78c5] text-white">
                  [5] BOG VENTING LOSS
                </th>
                <th colSpan={1} className="py-2 px-2 border-r border-[#8b9aa8] text-center bg-[#475768]">
                  [6] DENSITY
                </th>
                <th colSpan={1} className="py-2 px-2 text-center bg-[#4e5d6e]">
                  [7] STATUS
                </th>
              </tr>

              {/* 2행: 13개 세부 컬럼 헤더 (Mid Slate #5f6f82, Bright Silver Text, Crisp Borders) */}
              <tr className="bg-[#5f6f82] text-[#f8fafc] font-bold text-[10px] tracking-tight border-b-2 border-[#8b9aa8] select-none">
                {/* [1] Identification (4 cols) */}
                <th className="py-2 px-1 border-r border-[#8b9aa8] w-10 text-center bg-[#5f6f82]">
                  <input
                    type="checkbox"
                    checked={isAllFilteredSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={toggleSelectAllFiltered}
                    title={isAllFilteredSelected ? "Deselect All Filtered" : "Select All Filtered"}
                    className="w-3.5 h-3.5 accent-[#002b4d] cursor-pointer"
                  />
                </th>
                <th className="py-2 px-2 border-r border-[#8b9aa8] text-center bg-[#5f6f82]">TANK ID</th>
                <th className="py-2 px-2 border-r border-[#8b9aa8] text-center bg-[#5f6f82]">SERIAL NO</th>
                <th className="py-2 px-2 border-r border-[#8b9aa8] w-14 text-center bg-[#5f6f82]">BATCH</th>

                {/* [2] Initial (1 col) */}
                <th className="py-2 px-2 border-r border-[#8b9aa8] text-center bg-[#56687d]">ARUN MASS (kg)</th>

                {/* [3] Arrival Yard (2 cols) */}
                <th className="py-2 px-2 border-r border-[#8b9aa8] text-center bg-[#4f647d]">VOL (m³)</th>
                <th className="py-2 px-2 border-r border-[#8b9aa8] text-center bg-[#4f647d]">MASS (kg)</th>

                {/* [4] Post-Depress Skid Ready (2 cols) */}
                <th className="py-2 px-2 border-r border-[#8b9aa8] text-center bg-[#475d78]">VOL (m³)</th>
                <th className="py-2 px-2 border-r border-[#8b9aa8] text-center bg-[#475d78]">MASS (kg)</th>

                {/* [5] BOG Venting Loss (2 cols - Sky Blue Highlighted Header) */}
                <th className="py-2 px-2 border-r border-[#8b9aa8] bg-[#2b78c5] text-white text-center font-black">
                  LOSS (kg)
                </th>
                <th className="py-2 px-2 border-r border-[#8b9aa8] bg-[#2b78c5] text-white text-center font-black">
                  RATIO (%)
                </th>

                {/* [6] Density (1 col) */}
                <th className="py-2 px-2 border-r border-[#8b9aa8] w-24 text-center bg-[#56687d]">DENSITY (kg/m³)</th>

                {/* [7] Status (1 col) */}
                <th className="py-2 px-2 text-center bg-[#5f6f82]">STATE</th>
              </tr>
            </thead>

            {/* 테이블 본문 */}
            <tbody className="divide-y divide-[#cbd5e1] bg-white">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-8 text-center text-slate-500 font-bold">
                    No matching ISO Tank mass balance records found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => {
                  const isSelected = selectedTankNos.has(row.tankNo);
                  const isEven = idx % 2 === 0;

                  return (
                    <tr
                      key={row.tankNo}
                      className={`hover:bg-amber-50 transition-colors font-mono ${
                        isSelected ? (isEven ? 'bg-[#f5f9fc]' : 'bg-[#eef5fa]') : (isEven ? 'bg-[#faf9f6]' : 'bg-white')
                      }`}
                    >
                      {/* 0. Checkbox & No */}
                      <td className="py-2 px-1 border-r border-[#8b9aa8] border-b border-[#cbd5e1] text-center">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectTank(row.tankNo)}
                            className="w-3.5 h-3.5 accent-[#002b4d] cursor-pointer"
                          />
                          <span className="text-[10px] font-bold text-slate-400">{idx + 1}</span>
                        </div>
                      </td>

                      {/* 1. Tank ID */}
                      <td className="py-2 px-2 border-r border-[#8b9aa8] border-b border-[#cbd5e1] font-black text-[#0055aa] text-center">
                        {row.tankNo}
                      </td>

                      {/* 2. Serial No */}
                      <td className="py-2 px-2 border-r border-[#8b9aa8] border-b border-[#cbd5e1] font-bold text-slate-700 text-center">
                        {row.serialNo}
                      </td>

                      {/* 3. Shipment Batch */}
                      <td className="py-2 px-2 border-r border-[#8b9aa8] border-b border-[#cbd5e1] font-black text-[#002b4d] text-center">
                        {row.shipment}
                      </td>

                      {/* 4. Arun Mass (kg) */}
                      <td className="py-2 px-2 border-r border-[#8b9aa8] border-b border-[#cbd5e1] font-bold text-slate-800 text-center">
                        {row.initialWeightArunKg.toLocaleString()}
                      </td>

                      {/* 5. Arrival Vol (m³) */}
                      <td className="py-2 px-2 border-r border-[#8b9aa8] border-b border-[#cbd5e1] font-bold text-slate-800 text-center">
                        {row.arrivalStockM3.toFixed(1)}
                      </td>

                      {/* 6. Arrival Mass (kg) */}
                      <td className="py-2 px-2 border-r border-[#8b9aa8] border-b border-[#cbd5e1] font-bold text-slate-800 text-center">
                        {row.arrivalStockKg.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                      </td>

                      {/* 7. Post-Depress Vol (m³) */}
                      <td className="py-2 px-2 border-r border-[#8b9aa8] border-b border-[#cbd5e1] font-bold text-slate-800 text-center">
                        {row.postDepressStockM3.toFixed(1)}
                      </td>

                      {/* 8. Post-Depress Mass (kg) */}
                      <td className="py-2 px-2 border-r border-[#8b9aa8] border-b border-[#cbd5e1] font-bold text-slate-800 text-center">
                        {row.postDepressStockKg.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                      </td>

                      {/* 9. BOG Loss (kg) (Highlighted Sky Blue Cell) */}
                      <td
                        className="py-2 px-2 border-r border-[#8b9aa8] border-b border-[#cbd5e1] font-black text-[#dc2626] text-center"
                        style={{ backgroundColor: '#f0f7ff' }}
                      >
                        -{row.bogLossKg.toFixed(1)}
                      </td>

                      {/* 10. BOG Loss Ratio (%) (Highlighted Sky Blue Cell) */}
                      <td
                        className="py-2 px-2 border-r border-[#8b9aa8] border-b border-[#cbd5e1] font-black text-[#dc2626] text-center"
                        style={{ backgroundColor: '#f0f7ff' }}
                      >
                        {row.bogLossPercent.toFixed(2)}
                      </td>

                      {/* 11. Liquid Density (kg/m³) */}
                      <td className="py-2 px-2 border-r border-[#8b9aa8] border-b border-[#cbd5e1] font-bold text-slate-700 text-center">
                        {row.liquidDensity.toFixed(1)}
                      </td>

                      {/* 12. Operational State Badge */}
                      <td className="py-2 px-2 border-b border-[#cbd5e1] text-center">
                        <span
                          className={`inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-black border shadow-2xs ${
                            row.operationalStatus === 'OVERPRESSURE_VENT_REQUIRED'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          }`}
                        >
                          {row.operationalStatus === 'OVERPRESSURE_VENT_REQUIRED' ? (
                            <AlertTriangle className="w-3 h-3 text-amber-700" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          )}
                          <span>
                            {row.operationalStatus === 'OVERPRESSURE_VENT_REQUIRED'
                              ? 'OVERPRESSURED'
                              : 'DEPRESSURIZED'}
                          </span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Total Sticky Footer Row */}
            {filteredRows.length > 0 && (
              <tfoot className="sticky bottom-0 z-20 shadow-md">
                <tr className="bg-[#e8e4dc] border-t-2 border-[#8a8579] font-mono font-bold text-xs text-slate-900 select-none">
                  {/* [1] Identification Total (4 cols) */}
                  <td className="py-2.5 px-2 border-r border-[#8b9aa8] text-center font-black bg-[#e8e4dc]" colSpan={4}>
                    TOTAL ({selectedRows.length} OF {rows.length} TANKS)
                  </td>

                  {/* [2] Initial Total */}
                  <td className="py-2.5 px-2 border-r border-[#8b9aa8] font-black text-slate-900 text-center bg-[#e8e4dc]">
                    {selectedRows.reduce((acc, r) => acc + r.initialWeightArunKg, 0).toLocaleString()}
                  </td>

                  {/* [3] Arrival Yard Vol & Mass */}
                  <td className="py-2.5 px-2 border-r border-[#8b9aa8] font-black text-slate-900 text-center bg-[#e8e4dc]">
                    {selectedRows.reduce((acc, r) => acc + r.arrivalStockM3, 0).toFixed(1)}
                  </td>
                  <td className="py-2.5 px-2 border-r border-[#8b9aa8] font-black text-slate-900 text-center bg-[#e8e4dc]">
                    {selectedRows.reduce((acc, r) => acc + r.arrivalStockKg, 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  </td>

                  {/* [4] Post-Depress Skid Ready Vol & Mass */}
                  <td className="py-2.5 px-2 border-r border-[#8b9aa8] font-black text-slate-900 text-center bg-[#e8e4dc]">
                    {selectedRows.reduce((acc, r) => acc + r.postDepressStockM3, 0).toFixed(1)}
                  </td>
                  <td className="py-2.5 px-2 border-r border-[#8b9aa8] font-black text-slate-900 text-center bg-[#e8e4dc]">
                    {selectedRows.reduce((acc, r) => acc + r.postDepressStockKg, 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  </td>

                  {/* [5] BOG Venting Loss (kg & %) */}
                  <td
                    className="py-2.5 px-2 border-r border-[#8b9aa8] font-black text-[#dc2626] text-center"
                    style={{ backgroundColor: '#e2efff' }}
                  >
                    -{selectedRows.reduce((acc, r) => acc + r.bogLossKg, 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  </td>
                  <td
                    className="py-2.5 px-2 border-r border-[#8b9aa8] font-black text-[#dc2626] text-center"
                    style={{ backgroundColor: '#e2efff' }}
                  >
                    {metrics.avgLossPct.toFixed(2)}
                  </td>

                  {/* [6] Density */}
                  <td className="py-2.5 px-2 border-r border-[#8b9aa8] font-black text-slate-700 text-center bg-[#e8e4dc]">
                    428.0
                  </td>

                  {/* [7] Status */}
                  <td className="py-2.5 px-2 font-black text-[10px] text-slate-700 text-center bg-[#e8e4dc]">
                    RECONCILED
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
