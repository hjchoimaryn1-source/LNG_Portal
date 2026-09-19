// src/cmms-field-guard/core/fieldModeFlag.ts
// Server-side-only resolution of the field deployment mode. Pure functions, no React.

export type FieldMode = 'DEV' | 'FIELD_CLIENT';

const VALID_DEPLOY_TARGETS = new Set(['FIELD', 'DIRECTOR']);

/**
 * Resolves deploy mode from the build-time env signal.
 * Fail-safe default: FIELD_CLIENT (never fail-open to DEV) when the
 * signal is absent or invalid — an unrecognized deployment must default
 * to the more restrictive mode, not the more permissive one.
 */
export function resolveFieldMode(): FieldMode {
  const target = process.env.NEXT_PUBLIC_DEPLOY_TARGET;

  if (target && VALID_DEPLOY_TARGETS.has(target)) {
    return target === 'FIELD' ? 'FIELD_CLIENT' : 'DEV';
  }

  return 'FIELD_CLIENT';
}

/**
 * Pure host-header classifier for a later middleware stage. Not wired to
 * any request pipeline in this task — exposed so the future middleware
 * can call it directly.
 */
export function resolveFieldModeFromHost(host: string): FieldMode {
  const normalized = host.trim().toLowerCase();

  if (!normalized) {
    return 'FIELD_CLIENT';
  }

  if (normalized.startsWith('director.') || normalized.includes('localhost') || normalized.startsWith('127.0.0.1')) {
    return 'DEV';
  }

  return 'FIELD_CLIENT';
}
