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

import { useEffect, useMemo, useState } from 'react';
import type { DailyReportSnapshotPayload } from '../dao/dailyReportSnapshotDao';
import type { CriticalEvent, SafetyNotes, Signature } from '../dao/dailyReportChildDao';
import { PRINT_STYLES } from './printStyles';
import { PrintPage1 } from './PrintPage1';
import { PrintPage2 } from './PrintPage2';
import { PrintPage3 } from './PrintPage3';
import { PrintPage4 } from './PrintPage4';
import { PrintPage5 } from './PrintPage5';
import { useIsoTankPrintBridge } from '../hooks/useIsoTankPrintBridge';

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
  const { isoTankCargo, isoTankCargoSummary } = useIsoTankPrintBridge(reportDate);

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

  // Section C(iso_tank_unloading_skid)는 IsoTankUnloadingSkidPatrolForm.tsx가
  // daily_ops_patrol_entries(SQLite)에 라이브 저장하고, 그 값이 이미 서버
  // 스냅샷(dailyReportSnapshotDao.ts generateSnapshot → PATROL_EQUIPMENT_TAGS_BY_DOMAIN)에
  // 포함되어 report.payload.domains.iso_tank_unloading_skid로 내려오므로 여기서
  // 덮어쓰지 않는다(과거엔 이 도메인도 순찰 폼이 없어 레거시 브릿지로 덮어썼으나,
  // 신규 폼 도입 후 그 전제가 깨져 있었음 — Section C는 이제 서버 스냅샷 단일 소스).
  //
  // Section D(iso_tank_cargo)는 여전히 순찰 폼이 없어(PATROL_EQUIPMENT_TAGS_BY_DOMAIN에
  // 미등록) 서버 스냅샷이 항상 이 도메인을 비워 두므로, NiasActiveBayWorkspace.tsx /
  // NiasLaydownLogTab.tsx가 쓰는 dailyMasterRecords(PortalDataContext, 브라우저 전용)를
  // 클라이언트 측에서 계속 병합한다 — 두 소스 파일과 스냅샷 DAO는 무수정.
  const bridgedPayload: DailyReportSnapshotPayload | null = useMemo(() => {
    if (!report) return null;
    return {
      ...report.payload,
      domains: {
        ...report.payload.domains,
        iso_tank_cargo: isoTankCargo,
      },
    };
  }, [report, isoTankCargo]);

  if (error) {
    return <div className="print-gap-notice">{error}</div>;
  }
  if (!report || !bridgedPayload) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <style>{PRINT_STYLES}</style>
      <PrintPage1 payload={bridgedPayload} />
      <PrintPage2 payload={bridgedPayload} />
      <PrintPage3 payload={bridgedPayload} cargoSummary={isoTankCargoSummary} />
      <PrintPage4 payload={bridgedPayload} />
      <PrintPage5
        criticalEvents={report.criticalEvents}
        safetyNotes={report.safetyNotes}
        signatures={report.signatures}
      />
    </div>
  );
}
