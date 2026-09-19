// src/cmms-monthly-report/print/renderers/types.ts
//
// PURPOSE
//   Shared config shapes consumed by WideTableRenderer/FieldSummaryRenderer/
//   NarrativeTemplateRenderer. Plain data types only — no React, per
//   AGENTS.md §3 Logic/Data Layer. Per-sheet column-spec manifests import
//   these and stay the sole surface a future PLN EPI form revision touches.

export interface ColumnSpec<T> {
  key: keyof T;
  label: string;
  unit?: string;
  format?: (value: T[keyof T]) => string;
}

export interface GroupHeader {
  label: string;
  span: number;
}

export interface FieldSpec {
  key: string;
  label: string;
  unit?: string;
  format?: (value: unknown) => string;
}
