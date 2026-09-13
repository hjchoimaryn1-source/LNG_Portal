// src/cmms-trucking/db/truckInspectionDao.ts
//
// PURPOSE
//   truck_inspections / truck_inspection_items에 대한 순수 DAO.
//   SqlExecutor에만 의존하며 React/Next 바인딩이 없다 (workOrderDao.ts와 동일 패턴).

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import type {
  TruckInspectionHeader,
  NewTruckInspectionHeaderInput,
  InspectionItem,
  NewInspectionItemInput,
} from '../types';

interface TruckInspectionRow {
  inspection_id: number;
  inspection_date: string;
  driver: string;
  vehicle_no: string;
  iso_tank_no: string | null;
  inspection_type: string;
  form_code: string;
  status: string;
  checked_by: string;
  created_at: string;
}

interface TruckInspectionItemRow {
  item_id: number;
  inspection_id: number;
  item_label: string;
  criteria: string | null;
  status: string;
  remarks: string | null;
}

const INSERT_HEADER_SQL = `
  INSERT INTO truck_inspections (
    inspection_date, driver, vehicle_no, iso_tank_no, inspection_type, form_code, status, checked_by
  ) VALUES (
    @inspectionDate, @driver, @vehicleNo, @isoTankNo, @inspectionType, @formCode, @status, @checkedBy
  )
`;

const INSERT_ITEM_SQL = `
  INSERT INTO truck_inspection_items (inspection_id, item_label, criteria, status, remarks)
  VALUES (@inspectionId, @itemLabel, @criteria, @status, @remarks)
`;

const SELECT_HEADER_BY_ID_SQL = `SELECT * FROM truck_inspections WHERE inspection_id = @inspectionId`;
const SELECT_ITEMS_BY_INSPECTION_SQL = `SELECT * FROM truck_inspection_items WHERE inspection_id = @inspectionId ORDER BY item_id ASC`;
const SELECT_HEADERS_BY_VEHICLE_SQL = `SELECT * FROM truck_inspections WHERE vehicle_no = @vehicleNo ORDER BY inspection_date DESC`;
const SELECT_HEADERS_BY_TYPE_SQL = `SELECT * FROM truck_inspections WHERE inspection_type = @inspectionType ORDER BY created_at DESC`;
const SELECT_ALL_HEADERS_SQL = `SELECT * FROM truck_inspections ORDER BY created_at DESC`;
const SELECT_LAST_INSERT_ID_SQL = `SELECT last_insert_rowid() AS id`;

function headerRowToRecord(row: TruckInspectionRow): TruckInspectionHeader {
  return {
    id: row.inspection_id,
    inspectionDate: row.inspection_date,
    driver: row.driver,
    vehicleNo: row.vehicle_no,
    isoTankNo: row.iso_tank_no,
    inspectionType: row.inspection_type as TruckInspectionHeader['inspectionType'],
    formCode: row.form_code as TruckInspectionHeader['formCode'],
    status: row.status as TruckInspectionHeader['status'],
    checkedBy: row.checked_by,
    createdAt: row.created_at,
  };
}

function itemRowToRecord(row: TruckInspectionItemRow): InspectionItem {
  return {
    id: row.item_id,
    inspectionId: row.inspection_id,
    itemLabel: row.item_label,
    criteria: row.criteria,
    status: row.status as InspectionItem['status'],
    remarks: row.remarks,
  };
}

/** 헤더 + 항목들을 함께 INSERT하고 생성된 inspection_id를 반환한다. */
export function insertTruckInspection(
  db: SqlExecutor,
  header: NewTruckInspectionHeaderInput,
  items: NewInspectionItemInput[]
): number {
  db.run(INSERT_HEADER_SQL, {
    inspectionDate: header.inspectionDate,
    driver: header.driver,
    vehicleNo: header.vehicleNo,
    isoTankNo: header.isoTankNo ?? null,
    inspectionType: header.inspectionType,
    formCode: header.formCode,
    status: header.status ?? 'DRAFT',
    checkedBy: header.checkedBy,
  });

  const idRow = db.get<{ id: number }>(SELECT_LAST_INSERT_ID_SQL);
  const inspectionId = idRow!.id;

  for (const item of items) {
    db.run(INSERT_ITEM_SQL, {
      inspectionId,
      itemLabel: item.itemLabel,
      criteria: item.criteria ?? null,
      status: item.status,
      remarks: item.remarks ?? null,
    });
  }

  return inspectionId;
}

export function selectTruckInspectionById(
  db: SqlExecutor,
  inspectionId: number
): { header: TruckInspectionHeader; items: InspectionItem[] } | undefined {
  const row = db.get<TruckInspectionRow>(SELECT_HEADER_BY_ID_SQL, { inspectionId });
  if (!row) return undefined;

  const items = db.all<TruckInspectionItemRow>(SELECT_ITEMS_BY_INSPECTION_SQL, { inspectionId }).map(itemRowToRecord);
  return { header: headerRowToRecord(row), items };
}

export function selectTruckInspectionsByVehicle(db: SqlExecutor, vehicleNo: string): TruckInspectionHeader[] {
  return db.all<TruckInspectionRow>(SELECT_HEADERS_BY_VEHICLE_SQL, { vehicleNo }).map(headerRowToRecord);
}

export function selectTruckInspectionsByType(
  db: SqlExecutor,
  inspectionType: TruckInspectionHeader['inspectionType']
): TruckInspectionHeader[] {
  return db.all<TruckInspectionRow>(SELECT_HEADERS_BY_TYPE_SQL, { inspectionType }).map(headerRowToRecord);
}

export function selectAllTruckInspections(db: SqlExecutor): TruckInspectionHeader[] {
  return db.all<TruckInspectionRow>(SELECT_ALL_HEADERS_SQL).map(headerRowToRecord);
}
