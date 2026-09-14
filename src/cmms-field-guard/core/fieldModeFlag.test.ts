// src/cmms-field-guard/core/fieldModeFlag.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { resolveFieldMode, resolveFieldModeFromHost } from './fieldModeFlag';

const ENV_KEY = 'NEXT_PUBLIC_DEPLOY_TARGET';

describe('resolveFieldMode', () => {
  afterEach(() => {
    delete process.env[ENV_KEY];
  });

  it('returns FIELD_CLIENT when env target is FIELD', () => {
    process.env[ENV_KEY] = 'FIELD';
    expect(resolveFieldMode()).toBe('FIELD_CLIENT');
  });

  it('returns DEV when env target is DIRECTOR', () => {
    process.env[ENV_KEY] = 'DIRECTOR';
    expect(resolveFieldMode()).toBe('DEV');
  });

  it('falls back to FIELD_CLIENT when env target is missing', () => {
    delete process.env[ENV_KEY];
    expect(resolveFieldMode()).toBe('FIELD_CLIENT');
  });

  it('falls back to FIELD_CLIENT when env target is invalid', () => {
    process.env[ENV_KEY] = 'NOT_A_REAL_TARGET';
    expect(resolveFieldMode()).toBe('FIELD_CLIENT');
  });
});

describe('resolveFieldModeFromHost', () => {
  it('classifies localhost as DEV', () => {
    expect(resolveFieldModeFromHost('localhost:3000')).toBe('DEV');
  });

  it('classifies unknown hosts as FIELD_CLIENT', () => {
    expect(resolveFieldModeFromHost('kiosk-07.nias-lng.local')).toBe('FIELD_CLIENT');
  });

  it('falls back to FIELD_CLIENT for empty host', () => {
    expect(resolveFieldModeFromHost('')).toBe('FIELD_CLIENT');
  });
});
