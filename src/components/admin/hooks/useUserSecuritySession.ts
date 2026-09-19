// src/components/admin/hooks/useUserSecuritySession.ts
//
// PURPOSE
//   Stage 1 로그인 쿠키는 httpOnly라 클라이언트 JS에서 직접 읽을 수 없다 —
//   PersonnelManagementView.tsx가 "role_code==='ADMIN'일 때만 렌더링"하려면
//   서버가 쿠키를 검증한 결과만 내려주는 /api/v1/cmms/user-security/session을
//   불러야 한다. 이 값은 UX 게이트일 뿐 실제 보안 경계는 각 API 라우트의
//   서버 사이드 재검증(Stage 1C)이다.

import { useEffect, useState } from 'react';

export type Stage1RoleCode = 'ADMIN' | 'SITE_MANAGER' | 'OP_TEAM' | 'HSSE' | 'MAINTENANCE' | 'LOGISTIC' | 'HR';

export interface UserSecuritySessionInfo {
  authenticated: boolean;
  roleCode?: Stage1RoleCode;
  employeeId?: string;
}

export type SessionLoadState = 'LOADING' | 'READY';

export function useUserSecuritySession(): { state: SessionLoadState; session: UserSecuritySessionInfo } {
  const [state, setState] = useState<SessionLoadState>('LOADING');
  const [session, setSession] = useState<UserSecuritySessionInfo>({ authenticated: false });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/v1/cmms/user-security/session', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json: UserSecuritySessionInfo) => {
        if (!cancelled) {
          setSession(json);
          setState('READY');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSession({ authenticated: false });
          setState('READY');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { state, session };
}
