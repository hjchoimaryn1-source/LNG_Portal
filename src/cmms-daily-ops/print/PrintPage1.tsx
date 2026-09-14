// src/cmms-daily-ops/print/PrintPage1.tsx
//
// PURPOSE
//   FORM-NP-08-33-N p1: NG Buffer Tank, Metering Train A/B, Station Total,
//   GC composition, GC/Cylinder status, Calibration Gas, Carrier Gas.
//
//   두 항목은 실제 데이터 소스가 없어 자리 안내만 표시한다(지어내지 않음):
//     - NG Buffer Tank: Stage A/B 어떤 PatrolDomain에도 대응 테이블/컬럼이 없다.
//     - Carrier Gas: gc 도메인 15개 컬럼 중 "carrier gas" 전용 필드가 없다
//       (calibration_gas_cylinder_id는 Calibration Gas로 표시).

import { PATROL_FIELD_MAP } from '../dao/patrolFieldMaps';
import { METERING_EQUIPMENT_TAGS, GC_EQUIPMENT_TAG } from '../dao/patrolEquipmentTags';
import type { DailyReportSnapshotPayload } from '../dao/dailyReportSnapshotDao';
import { PrintSectionHeader } from './PrintSectionHeader';
import { PrintFieldGrid } from './PrintFieldGrid';

const GC_FIELDS = PATROL_FIELD_MAP.gc;
const GC_STATUS_FIELDS = GC_FIELDS.filter((f) => f.type === 'text');
const GC_COMPOSITION_FIELDS = GC_FIELDS.filter((f) => f.type === 'number');

export interface PrintPageProps {
  payload: DailyReportSnapshotPayload;
}

export function PrintPage1({ payload }: PrintPageProps) {
  const gcValues = payload.domains.gc?.[GC_EQUIPMENT_TAG];

  return (
    <div className="print-page">
      <PrintSectionHeader>A. MONITORING METERING SYSTEM</PrintSectionHeader>

      <PrintSectionHeader>NG BUFFER TANK</PrintSectionHeader>
      <div className="print-gap-notice">데이터 없음 — 해당 도메인/테이블이 Stage A/B에 정의되지 않음</div>

      <PrintSectionHeader>METERING TRAIN A</PrintSectionHeader>
      <PrintFieldGrid title={METERING_EQUIPMENT_TAGS[0]} fields={PATROL_FIELD_MAP.metering_train_a} values={payload.domains.metering_train_a?.[METERING_EQUIPMENT_TAGS[0]]} />

      <PrintSectionHeader>METERING TRAIN B</PrintSectionHeader>
      <PrintFieldGrid title={METERING_EQUIPMENT_TAGS[1]} fields={PATROL_FIELD_MAP.metering_train_b} values={payload.domains.metering_train_b?.[METERING_EQUIPMENT_TAGS[1]]} />

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
