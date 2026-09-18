// src/cmms-monthly-report/print/renderers/FieldSummaryRenderer.tsx
//
// PURPOSE
//   Generic label:value grid — one record's fields listed vertically. Same
//   visual pattern as cmms-daily-ops/print/PrintFieldGrid.tsx but decoupled
//   from PatrolFieldSpec/PatrolValues so Monthly Report sheets (P8, P6,
//   Ops. summary boxes) can reuse it via a plain FieldSpec[] config.

import type { FieldSpec } from './types';

export interface FieldSummaryRendererProps {
  title: string;
  fields: FieldSpec[];
  values: Record<string, unknown> | null | undefined;
}

export function FieldSummaryRenderer({ title, fields, values }: FieldSummaryRendererProps) {
  return (
    <table className="print-field-grid">
      <caption>{title}</caption>
      <tbody>
        {fields.map((f) => {
          const raw = values ? values[f.key] : undefined;
          const display = f.format ? f.format(raw) : raw === null || raw === undefined ? '-' : String(raw);
          return (
            <tr key={f.key}>
              <td>
                {f.label}
                {f.unit ? ` (${f.unit})` : ''}
              </td>
              <td>{display}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
