// src/cmms-daily-ops/utils/signatureValidity.ts
//
// PURPOSE
//   Stage D Addendum (D-ADD-4) — 순수 함수. lastRegeneratedAt이 서명
//   signed_at 중 하나보다 나중이면(재발행이 서명 이후에 일어났으면) true —
//   서명된 시점의 값과 현재 스냅샷 값이 다를 수 있다는 경고 트리거.
//   React 미의존(AGENTS.md §3 Logic/Data Layer 컨벤션).

export function isSignatureStale(lastRegeneratedAt: string | null, signedAtTimestamps: string[]): boolean {
  if (!lastRegeneratedAt || signedAtTimestamps.length === 0) return false;
  const regeneratedAtMs = Date.parse(lastRegeneratedAt);
  return signedAtTimestamps.some((signedAt) => regeneratedAtMs > Date.parse(signedAt));
}
