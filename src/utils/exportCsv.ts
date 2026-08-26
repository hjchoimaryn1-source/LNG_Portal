// src/utils/exportCsv.ts

/**
 * Utility to export an array of JavaScript objects to a CSV file download in the browser
 */
export function exportToCSV<T extends Record<string, unknown>>(
  filename: string,
  rows: T[],
  customHeaders?: { key: keyof T; label: string }[]
) {
  if (!rows || rows.length === 0) {
    alert('No data available to export.');
    return;
  }

  let headers: string[];
  let keys: (keyof T)[];

  if (customHeaders && customHeaders.length > 0) {
    headers = customHeaders.map((h) => `"${h.label.replace(/"/g, '""')}"`);
    keys = customHeaders.map((h) => h.key);
  } else {
    keys = Object.keys(rows[0]) as (keyof T)[];
    headers = keys.map((k) => `"${String(k).replace(/"/g, '""')}"`);
  }

  const csvRows: string[] = [];
  csvRows.push(headers.join(','));

  rows.forEach((row) => {
    const values = keys.map((key) => {
      const val = row[key];
      if (val === null || val === undefined) return '""';
      if (typeof val === 'number') return String(val);
      if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
      const strVal = String(val).replace(/"/g, '""');
      return `"${strVal}"`;
    });
    csvRows.push(values.join(','));
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvRows.join('\r\n'));
  const link = document.createElement('a');
  link.setAttribute('href', csvContent);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
