// src/hmi/hooks/useAlarmActionLog.ts
//
// PURPOSE
//   HMI-2c-final — acknowledge/suppress POST(/api/v1/cmms/alarm-action-log) +
//   suppress 성공 시 useAlarmSuppressionStore optimistic 반영. useDailyReportApproval.ts와
//   동일한 세션 소스 컨벤션(useActiveSession → actorId/actorRole)을 따른다.

'use client';

import { useCallback } from 'react';
import { useActiveSession } from '../../lib/rbac/activeSessionStore';
import { getEffectivePermission } from '../../lib/rbac/rolePermissionService';
import { addActiveSuppression } from '../state/useAlarmSuppressionStore';
import { markAlarmAcknowledged } from '../state/useAlarmAckStore';
import type { PatrolDomain } from '../types/hmiCore';

const ALARM_ACTION_LOG_API = '/api/v1/cmms/alarm-action-log';

export interface UseAlarmActionLogResult {
  acknowledge: (domain: PatrolDomain, equipmentTag: string, columnName: string) => Promise<string | null>;
  suppress: (
    domain: PatrolDomain,
    equipmentTag: string,
    columnName: string,
    reasonText: string,
    suppressExpiresAt: string
  ) => Promise<string | null>;
}

/** 성공 시 null, 실패 시 사용자에게 보여줄 에러 메시지를 반환한다. */
export function useAlarmActionLog(): UseAlarmActionLogResult {
  const activeSession = useActiveSession();

  const post = useCallback(async (payload: Record<string, unknown>): Promise<string | null> => {
    const res = await fetch(ALARM_ACTION_LOG_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as { success: boolean; error?: string };
    return json.success ? null : (json.error ?? '기록 실패');
  }, []);

  const acknowledge = useCallback(
    async (domain: PatrolDomain, equipmentTag: string, columnName: string) => {
      if (!activeSession) return '로그인 세션이 없습니다.';
      // RBAC audit remediation — Phase 13 follow-up, 2026-09-16.
      if (getEffectivePermission(activeSession.roleCode, 'ALARM_ACTION_LOG')?.canCreate !== true) {
        return `역할 ${activeSession.roleCode}은(는) 알람 조치 기록 권한이 없습니다.`;
      }
      const err = await post({
        domain,
        equipmentTag,
        columnName,
        actionType: 'acknowledge',
        actorId: activeSession.userId,
        actorRole: activeSession.roleCode,
      });
      if (!err) markAlarmAcknowledged(domain, equipmentTag, columnName, new Date().toISOString());
      return err;
    },
    [activeSession, post]
  );

  const suppress = useCallback(
    async (domain: PatrolDomain, equipmentTag: string, columnName: string, reasonText: string, suppressExpiresAt: string) => {
      if (!activeSession) return '로그인 세션이 없습니다.';
      // RBAC audit remediation — Phase 13 follow-up, 2026-09-16.
      if (getEffectivePermission(activeSession.roleCode, 'ALARM_ACTION_LOG')?.canCreate !== true) {
        return `역할 ${activeSession.roleCode}은(는) 알람 조치 기록 권한이 없습니다.`;
      }
      if (!reasonText.trim()) return '억제 사유를 입력하세요.';
      if (!suppressExpiresAt) return '만료 시각을 입력하세요.';
      const err = await post({
        domain,
        equipmentTag,
        columnName,
        actionType: 'suppress',
        actorId: activeSession.userId,
        actorRole: activeSession.roleCode,
        reasonText,
        suppressExpiresAt,
      });
      if (!err) addActiveSuppression(domain, equipmentTag, columnName, suppressExpiresAt);
      return err;
    },
    [activeSession, post]
  );

  return { acknowledge, suppress };
}
