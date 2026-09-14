// src/cmms-daily-ops/hooks/useStatusAuditLog.ts
//
// PURPOSE
//   Stage D Addendum (D-ADD-3) — AuditTrailView.tsx용 상태 계층. snapshotId
//   기준 daily_report_status_log를 조회만 한다(쓰기는 각 액션 훅이 자체
//   API를 통해 수행).

'use client';

import { useCallback, useEffect, useState } from 'react';
import type { DailyReportStatus } from '../dao/dailyReportSnapshotDao';
import type { RoleCode } from '../../types/rbac';

const STATUS_LOG_API = '/api/v1/cmms/daily-report-status-log';

export interface StatusLogEntrySummary {
  id: number;
  eventType: 'status_transition' | 'hq_unlock' | 'hq_relock' | 'hq_edit_ack';
  fromStatus: DailyReportStatus | null;
  toStatus: DailyReportStatus | null;
  actorUserId: string;
  actorRole: RoleCode;
  reasonText: string | null;
  createdAt: string;
}

export function useStatusAuditLog(snapshotId: number | null) {
  const [entries, setEntries] = useState<StatusLogEntrySummary[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(() => {
    if (!snapshotId) {
      setEntries([]);
      return;
    }
    setLoading(true);
    fetch(`${STATUS_LOG_API}?snapshotId=${snapshotId}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json: { success: boolean; entries: StatusLogEntrySummary[] }) => {
        setEntries(json.success ? json.entries : []);
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [snapshotId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { entries, loading, reload };
}
