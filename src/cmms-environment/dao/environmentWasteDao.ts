// src/cmms-environment/dao/environmentWasteDao.ts
//
// PURPOSE
//   Chapter 2(폐기물 관리) 2개 테이블에 대한 순수 DAO.
//   SqlExecutor에만 의존하며 React/Next 바인딩이 없다
//   (src/cmms-trucking/db/truckInspectionDao.ts와 동일 패턴).
//
//   env_waste_transfer_logs는 불변 기록(insert/select만).
//   env_thws_inventory는 처리 상태가 IN_STORAGE -> DISPOSED/OVERDUE로
//   전이되는 실체가 있는 레코드이므로 상태 업데이트를 추가로 제공한다.

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import type {
  WasteTransferLog,
  NewWasteTransferLogInput,
  ThwsInventoryItem,
  NewThwsInventoryItemInput,
  ThwsStatus,
} from '../types/environment';

interface WasteTransferRow {
  transfer_id: number;
  transfer_date: string;
  waste_category: string;
  waste_type: string;
  source_department: string;
  quantity_kg: number;
  disposal_method: string;
  transported_to: string | null;
  pic_signature: string | null;
  created_at: string;
}

interface ThwsRow {
  thws_id: number;
  waste_code: string;
  waste_description: string;
  quantity_kg: number;
  storage_in_date: string;
  disposal_due_date: string;
  status: string;
  handler_pic: string | null;
  created_at: string;
}

function wasteTransferRowToRecord(row: WasteTransferRow): WasteTransferLog {
  return {
    id: row.transfer_id,
    transferDate: row.transfer_date,
    wasteCategory: row.waste_category as WasteTransferLog['wasteCategory'],
    wasteType: row.waste_type,
    sourceDepartment: row.source_department,
    quantityKg: row.quantity_kg,
    disposalMethod: row.disposal_method,
    transportedTo: row.transported_to,
    picSignature: row.pic_signature,
    createdAt: row.created_at,
  };
}

function thwsRowToRecord(row: ThwsRow): ThwsInventoryItem {
  return {
    id: row.thws_id,
    wasteCode: row.waste_code,
    wasteDescription: row.waste_description,
    quantityKg: row.quantity_kg,
    storageInDate: row.storage_in_date,
    disposalDueDate: row.disposal_due_date,
    status: row.status as ThwsStatus,
    handlerPic: row.handler_pic,
    createdAt: row.created_at,
  };
}

export function insertWasteTransferLog(db: SqlExecutor, input: NewWasteTransferLogInput): void {
  db.run(
    `INSERT INTO env_waste_transfer_logs (
       transfer_date, waste_category, waste_type, source_department, quantity_kg, disposal_method, transported_to, pic_signature
     ) VALUES (@transferDate, @wasteCategory, @wasteType, @sourceDepartment, @quantityKg, @disposalMethod, @transportedTo, @picSignature)`,
    {
      transferDate: input.transferDate,
      wasteCategory: input.wasteCategory,
      wasteType: input.wasteType,
      sourceDepartment: input.sourceDepartment,
      quantityKg: input.quantityKg,
      disposalMethod: input.disposalMethod,
      transportedTo: input.transportedTo ?? null,
      picSignature: input.picSignature ?? null,
    }
  );
}

export function selectAllWasteTransferLogs(db: SqlExecutor): WasteTransferLog[] {
  return db
    .all<WasteTransferRow>(`SELECT * FROM env_waste_transfer_logs ORDER BY transfer_date DESC`)
    .map(wasteTransferRowToRecord);
}

export function insertThwsInventoryItem(db: SqlExecutor, input: NewThwsInventoryItemInput): void {
  db.run(
    `INSERT INTO env_thws_inventory (
       waste_code, waste_description, quantity_kg, storage_in_date, disposal_due_date, status, handler_pic
     ) VALUES (@wasteCode, @wasteDescription, @quantityKg, @storageInDate, @disposalDueDate, @status, @handlerPic)`,
    {
      wasteCode: input.wasteCode,
      wasteDescription: input.wasteDescription,
      quantityKg: input.quantityKg,
      storageInDate: input.storageInDate,
      disposalDueDate: input.disposalDueDate,
      status: input.status ?? 'IN_STORAGE',
      handlerPic: input.handlerPic ?? null,
    }
  );
}

export function selectAllThwsInventory(db: SqlExecutor): ThwsInventoryItem[] {
  return db
    .all<ThwsRow>(`SELECT * FROM env_thws_inventory ORDER BY disposal_due_date ASC`)
    .map(thwsRowToRecord);
}

export function updateThwsStatus(db: SqlExecutor, thwsId: number, status: ThwsStatus): void {
  db.run(`UPDATE env_thws_inventory SET status = @status WHERE thws_id = @thwsId`, { thwsId, status });
}
