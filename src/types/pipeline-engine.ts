// src/types/pipeline-engine.ts
/**
 * NIAS-CMMS: 5-Node Virtual Pipeline & Mass Balance Engine Types
 * Standard: ISO 6976 / GPA 2172 / ASME B31.3 / AGA Report No. 8 & 9
 * Strict UTF-8 (without BOM)
 */

export type ManifoldState =
  | 'STANDBY_STATIC'
  | 'PRSS_CONNECTED_DISCHARGING'
  | 'BOG_HEADER_VENTING';

export type TankLogisticsStatus =
  | 'NODE_1_ARUN_LOADING'
  | 'NODE_1_COQ_SIGNED'
  | 'NODE_2_SAVIOUR_TRANSIT'
  | 'NODE_3_NIAS_YARD_IDLE'
  | 'NODE_4_ACTIVE_DECANTING'
  | 'NODE_5_EMPTY_DECANTED'
  | 'NODE_5_BACKHAUL_RETURN';

export interface GasCompositionMolarFractions {
  methane: number;   // CH4 (mol fraction, e.g. 0.9024)
  ethane: number;    // C2H6 (mol fraction, e.g. 0.0562)
  propane: number;   // C3H8 (mol fraction, e.g. 0.0214)
  iButane: number;   // i-C4H10 (mol fraction, e.g. 0.0075)
  nButane: number;   // n-C4H10 (mol fraction, e.g. 0.0040)
  iPentane: number;  // i-C5H12 (mol fraction, e.g. 0.0005)
  nPentane: number;  // n-C5H12 (mol fraction, e.g. 0.0003)
  hexanePlus: number;// C6+ (mol fraction, e.g. 0.0002)
  nitrogen: number;  // N2 (mol fraction, e.g. 0.0085)
  co2: number;       // CO2 (mol fraction, e.g. 0.0001)
}

export interface ISO6976CalculatedProperties {
  molarMassKgKmol: number;         // M_mix (kg/kmol)
  compressibilityFactorZ: number;   // Z at 15°C, 101.325 kPa
  realRelativeDensity: number;      // d_real (air = 1.0)
  realDensityKgNm3: number;         // rho_real (kg/Nm³)
  ghvMJNm3: number;                 // Gross Heating Value (MJ/Nm³)
  ghvkJNm3: number;                 // Gross Heating Value (kJ/Nm³)
  ghvBtuScf: number;                // Gross Heating Value (BTU/SCF)
  ghvMJKg: number;                  // Gross Heating Value per mass (MJ/kg)
  lhvMJNm3: number;                 // Lower Heating Value (MJ/Nm³)
  lhvkJNm3: number;                 // Lower Heating Value (kJ/Nm³)
  wobbeIndexMJNm3: number;          // Wobbe Index WI = GHV / sqrt(d) (MJ/Nm³)
  wobbeIndexBtuScf: number;         // Wobbe Index in BTU/SCF
  methaneNumber: number;            // Methane Number (AVL / MWM approximation)
  referenceStandard: string;        // "ISO 6976:2016 (15°C / 15°C, 101.325 kPa)"
}

export interface CustodyTransferBaselineCOQ {
  batchId: string;
  tankNo: string;
  serialNo: string;
  signedTimestamp: string;
  loadingTerminal: string;         // e.g. "Arun PAG Loading Terminal"
  composition: GasCompositionMolarFractions;
  iso6976: ISO6976CalculatedProperties;
  liquidLevelPct: number;          // %
  liquidVolumeM3: number;          // m³
  liquidDensityKgM3: number;       // kg/m³
  custodyMassKg: number;           // Delivered net mass in kg
  grossEnergyMMBtu: number;        // Custody Transfer Energy MMBtu
  loadingTempC: number;            // Cryogenic filling temperature (°C)
  loadingPressureMPa: number;      // MPa
  inspectorName: string;
  isImmutableBaseline: boolean;
}

export interface DiscreteLogisticsEvent {
  eventId: string;
  eventType: 'ARUN_LOADING_COQ' | 'SAVIOUR_DEPARTURE' | 'SAVIOUR_ARRIVAL' | 'NIAS_YARD_CHECKIN' | 'BAY_MOUNT' | 'BAY_DEMOUNT';
  timestamp: string;
  tankNo: string;
  serialNo: string;
  nodeFrom: string;
  nodeTo: string;
  coqBaseline?: CustodyTransferBaselineCOQ;
  metadata: Record<string, unknown>;
}

