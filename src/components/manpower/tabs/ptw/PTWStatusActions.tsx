// src/components/manpower/tabs/ptw/PTWStatusActions.tsx
"use client";

import React from 'react';
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
    <div className="flex justify-between items-center pt-2 border-t border-neutral-300 flex-wrap gap-2 font-mono">
      <div className="text-[11px] font-mono text-slate-600">
        PTW ID: <strong>{activePermit.id}</strong> | TYPE: <strong>{activePermit.type.replace(/_/g, ' ')}</strong>
      </div>

      <div className="flex gap-2 flex-wrap">
        {/* Step 1: Draft -> Prepared */}
        {activePermit.status === 'DRAFT' && (
          <button
            onClick={() => onTransitionStatus(activePermit.id, 'PREPARED')}
            className="win-btn px-3 py-1 text-xs font-bold text-black bg-[#d4d0c8] hover:bg-[#dfdbd3] cursor-pointer rounded-none"
          >
            <span>[1. PREPARE & SUBMIT TO HSE]</span>
          </button>
        )}

        {/* Step 2: Prepared -> Approved */}
        {activePermit.status === 'PREPARED' && (
          <button
            onClick={() => onTransitionStatus(activePermit.id, 'APPROVED')}
            className="win-btn px-3 py-1 text-xs font-bold text-black bg-[#d4d0c8] hover:bg-[#dfdbd3] cursor-pointer rounded-none"
          >
            <span>[2. HSE / SM APPROVE]</span>
          </button>
        )}

        {/* Step 3: Approved -> Active */}
        {activePermit.status === 'APPROVED' && (
          <button
            disabled={activationBlocked}
            onClick={() => onTransitionStatus(activePermit.id, 'ACTIVE')}
            className={`win-btn px-3 py-1 text-xs font-bold rounded-none ${
              activationBlocked
                ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed border-neutral-400'
                : 'text-black bg-[#d4d0c8] hover:bg-[#dfdbd3] cursor-pointer'
            }`}
            title={!isGasSafe ? gasBlockReason || 'Gas reading unsafe' : 'Issue permit and begin work'}
          >
            <span>[3. AUTHORIZE ACTIVE WORK]</span>
          </button>
        )}

        {/* Step 4: Active -> Closed */}
        {activePermit.status === 'ACTIVE' && (
          <button
            onClick={() => onTransitionStatus(activePermit.id, 'CLOSED')}
            className="win-btn px-3 py-1 text-xs font-bold text-black bg-[#d4d0c8] hover:bg-[#dfdbd3] cursor-pointer rounded-none"
          >
            <span>[4. CLOSE PERMIT (COMPLETE)]</span>
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
