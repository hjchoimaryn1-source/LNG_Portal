// src/services/scada-pfd-service.ts
/**
 * SCADA PFD Aggregated Snapshot Service
 * Powers the single-call high-density SCADA endpoint for NIAS-CMMS.
 * Strict UTF-8 (without BOM)
 */

import { ScadaPfdAggregatedSnapshotResponse } from '@/types/pipeline-engine';
import { calculateISO6976 } from '@/lib/iso6976-engine';
import { evaluateTankThermodynamicState } from '@/lib/tank-thermo-engine';
import { globalMassBalanceEngine } from '@/lib/mass-balance-engine';

export class ScadaPfdService {
  public static generatePfdSnapshot(timestampIso?: string): ScadaPfdAggregatedSnapshotResponse {
    const now = timestampIso ? new Date(timestampIso) : new Date();

    // 1. Gas Quality from Node 4 GC
    const currentGasComposition = {
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
    const iso6976Props = calculateISO6976(currentGasComposition);

    // 2. Thermodynamic State of Active Feeding Tank ISOT-009
    const activeFeedTankThermo = evaluateTankThermodynamicState({
      tankNo: 'ISOT-009',
      serialNo: 'SIMU-8101509',
      logisticsStatus: 'NODE_4_ACTIVE_DECANTING',
      manifoldState: 'PRSS_CONNECTED_DISCHARGING',
      initialLevelPct: 88.5,
      initialPressureMpa: 0.22,
    });

    // 3. Rolling 24-Hour Mass Balance Reconciliation
    const massBalance = globalMassBalanceEngine.computeRolling24HourMassBalance(now.toISOString());

    // 4. Plant Generation & Dispatch (4 Units Running @ 4.41 MW = 17.64 MW)
    const runningUnitsCount = 4;
    const totalPowerMW = 17.64;
    const totalPowerKw = 17640;
    const totalMcrKw = 7350 * 5; // 36,750 kW (36.75 MW)
    const plantLoadPctMcr = Math.round((totalPowerKw / totalMcrKw) * 1000) / 10; // 48.0%
    const totalGasDemandNm3h = 4505.0; // 4,505 Nm³/h
    const heatRateKjKwh = 7150.0;     // 7,150 kJ/kWh
    const dailyGrossMwh = Math.round(totalPowerMW * 24 * 10) / 10; // 423.4 MWh

    const engines = [
      { UNIT_TAG: 'GEN-01', STATUS: 'RUN' as const, POWER_KW: 4410, LOAD_PCT: 60.0, GAS_INLET_BAR: 2.18, GAS_FLOW_NM3H: 1126.3 },
      { UNIT_TAG: 'GEN-02', STATUS: 'RUN' as const, POWER_KW: 4410, LOAD_PCT: 60.0, GAS_INLET_BAR: 2.18, GAS_FLOW_NM3H: 1126.3 },
      { UNIT_TAG: 'GEN-03', STATUS: 'RUN' as const, POWER_KW: 4410, LOAD_PCT: 60.0, GAS_INLET_BAR: 2.18, GAS_FLOW_NM3H: 1126.3 },
      { UNIT_TAG: 'GEN-04', STATUS: 'RUN' as const, POWER_KW: 4410, LOAD_PCT: 60.0, GAS_INLET_BAR: 2.18, GAS_FLOW_NM3H: 1126.3 },
      { UNIT_TAG: 'GEN-05', STATUS: 'STANDBY' as const, POWER_KW: 0, LOAD_PCT: 0.0, GAS_INLET_BAR: 0.0, GAS_FLOW_NM3H: 0.0 },
    ];

    // 5. Fleet Inventory Metrics (120 Total Units Exact Reconciliation)
    const totalFleetUnits = 120;
    const niasSiteCount = 11;      // 10 Laden (1 Active Feed + 9 Ready Buffer) + 1 Empty (ISOT-064)
    const niasSitePct = 9.2;
    const mvSaviourCount = 99;     // 99 Laden in Marine Transit
    const mvSaviourPct = 82.5;
    const pagArunLadenCount = 0;   // 0 Laden Ready
    const pagArunEmptyCount = 10;  // 10 Empty Return Buffer
    const pagArunCount = 10;
    const pagArunPct = 8.3;

    const onsiteLadenReadyCount = 9;   // 9 Ready Buffer in Yard
    const onsiteEmptyStagingCount = 1; // 1 Empty Return (ISOT-064)
    const yardAutonomyDays = Math.round((((onsiteLadenReadyCount + 1) * 25335) / totalGasDemandNm3h / 24) * 100) / 100; // 2.34 Days
    const activeSingleTankAutonomyHours = Math.round((activeFeedTankThermo.currentLiquidMassKg / (totalGasDemandNm3h * iso6976Props.realDensityKgNm3)) * 10) / 10 || 2.8;

    // 6. Alarms Array
    const activeAlarms = [];
    if (massBalance.isAnomalyDetected && massBalance.uagAlarmEvent) {
      activeAlarms.push({
        ALARM_ID: massBalance.uagAlarmEvent.alarmId,
        MODULE: 'MASS_BALANCE_ENGINE',
        SEVERITY: (massBalance.anomalySeverity === 'CRITICAL_DRIFT' ? 'CRITICAL' : 'WARNING') as 'WARNING' | 'CRITICAL',
        MESSAGE: massBalance.uagAlarmEvent.message,
        TIMESTAMP: massBalance.uagAlarmEvent.triggeredAt,
      });
    }

    // Top-Level Standardized Industrial English Response Assembly
    return {
      SYSTEM_STATUS: activeAlarms.length > 0 ? 'ALARM_ACTIVE' : 'ONLINE_OPTIMAL',
      TIMESTAMP_ISO8601: now.toISOString(),
      PROCESS_CYCLE_HOURS: 24.0,

      // High-Priority Standardized Industrial KPI Keys
      CUSTODY_TRANSFER_ENERGY_MMBTU: 29485.0,
      TRANSIT_FLEET_ACTIVE_COUNT: mvSaviourCount,
      YARD_STATIC_INVENTORY_MT: Math.round((onsiteLadenReadyCount + 1) * 19.8 * 10) / 10, // ~198.0 MT
      PRSS_INLET_PRESSURE_BARG: 2.18,
      GAS_CHROMATOGRAPH_GHV_MJ_NM3: iso6976Props.ghvMJNm3,
      GAS_CHROMATOGRAPH_WOBBE_INDEX_MJ_NM3: iso6976Props.wobbeIndexMJNm3,
      ENGINE_SPECIFIC_GAS_CONSUMPTION_KJ_KWH: heatRateKjKwh,
      MASS_BALANCE_UAG_PERCENTAGE: massBalance.unaccountedForGasPercentage,
      ROLLING_24H_EFFICIENCY_PCT: massBalance.rolling24hEfficiencyPct,

      // Node 1: Arun PAG Hub (0 Laden / 10 Empty Return Buffer)
      NODE_1_ARUN_HUB: {
        TERMINAL_NAME: 'Arun Port & PAG LNG Loading Terminal (Aceh, Indonesia)',
        LADEN_STOCK_COUNT: pagArunLadenCount,
        EMPTY_RETURN_BUFFER_COUNT: pagArunEmptyCount,
        TOTAL_ALLOCATED_TANKS: pagArunCount,
        COQ_LATEST_BATCH_ID: 'PAG-ARUN-2026-B08',
        METHANE_MOL_PCT: 95.5,
        LOWER_HEATING_VALUE_KJ_NM3: 28000,
        GROSS_HEATING_VALUE_BTU_SCF: 1056.4,
        TOTAL_BATCH_ENERGY_MMBTU: 0.0,
        CUSTODY_TRANSFER_MASS_MT: 0.0,
        STATUS: 'NORMAL_OPERATION',
      },

      // Node 2: MV. Saviour Dedicated Marine Carrier (99 Units)
      NODE_2_MV_SAVIOUR: {
        VESSEL_NAME: 'MV. Saviour',
        VOYAGE_NUMBER: 'VOY-SAV-2026-07',
        CARRIER_TANK_COUNT: mvSaviourCount,
        TOTAL_LIQUID_VOLUME_M3: 4059.0,
        TOTAL_LIQUID_MASS_MT: 1826.5,
        AVERAGE_TANK_PRESSURE_MPA: 0.18,
        CRUISING_SPEED_KNOTS: 9.8,
        ETA_HOURS_REMAINING: 18.0,
        ESTIMATED_ARRIVAL_TIMESTAMP: new Date(now.getTime() + 18 * 3600 * 1000).toISOString(),
        STATUS: 'UNDERWAY_LADEN',
      },

      // Node 3: Nias Laydown Yard & Active Decanting Bays (11 Units: 1 Active + 9 Ready + 1 Empty)
      NODE_3_NIAS_YARD: {
        ONSITE_TOTAL_TANK_COUNT: niasSiteCount,
        ONSITE_LADEN_READY_COUNT: onsiteLadenReadyCount,
        ONSITE_EMPTY_STAGING_COUNT: onsiteEmptyStagingCount,
        ACTIVE_FEEDING_TANK_TAG: 'ISOT-009',
        ACTIVE_FEED_LEVEL_PCT: 49.0,
        ACTIVE_FEED_REMAINING_NM3: Math.round(25335 * 0.49),
        ACTIVE_SINGLE_TANK_AUTONOMY_HOURS: activeSingleTankAutonomyHours,
        TOTAL_YARD_AUTONOMY_DAYS: yardAutonomyDays,
        SAFETY_STOCK_MARGIN_PCT: 100,
        SAFETY_STATUS: '140% SAFE',
      },

      // Node 4: Regasification Skid & PRSS / GC
      NODE_4_REGAS_PRSS: {
        DISCHARGE_PRESSURE_BARG: 2.18,
        VAPORIZER_OUTLET_TEMP_CELSIUS: 24.5,
        INSTANTANEOUS_GAS_FLOW_NM3H: totalGasDemandNm3h,
        INSTANTANEOUS_MASS_FLOW_KG_H: Math.round(totalGasDemandNm3h * iso6976Props.realDensityKgNm3 * 10) / 10,
        DUAL_METERING_RUN_A_MSCF: 14820.5,
        DUAL_METERING_RUN_B_MSCF: 14815.2,
        DUAL_METERING_DELTA_PCT: -0.04,
        GAS_QUALITY: iso6976Props,
        ONLINE_GC_METHANE_PCT: 90.80,
        METERING_AUDIT_STATUS: 'AUDIT_PASS',
      },

      // Node 5: 25MW PLTMG Teluk Dalam Generation
      NODE_5_PLTMG_POWER_PLANT: {
        ACTIVE_POWER_OUTPUT_MW: totalPowerMW,
        PLANT_LOAD_PERCENTAGE_MCR: plantLoadPctMcr,
        RUNNING_ENGINE_COUNT: runningUnitsCount,
        TOTAL_INSTALLED_UNITS: 5,
        TOTAL_GAS_DEMAND_NM3H: totalGasDemandNm3h,
        TOTAL_HEAT_RATE_KJ_KWH: heatRateKjKwh,
        DAILY_GROSS_GENERATION_MWH: dailyGrossMwh,
        GRID_FREQUENCY_HZ: 50.02,
        ENGINES: engines,
      },

      // 120-Fleet Global Supply Distribution
      FLEET_DISTRIBUTION_SUMMARY: {
        TOTAL_FLEET_UNITS: totalFleetUnits,
        NIAS_SITE_COUNT: niasSiteCount,
        NIAS_SITE_PCT: niasSitePct,
        MV_SAVIOUR_COUNT: mvSaviourCount,
        MV_SAVIOUR_PCT: mvSaviourPct,
        PAG_ARUN_COUNT: pagArunCount,
        PAG_ARUN_PCT: pagArunPct,
      },

      // Rolling 24-Hour Mass Balance
      MASS_BALANCE_RECONCILIATION: massBalance,

      // Alarms List
      ACTIVE_ALARMS: activeAlarms,
    };
  }
}
