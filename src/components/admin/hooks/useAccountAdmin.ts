// src/components/admin/hooks/useAccountAdmin.ts
//
// PURPOSE
//   user_accounts 목록/생성/역할변경/잠금-해제/비밀번호 리셋 — Stage 1C
//   /api/v1/cmms/user-security/accounts 라우트의 클라이언트 측 데이터 계층.
//   생성/리셋 응답에 실리는 임시 비밀번호는 이 훅을 부른 화면(AccountPanelModal)
//   이 1회성으로 표시만 하고 어디에도 저장하지 않는다.

import { useCallback, useEffect, useState } from 'react';
import type { Stage1RoleCode } from './useUserSecuritySession';

const ACCOUNTS_API = '/api/v1/cmms/user-security/accounts';

export interface UserAccountRecord {
  accountId: string;
  employeeId: string;
  username: string;
  roleCode: Stage1RoleCode;
  accountStatus: string;
  failedAttemptCount: number;
  lockedUntil: string | null;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
}

export function useAccountAdmin() {
  const [accounts, setAccounts] = useState<UserAccountRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    fetch(ACCOUNTS_API, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json: { success: boolean; records?: UserAccountRecord[] }) => {
        if (json.success && json.records) setAccounts(json.records);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function findByEmployeeId(employeeId: string): UserAccountRecord | undefined {
    return accounts.find((a) => a.employeeId === employeeId);
  }

  async function createAccount(
    employeeId: string,
    username: string,
    roleCode: Stage1RoleCode
  ): Promise<{ tempPassword?: string; error?: string }> {
    const res = await fetch(ACCOUNTS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, username, roleCode }),
    });
    const json = await res.json();
    if (!json.success) return { error: json.error ?? 'Failed to create account.' };
    refresh();
    return { tempPassword: json.tempPassword };
  }

  async function patchAccount(
    accountId: string,
    body: { action: 'CHANGE_ROLE'; roleCode: Stage1RoleCode } | { action: 'LOCK' } | { action: 'UNLOCK' } | { action: 'RESET_PASSWORD' }
  ): Promise<{ tempPassword?: string; error?: string }> {
    const res = await fetch(ACCOUNTS_API, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, ...body }),
    });
    const json = await res.json();
    if (!json.success) return { error: json.error ?? 'Action failed.' };
    refresh();
    return { tempPassword: json.tempPassword };
  }

  return {
    accounts,
    loading,
    findByEmployeeId,
    createAccount,
    changeRole: (accountId: string, roleCode: Stage1RoleCode) => patchAccount(accountId, { action: 'CHANGE_ROLE', roleCode }),
    lockAccount: (accountId: string) => patchAccount(accountId, { action: 'LOCK' }),
    unlockAccount: (accountId: string) => patchAccount(accountId, { action: 'UNLOCK' }),
    resetPassword: (accountId: string) => patchAccount(accountId, { action: 'RESET_PASSWORD' }),
  };
}
