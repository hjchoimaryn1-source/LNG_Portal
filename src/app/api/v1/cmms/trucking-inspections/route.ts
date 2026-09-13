// src/app/api/v1/cmms/trucking-inspections/route.ts
//
// PURPOSE
//   NP-03 트럭킹/차량 검사 체크리스트(NP03-02/06/11/13/15)가 공유하는 조회/기록 API.
//   src/app/api/v1/cmms/work-orders/route.ts와 동일 구조 — 도메인 로직은
//   src/cmms-trucking/db/*Dao.ts에 위임하고, 이 route는 입력 검증과 HTTP 응답
//   매핑만 담당한다.

import { NextRequest, NextResponse } from 'next/server';
import { getTruckingDb } from '../../../../../cmms-trucking/db/truckingDbSingleton';
import {
  insertTruckInspection,
  selectAllTruckInspections,
  selectTruckInspectionById,
  selectTruckInspectionsByVehicle,
} from '../../../../../cmms-trucking/db/truckInspectionDao';
import type { NewInspectionItemInput, NewTruckInspectionHeaderInput } from '../../../../../cmms-trucking/types';

export const runtime = 'nodejs';

interface CreatePayload {
  header: NewTruckInspectionHeaderInput;
  items: NewInspectionItemInput[];
}

function isValidCreatePayload(body: unknown): body is CreatePayload {
  if (!body || typeof body !== 'object') return false;
  const r = body as Record<string, unknown>;
  if (!r.header || typeof r.header !== 'object' || !Array.isArray(r.items)) return false;

  const h = r.header as Record<string, unknown>;
  return (
    typeof h.inspectionDate === 'string' &&
    typeof h.driver === 'string' &&
    typeof h.vehicleNo === 'string' &&
    typeof h.inspectionType === 'string' &&
    typeof h.formCode === 'string' &&
    typeof h.checkedBy === 'string'
  );
}

export async function GET(request: NextRequest) {
  const vehicleNo = request.nextUrl.searchParams.get('vehicleNo');
  const db = getTruckingDb();
  const records = vehicleNo ? selectTruckInspectionsByVehicle(db, vehicleNo) : selectAllTruckInspections(db);
  return NextResponse.json({ success: true, records });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!isValidCreatePayload(body)) {
    return NextResponse.json({ success: false, error: 'Invalid inspection payload.' }, { status: 400 });
  }

  const db = getTruckingDb();
  const inspectionId = insertTruckInspection(db, body.header, body.items);
  const record = selectTruckInspectionById(db, inspectionId);
  return NextResponse.json({ success: true, record });
}
