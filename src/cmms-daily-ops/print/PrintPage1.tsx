// src/cmms-daily-ops/print/PrintPage1.tsx
//
// PURPOSE
//   FORM-NP-08-33-N p1: NG Buffer Tank, Metering Train A/B, Station Total,
//   GC composition, GC/Cylinder status, Calibration Gas, Carrier Gas.
//
//   NG Buffer Tank는 Stage E-2부터 실데이터를 표시한다(ng_buffer_tank 도메인,
//   PATROL_EQUIPMENT_TAGS_BY_DOMAIN을 통해 generateSnapshot이 이미 수집함 — DAO
//   변경 불필요, 이 파일의 표시부만 교체).
//
//   Carrier Gas 한 항목만 실제 데이터 소스가 없어 자리 안내로 남는다(지어내지 않음):
//     - Carrier Gas: gc 도메인 15개 컬럼 중 "carrier gas" 전용 필드가 없다
//       (calibration_gas_cylinder_id는 Calibration Gas로 표시).

import { PATROL_FIELD_MAP } from '../dao/patrolFieldMaps';
import { METERING_EQUIPMENT_TAGS, GC_EQUIPMENT_TAG, NG_BUFFER_TANK_EQUIPMENT_TAG } from '../dao/patrolEquipmentTags';
import type { DailyReportSnapshotPayload } from '../dao/dailyReportSnapshotDao';
import { PrintSectionHeader } from './PrintSectionHeader';
import { PrintFieldGrid } from './PrintFieldGrid';

const GC_FIELDS = PATROL_FIELD_MAP.gc;
const GC_STATUS_FIELDS = GC_FIELDS.filter((f) => f.type === 'text');
const GC_COMPOSITION_FIELDS = GC_FIELDS.filter((f) => f.type === 'number');

// line_dens_kg_m3/ghv: 스캔 원문에 대응 행 없음(HJ 승인 인쇄 제외) — B1 폼은 전체
// PATROL_FIELD_MAP.metering_train_a/b를 그대로 쓰므로 입력에는 영향 없음.
const METERING_TRAIN_A_PRINT_FIELDS = PATROL_FIELD_MAP.metering_train_a.filter((f) => !f.printExclude);
const METERING_TRAIN_B_PRINT_FIELDS = PATROL_FIELD_MAP.metering_train_b.filter((f) => !f.printExclude);

export interface PrintPageProps {
  payload: DailyReportSnapshotPayload;
}

export function PrintPage1({ payload }: PrintPageProps) {
  const gcValues = payload.domains.gc?.[GC_EQUIPMENT_TAG];

  return (
    <div className="print-page">
      <PrintSectionHeader>A. MONITORING METERING SYSTEM</PrintSectionHeader>

      <PrintSectionHeader>NG BUFFER TANK</PrintSectionHeader>
      <PrintFieldGrid
        title={NG_BUFFER_TANK_EQUIPMENT_TAG}
        fields={PATROL_FIELD_MAP.ng_buffer_tank}
        values={payload.domains.ng_buffer_tank?.[NG_BUFFER_TANK_EQUIPMENT_TAG]}
      />

      <PrintSectionHeader>METERING TRAIN A</PrintSectionHeader>
      <PrintFieldGrid title={METERING_EQUIPMENT_TAGS[0]} fields={METERING_TRAIN_A_PRINT_FIELDS} values={payload.domains.metering_train_a?.[METERING_EQUIPMENT_TAGS[0]]} />

      <PrintSectionHeader>METERING TRAIN B</PrintSectionHeader>
      <PrintFieldGrid title={METERING_EQUIPMENT_TAGS[1]} fields={METERING_TRAIN_B_PRINT_FIELDS} values={payload.domains.metering_train_b?.[METERING_EQUIPMENT_TAGS[1]]} />

      <PrintSectionHeader>STATION TOTAL</PrintSectionHeader>
      <table className="print-field-grid">
        <tbody>
          <tr>
            <td>Volume Flowrate (MMSCFD)</td>
            <td>{payload.stationTotal.volumeFlowrateMmscfd}</td>
          </tr>
          <tr>
            <td>Energy Flowrate (MMBTUD)</td>
            <td>{payload.stationTotal.energyFlowrateMmbtud}</td>
          </tr>
          <tr>
            <td>Volume Total (MMCF)</td>
            <td>{payload.stationTotal.volumeTotalMmcf}</td>
          </tr>
          <tr>
            <td>Volume Total (MSCF)</td>
            <td>{payload.stationTotal.volumeTotalMscf}</td>
          </tr>
          <tr>
            <td>Energy Total (MMBTU)</td>
            <td>{payload.stationTotal.energyTotalMmbtu}</td>
          </tr>
        </tbody>
      </table>

      <PrintSectionHeader>GC COMPOSITION</PrintSectionHeader>
      <PrintFieldGrid title={GC_EQUIPMENT_TAG} fields={GC_COMPOSITION_FIELDS} values={gcValues} />

      <PrintSectionHeader>GC / CYLINDER STATUS &amp; CALIBRATION GAS</PrintSectionHeader>
      <PrintFieldGrid title={GC_EQUIPMENT_TAG} fields={GC_STATUS_FIELDS} values={gcValues} />

      <PrintSectionHeader>CARRIER GAS</PrintSectionHeader>
      <div className="print-gap-notice">데이터 없음 — gc 도메인 스키마에 Carrier Gas 전용 컬럼 없음</div>
    </div>
  );
}
