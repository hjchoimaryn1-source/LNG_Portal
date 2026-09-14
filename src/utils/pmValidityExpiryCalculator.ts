// src/utils/pmValidityExpiryCalculator.ts
//
// PURPOSE
//   pm_schedules.next_due_date computation for interval_type='VALIDITY_EXPIRY'
//   only (Phase 10 Stage 2C). Isolated, pure function — no React/DB binding.
//
// SCOPE NOTE
//   CALENDAR/RUNNING_HOURS next_due_date logic for pm_schedules does not
//   exist anywhere in this repo (src/utils/pmScheduleCalculator.ts computes
//   next_due_date for the unrelated legacy work_orders.pm_cycle_days scheme,
//   not for the pm_schedules table added in Stage1A — confirmed by reading
//   both files). This function intentionally does NOT invent that logic; it
//   implements only the VALIDITY_EXPIRY branch requested for Stage2C.
//
// USE CASE
//   docs/phase10-stage1d-np05-pm-mapping-proposal.md Item 9 (tube-type gas
//   detectors): NP-05 Ch.7 §7.4 ties calibration to a manufacturer-printed
//   validity/expiry date, which neither CALENDAR nor RUNNING_HOURS can model
//   — this is exactly the gap VALIDITY_EXPIRY closes.

export type PmIntervalType = 'RUNNING_HOURS' | 'CALENDAR' | 'VALIDITY_EXPIRY';

/**
 * For interval_type='VALIDITY_EXPIRY', next_due_date is simply expiryDate
 * itself (YYYY-MM-DD) — no calculation from last-performed date/hours, since
 * the date is fixed by the manufacturer, not derived from usage.
 *
 * Throws for any other interval_type: callers must route CALENDAR/RUNNING_HOURS
 * schedules elsewhere, since that logic is out of scope here (see SCOPE NOTE).
 */
export function computeNextDueDateForValidityExpiry(
  intervalType: PmIntervalType,
  expiryDate: string | null | undefined
): string | null {
  if (intervalType !== 'VALIDITY_EXPIRY') {
    throw new Error(
      `computeNextDueDateForValidityExpiry only handles 'VALIDITY_EXPIRY', got '${intervalType}'. ` +
        'CALENDAR/RUNNING_HOURS are not implemented here — see file SCOPE NOTE.'
    );
  }
  if (!expiryDate) return null;

  const parsed = Date.parse(expiryDate);
  if (Number.isNaN(parsed)) {
    throw new RangeError(`expiryDate is not a valid ISO date: "${expiryDate}"`);
  }
  return expiryDate;
}
