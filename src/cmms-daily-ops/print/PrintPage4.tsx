// src/cmms-daily-ops/print/PrintPage4.tsx
//
// PURPOSE
//   FORM-NP-08-33-N p4: N2 Skid (10 cylinders + 3 skid areas), Electrical
//   (MV SWGR / LV SWGR / TRAFO / UPS).

import { PATROL_FIELD_MAP, type PatrolFieldSpec } from '../dao/patrolFieldMaps';
import { N2_ALL_TAGS, ELECTRICAL_SUB_BLOCKS } from '../dao/patrolEquipmentTags';
import type { PatrolValues } from '../dao/dailyOpsPatrolDao';
import { PrintSectionHeader } from './PrintSectionHeader';
import { PrintFieldGrid } from './PrintFieldGrid';
import type { PrintPageProps } from './PrintPage1';

const ELECTRICAL_FIELDS = PATROL_FIELD_MAP.electrical;

function electricalFieldsFor(columns: string[]): PatrolFieldSpec[] {
  return columns.map((c) => ELECTRICAL_FIELDS.find((f) => f.columnName === c)!);
}

// 결함③(A안, HJ 확정): bus_voltage는 MV/LV SWGR가 공유하는 단일 컬럼이고
// 저장값은 항상 V. MV 계열(태그 접두사 "MV-")만 인쇄 시 kV로 환산 표시하고,
// 스키마/DB/입력 폼(ElectricalPatrolForm.tsx)의 저장값은 그대로 V로 유지한다.
function forMvBusVoltageDisplay(
  tag: string,
  fields: PatrolFieldSpec[],
  values: PatrolValues | null | undefined
): { fields: PatrolFieldSpec[]; values: PatrolValues | null | undefined } {
  if (!tag.startsWith('MV-')) return { fields, values };

  const displayFields = fields.map((f) => (f.columnName === 'bus_voltage' ? { ...f, unit: 'kV' } : f));
  const rawBusVoltage = values?.bus_voltage;
  if (typeof rawBusVoltage !== 'number') return { fields: displayFields, values };

  return { fields: displayFields, values: { ...values, bus_voltage: rawBusVoltage / 1000 } };
}

export function PrintPage4({ payload }: PrintPageProps) {
  return (
    <div className="print-page">
      <PrintSectionHeader>E. N2 SKID</PrintSectionHeader>
      {N2_ALL_TAGS.map((tag) => (
        <PrintFieldGrid key={tag} title={tag} fields={PATROL_FIELD_MAP.n2_skid} values={payload.domains.n2_skid?.[tag]} />
      ))}

      <PrintSectionHeader>F. ELECTRICAL (MV/LV SWGR, TRAFO, UPS)</PrintSectionHeader>
      {ELECTRICAL_SUB_BLOCKS.map((block) => {
        const { fields, values } = forMvBusVoltageDisplay(
          block.tag,
          electricalFieldsFor(block.columns),
          payload.domains.electrical?.[block.tag]
        );
        return <PrintFieldGrid key={block.tag} title={block.tag} fields={fields} values={values} />;
      })}
    </div>
  );
}
