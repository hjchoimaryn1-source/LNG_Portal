// src/cmms-daily-ops/components/patrol/ReadingStatusControl.tsx
//
// PURPOSE
//   reading_status 드롭다운 + status≠'normal'일 때만 노출되는 remark_text
//   입력창. patrolLog.ts의 ReadingStatus 고정값을 그대로 옵션으로 쓴다.
//   (원 지시에는 없던 파일 — 6개 B1 폼이 동일한 상태/비고 블록을 반복
//   구현하는 걸 피하기 위한 최소 범위의 추가, deviation note 참고)

'use client';

import { SUNKEN_INPUT } from '../../../components/cmms/scadaStyles';
import type { ReadingStatus } from '../../types/patrolLog';

const READING_STATUS_OPTIONS: Array<{ value: ReadingStatus; label: string }> = [
  { value: 'normal', label: '정상' },
  { value: 'no_reading', label: '판독 불가' },
  { value: 'progress_order', label: '작업 진행 중' },
  { value: 'low_pressure_warning', label: '저압 경고' },
  { value: 'other', label: '기타' },
];

export interface ReadingStatusControlProps {
  readingStatus: ReadingStatus;
  remarkText: string | null;
  onReadingStatusChange: (status: ReadingStatus) => void;
  onRemarkTextChange: (text: string | null) => void;
}

export function ReadingStatusControl({
  readingStatus,
  remarkText,
  onReadingStatusChange,
  onRemarkTextChange,
}: ReadingStatusControlProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <label className="text-[10px] font-bold text-slate-700 uppercase">판독 상태</label>
        <select
          value={readingStatus}
          onChange={(e) => onReadingStatusChange(e.target.value as ReadingStatus)}
          className={SUNKEN_INPUT}
        >
          {READING_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {readingStatus !== 'normal' && (
        <textarea
          value={remarkText ?? ''}
          onChange={(e) => onRemarkTextChange(e.target.value === '' ? null : e.target.value)}
          placeholder="비고 입력..."
          rows={2}
          className={`${SUNKEN_INPUT} w-full`}
        />
      )}
    </div>
  );
}
