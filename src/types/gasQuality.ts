/**
 * Gas Quality & Flow Metering Database-Ready Master Record Schema
 * Full schema parity across Sections 1 (Cumulative), 2 (Daily), 3 (Conditions), 4 (GC Fractions).
 */

export interface MeterCumulativeFlow {
  uvol: number;      // MMCF Uncorrected Volume
  cvol: number;      // MMCF Corrected Volume
  massTonne: number; // Tonne Mass
  mmbtu: number;     // MMBTU Energy
}

export interface MeterDailyFlow {
  uvol: number;      // MMCF Uncorrected Volume
  cvol: number;      // MMCF Corrected Volume
  massTonne: number; // Tonne Mass
  mmbtu: number;     // MMBTU Energy
}

export interface MeterGasCondition {
  pressBarg: number; // Operating Pressure in Barg
  tempC: number;     // Gas Temperature in °C
  lineDens: number;  // Operating Density in kg/m3
  lineZf: number;    // Compressibility Factor (Zf)
  ghv: number;       // Gross Heating Value in BTU/SCF
}

export interface GasMolecularComposition {
  ch4: number;       // Methane (% Mol)
  c2h6: number;      // Ethane (% Mol)
  c3h8: number;      // Propane (% Mol)
  iC4: number;       // i-Butane (% Mol)
  nC4: number;       // n-Butane (% Mol)
  iC5: number;       // i-Pentane (% Mol)
  nC5: number;       // n-Pentane (% Mol)
  n2: number;        // Nitrogen (% Mol)
  co2: number;       // Carbon Dioxide (% Mol)
}

export interface GasHeavyTrace {
  hexane: number;    // C6 Hexane (% Mol)
  heptane: number;   // C7 Heptane (% Mol)
  octane: number;    // C8 Octane (% Mol)
  nonane: number;    // C9 Nonane (% Mol)
  decane: number;    // C10 Decane (% Mol)
  h2s: number;       // Hydrogen Sulfide (% Mol or ppm)
  h2o: number;       // Moisture content (% Mol or mg/Nm3)
}

export interface GasQualityMasterRecord {
  // [General & Meta]
  date: string;                     // YYYY-MM-DD
  status: 'DELIVERED' | 'STANDBY' | 'MAINTENANCE';
  activeFeedTank: string;           // e.g. "ISOT-009"
  serialNo?: string;                // e.g. "SIMU-8101426"

  // [Section 1: Common / Cumulative]
  cumMeterA: MeterCumulativeFlow;
  cumMeterB: MeterCumulativeFlow;
  cumStation: MeterCumulativeFlow;

  // [Section 2: Daily Flow & Energy]
  dailyMeterA: MeterDailyFlow;
  dailyMeterB: MeterDailyFlow;
  dailyStation: MeterDailyFlow;

  // [Section 3: Gas Condition & Physical Properties]
  conditionMeterA: MeterGasCondition;
  conditionMeterB: MeterGasCondition;

  // [Section 4: GC Molecular Fractions (% Mol)]
  gcActiveTank: GasMolecularComposition;
  gcMeterA: GasMolecularComposition;
  gcMeterB: GasMolecularComposition;

  // [Heavy Trace / C5-C10 Hydrocarbons]
  heavyTrace?: GasHeavyTrace;

  // [Audit Meta]
  submittedAt?: string;
}
