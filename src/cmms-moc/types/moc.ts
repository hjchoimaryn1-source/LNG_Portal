// src/cmms-moc/types/moc.ts
//
// Pure domain types for the NP-12 Management of Change (MOC) module.
// No imports from outside this file (mirrors src/cmms-environment/types/environment.ts
// isolation rule) — dao/service files import these, never the other way.

export type ChangeType = 'PERMANENT' | 'TEMPORARY';
export type MocStatus = 'DRAFT' | 'PENDING_SM_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface PlanOfChange {
  docNo: string;
  responsibleTeam: string;
  objectOfChange: string;
  purposeReason: string;
  changeType: ChangeType;
  proposedTimeScale: string | null;
  relatedProceduresForms: string | null;
  mitigationSummary: string | null;
  initialRiskDate: string | null;
  initialRiskDocNo: string | null;
  initialRiskAssessedBy: string | null;
  initialRiskRating: number | null;
  improvementSummary: string | null;
  reassessmentDate: string | null;
  reassessmentRiskRating: number | null;
  manualsToUpdate: string | null;
  teamsAffected: string | null;
  trainingObject: string | null;
  trainingImplementation: string | null;
  estimatedCost: number | null;
  estimatedCommenceDate: string | null;
  targetedCompletionDate: string | null;
  status: MocStatus;
  drawnUpBy: string | null;
  reviewedBy: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
}

export interface NewPlanOfChangeInput {
  docNo: string;
  responsibleTeam: string;
  objectOfChange: string;
  purposeReason: string;
  changeType: ChangeType;
  proposedTimeScale?: string | null;
  relatedProceduresForms?: string | null;
  mitigationSummary?: string | null;
  initialRiskDate?: string | null;
  initialRiskDocNo?: string | null;
  initialRiskAssessedBy?: string | null;
  initialRiskRating?: number | null;
  improvementSummary?: string | null;
  reassessmentDate?: string | null;
  reassessmentRiskRating?: number | null;
  manualsToUpdate?: string | null;
  teamsAffected?: string | null;
  trainingObject?: string | null;
  trainingImplementation?: string | null;
  estimatedCost?: number | null;
  estimatedCommenceDate?: string | null;
  targetedCompletionDate?: string | null;
  status?: MocStatus;
  drawnUpBy?: string | null;
  reviewedBy?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
}

export interface CompletionReport {
  docNo: string;
  planOfChangeDocNo: string;
  responsibleTeam: string;
  permanentOrTemporary: ChangeType;
  additionalMitigation: string | null;
  finalRiskAssessmentResult: string | null;
  trainingCompleted: boolean;
  processSummary: string | null;
  communicationDetails: string | null;
  manualsUpdated: boolean;
  commenceDate: string | null;
  completionDate: string | null;
  extensionType: string | null;
  extensionPlannedDate: string | null;
  extensionTargetedDate: string | null;
  reviewProcedureFollowed: boolean;
  reviewCompletedWithinTimescale: boolean;
  reviewRiskMeasuresTaken: boolean;
  reviewManualsUpdated: boolean;
  reviewObjectiveMet: boolean;
  reviewProcessEffective: boolean;
  reviewNotes: string | null;
  drawnUpBy: string | null;
  reviewedBy: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
}

export interface NewCompletionReportInput {
  docNo: string;
  planOfChangeDocNo: string;
  responsibleTeam: string;
  permanentOrTemporary: ChangeType;
  additionalMitigation?: string | null;
  finalRiskAssessmentResult?: string | null;
  trainingCompleted?: boolean;
  processSummary?: string | null;
  communicationDetails?: string | null;
  manualsUpdated?: boolean;
  commenceDate?: string | null;
  completionDate?: string | null;
  extensionType?: string | null;
  extensionPlannedDate?: string | null;
  extensionTargetedDate?: string | null;
  reviewProcedureFollowed?: boolean;
  reviewCompletedWithinTimescale?: boolean;
  reviewRiskMeasuresTaken?: boolean;
  reviewManualsUpdated?: boolean;
  reviewObjectiveMet?: boolean;
  reviewProcessEffective?: boolean;
  reviewNotes?: string | null;
  drawnUpBy?: string | null;
  reviewedBy?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
}
