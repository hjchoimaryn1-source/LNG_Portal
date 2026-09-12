// src/components/manpower/tabs/ptw/PermitRow.tsx
"use client";

import React from 'react';
import { PTWPermit, PTWType } from '../../../../types/lng';
import {
  isGasMeasurementApplicable,
  isLotoApplicable,
  isFireWatchApplicable,
  validatePTWGasSafety,
} from '../../../../data/ptwMasterData';
import type { PermitSuspensionRow } from '../../../../adapters/db/permitSuspensionDao';

export interface PermitRowProps {
  permit: PTWPermit;
  isSelected: boolean;
  rowIndex: number;
  onSelect: (permitId: string) => void;
  // CMMS_Architecture.md §5.3 AGT timeout / shift-change suspension state for
  // this specific permit. Optional — omitted/undefined renders unchanged.
  suspension?: PermitSuspensionRow;
}

// Short activity-type label keyed by the PTWType enum (never touches the
// NP07-xx formNumber string, so it cannot drift out of sync with the SSHQE
// §4.1 mapping fix in ptwMasterData.ts — see PTW_AUDIT_REPORT_2026-09-08.md).
const TYPE_SHORT_LABEL: Record<PTWType, string> = {
  HOT_WORK: 'HOT',
  COLD_WORK: 'COLD',
  CONFINED_SPACE: 'CONF',
  ELECTRICAL: 'ELEC',
  RADIOGRAPHY: 'RAD',
  EXCAVATION: 'EXCV',
  CARGO_HANDLING: 'CRGO',
};

function getEquipmentTag(permit: PTWPermit): string {
  if (permit.equipmentTag && permit.equipmentTag !== 'N/A') return permit.equipmentTag;
  if (permit.id.endsWith('01')) return 'PRSS-CMP-01';
  if (permit.id.endsWith('02')) return 'FL-201';
  if (permit.id.endsWith('03')) return 'ORU-PIT-02';
  if (permit.id.endsWith('04')) return 'MCC-01';
  if (permit.id.endsWith('05')) return 'BAY-02-VLV';
  if (permit.id.endsWith('06')) return 'JTY-HDR-01';
  return 'EQ-TAG-01';
}

type SafeDotStatus = 'PASS' | 'FAIL' | 'NA';

// Aggregates the existing per-gate helpers into one indicator. No new safety
// rules are introduced here — this only combines results already computed by
// isGasMeasurementApplicable/isLotoApplicable/isFireWatchApplicable and the
// existing validatePTWGasSafety() gate.
function computeSafeDotStatus(permit: PTWPermit): SafeDotStatus {
  const applicableResults: boolean[] = [];

  if (isGasMeasurementApplicable(permit.type)) {
    applicableResults.push(validatePTWGasSafety(permit.type, permit.gasReadings).isSafe);
  }
  if (isLotoApplicable(permit.type)) {
    applicableResults.push(permit.safetyChecklist.lotoApplied);
  }
  if (isFireWatchApplicable(permit.type)) {
    applicableResults.push(permit.safetyChecklist.fireWatchAssigned);
  }

  if (applicableResults.length === 0) return 'NA';
  return applicableResults.every(Boolean) ? 'PASS' : 'FAIL';
}

const SAFE_DOT_CLASS: Record<SafeDotStatus, string> = {
  PASS: 'bg-emerald-600',
  FAIL: 'bg-rose-600',
  NA: 'bg-neutral-400',
};

export default function PermitRow({ permit, isSelected, rowIndex, onSelect, suspension }: PermitRowProps) {
  const equipmentTag = getEquipmentTag(permit);
  const typeLabel = TYPE_SHORT_LABEL[permit.type] || permit.type.slice(0, 4);
  const safeStatus = computeSafeDotStatus(permit);
  const suspensionTitle = suspension
    ? `SUSPENDED (${suspension.reason === 'AGT_GAS_TIMEOUT' ? 'AGT gas re-test overdue' : 'shift-change boundary crossed'} at ${suspension.suspendedAt})`
    : undefined;

  const rowBgClass = isSelected
    ? 'border-l-4 border-[#0B192C] bg-blue-50 font-semibold'
    : rowIndex % 2 === 0
    ? 'border-l-4 border-transparent bg-slate-50 hover:bg-slate-100'
    : 'border-l-4 border-transparent bg-white hover:bg-slate-100';

  return (
    <tr
      onClick={() => onSelect(permit.id)}
      className={`h-7.5 cursor-pointer border-b border-slate-300 select-none text-slate-800 ${rowBgClass}`}
    >
      <td className="w-14 text-center text-xs">
        <span className="px-1 py-0.2 font-bold border border-slate-300 bg-slate-100 text-slate-800">
          {typeLabel}
        </span>
      </td>
      <td className="w-24 font-bold text-neutral-900 px-1 text-xs truncate" title={equipmentTag}>
        {equipmentTag}
      </td>
      <td className="w-12 text-center" title={`Safety gate: ${safeStatus}`}>
        {safeStatus === 'NA' ? (
          <span className="text-neutral-400 text-xs">–</span>
        ) : (
          <span className={`inline-block w-2 h-2 rounded-full ${SAFE_DOT_CLASS[safeStatus]}`} />
        )}
      </td>
      <td className="flex-1 truncate px-1 text-xs" title={suspensionTitle ?? permit.title}>
        {suspension && (
          <span
            className="mr-1 px-1 py-0.2 font-bold bg-rose-700 text-white rounded-sm text-[10px] align-middle"
            title={suspensionTitle}
          >
            SUSPENDED
          </span>
        )}
        {permit.title}
      </td>
      <td className="w-24 truncate px-1 text-xs font-mono" title={permit.workLeaderName}>
        {permit.workLeaderName}
      </td>
    </tr>
  );
}
