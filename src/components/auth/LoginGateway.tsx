// src/components/auth/LoginGateway.tsx
"use client";

import React, { useEffect, useState } from 'react';
import type { RoleCode, ModuleCode } from '../../types/rbac';
import { getEffectivePermission } from '../../lib/rbac/rolePermissionService';
import { LOGIN_GATEWAY_STYLES } from './loginGatewayStyles';
import { LOGIN_GATEWAY_TASK_STYLES } from './loginGatewayTaskStyles';

interface LoginGatewayProps {
  onEnter?: () => void;
  onLogin?: () => void;
}

// TASK 2 (로그인 UI): 역할 선택 드롭다운 노출용 정적 목록. RoleCode 유니온(types/rbac.ts)과 동기화 필요.
const ROLE_OPTIONS: { code: RoleCode; label: string }[] = [
  { code: 'SYSTEM_ADMIN', label: 'SYSTEM_ADMIN — 시스템 관리자' },
  { code: 'SITE_MANAGER', label: 'SITE_MANAGER — 현장 소장' },
  { code: 'ACTING_SITE_MANAGER', label: 'ACTING_SITE_MANAGER — 현장 소장 대행' },
  { code: 'OPERATION_TEAM_LEADER', label: 'OPERATION_TEAM_LEADER — 운영팀장' },
  { code: 'HSSE_OFFICER', label: 'HSSE_OFFICER — 안전관리자' },
  { code: 'WORK_LEADER_TECH', label: 'WORK_LEADER_TECH — 작업반장/기술자' },
  { code: 'HQ_SUPERVISOR_AUDITOR', label: 'HQ_SUPERVISOR_AUDITOR — 본사 감사역(읽기전용)' },
];

const ALL_MODULE_CODES: ModuleCode[] = [
  'HQ_OVERVIEW', 'LNG_PROCESS_OVERVIEW', 'EQUIPMENT_ASSET_REGISTRY', 'WORK_ORDER_DIRECTORY',
  'MAINTENANCE_MRO_HUB', 'MANPOWER_DAILY_SHIFT', 'MANPOWER_ROTATION_TRACKER', 'PTW_PERMITS',
  'SAFETY_GAS_TESTING', 'SAFETY_ERT_READINESS', 'SAFETY_OVERVIEW',
];

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

function formatCountdown(msRemaining: number): string {
  const totalSeconds = Math.max(0, Math.ceil(msRemaining / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function LoginGateway({ onEnter, onLogin }: LoginGatewayProps) {
  const [imgError, setImgError] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleCode | ''>('');

  // 계정 잠금 시뮬레이션 — 컴포넌트 상태로만 관리되며 새로고침 시 초기화됨.
  // user_accounts.failed_attempt_count 백엔드 연동 전까지의 로컬 UI 목업.
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

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

  const handleLogin = () => {
    if (isLockedOut) return;

    // 로컬 목업: 아직 실제 인증 백엔드가 없어 "역할 미선택 상태의 진입 시도"를
    // 실패 시도로 간주해 잠금 카운터를 시뮬레이션한다. 실제 자격 증명 검증이 아님.
    if (!selectedRole) {
      const nextFailedAttempts = failedAttempts + 1;
      setFailedAttempts(nextFailedAttempts);
      if (nextFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        setLockoutUntil(Date.now() + LOCKOUT_DURATION_MS);
      }
      return;
    }

    setFailedAttempts(0);
    if (onLogin) {
      onLogin();
    } else if (onEnter) {
      onEnter();
    }
  };

  const accessibleModules = selectedRole
    ? ALL_MODULE_CODES.filter((mod) => getEffectivePermission(selectedRole, mod)?.canRead)
    : [];
  const approvableModules = selectedRole
    ? ALL_MODULE_CODES.filter((mod) => getEffectivePermission(selectedRole, mod)?.canApprove)
    : [];

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

          {/* 3b. 역할 선택 (rolePermissionService 기반 접근 권한 안내용) */}
          <div className="role-select-row">
            <label className="role-select-label" htmlFor="login-role-select">
              &gt; ROLE SELECT (접근 권한 미리보기)
            </label>
            <select
              id="login-role-select"
              className="role-select"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as RoleCode)}
              disabled={isLockedOut}
            >
              <option value="">-- 역할을 선택하세요 --</option>
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>{opt.label}</option>
              ))}
            </select>
          </div>

          {selectedRole && (
            <div className="role-access-summary">
              <span className="summary-title">&gt; ACCESS SUMMARY — {selectedRole}</span>
              <div>읽기 가능 모듈: {accessibleModules.length} / {ALL_MODULE_CODES.length}</div>
              <div>승인 권한 보유 모듈: {approvableModules.length > 0 ? approvableModules.join(', ') : '없음'}</div>
            </div>
          )}

          {/* 계정 잠금 안내 — 컴포넌트 로컬 상태 기반 UI 시뮬레이션 (새로고침 시 초기화, user_accounts 미연동) */}
          {isLockedOut && lockoutUntil !== null && (
            <div className="lockout-banner">
              계정이 잠겼습니다. {formatCountdown(lockoutUntil - now)} 후 다시 시도하세요.
              (로컬 UI 시뮬레이션 — 실제 계정 잠금 아님)
            </div>
          )}
          {!isLockedOut && failedAttempts > 0 && (
            <div className="lockout-banner">
              역할을 선택하지 않았습니다. ({failedAttempts}/{MAX_FAILED_ATTEMPTS} 시도)
            </div>
          )}

          {/* 4. Button: Classic Windows 3D Bevel Button */}
          <button type="button" className="enter-btn" onClick={handleLogin} disabled={isLockedOut}>
            <span>{isLockedOut ? '[ LOCKED ]' : '[ ENTER PORTAL ]'}</span>
            <span>➔</span>
          </button>
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
