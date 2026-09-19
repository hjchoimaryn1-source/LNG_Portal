import { describe, it, expect } from 'vitest';
import { CANDIDATE_TAG_DOMAIN, PRIMARY_COLUMN_BY_DOMAIN } from './pidCandidateTags';

describe('pidCandidateTags', () => {
  it('covers all 9 PatrolDomains except iso_tank_cargo', () => {
    const domains = new Set(Object.values(CANDIDATE_TAG_DOMAIN));
    expect(domains.has('iso_tank_cargo')).toBe(false);
    expect(domains).toEqual(
      new Set([
        'metering_train_a',
        'metering_train_b',
        'aav',
        'n2_skid',
        'gc',
        'electrical',
        'iso_tank_unloading_skid',
        'ng_buffer_tank',
      ])
    );
  });

  it('maps METERING-TRAIN-A/B to their distinct domains (not both to train A)', () => {
    expect(CANDIDATE_TAG_DOMAIN['METERING-TRAIN-A']).toBe('metering_train_a');
    expect(CANDIDATE_TAG_DOMAIN['METERING-TRAIN-B']).toBe('metering_train_b');
  });

  it('includes the real Stage B tags, not the addendum placeholder guesses', () => {
    expect(CANDIDATE_TAG_DOMAIN['N2-CYL-01']).toBe('n2_skid');
    expect(CANDIDATE_TAG_DOMAIN['N2-SKID-SUPPLY-1']).toBe('n2_skid');
    expect(CANDIDATE_TAG_DOMAIN['MV-SWGR-01']).toBe('electrical');
    expect(CANDIDATE_TAG_DOMAIN['N2-01']).toBeUndefined();
    expect(CANDIDATE_TAG_DOMAIN['MV-SWGR']).toBeUndefined();
    expect(CANDIDATE_TAG_DOMAIN['M-101A']).toBeUndefined();
  });

  it('has a primary display column for every domain represented in the candidate map', () => {
    const domains = new Set(Object.values(CANDIDATE_TAG_DOMAIN));
    for (const domain of domains) {
      expect(PRIMARY_COLUMN_BY_DOMAIN[domain]).toBeDefined();
    }
  });
});
