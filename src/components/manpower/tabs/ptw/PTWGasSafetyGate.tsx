// src/components/manpower/tabs/ptw/PTWGasSafetyGate.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { GasTestLogEntryInput, PTWPermit, StaffPersonnel } from '../../../../types/lng';
import { PTW_SOP_FORMS, isGasMeasurementApplicable } from '../../../../data/ptwMasterData';
import { O2_MIN_PERCENT, O2_MAX_PERCENT, H2S_MAX_PPM } from '../../../../data/ptwGasSafetyRules';
import { MissingAgtSignatureError, toGasTestRecordDraft } from '../../../../adapters/ptwFormAdapter';
import type { GasTestRecordDraft } from '../../../../adapters/ptwFormAdapter';
import GasRetestEntryModal from './GasRetestEntryModal';

const GAS_TESTS_API_URL = '/api/v1/cmms/gas-tests';

export interface PTWGasSafetyGateProps {
  activePermit: PTWPermit;
  personnelList: StaffPersonnel[];
  isSafe: boolean;
  blockReason: string | null;
  onUpdateGasReadings: (permitId: string, lel: number, o2: number) => void;
  onAddGasTestLogEntry: (permitId: string, entryInput: GasTestLogEntryInput) => void;
}

function formatGasValue(value: number, unit: string): string {
  return Number.isFinite(value) ? `${value.toFixed(1)}${unit}` : 'NOT TESTED';
}

