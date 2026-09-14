// src/cmms-daily-ops/components/report/AuditTrailView.tsx
//
// PURPOSE
//   Stage D Addendum (D-ADD-3) — snapshot의 daily_report_status_log를 읽기
//   전용으로 시간순 나열한다. useStatusAuditLog가 넘겨주는 데이터만 렌더링.

'use client';

import { RAISED_PANEL } from '../../../components/cmms/scadaStyles';
import { useStatusAuditLog } from '../../hooks/useStatusAuditLog';

const EVENT_LABEL: Record<string, string> = {
  status_transition: '상태 전이',
  hq_unlock: 'HQ 수정모드 열림',
  hq_relock: 'HQ 수정모드 종료',
  hq_edit_ack: 'HQ 수정 통보 확인',
};

export interface AuditTrailViewProps {
  snapshotId: number;
}

export function AuditTrailView({ snapshotId }: AuditTrailViewProps) {
  const { entries, loading } = useStatusAuditLog(snapshotId);

  return (
    <div className={`${RAISED_PANEL} p-3 space-y-1`}>
      <div className="text-[11px] font-bold uppercase text-slate-700">Audit Trail</div>
      {loading && <div className="text-[10px] text-slate-400">Loading...</div>}
      {!loading && entries.length === 0 && (
        <div className="text-[10px] text-slate-400">이력이 없습니다.</div>
      )}
      <ul className="space-y-1">
        {entries.map((entry) => (
          <li key={entry.id} className="text-[10px] font-mono text-slate-600 border-b border-slate-200 pb-1">
            <span className="font-bold">{EVENT_LABEL[entry.eventType] ?? entry.eventType}</span>
            {entry.fromStatus && entry.toStatus && (
              <span> ({entry.fromStatus} → {entry.toStatus})</span>
            )}
            {' — '}
            {entry.actorUserId} [{entry.actorRole}] @ {entry.createdAt}
            {entry.reasonText && <div className="text-slate-500">사유: {entry.reasonText}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}
