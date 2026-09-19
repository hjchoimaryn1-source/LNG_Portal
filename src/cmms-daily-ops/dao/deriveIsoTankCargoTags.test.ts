import { describe, it, expect } from 'vitest';
import { deriveIsoTankCargoTags } from './deriveIsoTankCargoTags';
import { NodeState, type FleetTankItem } from '../../types/lng';

function tank(overrides: Partial<FleetTankItem>): FleetTankItem {
  return {
    no: 1,
    tankNo: 'ISOT-000',
    rawTankNo: 'ISOT-000',
    serialNo: 'SIMU-0000000',
    location: 'ORU NIAS',
    position: 'Laydown 1',
    node: NodeState.NODE_3_NIAS_LAYDOWN_YARD,
    level: 50,
    levelM3: 20,
    levelMmH2O: 500,
    battery: 90,
    pressureMPa: 0.76,
    tempC: -126.7,
    depress: 'None',
    pressBeforeMPa: 0.76,
    pressAfterMPa: 0.76,
    remarks: '',
    lastReportDate: '2026-08-13',
    ...overrides,
  };
}

describe('deriveIsoTankCargoTags', () => {
  it('includes tanks at Laydown 1 (CSV seed uppercase form)', () => {
    const tags = deriveIsoTankCargoTags([tank({ serialNo: 'SIMU-8101513', position: 'LAYDOWN 1' })]);
    expect(tags).toEqual(['SIMU-8101513']);
  });

  it('includes tanks at Laydown 2, including slotted title-case form', () => {
    const tags = deriveIsoTankCargoTags([
      tank({ serialNo: 'SIMU-A', position: 'Laydown 2' }),
      tank({ serialNo: 'SIMU-B', position: 'Laydown 2 (Slot 3)' }),
    ]);
    expect(tags).toEqual(['SIMU-A', 'SIMU-B']);
  });

  it('excludes tanks mounted to an ORU-SKID bay (REGAS position + isMountedToBay set)', () => {
    const tags = deriveIsoTankCargoTags([
      tank({ serialNo: 'SIMU-SKID', position: 'REGAS Bay 01', isMountedToBay: 'Bay 01' }),
    ]);
    expect(tags).toEqual([]);
  });

  it('excludes Arun laydown (LAYDOWN PAG) and Saviour/ship positions', () => {
    const tags = deriveIsoTankCargoTags([
      tank({ serialNo: 'SIMU-ARUN', position: 'LAYDOWN PAG' }),
      tank({ serialNo: 'SIMU-SHIP', position: 'MV. SAVIOUR' }),
      tank({ serialNo: 'SIMU-SHIP2', position: 'SAVIOUR' }),
    ]);
    expect(tags).toEqual([]);
  });

  it('excludes Laydown 3 (heel zone, out of Section D scope)', () => {
    const tags = deriveIsoTankCargoTags([tank({ serialNo: 'SIMU-L3', position: 'Laydown 3' })]);
    expect(tags).toEqual([]);
  });

  it('returns empty array for empty fleet', () => {
    expect(deriveIsoTankCargoTags([])).toEqual([]);
  });
});
