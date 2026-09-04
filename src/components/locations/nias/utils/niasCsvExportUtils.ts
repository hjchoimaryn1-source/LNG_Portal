import { DailyMasterRecord } from '../../../../types/lng';
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
 * Exports Daily Master Records to CSV using the standard 14-column layout.
 */
export function exportDailyMasterToCsv(records: DailyMasterRecord[]): void {
  const dateStr = records[0]?.reportDate || new Date().toISOString().split('T')[0];
  const filename = `NIAS_ISO_Tank_Daily_Master_${dateStr}.csv`;

  const headers = [
    'Report Date',
    'Serial No.',
    'ISO Tk No.',
    'Shipment',
    'Yard Position',
    'Level (%)',
    'Level (m³)',
    'Level (mmH2O)',
    'Battery (%)',
    'Pressure (MPa)',
    'Temp (°C)',
    'Depress',
    'Press_Before (MPa)',
    'Press_After (MPa)',
    'Remarks',
  ];

  const rows = records.map((r) => [
    `"${r.reportDate || ''}"`,
    `"${r.serialNo || ''}"`,
    `"${r.tankNo || ''}"`,
    `"${r.shipment || ''}"`,
    `"${r.position || ''}"`,
    r.level ?? '',
    r.levelM3 ?? '',
    r.levelMmH2O ?? '',
    r.battery ?? '',
    r.pressureMPa ?? '',
    r.tempC ?? '',
    `"${r.depress || ''}"`,
    r.pressBeforeMPa ?? '',
    r.pressAfterMPa ?? '',
    `"${(r.remarks || '').replace(/"/g, '""')}"`,
  ].join(','));

  const csvContent = [headers.join(','), ...rows].join('\n');
  downloadCsv(filename, csvContent);
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
