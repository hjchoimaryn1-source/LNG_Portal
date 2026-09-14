// src/cmms-daily-ops/print/PrintPage3.tsx
//
// PURPOSE
//   FORM-NP-08-33-N p3: ISO Tank cargo units (10), Record of Isotank
//   (Laden/Empty totals).
//
//   둘 다 데이터 소스가 없어 자리 안내만 표시한다 — iso_tank_cargo는
//   Stage B에 순찰 폼/장비 태그 레지스트리가 없다(ISO Tank UI는
//   NiasActiveBayWorkspace.tsx 소관, 범위 밖. Stage C1 deviation과 동일 근거).

import { PrintSectionHeader } from './PrintSectionHeader';
import type { PrintPageProps } from './PrintPage1';

// payload는 이 페이지에서 아직 쓰이지 않는다(데이터 없음) — Stage C1이
// iso_tank_cargo를 채우게 되면 이 컴포넌트도 함께 갱신한다.
export function PrintPage3(_props: PrintPageProps) {
  return (
    <div className="print-page">
      <PrintSectionHeader>D. ISO TANK CARGO UNITS</PrintSectionHeader>
      <div className="print-gap-notice">
        데이터 없음 — iso_tank_cargo 도메인은 Stage B 순찰 폼/장비 태그 레지스트리가 없어
        snapshot_payload에 포함되지 않음 (Stage C1 deviation note 참고)
      </div>

      <PrintSectionHeader>RECORD OF ISOTANK (LADEN / EMPTY)</PrintSectionHeader>
      <div className="print-gap-notice">데이터 없음 — 위와 동일한 이유로 집계 불가</div>
    </div>
  );
}
