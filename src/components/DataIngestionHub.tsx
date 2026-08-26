// src/components/DataIngestionHub.tsx
"use client";

import React, { useState } from 'react';
import { usePortalData } from '../context/PortalDataContext';
import {
  Database,
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Clock,
  HardDrive,
  FileText,
  Download,
} from 'lucide-react';

export default function DataIngestionHub() {
  const { ingestionStatuses, uploadCustomCSV, reloadAllData, exportAllLogsToExcel, isLoading } = usePortalData();
  const [, setIsUploading] = useState<boolean>(false);

  const handleFileUpload = (fileKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        uploadCustomCSV(fileKey, text);
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      setIsUploading(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-5 sm:gap-6 w-full text-slate-100">
      {/* Top Banner */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Database className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 shrink-0" />
            <h2 className="text-base sm:text-xl font-bold text-slate-100">Automatic CSV Ingestion & Hydration Hub</h2>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 max-w-2xl leading-relaxed">
            Continuously ingests and synchronizes all 7 operational CSV schemas from{' '}
            <code className="text-blue-400 bg-slate-950 px-1.5 py-0.5 rounded font-mono">/public/data/</code>.
            Supports drag-and-drop manual re-uploads to override field logs, COQ specs, or flow computer logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => exportAllLogsToExcel()}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>📊 Export All Logs to Excel</span>
          </button>

          <button
            onClick={() => reloadAllData()}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Reloading...' : 'Reload All 7 CSVs'}
          </button>
        </div>
      </section>

      {/* 7 CSV Schemas Cards Grid - Auto-Fill Adaptive to Screen Width */}
      <section className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3 sm:gap-4">
        {ingestionStatuses.map((item, idx) => {
          const isLoaded = item.status === 'LOADED';

          return (
            <div
              key={item.fileKey}
              className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-all group"
            >
              <div>
                {/* Header: Badge & Number */}
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                    Schema #{idx + 1}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-wider border ${
                      isLoaded
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                    }`}
                  >
                    {isLoaded ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> LOADED
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3" /> ERROR
                      </>
                    )}
                  </span>
                </div>

                {/* Title & File Name */}
                <h3 className="font-bold text-xs sm:text-sm text-slate-100 group-hover:text-blue-400 transition-colors mb-1">
                  {item.title}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-2 sm:mb-3 truncate">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">{item.fileName}</span>
                </div>

                <p className="text-[10px] sm:text-[11px] text-slate-400 leading-relaxed mb-3 sm:mb-4 line-clamp-2">
                  {item.description}
                </p>
              </div>

              {/* Footer Stats & Upload Trigger */}
              <div>
                <div className="bg-slate-950/80 rounded-lg p-2 sm:p-2.5 border border-slate-800/80 mb-3 space-y-1 sm:space-y-1.5 text-[10px] sm:text-[11px] font-mono">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="flex items-center gap-1 font-sans">
                      <HardDrive className="w-3 h-3 text-slate-500" /> Records:
                    </span>
                    <span className="font-bold text-slate-200">{item.rowCount.toLocaleString()} rows</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="flex items-center gap-1 font-sans">
                      <Clock className="w-3 h-3 text-slate-500" /> Synced at:
                    </span>
                    <span className="text-slate-300">{item.lastLoaded}</span>
                  </div>
                </div>

                {/* Upload Button */}
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors">
                    <UploadCloud className="w-3.5 h-3.5 text-blue-400" />
                    <span>Upload CSV</span>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleFileUpload(item.fileKey, e)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Pipeline Data Architecture Reference */}
      <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 sm:p-5">
        <h3 className="text-xs sm:text-sm font-bold text-slate-200 mb-2.5 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400 shrink-0" />
          Virtual Pipeline CSV Ingestion Mapping Rules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-[11px] sm:text-xs text-slate-400">
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <span className="font-semibold text-blue-400 block mb-1">1. Fleet & Location DB</span>
            Cross-references <code className="text-slate-300">Status, Location.csv</code> with <code className="text-slate-300">Master DB.csv</code> to maintain 120-fleet real-time pressures, temperatures, and FSM positions.
          </div>
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <span className="font-semibold text-emerald-400 block mb-1">2. Heat Settlement Ledger</span>
            Reconciles <code className="text-slate-300">Cert. of Delivered Measurement</code> against <code className="text-slate-300">ISO Tank Consumption.csv</code> to track BOG boil-off and flag any loss over 5.0%.
          </div>
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <span className="font-semibold text-amber-400 block mb-1">3. Gas Chromatography Audit</span>
            Aligns Loading <code className="text-slate-300">COQ.csv</code> against Nias <code className="text-slate-300">GC Composition.csv</code> (M-101A/B) and <code className="text-slate-300">FloBoss Gas Analysis</code> flow meters.
          </div>
        </div>
      </section>
    </div>
  );
}
