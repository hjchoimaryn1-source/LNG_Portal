/**
 * Official PLTMG Gunungsitoli Engine & Fuel Consumption Base Specification
 * Engine Model: MAN 7L 51/60 DF (Dual Fuel)
 */

export interface PltmgEngineLoadPoint {
  loadPct: number;              // % (e.g. 25, 50, 75, 85, 100)
  outputKw: number;             // kW
  heatRateKjKwh: number;        // kJ/kWh
  gasFlowNm3h: number;          // Nm3/h per engine
  sfcNm3Kwh: number;            // Nm3/kWh
  autonomyHoursPerTank: number; // Hours 1 ISO tank lasts (25,335 Nm3)
  autonomyHours8Tanks: number;  // Hours 8 ISO tanks last (202,680 Nm3)
}

export interface PltmgEngineSpec {
  model: string;
  manufacturer: string;
  type: string;
  cylinderCount: number;
  boreMm: number;
  strokeMm: number;
  speedRpm: number;
  mcrPerEngineKw: number;       // 7,350 kW (7.35 MW)
  engineCount: number;          // 5 units
  totalPlantMcrKw: number;      // 36,750 kW (36.75 MW)
  baseHeatRateKjKwh: number;    // 7,150 kJ/kWh
  referenceLhvKjNm3: number;    // 28,000 kJ/Nm3 (Standard Fuel Gas LHV)
  isoTankGasVolumeNm3: number;  // 25,335 Nm3 per standard 40ft/45ft ISO tank
  loadTable: PltmgEngineLoadPoint[];
}

export const PLTMG_MAN_ENGINE_SPEC: PltmgEngineSpec = {
  model: 'MAN 7L 51/60 DF',
  manufacturer: 'MAN Energy Solutions',
  type: 'Four-stroke Dual-Fuel Engine (Gas & Diesel)',
  cylinderCount: 7,
  boreMm: 510,
  strokeMm: 600,
  speedRpm: 500, // or 514 rpm at 50/60 Hz
  mcrPerEngineKw: 7350,
  engineCount: 5,
  totalPlantMcrKw: 36750,
  baseHeatRateKjKwh: 7150,
  referenceLhvKjNm3: 28000,
  isoTankGasVolumeNm3: 25335,
  loadTable: [
    {
      loadPct: 25,
      outputKw: 1838,
      heatRateKjKwh: 8650,
      gasFlowNm3h: 567.8,
      sfcNm3Kwh: 0.3089,
      autonomyHoursPerTank: 44.6,
      autonomyHours8Tanks: 356.9,
    },
    {
      loadPct: 50,
      outputKw: 3675,
      heatRateKjKwh: 7680,
      gasFlowNm3h: 1008.0,
      sfcNm3Kwh: 0.2743,
      autonomyHoursPerTank: 25.1,
      autonomyHours8Tanks: 201.1,
    },
    {
      loadPct: 75,
      outputKw: 5513,
      heatRateKjKwh: 7280,
      gasFlowNm3h: 1433.4,
      sfcNm3Kwh: 0.2600,
      autonomyHoursPerTank: 17.7,
      autonomyHours8Tanks: 141.4,
    },
    {
      loadPct: 85,
      outputKw: 6248,
      heatRateKjKwh: 7190,
      gasFlowNm3h: 1604.4,
      sfcNm3Kwh: 0.2568,
      autonomyHoursPerTank: 15.8,
      autonomyHours8Tanks: 126.3,
    },
    {
      loadPct: 100,
      outputKw: 7350,
      heatRateKjKwh: 7150,
      gasFlowNm3h: 1876.9,
      sfcNm3Kwh: 0.2554,
      autonomyHoursPerTank: 13.5,
      autonomyHours8Tanks: 108.0,
    },
  ],
};

export interface EngineSpecConfig {
  modelName: string;            // Fixed: "MAN 7L 51/60 DF"
  mcrKwPerUnit: number;         // Unit MCR (kW) - default 7350
  ncrKwPerUnit: number;         // Unit NCR (kW) - default 6615 (90% MCR)
  heatRateKjKwh: number;        // Gas Consumption Rate (kJ/kWh) - default 7150
  referenceLhvKjNm3: number;    // Design Gas LHV (kJ/Nm3) - default 28000
  isoTankGasVolumeNm3: number;  // ISO Tank Gas Volume (Nm3) - default 25335
}

export const DEFAULT_ENGINE_SPEC_CONFIG: EngineSpecConfig = {
  modelName: 'MAN 7L 51/60 DF',
  mcrKwPerUnit: 7350,
  ncrKwPerUnit: 6615,
  heatRateKjKwh: 7150,
  referenceLhvKjNm3: 28000,
  isoTankGasVolumeNm3: 25335,
};

/**
 * Calculate instantaneous fuel gas flow rate (Nm3/h) for a given engine power output
 * Formula: Flow (Nm3/h) = (Power (kW) * HeatRate (kJ/kWh)) / LHV (kJ/Nm3)
 */
export function calcEngineGasFlowNm3h(
  activePowerKw: number,
  heatRateKjKwh: number = PLTMG_MAN_ENGINE_SPEC.baseHeatRateKjKwh,
  lhvKjNm3: number = PLTMG_MAN_ENGINE_SPEC.referenceLhvKjNm3
): number {
  if (activePowerKw <= 0) return 0;
  return (activePowerKw * heatRateKjKwh) / lhvKjNm3;
}

/**
 * Calculate total autonomy buffer hours from available on-site ISO tanks
 * Formula: Hours = (Onsite Tanks * 25,335 Nm3) / Total Gas Flow (Nm3/h)
 */
export function calcAutonomyBufferHours(
  totalGasFlowNm3h: number,
  onsiteTankCount: number = 8,
  volumePerTankNm3: number = PLTMG_MAN_ENGINE_SPEC.isoTankGasVolumeNm3
): number {
  if (totalGasFlowNm3h <= 0) return 999.0;
  const totalGasInventoryNm3 = onsiteTankCount * volumePerTankNm3;
  return totalGasInventoryNm3 / totalGasFlowNm3h;
}
