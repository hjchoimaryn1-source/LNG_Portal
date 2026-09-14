// src/cmms-mro-bridge/rop/calculateReorderPoint.ts
// Phase 10 Stage 3B. Pure function, no DB/React binding. CMMS_Architecture.md §4.3.
// SS = Z * sigma_d * sqrt(LT), ROP = (D_avg * LT) + SS
// Trigger: (currentStock + pendingPoQty) - reservedForWo <= ROP

export const ROP_Z_SCORE = 2.33;

export interface RopInput {
  avgDailyDemand: number;
  demandStdDev: number;
  leadTimeDays: number;
  currentStock: number;
  pendingPoQty: number;
  reservedForWo: number;
}

export interface RopResult {
  safetyStock: number;
  reorderPoint: number;
  shouldTriggerReorder: boolean;
  netAvailable: number;
}

function assertNonNegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative finite number, got ${value}`);
  }
}

export function calculateReorderPoint(input: RopInput): RopResult {
  const { avgDailyDemand, demandStdDev, leadTimeDays, currentStock, pendingPoQty, reservedForWo } = input;

  assertNonNegative(avgDailyDemand, 'avgDailyDemand');
  assertNonNegative(demandStdDev, 'demandStdDev');
  assertNonNegative(leadTimeDays, 'leadTimeDays');
  assertNonNegative(currentStock, 'currentStock');
  assertNonNegative(pendingPoQty, 'pendingPoQty');
  assertNonNegative(reservedForWo, 'reservedForWo');

  const safetyStock = ROP_Z_SCORE * demandStdDev * Math.sqrt(leadTimeDays);
  const reorderPoint = avgDailyDemand * leadTimeDays + safetyStock;
  const netAvailable = currentStock + pendingPoQty - reservedForWo;

  return {
    safetyStock,
    reorderPoint,
    shouldTriggerReorder: netAvailable <= reorderPoint,
    netAvailable,
  };
}
