// src/cmms-daily-ops/print/PrintPage4.tsx
//
// PURPOSE
//   FORM-NP-08-33-N p4: N2 Skid (10 cylinders + 3 skid areas), Electrical
//   (MV SWGR / LV SWGR / TRAFO / UPS).

import { PATROL_FIELD_MAP, type PatrolFieldSpec } from '../dao/patrolFieldMaps';
import { N2_ALL_TAGS, ELECTRICAL_SUB_BLOCKS } from '../dao/patrolEquipmentTags';
import { PrintSectionHeader } from './PrintSectionHeader';
import { PrintFieldGrid } from './PrintFieldGrid';
import type { PrintPageProps } from './PrintPage1';

const ELECTRICAL_FIELDS = PATROL_FIELD_MAP.electrical;

function electricalFieldsFor(columns: string[]): PatrolFieldSpec[] {
  return columns.map((c) => ELECTRICAL_FIELDS.find((f) => f.columnName === c)!);
}

export function PrintPage4({ payload }: PrintPageProps) {
  return (
    <div className="print-page">
      <PrintSectionHeader>E. N2 SKID</PrintSectionHeader>
      {N2_ALL_TAGS.map((tag) => (
        <PrintFieldGrid key={tag} title={tag} fields={PATROL_FIELD_MAP.n2_skid} values={payload.domains.n2_skid?.[tag]} />
      ))}

      <PrintSectionHeader>F. ELECTRICAL (MV/LV SWGR, TRAFO, UPS)</PrintSectionHeader>
      {ELECTRICAL_SUB_BLOCKS.map((block) => (
        <PrintFieldGrid
          key={block.tag}
          title={block.tag}
          fields={electricalFieldsFor(block.columns)}
          values={payload.domains.electrical?.[block.tag]}
        />
      ))}
    </div>
  );
}
