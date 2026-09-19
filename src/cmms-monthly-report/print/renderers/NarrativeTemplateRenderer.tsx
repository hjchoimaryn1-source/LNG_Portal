// src/cmms-monthly-report/print/renderers/NarrativeTemplateRenderer.tsx
//
// PURPOSE
//   Boilerplate paragraph(s) + optional header field summary + optional
//   embedded small table + note lines. Covers Statement of Delivery (P7)
//   and Berita Acara Validasi, whose original layout is legal-document
//   narrative text with numbers filled in, not a repeating day-column table.

import type { ColumnSpec, FieldSpec } from './types';
import { FieldSummaryRenderer } from './FieldSummaryRenderer';
import { WideTableRenderer } from './WideTableRenderer';

export interface NarrativeTemplateSpec<T> {
  title: string;
  headerFields?: FieldSpec[];
  paragraphs?: string[];
  embeddedTable?: {
    columns: ColumnSpec<T>[];
    rows: T[];
    rowKey: (row: T) => string;
  };
  notes?: string[];
}

export interface NarrativeTemplateRendererProps<T> {
  spec: NarrativeTemplateSpec<T>;
  headerValues?: Record<string, unknown> | null;
}

export function NarrativeTemplateRenderer<T>({ spec, headerValues }: NarrativeTemplateRendererProps<T>) {
  return (
    <div className="print-narrative-template">
      {spec.headerFields && (
        <FieldSummaryRenderer title={spec.title} fields={spec.headerFields} values={headerValues} />
      )}
      {spec.paragraphs?.map((p, i) => (
        <p key={i} className="print-narrative-paragraph">
          {p}
        </p>
      ))}
      {spec.embeddedTable && (
        <WideTableRenderer
          title=""
          columns={spec.embeddedTable.columns}
          rows={spec.embeddedTable.rows}
          rowKey={spec.embeddedTable.rowKey}
        />
      )}
      {spec.notes?.map((n, i) => (
        <div key={i} className="print-narrative-note">
          {n}
        </div>
      ))}
    </div>
  );
}
