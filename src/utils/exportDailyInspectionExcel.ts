// src/utils/exportDailyInspectionExcel.ts
import ExcelJS from 'exceljs';

export interface InspectionExportItem {
  reportDate: string;
  tankNo: string;
  serialNo: string;
  shipment: string;
  zone: string;
  levelMmH2O: number;
  analogPressMPa: number;
  calcVolM3: number;
  calcMassTon: number;
  smtPressMPa: number;
  smtLevelPct: number;
  smtTempC: number;
  smtBatteryPct: number;
  bogVentKg: number;
  status: string;
  remarks: string;
}

export async function exportDailyInspectionToExcel(
  items: InspectionExportItem[],
  options: {
    dateFilterDesc: string;
    batchFilterDesc: string;
    zoneFilterDesc: string;
  }
): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NIAS LNG Terminal CMMS';
  workbook.lastModifiedBy = 'NIAS LNG Terminal CMMS';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Inspection_Log', {
    views: [{ showGridLines: true }],
  });

  worksheet.pageSetup = {
    orientation: 'landscape',
    paperSize: 9, // A4
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: {
      left: 0.3,
      right: 0.3,
      top: 0.4,
      bottom: 0.4,
      header: 0.2,
      footer: 0.2,
    },
  };

  // 1. Row 1: 2-Tier Group Headers (Row 1)
  // A1:E1 -> BASIC IDENTIFICATION (#0A2540, White Bold)
  worksheet.mergeCells('A1:E1');
  worksheet.getCell('A1').value = 'BASIC IDENTIFICATION';

  // F1:I1 -> ANALOG GAUGE (FIELD) (#D3CBBE, #0A2540 Bold)
  worksheet.mergeCells('F1:I1');
  worksheet.getCell('F1').value = 'ANALOG GAUGE (FIELD)';

  // J1:M1 -> SMT TELEMETRY (REMOTE) (#C8C0B2, #0A2540 Bold)
  worksheet.mergeCells('J1:M1');
  worksheet.getCell('J1').value = 'SMT TELEMETRY (REMOTE)';

  // N1:P1 -> OPERATION STATUS (#0A2540, White Bold)
  worksheet.mergeCells('N1:P1');
  worksheet.getCell('N1').value = 'OPERATION STATUS';

  const row1 = worksheet.getRow(1);
  row1.height = 24;

  // Apply Row 1 group styles
  for (let c = 1; c <= 16; c++) {
    const cell = row1.getCell(c);
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF071A2E' } },
      left: { style: 'thin', color: { argb: 'FFA09E90' } },
      bottom: { style: 'thin', color: { argb: 'FFA09E90' } },
      right: { style: 'thin', color: { argb: 'FFA09E90' } },
    };

    if (c >= 1 && c <= 5) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A2540' } };
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    } else if (c >= 6 && c <= 9) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3CBBE' } };
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0A2540' } };
    } else if (c >= 10 && c <= 13) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8C0B2' } };
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0A2540' } };
    } else {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A2540' } };
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    }
  }

  // 2. Row 2: Column Headers (Row 2)
  const tier2Headers = [
    'Date',               // A (Col 1)
    'Tank ID',            // B (Col 2)
    'Serial No',          // C (Col 3)
    'Batch',              // D (Col 4)
    'Zone',               // E (Col 5)
    'Level (mmH2O)',      // F (Col 6)
    'Press (MPa)',        // G (Col 7)
    'Calc Vol (m³)',      // H (Col 8) - Highlight
    'Calc Mass (ton)',    // I (Col 9) - Highlight
    'Press (MPa)',        // J (Col 10)
    'Level (%)',          // K (Col 11)
    'Temp (°C)',          // L (Col 12)
    'Batt (%)',           // M (Col 13)
    'BOG Vent (kg)',      // N (Col 14)
    'Status',             // O (Col 15)
    'Remarks',            // P (Col 16)
  ];

  const row2 = worksheet.getRow(2);
  row2.height = 22;
  tier2Headers.forEach((val, idx) => {
    const colNum = idx + 1;
    const cell = row2.getCell(colNum);
    cell.value = val;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFA09E90' } },
      left: { style: 'thin', color: { argb: 'FFA09E90' } },
      bottom: { style: 'medium', color: { argb: 'FFA09E90' } },
      right: { style: 'thin', color: { argb: 'FFA09E90' } },
    };

    // Highlight columns (Col 8: Calc Vol, Col 9: Calc Mass) -> Pastel Blue #CBE2FB (#C6E0FA), font #003B73
    if (colNum === 8 || colNum === 9) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCBE2FB' } };
      cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF003B73' } };
    } else {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAE6DD' } };
      cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF0A2540' } };
    }
  });

  // 3. Populate Data Rows starting from Row 3
  const startRow = 3;
  items.forEach((item, idx) => {
    const rowNum = startRow + idx;
    const row = worksheet.getRow(rowNum);
    row.height = 20;

    row.values = [
      item.reportDate,
      item.tankNo,
      item.serialNo,
      item.shipment,
      item.zone,
      item.levelMmH2O,
      item.analogPressMPa,
      item.calcVolM3,
      item.calcMassTon,
      item.smtPressMPa,
      item.smtLevelPct,
      item.smtTempC,
      item.smtBatteryPct,
      item.bogVentKg,
      item.status,
      item.remarks,
    ];

    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Calibri', size: 9.5 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      // Alignments & Number Formats
      // Centered Columns: Date(1), Tank ID(2), Serial No(3), Batch(4), Zone(5), Status(15)
      if ([1, 2, 3, 4, 5, 15].includes(colNumber)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } 
      // Left Aligned: Remarks(16)
      else if (colNumber === 16) {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
      // Right Aligned Numbers:
      else {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }

      // Specific number formats
      if (colNumber === 6) {
        // Level (mmH2O)
        cell.numFmt = '#,##0';
      } else if (colNumber === 7 || colNumber === 10) {
        // Analog Press, SMT Press (MPa)
        cell.numFmt = '0.00';
      } else if (colNumber === 8) {
        // Calc Vol (m³)
        cell.numFmt = '0.0';
      } else if (colNumber === 9) {
        // Calc Mass (ton)
        cell.numFmt = '0.00';
      } else if (colNumber === 11) {
        // SMT Level (%)
        cell.numFmt = '0.0';
      } else if (colNumber === 12) {
        // SMT Temp (°C)
        cell.numFmt = '0.0';
      } else if (colNumber === 13) {
        // SMT Batt (%)
        cell.numFmt = '#,##0';
      } else if (colNumber === 14) {
        // BOG Vent (kg)
        cell.numFmt = '#,##0';
      }

      // Highlight Columns (Col 8: Calc Vol, Col 9: Calc Mass) -> Fill #EEF6FF, Font #004A99 Bold
      if (colNumber === 8 || colNumber === 9) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF6FF' } };
        cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FF004A99' } };
      }
    });
  });

  // 4. Set Defined Column Widths
  const colWidths = [
    { key: 'A', width: 12 }, // Date
    { key: 'B', width: 12 }, // Tank ID
    { key: 'C', width: 16 }, // Serial No
    { key: 'D', width: 8 },  // Batch
    { key: 'E', width: 10 }, // Zone
    { key: 'F', width: 14 }, // Level (mmH2O)
    { key: 'G', width: 13 }, // Analog Press (MPa)
    { key: 'H', width: 13 }, // Calc Vol (m³)
    { key: 'I', width: 14 }, // Calc Mass (ton)
    { key: 'J', width: 13 }, // SMT Press (MPa)
    { key: 'K', width: 12 }, // SMT Level (%)
    { key: 'L', width: 11 }, // Temp (°C)
    { key: 'M', width: 10 }, // Batt (%)
    { key: 'N', width: 13 }, // BOG Vent (kg)
    { key: 'O', width: 12 }, // Status
    { key: 'P', width: 24 }, // Remarks
  ];

  colWidths.forEach((cw, idx) => {
    const col = worksheet.getColumn(idx + 1);
    col.width = cw.width;
  });

  // 5. Generate and trigger download in browser
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  const fileName = `Nias_Daily_Inspection_${options.dateFilterDesc}_${options.batchFilterDesc}_${options.zoneFilterDesc}.xlsx`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
  return fileName;
}
