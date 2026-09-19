// src/components/auth/LoginGateway.tsx
//
// Login gateway redesign (2026-09-19, HJ final spec — supersedes the rejected
// card-grid Part C layout). Compact industrial dropdown-picker login, all
// user-facing text in English:
//   LOGIN step: [USER dropdown] -> [PASSWORD] -> [LOG IN], with a manual
//   entry fallback ("Sign in with another account") swapping the dropdown for
//   a plain username field in the same slot/height.
//   CHANGE_PASSWORD step: PasswordChangeGate.tsx renders inside the same
//   fixed-height .login-stage — no new modal, no panel resize.
//
// The PIN backend (staff_credentials/verifyStaffPin/devStaffPins.ts,
// userAccountsSeed.ts, /api/v1/cmms/auth/login, QuickLoginAccountCard.tsx,
// PinEntryModal.tsx) remains untouched — same rollback rationale as the
// Stage 3 changeover.

'use client';

import React, { useRef, useState } from 'react';
import { setActiveSession } from '../../lib/rbac/activeSessionStore';
import type { Stage1RoleCode } from '../../lib/rbac/userSecurityRolePermissionSeed';
import type { ModuleCode, RolePermission } from '../../types/rbac';
import type { LoginDirectoryEntry } from '../../lib/rbac/userSecurityLoginDirectoryDao';
import { SUNKEN_INPUT, BEVEL_BUTTON } from '../cmms/scadaStyles';
import { LOGIN_GATEWAY_STYLES } from './loginGatewayStyles';
import { LOGIN_GATEWAY_DROPDOWN_STYLES } from './loginGatewayDropdownStyles';
import UserDropdownSelect from './UserDropdownSelect';
import PasswordChangeGate from './PasswordChangeGate';
import { useLoginDirectory } from './hooks/useLoginDirectory';

interface LoginGatewayProps {
  onEnter?: () => void;
  onLogin?: () => void;
  /** page.tsx의 서버사이드 prefetch 결과. 없으면(undefined) 클라이언트에서 직접 fetch. */
  initialDirectory?: LoginDirectoryEntry[];
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
  INVALID_CREDENTIALS: 'Invalid username or password.',
  ACCOUNT_LOCKED: 'Account locked due to too many failed attempts. Try again in 15 minutes.',
  ACCOUNT_DISABLED: 'This account is disabled. Contact your administrator.',
};

type Step = 'LOGIN' | 'CHANGE_PASSWORD';
type UsernameMode = 'DIRECTORY' | 'MANUAL';

interface PendingSession {
  employeeId: string;
  roleCode: Stage1RoleCode;
  permissions: Partial<Record<ModuleCode, RolePermission>>;
}

export default function LoginGateway({ onEnter, onLogin, initialDirectory }: LoginGatewayProps) {
  const [imgError, setImgError] = useState(false);
  const [step, setStep] = useState<Step>('LOGIN');
  const { directory, directoryLoading } = useLoginDirectory(initialDirectory);
  const [usernameMode, setUsernameMode] = useState<UsernameMode>('DIRECTORY');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingSession, setPendingSession] = useState<PendingSession | null>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = username.trim().length > 0 && password.length > 0 && !isSubmitting;

  function finalizeLogin(session: PendingSession, mustChangePassword: boolean) {
    setActiveSession({ ...session, homeLocation: session.roleCode === 'ADMIN' ? 'HQ' : 'SITE', mustChangePassword });
    setPassword('');
    if (onLogin) onLogin();
    else if (onEnter) onEnter();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    setErrorMessage('');

    let res: Response;
    try {
      res = await fetch('/api/v1/cmms/user-security/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
    } catch {
      setIsSubmitting(false);
      setErrorMessage('Network error — please try again.');
      return;
    }

    const data: LoginSuccessResponse | LoginFailureResponse = await res.json();
    if (!res.ok || !data.success) {
      setIsSubmitting(false);
      setErrorMessage(!data.success ? LOGIN_FAILURE_MESSAGES[data.error] : 'Login failed.');
      return;
    }

    setIsSubmitting(false);
    const session: PendingSession = { employeeId: data.employeeId, roleCode: data.roleCode, permissions: data.permissions };
    if (data.mustChangePassword) {
      setPendingSession(session);
      setStep('CHANGE_PASSWORD');
      return;
    }
    finalizeLogin(session, false);
  }

  function handleSelectFromDirectory(selectedUsername: string) {
    setUsername(selectedUsername);
    setErrorMessage('');
    passwordInputRef.current?.focus();
  }

  function toggleUsernameMode() {
    setUsernameMode((m) => (m === 'DIRECTORY' ? 'MANUAL' : 'DIRECTORY'));
    setUsername('');
    setErrorMessage('');
  }

  return (
    <div className="gateway-root">
      <style>{LOGIN_GATEWAY_STYLES}</style>
      <style>{LOGIN_GATEWAY_DROPDOWN_STYLES}</style>

      <div className="window">
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
          <div className="photo-column">
            <div className="photo-frame">
              <img src="/images/nias_aerial.png" alt="Nias LNG Terminal" className="site-photo" />
            </div>
          </div>

          <div className="form-column">
          <div className="company-caption">BERKAT SAMUDRA GEMILANG LINES</div>
          <div className="logo-frame">
            {!imgError ? (
              <img
                src="/images/bsg-lines-logo.png"
                alt="Company logo"
                className="company-logo"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="logo-placeholder">LOGO</div>
            )}
          </div>

          <div className="login-stage">
            {step === 'LOGIN' && (
              <form onSubmit={handleSubmit} className="stage-form">
                <label className="field-label" htmlFor="login-user-field">&gt; USER</label>
                {usernameMode === 'DIRECTORY' ? (
                  <UserDropdownSelect
                    id="login-user-field"
                    options={directory}
                    value={username}
                    onSelect={handleSelectFromDirectory}
                    isLoading={directoryLoading}
                  />
                ) : (
                  <input
                    id="login-user-field"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username (Admin sign-in)"
                    autoComplete="username"
                    disabled={isSubmitting}
                    className={`${SUNKEN_INPUT} w-full`}
                  />
                )}

                <label className="field-label" htmlFor="login-password-field">&gt; PASSWORD</label>
                <input
                  id="login-password-field"
                  ref={passwordInputRef}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  className={`${SUNKEN_INPUT} w-full`}
                />

                <button type="submit" disabled={!canSubmit} className={BEVEL_BUTTON}>
                  {isSubmitting ? 'LOGGING IN...' : 'LOG IN'}
                </button>

                <div className="error-line">{errorMessage || ' '}</div>

                <button type="button" className="mode-toggle-link" onClick={toggleUsernameMode}>
                  {usernameMode === 'DIRECTORY' ? 'Sign in with another account' : 'Back to account list'}
                </button>
              </form>
            )}

            {step === 'CHANGE_PASSWORD' && pendingSession && (
              <PasswordChangeGate onSuccess={() => finalizeLogin(pendingSession, false)} />
            )}
          </div>
          </div>
        </div>

        <div className="status-bar">
          <span>PORTAL v2.5.0-CMMS</span>
          <span className="ready-indicator">⦿ SESSION STANDBY</span>
        </div>
      </div>
    </div>
  );
}
