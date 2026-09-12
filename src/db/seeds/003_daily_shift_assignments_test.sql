-- TEST DATA ONLY: synthetic rows for guardrail validation, not real attendance records.
-- Replace with real data ingestion before production.
--
-- Seed: daily_shift_assignments (CMMS_Architecture.md §3.4)
-- Covers 3 dev accounts seeded in src/db/seeds/002_user_accounts.sql
-- (BSG259529, BSG259524, DEV-HQ-001). Rows are hand-crafted to exercise each
-- checkFatigueBlock rule in src/lib/rbac/fatigueGuardrail.ts exactly once, plus
-- one clean (no-violation) case. Mirrored 1:1 in
-- src/lib/rbac/dailyShiftAssignmentsSeed.ts, which is what actually runs at
-- runtime (no live DB driver in this repo — see that file's header).
--
-- Test cases:
--   BSG259529 / 2026-09-05  -> clean case, checkFatigueBlock returns blocked:false
--   BSG259529 / 2026-09-10  -> Rule 1 violation (consecutive_days=14 >= limit)
--   BSG259524 / 2026-09-09  -> Rule 2 violation (preceding day's rest_hours_prior_24h=6 < 10)
--   DEV-HQ-001 / 2026-09-11 -> Rule 3 violation (both D and N rows same shift_date)

INSERT INTO daily_shift_assignments (user_id, shift_date, shift_type, hours_worked, rest_hours_prior_24h, consecutive_days) VALUES
('BSG259529', '2026-09-05', 'D', 12.0, 14.0, 5),
('BSG259529', '2026-09-09', 'D', 12.0, 11.0, 13),
('BSG259529', '2026-09-10', 'D', 12.0, 11.0, 14),
('BSG259524', '2026-09-08', 'N', 12.0, 6.0, 3),
('BSG259524', '2026-09-09', 'D', 12.0, 11.0, 4),
('DEV-HQ-001', '2026-09-11', 'D', 8.0, 12.0, 2),
('DEV-HQ-001', '2026-09-11', 'N', 8.0, 12.0, 2);
