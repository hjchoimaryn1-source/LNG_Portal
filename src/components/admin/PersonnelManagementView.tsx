// src/components/admin/PersonnelManagementView.tsx
//
// PURPOSE
//   Stage 1D 인력 관리(Personnel Management) 탭 진입점. role_code==='ADMIN'
//   여부는 여기서 클라이언트 사이드로만 확인한다 — 실제 보안 경계는 Stage 1C의
//   모든 라우트가 독립적으로 재검증하는 서버 사이드 체크다(지시 원문). 이
//   화면은 그 서버 체크를 우회할 수 없고, 단지 UX상 비-관리자에게 빈 화면
//   대신 안내 문구를 보여줄 뿐이다.
//
//   이 탭은 기존 SIDEBAR_SECTIONS(레거시 ActiveSession/RoleCode 기반 nav
//   게이트)에는 아직 연결하지 않는다 — Stage 1의 role_code 어휘(ADMIN 등)는
//   레거시 RoleCode(SYSTEM_ADMIN 등)와 다시 한번 겹치지 않는 별개 체계이고,
//   이를 기존 SidebarSectionDef.visible(session: ActiveSession | null) 계약에
//   강제로 끼워 맞추면 이전에 flag한 것과 동일한 어휘 충돌이 재발한다. 진입은
//   당분간 이 컴포넌트를 직접 마운트하는 별도 경로로 한다(최종 보고서 참조).

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';
import { RAISED_PANEL, TITLE_BAR, BEVEL_BUTTON, BEVEL_BUTTON_PRESSED } from '../cmms/scadaStyles';
import { useUserSecuritySession } from './hooks/useUserSecuritySession';
import PersonnelListTab from './tabs/PersonnelListTab';
import AuditLogTab from './tabs/AuditLogTab';

type InnerTab = 'PERSONNEL' | 'AUDIT_LOG';

export default function PersonnelManagementView() {
  const { state, session } = useUserSecuritySession();
  const [tab, setTab] = useState<InnerTab>('PERSONNEL');

  if (state === 'LOADING') {
    return <div className="p-4 text-[12px] text-slate-500">Checking session...</div>;
  }

  if (!session.authenticated || session.roleCode !== 'ADMIN') {
    return (
      <div className={`${RAISED_PANEL} m-4 p-4 text-[12px] text-red-700 font-bold`}>
        접근 권한이 없습니다 (ADMIN 전용). Personnel Management requires an ADMIN
        session — please log in via /api/v1/cmms/user-security/login with an
        administrator account.
      </div>
    );
  }

  return (
    <div className="p-2 space-y-2">
      <div className={`${TITLE_BAR}`}>인력 관리 (Personnel Management)</div>
      <div className="flex items-center justify-between gap-1">
        <div className="flex gap-1">
          <button className={tab === 'PERSONNEL' ? BEVEL_BUTTON_PRESSED : BEVEL_BUTTON} onClick={() => setTab('PERSONNEL')}>
            인력 / 계정
          </button>
          <button className={tab === 'AUDIT_LOG' ? BEVEL_BUTTON_PRESSED : BEVEL_BUTTON} onClick={() => setTab('AUDIT_LOG')}>
            감사 로그
          </button>
        </div>
        {/* /admin/personnel은 메인 SPA(activeKey 상태머신) 밖의 독립 App Router
            경로라, 대시보드로 되돌아갈 방법이 브라우저 뒤로가기뿐이었다 — 사이드바
            "Personnel Management" 링크(SidebarSectorListView.tsx)의 역방향. */}
        <Link href="/" className={`${BEVEL_BUTTON} flex items-center gap-1`}>
          <LayoutDashboard className="w-3.5 h-3.5" />
          대시보드로 돌아가기
        </Link>
      </div>
      {tab === 'PERSONNEL' ? <PersonnelListTab /> : <AuditLogTab />}
    </div>
  );
}
