// src/app/api/v1/cmms/ptw-permits/sync-conflicts/route.ts
//
// PURPOSE
//   Site Manager 검토 대기 중인 permit_sync_conflicts(§5.5) 조회 전용 API.
//   ptw-permits/route.ts와 동일 구조 — 도메인 로직은 permitPersistenceAdapter.ts에
//   위임하고, 이 route는 응답 매핑만 담당한다. 기존 permit 뷰(PTWMasterRegisterTab.tsx)의
//   배지 표시가 이 GET을 폴링한다.

import { NextResponse } from 'next/server';
import { getOpenPermitSyncConflicts } from '../../../../../../adapters/permitPersistenceAdapter';

export const runtime = 'nodejs';

export async function GET() {
  const conflicts = getOpenPermitSyncConflicts();
  return NextResponse.json({ success: true, conflicts });
}
