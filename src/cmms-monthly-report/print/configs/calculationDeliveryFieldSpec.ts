// src/cmms-monthly-report/print/configs/calculationDeliveryFieldSpec.ts
//
// PURPOSE
//   Print field spec for Calculation Delivery Gas (P6) — label:value grid
//   matching the source workbook's P6!C12:C16 row labels exactly.

import { fmtNum } from '../../../components/locations/nias/monthlyReport/utils/monthlyReportFormat';
import type { FieldSpec } from '../renderers/types';

const num = (digits?: number) => (v: unknown) => fmtNum(v as number | null | undefined, digits);

export const CALCULATION_DELIVERY_FIELDS: FieldSpec[] = [
  { key: 'meterReadingVolMscf', label: 'Meter Reading (A) — Volume', unit: 'MSCF', format: num() },
  { key: 'meterReadingEnergyMmbtu', label: 'Meter Reading (A) — Energy', unit: 'MMBTU', format: num() },
  { key: 'avgGhvBtuScf', label: 'Average Gross Heating Value', unit: 'BTU/SCF', format: num(3) },
  { key: 'correctionBVolMscf', label: 'Correction (B) — Volume', unit: 'MSCF', format: num() },
  { key: 'correctionBEnergyMmbtu', label: 'Correction (B) — Energy', unit: 'MMBTU', format: num() },
  { key: 'correctionCVolMscf', label: 'Correction (C) — Volume', unit: 'MSCF', format: num() },
  { key: 'correctionCEnergyMmbtu', label: 'Correction (C) — Energy', unit: 'MMBTU', format: num() },
  { key: 'deliveredVolMscf', label: 'Delivered Quantity (A-(B+C)) — Volume', unit: 'MSCF', format: num() },
  { key: 'deliveredEnergyMmbtu', label: 'Delivered Quantity (A-(B+C)) — Energy', unit: 'MMBTU', format: num() },
  { key: 'chargedEnergyMmbtu', label: 'Charged Quantity — Energy', unit: 'MMBTU', format: num() },
];
