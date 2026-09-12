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
