// src/components/portal/CalibrationComplianceView.tsx
"use client";

import React from 'react';
import { ShieldCheck } from 'lucide-react';

export function CalibrationComplianceView({ filter = 'ALL' }: { filter?: string }) {
  const allCerts = [
    { cert: 'CAL-ABB-2026-Q3', cat: 'INSTRUMENT', equip: 'GC-ABB-01', param: 'C1-C6 Hydrocarbon Gas Composition', calDate: '2026-07-28', nextDue: '2026-08-28', agency: 'PT. Sucofindo / SKG Migas', result: 'CERTIFIED (PASS)' },
    { cert: 'CAL-FM-2026-01', cat: 'INSTRUMENT', equip: 'PRSS Ultrasonic Meter', param: 'Custody Gas Mass Flow Rate (Nm3/h)', calDate: '2026-05-15', nextDue: '2026-11-15', agency: 'Ditjen Migas Calibration', result: 'CERTIFIED (PASS)' },
    { cert: 'CAL-PRV-2026-44', cat: 'PRV', equip: 'ISO Tank Relief PRV-04', param: 'Set-point Lift Pressure 0.85 MPa', calDate: '2026-06-10', nextDue: '2026-12-10', agency: 'BKI (Bureau Klasifikasi Indonesia)', result: 'CERTIFIED (PASS)' },
    { cert: 'COMP-SAFETY-2026', cat: 'AUDIT', equip: 'Terminal Cryogenic ESD', param: 'Emergency Shut-Down & Gas Leak Sensors', calDate: '2026-07-01', nextDue: '2027-07-01', agency: 'BSG Lines Marine HSE', result: 'COMPLIANT (ACTIVE)' },
  ];

  const certs = filter === 'ALL' ? allCerts : allCerts.filter((c) => c.cat === filter);

  return (
    <div className="h-full flex flex-col min-h-0 gap-1.5 w-full win-panel p-2 overflow-hidden">
      <div className="win-titlebar px-2 py-1">
        <span className="text-xs font-bold text-white flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          Calibration & Compliance - Regulatory Inspection & Audit Certificates (NIAS CMMS)
        </span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto win-sunken">
        <table className="w-full text-left border-collapse font-mono text-[11px] win-grid">
          <thead>
            <tr className="bg-slate-200 border-b border-slate-400">
              <th className="p-1.5 border-r border-slate-300">Cert / Record #</th>
              <th className="p-1.5 border-r border-slate-300">Calibrated Instrument</th>
              <th className="p-1.5 border-r border-slate-300">Measurement Parameter</th>
              <th className="p-1.5 border-r border-slate-300">Calibration Date</th>
              <th className="p-1.5 border-r border-slate-300">Next Due Date</th>
              <th className="p-1.5 border-r border-slate-300">Certifying Authority</th>
              <th className="p-1.5 text-center">Compliance Result</th>
            </tr>
          </thead>
          <tbody>
            {certs.map((c, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white hover:bg-slate-100' : 'bg-slate-50 hover:bg-slate-100'}>
                <td className="p-1.5 font-bold border-r border-slate-300 text-blue-950">{c.cert}</td>
                <td className="p-1.5 font-bold border-r border-slate-300">{c.equip}</td>
                <td className="p-1.5 border-r border-slate-300">{c.param}</td>
                <td className="p-1.5 border-r border-slate-300">{c.calDate}</td>
                <td className="p-1.5 border-r border-slate-300">{c.nextDue}</td>
                <td className="p-1.5 border-r border-slate-300">{c.agency}</td>
                <td className="p-1.5 text-center font-bold text-emerald-800 bg-emerald-50">{c.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
