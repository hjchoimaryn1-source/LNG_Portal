// src/lib/tank-thermo-engine.ts
/**
 * ISO Tank Thermodynamic State Machine & Dynamic BOG Accumulation Engine
 * Tracks cryogenic heat inleak, residence time, pressure buildup, and manifold routing.
 * Standards: ASME Sec VIII / EN 12065 / ISO 21014
 * Strict UTF-8 (without BOM)
 */

import {
  TankThermodynamicState,
  ManifoldState,
  TankLogisticsStatus,
} from '@/types/pipeline-engine';

// Nominal ISO Tank Cryogenic Geometry & Thermodynamics Constants (T-75 / UN Portable Tank)
export const NOMINAL_WATER_CAPACITY_L = 45000;       // 45,000 Liters (45 m³)
export const NOMINAL_MAX_LADEN_MASS_KG = 19800;       // ~19.8 Metric Tons @ 440 kg/m³
export const LATENT_HEAT_VAPORIZATION_KJ_KG = 510.0;  // LNG h_fg ~ 510 kJ/kg
export const TANK_HEAT_INLEAK_COEFF_W_K = 28.5;       // U*A = 28.5 W/K for high-vacuum MLI insulation
export const SAFETY_RELIEF_SETPOINT_BARG = 4.20;      // PRV Setpoint = 4.2 barg (0.42 MPa)
export const HIGH_PRESSURE_ALARM_BARG = 3.50;         // Warning Setpoint = 3.5 barg
export const NOMINAL_BOR_PCT_PER_DAY = 0.14;          // 0.14% / 24h at 32°C ambient
export const REFERENCE_GHV_MJ_KG = 54.8;              // 54.8 MJ/kg (~28,000 kJ/Nm³)

/**
 * Computes thermodynamic state and BOG accumulation for an ISO Tank based on residence time and manifold connection.
 */
