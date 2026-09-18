// src/cmms-monthly-report/print/sheets/GasAnalysisPrintSheet.tsx
//
// PURPOSE
//   Print page for Gas Analysis (P8) — single monthly composition snapshot,
//   component mol-fraction list + derived values, both label:value grids.

import type { GasCompositionSnapshotRow } from '../../dao/gasCompositionSnapshotDao';
import { FieldSummaryRenderer } from '../renderers/FieldSummaryRenderer';
import { GAS_ANALYSIS_COMPONENT_FIELDS, GAS_ANALYSIS_DERIVED_FIELDS } from '../configs/gasAnalysisFieldSpec';

export interface GasAnalysisPrintSheetProps {
  snapshot: GasCompositionSnapshotRow | null;
}

export function GasAnalysisPrintSheet({ snapshot }: GasAnalysisPrintSheetProps) {
  const values = snapshot as unknown as Record<string, unknown> | null;
  return (
    <div className="print-page">
      <div className="print-section-header">GAS ANALYSIS (P8)</div>
      <FieldSummaryRenderer title="Component / Mol Fraction" fields={GAS_ANALYSIS_COMPONENT_FIELDS} values={values} />
      <FieldSummaryRenderer title="Derived Values" fields={GAS_ANALYSIS_DERIVED_FIELDS} values={values} />
    </div>
  );
}
