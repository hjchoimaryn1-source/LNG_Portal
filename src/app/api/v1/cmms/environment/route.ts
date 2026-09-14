// src/app/api/v1/cmms/environment/route.ts
//
// PURPOSE
//   NP-10 환경관리/폐기물관리 모듈의 읽기 전용 집계 API. src/app/api/v1/cmms/
//   trucking-inspections/route.ts와 동일 구조 — 도메인 로직은
//   src/cmms-environment/dao/*.ts에 위임하고, 이 route는 HTTP 응답 매핑만
//   담당한다. Stage 2는 read-only 요건이므로 GET만 제공한다(Stage 1 DAO에
//   이미 존재하는 insert 함수들은 이 route에서 아직 노출하지 않는다).
//
//   environmentDbSingleton.ts(→ cmmsDbSingleton.ts → node:sqlite)는
//   서버 전용 모듈이라 "use client" 컴포넌트에서 직접 import할 수 없다 —
//   EnvironmentDataContext.tsx는 이 route를 통해서만 데이터를 읽는다
//   (TruckingDataContext.tsx와 동일한 클라이언트/서버 경계 패턴).

import { NextResponse } from 'next/server';
import { getEnvironmentDb } from '../../../../../cmms-environment/db/environmentDbSingleton';
import {
  selectAllAirQualityLogs,
  selectAllWastewaterLogs,
  selectAllNoiseLogs,
  selectAllSeawaterLogs,
} from '../../../../../cmms-environment/dao/environmentMonitoringDao';
import {
  selectAllWasteTransferLogs,
  selectAllThwsInventory,
} from '../../../../../cmms-environment/dao/environmentWasteDao';

export const runtime = 'nodejs';

export async function GET() {
  const db = getEnvironmentDb();
  return NextResponse.json({
    success: true,
    airQuality: selectAllAirQualityLogs(db),
    wastewater: selectAllWastewaterLogs(db),
    noise: selectAllNoiseLogs(db),
    seawater: selectAllSeawaterLogs(db),
    wasteTransfers: selectAllWasteTransferLogs(db),
    thwsInventory: selectAllThwsInventory(db),
  });
}
