// src/lib/iso6976-engine.ts
/**
 * ISO 6976:2016 / GPA 2172 Thermodynamic & Energy Conversion Calculation Engine
 * Natural Gas - Calculation of calorific values, density, relative density and Wobbe indices
 * Reference condition: 15°C / 15°C, 101.325 kPa (with Normal cubic meter conversions at 0°C, 101.325 kPa)
 * Strict UTF-8 (without BOM)
 */

import { GasCompositionMolarFractions, ISO6976CalculatedProperties } from '@/types/pipeline-engine';

interface ComponentPhysData {
  name: string;
  formula: string;
  molarMass: number;      // M_i (kg/kmol or g/mol)
  grossCalorificKjMol: number; // H_c^G (kJ/mol = MJ/kmol at 15°C)
  netCalorificKjMol: number;   // H_c^N (kJ/mol = MJ/kmol at 15°C)
  summationFactorSqrtB: number; // sqrt(b_i) at 15°C, 101.325 kPa
}

// ISO 6976 / GPA 2172 Reference Physical Parameters Table
const COMPONENT_DATA: Record<keyof GasCompositionMolarFractions, ComponentPhysData> = {
  methane: {
    name: 'Methane',
    formula: 'CH4',
    molarMass: 16.0425,
    grossCalorificKjMol: 890.58,
    netCalorificKjMol: 802.34,
    summationFactorSqrtB: 0.0447,
  },
  ethane: {
    name: 'Ethane',
    formula: 'C2H6',
    molarMass: 30.0690,
    grossCalorificKjMol: 1560.69,
    netCalorificKjMol: 1428.64,
    summationFactorSqrtB: 0.0922,
  },
  propane: {
    name: 'Propane',
    formula: 'C3H8',
    molarMass: 44.0956,
    grossCalorificKjMol: 2219.17,
    netCalorificKjMol: 2041.36,
    summationFactorSqrtB: 0.1338,
  },
  iButane: {
    name: 'Isobutane',
    formula: 'i-C4H10',
    molarMass: 58.1222,
    grossCalorificKjMol: 2868.20,
    netCalorificKjMol: 2648.56,
    summationFactorSqrtB: 0.1772,
  },
  nButane: {
    name: 'Normal Butane',
    formula: 'n-C4H10',
    molarMass: 58.1222,
    grossCalorificKjMol: 2877.40,
    netCalorificKjMol: 2657.48,
    summationFactorSqrtB: 0.1871,
  },
  iPentane: {
    name: 'Isopentane',
    formula: 'i-C5H12',
    molarMass: 72.1488,
    grossCalorificKjMol: 3528.83,
    netCalorificKjMol: 3263.81,
    summationFactorSqrtB: 0.2280,
  },
  nPentane: {
    name: 'Normal Pentane',
    formula: 'n-C5H12',
    molarMass: 72.1488,
    grossCalorificKjMol: 3535.77,
    netCalorificKjMol: 3270.56,
    summationFactorSqrtB: 0.2377,
  },
  hexanePlus: {
    name: 'Hexanes Plus (C6+)',
    formula: 'C6H14+',
    molarMass: 86.1754,
    grossCalorificKjMol: 4194.95,
    netCalorificKjMol: 3886.56,
    summationFactorSqrtB: 0.2950,
  },
  nitrogen: {
    name: 'Nitrogen',
    formula: 'N2',
    molarMass: 28.0134,
    grossCalorificKjMol: 0.0,
    netCalorificKjMol: 0.0,
    summationFactorSqrtB: 0.0210,
  },
  co2: {
    name: 'Carbon Dioxide',
    formula: 'CO2',
    molarMass: 44.0095,
    grossCalorificKjMol: 0.0,
    netCalorificKjMol: 0.0,
    summationFactorSqrtB: 0.0762,
  },
};

// Standard Reference Ambient Constants
const MOLAR_GAS_CONSTANT_R = 8.314462618; // J/(mol·K)
const MOLAR_VOLUME_IDEAL_15C = 0.0236443;  // m³/mol at 15°C, 101.325 kPa
const MOLAR_VOLUME_IDEAL_0C = 0.0224140;   // m³/mol (Nm³/mol) at 0°C, 101.325 kPa
const AIR_MOLAR_MASS = 28.9626;            // kg/kmol (Dry standard air)
const AIR_COMPRESSIBILITY_15C = 0.99958;   // Z_air at 15°C, 101.325 kPa

