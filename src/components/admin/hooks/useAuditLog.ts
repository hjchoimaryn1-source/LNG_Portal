// src/components/admin/hooks/useAuditLog.ts
//
// PURPOSE
//   user_account_audit_log 읽기 전용 뷰어 데이터 계층 — Stage 1C
//   /api/v1/cmms/user-security/audit-log GET.

import { useEffect, useState } from 'react';

const AUDIT_LOG_API = '/api/v1/cmms/user-security/audit-log';

export interface AuditLogRecord {
  id: number;
  employeeId: string | null;
  accountId: string | null;
  eventType: string;
  actorAccountId: string | null;
  detail: string | null;
  createdAt: string;
}

export function useAuditLog() {
  const [records, setRecords] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(AUDIT_LOG_API, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json: { success: boolean; records?: AuditLogRecord[] }) => {
        if (json.success && json.records) setRecords(json.records);
      })
      .finally(() => setLoading(false));
  }, []);

  return { records, loading };
}