export function evaluateTankThermodynamicState(params: {
  tankNo: string;
  serialNo: string;
  logisticsStatus: TankLogisticsStatus;
  manifoldState: ManifoldState;
  checkInTimestampIso?: string;
  currentTimestampIso?: string;
  initialLevelPct?: number;
  initialPressureMpa?: number;
  ambientTempC?: number;
  isMountedToBay?: boolean;
}): TankThermodynamicState {
  const currentTs = params.currentTimestampIso ? new Date(params.currentTimestampIso) : new Date();
  const checkInTs = params.checkInTimestampIso
    ? new Date(params.checkInTimestampIso)
    : new Date(currentTs.getTime() - 2.8 * 24 * 3600 * 1000); // default 2.8 days in yard

  const elapsedMs = Math.max(0, currentTs.getTime() - checkInTs.getTime());
  const residenceHours = Math.round((elapsedMs / (1000 * 3600)) * 10) / 10;
  const residenceDays = Math.round((residenceHours / 24) * 100) / 100;

  const initialLadenLevel = params.initialLevelPct ?? 92.5;
  const initialPressMpa = params.initialPressureMpa ?? 0.18; // ~1.8 bar·g

  const ambTempC = params.ambientTempC ?? 31.5;
  const tempDifferentialK = ambTempC - (-161.5); // delta T ~ 193 K

  // Heat inleak: Q_dot = U*A * deltaT (in Watts = J/s)
  const heatInleakWatts = TANK_HEAT_INLEAK_COEFF_W_K * tempDifferentialK; // ~5,500 W = 5.5 kW
  const heatInleakKjPerHour = (heatInleakWatts * 3600) / 1000; // ~19,800 kJ/h

  // Daily theoretical boil-off rate from thermal inleak
  const initialMassKg = (initialLadenLevel / 100) * NOMINAL_MAX_LADEN_MASS_KG;
  const theoreticalDailyBogKg = (heatInleakKjPerHour * 24) / LATENT_HEAT_VAPORIZATION_KJ_KG;
  const actualBorPctPerDay =
    Math.round(((theoreticalDailyBogKg / (initialMassKg || 1)) * 100) * 100) / 100 ||
    NOMINAL_BOR_PCT_PER_DAY;

  // Accumulated BOG loss during idle residence
  const accumulatedBogLossKg =
    params.manifoldState === 'PRSS_CONNECTED_DISCHARGING'
      ? 0.0 // when discharging, vapor is utilized directly as fuel gas
      : Math.round(initialMassKg * (actualBorPctPerDay / 100) * residenceDays * 10) / 10;

  const accumulatedBogLossMMBtu =
    Math.round(((accumulatedBogLossKg * REFERENCE_GHV_MJ_KG) / 1055.056) * 100) / 100;

  // Pressure buildup estimation: ~0.045 MPa / day (0.45 bar/day) during static hold
  let currentPressureMPa = initialPressMpa;
  if (params.manifoldState === 'STANDBY_STATIC') {
    currentPressureMPa = initialPressMpa + 0.042 * residenceDays;
  } else if (params.manifoldState === 'PRSS_CONNECTED_DISCHARGING') {
    // Regulated decanting pressure around 0.22 ~ 0.24 MPa
    currentPressureMPa = 0.22;
  } else if (params.manifoldState === 'BOG_HEADER_VENTING') {
    // Depressurizing to BOG recovery header (0.15 MPa)
    currentPressureMPa = 0.15;
  }

  // Cap current pressure at safety relief
  const currentPressureBarg = Math.round((currentPressureMPa * 10) * 100) / 100;

  // State Machine Destination Routing & Alarms
  let bogRoutingDestination: 'BOG_RECOVERY_HEADER' | 'AMBIENT_SAFETY_VENT' | 'NONE_CONTAINED' =
    'NONE_CONTAINED';
  let pressureAlarmStatus: 'NORMAL' | 'WARN_APPROACHING_SETPOINT' | 'CRITICAL_RELIEF_VENTING' =
    'NORMAL';

  if (currentPressureBarg >= SAFETY_RELIEF_SETPOINT_BARG) {
    pressureAlarmStatus = 'CRITICAL_RELIEF_VENTING';
    bogRoutingDestination = 'AMBIENT_SAFETY_VENT';
  } else if (currentPressureBarg >= HIGH_PRESSURE_ALARM_BARG) {
    pressureAlarmStatus = 'WARN_APPROACHING_SETPOINT';
    bogRoutingDestination = 'BOG_RECOVERY_HEADER';
  } else if (params.manifoldState === 'BOG_HEADER_VENTING') {
    bogRoutingDestination = 'BOG_RECOVERY_HEADER';
  }

  const currentLiquidMassKg = Math.max(
    0,
    Math.round((initialMassKg - accumulatedBogLossKg) * 10) / 10
  );
  const currentLevelPct =
    Math.round(((currentLiquidMassKg / NOMINAL_MAX_LADEN_MASS_KG) * 100) * 10) / 10;

  return {
    tankNo: params.tankNo,
    serialNo: params.serialNo,
    logisticsStatus: params.logisticsStatus,
    manifoldState: params.manifoldState,
    yardCheckInTimestamp: checkInTs.toISOString(),
    residenceHours,
    residenceDays,
    boilOffRatePctPerDay: actualBorPctPerDay,
    thermalInleakCoefficientWK: TANK_HEAT_INLEAK_COEFF_W_K,
    currentLevelPct,
    currentLiquidMassKg,
    currentPressureMPa: Math.round(currentPressureMPa * 1000) / 1000,
    currentPressureBarg,
    currentTempC: -161.4 + 0.15 * residenceDays,
    accumulatedBogLossKg,
    accumulatedBogLossMMBtu,
    bogRoutingDestination,
    safetyReliefValveSetpointBarg: SAFETY_RELIEF_SETPOINT_BARG,
    pressureAlarmStatus,
  };
}

/**
 * Simulates manifold state transition based on control command or pressure setpoint.
 */
export function transitionManifoldState(
  currentState: ManifoldState,
  action: 'CONNECT_BAY_DISCHARGE' | 'DISCONNECT_BAY' | 'TRIGGER_BOG_VENT' | 'CLOSE_VENT_TO_STANDBY'
): ManifoldState {
  switch (action) {
    case 'CONNECT_BAY_DISCHARGE':
      return 'PRSS_CONNECTED_DISCHARGING';
    case 'TRIGGER_BOG_VENT':
      return 'BOG_HEADER_VENTING';
    case 'DISCONNECT_BAY':
    case 'CLOSE_VENT_TO_STANDBY':
    default:
      return 'STANDBY_STATIC';
  }
}