// Unit Conversion Constants
const MJ_M3_TO_BTU_SCF = 26.8392;          // 1 MJ/m³ = 26.8392 BTU/SCF (ISO 6976)
const MMBTU_TO_MJ = 1055.056;

/**
 * Normalizes input molar fractions so sum = 1.000000
 */
export function normalizeComposition(
  raw: Partial<GasCompositionMolarFractions>
): GasCompositionMolarFractions {
  const defaults: GasCompositionMolarFractions = {
    methane: 0.9024,
    ethane: 0.0562,
    propane: 0.0214,
    iButane: 0.0075,
    nButane: 0.0040,
    iPentane: 0.0005,
    nPentane: 0.0003,
    hexanePlus: 0.0002,
    nitrogen: 0.0085,
    co2: 0.0001,
  };

  const comp: GasCompositionMolarFractions = {
    methane: Math.max(0, raw.methane ?? defaults.methane),
    ethane: Math.max(0, raw.ethane ?? defaults.ethane),
    propane: Math.max(0, raw.propane ?? defaults.propane),
    iButane: Math.max(0, raw.iButane ?? defaults.iButane),
    nButane: Math.max(0, raw.nButane ?? defaults.nButane),
    iPentane: Math.max(0, raw.iPentane ?? defaults.iPentane),
    nPentane: Math.max(0, raw.nPentane ?? defaults.nPentane),
    hexanePlus: Math.max(0, raw.hexanePlus ?? defaults.hexanePlus),
    nitrogen: Math.max(0, raw.nitrogen ?? defaults.nitrogen),
    co2: Math.max(0, raw.co2 ?? defaults.co2),
  };

  const sum =
    comp.methane +
    comp.ethane +
    comp.propane +
    comp.iButane +
    comp.nButane +
    comp.iPentane +
    comp.nPentane +
    comp.hexanePlus +
    comp.nitrogen +
    comp.co2;

  if (sum <= 0) return defaults;

  return {
    methane: comp.methane / sum,
    ethane: comp.ethane / sum,
    propane: comp.propane / sum,
    iButane: comp.iButane / sum,
    nButane: comp.nButane / sum,
    iPentane: comp.iPentane / sum,
    nPentane: comp.nPentane / sum,
    hexanePlus: comp.hexanePlus / sum,
    nitrogen: comp.nitrogen / sum,
    co2: comp.co2 / sum,
  };
}

/**
 * Executes rigorous ISO 6976:2016 calculation routine.
 */
