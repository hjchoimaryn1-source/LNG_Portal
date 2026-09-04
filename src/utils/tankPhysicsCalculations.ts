// src/utils/tankPhysicsCalculations.ts

// Physical Constants based on 950 mmH2O full-span & 44.0 m3 max volume & 441.0 kg/m3 density
export const TANK_FULL_SPAN_MMH2O = 950;
export const TANK_MAX_VOLUME_M3 = 44.0;
export const LNG_DENSITY_KG_M3 = 441.0;

export const calcVolumeFromMmH2O = (mm: number): number => {
  return parseFloat(((mm / TANK_FULL_SPAN_MMH2O) * TANK_MAX_VOLUME_M3).toFixed(1));
};

export const calcMassTonFromVolume = (volM3: number): number => {
  return parseFloat(((volM3 * LNG_DENSITY_KG_M3) / 1000).toFixed(2));
};

export const calcPctFromMmH2O = (mm: number): number => {
  return parseFloat(((mm / TANK_FULL_SPAN_MMH2O) * 100).toFixed(1));
};
