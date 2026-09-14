// src/cmms-daily-ops/print/DailyReportPrintView.tsx
//
// PURPOSE
//   FORM-NP-08-33-N 인쇄 뷰 — reportDate 하나로 스냅샷(C1) + critical
//   events/safety notes/signatures(C2)를 조회해 P1~P5로 렌더링한다.
//   A4 세로, 페이지당 강제 개행(printStyles.ts)만 쓰는 순수 HTML/CSS다.
//
//   CRITICAL CONSTRAINT: 이 폴더(src/cmms-daily-ops/print/*)는
//   src/cmms-daily-ops/pid/*를 임포트하지 않는다 — Live P&ID Overlay는
//   PDF 출력에서 제외한다는 HJ 요구사항을 임포트 그래프로 강제한다.
//
//   각 API 라우트는 dailyOpsDbSingleton 계열이 node:sqlite를 간접
//   임포트해 'use client' 컴포넌트에서 직접 쓸 수 없는 client/server
//   경계 때문에 존재한다(다른 daily-ops 라우트들과 동일한 이유).

'use client';

import { useEffect, useState } from 'react';
import type { DailyReportSnapshotPayload } from '../dao/dailyReportSnapshotDao';
import type { CriticalEvent, SafetyNotes, Signature } from '../dao/dailyReportChildDao';
import { PRINT_STYLES } from './printStyles';
import { PrintPage1 } from './PrintPage1';
import { PrintPage2 } from './PrintPage2';
import { PrintPage3 } from './PrintPage3';
import { PrintPage4 } from './PrintPage4';
import { PrintPage5 } from './PrintPage5';

const SNAPSHOTS_API = '/api/v1/cmms/daily-report-snapshots';
const CRITICAL_EVENTS_API = '/api/v1/cmms/daily-report-critical-events';
const SAFETY_NOTES_API = '/api/v1/cmms/daily-report-safety-notes';
const SIGNATURES_API = '/api/v1/cmms/daily-report-signatures';

export interface DailyReportPrintViewProps {
  reportDate: string;
}

interface LoadedReport {
  snapshotId: number;
  payload: DailyReportSnapshotPayload;
  criticalEvents: CriticalEvent[];
  safetyNotes: SafetyNotes | undefined;
  signatures: Signature[];
}

export function DailyReportPrintView({ reportDate }: DailyReportPrintViewProps) {
  const [report, setReport] = useState<LoadedReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const snapRes = await fetch(`${SNAPSHOTS_API}?reportDate=${reportDate}`, { cache: 'no-store' });
      const snapJson = await snapRes.json();
      if (!snapJson.success || !snapJson.snapshot) {
        if (!cancelled) setError(`No snapshot found for ${reportDate}. Generate the report first.`);
        return;
      }
      const snapshotId = snapJson.snapshot.id as number;

      const [eventsRes, notesRes, signaturesRes] = await Promise.all([
        fetch(`${CRITICAL_EVENTS_API}?snapshotId=${snapshotId}`, { cache: 'no-store' }),
        fetch(`${SAFETY_NOTES_API}?snapshotId=${snapshotId}`, { cache: 'no-store' }),
        fetch(`${SIGNATURES_API}?snapshotId=${snapshotId}`, { cache: 'no-store' }),
      ]);
      const [eventsJson, notesJson, signaturesJson] = await Promise.all([
        eventsRes.json(),
        notesRes.json(),
        signaturesRes.json(),
      ]);

      if (!cancelled) {
        setReport({
          snapshotId,
          payload: snapJson.snapshot.payload as DailyReportSnapshotPayload,
          criticalEvents: eventsJson.success ? eventsJson.records : [],
          safetyNotes: notesJson.success ? (notesJson.record ?? undefined) : undefined,
          signatures: signaturesJson.success ? signaturesJson.records : [],
        });
      }
    }

    load().catch((err) => {
      if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load daily report.');
    });

    return () => {
      cancelled = true;
    };
  }, [reportDate]);

  if (error) {
    return <div className="print-gap-notice">{error}</div>;
  }
  if (!report) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <style>{PRINT_STYLES}</style>
      <PrintPage1 payload={report.payload} />
      <PrintPage2 payload={report.payload} />
      <PrintPage3 payload={report.payload} />
      <PrintPage4 payload={report.payload} />
      <PrintPage5
        criticalEvents={report.criticalEvents}
        safetyNotes={report.safetyNotes}
        signatures={report.signatures}
      />
    </div>
  );
}
