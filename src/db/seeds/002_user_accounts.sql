-- Seed: user_accounts (CMMS_Architecture.md §3.5.2 확장)
-- Phase 1 Quick-Login 대상 3계정. Operation Manpower Roster.csv 실사 대조 결과:
--   BSG259529(Edi Hermawan), BSG259524(Shadiq M. Shalih)는 로스터에 실존하는 행이다.
--   "Choi Hong-joon"은 로스터(22개 인력 행) 어디에도 없어 현장 인력이 아닌 개발자
--   계정으로 판단, 로스터 ID 포맷(BSGxxxxxx) 대신 DEV-HQ-001을 부여했다.
-- DEV-ONLY: password_hash는 이번 Phase 1에서 NULL로 시딩한다(클릭-투-로그인,
-- 비밀번호 검증 로직 미구현). email은 로스터 CSV에 컬럼이 없어 DEV-ONLY placeholder다.
-- 이 시드 SQL의 값이 바뀌면 src/lib/rbac/userAccountsSeed.ts(TS 미러)도 함께 갱신해야 한다.

INSERT INTO user_accounts (user_id, email, password_hash, role_code, home_location, mfa_enabled) VALUES
('BSG259529', 'bsg259529@dev.nias-lng.local', NULL, 'SITE_MANAGER', 'SITE', FALSE),
('BSG259524', 'bsg259524@dev.nias-lng.local', NULL, 'OPERATION_TEAM_LEADER', 'SITE', FALSE),
('DEV-HQ-001', 'dev-hq-001@dev.nias-lng.local', NULL, 'SYSTEM_ADMIN', 'HQ', FALSE);
