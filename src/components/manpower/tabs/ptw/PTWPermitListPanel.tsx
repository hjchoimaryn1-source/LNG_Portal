// src/components/manpower/tabs/ptw/PTWPermitListPanel.tsx
"use client";

import React from 'react';
import { Search } from 'lucide-react';
import { PTWPermit, PTWWorkflowStatus } from '../../../../types/lng';
import { PTW_SOP_FORMS, validatePTWGasSafety } from '../../../../data/ptwMasterData';

export interface PTWPermitListPanelProps {
  permits: PTWPermit[];
  selectedPermitId: string;
  searchQuery: string;
  selectedStatusFilter: PTWWorkflowStatus | 'ALL';
  onSearchQueryChange: (query: string) => void;
  onStatusFilterChange: (status: PTWWorkflowStatus | 'ALL') => void;
  onSelectPermit: (permitId: string) => void;
}

export default function PTWPermitListPanel({
  permits,
  selectedPermitId,
  searchQuery,
  selectedStatusFilter,
  onSearchQueryChange,
  onStatusFilterChange,
  onSelectPermit,
}: PTWPermitListPanelProps) {
  return (
    <div className="lg:col-span-5 space-y-2">
      {/* Search & Status Filter */}
      <div className="flex gap-2 text-xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search permit ID, title, leader..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full pl-8 pr-2 py-1.5 border border-slate-300 bg-white rounded text-xs"
          />
        </div>
        <select
          value={selectedStatusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as PTWWorkflowStatus | 'ALL')}
          className="border border-slate-300 bg-white px-2 py-1.5 rounded text-xs font-mono"
        >
          <option value="ALL">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PREPARED">Prepared</option>
          <option value="APPROVED">Approved</option>
          <option value="ACTIVE">Active</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {/* Permit List Cards */}
      <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1">
        {permits.map((permit) => {
          const formDef = PTW_SOP_FORMS[permit.type];
          const isSelected = selectedPermitId === permit.id;
          const gasSafety = validatePTWGasSafety(permit.type, permit.gasReadings);

          return (
            <div
              key={permit.id}
              onClick={() => onSelectPermit(permit.id)}
              className={`p-2.5 border-2 rounded cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-800 bg-blue-50/70 shadow-md'
                  : 'border-slate-300 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${formDef.colorBg} ${formDef.colorText} border ${formDef.borderColor}`}>
                    {permit.formNumber}
                  </span>
                  <span className="font-mono font-bold text-xs text-blue-950">{permit.id}</span>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  permit.status === 'ACTIVE'
                    ? 'bg-emerald-700 text-white'
                    : permit.status === 'APPROVED'
                    ? 'bg-blue-700 text-white'
                    : permit.status === 'PREPARED'
                    ? 'bg-amber-600 text-white'
                    : permit.status === 'DRAFT'
                    ? 'bg-slate-500 text-white'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  [{permit.status}]
                </span>
              </div>

              <div className="font-bold text-xs text-slate-900 line-clamp-1 mb-1">{permit.title}</div>

              <div className="text-[10px] font-mono text-slate-600 flex justify-between items-center">
                <span>Location: {permit.location}</span>
                <span>Leader: <strong>{permit.workLeaderName}</strong></span>
              </div>

              <div className="mt-1.5 pt-1 border-t border-slate-200 text-[10px] font-mono flex items-center justify-between">
                <span className="flex items-center gap-1">
                  LEL: <strong className={permit.gasReadings.lelPercent > 0 ? 'text-rose-700 font-bold' : 'text-emerald-800'}>{permit.gasReadings.lelPercent}%</strong> |
                  O2: <strong className={permit.gasReadings.o2Percent < 19.5 || permit.gasReadings.o2Percent > 23.5 ? 'text-rose-700 font-bold' : 'text-emerald-800'}>{permit.gasReadings.o2Percent}%</strong>
                </span>
                {!gasSafety.isSafe && (
                  <span className="text-[9px] bg-rose-100 text-rose-800 border border-rose-300 px-1 rounded font-bold animate-pulse">
                    ⚠️ Gas Hazard
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
