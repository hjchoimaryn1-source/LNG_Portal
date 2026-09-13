// src/cmms-trucking/db/truckIncidentLogDao.ts
//
// PURPOSE
//   truck_incident_log(NP03-09 Incident & Violation Log)에 대한 순수 DAO.
//   SqlExecutor에만 의존하며 React/Next 바인딩이 없다 (workOrderDao.ts와 동일 패턴).

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import type { IncidentLogEntry, NewIncidentLogEntryInput } from '../types';

interface IncidentLogRow {
  incident_id: number;
  incident_date: string;
  driver: string;
  vehicle_no: string;
  incident_type: string;
  description: string;
  location: string | null;
  action_taken: string;
  follow_up: string;
  verified_by: string;
  created_at: string;
}

const INSERT_SQL = `
  INSERT INTO truck_incident_log (
    incident_date, driver, vehicle_no, incident_type, description, location, action_taken, follow_up, verified_by
  ) VALUES (
    @incidentDate, @driver, @vehicleNo, @incidentType, @description, @location, @actionTaken, @followUp, @verifiedBy
  )
`;

const SELECT_ALL_SQL = `SELECT * FROM truck_incident_log ORDER BY incident_date DESC`;
const SELECT_BY_VEHICLE_SQL = `SELECT * FROM truck_incident_log WHERE vehicle_no = @vehicleNo ORDER BY incident_date DESC`;

function rowToRecord(row: IncidentLogRow): IncidentLogEntry {
  return {
    id: row.incident_id,
    incidentDate: row.incident_date,
    driver: row.driver,
    vehicleNo: row.vehicle_no,
    incidentType: row.incident_type as IncidentLogEntry['incidentType'],
    description: row.description,
    location: row.location,
    actionTaken: row.action_taken,
    followUp: row.follow_up,
    verifiedBy: row.verified_by,
    createdAt: row.created_at,
  };
}

export function insertIncidentLogEntry(db: SqlExecutor, input: NewIncidentLogEntryInput): void {
  db.run(INSERT_SQL, {
    incidentDate: input.incidentDate,
    driver: input.driver,
    vehicleNo: input.vehicleNo,
    incidentType: input.incidentType,
    description: input.description,
    location: input.location ?? null,
    actionTaken: input.actionTaken,
    followUp: input.followUp,
    verifiedBy: input.verifiedBy,
  });
}

export function selectAllIncidentLogEntries(db: SqlExecutor): IncidentLogEntry[] {
  return db.all<IncidentLogRow>(SELECT_ALL_SQL).map(rowToRecord);
}

export function selectIncidentLogEntriesByVehicle(db: SqlExecutor, vehicleNo: string): IncidentLogEntry[] {
  return db.all<IncidentLogRow>(SELECT_BY_VEHICLE_SQL, { vehicleNo }).map(rowToRecord);
}
