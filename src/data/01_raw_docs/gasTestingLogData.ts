// src/data/gasTestingLogData.ts
// Gas Testing Log (AGT) mock records & safety evaluation — SOP NP08-15
// Measurement zones: Unloading Skid (T-201~204), Ambient Air Vaporizer (VAP-101~106),
// PRSS Header, BOG Compressor Skid. Cycle: every 4h during unloading (00/04/08/12/16/20:00).
//
// DOMAIN NOTE: this is the periodic Zone AGT register (zone/tagId/cycleTime),
// independent of any single PTW permit. It is NOT the same domain as
// PTWPermit.gasReadings/gasTestHistory (permit-scoped single-point re-tests) or
// src/adapters/gasSafetyAdapter.ts's GasTestRecordDraft (permitRefNo-keyed CMMS
// shadow records) — do not merge these three; GasTestReading here has no
// permitRefNo and is never produced by ptwFormAdapter.ts/gasSafetyAdapter.ts.

export type GasTestZone = 'UNLOADING_SKID' | 'AMBIENT_VAPORIZER' | 'PRSS_HEADER' | 'BOG_COMPRESSOR';

export const GAS_TEST_ZONE_LABEL: Record<GasTestZone, string> = {
  UNLOADING_SKID: 'Unloading Skid',
  AMBIENT_VAPORIZER: 'Ambient Air Vaporizer',
  PRSS_HEADER: 'PRSS Header',
  BOG_COMPRESSOR: 'BOG Compressor Skid',
};

export interface GasTestReading {
  id: string;
  zone: GasTestZone;
  tagId: string; // T-201..204 / VAP-101..106 / PRSS-HDR / BOG-SKID
  cycleTime: string; // fixed 4h cycle slot, e.g. '16:00'
  testedAt: string; // ISO timestamp
  lelPercent: number;
  o2Percent: number;
  h2sPpm: number;
  coPpm: number;
  testedBy: string;
}

export type GasTestSeverity = 'SAFE' | 'CAUTION' | 'DANGER';

export interface GasTestEvaluation {
  lelSeverity: GasTestSeverity;
  o2Safe: boolean;
  h2sSafe: boolean;
  coSafe: boolean;
  overallSeverity: GasTestSeverity;
  isAtmosphereSafe: boolean;
}

const D = '2026-09-08';

export const MOCK_GAS_TEST_READINGS: GasTestReading[] = [
  { id: 'GT-001', zone: 'UNLOADING_SKID', tagId: 'T-201', cycleTime: '20:00', testedAt: `${D}T20:00:00`, lelPercent: 0.0, o2Percent: 20.9, h2sPpm: 0, coPpm: 2, testedBy: 'AGT-Santoso' },
  { id: 'GT-002', zone: 'UNLOADING_SKID', tagId: 'T-202', cycleTime: '20:00', testedAt: `${D}T20:00:00`, lelPercent: 0.0, o2Percent: 20.8, h2sPpm: 1, coPpm: 3, testedBy: 'AGT-Santoso' },
  { id: 'GT-003', zone: 'UNLOADING_SKID', tagId: 'T-203', cycleTime: '16:00', testedAt: `${D}T16:00:00`, lelPercent: 2.5, o2Percent: 20.5, h2sPpm: 3, coPpm: 8, testedBy: 'AGT-Wijaya' },
  { id: 'GT-004', zone: 'UNLOADING_SKID', tagId: 'T-204', cycleTime: '16:00', testedAt: `${D}T16:00:00`, lelPercent: 0.0, o2Percent: 20.7, h2sPpm: 0, coPpm: 1, testedBy: 'AGT-Wijaya' },
  { id: 'GT-005', zone: 'AMBIENT_VAPORIZER', tagId: 'VAP-101', cycleTime: '20:00', testedAt: `${D}T20:00:00`, lelPercent: 0.0, o2Percent: 20.9, h2sPpm: 0, coPpm: 0, testedBy: 'AGT-Santoso' },
  { id: 'GT-006', zone: 'AMBIENT_VAPORIZER', tagId: 'VAP-104', cycleTime: '16:00', testedAt: `${D}T16:00:00`, lelPercent: 12.0, o2Percent: 18.9, h2sPpm: 6, coPpm: 30, testedBy: 'AGT-Wijaya' },
  { id: 'GT-007', zone: 'PRSS_HEADER', tagId: 'PRSS-HDR', cycleTime: '20:00', testedAt: `${D}T20:00:00`, lelPercent: 0.0, o2Percent: 20.8, h2sPpm: 0, coPpm: 2, testedBy: 'AGT-Santoso' },
  { id: 'GT-008', zone: 'BOG_COMPRESSOR', tagId: 'BOG-SKID', cycleTime: '16:00', testedAt: `${D}T16:00:00`, lelPercent: 1.0, o2Percent: 20.6, h2sPpm: 2, coPpm: 5, testedBy: 'AGT-Wijaya' },
];

export function evaluateGasTestReading(reading: GasTestReading): GasTestEvaluation {
  const lelSeverity: GasTestSeverity =
    reading.lelPercent >= 10.0 ? 'DANGER' : reading.lelPercent > 0.0 ? 'CAUTION' : 'SAFE';
  const o2Safe = reading.o2Percent >= 19.5 && reading.o2Percent <= 23.5;
  const h2sSafe = reading.h2sPpm < 5;
  const coSafe = reading.coPpm < 25;

  const overallSeverity: GasTestSeverity =
    lelSeverity === 'DANGER' || !o2Safe || !h2sSafe || !coSafe
      ? 'DANGER'
      : lelSeverity === 'CAUTION'
      ? 'CAUTION'
      : 'SAFE';

  return {
    lelSeverity,
    o2Safe,
    h2sSafe,
    coSafe,
    overallSeverity,
    isAtmosphereSafe: overallSeverity === 'SAFE',
  };
}

export interface GasTestingLogStats {
  total: number;
  safeCount: number;
  cautionCount: number;
  dangerCount: number;
  lastTestedAt: string | null;
}

export function computeGasTestingStats(readings: GasTestReading[]): GasTestingLogStats {
  let safeCount = 0;
  let cautionCount = 0;
  let dangerCount = 0;
  let lastTestedAt: string | null = null;

  for (const r of readings) {
    const { overallSeverity } = evaluateGasTestReading(r);
    if (overallSeverity === 'SAFE') safeCount += 1;
    else if (overallSeverity === 'CAUTION') cautionCount += 1;
    else dangerCount += 1;

    if (!lastTestedAt || r.testedAt > lastTestedAt) lastTestedAt = r.testedAt;
  }

  return { total: readings.length, safeCount, cautionCount, dangerCount, lastTestedAt };
}
