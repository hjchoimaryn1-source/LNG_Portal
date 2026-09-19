// src/components/locations/nias/monthlyReport/utils/monthlyReportFormat.ts
//
// PURPOSE
//   Shared display formatting for the Monthly Report (PLN EPI) Stage 3
//   views — pure functions, no React bindings (AGENTS.md §3 Logic/Data
//   Layer). Same "—" placeholder convention as GasMeteringDailyTab.tsx's fmt().

export function fmtNum(value: number | null | undefined, digits = 2): string {
  return value === null || value === undefined ? '—' : value.toFixed(digits);
}

export function fmtText(value: string | null | undefined): string {
  return value === null || value === undefined || value === '' ? '—' : value;
}
