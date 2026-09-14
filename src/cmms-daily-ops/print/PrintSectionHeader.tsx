// src/cmms-daily-ops/print/PrintSectionHeader.tsx
//
// PURPOSE
//   원본 서식의 회색 구간 헤더 바(예: "A. MONITORING METERING SYSTEM").
//   scadaStyles.ts와 동일한 톤(#d4d0c8)을 printStyles.ts에 반영해 재사용.

import type { ReactNode } from 'react';

export function PrintSectionHeader({ children }: { children: ReactNode }) {
  return <div className="print-section-header">{children}</div>;
}