export interface ContinuousTelemetryFrame1Hz {
  timestamp: string;
  sequenceId: number;
  // Node 4: Regas & PRSS
  node4PrssInletPressureBarg: number;
  node4PrssOutletPressureBarg: number;
  node4VaporizerOutletTempC: number;
  node4VolumeFlowNm3h: number;
  node4MassFlowKgH: number;
  node4DualMeteringRunAMscf: number;
  node4DualMeteringRunBMscf: number;
  node4DualRunDeltaPct: number;
  node4GcComposition: GasCompositionMolarFractions;
  node4Iso6976: ISO6976CalculatedProperties;
  // Node 5: 5 x MAN 7L 51/60 DF Engines
  node5Engines: {
    tag: string;           // "GEN-01" ~ "GEN-05"
    status: 'RUN' | 'STANDBY' | 'TRIP' | 'MAINT';
    powerOutputMW: number; // MW
    loadPercentage: number;// %
    gasInletPressBarg: number;
    gasTempC: number;
    fuelGasFlowNm3h: number;
    fuelGasFlowKgH: number;
    heatRateKjKwh: number;
    grossMwh: number;
  }[];
  node5TotalPowerMW: number;
  node5TotalGasDemandNm3h: number;
  node5TotalMassDemandKgH: number;
}

export interface TimeBucketAggregatedSample {
  bucketStart: string;
  bucketEnd: string;
  intervalType: '1_MINUTE' | '1_HOUR';
  sampleCount: number;
  avgPrssPressBarg: number;
  avgVaporizerTempC: number;
  totalVolumeNm3: number;
  totalMassKg: number;
  totalGrossMwh: number;
  avgPowerMW: number;
  avgHeatRateKjKwh: number;
  avgGHVMJNm3: number;
}

export interface TankThermodynamicState {
  tankNo: string;
  serialNo: string;
  logisticsStatus: TankLogisticsStatus;
  manifoldState: ManifoldState;
  yardCheckInTimestamp?: string;
  residenceHours: number;
  residenceDays: number;
  boilOffRatePctPerDay: number; // %/day, nominal 0.12 ~ 0.18
  thermalInleakCoefficientWK: number; // W/K
  currentLevelPct: number;
  currentLiquidMassKg: number;
  currentPressureMPa: number;
  currentPressureBarg: number;
  currentTempC: number;
  accumulatedBogLossKg: number;
  accumulatedBogLossMMBtu: number;
  bogRoutingDestination: 'BOG_RECOVERY_HEADER' | 'AMBIENT_SAFETY_VENT' | 'NONE_CONTAINED';
  safetyReliefValveSetpointBarg: number;
  pressureAlarmStatus: 'NORMAL' | 'WARN_APPROACHING_SETPOINT' | 'CRITICAL_RELIEF_VENTING';
}

export interface Rolling24HourMassBalanceResult {
  evaluationWindowStart: string;
  evaluationWindowEnd: string;
  // Mass Flow Equation Components (kg)
  massLoadedNode1ArunKg: number;
  massConsumedNode5PltmgKg: number;
  deltaMassInventoryNodes23Kg: number;
  massBogLossNodes23Kg: number;
  // Energy Flow Equation Components (MMBtu)
  energyLoadedNode1MMBtu: number;
  energyConsumedNode5MMBtu: number;
  // Reconciliation Metrics
  massBalanceDeltaKg: number;
  unaccountedForGasPercentage: number; // UAG %
  toleranceThresholdPercentage: number;// e.g. 1.5%
  isAnomalyDetected: boolean;
  anomalySeverity: 'PASS' | 'WARNING' | 'CRITICAL_DRIFT';
  rolling24hEfficiencyPct: number;
  uagAlarmEvent?: {
    alarmId: string;
    triggeredAt: string;
    message: string;
    suggestedAction: string;
  };
}

/**
 * High-Density SCADA Snapshot Response Payload
 * Strictly utilizes 100% standardized industrial English key nomenclature.
 */
export interface ScadaPfdAggregatedSnapshotResponse {
  SYSTEM_STATUS: 'ONLINE_OPTIMAL' | 'DEGRADED' | 'ALARM_ACTIVE';
  TIMESTAMP_ISO8601: string;
  PROCESS_CYCLE_HOURS: number;

  // Key Top-Level Industrial Standard KPI Metrics
  CUSTODY_TRANSFER_ENERGY_MMBTU: number;
  TRANSIT_FLEET_ACTIVE_COUNT: number;
  YARD_STATIC_INVENTORY_MT: number;
  PRSS_INLET_PRESSURE_BARG: number;
  GAS_CHROMATOGRAPH_GHV_MJ_NM3: number;
  GAS_CHROMATOGRAPH_WOBBE_INDEX_MJ_NM3: number;
  ENGINE_SPECIFIC_GAS_CONSUMPTION_KJ_KWH: number;
  MASS_BALANCE_UAG_PERCENTAGE: number;
  ROLLING_24H_EFFICIENCY_PCT: number;

