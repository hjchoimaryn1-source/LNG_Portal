// src/components/locations/nias/NiasPatrolLogTab.tsx
//
// PURPOSE
//   "4-HR PATROL LOG" — Phase 12 Stage 2. Relocation (not a rewrite) of the
//   Metering Train A/B + NG Buffer Tank patrol forms previously reached via
//   the standalone "LNG & NG Energy Operation" LNG-Process sidebar item
//   (LngEnergyOperationView.tsx, now removed). usePatrolSaveHandler/RBAC/
//   Daily Ops wiring is unchanged — only the host screen moved, under
//   Regas & Gas Process per HJ's 2026-09-16 scope decision (NG Buffer Tank
//   included alongside Metering Train A/B, not ISO Tank — that stays under
//   Nias Tank Yard, unchanged).
//
//   The old "Generate Daily Report" trigger is NOT relocated here — it was
//   a duplicate of DailyOpsOverviewView.tsx's ApprovalPanel, which remains
//   the single canonical entry point for report generation.

'use client';

import { useState } from 'react';
import { MeteringPatrolForm } from '../../../cmms-daily-ops/components/patrol/MeteringPatrolForm';
import { NgBufferTankPatrolForm } from '../../../cmms-daily-ops/components/patrol/NgBufferTankPatrolForm';
import { usePatrolSaveHandler } from '../../../cmms-daily-ops/hooks/usePatrolSaveHandler';
import { TITLE_BAR } from '../../cmms/scadaStyles';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function NiasPatrolLogTab() {
  const [reportDate] = useState(today);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);

  const onSaveTrainA = usePatrolSaveHandler('metering_train_a', reportDate, 'FIELD OP-1', setBlockedReason);
  const onSaveTrainB = usePatrolSaveHandler('metering_train_b', reportDate, 'FIELD OP-1', setBlockedReason);
  const onSaveNgBufferTank = usePatrolSaveHandler('ng_buffer_tank', reportDate, 'FIELD OP-1', setBlockedReason);

  return (
    <div className="p-4 space-y-4">
      <div className={TITLE_BAR}>4-HR PATROL LOG — {reportDate}</div>
      {blockedReason && (
        <div className="text-[11px] text-red-700 font-bold">{blockedReason}</div>
      )}
      <MeteringPatrolForm train="A" onSave={onSaveTrainA} />
      <MeteringPatrolForm train="B" onSave={onSaveTrainB} />
      <NgBufferTankPatrolForm onSave={onSaveNgBufferTank} />
    </div>
  );
}
