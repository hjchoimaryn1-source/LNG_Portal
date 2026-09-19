// src/components/auth/LoginGateway.tsx
//
// Stage 3 (2026-09-19, HJ decision — full replacement, not parallel exposure):
// this used to be the Quick-Login PIN flow (USER_ACCOUNTS card select ->
// PinEntryModal -> POST /api/v1/cmms/auth/login). It now POSTs username+password
// to Stage 1B's /api/v1/cmms/user-security/login and populates ActiveSession
// with the new role_code vocabulary + precomputed permissions map. The PIN
// backend itself (staff_credentials/verifyStaffPin/devStaffPins.ts,
// userAccountsSeed.ts, /api/v1/cmms/auth/login) is left intact and unused,
// in case a rollback is needed during this transition — only this UI entry
// point changed. QuickLoginAccountCard.tsx/PinEntryModal.tsx are now unused
// by this file (left in place, not deleted, for the same rollback reason).

'use client';

import React, { useState } from 'react';
import { setActiveSession } from '../../lib/rbac/activeSessionStore';
import type { Stage1RoleCode } from '../../lib/rbac/userSecurityRolePermissionSeed';
import type { ModuleCode, RolePermission } from '../../types/rbac';
import { SUNKEN_INPUT, BEVEL_BUTTON } from '../cmms/scadaStyles';
import { LOGIN_GATEWAY_STYLES } from './loginGatewayStyles';
import { LOGIN_GATEWAY_TASK_STYLES } from './loginGatewayTaskStyles';

interface LoginGatewayProps {
  onEnter?: () => void;
  onLogin?: () => void;
}

interface LoginSuccessResponse {
  success: true;
  roleCode: Stage1RoleCode;
  employeeId: string;
  mustChangePassword: boolean;
  permissions: Partial<Record<ModuleCode, RolePermission>>;
}

interface LoginFailureResponse {
  success: false;
  error: 'INVALID_CREDENTIALS' | 'ACCOUNT_LOCKED' | 'ACCOUNT_DISABLED';
}

const LOGIN_FAILURE_MESSAGES: Record<LoginFailureResponse['error'], string> = {
  INVALID_CREDENTIALS: '아이디 또는 비밀번호가 올바르지 않습니다.',
  ACCOUNT_LOCKED: '로그인 시도 횟수 초과로 계정이 잠겼습니다. 15분 후 다시 시도하세요.',
  ACCOUNT_DISABLED: '비활성화된 계정입니다. 관리자에게 문의하세요.',
};

export default function LoginGateway({ onEnter, onLogin }: LoginGatewayProps) {
  const [imgError, setImgError] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const canSubmit = username.trim().length > 0 && password.length > 0 && !isSubmitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    setErrorMessage(undefined);

    let res: Response;
    try {
      res = await fetch('/api/v1/cmms/user-security/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
    } catch {
      setIsSubmitting(false);
      setErrorMessage('네트워크 오류 — 다시 시도하세요.');
      return;
    }

    const data: LoginSuccessResponse | LoginFailureResponse = await res.json();
    if (!res.ok || !data.success) {
      setIsSubmitting(false);
      setErrorMessage(!data.success ? LOGIN_FAILURE_MESSAGES[data.error] : '로그인 실패');
      return;
    }

    setActiveSession({
      employeeId: data.employeeId,
      roleCode: data.roleCode,
      // Stage 1 schema has no HQ/SITE field — ADMIN is treated as HQ-homed
      // (matching the retired SYSTEM_ADMIN/DEV-HQ-001 precedent), every other
      // role as SITE-homed. See activeSessionStore.ts header comment.
      homeLocation: data.roleCode === 'ADMIN' ? 'HQ' : 'SITE',
      permissions: data.permissions,
    });
    setIsSubmitting(false);
    setPassword('');
    if (onLogin) {
      onLogin();
    } else if (onEnter) {
      onEnter();
    }
  }

  return (
    <div className="gateway-root">
      <style>{LOGIN_GATEWAY_STYLES}</style>
      <style>{LOGIN_GATEWAY_TASK_STYLES}</style>

      <div className="window">
        {/* 상단 타이틀바 */}
        <div className="title-bar">
          <span className="flex items-center gap-1.5">
            <span>💻</span>
            <span>NIAS CMMS</span>
          </span>
          <div className="title-bar-controls">
            <button type="button" aria-label="Minimize">_</button>
            <button type="button" aria-label="Maximize">□</button>
            <button type="button" aria-label="Close">✕</button>
          </div>
        </div>

        <div className="window-body">
          {/* 2. Header Block: 독립된 Raised-Bevel 패널 */}
          <div className="header-panel">
            <div className="logo-area">
              {!imgError ? (
                <img
                  src="/images/bsg-lines-logo.png"
                  alt="LOGO"
                  style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="logo-placeholder">LOGO</div>
              )}
            </div>

            <div className="company-title">BERKAT SAMUDRA GEMILANG LINES</div>
          </div>

          {/* 3. Monitor Box: Sunken-Panel Tone-Down Gray (#d8dee9) with Inset Shadow */}
          <div className="status-card">
            <div className="status-header">
              <span>&gt;_ SYSTEM INITIALIZATION MONITOR</span>
              <span className="status-badge">SYS_READY</span>
            </div>
            <div className="status-item">
              &gt; GATEWAY STATUS: <span className="highlight">AWAITING CREDENTIALS</span>
            </div>
            <div className="status-item">
              &gt; SYSTEM SCOPE: <span className="highlight">120 ISO TANKS • 5-NODE SUPPLY CHAIN</span>
            </div>
            <div className="status-item">
              &gt; DATA HYDRATION: <span className="highlight">DEFERRED (EXECUTES POST-LOGIN)</span>
            </div>
            <div className="status-item">
              &gt; SESSION POLICY: <span className="highlight">12시간 만료 · 5회 실패 시 15분 잠금</span>
            </div>
          </div>

          {/* 3b. Username + Password 로그인 (Stage 1B) */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-1.5 mt-2">
            <span className="quick-login-label">&gt; LOGIN</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              autoComplete="username"
              disabled={isSubmitting}
              className={SUNKEN_INPUT}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              disabled={isSubmitting}
              className={SUNKEN_INPUT}
            />
            <button type="submit" disabled={!canSubmit} className={BEVEL_BUTTON}>
              {isSubmitting ? 'LOGGING IN...' : 'LOG IN'}
            </button>
          </form>

          {errorMessage && <div className="lockout-banner">{errorMessage}</div>}
        </div>

        {/* 하단 상태 바 */}
        <div className="status-bar">
          <span>PORTAL v2.5.0-CMMS</span>
          <span className="ready-indicator">⦿ SESSION STANDBY</span>
        </div>
      </div>
    </div>
  );
}
