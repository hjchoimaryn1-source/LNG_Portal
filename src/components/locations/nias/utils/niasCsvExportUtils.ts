import { NiasTankAsset } from '../../NiasTerminalView';

/**
 * Trigger browser file download from CSV string
 */
function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports Laydown 2 Staged Tanks Backhaul Shipping Manifest Report to CSV.
 */
export function exportShippingReportToCsv(tanks: NiasTankAsset[], selectedTanks: Set<string>): void {
  const exportData = tanks.map((t, idx) => {
    const isSelected = selectedTanks.has(t.id);
    const massKg = Math.round(((t.levelPercent || 4.0) / 100) * 18200);
    return {
      'NO': idx + 1,
      'TANK ID': t.id,
      'SERIAL NO': t.serialNo || `SIMU-82020${idx + 1}`,
      'VESSEL': 'M.V. SAVIOUR',
      'VOYAGE': 'VOY-2026-08 (ARUN RETURN)',
      'LOADING DATE': '2026-08-30',
      'SKID UNMOUNT DATE': '2026-08-28 14:30',
      'LD-2 DURATION (DAYS)': 2,
      'FINAL PRESS (MPa)': (t.pressureMpa || 0.22).toFixed(2),
      'TEMP (°C)': (t.tempC ?? -135.0).toFixed(1),
      'HEEL LEVEL (%)': (t.levelPercent || 4.0).toFixed(1),
      'CALC MASS (kg)': massKg,
      'BOG VENT DONE': 'Y (0.22 MPa)',
      'SAFETY SEAL NO': `SL-8842-N${String(idx + 1).padStart(2, '0')}`,
      'INSPECTOR SIGN': 'FIELD OP-1 / CHIEF',
      'STATUS': isSelected ? 'LOADED (SELECTED)' : 'STAGED FOR RETURN',
    };
  });

  if (exportData.length === 0) {
    return;
  }

  const headers = Object.keys(exportData[0]).join(',');
  const rows = exportData.map((row) =>
    Object.values(row)
      .map((val) => `"${val}"`)
      .join(',')
  );
  const csvContent = [headers, ...rows].join('\n');
  downloadCsv('BACKHAUL_MANIFEST_MVSAVIOUR_20260830.csv', csvContent);
}
