// src/components/admin/modals/AccountPanelModal.tsx
//
// PURPOSE
//   한 인력의 로그인 계정 상태(존재 여부/role_code/account_status)를 보여주고
//   생성/역할변경/잠금-해제/비밀번호 리셋 액션을 제공한다. 생성/리셋 시
//   1회성으로 내려오는 임시 비밀번호는 이 모달에서만 표시하고 어디에도
//   저장하지 않는다 — 닫으면 사라진다(재확인 불가, 다시 리셋해야 함).

'use client';

import { useState } from 'react';
import { RAISED_PANEL, SUNKEN_INPUT, BEVEL_BUTTON, TITLE_BAR } from '../../cmms/scadaStyles';
import type { PersonnelRecord } from '../hooks/usePersonnelList';
import type { UserAccountRecord } from '../hooks/useAccountAdmin';
import type { Stage1RoleCode } from '../hooks/useUserSecuritySession';

const ROLE_CODES: Stage1RoleCode[] = ['ADMIN', 'SITE_MANAGER', 'OP_TEAM', 'HSSE', 'MAINTENANCE', 'LOGISTIC', 'HR'];

export interface AccountPanelModalProps {
  person: PersonnelRecord;
  account: UserAccountRecord | undefined;
  onClose: () => void;
  onCreate: (employeeId: string, username: string, roleCode: Stage1RoleCode) => Promise<{ tempPassword?: string; error?: string }>;
  onChangeRole: (accountId: string, roleCode: Stage1RoleCode) => Promise<{ error?: string }>;
  onLock: (accountId: string) => Promise<{ error?: string }>;
  onUnlock: (accountId: string) => Promise<{ error?: string }>;
  onResetPassword: (accountId: string) => Promise<{ tempPassword?: string; error?: string }>;
}

export default function AccountPanelModal({
  person,
  account,
  onClose,
  onCreate,
  onChangeRole,
  onLock,
  onUnlock,
  onResetPassword,
}: AccountPanelModalProps) {
  const [username, setUsername] = useState('');
  const [roleCode, setRoleCode] = useState<Stage1RoleCode>('OP_TEAM');
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<{ tempPassword?: string; error?: string }>) {
    setError(null);
    const result = await action();
    if (result.error) setError(result.error);
    if (result.tempPassword) setRevealedPassword(result.tempPassword);
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className={`${RAISED_PANEL} max-w-md w-full`}>
        <div className={`${TITLE_BAR} flex justify-between items-center`}>
          <span>계정 관리 — {person.fullName} ({person.employeeId})</span>
          <button onClick={onClose} className="text-white/80 hover:text-white">✕</button>
        </div>
        <div className="p-4 space-y-2">
          {error && <div className="text-[11px] text-red-600 font-bold">{error}</div>}
          {revealedPassword && (
            <div className="text-[12px] font-mono bg-yellow-50 border border-yellow-500 p-2">
              임시 비밀번호(1회 표시, 다시 볼 수 없음): <strong>{revealedPassword}</strong>
            </div>
          )}

          {!account ? (
            <>
              <div className="text-[11px] text-slate-600">이 인력에게는 아직 로그인 계정이 없습니다.</div>
              <label className="block text-[11px] font-bold text-slate-700">Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} className={`${SUNKEN_INPUT} w-full`} />
              <label className="block text-[11px] font-bold text-slate-700">Role</label>
              <select value={roleCode} onChange={(e) => setRoleCode(e.target.value as Stage1RoleCode)} className={`${SUNKEN_INPUT} w-full`}>
                {ROLE_CODES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <button
                className={BEVEL_BUTTON}
                onClick={() => run(() => onCreate(person.employeeId, username.trim(), roleCode))}
                disabled={!username.trim()}
              >
                계정 생성
              </button>
            </>
          ) : (
            <>
              <div className="text-[12px] space-y-1">
                <div>Username: <strong>{account.username}</strong></div>
                <div>Role: <strong>{account.roleCode}</strong></div>
                <div>Status: <strong>{account.accountStatus}</strong></div>
                <div>Must Change Password: {account.mustChangePassword ? 'YES' : 'no'}</div>
                <div>Last Login: {account.lastLoginAt ?? '-'}</div>
              </div>

              <label className="block text-[11px] font-bold text-slate-700 pt-2">Change Role</label>
              <div className="flex gap-2">
                <select value={roleCode} onChange={(e) => setRoleCode(e.target.value as Stage1RoleCode)} className={`${SUNKEN_INPUT} flex-1`}>
                  {ROLE_CODES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <button className={BEVEL_BUTTON} onClick={() => run(() => onChangeRole(account.accountId, roleCode))}>
                  적용
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                {account.accountStatus === 'LOCKED' ? (
                  <button className={BEVEL_BUTTON} onClick={() => run(() => onUnlock(account.accountId))}>잠금 해제</button>
                ) : (
                  <button className={BEVEL_BUTTON} onClick={() => run(() => onLock(account.accountId))}>계정 잠금</button>
                )}
                <button className={BEVEL_BUTTON} onClick={() => run(() => onResetPassword(account.accountId))}>
                  비밀번호 리셋
                </button>
              </div>
            </>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-300 mt-2">
            <button onClick={onClose} className={BEVEL_BUTTON}>닫기</button>
          </div>
        </div>
      </div>
    </div>
  );
}
