// src/cmms-monthly-report/print/configs/beritaAcaraValidasiTemplate.ts
//
// PURPOSE
//   Print template for Berita Acara Validasi — boilerplate paragraphs +
//   the 4-meter (M-101A/B FB-A/B) Before/After/Correction table. All four
//   rows are literal 0 in the source workbook itself (verified via direct
//   xlsx cell inspection — no correction data entered for this month), and
//   no correction-delta field exists anywhere in the schema, so this stays
//   static config (no new table, HJ decision this stage — see
//   gasMeteringLedgerSchema.ts's ghv_station/mol_co2_station/
//   specific_gravity_station comment for the same "reserved, not
//   fabricated" pattern).

import type { ColumnSpec } from '../renderers/types';
import type { NarrativeTemplateSpec } from '../renderers/NarrativeTemplateRenderer';

export interface MeterCorrectionRow {
  meterLabel: string;
  volBeforeMscf: number;
  energyBeforeMmbtu: number;
  volAfterMscf: number;
  energyAfterMmbtu: number;
  volCorrectionMscf: number;
  energyCorrectionMmbtu: number;
}

const ZERO_METER_ROW = (meterLabel: string): MeterCorrectionRow => ({
  meterLabel,
  volBeforeMscf: 0,
  energyBeforeMmbtu: 0,
  volAfterMscf: 0,
  energyAfterMmbtu: 0,
  volCorrectionMscf: 0,
  energyCorrectionMmbtu: 0,
});

export const METER_CORRECTION_ROWS: MeterCorrectionRow[] = [
  ZERO_METER_ROW('M-101A (FB-A)'),
  ZERO_METER_ROW('M-101B (FB-A)'),
  ZERO_METER_ROW('M-101A (FB-B)'),
  ZERO_METER_ROW('M-101B (FB-B)'),
];

export const METER_CORRECTION_COLUMNS: ColumnSpec<MeterCorrectionRow>[] = [
  { key: 'meterLabel', label: 'Tanggal / Meter No.' },
  { key: 'volBeforeMscf', label: 'Before — Volume', unit: 'MSCF' },
  { key: 'energyBeforeMmbtu', label: 'Before — Energy', unit: 'MMBTU' },
  { key: 'volAfterMscf', label: 'After — Volume', unit: 'MSCF' },
  { key: 'energyAfterMmbtu', label: 'After — Energy', unit: 'MMBTU' },
  { key: 'volCorrectionMscf', label: 'Correction — Volume', unit: 'MSCF' },
  { key: 'energyCorrectionMmbtu', label: 'Correction — Energy', unit: 'MMBTU' },
];

export const BERITA_ACARA_VALIDASI_TEMPLATE: NarrativeTemplateSpec<MeterCorrectionRow> = {
  title: 'BERITA ACARA VALIDASI BULANAN SISTEM METER',
  paragraphs: [
    'Pada hari ini, dilaksanakan, disaksikan, dan disetujui bersama PT PLN EPI - ENERGI PRIMER INDONESIA Unit Pembangkit Nias, Kalibrasi Meter dan validasi tahunan sistem meter terhadap fasilitas pengukuran gas.',
    'Perhitungan koreksi yang terjadi karena adanya penambahan Volume dan Energy kumulatif selama pengujian simulasi terhadap masing-masing alat ukur atau yang disebabkan oleh hal-hal lain akan diperhitungkan sebagai berikut :',
  ],
  embeddedTable: {
    columns: METER_CORRECTION_COLUMNS,
    rows: METER_CORRECTION_ROWS,
    rowKey: (r) => r.meterLabel,
  },
  notes: [
    '- Total Koreksi sampai tanggal ___ (실제 보정값 입력은 후속 스테이지)',
    '- Floboss yang digunakan untuk transaksi FB-A.',
    '- FB-B sebagai backup',
  ],
};
