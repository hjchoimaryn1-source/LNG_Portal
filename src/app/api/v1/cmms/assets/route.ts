// src/app/api/v1/cmms/assets/route.ts
//
// PURPOSE
//   CmmsAwarePortalProvider.tsx가 assets 테이블을 실시간 조회하는 API.
//   응답 스키마는 기존 정적 배치 산출물(exportCmmsAssetSnapshot.ts의
//   CmmsAssetSnapshotFile)과 동일하게 유지한다 — Provider의 fetch 파싱
//   로직을 무수정으로 두기 위함(Minimal Diff).
//
//   실제 도메인 로직은 src/adapters/assetDbAdapter.ts에 위임하고, 이
//   route는 응답 매핑만 담당한다 (gas-tests/work-orders route와 동일 구조).

import { NextResponse } from 'next/server';
import { getAllAssetRecords } from '../../../../../adapters/assetDbAdapter';
import type { CmmsAssetSnapshotFile } from '../../../../../scripts/exportCmmsAssetSnapshot';

export const runtime = 'nodejs';

export async function GET() {
  const assets = getAllAssetRecords();
  const body: CmmsAssetSnapshotFile = {
    generatedAt: new Date().toISOString(),
    totalCount: assets.length,
    assets,
  };
  return NextResponse.json(body);
}
