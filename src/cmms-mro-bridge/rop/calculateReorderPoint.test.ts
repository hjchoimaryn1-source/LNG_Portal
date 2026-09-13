import { describe, it, expect } from 'vitest';
import { calculateReorderPoint, ROP_Z_SCORE } from './calculateReorderPoint';

describe('calculateReorderPoint', () => {
  it('normal stock — no trigger', () => {
    const r = calculateReorderPoint({
      avgDailyDemand: 2,
      demandStdDev: 1,
      leadTimeDays: 4,
      currentStock: 100,
      pendingPoQty: 0,
      reservedForWo: 0,
    });
    expect(r.safetyStock).toBeCloseTo(ROP_Z_SCORE * 1 * Math.sqrt(4), 6);
    expect(r.reorderPoint).toBeCloseTo(2 * 4 + r.safetyStock, 6);
    expect(r.shouldTriggerReorder).toBe(false);
  });

  it('boundary — netAvailable exactly equals reorderPoint triggers', () => {
    const r = calculateReorderPoint({
      avgDailyDemand: 5,
      demandStdDev: 0,
      leadTimeDays: 4,
      currentStock: 20,
      pendingPoQty: 0,
      reservedForWo: 0,
    });
    // reorderPoint = 5*4 + 2.33*0*sqrt(4) = 20; netAvailable = 20 -> trigger (<=)
    expect(r.reorderPoint).toBe(20);
    expect(r.netAvailable).toBe(20);
    expect(r.shouldTriggerReorder).toBe(true);
  });

  it('zero lead time — safety stock and ROP collapse to demand-only term', () => {
    const r = calculateReorderPoint({
      avgDailyDemand: 3,
      demandStdDev: 2,
      leadTimeDays: 0,
      currentStock: 0,
      pendingPoQty: 0,
      reservedForWo: 0,
    });
    expect(r.safetyStock).toBe(0);
    expect(r.reorderPoint).toBe(0);
    expect(r.shouldTriggerReorder).toBe(true);
  });

  it('negative input is rejected', () => {
    expect(() =>
      calculateReorderPoint({
        avgDailyDemand: -1,
        demandStdDev: 1,
        leadTimeDays: 4,
        currentStock: 10,
        pendingPoQty: 0,
        reservedForWo: 0,
      })
    ).toThrow(RangeError);
  });

  it('pending PO and reserved WO both factor into netAvailable', () => {
    const r = calculateReorderPoint({
      avgDailyDemand: 1,
      demandStdDev: 0,
      leadTimeDays: 2,
      currentStock: 10,
      pendingPoQty: 5,
      reservedForWo: 8,
    });
    expect(r.netAvailable).toBe(10 + 5 - 8);
    expect(r.reorderPoint).toBe(2);
    expect(r.shouldTriggerReorder).toBe(false);
  });
});
