// src/cmms-daily-ops/print/printStyles.ts
//
// PURPOSE
//   FORM-NP-08-33-N 인쇄 뷰 전용 @media print CSS. 순수 문자열 상수 —
//   DailyReportPrintView.tsx가 <style> 태그로 한 번만 주입한다.

export const PRINT_STYLES = `
  @page { size: A4 portrait; margin: 12mm; }
  .print-page { page-break-after: always; }
  .print-page:last-child { page-break-after: avoid; }
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
  .print-gap-notice { font-size: 10px; color: #b91c1c; font-style: italic; padding: 4px 0; }
`;
