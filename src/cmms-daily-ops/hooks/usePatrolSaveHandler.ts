// src/cmms-daily-ops/hooks/usePatrolSaveHandler.ts
//
// PURPOSE
//   B1 폼(patrolFormTypes.ts의 PatrolSaveHandler)의 저장 콜백을 실제 저장
//   (daily-ops-patrol-entries POST)과 B2 Live-sync 스토어 갱신에 연결한다.
//   B1은 저장 방법을 모르는 순수 콜백만 노출하도록 설계됐고, B2 헤더
//   코멘트가 예고한 "On successful DAO save from any B1 form, update this
//   map"을 Stage C4에서 실제로 구현한 지점이 여기다.
//
//   recordedBy: 인증/현재 사용자 컨텍스트가 이 프로젝트에 아직 없어(제로터치
//   대상 파일들과 무관한 별개 갭) 호출부가 문자열을 직접 넘긴다 — 인증 연동은
//   범위 밖.
//
//   onBlocked(Phase 12 Pre-Flight III): report_date가 APPROVED라 저장이
//   409로 거부되면 사유를 전달한다. 선택적 파라미터라 기존 4개 호출부는
//   무수정으로 남는다(그 뷰들에서는 여전히 조용히 무시됨).
//
//   Explicit allow-list per HJ decision 2026-09-15 — Phase 12 field-readiness pass.
//   useDailyReportApproval.ts와 동일한 패턴(getEffectivePermission +
//   evaluateMutationGuardrails)으로 fetch 이전에 클라이언트측 차단. 서버
//   (daily-ops-patrol-entries/route.ts)도 roleCode를 재검증한다.

'use client';

import { useCallback } from 'react';
import { setLatestPatrolEntry } from '../state/useDailyOpsPatrolStore';
import { useActiveSession } from '../../lib/rbac/activeSessionStore';
import { evaluateMutationGuardrails } from '../../adapters/guardrailUiAdapter';
import type { PatrolDomain } from '../types/patrolLog';
import type { PatrolSaveHandler, PatrolSaveInput } from '../components/patrol/patrolFormTypes';

const PATROL_ENTRIES_API = '/api/v1/cmms/daily-ops-patrol-entries';

export function usePatrolSaveHandler(
  domain: PatrolDomain,
  reportDate: string,
  recordedBy: string,
  onBlocked?: (reason: string) => void
): PatrolSaveHandler {
  const activeSession = useActiveSession();

  return useCallback(
    (input: PatrolSaveInput) => {
      if (!activeSession) {
        onBlocked?.('로그인 세션이 없습니다.');
        return;
      }
      const canRecord = activeSession.permissions.DAILY_OPS_PATROL_ENTRY?.canCreate === true;
      if (!canRecord) {
        onBlocked?.(`역할 ${activeSession.roleCode}은(는) 패트롤 기록 입력 권한이 없습니다.`);
        return;
      }
      const guard = evaluateMutationGuardrails({ roleCode: activeSession.roleCode, action: 'CREATE' });
      if (!guard.allowed) {
        onBlocked?.(guard.reason ?? 'PATROL SAVE BLOCKED');
        return;
      }

      fetch(PATROL_ENTRIES_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, reportDate, recordedBy, roleCode: activeSession.roleCode, ...input }),
      })
        .then((res) => res.json())
        .then((json: { success: boolean; error?: string }) => {
          if (json.success) {
            setLatestPatrolEntry(domain, input.equipmentTag, input.values);
          } else if (onBlocked && json.error) {
            onBlocked(json.error);
          }
        })
        .catch(() => {});
    },
    [domain, reportDate, recordedBy, onBlocked, activeSession]
  );
}
