// src/cmms-daily-ops/components/report/NoticeBanner.tsx
//
// PURPOSE
//   Stage D Addendum (D-ADD-2b) — hq_edit_pending_ack=true인 동안 SITE_MANAGER/
//   ACTING_SITE_MANAGER/SYSTEM_ADMIN(canApprove 티어)에게 "HQ가 이 승인 완료
//   리포트를 수정했다"는 통보를 보여주고 확인(acknowledge) 액션을 제공한다.
//   D-ADD-4의 재발행 서명 경고와는 독립적 — 둘 다 동시에 떠 있을 수 있다.

'use client';

import { BEVEL_BUTTON } from '../../../components/cmms/scadaStyles';
import type { DailyReportSnapshotSummary } from '../../hooks/useDailyReportApproval';

export interface NoticeBannerProps {
  snapshot: DailyReportSnapshotSummary;
  canAcknowledge: boolean;
  onAcknowledge: () => void;
}

export function NoticeBanner({ snapshot, canAcknowledge, onAcknowledge }: NoticeBannerProps) {
  if (!snapshot.hqEditPendingAck) return null;

  return (
    <div className="px-3 py-2 text-[11px] font-mono border-l-4 border-amber-600 bg-amber-50 text-amber-900 space-y-1">
      <div className="font-bold uppercase">HQ 수정 통보</div>
      {snapshot.hqEditNoticeText && <div>{snapshot.hqEditNoticeText}</div>}
      {snapshot.hqEditNoticeAt && <div className="text-amber-700">수정 완료: {snapshot.hqEditNoticeAt}</div>}
      <button
        type="button"
        onClick={onAcknowledge}
        disabled={!canAcknowledge}
        className={`${BEVEL_BUTTON} ${!canAcknowledge ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={canAcknowledge ? undefined : 'Site Manager / Acting Site Manager 권한이 필요합니다.'}
      >
        수신 확인 (Acknowledge)
      </button>
    </div>
  );
}
