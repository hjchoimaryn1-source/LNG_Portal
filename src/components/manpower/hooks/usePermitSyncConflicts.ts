// src/components/manpower/hooks/usePermitSyncConflicts.ts
//
// PURPOSE
//   PTWMasterRegisterTab.tsx가 §5.5 동기화 충돌(permit_sync_conflicts,
//   REQUIRES_SITE_MANAGER_REVIEW)을 기존 GuardrailBlockedBanner에 표시할 수
//   있도록 조회만 담당하는 State Layer. usePTWPermitSync.ts와 동일하게
//   fetch/보관만 하고, 병합/표시 결정은 호출부 몫이다.

import { useCallback, useEffect, useState } from 'react';

const SYNC_CONFLICTS_API = '/api/v1/cmms/ptw-permits/sync-conflicts';

export interface OpenPermitSyncConflict {
  conflictId: number;
  permitRefNo: string;
  status: 'REQUIRES_SITE_MANAGER_REVIEW';
  createdAt: string;
}

interface SyncConflictsApiResponse {
  success: boolean;
  conflicts: OpenPermitSyncConflict[];
}

export function usePermitSyncConflicts() {
  const [openConflicts, setOpenConflicts] = useState<OpenPermitSyncConflict[]>([]);

  const refetch = useCallback(() => {
    (async () => {
      try {
        const res = await fetch(SYNC_CONFLICTS_API, { cache: 'no-store' });
        const json = (await res.json()) as SyncConflictsApiResponse;
        if (res.ok && json.success) setOpenConflicts(json.conflicts);
      } catch (err) {
        console.error('[usePermitSyncConflicts] fetch failed:', err);
      }
    })();
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { openConflicts, refetch };
}
