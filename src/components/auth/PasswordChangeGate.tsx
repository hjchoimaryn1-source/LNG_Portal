// src/components/auth/PasswordChangeGate.tsx
// must_change_password=1 로그인 직후 강제로 거치는 비밀번호 변경 화면.
// 2단 분할 모달 재설계(2026-09-19)로 부모 LoginGateway.tsx의 720x380 패널 중
// 오른쪽 폼 칼럼의 .login-stage(flex:1) 안에만 렌더링된다 — 왼쪽 사진 칼럼은
// 그대로, 별도 모달/패널 크기 변경 없음. 이 화면의 모든 사용자 노출 텍스트는
// 영문이어야 한다(스펙 원문).
"use client";

import React, { useState } from 'react';
import { SUNKEN_INPUT, BEVEL_BUTTON } from '../cmms/scadaStyles';

interface PasswordChangeGateProps {
  onSuccess: () => void;
}

type ChangeErrorCode = 'INVALID_CURRENT_PASSWORD' | 'PASSWORD_TOO_SHORT' | 'ACCOUNT_NOT_FOUND' | 'NOT_AUTHENTICATED';

const ERROR_MESSAGES: Record<ChangeErrorCode, string> = {
  INVALID_CURRENT_PASSWORD: 'Current password is incorrect.',
  PASSWORD_TOO_SHORT: 'New password must be at least 8 characters.',
  ACCOUNT_NOT_FOUND: 'Unable to verify account. Please sign in again.',
  NOT_AUTHENTICATED: 'Session expired. Please sign in again.',
};

export default function PasswordChangeGate({ onSuccess }: PasswordChangeGateProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const canSubmit =
    currentPassword.length > 0 && newPassword.length > 0 && confirmPassword.length > 0 && !isSubmitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    if (newPassword.length < 8) {
      setErrorMessage(ERROR_MESSAGES.PASSWORD_TOO_SHORT);
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    let res: Response;
    try {
      res = await fetch('/api/v1/cmms/user-security/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    } catch {
      setIsSubmitting(false);
      setErrorMessage('Network error — please try again.');
      return;
    }

    const data: { success: true } | { success: false; error: ChangeErrorCode } = await res.json();
    if (!res.ok || !data.success) {
      setIsSubmitting(false);
      setErrorMessage(!data.success ? (ERROR_MESSAGES[data.error] ?? 'Password change failed.') : 'Password change failed.');
      return;
    }

    setIsSubmitting(false);
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="stage-form">
      <span className="stage-title">Password change required</span>

      <label className="field-label" htmlFor="pw-change-current">&gt; CURRENT PASSWORD</label>
      <input
        id="pw-change-current"
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        placeholder="Current (temporary) password"
        autoComplete="current-password"
        disabled={isSubmitting}
        className={`${SUNKEN_INPUT} w-full`}
      />

      <label className="field-label" htmlFor="pw-change-new">&gt; NEW PASSWORD</label>
      <input
        id="pw-change-new"
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="New password (min. 8 characters)"
        autoComplete="new-password"
        disabled={isSubmitting}
        className={`${SUNKEN_INPUT} w-full`}
      />

      <label className="field-label" htmlFor="pw-change-confirm">&gt; CONFIRM NEW PASSWORD</label>
      <input
        id="pw-change-confirm"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm new password"
        autoComplete="new-password"
        disabled={isSubmitting}
        className={`${SUNKEN_INPUT} w-full`}
      />

      <button type="submit" disabled={!canSubmit} className={BEVEL_BUTTON}>
        {isSubmitting ? 'UPDATING...' : 'UPDATE PASSWORD'}
      </button>

      <div className="error-line">{errorMessage || ' '}</div>
    </form>
  );
}
