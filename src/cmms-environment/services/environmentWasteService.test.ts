import { describe, it, expect } from 'vitest';
import { computeThwsStatus, aggregateWasteByCategory } from './environmentWasteService';

describe('computeThwsStatus', () => {
  it('due date in the future -> IN_STORAGE', () => {
    expect(computeThwsStatus('2026-12-31', '2026-01-01')).toBe('IN_STORAGE');
  });

  it('due date in the past -> OVERDUE', () => {
    expect(computeThwsStatus('2026-01-01', '2026-12-31')).toBe('OVERDUE');
  });

  it('due date equals today -> IN_STORAGE (boundary, not yet overdue)', () => {
    expect(computeThwsStatus('2026-06-15', '2026-06-15')).toBe('IN_STORAGE');
  });
});

describe('aggregateWasteByCategory', () => {
  it('empty log array -> zero totals', () => {
    expect(aggregateWasteByCategory([])).toEqual({ hazardousKg: 0, nonHazardousKg: 0 });
  });

  it('sums hazardous and non-hazardous separately', () => {
    const result = aggregateWasteByCategory([
      { wasteCategory: 'HAZARDOUS', quantityKg: 12.5 },
      { wasteCategory: 'NON_HAZARDOUS', quantityKg: 30 },
      { wasteCategory: 'HAZARDOUS', quantityKg: 7.5 },
    ]);
    expect(result).toEqual({ hazardousKg: 20, nonHazardousKg: 30 });
  });

  it('single-category array leaves the other total at zero', () => {
    const result = aggregateWasteByCategory([{ wasteCategory: 'NON_HAZARDOUS', quantityKg: 100 }]);
    expect(result).toEqual({ hazardousKg: 0, nonHazardousKg: 100 });
  });
});
