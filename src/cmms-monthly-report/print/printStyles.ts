// src/cmms-monthly-report/print/printStyles.ts
//
// PURPOSE
//   Monthly Report (PLN EPI) print view CSS — same @media print convention
//   as cmms-daily-ops/print/printStyles.ts, extended with a named landscape
//   @page variant for wide day-column sheets and the wide-table/narrative/
//   signature-frame classes this module's renderers use.

export const MONTHLY_REPORT_PRINT_STYLES = `
  @page { size: A4 portrait; margin: 12mm; }
  @page monthly-landscape { size: A4 landscape; margin: 10mm; }
  .print-page { page-break-after: always; }
  .print-page:last-child { page-break-after: avoid; }
  .print-page.landscape { page: monthly-landscape; }
  .print-page table tr { page-break-inside: avoid; }
  .print-section-header {
    background-color: #d4d0c8;
    font-weight: 700;
    padding: 4px 8px;
    margin: 10px 0 4px;
    font-size: 11px;
    text-transform: uppercase;
    border: 1px solid #707070;
  }
  .print-field-grid { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 8px; }
  .print-field-grid td { border: 1px solid #999; padding: 2px 4px; }
  .print-field-grid caption { text-align: left; font-weight: 700; font-size: 10px; margin-bottom: 2px; }
  .print-wide-table { width: 100%; border-collapse: collapse; font-size: 8px; margin-bottom: 8px; }
  .print-wide-table th, .print-wide-table td { border: 1px solid #999; padding: 1px 3px; text-align: right; }
  .print-wide-table th { background-color: #e5e7eb; font-weight: 700; }
  .print-wide-table caption { text-align: left; font-weight: 700; font-size: 10px; margin-bottom: 2px; }
  .print-narrative-template { font-size: 10px; }
  .print-narrative-paragraph { margin: 4px 0; line-height: 1.4; }
  .print-narrative-note { font-size: 9px; font-style: italic; margin-top: 4px; }
  .print-signature-frame { display: flex; gap: 16px; margin-top: 24px; }
  .print-signature-box { flex: 1; border: 1px solid #333; padding: 24px 8px 4px; font-size: 9px; }
  .print-gap-notice { font-size: 10px; color: #b91c1c; font-style: italic; padding: 4px 0; }
`;
