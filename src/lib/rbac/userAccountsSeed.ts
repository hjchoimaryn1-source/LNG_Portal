// src/lib/rbac/userAccountsSeed.ts
//
// TS 정적 미러 — src/db/seeds/002_user_accounts.sql(CMMS_Architecture.md §3.5.2 확장)을
// 그대로 옮긴 in-memory 데이터셋. rolePermissionService.ts와 동일한 이유로 실제 DB가
// 없어(better-sqlite3 등 런타임 드라이버 미설치, PART A 재검증 결과 동일) 라이브 쿼리 대신
// LoginGateway.tsx의 Quick-Login 카드가 이 배열을 직접 읽는다.
// 시드 SQL 파일 내용이 바뀌면 이 배열도 함께 갱신해야 한다.
//
// DEV-ONLY: password_hash 컬럼 및 검증 로직은 Phase 1에서 의도적으로 생략한다
// (클릭-투-로그인). 프로덕션 반영 전 반드시 교체할 것 — CMMS_Architecture.md §3.5 참조.

import type { RoleCode } from '../../types/rbac';

export interface UserAccountSeedRow {
  userId: string;
  displayName: string;
  email: string;
  roleCode: RoleCode;
  homeLocation: 'HQ' | 'SITE';
  mfaEnabled: boolean;
  /** Operation Manpower Roster.csv 실사 대조 완료 여부 (PART A 재검증, 2026-09-11). */
  isRosterVerified: boolean;
}

export const USER_ACCOUNTS: UserAccountSeedRow[] = [
  {
    userId: 'BSG259529',
    displayName: 'Edi Hermawan',
    // DEV-ONLY placeholder — 로스터 CSV에 email 컬럼이 없어 실제 이메일 소스 없음.
    email: 'bsg259529@dev.nias-lng.local',
    roleCode: 'SITE_MANAGER',
    homeLocation: 'SITE',
    mfaEnabled: false,
    isRosterVerified: true,
  },
  {
    userId: 'BSG259524',
    displayName: 'Shadiq M. Shalih',
    email: 'bsg259524@dev.nias-lng.local',
    roleCode: 'OPERATION_TEAM_LEADER',
    homeLocation: 'SITE',
    mfaEnabled: false,
    isRosterVerified: true,
  },
  {
    // Operation Manpower Roster.csv(22개 인력 행)에 "Choi Hong-joon" 매칭 행 없음
    // (PART A 재검증, 2026-09-11) — 현장 운영 인력이 아닌 개발자 계정으로 판단하여
    // 로스터 ID 포맷(BSGxxxxxx) 대신 명시적 DEV ID를 부여한다.
    userId: 'DEV-HQ-001',
    displayName: 'Choi Hong-joon',
    email: 'dev-hq-001@dev.nias-lng.local',
    roleCode: 'SYSTEM_ADMIN',
    homeLocation: 'HQ',
    mfaEnabled: false,
    isRosterVerified: false,
  },
];