export function calculateISO6976(
  compositionInput: Partial<GasCompositionMolarFractions>
): ISO6976CalculatedProperties {
  const x = normalizeComposition(compositionInput);

  let molarMassMix = 0.0;
  let idealGrossCalorificMolar = 0.0; // MJ/kmol (= kJ/mol)
  let idealNetCalorificMolar = 0.0;   // MJ/kmol
  let sumSqrtB = 0.0;

  const keys = Object.keys(COMPONENT_DATA) as (keyof GasCompositionMolarFractions)[];

  for (const k of keys) {
    const fraction = x[k];
    const data = COMPONENT_DATA[k];

    molarMassMix += fraction * data.molarMass;
    idealGrossCalorificMolar += fraction * data.grossCalorificKjMol;
    idealNetCalorificMolar += fraction * data.netCalorificKjMol;
    sumSqrtB += fraction * data.summationFactorSqrtB;
  }

  // 1. Real gas compressibility factor Z_mix at 15°C, 101.325 kPa
  const compressibilityZ = Math.max(0.95, 1.0 - Math.pow(sumSqrtB, 2));

  // 2. Real Relative Density (d_real) relative to dry air
  const realRelativeDensity =
    (molarMassMix / compressibilityZ) / (AIR_MOLAR_MASS / AIR_COMPRESSIBILITY_15C);

  // 3. Real Density at Normal condition (0°C, 101.325 kPa) in kg/Nm³
  // Z at 0°C is slightly lower than at 15°C (approx Z_0C = Z_15C * 0.9985)
  const z0C = compressibilityZ * 0.9988;
  const realDensityKgNm3 = molarMassMix / (MOLAR_VOLUME_IDEAL_0C * 1000 * z0C);

  // 4. Gross Heating Value (GHV) per standard volume
  // Ideal volumetric GHV at 0°C (Normal m³)
  const ghvMJNm3 = idealGrossCalorificMolar / (MOLAR_VOLUME_IDEAL_0C * 1000 * z0C);
  const ghvkJNm3 = ghvMJNm3 * 1000;
  
  // At 15°C reference (ISO metric Standard m³):
  const ghvMJSm3 = idealGrossCalorificMolar / (MOLAR_VOLUME_IDEAL_15C * 1000 * compressibilityZ);
  const ghvBtuScf = ghvMJSm3 * MJ_M3_TO_BTU_SCF;

  // GHV per mass (MJ/kg)
  const ghvMJKg = idealGrossCalorificMolar / molarMassMix;

  // 5. Lower Heating Value (LHV)
  const lhvMJNm3 = idealNetCalorificMolar / (MOLAR_VOLUME_IDEAL_0C * 1000 * z0C);
  const lhvkJNm3 = lhvMJNm3 * 1000;

  // 6. Wobbe Index (WI) = GHV / sqrt(d)
  const wobbeIndexMJNm3 = ghvMJNm3 / Math.sqrt(realRelativeDensity);
  const wobbeIndexBtuScf = ghvBtuScf / Math.sqrt(realRelativeDensity);

  // 7. Methane Number (MN) calculation (AVL method approximation)
  // Higher C2+ lowers MN; Inerts (N2, CO2) increase knock resistance
  const totalC2Plus =
    x.ethane + x.propane + x.iButane + x.nButane + x.iPentane + x.nPentane + x.hexanePlus;
  const totalInerts = x.nitrogen + x.co2;
  const rawMN =
    100.0 -
    totalC2Plus * 180.0 -
    (x.propane + x.iButane + x.nButane) * 75.0 +
    totalInerts * 35.0;
  const methaneNumber = Math.min(100, Math.max(65, Math.round(rawMN * 10) / 10));

  return {
    molarMassKgKmol: Math.round(molarMassMix * 10000) / 10000,
    compressibilityFactorZ: Math.round(compressibilityZ * 10000) / 10000,
    realRelativeDensity: Math.round(realRelativeDensity * 10000) / 10000,
    realDensityKgNm3: Math.round(realDensityKgNm3 * 1000) / 1000,
    ghvMJNm3: Math.round(ghvMJNm3 * 100) / 100,
    ghvkJNm3: Math.round(ghvkJNm3),
    ghvBtuScf: Math.round(ghvBtuScf * 10) / 10,
    ghvMJKg: Math.round(ghvMJKg * 100) / 100,
    lhvMJNm3: Math.round(lhvMJNm3 * 100) / 100,
    lhvkJNm3: Math.round(lhvkJNm3),
    wobbeIndexMJNm3: Math.round(wobbeIndexMJNm3 * 100) / 100,
    wobbeIndexBtuScf: Math.round(wobbeIndexBtuScf * 10) / 10,
    methaneNumber,
    referenceStandard: 'ISO 6976:2016 (15°C / 15°C, 101.325 kPa)',
  };
}

/**
 * Converts Volume in Nm³ to Energy in MMBtu using computed ISO 6976 GHV
 */
export function volumeNm3ToEnergyMMBtu(volumeNm3: number, ghvkJNm3: number): number {
  const totalKj = volumeNm3 * ghvkJNm3;
  const totalMJ = totalKj / 1000;
  return totalMJ / MMBTU_TO_MJ;
}

/**
 * Converts Mass in Kg to Energy in MMBtu using computed ISO 6976 GHV
 */
export function massKgToEnergyMMBtu(massKg: number, ghvMJKg: number): number {
  const totalMJ = massKg * ghvMJKg;
  return totalMJ / MMBTU_TO_MJ;
}
