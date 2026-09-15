// src/app/api/v1/cmms/pid-tag-aliases/route.ts
//
// PURPOSE
//   pid_tag_aliases 전체 조회 API. pid-tag-coordinates/route.ts와 동일한 client/server
//   경계 이유(pidTagAliasesDao.ts가 node:sqlite를 간접 임포트)로 라우트를 통해서만
//   'use client' 컴포넌트에서 접근한다. HMI-2-alias: 쓰기는 아직 불필요(시딩은
//   dailyOpsDbSingleton.ts 부트스트랩에서 처리) — GET만 노출한다.

import { NextResponse } from 'next/server';
import { getDailyOpsDb } from '../../../../../cmms-daily-ops/db/dailyOpsDbSingleton';
import { listTagAliases } from '../../../../../cmms-daily-ops/pid/pidTagAliasesDao';

export const runtime = 'nodejs';

export async function GET() {
  const db = getDailyOpsDb();
  return NextResponse.json({ success: true, records: listTagAliases(db) });
}
