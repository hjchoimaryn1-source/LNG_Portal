// src/utils/exportExcelLedger.ts
import ExcelJS from 'exceljs';

export async function exportLedgerToExcel(
  records: any[],
  selectedBatch: string = 'ALL'
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PAGT Arun Terminal System';
  workbook.lastModifiedBy = 'PAGT Arun Terminal System';
  workbook.created = new Date();

  // Group records by shipment / batch
  const groupedBatches: Record<string, any[]> = {};

  if (selectedBatch === 'ALL') {
    records.forEach((r) => {
      const rawBatch = r.shipment || r.batchId || 'N-1';
      const key = `Batch ${String(rawBatch).replace(/^Batch\s+/i, '')}`;
      if (!groupedBatches[key]) {
        groupedBatches[key] = [];
      }
      groupedBatches[key].push(r);
    });

    if (Object.keys(groupedBatches).length === 0) {
      groupedBatches['Batch N-1'] = [];
    }
  } else {
    const key = `Batch ${String(selectedBatch).replace(/^Batch\s+/i, '')}`;
    groupedBatches[key] = records;
  }

  // Generate a worksheet for each batch
  Object.entries(groupedBatches).forEach(([sheetName, sheetRecords]) => {
    const worksheet = workbook.addWorksheet(sheetName, {
      views: [{ showGridLines: true }],
    });

    worksheet.pageSetup = {
      orientation: 'landscape',
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1, // Fit all columns into 1 page width
      fitToHeight: 0, // Allow height to flow naturally across pages
      margins: {
        left: 0.25,
        right: 0.25,
        top: 0.4,
        bottom: 0.4,
        header: 0.2,
        footer: 0.2,
      },
    };

    // Tier 1: Group Category Header (Row 1)
    worksheet.mergeCells('A1:A2');
    worksheet.getCell('A1').value = 'BATCH';

    worksheet.mergeCells('B1:B2');
    worksheet.getCell('B1').value = 'DATE';

    worksheet.mergeCells('C1:D1');
    worksheet.getCell('C1').value = 'TANK NO.';

    worksheet.mergeCells('E1:G1');
    worksheet.getCell('E1').value = 'WEIGHT SCALE';

    worksheet.mergeCells('H1:J1');
    worksheet.getCell('H1').value = 'PROPERTIES';

    worksheet.mergeCells('K1:R1');
    worksheet.getCell('K1').value = 'COMPONENT (MOL %)';

    worksheet.mergeCells('S1:T1');
    worksheet.getCell('S1').value = 'DELIVERED';

    worksheet.mergeCells('U1:U2');
    worksheet.getCell('U1').value = 'STATUS';

    // Tier 2: Column Headers (Row 2)
    const tier2Headers = [
      '', // A (merged with A1)
      '', // B (merged with B1)
      'ISO TANK NO', // C
      'SERIAL NO', // D
      'TARE (KG)', // E
      'GROSS (KG)', // F
      'NET MASS (KG)', // G
      'TEMP (°C)', // H
      'DENSITY (KG/M³)', // I
      'GHV (BTU/KG)', // J
      'CH4', // K
      'C2H6', // L
      'C3H8', // M
      'i-C4', // N
      'n-C4', // O
      'i-C5', // P
      'n-C5', // Q
      'N2', // R
      'NET VOL (M³)', // S
      'ENERGY (MMBTU)', // T
      '', // U (merged with U1)
    ];

    const row2 = worksheet.getRow(2);
    tier2Headers.forEach((val, idx) => {
      if (val) {
        row2.getCell(idx + 1).value = val;
      }
    });

    // Apply Tier 1 & Tier 2 Styling
    for (let r = 1; r <= 2; r++) {
      const row = worksheet.getRow(r);
      row.height = 24;
      row.eachCell((cell) => {
        if (r === 1) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0A2558' }, // Dark Navy
          };
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10, name: 'Calibri' };
        } else {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE8E6DF' }, // Light Beige/Gray
          };
          cell.font = { bold: true, color: { argb: 'FF0A2558' }, size: 10, name: 'Calibri' };
        }
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFA09E90' } },
          left: { style: 'thin', color: { argb: 'FFA09E90' } },
          bottom: { style: 'thin', color: { argb: 'FFA09E90' } },
          right: { style: 'thin', color: { argb: 'FFA09E90' } },
        };
      });
    }

    // Populate Data Rows starting at Row 3
    const startRow = 3;
    sheetRecords.forEach((rec, idx) => {
      const rowNum = startRow + idx;
      const tare = Number(rec.tareKg ?? rec.preLoadTare ?? rec.weightBeforeKg ?? 10850);
      const netMass = Number(rec.netMassKg ?? rec.deliveredWeightKg ?? 0);
      const gross = Number(rec.grossKg ?? rec.weightAfterKg ?? (tare + netMass));
      const temp = Number(rec.deliveredTempC ?? rec.tempC ?? -160.0);
      const density = Number(rec.deliveredDensity ?? rec.densityKgM3 ?? rec.density ?? 442.02);
      const ghv = Number(rec.deliveredGHV ?? rec.massGhv ?? rec.ghv ?? 52214.94);

      const ch4 = Number(rec.ch4 ?? rec.methane ?? 95.50);
      const c2h6 = Number(rec.c2h6 ?? rec.ethane ?? 3.39);
      const c3h8 = Number(rec.c3h8 ?? rec.propane ?? 0.77);
      const iC4 = Number(rec.iC4 ?? rec.iButane ?? 0.12);
      const nC4 = Number(rec.nC4 ?? rec.nButane ?? 0.14);
      const iC5 = Number(rec.iC5 ?? rec.iPentane ?? 0.03);
      const nC5 = Number(rec.nC5 ?? rec.nPentane ?? 0.01);
      const n2 = Number(rec.n2 ?? rec.nitrogen ?? 0.04);

      const netVol = Number(rec.deliveredVolumeM3 ?? rec.netVolM3 ?? (density > 0 ? netMass / density : 0));
      const energy = Number(rec.deliveredMmbtu ?? rec.deliveredMMBtu ?? rec.energyMMBtu ?? 0);

      const rowData = [
        rec.shipment || rec.batchId || 'N-1', // A
        rec.date || new Date().toISOString().split('T')[0], // B
        rec.tankNo, // C
        rec.serialNo, // D
        tare, // E
        gross, // F
        netMass, // G
        temp, // H
        density, // I
        ghv, // J
        ch4, // K
        c2h6, // L
        c3h8, // M
        iC4, // N
        nC4, // O
        iC5, // P
        nC5, // Q
        n2, // R
        netVol, // S
        energy, // T
        'Archived', // U
      ];

      const row = worksheet.getRow(rowNum);
      row.values = rowData;
      row.height = 20;

      // Apply cell formatting & number formats
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Calibri', size: 10 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };

        // Alignments & Number Formats
        if ([1, 2, 3, 4, 21].includes(colNumber)) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }

        // TARE, GROSS, NET MASS (Cols 5, 6, 7)
        if ([5, 6, 7].includes(colNumber)) {
          cell.numFmt = '#,##0';
        }
        // TEMP (Col 8)
        else if (colNumber === 8) {
          cell.numFmt = '0.0';
        }
        // DENSITY (Col 9)
        else if (colNumber === 9) {
          cell.numFmt = '0.00';
        }
        // GHV (Col 10)
        else if (colNumber === 10) {
          cell.numFmt = '#,##0.00';
        }
        // GC Components (Cols 11..18)
        else if (colNumber >= 11 && colNumber <= 18) {
          cell.numFmt = '0.00';
        }
        // NET VOL (Col 19)
        else if (colNumber === 19) {
          cell.numFmt = '0.00';
        }
        // ENERGY (Col 20)
        else if (colNumber === 20) {
          cell.numFmt = '#,##0.00';
        }
      });
    });

    const lastDataRow = startRow + sheetRecords.length - 1;
    const sumRowIndex = sheetRecords.length > 0 ? lastDataRow + 1 : startRow;

    // Add Footer SUM Row
    worksheet.mergeCells(`A${sumRowIndex}:B${sumRowIndex}`);
    worksheet.getCell(`A${sumRowIndex}`).value = 'SUM';

    worksheet.mergeCells(`C${sumRowIndex}:D${sumRowIndex}`);
    worksheet.getCell(`C${sumRowIndex}`).value = `Selected Items (${sheetRecords.length})`;

    if (sheetRecords.length > 0) {
      worksheet.getCell(`E${sumRowIndex}`).value = { formula: `SUM(E3:E${lastDataRow})` };
      worksheet.getCell(`F${sumRowIndex}`).value = { formula: `SUM(F3:F${lastDataRow})` };
      worksheet.getCell(`G${sumRowIndex}`).value = { formula: `SUM(G3:G${lastDataRow})` };
      worksheet.getCell(`S${sumRowIndex}`).value = { formula: `SUM(S3:S${lastDataRow})` };
      worksheet.getCell(`T${sumRowIndex}`).value = { formula: `SUM(T3:T${lastDataRow})` };
    } else {
      worksheet.getCell(`E${sumRowIndex}`).value = 0;
      worksheet.getCell(`F${sumRowIndex}`).value = 0;
      worksheet.getCell(`G${sumRowIndex}`).value = 0;
      worksheet.getCell(`S${sumRowIndex}`).value = 0;
      worksheet.getCell(`T${sumRowIndex}`).value = 0;
    }

    worksheet.mergeCells(`H${sumRowIndex}:J${sumRowIndex}`);
    worksheet.getCell(`H${sumRowIndex}`).value = '—';

    worksheet.mergeCells(`K${sumRowIndex}:R${sumRowIndex}`);
    worksheet.getCell(`K${sumRowIndex}`).value = 'Avg Spec Normalized';

    worksheet.getCell(`U${sumRowIndex}`).value = 'Archived';

    // Style Footer SUM Row
    const sumRow = worksheet.getRow(sumRowIndex);
    sumRow.height = 22;
    sumRow.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDFE6EE' },
      };
      cell.font = { bold: true, color: { argb: 'FF0A2558' }, size: 10, name: 'Calibri' };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FFA09E90' } },
        bottom: { style: 'medium', color: { argb: 'FFA09E90' } },
        left: { style: 'thin', color: { argb: 'FFA09E90' } },
        right: { style: 'thin', color: { argb: 'FFA09E90' } },
      };

      if ([1, 3, 8, 11, 21].includes(colNumber)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }

      if ([5, 6, 7].includes(colNumber)) cell.numFmt = '#,##0';
      if (colNumber === 19) cell.numFmt = '0.00';
      if (colNumber === 20) cell.numFmt = '#,##0.00';
    });

    // Auto Adjust Column Widths
    worksheet.columns.forEach((column) => {
      let maxLen = 12;
      column.eachCell?.({ includeEmpty: false }, (cell) => {
        const valStr = cell.value ? String(cell.value) : '';
        if (valStr.length > maxLen) {
          maxLen = Math.min(valStr.length + 3, 24);
        }
      });
      column.width = maxLen;
    });
  });

  // Write to Buffer and trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `PAGT_Arun_Custody_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
