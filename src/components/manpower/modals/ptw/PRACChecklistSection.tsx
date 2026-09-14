// src/components/manpower/modals/ptw/PRACChecklistSection.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export interface PRACItem {
  id: string;
  hazardName: string;
  identified: boolean;
  mitigationDetail: string;
  isAlarp: boolean;
}

const DEFAULT_PRAC_ITEMS: PRACItem[] = [
  {
    id: 'prac-1',
    hazardName: 'Flammable Gas / Explosive Atmosphere (LEL Risk)',
    identified: false,
    mitigationDetail: '',
    isAlarp: true,
  },
  {
    id: 'prac-2',
    hazardName: 'Toxic Vapor / Asphyxiating Atmosphere (H2S / O2 Risk)',
    identified: false,
    mitigationDetail: '',
    isAlarp: true,
  },
  {
    id: 'prac-3',
    hazardName: 'Pressurized Pipe / Stored Energy Release',
    identified: false,
    mitigationDetail: '',
    isAlarp: true,
  },
  {
    id: 'prac-4',
    hazardName: 'Electrical Shock / Arc Flash / Stored Electrical Energy',
    identified: false,
    mitigationDetail: '',
    isAlarp: true,
  },
  {
    id: 'prac-5',
    hazardName: 'Working at Height / Dropped Objects (>1.8m elevation)',
    identified: false,
    mitigationDetail: '',
    isAlarp: true,
  },
  {
    id: 'prac-6',
    hazardName: 'Hot Surface / Mechanical Sparks / Open Flame Ignition',
    identified: false,
    mitigationDetail: '',
    isAlarp: true,
  },
];

export interface PRACChecklistSectionProps {
  /** Fires whenever the Stage-1 ALARP outcome changes (CMMS_Architecture.md §2.2). Optional — omit for unchanged standalone behavior. */
  onAlarpStatusChange?: (hasNonAlarpRisk: boolean) => void;
  /** Fires as the user types a Stage-2/3 JSA document reference. Optional. */
  onJsaAttachmentChange?: (ref: string) => void;
}

export default function PRACChecklistSection({ onAlarpStatusChange, onJsaAttachmentChange }: PRACChecklistSectionProps = {}) {
  const [pracItems, setPracItems] = useState<PRACItem[]>(DEFAULT_PRAC_ITEMS);
  const [jsaRef, setJsaRef] = useState('');

  const updateItem = (id: string, patch: Partial<PRACItem>) => {
    setPracItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const hasNonAlarpRisk = pracItems.some((item) => item.identified && !item.isAlarp);

  useEffect(() => {
    onAlarpStatusChange?.(hasNonAlarpRisk);
    // onAlarpStatusChange is expected to be a stable callback (useCallback/inline
    // setter) from the parent — only re-fire when the computed flag itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasNonAlarpRisk]);

  return (
    <div className="space-y-3 bg-slate-50 p-4 sm:p-5 rounded-lg border border-slate-200">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            Preliminary Risk Assessment Checklist (PRAC — NIAS NP-09 §NP09-01)
          </h4>
          <p className="text-xs text-slate-500">
            Stage 1 Originator assessment: Identify task hazards, record control details, and verify residual risk ALARP status.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded border border-slate-300 bg-white">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
            <tr>
              <th className="py-2.5 px-3 w-1/4">Hazard Description</th>
              <th className="py-2.5 px-3 w-1/5 text-center">Col 1: Hazard Identified?</th>
              <th className="py-2.5 px-3 w-2/5">Col 2: Mitigation / Control Detail</th>
              <th className="py-2.5 px-3 w-1/5 text-center">Col 3: Residual Risk ALARP?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {pracItems.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-2.5 px-3 font-medium text-slate-800">
                  {item.hazardName}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <div className="inline-flex items-center gap-2">
                    <label className="inline-flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name={`identified-${item.id}`}
                        checked={item.identified}
                        onChange={() => updateItem(item.id, { identified: true })}
                        className="cursor-pointer"
                      />
                      <span>Yes</span>
                    </label>
                    <label className="inline-flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name={`identified-${item.id}`}
                        checked={!item.identified}
                        onChange={() => updateItem(item.id, { identified: false, isAlarp: true })}
                        className="cursor-pointer"
                      />
                      <span>No</span>
                    </label>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  {item.identified ? (
                    <input
                      type="text"
                      value={item.mitigationDetail}
                      onChange={(e) => updateItem(item.id, { mitigationDetail: e.target.value })}
                      placeholder="Specify mitigation / refer to attached JSA..."
                      className="w-full h-8 px-2.5 text-xs border border-slate-300 rounded bg-white"
                    />
                  ) : (
                    <span className="text-slate-400 italic">N/A — No hazard identified</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-center">
                  {item.identified ? (
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-2">
                        <label className="inline-flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name={`alarp-${item.id}`}
                            checked={item.isAlarp}
                            onChange={() => updateItem(item.id, { isAlarp: true })}
                            className="cursor-pointer"
                          />
                          <span className="text-emerald-700 font-bold">Yes</span>
                        </label>
                        <label className="inline-flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name={`alarp-${item.id}`}
                            checked={!item.isAlarp}
                            onChange={() => updateItem(item.id, { isAlarp: false })}
                            className="cursor-pointer"
                          />
                          <span className="text-rose-700 font-bold">No</span>
                        </label>
                      </div>
                      {!item.isAlarp && (
                        <div className="text-[10px] text-rose-600 font-bold">
                          Further RA Required
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasNonAlarpRisk && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-300 rounded-md text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Further Risk Assessment Required: </span>
            One or more identified hazards have residual risk evaluated as NOT ALARP. In accordance with NIAS NP-09 §NP09-01, a formal Job Safety Analysis (JSA) or Stage-2 assessment must be completed prior to permit authorization.
            <div className="mt-2">
              <label className="block font-bold mb-1">JSA Document Reference (required before Stage 3 approval):</label>
              <input
                type="text"
                value={jsaRef}
                onChange={(e) => {
                  setJsaRef(e.target.value);
                  onJsaAttachmentChange?.(e.target.value);
                }}
                placeholder="e.g. JSA-2026-0912-01"
                className="w-full text-xs px-2 py-1 border border-amber-400 rounded bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
