import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, generateTempPassword } from './passwordHash';

describe('passwordHash', () => {
  it('verifies the correct plaintext against its own hash', () => {
    const hash = hashPassword('Correct-Horse-1');
    expect(verifyPassword('Correct-Horse-1', hash)).toBe(true);
  });

  it('rejects an incorrect plaintext', () => {
    const hash = hashPassword('Correct-Horse-1');
    expect(verifyPassword('Wrong-Password-9', hash)).toBe(false);
  });

  it('produces a different hash each call (random salt)', () => {
    const a = hashPassword('SamePlaintext');
    const b = hashPassword('SamePlaintext');
    expect(a).not.toBe(b);
    expect(verifyPassword('SamePlaintext', a)).toBe(true);
    expect(verifyPassword('SamePlaintext', b)).toBe(true);
  });

  it('rejects a malformed stored hash instead of throwing', () => {
    expect(verifyPassword('anything', 'not-a-valid-hash')).toBe(false);
    expect(verifyPassword('anything', '')).toBe(false);
  });

  it('generates temp passwords of consistent length and non-determinism', () => {
    const a = generateTempPassword();
    const b = generateTempPassword();
    expect(a).toHaveLength(12);
    expect(b).toHaveLength(12);
    expect(a).not.toBe(b);
  });
});
