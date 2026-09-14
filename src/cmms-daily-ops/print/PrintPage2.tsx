// src/cmms-daily-ops/print/PrintPage2.tsx
//
// PURPOSE
//   FORM-NP-08-33-N p2: AAV x4 (8 fields each), Unloading Skid T-201~204.

import { PATROL_FIELD_MAP } from '../dao/patrolFieldMaps';
import { AAV_EQUIPMENT_TAGS, ISO_TANK_UNLOADING_SKID_TAGS } from '../dao/patrolEquipmentTags';
import { PrintSectionHeader } from './PrintSectionHeader';
import { PrintFieldGrid } from './PrintFieldGrid';
import type { PrintPageProps } from './PrintPage1';

export function PrintPage2({ payload }: PrintPageProps) {
  return (
    <div className="print-page">
      <PrintSectionHeader>B. AAV (AUTOMATIC ACTUATED VALVE)</PrintSectionHeader>
      {AAV_EQUIPMENT_TAGS.map((tag) => (
        <PrintFieldGrid key={tag} title={tag} fields={PATROL_FIELD_MAP.aav} values={payload.domains.aav?.[tag]} />
      ))}

      <PrintSectionHeader>C. UNLOADING SKID</PrintSectionHeader>
      {ISO_TANK_UNLOADING_SKID_TAGS.map((tag) => (
        <PrintFieldGrid
          key={tag}
          title={tag}
          fields={PATROL_FIELD_MAP.iso_tank_unloading_skid}
          values={payload.domains.iso_tank_unloading_skid?.[tag]}
        />
      ))}
    </div>
  );
}
