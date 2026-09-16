/**
 * PLTMG Power Display Mocks — static snapshot figures shown in the
 * "GAS PROCESS" P&ID diagram summary block and the Overview screen's
 * "PLTMG Power Demand & Site Autonomy Simulator" widget.
 *
 * Placeholder — MAN L51/60DF datasheet reference values, D/F-converted
 * engine not yet field-tested; replace with real telemetry when available.
 */

export interface PltmgPidSummarySnapshot {
  headerBadge: string;
  outputMw: number;
  runActive: number;
  runTotal: number;
  loadPctMcr: number;
  gasMw: number;
  gasPct: number;
  dieselMw: number;
  dieselPct: number;
  totalGasFlowNm3h: number;
}

export interface PltmgPidGeneratorRow {
  tag: string;
  mode: 'Gas' | 'Diesel';
  status: 'RUN' | 'STOP';
  outputKw: number;
  loadPct: number;
  gasFlowNm3h: number;
}

export const PLTMG_PID_SUMMARY_SNAPSHOT: PltmgPidSummarySnapshot = {
  headerBadge: '4/5 RUN / 60.0% MCR',
  outputMw: 22.05,
  runActive: 4,
  runTotal: 5,
  loadPctMcr: 60.0,
  gasMw: 22.05,
  gasPct: 100,
  dieselMw: 0.0,
  dieselPct: 0,
  totalGasFlowNm3h: 5631.2,
};

export const PLTMG_PID_GENERATOR_ROWS: PltmgPidGeneratorRow[] = [
  { tag: 'GEN-01', mode: 'Gas', status: 'RUN', outputKw: 5513, loadPct: 75.0, gasFlowNm3h: 1407.8 },
  { tag: 'GEN-02', mode: 'Gas', status: 'RUN', outputKw: 5513, loadPct: 75.0, gasFlowNm3h: 1407.8 },
  { tag: 'GEN-03', mode: 'Gas', status: 'RUN', outputKw: 5513, loadPct: 75.0, gasFlowNm3h: 1407.8 },
  { tag: 'GEN-04', mode: 'Gas', status: 'RUN', outputKw: 5513, loadPct: 75.0, gasFlowNm3h: 1407.8 },
  { tag: 'GEN-05', mode: 'Diesel', status: 'STOP', outputKw: 0, loadPct: 0.0, gasFlowNm3h: 0.0 },
];

export interface PltmgOverviewBaselineDispatch {
  runningBadge: string;
  activePowerLabel: string;
  hourlyBurnLabel: string;
  dailyBurnLabel: string;
}

export interface PltmgOverviewStockAutonomy {
  safetyBadge: string;
  daysBuffer: string;
  stockLabel: string;
  runHoursLabel: string;
  safetyTargetLabel: string;
}

export interface PltmgOverviewScenario {
  label: string;
  autonomyLabel: string;
  note: string;
  isBaseline: boolean;
}

export const PLTMG_OVERVIEW_BASELINE_DISPATCH: PltmgOverviewBaselineDispatch = {
  runningBadge: '1/5 RUNNING',
  activePowerLabel: '4.41 MW (60.0% MCR)',
  hourlyBurnLabel: '1,126 Nm³/h',
  dailyBurnLabel: '27.02k Nm³/d (7,150 kJ/kWh)',
};

export const PLTMG_OVERVIEW_STOCK_AUTONOMY: PltmgOverviewStockAutonomy = {
  safetyBadge: '100% SAFE',
  daysBuffer: '8.44',
  stockLabel: '228.0k Nm³',
  runHoursLabel: '202.5 Hours',
  safetyTargetLabel: '10 Tanks Target',
};

export const PLTMG_OVERVIEW_SCENARIO_BASIS_LABEL = '228.0k Nm³ Basis';

export const PLTMG_OVERVIEW_SCENARIOS: PltmgOverviewScenario[] = [
  { label: '1 Unit @ 60% (4.4 MW)', autonomyLabel: '8.44 Days (202.5h)', note: '● Current Baseline', isBaseline: true },
  { label: '2 Units @ 60% (8.8 MW)', autonomyLabel: '4.22 Days (101.2h)', note: 'Burn: 2,252 Nm³/h', isBaseline: false },
  { label: '4 Units @ 60% (17.6 MW)', autonomyLabel: '2.11 Days (50.6h)', note: 'Burn: 4,505 Nm³/h', isBaseline: false },
];
