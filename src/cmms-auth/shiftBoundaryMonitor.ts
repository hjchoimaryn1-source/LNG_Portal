// src/cmms-auth/shiftBoundaryMonitor.ts
//
// Pure logic: has a 07:00 or 19:00 WIB (Asia/Jakarta, UTC+7, no DST) shift-
// change boundary been crossed since a session was issued? Signal only —
// callers decide whether to force re-auth.
//
// Phase 8 carryover fix (2026-09-16): the boundary hours used to be computed
// via Date.setHours(), which reads/writes the server process's LOCAL
// timezone — wrong for a WIB-based facility whenever the process isn't
// itself running in Asia/Jakarta. Rewritten to use the same +7h-offset
// technique as src/utils/rollingManningForecast.ts's getWibDate() /
// src/cmms-daily-ops/utils/dailyOpsDateHelpers.ts's todayWib() (not imported
// directly — cmms-auth is its own domain, same precedent those files set for
// not cross-importing a domain-specific date helper), applied via UTC
// getters/setters so the result no longer depends on the runtime's local
// timezone at all.

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const SHIFT_BOUNDARY_HOURS_WIB = [7, 19];

/** Real (unshifted) instant for `hourWib`:00 WIB on the WIB-calendar day `shiftedDayCursor` (already +7h-shifted) falls on. */
function wibBoundaryToRealInstant(shiftedDayCursor: Date, hourWib: number): Date {
  const shiftedBoundary = new Date(shiftedDayCursor);
  shiftedBoundary.setUTCHours(hourWib, 0, 0, 0);
  return new Date(shiftedBoundary.getTime() - WIB_OFFSET_MS);
}

export function hasCrossedShiftBoundary(issuedAt: Date, now: Date): boolean {
  if (now <= issuedAt) return false;

  const cursor = new Date(issuedAt.getTime() + WIB_OFFSET_MS);
  cursor.setUTCHours(0, 0, 0, 0);
  const shiftedNow = new Date(now.getTime() + WIB_OFFSET_MS);

  while (cursor <= shiftedNow) {
    for (const hour of SHIFT_BOUNDARY_HOURS_WIB) {
      const boundary = wibBoundaryToRealInstant(cursor, hour);
      if (boundary > issuedAt && boundary <= now) {
        return true;
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return false;
}

export function isReauthRequired(issuedAtIso: string, now: Date = new Date()): boolean {
  return hasCrossedShiftBoundary(new Date(issuedAtIso), now);
}

/** now 이후 가장 가까운 WIB 시프트 경계(07:00 또는 19:00 WIB)를 실제 UTC 시각으로 반환한다. */
export function getNextShiftBoundary(now: Date): Date {
  const cursor = new Date(now.getTime() + WIB_OFFSET_MS);
  cursor.setUTCHours(0, 0, 0, 0);

  for (;;) {
    for (const hour of SHIFT_BOUNDARY_HOURS_WIB) {
      const boundary = wibBoundaryToRealInstant(cursor, hour);
      if (boundary > now) return boundary;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
}
