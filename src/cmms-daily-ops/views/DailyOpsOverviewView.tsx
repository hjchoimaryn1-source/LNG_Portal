// src/cmms-daily-ops/views/DailyOpsOverviewView.tsx
//
// PURPOSE
//   Phase 12 Pre-Flight III — "Daily Ops Overview" 탭 진입점(5번째
//   DAILY_OPS_* 항목, Stage C4의 4개 탭 뒤에 추가). 순수 레이아웃 계층:
//   날짜 선택 + useDailyReportApproval(상태 계층) + 하위 컴포넌트 조립만
//   담당한다.
//
//   Stage C2에서 만들어졌지만 지금까지 어떤 뷰에도 연결되지 않았던
//   CriticalEventsEditor/SafetyNotesEditor/SignatureBlock을 여기서 처음
//   조립한다 — 이 셋은 무수정 재사용.

'use client';

import { useState } from 'react';
import { RAISED_PANEL, SUNKEN_INPUT } from '../../components/cmms/scadaStyles';
import { useDailyReportApproval } from '../hooks/useDailyReportApproval';
import { ApprovalPanel } from '../components/report/ApprovalPanel';
import { CriticalEventsEditor } from '../components/report/CriticalEventsEditor';
import { SafetyNotesEditor } from '../components/report/SafetyNotesEditor';
import { SignatureBlock } from '../components/report/SignatureBlock';
import { DailyReportPrintView } from '../print/DailyReportPrintView';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DailyOpsOverviewView() {
  const [reportDate, setReportDate] = useState(today);
  const [showPrintView, setShowPrintView] = useState(false);
  const { snapshot, loading, message, canApprove, generate, approve } = useDailyReportApproval(reportDate);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-black uppercase text-slate-800">Daily Ops Overview — FORM-NP-08-33-N</h2>
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold text-slate-600 uppercase">Report Date</label>
          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className={SUNKEN_INPUT}
          />
        </div>
      </div>

      <ApprovalPanel
        reportDate={reportDate}
        snapshot={snapshot}
        loading={loading}
        message={message}
        canApprove={canApprove}
        onGenerate={generate}
        onApprove={approve}
      />

      {snapshot && (
        <>
          <CriticalEventsEditor snapshotId={snapshot.id} />
          <SafetyNotesEditor snapshotId={snapshot.id} />

          <div className={`${RAISED_PANEL} p-3 grid grid-cols-1 sm:grid-cols-2 gap-2`}>
            <SignatureBlock snapshotId={snapshot.id} role="prepared_by" />
            <SignatureBlock snapshotId={snapshot.id} role="acknowledged_by" />
          </div>

          <button
            type="button"
            onClick={() => setShowPrintView((v) => !v)}
            className="text-[11px] font-mono text-blue-800 underline"
          >
            {showPrintView ? 'Hide' : 'Show'} FORM-NP-08-33-N Print Preview
          </button>
          {showPrintView && <DailyReportPrintView reportDate={reportDate} />}
        </>
      )}
    </div>
  );
}
