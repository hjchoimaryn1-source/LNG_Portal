import { describe, it, expect } from 'vitest';
import { isSignatureStale } from './signatureValidity';

describe('isSignatureStale', () => {
  it('is false when there is no regeneration timestamp', () => {
    expect(isSignatureStale(null, ['2026-09-14T08:00:00.000Z'])).toBe(false);
  });

  it('is false when there are no signatures yet', () => {
    expect(isSignatureStale('2026-09-14T09:00:00.000Z', [])).toBe(false);
  });

  it('is false when the regeneration happened before every signature', () => {
    expect(
      isSignatureStale('2026-09-14T07:00:00.000Z', ['2026-09-14T08:00:00.000Z', '2026-09-14T08:30:00.000Z'])
    ).toBe(false);
  });

  it('is true when the regeneration happened after any one signature', () => {
    expect(
      isSignatureStale('2026-09-14T09:00:00.000Z', ['2026-09-14T08:00:00.000Z', '2026-09-14T10:00:00.000Z'])
    ).toBe(true);
  });
});
