// src/cmms-monthly-report/print/configs/statementOfDeliveryTemplate.ts
//
// PURPOSE
//   Print template for Statement of Delivery (P7) — legal delivery-status
//   document, boilerplate labels + numbers pulled from Calculation Delivery
//   Gas (P6). Field mapping verified via direct xlsx formula inspection
//   (P7!G21='Calculation Delivery Gas P6'!G15, G22=...!H15, G23=...!H16,
//   E26=...!J12) — exactly the fields calculationDeliveryDao.ts already
//   computes, so this reuses useCalculationDelivery, no new DAO/route.
//
//   Signature area: P7's source has NO Name/Designation/Date/Sign layout
//   signal anywhere (verified — no bordered sub-box, no drawing object).
//   SignatureFramePlaceholder.tsx positions an approximate frame instead
//   (Stage 2 HJ decision).

import { fmtNum } from '../../../components/locations/nias/monthlyReport/utils/monthlyReportFormat';
import type { NarrativeTemplateSpec } from '../renderers/NarrativeTemplateRenderer';

const num = (digits?: number) => (v: unknown) => fmtNum(v as number | null | undefined, digits);

export const STATEMENT_OF_DELIVERY_TEMPLATE: NarrativeTemplateSpec<never> = {
  title: 'STATEMENT OF DELIVERY (P7)',
  headerFields: [
    { key: 'pointOfDelivery', label: 'Point of Delivery', format: () => 'Stasiun Penyerahan Gas PLTMG' },
    {
      key: 'measuringDevice',
      label: 'Measuring Device',
      format: () =>
        'Orifice Metering of Natural Gas and Other related hydrocarbon Fluids - AGA report No. 3 (ANSI/API 2530-1992)',
    },
    { key: 'deliveredVolMscf', label: 'Delivery Quantity — Volume', unit: 'MSCF', format: num() },
    { key: 'deliveredEnergyMmbtu', label: 'Delivery Quantity — Energy', unit: 'MMBTU', format: num() },
    { key: 'chargedEnergyMmbtu', label: 'Charge Quantity — Energy', unit: 'MMBTU', format: num() },
    { key: 'avgGhvBtuScf', label: 'Average GHV', unit: 'BTU/SCF', format: num(3) },
  ],
  notes: [
    '(Temperature Base = 60º F : Pressure Base = 14.73 Psia)',
    '1 Sm3 = 35.3147 SCF   1 Nm3 = 37.3248 SCF',
    '* Koreksi disebabkan',
    '**Koreksi disebabkan oleh validasi meter bulanan pada tanggal',
  ],
};
