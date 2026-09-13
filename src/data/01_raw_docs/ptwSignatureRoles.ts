// src/data/ptwSignatureRoles.ts
// SSHQE §4.2 PTW 5단계 라이프사이클 서명 체계 — 역할 라벨 및 상태 전이별
// 필요 서명 매핑. PART A(Description)/PART B(Preparation)는 서명이 아닌
// 문서 첨부만 요구하므로 DRAFT/PREPARED 전이는 이 매핑에 없다(= 서명 불필요).

import { PTWSignatureRole, PTWWorkflowStatus } from '../../types/lng';

export const PTW_SIGNATURE_ROLE_LABELS: Record<PTWSignatureRole, string> = {
  AUTHORIZER_APPROVE: 'Permit Authorizer (승인권자) — 승인',
  RESPONSIBLE_PERSON_APPROVE: 'Responsible Person (현장 책임자) — 확인',
  ISSUER_ACTIVATE: 'Permit Issuer (발행권자) — 발행/활성화',
  WORK_LEADER_ACCEPT: 'Work Leader (작업 리더) — 인수',
  SITE_CHECKER_ACTIVATE: 'Site Checker / FSO (현장 안전 확인원) — 활성화',
  WORK_LEADER_RETURN: 'Work Leader (작업 리더) — 반납',
  SITE_CHECKER_VERIFY: 'Site Checker / FSO (현장 안전 확인원) — 검증',
  ISSUER_ACCEPT_RETURN: 'Permit Issuer (발행권자) — 반납 인수',
  AUTHORIZER_CLOSE: 'Permit Authorizer (승인권자) — 최종 폐쇄 승인',
};

/**
 * 목표 상태(targetStatus)로 전이하기 위해 사전에 완료되어야 하는 서명 역할
 * 목록. DRAFT/PREPARED는 매핑에 없으므로 evaluateSignatureGate()가 빈
 * 배열([])로 취급 — 즉 서명 없이 전이 가능.
 */
export const PTW_TRANSITION_REQUIRED_ROLES: Partial<Record<PTWWorkflowStatus, PTWSignatureRole[]>> = {
  // PART C: Approval
  APPROVED: ['AUTHORIZER_APPROVE', 'RESPONSIBLE_PERSON_APPROVE'],
  // PART D: Issue & Activation
  ACTIVE: ['ISSUER_ACTIVATE', 'WORK_LEADER_ACCEPT', 'SITE_CHECKER_ACTIVATE'],
  // PART E: Return & Close-out
  CLOSED: ['WORK_LEADER_RETURN', 'SITE_CHECKER_VERIFY', 'ISSUER_ACCEPT_RETURN', 'AUTHORIZER_CLOSE'],
};