export default function PTWGasSafetyGate({
  activePermit,
  personnelList,
  isSafe,
  blockReason,
  onAddGasTestLogEntry,
}: PTWGasSafetyGateProps) {
  const [isRetestModalOpen, setIsRetestModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const isCargoHandling = activePermit.type === 'CARGO_HANDLING';
  const headerText = isCargoHandling
    ? 'AUTHORIZED GAS TESTER (AGT) VERIFICATION RECORD - NP08-15'
    : 'AUTHORIZED GAS TESTER (AGT) VERIFICATION RECORD';

  const applicable = isGasMeasurementApplicable(activePermit.type);
  const gateLabel = !applicable ? 'N/A' : isSafe ? 'ATMOSPHERE SAFE' : 'GATE FAILED';
  const gateLabelClass = !applicable
    ? 'text-slate-500'
    : isSafe
    ? 'text-emerald-700 font-bold'
    : 'text-red-700 font-bold';

  const tester = personnelList.find((s) => s.id === activePermit.agtStaffId);
  const testerLabel = activePermit.agtStaffId ? tester?.name || activePermit.agtStaffId : 'NOT ASSIGNED';

  const { lelPercent, o2Percent, h2sPpm, testedAt } = activePermit.gasReadings;
  const lelLimit = PTW_SOP_FORMS[activePermit.type].gasRestrictions.maxLelPercent;
  const canRetest = activePermit.status === 'ACTIVE' && applicable && !isCargoHandling;
  const history = [...(activePermit.gasTestHistory || [])].reverse();
  const [cmmsShadowRecords, setCmmsShadowRecords] = useState<GasTestRecordDraft[]>([]);

  const fetchShadowRecords = useCallback(async () => {
    try {
      const res = await fetch(`${GAS_TESTS_API_URL}?permitId=${encodeURIComponent(activePermit.id)}`);
      const data = await res.json();
      if (data.success) setCmmsShadowRecords(data.records);
    } catch (err) {
      console.error('[PTWGasSafetyGate] failed to fetch gas test audit records:', err);
    }
  }, [activePermit.id]);

  useEffect(() => {
    fetchShadowRecords();
  }, [fetchShadowRecords]);

  // Legacy screen has no dedicated signature-capture UI, so the typed
  // TESTER NAME(+ID) from GasRetestEntryModal is treated as the AGT's legacy
  // e-signature for the ptwFormAdapter DTO. Validation/conversion runs
  // alongside the existing legacy write path, not in place of it.
  const handleAddGasTestLogEntry = async (permitId: string, entryInput: GasTestLogEntryInput) => {
    let draft: GasTestRecordDraft;
    try {
      draft = toGasTestRecordDraft(permitId, activePermit.type, {
        testType: 'RETEST',
        lelPercent: entryInput.lelPercent,
        o2Percent: entryInput.o2Percent,
        h2sPpm: entryInput.h2sPpm,
        testedByAgt: entryInput.testerName,
        agtSignature: entryInput.testerId ? `${entryInput.testerName} (${entryInput.testerId})` : entryInput.testerName,
        testedAt: entryInput.testedAt,
      });
    } catch (err) {
      if (err instanceof MissingAgtSignatureError) {
        alert(err.message);
        return;
      }
      throw err;
    }

    // Gate 판정(validatePTWGasSafety)은 client-side SSOT로 이미 반영되었으므로
    // permit 상태는 API 응답을 기다리지 않고 즉시 갱신한다 (반응성 보장).
    onAddGasTestLogEntry(permitId, entryInput);

    // 감사 기록 영속화 — POST /api/v1/cmms/gas-tests. 실패해도 게이트 판정에는
    // 영향을 주지 않는다 (판정은 위에서 이미 client-side로 확정됨).
    try {
      const res = await fetch(GAS_TESTS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchShadowRecords();
    } catch (err) {
      console.error('[PTWGasSafetyGate] gas test audit record persistence failed:', err);
    }
  };

  const metrics = [
    {
      key: 'LEL',
      value: lelPercent,
      unit: '%',
      limitText: lelLimit !== undefined ? `<= ${lelLimit}%` : 'N/A',
      pass: lelLimit === undefined || lelPercent <= lelLimit,
    },
    {
      key: 'O2',
      value: o2Percent,
      unit: '%',
      limitText: `${O2_MIN_PERCENT}% ~ ${O2_MAX_PERCENT}%`,
      pass: o2Percent >= O2_MIN_PERCENT && o2Percent <= O2_MAX_PERCENT,
    },
    {
      key: 'H2S',
      value: h2sPpm,
      unit: 'ppm',
      limitText: `< ${H2S_MAX_PPM}ppm`,
      pass: h2sPpm < H2S_MAX_PPM,
    },
  ];

  return (
    <div className="border border-neutral-300 bg-white rounded-none font-mono">
      <div className="bg-[#2A3B4C] text-white font-mono text-sm font-bold text-center py-1">
        {headerText}
      </div>

      <div className="bg-neutral-200 border-b border-neutral-300 px-2 py-1 flex justify-between items-center gap-2 text-[11px] font-mono flex-wrap">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsHistoryOpen((v) => !v)}
            className="cursor-pointer hover:underline decoration-dotted"
            title="Click to view re-test history"
          >
            TEST TIME: <strong className="text-slate-900">{testedAt || '—'}</strong>
          </button>

          {isHistoryOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsHistoryOpen(false)} />
              <div className="absolute left-0 top-full mt-1 w-72 max-h-48 overflow-y-auto bg-white border border-neutral-400 shadow-lg z-50 font-mono text-[10px]">
                <div className="bg-[#2A3B4C] text-white font-bold px-2 py-1 sticky top-0">GAS RE-TEST HISTORY</div>
                {history.length === 0 ? (
                  <div className="p-2 text-neutral-500 text-center">No re-test entries yet.</div>
                ) : (
                  history.map((entry) => (
                    <div key={entry.id} className="px-2 py-1 border-b border-neutral-200 text-neutral-800">
                      <div className="flex justify-between font-bold">
                        <span>{entry.testedAt}</span>
                        <span className={entry.isSafeForWork ? 'text-emerald-700' : 'text-red-700'}>
                          [{entry.isSafeForWork ? 'PASS' : 'FAIL'}]
                        </span>
                      </div>
                      <div>TESTER: {entry.testerName}{entry.testerId ? ` (${entry.testerId})` : ''}</div>
                      <div>LEL {entry.lelPercent}% / O2 {entry.o2Percent}% / H2S {entry.h2sPpm}ppm</div>
                      {entry.note && <div className="text-neutral-500">NOTE: {entry.note}</div>}
                    </div>
                  ))
                )}
                <div className="px-2 py-1 bg-neutral-100 text-neutral-500 text-[9px] border-t border-neutral-200">
                  CMMS shadow records: {cmmsShadowRecords.length}
                </div>
              </div>
            </>
          )}
        </div>

        <span>TESTER: <strong className="text-slate-900">{testerLabel}</strong></span>
        <span className={gateLabelClass}>[{gateLabel}]</span>

        {canRetest && (
          <button
            type="button"
            onClick={() => setIsRetestModalOpen(true)}
            className="px-2 py-0.5 bg-[#2A3B4C] hover:bg-[#354c62] text-white font-bold text-[10px] cursor-pointer"
          >
            [RE-TEST GAS READING]
          </button>
        )}
      </div>

      <GasRetestEntryModal
        isOpen={isRetestModalOpen}
        onClose={() => setIsRetestModalOpen(false)}
        activePermit={activePermit}
        onSubmit={handleAddGasTestLogEntry}
      />

      {applicable && !isSafe && blockReason && (
        <div className="p-1.5 bg-red-900 text-white text-[10px] font-bold border-b border-red-950">
          ALARM: {blockReason}
        </div>
      )}

      {!applicable ? (
        <div className="bg-neutral-100 border-t border-neutral-300 text-neutral-600 font-mono text-xs p-3 text-center">
          AGT: N/A — gas testing not applicable to this work category
        </div>
      ) : (
        <div className="bg-neutral-200 p-2 border-t border-neutral-300 grid grid-cols-3 gap-2 font-mono text-xs">
          {metrics.map((m) => (
            <div
              key={m.key}
              className="bg-neutral-100 border border-neutral-400 text-neutral-900 font-mono text-xs p-2 text-center shadow-sm"
            >
              <div className="text-[10px] text-neutral-600 font-bold tracking-wider">{m.key}</div>
              <div className="text-lg font-bold font-mono tracking-wider mt-0.5 text-neutral-900">
                {formatGasValue(m.value, m.unit)}
              </div>
              <div className="text-[9px] text-neutral-500 font-bold mt-1">LIMIT: {m.limitText}</div>
              <div className={`text-[10px] font-bold mt-0.5 ${m.pass ? 'text-emerald-700' : 'text-red-700'}`}>
                [{m.pass ? 'PASS' : 'FAIL'}]
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
