// src/utils/scadaCalculations.ts

import {
  FleetTankItem,
  TankPhysicalMetrics,
  getTankPhysicalMetrics,
  LNG_LIQUID_DENSITY_KG_M3,
} from '../data/mockTankData';
import { KpiMetrics } from '../components/KpiSummaryStrip';

/**
 * Universal natural numerical ascending sort helper for tank records.
 * Correctly sorts e.g. ISOT-001, ISOT-002, ..., ISOT-010, ..., ISOT-120.
 */
export function sortTanksNaturally<T extends { tankNo?: string }>(tanks: T[]): T[] {
  if (!Array.isArray(tanks)) return [];
  return [...tanks].sort((a, b) => {
    const numA = parseInt((a?.tankNo || '').replace(/\D/g, ''), 10) || 0;
    const numB = parseInt((b?.tankNo || '').replace(/\D/g, ''), 10) || 0;
    if (numA !== numB) {
      return numA - numB;
    }
    return (a?.tankNo || '').localeCompare(b?.tankNo || '');
  });
}

/**
 * Calculates pre-load tare from dry nameplate tare and residual heel mass/volume.
 * Baseline: 10,850 kg + Math.round(1.0 m³ * 445.0 kg/m³) = 11,295 kg
 */
export function calculatePreLoadTare(
  dryTareKg: number = 10850,
  heelVolumeM3: number = 1.0,
  density: number = LNG_LIQUID_DENSITY_KG_M3
): number {
  return dryTareKg + Math.round(heelVolumeM3 * density);
}

/**
 * Computes energy in MMBtu from LNG mass (kg) and Gross Heating Value (kcal/kg).
 * 1 MMBtu = 251,995.8 kcal.
 */
export function calculateEnergyMMBtu(massKg: number, ghvKcalKg: number = 52214.94): number {
  if (!massKg || massKg <= 0) return 0;
  const totalKcal = massKg * ghvKcalKg;
  const mmbtu = totalKcal / 251995.8;
  return parseFloat(mmbtu.toFixed(2));
}

/**
 * Computes gauge calibration drift between weighbridge ground truth and DP/SMT level.
 */
export function calculateGaugeDriftError(
  measuredGrossKg: number,
  dryTareKg: number = 10850,
  dpSmTEstimateKg: number = 445
): {
  weighbridgeHeelKg: number;
  driftDeltaKg: number;
  driftPct: number;
  verdict: 'PASS' | 'DRIFT_WARN' | 'CAL_FAIL';
} {
  const weighbridgeHeelKg = Math.max(0, measuredGrossKg - dryTareKg);
  const driftDeltaKg = weighbridgeHeelKg - dpSmTEstimateKg;
  const driftPct =
    dpSmTEstimateKg > 0
      ? parseFloat(((driftDeltaKg / dpSmTEstimateKg) * 100).toFixed(2))
      : 0;

  let verdict: 'PASS' | 'DRIFT_WARN' | 'CAL_FAIL' = 'PASS';
  const absDrift = Math.abs(driftPct);
  if (absDrift > 5.0) {
    verdict = 'CAL_FAIL';
  } else if (absDrift > 2.0) {
    verdict = 'DRIFT_WARN';
  }

  return {
    weighbridgeHeelKg,
    driftDeltaKg,
    driftPct,
    verdict,
  };
}

/**
 * Computes reactive KPI metrics for Tab 1 based on active inventory and user selection.
 */
export function computeTab1ReactiveKPIs(
  activeTanks: FleetTankItem[],
  totalPoolCount: number,
  selectedCount: number,
  activeBatchRecords: { tankNo: string }[] = []
): KpiMetrics {
  const isFiltered = selectedCount > 0;
  const targetTanks = isFiltered
    ? activeTanks.filter((t) => activeTanks.some((a) => a.tankNo === t.tankNo))
    : activeTanks;

  if (targetTanks.length === 0) {
    return {
      unitCountLabel: isFiltered ? `${selectedCount} Selected` : `${totalPoolCount} Units`,
      selectedCount,
      totalCount: totalPoolCount,
      totalPreLoadMassTon: '0.0 Ton',
      totalBufferVolumeM3: '0.0 m³',
      avgHeelVolumeM3: '0.00 m³',
      avgHeelLevelPct: '0.00%',
      avgHeelMassKg: '0 kg',
      avgTempC: '-129.0 °C',
      avgPressureMPa: '0.000 MPa',
      pressureRange: '0.00 ~ 0.00 MPa',
      isSelectionActive: isFiltered,
    };
  }

  let sumPreLoadKg = 0;
  let sumHeelKg = 0;
  let sumHeelVolM3 = 0;
  let sumHeelPct = 0;
  let sumTempC = 0;
  let sumPressMPa = 0;
  let minPress = 999;
  let maxPress = -999;

  targetTanks.forEach((tank) => {
    const metrics = getTankPhysicalMetrics(tank.tankNo, tank.serialNo);
    const dryTare = tank.arrivalHeelMetrics?.tareWeightKg || metrics.dryTareKg;
    const heelMass = tank.arrivalHeelMetrics?.arrivalMassKg || metrics.heelMassKg;
    const heelVol = metrics.heelVolumeM3 || parseFloat((heelMass / LNG_LIQUID_DENSITY_KG_M3).toFixed(2));
    const heelLevel = tank.arrivalHeelMetrics?.heelLevelPct ?? metrics.heelLevelPct;
    const press = tank.pressureMPa || metrics.pressureMPa;
    const temp = tank.tempC || metrics.tempC;
    const preLoad = dryTare + heelMass;

    sumPreLoadKg += preLoad;
    sumHeelKg += heelMass;
    sumHeelVolM3 += heelVol;
    sumHeelPct += heelLevel;
    sumTempC += temp;
    sumPressMPa += press;

    if (press < minPress) minPress = press;
    if (press > maxPress) maxPress = press;
  });

  const count = targetTanks.length;
  const totalPreLoadMassTon = (sumPreLoadKg / 1000).toFixed(1);
  const totalBufferVolumeM3 = `${sumHeelVolM3.toFixed(1)} m³`;
  const avgHeelVolumeM3 = `${(sumHeelVolM3 / count).toFixed(2)} m³`;
  const avgHeelMassKg = Math.round(sumHeelKg / count);
  const avgHeelLevelPct = (sumHeelPct / count).toFixed(2);
  const avgTempC = (sumTempC / count).toFixed(1);
  const avgPressureMPa = (sumPressMPa / count).toFixed(3);
  const pressureRange = `${minPress.toFixed(2)} ~ ${maxPress.toFixed(2)} MPa`;

  return {
    unitCountLabel: isFiltered ? `${selectedCount} Selected` : `${totalPoolCount} Units`,
    selectedCount,
    totalCount: totalPoolCount,
    totalPreLoadMassTon: `${totalPreLoadMassTon} Ton`,
    totalBufferVolumeM3,
    avgHeelVolumeM3,
    avgHeelLevelPct: `${avgHeelLevelPct}%`,
    avgHeelMassKg: `${avgHeelMassKg} kg`,
    avgTempC: `${avgTempC} °C`,
    avgPressureMPa: `${avgPressureMPa} MPa`,
    pressureRange,
    isSelectionActive: isFiltered,
  };
}
