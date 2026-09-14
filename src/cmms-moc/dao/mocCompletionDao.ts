// src/cmms-moc/dao/mocCompletionDao.ts
//
// PURPOSE
//   Pure DAO for moc_completion_report (NP12-02). SqlExecutor-only, no
//   React/Next binding. Split out of mocDao.ts to respect the 250-line/file
//   cap — mocPlanDao.ts holds the NP12-01 counterpart. Boolean review/summary
//   flags are stored as INTEGER 0/1 (node:sqlite has no BOOLEAN type; mirrors
//   src/db/seeds/004_rbac_approval_schema.sql convention).

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import type { CompletionReport, NewCompletionReportInput } from '../types/moc';

interface CompletionRow {
  doc_no: string;
  plan_of_change_doc_no: string;
  responsible_team: string;
  permanent_or_temporary: string;
  additional_mitigation: string | null;
  final_risk_assessment_result: string | null;
  training_completed: number;
  process_summary: string | null;
  communication_details: string | null;
  manuals_updated: number;
  commence_date: string | null;
  completion_date: string | null;
  extension_type: string | null;
  extension_planned_date: string | null;
  extension_targeted_date: string | null;
  review_procedure_followed: number;
  review_completed_within_timescale: number;
  review_risk_measures_taken: number;
  review_manuals_updated: number;
  review_objective_met: number;
  review_process_effective: number;
  review_notes: string | null;
  drawn_up_by: string | null;
  reviewed_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

function completionRowToRecord(row: CompletionRow): CompletionReport {
  return {
    docNo: row.doc_no,
    planOfChangeDocNo: row.plan_of_change_doc_no,
    responsibleTeam: row.responsible_team,
    permanentOrTemporary: row.permanent_or_temporary as CompletionReport['permanentOrTemporary'],
    additionalMitigation: row.additional_mitigation,
    finalRiskAssessmentResult: row.final_risk_assessment_result,
    trainingCompleted: row.training_completed === 1,
    processSummary: row.process_summary,
    communicationDetails: row.communication_details,
    manualsUpdated: row.manuals_updated === 1,
    commenceDate: row.commence_date,
    completionDate: row.completion_date,
    extensionType: row.extension_type,
    extensionPlannedDate: row.extension_planned_date,
    extensionTargetedDate: row.extension_targeted_date,
    reviewProcedureFollowed: row.review_procedure_followed === 1,
    reviewCompletedWithinTimescale: row.review_completed_within_timescale === 1,
    reviewRiskMeasuresTaken: row.review_risk_measures_taken === 1,
    reviewManualsUpdated: row.review_manuals_updated === 1,
    reviewObjectiveMet: row.review_objective_met === 1,
    reviewProcessEffective: row.review_process_effective === 1,
    reviewNotes: row.review_notes,
    drawnUpBy: row.drawn_up_by,
    reviewedBy: row.reviewed_by,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
  };
}

const INSERT_COMPLETION_SQL = `
  INSERT INTO moc_completion_report (
    doc_no, plan_of_change_doc_no, responsible_team, permanent_or_temporary,
    additional_mitigation, final_risk_assessment_result, training_completed,
    process_summary, communication_details, manuals_updated,
    commence_date, completion_date, extension_type, extension_planned_date, extension_targeted_date,
    review_procedure_followed, review_completed_within_timescale, review_risk_measures_taken,
    review_manuals_updated, review_objective_met, review_process_effective, review_notes,
    drawn_up_by, reviewed_by, approved_by, approved_at
  ) VALUES (
    @docNo, @planOfChangeDocNo, @responsibleTeam, @permanentOrTemporary,
    @additionalMitigation, @finalRiskAssessmentResult, @trainingCompleted,
    @processSummary, @communicationDetails, @manualsUpdated,
    @commenceDate, @completionDate, @extensionType, @extensionPlannedDate, @extensionTargetedDate,
    @reviewProcedureFollowed, @reviewCompletedWithinTimescale, @reviewRiskMeasuresTaken,
    @reviewManualsUpdated, @reviewObjectiveMet, @reviewProcessEffective, @reviewNotes,
    @drawnUpBy, @reviewedBy, @approvedBy, @approvedAt
  )
`;

function toFlag(v: boolean | undefined): number {
  return v ? 1 : 0;
}

export function insertCompletionReport(db: SqlExecutor, input: NewCompletionReportInput): void {
  db.run(INSERT_COMPLETION_SQL, {
    docNo: input.docNo,
    planOfChangeDocNo: input.planOfChangeDocNo,
    responsibleTeam: input.responsibleTeam,
    permanentOrTemporary: input.permanentOrTemporary,
    additionalMitigation: input.additionalMitigation ?? null,
    finalRiskAssessmentResult: input.finalRiskAssessmentResult ?? null,
    trainingCompleted: toFlag(input.trainingCompleted),
    processSummary: input.processSummary ?? null,
    communicationDetails: input.communicationDetails ?? null,
    manualsUpdated: toFlag(input.manualsUpdated),
    commenceDate: input.commenceDate ?? null,
    completionDate: input.completionDate ?? null,
    extensionType: input.extensionType ?? null,
    extensionPlannedDate: input.extensionPlannedDate ?? null,
    extensionTargetedDate: input.extensionTargetedDate ?? null,
    reviewProcedureFollowed: toFlag(input.reviewProcedureFollowed),
    reviewCompletedWithinTimescale: toFlag(input.reviewCompletedWithinTimescale),
    reviewRiskMeasuresTaken: toFlag(input.reviewRiskMeasuresTaken),
    reviewManualsUpdated: toFlag(input.reviewManualsUpdated),
    reviewObjectiveMet: toFlag(input.reviewObjectiveMet),
    reviewProcessEffective: toFlag(input.reviewProcessEffective),
    reviewNotes: input.reviewNotes ?? null,
    drawnUpBy: input.drawnUpBy ?? null,
    reviewedBy: input.reviewedBy ?? null,
    approvedBy: input.approvedBy ?? null,
    approvedAt: input.approvedAt ?? null,
  });
}

export function selectAllCompletionReports(db: SqlExecutor): CompletionReport[] {
  return db.all<CompletionRow>(`SELECT * FROM moc_completion_report ORDER BY created_at DESC`).map(completionRowToRecord);
}

export function selectCompletionReportsByPlanDocNo(db: SqlExecutor, planOfChangeDocNo: string): CompletionReport[] {
  return db
    .all<CompletionRow>(`SELECT * FROM moc_completion_report WHERE plan_of_change_doc_no = @planOfChangeDocNo ORDER BY created_at DESC`, {
      planOfChangeDocNo,
    })
    .map(completionRowToRecord);
}
