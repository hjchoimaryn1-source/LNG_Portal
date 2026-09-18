// src/cmms-monthly-report/print/sheets/BeritaAcaraValidasiPrintSheet.tsx
//
// PURPOSE
//   Print page for Berita Acara Validasi — boilerplate paragraphs +
//   4-meter correction table (static, see beritaAcaraValidasiTemplate.ts
//   for why it's not DB-backed this stage).

import { NarrativeTemplateRenderer } from '../renderers/NarrativeTemplateRenderer';
import { BERITA_ACARA_VALIDASI_TEMPLATE } from '../configs/beritaAcaraValidasiTemplate';

export function BeritaAcaraValidasiPrintSheet() {
  return (
    <div className="print-page">
      <div className="print-section-header">BERITA ACARA VALIDASI</div>
      <NarrativeTemplateRenderer spec={BERITA_ACARA_VALIDASI_TEMPLATE} />
    </div>
  );
}
