// src/utils/relieverCandidates.ts
//
// PURPOSE
//   Rule-based delegation & eligible reliever candidate generation — 순수 함수 (React
//   미의존, AGENTS.md §3 Logic/Data Layer 컨벤션). Phase 13 Target B Sub-stage C:
//   extracted verbatim from manningCompliance.ts (250-line cap cleanup, logic move only,
//   no behavior change).

import { StaffPersonnel } from '../types/lng';

export interface RelieverCandidateItem {
  staff: StaffPersonnel;
  label: string;
  isPrimary: boolean;
}

/**
 * Rule-Based Delegation & Eligible Reliever Candidate Generator
 */
export function getEligibleRelieverCandidates(
  targetStaff: StaffPersonnel,
  manpowerData: StaffPersonnel[]
): RelieverCandidateItem[] {
  const targetRole = targetStaff.role;
  const targetDept = targetStaff.department;
  const candidates: RelieverCandidateItem[] = [];

  // Rule 1: Site Manager (EMP-001) -> Sr. OP Team Leader as Primary Acting Delegate
  if (targetStaff.id === 'EMP-001' || targetRole === 'Site Manager') {
    const shadiq = manpowerData.find((m) => m.id === 'EMP-002');
    if (shadiq) {
      candidates.push({
        staff: shadiq,
        label: `${shadiq.name} (Acting Site Manager - Primary Delegate)`,
        isPrimary: true,
      });
    }
    manpowerData
      .filter((m) => m.id !== 'EMP-001' && m.id !== 'EMP-002' && m.role.includes('OP Team Leader'))
      .forEach((m) => {
        candidates.push({
          staff: m,
          label: `${m.name} (OP Team Leader - Secondary Delegate)`,
          isPrimary: false,
        });
      });
    return candidates;
  }

  // Rule 2: Sr. OP Team Leader (EMP-002) -> Other OP Team Leaders as Rotation Relievers
  if (targetStaff.id === 'EMP-002') {
    manpowerData
      .filter((m) => m.id !== 'EMP-002' && m.role.includes('OP Team Leader'))
      .forEach((m) => {
        candidates.push({
          staff: m,
          label: `${m.name} (OP Team Leader - Rotation Reliever)`,
          isPrimary: true,
        });
      });
    manpowerData
      .filter((m) => m.role.includes('DCS'))
      .forEach((m) => {
        candidates.push({
          staff: m,
          label: `${m.name} (DCS Control Technician - Shift Lead Delegate)`,
          isPrimary: false,
        });
      });
    return candidates;
  }

  // Rule 3: OP Team Leaders (Asman, Juli) -> Other Team Leaders or Sr. DCS Control Technicians
  if (targetRole.includes('OP Team Leader')) {
    manpowerData
      .filter((m) => m.id !== targetStaff.id && (m.role.includes('OP Team Leader') || m.id === 'EMP-002'))
      .forEach((m) => {
        candidates.push({
          staff: m,
          label: `${m.name} (OP Team Leader Pool)`,
          isPrimary: true,
        });
      });
    manpowerData
      .filter((m) => m.role.includes('DCS'))
      .forEach((m) => {
        candidates.push({
          staff: m,
          label: `${m.name} (DCS Control Technician - Shift Lead Delegate)`,
          isPrimary: false,
        });
      });
    return candidates;
  }

  // Rule 4: Field Operator -> Only Field Operator & DCS Control Technician Pool
  if (targetRole.includes('Field Operator')) {
    manpowerData
      .filter((m) => m.id !== targetStaff.id && (m.role.includes('Field Operator') || m.role.includes('DCS')))
      .forEach((m) => {
        candidates.push({
          staff: m,
          label: `${m.name} (${m.role} • ${m.teamName})`,
          isPrimary: true,
        });
      });
    return candidates;
  }

  // Rule 5: DCS Control Technician -> Same Operations DCS / Operator Pool
  if (targetRole.includes('DCS Control Technician')) {
    manpowerData
      .filter((m) => m.id !== targetStaff.id && (m.role.includes('DCS') || m.role.includes('Field Operator')))
      .forEach((m) => {
        candidates.push({
          staff: m,
          label: `${m.name} (${m.role} • ${m.teamName})`,
          isPrimary: true,
        });
      });
    return candidates;
  }

  // Rule 6: HSSE Team -> Direct mutual cross-rotation (Arsyan AN <-> Chandra R.D)
  if (targetDept === 'HSSE' || targetRole.includes('HSE')) {
    manpowerData
      .filter((m) => m.id !== targetStaff.id && (m.department === 'HSSE' || m.role.includes('HSE')))
      .forEach((m) => {
        candidates.push({
          staff: m,
          label: `${m.name} (${m.role} - Direct HSSE Cross-Rotation)`,
          isPrimary: true,
        });
      });
    return candidates;
  }

  // Rule 7: Maintenance, Logistics, HR/GA -> Same department acting/reliever pool
  manpowerData
    .filter((m) => m.id !== targetStaff.id && m.department === targetDept)
    .forEach((m) => {
      candidates.push({
        staff: m,
        label: `${m.name} (${m.role} • ${m.teamName})`,
        isPrimary: true,
      });
    });

  return candidates;
}
