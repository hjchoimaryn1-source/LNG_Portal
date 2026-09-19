// src/app/admin/personnel/page.tsx
//
// PURPOSE
//   Stage 1D 진입점. 기존 포털은 src/app/page.tsx 하나가 LNGPortalApp.tsx의
//   내부 activeKey 상태로 화면을 전환하는 SPA 구조라, 레거시 SubProcessKey/
//   SIDEBAR_SECTIONS/isNavItemVisible(ActiveSession 기반) 파이프라인에 얹지
//   않고 독립된 Next.js App Router 경로로 노출한다 — 최종 보고서의 세 번째
//   어휘 충돌(Stage 1 role_code vs 레거시 RoleCode) 재발을 피하기 위한
//   의도적 선택이다. 사이드바에서 링크로 연결하는 작업은 별도 승인 대상으로
//   남겨둔다.

import PersonnelManagementView from '../../../components/admin/PersonnelManagementView';

export default function AdminPersonnelPage() {
  return <PersonnelManagementView />;
}
