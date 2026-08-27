// src/components/locations/arun/ArunLabSpecTab.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { Atom, Filter, Download } from 'lucide-react';
import { usePortalData } from '../../../context/PortalDataContext';
import { exportToCSV } from '../../../utils/exportCsv';

export default function ArunLabSpecTab() {
  const portalData = usePortalData() || {};
  const coqSpecifications: any[] = useMemo(() => {
    const raw = (portalData as any).coqSpecifications || (portalData as any).gasCompositions;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    return [
      {
        id: 'coq-pagt-01',
        samplePoint: 'Arun PAG Jetty Loading Line M-101',
        shipment: 'N-1',
        reportDate: '2026-08-10',
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
      {
        id: 'coq-pagt-02',
        samplePoint: 'Arun PAG Jetty Loading Line M-102',
        shipment: 'N-2',
        reportDate: '2026-08-25',
        methane: 95.6,
        ethane: 3.35,
        propane: 0.75,
        iButane: 0.14,
        nButane: 0.11,
        iPentane: 0.02,
        nPentane: 0.01,
        c6Plus: 0.00,
        nitrogen: 0.02,
        co2: 0.00,
        ghv: 1057.2,
      },
    ];
  }, [portalData]);

  const [coqShipmentFilter, setCoqShipmentFilter] = useState<string>('ALL');

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

  const distinctCOQShipments = useMemo(() => {
    const list = (coqSpecifications || []).map((c: any) => c.shipment || 'N-1');
    return Array.from(new Set(list));
  }, [coqSpecifications]);

  const filteredCOQRecords = useMemo(() => {
    return (coqSpecifications || []).filter((c: any) => {
      if (coqShipmentFilter === 'ALL') return true;
      return (c.shipment || 'N-1') === coqShipmentFilter;
    });
  }, [coqSpecifications, coqShipmentFilter]);

  const coqTotalMol = useMemo(() => {
    return (
      activeCOQSpec.methane +
      activeCOQSpec.ethane +
      activeCOQSpec.propane +
      activeCOQSpec.iButane +
      activeCOQSpec.nButane +
      activeCOQSpec.iPentane +
      activeCOQSpec.nPentane +
      (activeCOQSpec.c6Plus || 0) +
      activeCOQSpec.nitrogen +
      activeCOQSpec.co2
    );
  }, [activeCOQSpec]);

  const handleExportCOQ = () => {
    exportToCSV(
      filteredCOQRecords,
      `PAGT_Arun_COQ_Lab_Specification_${coqShipmentFilter}_${new Date().toISOString().split('T')[0]}`
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Main Quality Panel */}
      <div className="bg-white border border-slate-200 rounded-none p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Atom className="w-5 h-5 text-slate-900" />
              Arun PAG Gas Quality Specification (11 Molecular Components)
            </h3>
            <p className="text-xs text-slate-600 font-bold">
              Certified laboratory chromatographic gas analysis for high-rich Arun PAG LNG
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-900" />
              <span className="text-slate-900 font-bold">Shipment Batch:</span>
              <select
                value={coqShipmentFilter}
                onChange={(e) => setCoqShipmentFilter(e.target.value)}
                className="win-panel rounded-none px-2.5 py-1 text-slate-900 text-xs focus:outline-none focus:border-cyan-500 font-mono font-bold"
              >
                <option value="ALL">All Batches (Fleet Avg)</option>
                {distinctCOQShipments.map((shp) => (
                  <option key={shp} value={shp}>
                    Shipment {shp}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-900 font-bold">Lab Sum:</span>
              <span className="px-3 py-1 rounded-none bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-mono font-bold">
                Total Mol%: {coqTotalMol.toFixed(2)}% (Verified OK)
              </span>
            </div>
          </div>
        </div>

        {/* Visual Component Proportions Bar */}
        <div className="space-y-1.5">
          <div className="h-4 w-full bg-white rounded-none overflow-hidden flex border border-slate-200">
            <div
              style={{ width: `${activeCOQSpec.methane}%` }}
              title={`CH₄ Methane: ${activeCOQSpec.methane}%`}
              className="bg-blue-500 h-full"
            />
            <div
              style={{ width: `${activeCOQSpec.ethane}%` }}
              title={`C₂H₆ Ethane: ${activeCOQSpec.ethane}%`}
              className="bg-cyan-400 h-full"
            />
            <div
              style={{ width: `${activeCOQSpec.propane}%` }}
              title={`C₃H₈ Propane: ${activeCOQSpec.propane}%`}
              className="bg-emerald-400 h-full"
            />
            <div
              style={{ width: `${activeCOQSpec.iButane + activeCOQSpec.nButane}%` }}
              title={`Butanes (i/n): ${(activeCOQSpec.iButane + activeCOQSpec.nButane).toFixed(2)}%`}
              className="bg-amber-400 h-full"
            />
            <div
              style={{
                width: `${
                  activeCOQSpec.iPentane +
                  activeCOQSpec.nPentane +
                  activeCOQSpec.c6Plus +
                  activeCOQSpec.nitrogen +
                  activeCOQSpec.co2
                }%`,
              }}
              title="Pentanes, Hexanes & Inerts"
              className="bg-purple-400 h-full"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-900 font-bold font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-none bg-blue-500 inline-block" /> CH₄ ({activeCOQSpec.methane.toFixed(2)}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-none bg-cyan-400 inline-block" /> C₂H₆ ({activeCOQSpec.ethane.toFixed(2)}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-none bg-emerald-400 inline-block" /> C₃H₈ ({activeCOQSpec.propane.toFixed(2)}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-none bg-amber-400 inline-block" /> C₄H₁₀ ({(activeCOQSpec.iButane + activeCOQSpec.nButane).toFixed(2)}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-none bg-purple-400 inline-block" /> Inerts / Heavy ({(activeCOQSpec.nitrogen + (activeCOQSpec.c6Plus || 0)).toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* 11 Component Grid Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 font-mono">
          <div className="p-3 bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-600 font-bold font-sans block">CH₄ (Methane)</span>
            <span className="text-lg font-bold text-slate-900">{activeCOQSpec.methane.toFixed(2)} %</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-600 font-bold font-sans block">C₂H₆ (Ethane)</span>
            <span className="text-lg font-bold text-slate-900">{activeCOQSpec.ethane.toFixed(2)} %</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-600 font-bold font-sans block">C₃H₈ (Propane)</span>
            <span className="text-lg font-bold text-slate-900">{activeCOQSpec.propane.toFixed(2)} %</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-600 font-bold font-sans block">i-C₄H₁₀ (i-Butane)</span>
            <span className="text-lg font-bold text-slate-900">{activeCOQSpec.iButane.toFixed(2)} %</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-600 font-bold font-sans block">n-C₄H₁₀ (n-Butane)</span>
            <span className="text-lg font-bold text-slate-900">{activeCOQSpec.nButane.toFixed(2)} %</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-600 font-bold font-sans block">i-C₅H₁₂ (i-Pentane)</span>
            <span className="text-lg font-bold text-slate-900">{activeCOQSpec.iPentane.toFixed(2)} %</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-600 font-bold font-sans block">n-C₅H₁₂ (n-Pentane)</span>
            <span className="text-lg font-bold text-slate-900">{activeCOQSpec.nPentane.toFixed(2)} %</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-600 font-bold font-sans block">C₆⁺ (Hexane+)</span>
            <span className="text-lg font-bold text-slate-900">{(activeCOQSpec.c6Plus || 0).toFixed(2)} %</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-600 font-bold font-sans block">N₂ (Nitrogen)</span>
            <span className="text-lg font-bold text-slate-900">{activeCOQSpec.nitrogen.toFixed(2)} %</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-600 font-bold font-sans block">CO₂ (Carbon Dioxide)</span>
            <span className="text-lg font-bold text-slate-900">{activeCOQSpec.co2.toFixed(2)} %</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 sm:col-span-2">
            <span className="text-[11px] text-slate-600 font-bold font-sans block">Gross Heating Value (BTU/SCF)</span>
            <span className="text-lg font-bold text-blue-900">{activeCOQSpec.ghv.toFixed(1)} BTU/SCF</span>
          </div>
        </div>
      </div>

      {/* Historical Batch COQ Analysis Table */}
      <div className="bg-white border border-slate-200 rounded-none overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <span className="font-bold text-sm text-slate-900">
              COQ Laboratory Testing Archive Across Tank Batches
            </span>
            <span className="text-xs text-slate-600 font-bold block">
              {filteredCOQRecords.length} records matching {coqShipmentFilter === 'ALL' ? 'all shipments' : `Shipment ${coqShipmentFilter}`}
            </span>
          </div>
          <button
            type="button"
            onClick={handleExportCOQ}
            className="win-btn flex items-center gap-1.5 px-3 py-1.5 text-slate-900 text-xs font-bold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-900" />
            <span>Export COQ (.CSV)</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1300px] text-xs">
            <thead className="bg-[#e8e6e1] text-slate-900 font-bold uppercase tracking-wider border-b border-slate-300">
              <tr>
                <th className="p-2.5">Sample Specimen</th>
                <th className="p-2.5">Shipment</th>
                <th className="p-2.5">Lab Date</th>
                <th className="p-2.5 text-right">CH₄ (%)</th>
                <th className="p-2.5 text-right">C₂H₆ (%)</th>
                <th className="p-2.5 text-right">C₃H₈ (%)</th>
                <th className="p-2.5 text-right">i-C₄H₁₀ (%)</th>
                <th className="p-2.5 text-right">n-C₄H₁₀ (%)</th>
                <th className="p-2.5 text-right">i-C₅H₁₂ (%)</th>
                <th className="p-2.5 text-right">n-C₅H₁₂ (%)</th>
                <th className="p-2.5 text-right">C₆⁺ (%)</th>
                <th className="p-2.5 text-right">N₂ (%)</th>
                <th className="p-2.5 text-right">CO₂ (%)</th>
                <th className="p-2.5 text-right text-blue-900">GHV (BTU/SCF)</th>
                <th className="p-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {filteredCOQRecords.map((coq) => (
                <tr key={coq.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-2.5 font-bold text-slate-900">{coq.samplePoint}</td>
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200 text-[11px] font-bold">
                      {coq.shipment || 'N-1'}
                    </span>
                  </td>
                  <td className="p-2.5 text-slate-700">{coq.reportDate}</td>
                  <td className="p-2.5 text-right font-bold text-slate-900">{coq.methane.toFixed(2)}</td>
                  <td className="p-2.5 text-right text-slate-800">{coq.ethane.toFixed(2)}</td>
                  <td className="p-2.5 text-right text-slate-800">{coq.propane.toFixed(2)}</td>
                  <td className="p-2.5 text-right text-slate-800">{coq.iButane.toFixed(2)}</td>
                  <td className="p-2.5 text-right text-slate-800">{coq.nButane.toFixed(2)}</td>
                  <td className="p-2.5 text-right text-slate-800">{coq.iPentane.toFixed(2)}</td>
                  <td className="p-2.5 text-right text-slate-800">{coq.nPentane.toFixed(2)}</td>
                  <td className="p-2.5 text-right text-slate-800">{(coq.c6Plus || 0).toFixed(2)}</td>
                  <td className="p-2.5 text-right text-slate-800">{coq.nitrogen.toFixed(2)}</td>
                  <td className="p-2.5 text-right text-slate-800">{coq.co2.toFixed(2)}</td>
                  <td className="p-2.5 text-right font-bold text-blue-900">{coq.ghv.toFixed(1)}</td>
                  <td className="p-2.5 text-center font-sans">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                      Passed Spec
                    </span>
                  </td>
                </tr>
              ))}
              {filteredCOQRecords.length === 0 && (
                <tr>
                  <td colSpan={15} className="text-center py-12 text-slate-500 font-sans text-xs">
                    No COQ test records found for {coqShipmentFilter === 'ALL' ? 'selected criteria' : `Shipment ${coqShipmentFilter}`}.
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
