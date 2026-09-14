// src/cmms-moc/dao/mocPlanDao.ts
//
// PURPOSE
//   Pure DAO for moc_plan_of_change (NP12-01). SqlExecutor-only, no React/Next
//   binding (mirrors src/cmms-trucking/db/truckInspectionDao.ts). Split out of
//   mocDao.ts to respect the 250-line/file cap — mocCompletionDao.ts holds the
//   NP12-02 counterpart.

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import type { PlanOfChange, NewPlanOfChangeInput, MocStatus } from '../types/moc';

interface PlanRow {
  doc_no: string;
  responsible_team: string;
  object_of_change: string;
  purpose_reason: string;
  change_type: string;
  proposed_time_scale: string | null;
  related_procedures_forms: string | null;
  mitigation_summary: string | null;
  initial_risk_date: string | null;
  initial_risk_doc_no: string | null;
  initial_risk_assessed_by: string | null;
  initial_risk_rating: number | null;
  improvement_summary: string | null;
  reassessment_date: string | null;
  reassessment_risk_rating: number | null;
  manuals_to_update: string | null;
  teams_affected: string | null;
  training_object: string | null;
  training_implementation: string | null;
  estimated_cost: number | null;
  estimated_commence_date: string | null;
  targeted_completion_date: string | null;
  status: string;
  drawn_up_by: string | null;
  reviewed_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

function planRowToRecord(row: PlanRow): PlanOfChange {
  return {
    docNo: row.doc_no,
    responsibleTeam: row.responsible_team,
    objectOfChange: row.object_of_change,
    purposeReason: row.purpose_reason,
    changeType: row.change_type as PlanOfChange['changeType'],
    proposedTimeScale: row.proposed_time_scale,
    relatedProceduresForms: row.related_procedures_forms,
    mitigationSummary: row.mitigation_summary,
    initialRiskDate: row.initial_risk_date,
    initialRiskDocNo: row.initial_risk_doc_no,
    initialRiskAssessedBy: row.initial_risk_assessed_by,
    initialRiskRating: row.initial_risk_rating,
    improvementSummary: row.improvement_summary,
    reassessmentDate: row.reassessment_date,
    reassessmentRiskRating: row.reassessment_risk_rating,
    manualsToUpdate: row.manuals_to_update,
    teamsAffected: row.teams_affected,
    trainingObject: row.training_object,
    trainingImplementation: row.training_implementation,
    estimatedCost: row.estimated_cost,
    estimatedCommenceDate: row.estimated_commence_date,
    targetedCompletionDate: row.targeted_completion_date,
    status: row.status as MocStatus,
    drawnUpBy: row.drawn_up_by,
    reviewedBy: row.reviewed_by,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
  };
}

const INSERT_PLAN_SQL = `
  INSERT INTO moc_plan_of_change (
    doc_no, responsible_team, object_of_change, purpose_reason, change_type,
    proposed_time_scale, related_procedures_forms, mitigation_summary,
    initial_risk_date, initial_risk_doc_no, initial_risk_assessed_by, initial_risk_rating,
    improvement_summary, reassessment_date, reassessment_risk_rating,
    manuals_to_update, teams_affected, training_object, training_implementation,
    estimated_cost, estimated_commence_date, targeted_completion_date,
    status, drawn_up_by, reviewed_by, approved_by, approved_at
  ) VALUES (
    @docNo, @responsibleTeam, @objectOfChange, @purposeReason, @changeType,
    @proposedTimeScale, @relatedProceduresForms, @mitigationSummary,
    @initialRiskDate, @initialRiskDocNo, @initialRiskAssessedBy, @initialRiskRating,
    @improvementSummary, @reassessmentDate, @reassessmentRiskRating,
    @manualsToUpdate, @teamsAffected, @trainingObject, @trainingImplementation,
    @estimatedCost, @estimatedCommenceDate, @targetedCompletionDate,
    @status, @drawnUpBy, @reviewedBy, @approvedBy, @approvedAt
  )
`;

export function insertPlanOfChange(db: SqlExecutor, input: NewPlanOfChangeInput): void {
  db.run(INSERT_PLAN_SQL, {
    ...input,
    proposedTimeScale: input.proposedTimeScale ?? null,
    relatedProceduresForms: input.relatedProceduresForms ?? null,
    mitigationSummary: input.mitigationSummary ?? null,
    initialRiskDate: input.initialRiskDate ?? null,
    initialRiskDocNo: input.initialRiskDocNo ?? null,
    initialRiskAssessedBy: input.initialRiskAssessedBy ?? null,
    initialRiskRating: input.initialRiskRating ?? null,
    improvementSummary: input.improvementSummary ?? null,
    reassessmentDate: input.reassessmentDate ?? null,
    reassessmentRiskRating: input.reassessmentRiskRating ?? null,
    manualsToUpdate: input.manualsToUpdate ?? null,
    teamsAffected: input.teamsAffected ?? null,
    trainingObject: input.trainingObject ?? null,
    trainingImplementation: input.trainingImplementation ?? null,
    estimatedCost: input.estimatedCost ?? null,
    estimatedCommenceDate: input.estimatedCommenceDate ?? null,
    targetedCompletionDate: input.targetedCompletionDate ?? null,
    status: input.status ?? 'DRAFT',
    drawnUpBy: input.drawnUpBy ?? null,
    reviewedBy: input.reviewedBy ?? null,
    approvedBy: input.approvedBy ?? null,
    approvedAt: input.approvedAt ?? null,
  });
}

export function selectAllPlansOfChange(db: SqlExecutor): PlanOfChange[] {
  return db.all<PlanRow>(`SELECT * FROM moc_plan_of_change ORDER BY created_at DESC`).map(planRowToRecord);
}

export function selectPlanOfChangeByDocNo(db: SqlExecutor, docNo: string): PlanOfChange | undefined {
  const row = db.get<PlanRow>(`SELECT * FROM moc_plan_of_change WHERE doc_no = @docNo`, { docNo });
  return row ? planRowToRecord(row) : undefined;
}

/** Site Manager 승인 흐름 전용 — 시스템은 상태값을 강제하지 않고 기록만 반영한다. */
export function updatePlanOfChangeStatus(
  db: SqlExecutor,
  docNo: string,
  status: MocStatus,
  approvedBy: string | null,
  approvedAt: string | null
): void {
  db.run(
    `UPDATE moc_plan_of_change SET status = @status, approved_by = @approvedBy, approved_at = @approvedAt WHERE doc_no = @docNo`,
    { docNo, status, approvedBy, approvedAt }
  );
}
