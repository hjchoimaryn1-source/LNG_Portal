// src/adapters/ptwSignatureGate.ts
//
// PURPOSE
//   SSHQE §4.2 서명 체계 판정 순수 함수 계층. React 바인딩 없음 —
//   usePTWPermits.transitionStatus()와 PTWStatusActions.tsx(버튼 disabled
//   선반영) 양쪽에서 재사용한다. O2/LEL/ERT 게이트(usePTWPermits.ts에 이미
//   존재)와는 독립적으로 합성만 되며, 이 파일은 서명 완료 여부만 판정한다.

import { PTWPermit, PTWSignatureRole, PTWWorkflowStatus } from '../types/lng';
import { PTW_TRANSITION_REQUIRED_ROLES } from '../data/ptwSignatureRoles';

export function hasSignedRole(permit: PTWPermit, role: PTWSignatureRole): boolean {
  return (permit.signatures || []).some((s) => s.role === role);
}

export function getMissingRoles(permit: PTWPermit, targetStatus: PTWWorkflowStatus): PTWSignatureRole[] {
  const requiredRoles = PTW_TRANSITION_REQUIRED_ROLES[targetStatus] || [];
  return requiredRoles.filter((role) => !hasSignedRole(permit, role));
}

export interface SignatureGateResult {
  allowed: boolean;
  missingRoles: PTWSignatureRole[];
}

export function evaluateSignatureGate(permit: PTWPermit, targetStatus: PTWWorkflowStatus): SignatureGateResult {
  const missingRoles = getMissingRoles(permit, targetStatus);
  return { allowed: missingRoles.length === 0, missingRoles };
}
