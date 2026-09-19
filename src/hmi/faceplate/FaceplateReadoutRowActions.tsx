// src/hmi/faceplate/FaceplateReadoutRowActions.tsx
//
// PURPOSE
//   FaceplateReadoutRow.tsx가 HIGH/CRITICAL 등급일 때만 렌더링하는 Acknowledge/Suppress
//   액션 바(HMI-2c-final). ApprovalPanel.tsx와 동일한 "인라인 입력 + 버튼" 컨벤션 —
//   별도 모달 없이 클릭 시 사유/만료 입력이 펼쳐진다. Suppress는 사유+만료 시각 필수
//   (서버 alarm_action_log DDL CHECK가 최종 강제) — 무기한 억제는 UI에서도 만들 수 없다.

'use client';

import { useState } from 'react';
import { BEVEL_BUTTON, SUNKEN_INPUT } from '../../components/cmms/scadaStyles';
import { useAlarmActionLog } from '../hooks/useAlarmActionLog';
import { getNextShiftBoundary } from '../../cmms-auth/shiftBoundaryMonitor';
import type { HmiInstrumentReading } from '../types/hmiCore';

export interface FaceplateReadoutRowActionsProps {
  reading: HmiInstrumentReading;
}

/** <input type="datetime-local">가 받는 로컬 타임존 "YYYY-MM-DDTHH:mm" 문자열로 변환. */
function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** HMI-2d-4 — Quick Suppress 프리셋 만료 칩(1hr/4hr/End of Shift). */
const SUPPRESS_EXPIRY_PRESETS: { label: string; resolve: (now: Date) => Date }[] = [
  { label: '1hr', resolve: (now) => new Date(now.getTime() + 60 * 60 * 1000) },
  { label: '4hr', resolve: (now) => new Date(now.getTime() + 4 * 60 * 60 * 1000) },
  // src/cmms-auth/shiftBoundaryMonitor.ts의 07:00/19:00 시프트 경계 재사용 —
  // 임의의 고정 시각을 새로 만들지 않는다(HMI-2d 지시문 제약).
  { label: 'End of Shift', resolve: (now) => getNextShiftBoundary(now) },
];

export function FaceplateReadoutRowActions({ reading }: FaceplateReadoutRowActionsProps) {
  const { acknowledge, suppress } = useAlarmActionLog();
  const [showSuppressForm, setShowSuppressForm] = useState(false);
  const [reasonText, setReasonText] = useState('');
  const [expiresAtLocal, setExpiresAtLocal] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  async function handleAcknowledge() {
    setMessage(await acknowledge(reading.domain, reading.tagId, reading.columnName));
  }

  async function handleSuppress() {
    if (!expiresAtLocal) {
      setMessage('만료 시각을 입력하세요.');
      return;
    }
    const suppressExpiresAtIso = new Date(expiresAtLocal).toISOString();
    const err = await suppress(reading.domain, reading.tagId, reading.columnName, reasonText, suppressExpiresAtIso);
    setMessage(err ?? '억제되었습니다.');
    if (!err) setShowSuppressForm(false);
  }

  return (
    <div className="flex flex-col gap-1 py-1">
      <div className="flex items-center gap-1">
        <button type="button" onClick={handleAcknowledge} className={`${BEVEL_BUTTON} text-[9px] px-2 py-0.5`}>
          Acknowledge
        </button>
        <button
          type="button"
          onClick={() => setShowSuppressForm((v) => !v)}
          className={`${BEVEL_BUTTON} text-[9px] px-2 py-0.5`}
        >
          Suppress
        </button>
      </div>
      {showSuppressForm && (
        <div className="flex flex-wrap items-center gap-1">
          <input
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            placeholder="억제 사유 (필수)"
            className={`${SUNKEN_INPUT} text-[9px] py-0.5`}
          />
          {SUPPRESS_EXPIRY_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setExpiresAtLocal(toDatetimeLocalValue(preset.resolve(new Date())))}
              className={`${BEVEL_BUTTON} text-[9px] px-2 py-0.5`}
            >
              {preset.label}
            </button>
          ))}
          <input
            type="datetime-local"
            value={expiresAtLocal}
            onChange={(e) => setExpiresAtLocal(e.target.value)}
            className={`${SUNKEN_INPUT} text-[9px] py-0.5`}
          />
          <button type="button" onClick={handleSuppress} className={`${BEVEL_BUTTON} text-[9px] px-2 py-0.5`}>
            억제 확정
          </button>
        </div>
      )}
      {message && <span className="text-[9px] text-slate-500">{message}</span>}
    </div>
  );
}
