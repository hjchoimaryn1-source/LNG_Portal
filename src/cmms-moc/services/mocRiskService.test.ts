import { describe, it, expect } from 'vitest';
import { classifyRiskRating } from './mocRiskService';

describe('classifyRiskRating', () => {
  it('1 -> ACCEPTABLE', () => {
    expect(classifyRiskRating(1)).toBe('ACCEPTABLE');
  });

  it('2 -> ACCEPTABLE', () => {
    expect(classifyRiskRating(2)).toBe('ACCEPTABLE');
  });

  it('3 -> REVIEW_NEEDED', () => {
    expect(classifyRiskRating(3)).toBe('REVIEW_NEEDED');
  });

  it('4 -> NOT_ACCEPTABLE', () => {
    expect(classifyRiskRating(4)).toBe('NOT_ACCEPTABLE');
  });

  it('5 -> NOT_ACCEPTABLE', () => {
    expect(classifyRiskRating(5)).toBe('NOT_ACCEPTABLE');
  });

  it('0 (below range) throws', () => {
    expect(() => classifyRiskRating(0)).toThrow(RangeError);
  });

  it('6 (above range) throws', () => {
    expect(() => classifyRiskRating(6)).toThrow(RangeError);
  });

  it('non-integer input throws', () => {
    expect(() => classifyRiskRating(2.5)).toThrow(RangeError);
  });
});