  // Node 1: Arun PAG Terminal SCADA Block
  NODE_1_ARUN_HUB: {
    TERMINAL_NAME: string;
    LADEN_STOCK_COUNT: number;
    EMPTY_RETURN_BUFFER_COUNT: number;
    TOTAL_ALLOCATED_TANKS: number;
    COQ_LATEST_BATCH_ID: string;
    METHANE_MOL_PCT: number;
    LOWER_HEATING_VALUE_KJ_NM3: number;
    GROSS_HEATING_VALUE_BTU_SCF: number;
    TOTAL_BATCH_ENERGY_MMBTU: number;
    CUSTODY_TRANSFER_MASS_MT: number;
    STATUS: 'NORMAL_OPERATION' | 'LOADING' | 'STANDBY';
  };

  // Node 2: MV Saviour Dedicated Marine Transit SCADA Block
  NODE_2_MV_SAVIOUR: {
    VESSEL_NAME: string;
    VOYAGE_NUMBER: string;
    CARRIER_TANK_COUNT: number;
    TOTAL_LIQUID_VOLUME_M3: number;
    TOTAL_LIQUID_MASS_MT: number;
    AVERAGE_TANK_PRESSURE_MPA: number;
    CRUISING_SPEED_KNOTS: number;
    ETA_HOURS_REMAINING: number;
    ESTIMATED_ARRIVAL_TIMESTAMP: string;
    STATUS: 'UNDERWAY_LADEN' | 'BERTHING' | 'DISCHARGING';
  };

  // Node 3: Nias Laydown Yard & Decanting Bays SCADA Block
  NODE_3_NIAS_YARD: {
    ONSITE_TOTAL_TANK_COUNT: number;
    ONSITE_LADEN_READY_COUNT: number;
    ONSITE_EMPTY_STAGING_COUNT: number;
    ACTIVE_FEEDING_TANK_TAG: string;
    ACTIVE_FEED_LEVEL_PCT: number;
    ACTIVE_FEED_REMAINING_NM3: number;
    ACTIVE_SINGLE_TANK_AUTONOMY_HOURS: number;
    TOTAL_YARD_AUTONOMY_DAYS: number;
    SAFETY_STOCK_MARGIN_PCT: number;
    SAFETY_STATUS: '140% SAFE' | 'WARNING_LOW' | 'CRITICAL_BUFFER';
  };

  // Node 4: Regasification Skid & PRSS / GC SCADA Block
  NODE_4_REGAS_PRSS: {
    DISCHARGE_PRESSURE_BARG: number;
    VAPORIZER_OUTLET_TEMP_CELSIUS: number;
    INSTANTANEOUS_GAS_FLOW_NM3H: number;
    INSTANTANEOUS_MASS_FLOW_KG_H: number;
    DUAL_METERING_RUN_A_MSCF: number;
    DUAL_METERING_RUN_B_MSCF: number;
    DUAL_METERING_DELTA_PCT: number;
    GAS_QUALITY: ISO6976CalculatedProperties;
    ONLINE_GC_METHANE_PCT: number;
    METERING_AUDIT_STATUS: 'AUDIT_PASS' | 'DRIFT_WARNING' | 'RE_CALIBRATION_REQUIRED';
  };

  // Node 5: 25MW PLTMG Teluk Dalam Generation SCADA Block
  NODE_5_PLTMG_POWER_PLANT: {
    ACTIVE_POWER_OUTPUT_MW: number;
    PLANT_LOAD_PERCENTAGE_MCR: number;
    RUNNING_ENGINE_COUNT: number;
    TOTAL_INSTALLED_UNITS: number;
    TOTAL_GAS_DEMAND_NM3H: number;
    TOTAL_HEAT_RATE_KJ_KWH: number;
    DAILY_GROSS_GENERATION_MWH: number;
    GRID_FREQUENCY_HZ: number;
    ENGINES: {
      UNIT_TAG: string;
      STATUS: 'RUN' | 'STANDBY' | 'TRIP';
      POWER_KW: number;
      LOAD_PCT: number;
      GAS_INLET_BAR: number;
      GAS_FLOW_NM3H: number;
    }[];
  };

  // 120-Fleet Global Distribution Summary
  FLEET_DISTRIBUTION_SUMMARY: {
    TOTAL_FLEET_UNITS: number;
    NIAS_SITE_COUNT: number;
    NIAS_SITE_PCT: number;
    MV_SAVIOUR_COUNT: number;
    MV_SAVIOUR_PCT: number;
    PAG_ARUN_COUNT: number;
    PAG_ARUN_PCT: number;
  };

  // Rolling 24-Hour Mass Balance Reconciliation
  MASS_BALANCE_RECONCILIATION: Rolling24HourMassBalanceResult;

  // Active Anomaly Alarms
  ACTIVE_ALARMS: {
    ALARM_ID: string;
    MODULE: string;
    SEVERITY: 'INFO' | 'WARNING' | 'CRITICAL';
    MESSAGE: string;
    TIMESTAMP: string;
  }[];
}
