// src/lib/rbac/sessionExpiryMessage.ts
//
// Stage 3 Step 3 — shared copy for the "activeSession went null mid-use"
// gap (activeSessionStore is an in-memory module singleton that resets
// without remounting LNGPortalApp's login gate, e.g. on a Next.js dev Fast
// Refresh). Call sites that used to fail open silently, or substitute a
// fallback identity, now show this instead of proceeding unguarded.

export const SESSION_EXPIRED_MESSAGE = '세션이 만료되었습니다 — 다시 로그인해 주세요.';
