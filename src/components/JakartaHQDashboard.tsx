"use client";
import React from 'react';
import { Anchor, Ship, MapPin, Zap, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

const mockNodes = [
  { id: '1', title: 'Arun PAG Terminal', count: 24, icon: <Anchor className="w-5 h-5 text-blue-400" /> },
  { id: '2', title: 'MV. Saviour Transit', count: 32, icon: <Ship className="w-5 h-5 text-cyan-400" /> },
  { id: '3', title: 'Nias Laydown Yard', count: 48, icon: <MapPin className="w-5 h-5 text-emerald-400" /> },
  { id: '4', title: 'Regas Active Bay', count: 4, icon: <Zap className="w-5 h-5 text-yellow-400" /> },
  { id: '5', title: 'Empty Return', count: 12, icon: <RefreshCw className="w-5 h-5 text-purple-400" /> },
];

const mockLedger = [
  { tankNo: 'ISO-1001', delivered: 850.5, consumed: 840.2, lossesKg: 50.1, lossesPercent: 1.2, status: 'VERIFIED' },
  { tankNo: 'ISO-1045', delivered: 860.0, consumed: 855.0, lossesKg: 20.4, lossesPercent: 0.6, status: 'VERIFIED' },
  { tankNo: 'ISO-2033', delivered: 845.0, consumed: 790.0, lossesKg: 200.0, lossesPercent: 6.5, status: 'DISPUTE_ALERT' },
  { tankNo: 'ISO-2099', delivered: 855.2, consumed: 850.0, lossesKg: 30.5, lossesPercent: 0.6, status: 'VERIFIED' },
];

export default function JakartaHQDashboard() {
  return (
    <div className="flex flex-col gap-6 p-6 w-full text-slate-100">
      
      {/* 5-Node Kanban Distribution */}
      <section>
        <h2 className="text-xl font-bold mb-4 text-slate-200">120 ISO Tank Fleet Status (5-Node FSM)</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {mockNodes.map((node) => (
            <div key={node.id} className="bg-slate-900 border border-slate-700 rounded-xl p-5 flex flex-col items-center shadow-lg hover:border-slate-500 transition-colors relative overflow-hidden">
              {/* Subtle background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-transparent pointer-events-none" />
              <div className="bg-slate-950/80 p-3 rounded-full mb-3 shadow-inner border border-slate-800 z-10">
                {node.icon}
              </div>
              <span className="text-3xl font-bold text-slate-100 mb-1 z-10">{node.count}</span>
              <span className="text-[11px] text-slate-400 text-center uppercase tracking-wider font-semibold z-10">{node.title}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KPI Cards */}
        <section className="flex flex-col gap-4 lg:col-span-1">
          <h2 className="text-xl font-bold mb-0 text-slate-200">Energy Reconciliation</h2>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-lg flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            
            <div>
              <h3 className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-semibold">Total Delivered (Arun)</h3>
              <p className="text-4xl font-bold text-blue-400 tracking-tight">102,000 <span className="text-lg text-slate-500 font-medium ml-1 tracking-normal">MMBtu</span></p>
            </div>
            
            <div className="h-px w-full bg-slate-800"></div>
            
            <div>
              <h3 className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-semibold">Total Consumed (Nias)</h3>
              <p className="text-4xl font-bold text-emerald-400 tracking-tight">100,100 <span className="text-lg text-slate-500 font-medium ml-1 tracking-normal">MMBtu</span></p>
            </div>

            <div className="h-px w-full bg-slate-800"></div>

            <div>
              <h3 className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-semibold">Total BOG Losses</h3>
              <div className="flex items-baseline gap-3">
                <p className="text-4xl font-bold text-red-400 tracking-tight">1.86%</p>
                <p className="text-sm text-slate-400 font-medium">(1,900 MMBtu)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Settlement & Losses Audit Table */}
        <section className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-4 text-slate-200">Settlement Ledger & Dispute Audit</h2>
          <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-lg h-[calc(100%-2.5rem)]">
            <div className="overflow-x-auto h-full">
              <table className="w-full text-left border-collapse min-w-max">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="p-4 border-b border-slate-800">Tank No</th>
                    <th className="p-4 border-b border-slate-800 text-right">Delivered <span className="normal-case text-slate-500">(MMBtu)</span></th>
                    <th className="p-4 border-b border-slate-800 text-right">Consumed <span className="normal-case text-slate-500">(MMBtu)</span></th>
                    <th className="p-4 border-b border-slate-800 text-right">Losses <span className="normal-case text-slate-500">(Kg)</span></th>
                    <th className="p-4 border-b border-slate-800 text-right">Losses <span className="normal-case text-slate-500">(%)</span></th>
                    <th className="p-4 border-b border-slate-800 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {mockLedger.map((row) => (
                    <tr key={row.tankNo} className={`border-b border-slate-800/50 hover:bg-slate-800/80 transition-colors ${row.status === 'DISPUTE_ALERT' ? 'bg-red-950/20' : ''}`}>
                      <td className="p-4 font-semibold text-blue-400">{row.tankNo}</td>
                      <td className="p-4 text-right font-mono text-slate-300">{row.delivered.toFixed(1)}</td>
                      <td className="p-4 text-right font-mono text-slate-300">{row.consumed.toFixed(1)}</td>
                      <td className="p-4 text-right font-mono text-slate-300">{row.lossesKg.toFixed(1)}</td>
                      <td className="p-4 text-right font-mono text-slate-300">
                        <span className={row.lossesPercent > 5.0 ? 'text-red-400 font-bold' : 'text-slate-300'}>
                          {row.lossesPercent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-4 flex justify-center">
                        {row.status === 'VERIFIED' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wide">
                            <CheckCircle className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold uppercase tracking-wide shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                            <AlertTriangle className="w-3.5 h-3.5" /> Dispute Alert
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
