// src/components/manpower/tabs/ptw/PTWStatusActions.tsx
"use client";

import React from 'react';
import { CheckCircle2, Flame } from 'lucide-react';
import { PTWPermit } from '../../../../types/lng';

export interface PTWStatusActionsProps {
  activePermit: PTWPermit;
  isERTMet: boolean;
  isGasSafe: boolean;
  gasBlockReason: string | null;
  onTransitionStatus: (permitId: string, nextStatus: PTWPermit['status']) => void;
}

export default function PTWStatusActions({ activePermit, isERTMet, isGasSafe, gasBlockReason, onTransitionStatus }: PTWStatusActionsProps) {
  const isHighRisk = activePermit.type === 'HOT_WORK' || activePermit.type === 'CONFINED_SPACE';
  const activationBlocked = !isGasSafe || (isHighRisk && !isERTMet);

  return (
    <div className="flex justify-between items-center pt-2 border-t border-slate-300 flex-wrap gap-2">
      <div className="text-[11px] font-mono text-slate-500">
        PTW ID: <strong>{activePermit.id}</strong> | Form: <strong>{activePermit.formNumber}</strong>
      </div>

      <div className="flex gap-2 flex-wrap">
        {/* Step 1: Draft -> Prepared */}
        {activePermit.status === 'DRAFT' && (
          <button
            onClick={() => onTransitionStatus(activePermit.id, 'PREPARED')}
            className="win-btn px-4 py-1 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
          >
            <span>1. Prepare & Submit to HSE ➔</span>
          </button>
        )}

        {/* Step 2: Prepared -> Approved */}
        {activePermit.status === 'PREPARED' && (
          <button
            onClick={() => onTransitionStatus(activePermit.id, 'APPROVED')}
            className="win-btn px-4 py-1 text-xs font-bold bg-blue-900 hover:bg-blue-950 text-white cursor-pointer flex items-center gap-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>2. Site Manager / HSE Approve ➔</span>
          </button>
        )}

        {/* Step 3: Approved -> Active (Strict Hot Work LEL 0% & Confined O2 check) */}
        {activePermit.status === 'APPROVED' && (
          <button
            disabled={activationBlocked}
            onClick={() => onTransitionStatus(activePermit.id, 'ACTIVE')}
            className={`win-btn px-4 py-1 text-xs font-bold flex items-center gap-1.5 ${
              activationBlocked
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed border-slate-400'
                : 'bg-emerald-800 hover:bg-emerald-900 text-white cursor-pointer shadow'
            }`}
            title={!isGasSafe ? gasBlockReason || 'Gas reading unsafe' : 'Issue permit and begin work'}
          >
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            <span>3. Issue & Authorize Active Work ➔</span>
          </button>
        )}

        {/* Step 4: Active -> Closed */}
        {activePermit.status === 'ACTIVE' && (
          <button
            onClick={() => onTransitionStatus(activePermit.id, 'CLOSED')}
            className="win-btn px-4 py-1 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white cursor-pointer"
          >
            <span>4. Close & Surrender Permit (Work Completed)</span>
          </button>
        )}

        {activePermit.status === 'CLOSED' && (
          <span className="px-3 py-1 bg-slate-200 text-slate-600 font-mono text-xs font-bold rounded border border-slate-300">
            ✓ PERMIT CLOSED & ARCHIVED
          </span>
        )}
      </div>
    </div>
  );
}
