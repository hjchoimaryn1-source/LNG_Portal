-- ============================================================================
-- Phase 10 — Stage 2C: System-Level Safety Asset Nodes (additive, idempotent)
-- SSOT: NP-05 §2.1 criticality definition (CRITICAL for ESD/Fire&Gas/PSV).
-- 근거: docs/phase10-stage1d-np05-pm-mapping-proposal.md Items 6/7/8 —
--   PSV/ESD/Fire&Gas는 assets에 컴포넌트 레벨 행이 없어 pm_schedules FK를
--   걸 대상이 없었다(proxy-tag 미결). 이 3개 최상위 논리 그룹 노드가 그 proxy다.
--
-- parent_tag 없는 최상위 그룹(assets.parent_tag는 nullable, self-FK).
-- iso_14224_class='SAFETY_SYSTEM', location_area='PLANT_WIDE'는 이 3개 노드가
-- 특정 물리 위치에 속한 개별 장비가 아니라 플랜트 전역 논리 그룹이라 채택한
-- 값 — HJ 검토 필요(Stage2 최종 보고서 참고).
-- ============================================================================

INSERT OR IGNORE INTO assets (
    equipment_tag, asset_name, iso_14224_class, kks_code, criticality, location_area, status, parent_tag
) VALUES
    ('NIAS-90-SYS-ESD', 'Safety & ESD System', 'SAFETY_SYSTEM', '90SYSESD', 'CRITICAL', 'PLANT_WIDE', 'OPERATIONAL', NULL),
    ('NIAS-90-SYS-FG',  'Fire & Gas Detection System', 'SAFETY_SYSTEM', '90SYSFG',  'CRITICAL', 'PLANT_WIDE', 'OPERATIONAL', NULL),
    ('NIAS-90-SYS-PSV', 'Pressure Safety Valve Group', 'SAFETY_SYSTEM', '90SYSPSV', 'CRITICAL', 'PLANT_WIDE', 'OPERATIONAL', NULL);
