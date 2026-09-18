// src/cmms-monthly-report/print/configs/gasAnalysisFieldSpec.ts
//
// PURPOSE
//   Print field specs for Gas Analysis (P8) — mirrors GasAnalysisPanel.tsx's
//   COMPONENT_ROWS (mol-fraction list) and derived-value block exactly.
//   Single monthly snapshot grain (confirmed Step 0), so FieldSummaryRenderer
//   applies directly — no WideTableRenderer needed.

import { fmtNum, fmtText } from '../../../components/locations/nias/monthlyReport/utils/monthlyReportFormat';
import type { FieldSpec } from '../renderers/types';

const num = (v: unknown) => fmtNum(v as number | null | undefined);
const text = (v: unknown) => fmtText(v as string | null | undefined);

export const GAS_ANALYSIS_COMPONENT_FIELDS: FieldSpec[] = [
  { key: 'molMethane', label: 'Methane', unit: 'mol %', format: num },
  { key: 'molEthane', label: 'Ethane', unit: 'mol %', format: num },
  { key: 'molPropane', label: 'Propane', unit: 'mol %', format: num },
  { key: 'molIbutane', label: 'i-Butane', unit: 'mol %', format: num },
  { key: 'molNbutane', label: 'n-Butane', unit: 'mol %', format: num },
  { key: 'molIpentane', label: 'i-Pentane', unit: 'mol %', format: num },
  { key: 'molNpentane', label: 'n-Pentane', unit: 'mol %', format: num },
  { key: 'molHexanePlus', label: 'Hexane+', unit: 'mol %', format: num },
  { key: 'molNitrogen', label: 'Nitrogen', unit: 'mol %', format: num },
  { key: 'molCo2', label: 'Carbon Dioxide', unit: 'mol %', format: num },
];

export const GAS_ANALYSIS_DERIVED_FIELDS: FieldSpec[] = [
  { key: 'ghvBtuScf', label: 'Mix Gas Heating Value', unit: 'BTU/SCF', format: (v) => fmtNum(v as number | null, 3) },
  { key: 'specificGravity', label: 'Specific Gravity', format: num },
  { key: 'asOfDate', label: 'As-Of Date', format: text },
  { key: 'method', label: 'Method', format: text },
];
