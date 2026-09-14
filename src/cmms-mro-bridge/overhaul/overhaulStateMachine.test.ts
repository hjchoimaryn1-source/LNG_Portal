import { describe, it, expect } from 'vitest';
import { transitionOverhaulStatus, IllegalOverhaulTransitionError } from './overhaulStateMachine';

describe('transitionOverhaulStatus', () => {
  it('normal sequential transition (with vendor approval)', () => {
    expect(transitionOverhaulStatus('DISPATCH_PENDING', 'IN_TRANSIT_OUT', { vendorApproved: true })).toBe(
      'IN_TRANSIT_OUT'
    );
  });

  it('blocks illegal backward transition (TESTING_INSPECTION -> DISPATCH_PENDING)', () => {
    expect(() => transitionOverhaulStatus('TESTING_INSPECTION', 'DISPATCH_PENDING')).toThrow(
      IllegalOverhaulTransitionError
    );
  });

  it('blocks illegal backward transition (IN_TRANSIT_IN -> UNDER_REPAIR)', () => {
    expect(() => transitionOverhaulStatus('IN_TRANSIT_IN', 'UNDER_REPAIR')).toThrow(IllegalOverhaulTransitionError);
  });

  it('allows CANCELLED from an arbitrary non-terminal state', () => {
    expect(transitionOverhaulStatus('UNDER_REPAIR', 'CANCELLED')).toBe('CANCELLED');
  });

  it('blocks DISPATCH_PENDING -> IN_TRANSIT_OUT without vendor approval', () => {
    expect(() => transitionOverhaulStatus('DISPATCH_PENDING', 'IN_TRANSIT_OUT', { vendorApproved: false })).toThrow(
      IllegalOverhaulTransitionError
    );
  });
});
