// src/cmms-daily-ops/print/PrintPage3.tsx
//
// PURPOSE
//   FORM-NP-08-33-N p3: ISO Tank cargo units, Record of Isotank
//   (Laden/Empty totals).
//
//   FORM-NP-08-33 Section C/D bridging — iso_tank_cargo 도메인은 여전히 순찰
//   폼/장비 태그 레지스트리가 없다(ISO Tank UI는 NiasActiveBayWorkspace.tsx /
//   NiasLaydownLogTab.tsx 소관, 이 스테이지에서도 무수정). 대신
//   DailyReportPrintView.tsx가 useIsoTankPrintBridge()로 dailyMasterRecords를
//   읽어 payload.domains.iso_tank_cargo와 cargoSummary를 클라이언트에서
//   병합/전달한다 — 이 파일은 그 결과를 표시만 한다. 해당 report_date에
//   저장된 레코드가 하나도 없으면(예: PortalDataContext 미로딩) 기존과 동일한
//   gap-notice로 되돌아간다.

import { PATROL_FIELD_MAP } from '../dao/patrolFieldMaps';
import { PrintSectionHeader } from './PrintSectionHeader';
import { PrintFieldGrid } from './PrintFieldGrid';
import type { PrintPageProps } from './PrintPage1';
import type { IsoTankCargoSummary, IsoTankCargoSummaryGroup } from '../utils/isoTankPrintMapper';

export interface PrintPage3Props extends PrintPageProps {
  cargoSummary: IsoTankCargoSummary;
}

function fmt(value: number, digits = 2): string {
  return value.toFixed(digits);
}

function SummaryRow({ label, group }: { label: string; group: IsoTankCargoSummaryGroup }) {
  return (
    <tr>
      <td>{label}</td>
      <td>{group.count}</td>
      <td>{fmt(group.totalStockM3)}</td>
      <td>{fmt(group.avgPressureMPa, 3)}</td>
      <td>{fmt(group.avgTempC, 1)}</td>
    </tr>
  );
}

export function PrintPage3({ payload, cargoSummary }: PrintPage3Props) {
  const cargoEntries = Object.entries(payload.domains.iso_tank_cargo ?? {});

  return (
    <div className="print-page">
      <PrintSectionHeader>D. ISO TANK CARGO UNITS</PrintSectionHeader>
      {cargoEntries.length === 0 ? (
        <div className="print-gap-notice">
          {`데이터 없음 — ${payload.reportDate}에 저장된 ISO Tank Daily Master 레코드가 없음`}
        </div>
      ) : (
        cargoEntries.map(([tankNo, values]) => (
          <PrintFieldGrid key={tankNo} title={tankNo} fields={PATROL_FIELD_MAP.iso_tank_cargo} values={values} />
        ))
      )}

      <PrintSectionHeader>RECORD OF ISOTANK (LADEN / EMPTY)</PrintSectionHeader>
      {cargoEntries.length === 0 ? (
        <div className="print-gap-notice">데이터 없음 — 위와 동일한 이유로 집계 불가</div>
      ) : (
        <table className="print-field-grid">
          <thead>
            <tr>
              <th>Status</th>
              <th>Tank Count</th>
              <th>Total Stock (m³)</th>
              <th>Avg. Pressure (MPa)</th>
              <th>Avg. Temp (°C)</th>
            </tr>
          </thead>
          <tbody>
            <SummaryRow label="LADEN" group={cargoSummary.laden} />
            <SummaryRow label="EMPTY" group={cargoSummary.empty} />
          </tbody>
        </table>
      )}
    </div>
  );
}
