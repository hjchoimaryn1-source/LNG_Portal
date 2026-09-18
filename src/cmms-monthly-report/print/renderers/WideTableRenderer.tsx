// src/cmms-monthly-report/print/renderers/WideTableRenderer.tsx
//
// PURPOSE
//   Generic day-column (or tank-row) wide table — N rows × fixed columns,
//   driven entirely by a ColumnSpec[] config. Covers P1-P5, ISO Tank ×2,
//   and the Monthly Report Ops. day-column block. A future PLN EPI form
//   revision edits the sheet's config file, not this component.

import type { ColumnSpec, GroupHeader } from './types';

export interface WideTableRendererProps<T> {
  title: string;
  columns: ColumnSpec<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  groupHeaders?: GroupHeader[];
}

function formatCell<T>(column: ColumnSpec<T>, row: T): string {
  const value = row[column.key];
  if (column.format) return column.format(value);
  if (value === null || value === undefined) return '-';
  return String(value);
}

export function WideTableRenderer<T>({ title, columns, rows, rowKey, groupHeaders }: WideTableRendererProps<T>) {
  return (
    <table className="print-wide-table">
      {title && <caption>{title}</caption>}
      <thead>
        {groupHeaders && (
          <tr>
            {groupHeaders.map((g) => (
              <th key={g.label} colSpan={g.span}>
                {g.label}
              </th>
            ))}
          </tr>
        )}
        <tr>
          {columns.map((c) => (
            <th key={String(c.key)}>
              {c.label}
              {c.unit ? ` (${c.unit})` : ''}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={rowKey(row)}>
            {columns.map((c) => (
              <td key={String(c.key)}>{formatCell(c, row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
