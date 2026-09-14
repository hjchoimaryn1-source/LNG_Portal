// src/cmms-mro-bridge/overhaul/overhaulStateMachine.ts
// Phase 10 Stage 3C. external_overhauls.status CHECK constraint (7 states) is
// the sole SSOT for transition sequence. NP-06 Ch.6 (vendor/contract
// governance, not a dispatch/repair/return cycle — Stage0 Task 6) plays no
// role in the sequence; vendor approval is referenced only as a pre-check on
// DISPATCH_PENDING -> IN_TRANSIT_OUT, not as a state.

export type OverhaulStatus =
  | 'DISPATCH_PENDING'
  | 'IN_TRANSIT_OUT'
  | 'UNDER_REPAIR'
  | 'TESTING_INSPECTION'
  | 'IN_TRANSIT_IN'
  | 'RETURNED_INSTALLED'
  | 'CANCELLED';

const FORWARD_SEQUENCE: OverhaulStatus[] = [
  'DISPATCH_PENDING',
  'IN_TRANSIT_OUT',
  'UNDER_REPAIR',
  'TESTING_INSPECTION',
  'IN_TRANSIT_IN',
  'RETURNED_INSTALLED',
];

const TERMINAL_STATES: ReadonlySet<OverhaulStatus> = new Set(['RETURNED_INSTALLED', 'CANCELLED']);

export interface TransitionContext {
  /** Pre-check for DISPATCH_PENDING -> IN_TRANSIT_OUT only. Not part of the state sequence itself. */
  vendorApproved?: boolean;
}

export class IllegalOverhaulTransitionError extends Error {
  constructor(from: OverhaulStatus, to: OverhaulStatus, reason: string) {
    super(`Illegal transition ${from} -> ${to}: ${reason}`);
    this.name = 'IllegalOverhaulTransitionError';
  }
}

/**
 * Validates and returns the next status. Throws IllegalOverhaulTransitionError
 * for anything not permitted. CANCELLED is reachable from any non-terminal
 * state (exception path); forward sequence otherwise moves exactly one step.
 */
export function transitionOverhaulStatus(
  current: OverhaulStatus,
  target: OverhaulStatus,
  context: TransitionContext = {}
): OverhaulStatus {
  if (TERMINAL_STATES.has(current)) {
    throw new IllegalOverhaulTransitionError(current, target, `${current} is terminal — no further transitions allowed.`);
  }

  if (target === 'CANCELLED') {
    return 'CANCELLED';
  }

  const currentIndex = FORWARD_SEQUENCE.indexOf(current);
  const targetIndex = FORWARD_SEQUENCE.indexOf(target);

  if (targetIndex === -1) {
    throw new IllegalOverhaulTransitionError(current, target, `"${target}" is not a valid forward state.`);
  }

  if (targetIndex !== currentIndex + 1) {
    throw new IllegalOverhaulTransitionError(
      current,
      target,
      targetIndex <= currentIndex
        ? 'backward or same-state transitions are not allowed.'
        : 'transitions must advance exactly one step in the sequence.'
    );
  }

  if (current === 'DISPATCH_PENDING' && target === 'IN_TRANSIT_OUT' && context.vendorApproved !== true) {
    throw new IllegalOverhaulTransitionError(current, target, 'vendor approval pre-check failed (vendorApproved !== true).');
  }

  return target;
}
