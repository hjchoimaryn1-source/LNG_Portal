// src/components/manpower/cargoHandling/CargoHandlingDetailSection.tsx
"use client";

import React from 'react';
import { Anchor, CheckSquare } from 'lucide-react';
import type { CargoHandlingPermitDetails } from '../../../types/lng';
import {
  CARGO_HANDLING_AGT_MANDATORY_POINTS,
  CARGO_HANDLING_SOP_BY_ACTIVITY,
  GROUNDING_RESISTANCE_MAX_OHM,
  UNLOADING_LEL_MAX_PERCENT,
  UNLOADING_O2_MAX_PERCENT,
  UNLOADING_O2_MIN_PERCENT,
} from '../../../data/ptwCargoHandlingRules';
import { evaluateMandatorySafetyControls } from '../../../data/ptwCargoHandlingValidators';

export interface CargoHandlingDetailSectionProps {
  cargoHandling: CargoHandlingPermitDetails;
}

function isPointSafe(lelPercent: number, o2Percent: number): boolean {
  return lelPercent < UNLOADING_LEL_MAX_PERCENT && o2Percent >= UNLOADING_O2_MIN_PERCENT && o2Percent <= UNLOADING_O2_MAX_PERCENT;
}

export default function CargoHandlingDetailSection({ cargoHandling }: CargoHandlingDetailSectionProps) {
  const readingByTag = new Map(cargoHandling.gasReadingPoints.map((p) => [p.tagId, p]));
  const isGroundingSafe = cargoHandling.groundingResistanceOhm < GROUNDING_RESISTANCE_MAX_OHM;
  const sopCodes = CARGO_HANDLING_SOP_BY_ACTIVITY[cargoHandling.activityType];
  const safetyControls = evaluateMandatorySafetyControls(cargoHandling.activityType, cargoHandling);

  return (
    <div className="p-2.5 border-2 border-cyan-700 bg-cyan-50/40 rounded space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="font-bold text-xs flex items-center gap-1.5 text-slate-900">
          <Anchor className="w-4 h-4 text-cyan-800" />
          <span>Cargo Handling Extension ({cargoHandling.activityType})</span>
        </span>
        <div className="flex flex-wrap gap-1 justify-end">
          {sopCodes.map((code) => (
            <span key={code} className="px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-900 border border-cyan-300 text-[10px] font-mono font-bold">
              {code}
            </span>
          ))}
        </div>
      </div>

      {/* AGT 4-point grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-mono text-[10px]">
        {CARGO_HANDLING_AGT_MANDATORY_POINTS.map((tagId) => {
          const point = readingByTag.get(tagId);
          const safe = point ? isPointSafe(point.lelPercent, point.o2Percent) : false;
          return (
            <div key={tagId} className={`p-1.5 border rounded bg-white ${safe ? 'border-emerald-300' : 'border-red-400'}`}>
              <div className="flex justify-between items-center mb-0.5">
                <span className="font-bold text-slate-800">{tagId}</span>
                <span className={`px-1 py-0.5 rounded text-[9px] font-bold ${safe ? 'bg-emerald-800 text-white' : 'bg-red-700 text-white'}`}>
                  {safe ? 'SAFE' : 'UNSAFE'}
                </span>
              </div>
              {point ? (
                <div className="text-slate-600">
                  <div>LEL: {point.lelPercent.toFixed(1)}%</div>
                  <div>O2: {point.o2Percent.toFixed(1)}%</div>
                </div>
              ) : (
                <div className="text-red-700">No Reading</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Grounding resistance */}
      <div className="flex items-center justify-between p-1.5 bg-white border border-slate-300 rounded text-[11px] font-mono">
        <span className="font-bold text-slate-800">Grounding Resistance:</span>
        <span className="flex items-center gap-1.5">
          <span className={isGroundingSafe ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold'}>
            {cargoHandling.groundingResistanceOhm.toFixed(1)} Ω
          </span>
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isGroundingSafe ? 'bg-emerald-800 text-white' : 'bg-red-700 text-white'}`}>
            {isGroundingSafe ? `< ${GROUNDING_RESISTANCE_MAX_OHM}Ω OK` : `>= ${GROUNDING_RESISTANCE_MAX_OHM}Ω FAIL`}
          </span>
        </span>
      </div>

      {/* Mandatory Safety Controls + LOTO */}
      <div className="p-1.5 border border-slate-300 bg-white rounded text-[11px]">
        <div className="font-bold text-slate-800 mb-1 font-mono">Mandatory Safety Controls / LOTO:</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 font-mono text-[10px]">
          <div className={`p-1 rounded border flex items-center gap-1 ${cargoHandling.fireWatchAssigned ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-bold' : 'bg-slate-100 text-slate-500'}`}>
            <CheckSquare className="w-3 h-3" /> Fire Watch
          </div>
          <div className={`p-1 rounded border flex items-center gap-1 ${safetyControls.allSatisfied ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-bold' : 'bg-slate-100 text-slate-500'}`}>
            <CheckSquare className="w-3 h-3" /> Barricade ({cargoHandling.barricadeRadiusM}m)
          </div>
          <div className={`p-1 rounded border flex items-center gap-1 ${cargoHandling.ertStandbyReady ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-bold' : 'bg-slate-100 text-slate-500'}`}>
            <CheckSquare className="w-3 h-3" /> ERT Standby
          </div>
          <div className={`p-1 rounded border flex items-center gap-1 ${cargoHandling.allLotoLocksRemoved ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-bold' : 'bg-slate-100 text-slate-500'}`}>
            <CheckSquare className="w-3 h-3" /> LOTO Locks Removed
          </div>
        </div>
        {!safetyControls.allSatisfied && (
          <div className="mt-1 text-[10px] text-red-700">{safetyControls.missingItems.join('; ')}</div>
        )}
      </div>
    </div>
  );
}
