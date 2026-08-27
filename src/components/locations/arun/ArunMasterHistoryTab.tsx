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
} from 'lucide-react';
import { usePortalData } from '../../../context/PortalDataContext';
import { exportToCSV } from '../../../utils/exportCsv';
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
    const list = fleetTanks.map((tank, idx) => {
      const stage1HeelKg = tank.offloadHeelMetrics?.heelMassKg || 365;
      const stage1DpMm = tank.offloadHeelMetrics?.heelMmH2O || 38;
      const stage2MassKg = tank.backhaulDepartureMetrics?.departureMassKg || 350;
      const verifiedArunGrossKg = tank.arrivalHeelMetrics?.grossWeightKg || 11182;
      const tareKg = tank.arrivalHeelMetrics?.tareWeightKg || 10850;
      const verifiedArunMassKg = verifiedArunGrossKg - tareKg;
      const voyageBogKg = Math.max(0, stage2MassKg - verifiedArunMassKg);

      const { driftDeltaKg, driftPct, verdict } = calculateGaugeDriftError(
        verifiedArunGrossKg,
        tareKg,
        stage1HeelKg
      );

      return {
        id: `calib-${tank.tankNo}-${idx}`,
        tankNo: tank.tankNo,
        serialNo: tank.serialNo,
        voyageNo: 'VOY-2026-N1',
        niasDpMmH2o: stage1DpMm,
        niasEstMassKg: stage1HeelKg,
        departureMassKg: stage2MassKg,
        arunVerifiedMassKg: verifiedArunMassKg,
        voyageBogKg,
        netDriftKg: driftDeltaKg,
        netDriftPct: driftPct,
        status: verdict,
        flaggedForMro: verdict === 'CAL_FAIL',
      };
    });
    return sortTanksNaturally(list);
  }, [fleetTanks]);

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

  const handleExportFullHistory = () => {
    exportToCSV(
      filteredHistoryRecords,
      `PAGT_Arun_Master_Custody_Measurement_Ledger_${new Date().toISOString().split('T')[0]}`
    );
  };

  const handleExportCalibrationCSV = () => {
    exportToCSV(
      filteredCalibrationRecords,
      `PAGT_Arun_Gauge_Calibration_Reconciliation_Ledger_${new Date().toISOString().split('T')[0]}`
    );
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
      {/* Sub-Mode Navigation Strip */}
      <div className="p-3 border-b border-slate-200 bg-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setLedgerMode('CUSTODY_ENERGY')}
            className={`px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
              ledgerMode === 'CUSTODY_ENERGY'
                ? 'win-tab-active bg-[#0a2558] text-white'
                : 'win-tab-inactive bg-[#ece9d8] text-slate-800'
            }`}
          >
            Custody Energy Ledger
          </button>
          <button
            type="button"
            onClick={() => setLedgerMode('GAUGE_CALIBRATION')}
            className={`px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
              ledgerMode === 'GAUGE_CALIBRATION'
                ? 'win-tab-active bg-[#0a2558] text-white'
                : 'win-tab-inactive bg-[#ece9d8] text-slate-800'
            }`}
          >
            Gauge Calibration Ledger
          </button>
        </div>

        <div className="text-xs font-mono text-slate-600 font-bold">
          {ledgerMode === 'CUSTODY_ENERGY'
            ? `Active Mode: Certified Batch Billing & Molecular Archive (${filteredHistoryRecords.length} records)`
            : `Active Mode: DP/SMT vs Ground Truth Weighbridge Reconciliation (${filteredCalibrationRecords.length} records)`}
        </div>
      </div>

      {/* MODE A: CUSTODY ENERGY LEDGER */}
      {ledgerMode === 'CUSTODY_ENERGY' && (
        <>
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
                onClick={handleExportFullHistory}
                className="win-btn flex items-center gap-1.5 px-3 py-1 text-slate-900 text-xs font-bold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Full History (.CSV)</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[calc(100vh-320px)] overflow-y-auto">
            <table className="w-full text-left border-collapse min-w-[1400px] text-xs">
              <thead className="sticky top-0 bg-[#e8e6e1] z-10 text-slate-900 font-bold uppercase tracking-wider border-b border-slate-300">
                <tr>
                  <th className="p-2 cursor-pointer" onClick={() => handleSort('tankNo')}>
                    Tank UID {renderSortIcon('tankNo')}
                  </th>
                  <th className="p-2">Serial No</th>
                  <th className="p-2">Shipment</th>
                  <th className="p-2 cursor-pointer" onClick={() => handleSort('date')}>
                    Date {renderSortIcon('date')}
                  </th>
                  <th className="p-2 text-right">Tare (kg)</th>
                  <th className="p-2 text-right">Gross (kg)</th>
                  <th className="p-2 text-right cursor-pointer" onClick={() => handleSort('deliveredWeightKg')}>
                    Net Mass (kg) {renderSortIcon('deliveredWeightKg')}
                  </th>
                  <th className="p-2 text-right cursor-pointer" onClick={() => handleSort('deliveredVolumeM3')}>
                    Net Vol (m³) {renderSortIcon('deliveredVolumeM3')}
                  </th>
                  <th className="p-2 text-right cursor-pointer" onClick={() => handleSort('deliveredMMBtu')}>
                    Energy (MMBtu) {renderSortIcon('deliveredMMBtu')}
                  </th>
                  <th className="p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {filteredHistoryRecords.map((r, idx) => (
                  <tr key={`${r.tankNo}-${idx}`} className="hover:bg-slate-50">
                    <td className="p-2 font-bold text-blue-900">{r.tankNo}</td>
                    <td className="p-2 text-slate-700">{r.serialNo}</td>
                    <td className="p-2 font-sans font-bold text-blue-800">{r.shipment || 'N-1'}</td>
                    <td className="p-2 text-slate-700">{r.date}</td>
                    <td className="p-2 text-right">{r.weightBeforeKg?.toLocaleString()} kg</td>
                    <td className="p-2 text-right">{r.weightAfterKg?.toLocaleString()} kg</td>
                    <td className="p-2 text-right font-bold text-slate-900">{r.deliveredWeightKg?.toLocaleString()} kg</td>
                    <td className="p-2 text-right">{r.deliveredVolumeM3?.toFixed(2)} m³</td>
                    <td className="p-2 text-right font-bold text-blue-900">{r.deliveredMMBtu?.toFixed(2)} MMBtu</td>
                    <td className="p-2 text-center font-sans">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Archived
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* MODE B: GAUGE CALIBRATION LEDGER */}
      {ledgerMode === 'GAUGE_CALIBRATION' && (
        <>
          <div className="p-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter Calibration records..."
                  value={calibSearch}
                  onChange={(e) => setCalibSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-slate-300 rounded-none text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-700 font-bold">Status:</span>
                <select
                  value={calibStatusFilter}
                  onChange={(e) => setCalibStatusFilter(e.target.value)}
                  className="win-panel rounded-none px-2 py-0.5 text-xs text-slate-900 focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PASS">PASS (Within Spec)</option>
                  <option value="DRIFT_WARN">DRIFT_WARN (Linear Warning)</option>
                  <option value="CAL_FAIL">CAL_FAIL (Exceeded Drift Threshold)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCalibrationCSV}
                className="win-btn flex items-center gap-1.5 px-3 py-1 text-slate-900 text-xs font-bold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Calibration (.CSV)</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[calc(100vh-320px)] overflow-y-auto">
            <table className="w-full text-left border-collapse min-w-[1200px] text-xs">
              <thead className="sticky top-0 bg-[#e8e6e1] z-10 text-slate-900 font-bold uppercase tracking-wider border-b border-slate-300">
                <tr>
                  <th className="p-2">Voyage No</th>
                  <th className="p-2">Tank UID</th>
                  <th className="p-2">Serial No</th>
                  <th className="p-2 text-right">Nias DP Gauge (mmH2O)</th>
                  <th className="p-2 text-right">Nias Est Heel (kg)</th>
                  <th className="p-2 text-right">Arun Verified Heel (kg)</th>
                  <th className="p-2 text-right">Voyage BOG (kg)</th>
                  <th className="p-2 text-right">Net Drift (kg)</th>
                  <th className="p-2 text-right">Net Drift (%)</th>
                  <th className="p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {filteredCalibrationRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="p-2 text-slate-700">{r.voyageNo}</td>
                    <td className="p-2 font-bold text-blue-900">{r.tankNo}</td>
                    <td className="p-2 text-slate-700">{r.serialNo}</td>
                    <td className="p-2 text-right">{r.niasDpMmH2o} mm</td>
                    <td className="p-2 text-right">{r.niasEstMassKg} kg</td>
                    <td className="p-2 text-right font-bold text-slate-900">{r.arunVerifiedMassKg} kg</td>
                    <td className="p-2 text-right text-amber-800">{r.voyageBogKg} kg</td>
                    <td className="p-2 text-right">{r.netDriftKg >= 0 ? `+${r.netDriftKg}` : r.netDriftKg} kg</td>
                    <td className="p-2 text-right font-bold">{r.netDriftPct >= 0 ? `+${r.netDriftPct}%` : `${r.netDriftPct}%`}</td>
                    <td className="p-2 text-center font-sans">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold ${
                          r.status === 'PASS'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : r.status === 'DRIFT_WARN'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
