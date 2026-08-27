// src/data/mockTankData.ts

import { FleetTankItem } from '../types/lng';

export const LNG_LIQUID_DENSITY_KG_M3 = 445.0;

export interface TankPhysicalMetrics {
  dryTareKg: number;
  heelVolumeM3: number;
  heelMassKg: number;
  heelLevelPct: number;
  preLoadTareKg: number;
  pressureMPa: number;
  tempC: number;
}

export type { FleetTankItem };

/**
 * Deterministic hash-based physical parameter generator for realistic tank diversification.
 * Generates consistent, physics-bound parameters based on tank number and serial number.
 * - Standard Dry Tare baseline: Fixed nameplate 10,850 kg
 * - Heel Volume: 0.95 ~ 1.05 m³ (Target 1.00 m³)
 * - Heel Mass: Math.round(heelVolumeM3 * 445.0 kg/m³) (~423 ~ 467 kg)
 * - Pre-Load Tare: dryTare + heelKg (e.g., 10,850 + 445 = 11,295 kg)
 */
export function getTankPhysicalMetrics(tankNo: string, serialNo: string): TankPhysicalMetrics {
  let hash = 0;
  const str = `${tankNo || ''}-${serialNo || ''}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const posHash = Math.abs(hash);

  // 1. Dry Tare: Fixed nameplate baseline 10,850 kg
  const dryTareKg = 10850;
  // 2. Heel Volume (m³): 0.95 ~ 1.05 m³ (Target: 1.00 m³)
  const heelVolumeM3 = parseFloat((0.95 + (((posHash >> 3) % 11) / 100)).toFixed(2));
  // 3. Heel Mass: Calculated with standard LNG liquid density 445.0 kg/m³
  const heelMassKg = Math.round(heelVolumeM3 * LNG_LIQUID_DENSITY_KG_M3);
  // 4. Heel Level Pct: Nominal percentage of standard 24 m³ ISO tank capacity
  const heelLevelPct = parseFloat(((heelVolumeM3 / 24.0) * 100).toFixed(2));
  // 5. Pre-Load Tare: Computed sum (Dry Tare + Heel Mass, e.g. 10,850 + 445 = 11,295 kg)
  const preLoadTareKg = dryTareKg + heelMassKg;
  // 6. Holding Pressure: 0.260 ~ 0.350 MPa
  const pressureMPa = parseFloat((0.26 + (((posHash >> 7) % 91) / 1000)).toFixed(3));
  // 7. Holding Temp: -135.0 ~ -124.0 °C
  const tempC = parseFloat((-135.0 + (((posHash >> 9) % 111) / 10)).toFixed(1));

  return {
    dryTareKg,
    heelVolumeM3,
    heelMassKg,
    heelLevelPct,
    preLoadTareKg,
    pressureMPa,
    tempC,
  };
}
