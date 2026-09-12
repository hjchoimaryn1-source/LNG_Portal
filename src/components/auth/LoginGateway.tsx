// src/components/auth/LoginGateway.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { USER_ACCOUNTS, type UserAccountSeedRow } from '../../lib/rbac/userAccountsSeed';
import { setActiveSession } from '../../lib/rbac/activeSessionStore';
import type { EffectiveRole } from '../../cmms-auth/rbacTypes';
import { LOGIN_GATEWAY_STYLES } from './loginGatewayStyles';
import { LOGIN_GATEWAY_TASK_STYLES } from './loginGatewayTaskStyles';
import { LOGIN_GATEWAY_ACCOUNT_CARD_STYLES } from './loginGatewayAccountCardStyles';
import QuickLoginAccountCard from './QuickLoginAccountCard';
import PinEntryModal from './PinEntryModal';

interface LoginGatewayProps {
  onEnter?: () => void;
  onLogin?: () => void;
}

const MAX_FAILED_ATTEMPTS = 5;

function formatCountdown(msRemaining: number): string {
  const totalSeconds = Math.max(0, Math.ceil(msRemaining / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function LoginGateway({ onEnter, onLogin }: LoginGatewayProps) {
  const [imgError, setImgError] = useState(false);

  // 계정 잠금 시뮬레이션 — 컴포넌트 상태로만 관리되며 새로고침 시 초기화됨.
  // user_accounts.failed_attempt_count 백엔드 연동 전까지의 로컬 UI 목업(비기능).
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [pendingAccount, setPendingAccount] = useState<UserAccountSeedRow | null>(null);
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);
  const [pinError, setPinError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (lockoutUntil === null) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const isLockedOut = lockoutUntil !== null && now < lockoutUntil;

  useEffect(() => {
    if (lockoutUntil !== null && now >= lockoutUntil) {
      setLockoutUntil(null);
      setFailedAttempts(0);
    }
  }, [now, lockoutUntil]);

  const handleSelectAccount = (account: UserAccountSeedRow) => {
    if (isLockedOut) return;
    setPinError(undefined);
    setPendingAccount(account);
  };

  const handlePinCancel = () => {
    setPendingAccount(null);
    setPinError(undefined);
  };

  // PIN 입력 후 /api/v1/cmms/auth/login을 거쳐 실제 authenticate() 경로를
  // 통과한다 — src/cmms-auth/index.ts 참조.
  const handlePinSubmit = async (pin: string) => {
    if (!pendingAccount) return;
    setIsSubmittingPin(true);
    setPinError(undefined);

    let res: Response;
    try {
      res = await fetch('/api/v1/cmms/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, staffId: pendingAccount.userId }),
      });
    } catch {
      setIsSubmittingPin(false);
      setPinError('네트워크 오류 — 다시 시도하세요.');
      return;
    }

    if (!res.ok) {
      setIsSubmittingPin(false);
      setFailedAttempts((prev) => prev + 1);
      setPinError('PIN이 올바르지 않습니다.');
      return;
    }

    const data: { effectiveRole?: EffectiveRole } = await res.json();
    setActiveSession({
      userId: pendingAccount.userId,
      roleCode: pendingAccount.roleCode,
      homeLocation: pendingAccount.homeLocation,
      effectiveRole: data.effectiveRole,
    });
    setIsSubmittingPin(false);
    setFailedAttempts(0);
    setPendingAccount(null);
    if (onLogin) {
      onLogin();
    } else if (onEnter) {
      onEnter();
    }
  };

  return (
    <div className="gateway-root">
      <style>{LOGIN_GATEWAY_STYLES}</style>
      <style>{LOGIN_GATEWAY_TASK_STYLES}</style>
      <style>{LOGIN_GATEWAY_ACCOUNT_CARD_STYLES}</style>

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
              &gt; GATEWAY STATUS: <span className="highlight">DEV NO-AUTH BYPASS ACTIVE</span>
            </div>
            <div className="status-item">
              &gt; SYSTEM SCOPE: <span className="highlight">120 ISO TANKS • 5-NODE SUPPLY CHAIN</span>
            </div>
            <div className="status-item">
              &gt; DATA HYDRATION: <span className="highlight">DEFERRED (EXECUTES POST-LOGIN)</span>
            </div>
            {/* TODO: wire to real user_sessions.expires_at once user_accounts backend exists */}
            <div className="status-item">
              &gt; SESSION POLICY: <span className="highlight">30분 미조작 시 자동 로그아웃</span>
            </div>
          </div>

          {/* 3b. Quick-Login: user_accounts 시드 3계정 카드 선택 (비밀번호 입력 없음) */}
          <div className="quick-login-row">
            <span className="quick-login-label">&gt; QUICK LOGIN (계정 선택)</span>
            {USER_ACCOUNTS.map((account) => (
              <QuickLoginAccountCard
                key={account.userId}
                account={account}
                disabled={isLockedOut}
                onSelect={handleSelectAccount}
              />
            ))}
          </div>

          {/* 계정 잠금 안내 — 컴포넌트 로컬 상태 기반 UI 시뮬레이션 (새로고침 시 초기화, user_accounts 미연동, 비기능) */}
          {isLockedOut && lockoutUntil !== null && (
            <div className="lockout-banner">
              계정이 잠겼습니다. {formatCountdown(lockoutUntil - now)} 후 다시 시도하세요.
              (로컬 UI 시뮬레이션 — 실제 계정 잠금 아님)
            </div>
          )}
          {!isLockedOut && failedAttempts > 0 && (
            <div className="lockout-banner">
              로그인 실패 ({failedAttempts}/{MAX_FAILED_ATTEMPTS} 시도)
            </div>
          )}
        </div>

        {/* 하단 상태 바 */}
        <div className="status-bar">
          <span>PORTAL v2.5.0-CMMS</span>
          <span className="ready-indicator">⦿ SESSION STANDBY</span>
        </div>
      </div>

      {pendingAccount && (
        <PinEntryModal
          account={pendingAccount}
          onSubmit={handlePinSubmit}
          onCancel={handlePinCancel}
          isSubmitting={isSubmittingPin}
          errorMessage={pinError}
        />
      )}
    </div>
  );
}
