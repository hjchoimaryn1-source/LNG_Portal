// src/cmms-auth/shiftBoundaryMonitor.ts
//
// Pure logic: has a 07:00 or 19:00 shift-change boundary been crossed since a
// session was issued? Signal only — callers decide whether to force re-auth.

const SHIFT_BOUNDARY_HOURS = [7, 19];

export function hasCrossedShiftBoundary(issuedAt: Date, now: Date): boolean {
  if (now <= issuedAt) return false;

  const cursor = new Date(issuedAt);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= now) {
    for (const hour of SHIFT_BOUNDARY_HOURS) {
      const boundary = new Date(cursor);
      boundary.setHours(hour, 0, 0, 0);
      if (boundary > issuedAt && boundary <= now) {
        return true;
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return false;
}

export function isReauthRequired(issuedAtIso: string, now: Date = new Date()): boolean {
  return hasCrossedShiftBoundary(new Date(issuedAtIso), now);
}

/** now 이후 가장 가까운 시프트 경계(07:00 또는 19:00)를 반환한다. */
export function getNextShiftBoundary(now: Date): Date {
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);

  for (;;) {
    for (const hour of SHIFT_BOUNDARY_HOURS) {
      const boundary = new Date(cursor);
      boundary.setHours(hour, 0, 0, 0);
      if (boundary > now) return boundary;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
}
