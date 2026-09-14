// src/cmms-environment/dao/environmentMonitoringDao.ts
//
// PURPOSE
//   Chapter 1(환경 모니터링) 4개 테이블에 대한 순수 DAO.
//   SqlExecutor에만 의존하며 React/Next 바인딩이 없다
//   (src/cmms-trucking/db/truckInspectionDao.ts와 동일 패턴).
//
//   모니터링 로그는 truck_incident_log와 동일하게 불변 기록(append-only)이므로
//   insert/select만 제공한다 — UPDATE/DELETE는 이 도메인에 존재하지 않는다.

import type { SqlExecutor } from '../../adapters/db/sqlExecutor';
import type {
  AirQualityLog,
  NewAirQualityLogInput,
  WastewaterLog,
  NewWastewaterLogInput,
  NoiseLog,
  NewNoiseLogInput,
  SeawaterLog,
  NewSeawaterLogInput,
} from '../types/environment';

interface AirQualityRow {
  log_id: number;
  log_date: string;
  so2_ugm3: number | null;
  nox_ugm3: number | null;
  co_ugm3: number | null;
  pm10_ugm3: number | null;
  status: string | null;
  recorded_by: string | null;
  created_at: string;
}

interface WastewaterRow {
  log_id: number;
  log_date: string;
  sample_point: string;
  parameter: string;
  unit: string;
  standard_ref: string | null;
  measured_result: number;
  status: string | null;
  recorded_by: string | null;
  created_at: string;
}

interface NoiseRow {
  log_id: number;
  log_date: string;
  location: string;
  reading_dba: number;
  status: string | null;
  recorded_by: string | null;
  created_at: string;
}

interface SeawaterRow {
  log_id: number;
  log_date: string;
  location: string;
  do_mgl: number | null;
  salinity_ppt: number | null;
  turbidity_ntu: number | null;
  recorded_by: string | null;
  created_at: string;
}

function airRowToRecord(row: AirQualityRow): AirQualityLog {
  return {
    id: row.log_id,
    logDate: row.log_date,
    so2Ugm3: row.so2_ugm3,
    noxUgm3: row.nox_ugm3,
    coUgm3: row.co_ugm3,
    pm10Ugm3: row.pm10_ugm3,
    status: row.status as AirQualityLog['status'],
    recordedBy: row.recorded_by,
    createdAt: row.created_at,
  };
}

function wastewaterRowToRecord(row: WastewaterRow): WastewaterLog {
  return {
    id: row.log_id,
    logDate: row.log_date,
    samplePoint: row.sample_point,
    parameter: row.parameter,
    unit: row.unit,
    standardRef: row.standard_ref,
    measuredResult: row.measured_result,
    status: row.status as WastewaterLog['status'],
    recordedBy: row.recorded_by,
    createdAt: row.created_at,
  };
}

function noiseRowToRecord(row: NoiseRow): NoiseLog {
  return {
    id: row.log_id,
    logDate: row.log_date,
    location: row.location,
    readingDba: row.reading_dba,
    status: row.status as NoiseLog['status'],
    recordedBy: row.recorded_by,
    createdAt: row.created_at,
  };
}

function seawaterRowToRecord(row: SeawaterRow): SeawaterLog {
  return {
    id: row.log_id,
    logDate: row.log_date,
    location: row.location,
    doMgl: row.do_mgl,
    salinityPpt: row.salinity_ppt,
    turbidityNtu: row.turbidity_ntu,
    recordedBy: row.recorded_by,
    createdAt: row.created_at,
  };
}

export function insertAirQualityLog(db: SqlExecutor, input: NewAirQualityLogInput): void {
  db.run(
    `INSERT INTO env_air_quality_logs (log_date, so2_ugm3, nox_ugm3, co_ugm3, pm10_ugm3, status, recorded_by)
     VALUES (@logDate, @so2Ugm3, @noxUgm3, @coUgm3, @pm10Ugm3, @status, @recordedBy)`,
    {
      logDate: input.logDate,
      so2Ugm3: input.so2Ugm3 ?? null,
      noxUgm3: input.noxUgm3 ?? null,
      coUgm3: input.coUgm3 ?? null,
      pm10Ugm3: input.pm10Ugm3 ?? null,
      status: input.status ?? null,
      recordedBy: input.recordedBy ?? null,
    }
  );
}

export function selectAllAirQualityLogs(db: SqlExecutor): AirQualityLog[] {
  return db.all<AirQualityRow>(`SELECT * FROM env_air_quality_logs ORDER BY log_date DESC`).map(airRowToRecord);
}

export function insertWastewaterLog(db: SqlExecutor, input: NewWastewaterLogInput): void {
  db.run(
    `INSERT INTO env_wastewater_logs (log_date, sample_point, parameter, unit, standard_ref, measured_result, status, recorded_by)
     VALUES (@logDate, @samplePoint, @parameter, @unit, @standardRef, @measuredResult, @status, @recordedBy)`,
    {
      logDate: input.logDate,
      samplePoint: input.samplePoint,
      parameter: input.parameter,
      unit: input.unit,
      standardRef: input.standardRef ?? null,
      measuredResult: input.measuredResult,
      status: input.status ?? null,
      recordedBy: input.recordedBy ?? null,
    }
  );
}

export function selectAllWastewaterLogs(db: SqlExecutor): WastewaterLog[] {
  return db
    .all<WastewaterRow>(`SELECT * FROM env_wastewater_logs ORDER BY log_date DESC, sample_point ASC`)
    .map(wastewaterRowToRecord);
}

export function insertNoiseLog(db: SqlExecutor, input: NewNoiseLogInput): void {
  db.run(
    `INSERT INTO env_noise_logs (log_date, location, reading_dba, status, recorded_by)
     VALUES (@logDate, @location, @readingDba, @status, @recordedBy)`,
    {
      logDate: input.logDate,
      location: input.location,
      readingDba: input.readingDba,
      status: input.status ?? null,
      recordedBy: input.recordedBy ?? null,
    }
  );
}

export function selectAllNoiseLogs(db: SqlExecutor): NoiseLog[] {
  return db.all<NoiseRow>(`SELECT * FROM env_noise_logs ORDER BY log_date DESC, location ASC`).map(noiseRowToRecord);
}

export function insertSeawaterLog(db: SqlExecutor, input: NewSeawaterLogInput): void {
  db.run(
    `INSERT INTO env_seawater_logs (log_date, location, do_mgl, salinity_ppt, turbidity_ntu, recorded_by)
     VALUES (@logDate, @location, @doMgl, @salinityPpt, @turbidityNtu, @recordedBy)`,
    {
      logDate: input.logDate,
      location: input.location,
      doMgl: input.doMgl ?? null,
      salinityPpt: input.salinityPpt ?? null,
      turbidityNtu: input.turbidityNtu ?? null,
      recordedBy: input.recordedBy ?? null,
    }
  );
}

export function selectAllSeawaterLogs(db: SqlExecutor): SeawaterLog[] {
  return db
    .all<SeawaterRow>(`SELECT * FROM env_seawater_logs ORDER BY log_date DESC, location ASC`)
    .map(seawaterRowToRecord);
}
