// src/utils/exportTransitLossAuditExcel.ts
import ExcelJS from 'exceljs';

export async function exportTransitLossAuditToExcel(records: any[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PAGT Arun Terminal System';
  workbook.lastModifiedBy = 'PAGT Arun Terminal System';
  workbook.created = new Date();

  // Common PageSetup configuration
  const applyPageSetup = (worksheet: ExcelJS.Worksheet) => {
    worksheet.pageSetup = {
      orientation: 'landscape',
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1, // Fit width to 1 page
      fitToHeight: 0, // Allow height to flow naturally
      margins: {
        left: 0.25,
        right: 0.25,
        top: 0.4,
        bottom: 0.4,
        header: 0.2,
        footer: 0.2,
      },
    };
  };

  // ==========================================
  // SHEET 1: Transit Loss Audit
  // ==========================================
  const ws1 = workbook.addWorksheet('Transit Loss Audit', {
    views: [{ showGridLines: true }],
  });
  applyPageSetup(ws1);

  // Headers
  ws1.mergeCells('A1:A2');
  ws1.getCell('A1').value = 'VOYAGE NO';

  ws1.mergeCells('B1:C1');
  ws1.getCell('B1').value = 'ISO TANK IDENTIFICATION';

  ws1.mergeCells('D1:E1');
  ws1.getCell('D1').value = 'GROSS WEIGHT SCALE (KG)';

  ws1.mergeCells('F1:H1');
  ws1.getCell('F1').value = 'TRANSIT BOG LOSS RECONCILIATION';

  ws1.mergeCells('I1:I2');
  ws1.getCell('I1').value = 'STATUS';

  const tier2Headers = [
    '', // A
    'ISO TANK NO', // B
    'SERIAL NO', // C
    'NIAS EST GROSS', // D
    'ARUN WEIGHBRIDGE', // E
    'TRANSIT LOSS (KG)', // F
    'ACTUAL LOSS (%)', // G
    'DESIGN LIMIT (%)', // H
    '', // I
  ];

  const row2 = ws1.getRow(2);
  tier2Headers.forEach((val, idx) => {
    if (val) row2.getCell(idx + 1).value = val;
  });

  // Header Styles
  for (let r = 1; r <= 2; r++) {
    const row = ws1.getRow(r);
    row.height = 24;
    row.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: r === 1 ? 'FF0A2558' : 'FFE8E6DF' },
      };
      cell.font = {
        bold: true,
        color: { argb: r === 1 ? 'FFFFFFFF' : 'FF0A2558' },
        size: 10,
        name: 'Calibri',
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFA09E90' } },
        left: { style: 'thin', color: { argb: 'FFA09E90' } },
        bottom: { style: 'thin', color: { argb: 'FFA09E90' } },
        right: { style: 'thin', color: { argb: 'FFA09E90' } },
      };
    });
  }

  // Populate Rows
  const startRow = 3;
  records.forEach((rec, idx) => {
    const rNum = startRow + idx;
    const niasEstGross = Number(rec.niasEstGrossKg ?? 11215);
    const arunWeighbridge = Number(rec.arunWeighbridgeKg ?? 11182);

    ws1.getCell(`A${rNum}`).value = rec.voyageNo || 'VOY-2026-N1';
    ws1.getCell(`B${rNum}`).value = rec.tankNo;
    ws1.getCell(`C${rNum}`).value = rec.serialNo;
    ws1.getCell(`D${rNum}`).value = niasEstGross;
    ws1.getCell(`E${rNum}`).value = arunWeighbridge;

    // Formulas
    ws1.getCell(`F${rNum}`).value = { formula: `=D${rNum}-E${rNum}` };
    ws1.getCell(`G${rNum}`).value = { formula: `=(F${rNum}/18100)*100` };
    ws1.getCell(`H${rNum}`).value = 1.78;
    ws1.getCell(`I${rNum}`).value = { formula: `=IF(G${rNum}<=H${rNum}, "PASS", "HIGH_LOSS")` };

    const row = ws1.getRow(rNum);
    row.height = 20;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Calibri', size: 10 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      if ([1, 2, 3, 9].includes(colNumber)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }

      if ([4, 5, 6].includes(colNumber)) cell.numFmt = '#,##0';
      if ([7, 8].includes(colNumber)) cell.numFmt = '0.00"%"';
    });
  });

  const lastDataRow = startRow + records.length - 1;
  const sumRowIndex = records.length > 0 ? lastDataRow + 1 : startRow;

  // Footer SUM / AVERAGE Row
  ws1.mergeCells(`A${sumRowIndex}:C${sumRowIndex}`);
  ws1.getCell(`A${sumRowIndex}`).value = `SUM / AVERAGE (${records.length} Tanks)`;

  if (records.length > 0) {
    ws1.getCell(`D${sumRowIndex}`).value = { formula: `SUM(D3:D${lastDataRow})` };
    ws1.getCell(`E${sumRowIndex}`).value = { formula: `SUM(E3:E${lastDataRow})` };
    ws1.getCell(`F${sumRowIndex}`).value = { formula: `SUM(F3:F${lastDataRow})` };
    ws1.getCell(`G${sumRowIndex}`).value = { formula: `AVERAGE(G3:G${lastDataRow})` };
    ws1.getCell(`H${sumRowIndex}`).value = 1.78;
    ws1.getCell(`I${sumRowIndex}`).value = 'Archived';
  }

  const sumRow1 = ws1.getRow(sumRowIndex);
  sumRow1.height = 22;
  sumRow1.eachCell((cell, colNumber) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDFE6EE' } };
    cell.font = { bold: true, color: { argb: 'FF0A2558' }, size: 10, name: 'Calibri' };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FFA09E90' } },
      bottom: { style: 'medium', color: { argb: 'FFA09E90' } },
      left: { style: 'thin', color: { argb: 'FFA09E90' } },
      right: { style: 'thin', color: { argb: 'FFA09E90' } },
    };
    if ([1, 9].includes(colNumber)) cell.alignment = { horizontal: 'center', vertical: 'middle' };
    else cell.alignment = { horizontal: 'right', vertical: 'middle' };

    if ([4, 5, 6].includes(colNumber)) cell.numFmt = '#,##0';
    if ([7, 8].includes(colNumber)) cell.numFmt = '0.00"%"';
  });

  ws1.columns.forEach((col) => {
    col.width = 22;
  });

  // ==========================================
  // SHEET 2: BOG Loss Estimation
  // ==========================================
  const ws2 = workbook.addWorksheet('BOG Loss Estimation', {
    views: [{ showGridLines: true }],
  });
  applyPageSetup(ws2);

  ws2.mergeCells('A1:C1');
  ws2.getCell('A1').value = 'BOG LOSS ESTIMATION MODEL & THEORETICAL BENCHMARK';
  ws2.getCell('A1').font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
  ws2.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A2558' } };
  ws2.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  ws2.getRow(1).height = 26;

  const modelRows = [
    ['1. LOADED SPECIFICATION', '', ''],
    ['Gross Container Volume', 45.5, 'm³'],
    ['Filling Ratio Limit', 0.9, '% (IMO Safety Fill Limit)'],
    ['Loaded LNG Volume', { formula: '=B3*B4' }, 'm³ (45.5 × 90%)'],
    ['Base Cargo Liquid Mass', 18100, 'kg (@ 442.02 kg/m³)'],
    ['2. POTENTIAL LEAKED LOSS', '', ''],
    ['Valves & Gasket Leakage Rate', 0.002, '% of Cargo'],
    ['Potential Leaked LNG Volume', { formula: '=B5*B8' }, 'm³'],
    ['3. DEPRESSURIZATION LOSS (8.0 -> 3.0 barg)', '', ''],
    ['Loss of Natural Gas (Vapor)', { formula: '=45.5*(8.0-3.0)' }, 'Nm³ (45.5 × 5 barg)'],
    ['Temp & Density Correction Factor', { formula: '=288/(273.15-126.5)' }, 'Ratio (288 K / 146.65 K)'],
    ['Loss of Liquid LNG Equivalent', { formula: '=(B11*B12)/600' }, 'm³ LNG'],
    ['4. DESIGN LOSS BENCHMARK', '', ''],
    ['Total Nominal Design Loss (%)', { formula: '=(B9+B13)/B5*100' }, '% of Loaded Cargo'],
    ['Max Design Limit (10% Margin)', { formula: '=B15*1.1' }, '% (Allowable Threshold)'],
  ];

  modelRows.forEach((r, idx) => {
    const rowIdx = idx + 2;
    const row = ws2.getRow(rowIdx);
    row.height = 20;

    ws2.getCell(`A${rowIdx}`).value = r[0];
    ws2.getCell(`B${rowIdx}`).value = r[1] as any;
    ws2.getCell(`C${rowIdx}`).value = r[2];

    const isHeader = typeof r[0] === 'string' && /^[1-4]\./.test(r[0]);
    if (isHeader) {
      ws2.mergeCells(`A${rowIdx}:C${rowIdx}`);
      row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E6DF' } };
      row.getCell(1).font = { bold: true, color: { argb: 'FF0A2558' } };
    } else {
      row.getCell(1).font = { bold: true };
      row.getCell(2).alignment = { horizontal: 'right' };
      row.getCell(2).font = { bold: true };

      if (rowIdx === 4 || rowIdx === 8) row.getCell(2).numFmt = '0.00%';
      if (rowIdx === 15 || rowIdx === 16) row.getCell(2).numFmt = '0.00"%"';
      if ([3, 5, 9, 11, 12, 13].includes(rowIdx)) row.getCell(2).numFmt = '#,##0.00';
    }
  });

  ws2.columns = [{ width: 38 }, { width: 20 }, { width: 38 }];

  // ==========================================
  // SHEET 3: Nias Gross Model
  // ==========================================
  const ws3 = workbook.addWorksheet('Nias Gross Model', {
    views: [{ showGridLines: true }],
  });
  applyPageSetup(ws3);

  const ws3Headers = [
    'ISO TANK NO',
    'SERIAL NO',
    'BASELINE DRY TARE (KG)',
    'NIAS HEEL VOL (M³)',
    'LNG DENSITY (KG/M³)',
    'HEEL FUEL MASS (KG)',
    'TOTAL NIAS EST GROSS (KG)',
  ];

  const r1_3 = ws3.getRow(1);
  r1_3.height = 24;
  ws3Headers.forEach((val, idx) => {
    const cell = r1_3.getCell(idx + 1);
    cell.value = val;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A2558' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  records.forEach((rec, idx) => {
    const rNum = idx + 2;
    const density = Number(rec.densityKgM3 ?? rec.density ?? 442.02);
    const niasHeelVol = Number(
      rec.niasHeelM3 ?? (((rec.niasEstGrossKg ?? 11215) - 10850) / density).toFixed(2)
    );

    ws3.getCell(`A${rNum}`).value = rec.tankNo;
    ws3.getCell(`B${rNum}`).value = rec.serialNo;
    ws3.getCell(`C${rNum}`).value = 10850;
    ws3.getCell(`D${rNum}`).value = niasHeelVol;
    ws3.getCell(`E${rNum}`).value = density;
    ws3.getCell(`F${rNum}`).value = { formula: `=D${rNum}*E${rNum}` };
    ws3.getCell(`G${rNum}`).value = { formula: `=C${rNum}+F${rNum}` };

    const row = ws3.getRow(rNum);
    row.height = 20;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Calibri', size: 10 };
      if ([1, 2].includes(colNumber)) cell.alignment = { horizontal: 'center' };
      else cell.alignment = { horizontal: 'right' };

      if ([3, 6, 7].includes(colNumber)) cell.numFmt = '#,##0';
      if ([4, 5].includes(colNumber)) cell.numFmt = '0.00';
    });
  });

  ws3.columns.forEach((col) => {
    col.width = 24;
  });

  // Write and Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `PAGT_Arun_Transit_Loss_Audit_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
