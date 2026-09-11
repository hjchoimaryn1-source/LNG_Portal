// src/components/manpower/tabs/ptw/PTWStatusActions.tsx
"use client";

import React from 'react';
import { PTWPermit } from '../../../../types/lng';
import { PTW_SIGNATURE_ROLE_LABELS } from '../../../../data/ptwSignatureRoles';
import { evaluateSignatureGate } from '../../../../adapters/ptwSignatureGate';
import { validatePtwSelfApproval } from '../../../../lib/rbac/ptwSelfApproval';
import { getCurrentApproverId } from '../../../../lib/rbac/devAuthIdentity';

export interface PTWStatusActionsProps {
  activePermit: PTWPermit;
  isERTMet: boolean;
  isGasSafe: boolean;
  gasBlockReason: string | null;
  onTransitionStatus: (permitId: string, nextStatus: PTWPermit['status']) => void;
}

function missingSignaturesTitle(activePermit: PTWPermit, targetStatus: PTWPermit['status']): string | null {
  const gate = evaluateSignatureGate(activePermit, targetStatus);
  if (gate.allowed) return null;
  return `Missing signatures:\n - ${gate.missingRoles.map((r) => PTW_SIGNATURE_ROLE_LABELS[r]).join('\n - ')}`;
}

export default function PTWStatusActions({ activePermit, isERTMet, isGasSafe, gasBlockReason, onTransitionStatus }: PTWStatusActionsProps) {
  const isHighRisk = activePermit.type === 'HOT_WORK' || activePermit.type === 'CONFINED_SPACE';
  const approveMissingSigTitle = missingSignaturesTitle(activePermit, 'APPROVED');
  const closeMissingSigTitle = missingSignaturesTitle(activePermit, 'CLOSED');
  const activateMissingSigTitle = missingSignaturesTitle(activePermit, 'ACTIVE');
  const activationBlocked = !isGasSafe || (isHighRisk && !isERTMet) || !!activateMissingSigTitle;

  const handleApprove = () => {
    const selfApprovalCheck = validatePtwSelfApproval(activePermit, getCurrentApproverId());
    if (!selfApprovalCheck.allowed) {
      alert(`⚠️ [APPROVAL BLOCKED]\n${selfApprovalCheck.reason}`);
      return;
    }
    onTransitionStatus(activePermit.id, 'APPROVED');
  };

  return (
    <div className="border border-neutral-300 bg-white rounded-none overflow-hidden font-mono space-y-2">
      <div className="bg-[#2A3B4C] text-white font-mono text-sm font-bold text-center py-1 px-2 border border-[#2A3B4C] rounded-none">
        WORKFLOW STATUS & TRANSITION CONTROLS
      </div>
      <div className="bg-[#ebe7df] border border-neutral-300 px-2 py-1.5 flex justify-between items-center flex-wrap gap-2 rounded-none">
        <div className="text-[11px] font-mono text-slate-600">
          PTW ID: <strong className="text-blue-950">{activePermit.id}</strong> | TYPE: <strong className="text-slate-900">{activePermit.type.replace(/_/g, ' ')}</strong>
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Step 1: Draft -> Prepared */}
          {activePermit.status === 'DRAFT' && (
            <button
              onClick={() => onTransitionStatus(activePermit.id, 'PREPARED')}
              className="px-3 py-1 text-xs font-bold text-black bg-[#d4d0c8] hover:bg-[#dfdbd3] cursor-pointer rounded-none border border-neutral-400 shadow-[0_1px_2px_rgba(0,0,0,0.15)]"
            >
              <span>[1. PREPARE & SUBMIT TO HSE]</span>
            </button>
          )}

          {/* Step 2: Prepared -> Approved */}
          {activePermit.status === 'PREPARED' && (
            <button
              disabled={!!approveMissingSigTitle}
              onClick={handleApprove}
              className={`px-3 py-1 text-xs font-bold rounded-none border ${
                approveMissingSigTitle
                  ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed border-neutral-300'
                  : 'text-black bg-[#d4d0c8] hover:bg-[#dfdbd3] cursor-pointer border-neutral-400 shadow-[0_1px_2px_rgba(0,0,0,0.15)]'
              }`}
              title={approveMissingSigTitle || 'Approve and issue permit'}
            >
              <span>[2. HSE / SM APPROVE]</span>
            </button>
          )}

          {/* Step 3: Approved -> Active */}
          {activePermit.status === 'APPROVED' && (
            <button
              disabled={activationBlocked}
              onClick={() => onTransitionStatus(activePermit.id, 'ACTIVE')}
              className={`px-3 py-1 text-xs font-bold rounded-none border ${
                activationBlocked
                  ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed border-neutral-300'
                  : 'text-black bg-[#d4d0c8] hover:bg-[#dfdbd3] cursor-pointer border-neutral-400 shadow-[0_1px_2px_rgba(0,0,0,0.15)]'
              }`}
              title={!isGasSafe ? gasBlockReason || 'Gas reading unsafe' : activateMissingSigTitle || 'Issue permit and begin work'}
            >
              <span>[3. AUTHORIZE ACTIVE WORK]</span>
            </button>
          )}

          {/* Step 4: Active -> Closed */}
          {activePermit.status === 'ACTIVE' && (
            <button
              disabled={!!closeMissingSigTitle}
              onClick={() => onTransitionStatus(activePermit.id, 'CLOSED')}
              className={`px-3 py-1 text-xs font-bold rounded-none border ${
                closeMissingSigTitle
                  ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed border-neutral-300'
                  : 'text-black bg-[#d4d0c8] hover:bg-[#dfdbd3] cursor-pointer border-neutral-400 shadow-[0_1px_2px_rgba(0,0,0,0.15)]'
              }`}
              title={closeMissingSigTitle || 'Return and close permit'}
            >
              <span>[4. CLOSE PERMIT (COMPLETE)]</span>
            </button>
          )}

          {activePermit.status === 'CLOSED' && (
            <span className="px-3 py-1 bg-slate-200 text-slate-600 font-mono text-xs font-bold rounded-none border border-slate-300">
              [PERMIT CLOSED & ARCHIVED]
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
