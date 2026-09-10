// src/app/api/v1/cmms/bootstrap/route.ts
//
// PURPOSE
//   관리자 전용 "[DB Reset & Re-sync]" 버튼이 호출하는 API. 서버 쪽에서
//   runBootstrap({ resetDb: true })를 실행해 DB를 초기화하고 자산 데이터를
//   재적재한 뒤, 갱신된 요약 정보를 반환한다.
//
//   ⚠ node:sqlite / node:fs를 사용하므로 반드시 Node.js 런타임에서 실행돼야 한다.
//
//   권한 정책 (현재 단계 한정):
//   NIAS 현장(플랜트)과 자카르타 본사의 CMMS 운영 이원화 구조가 아직 확정되지
//   않았고, LoginGateway.tsx도 정식 권한 체계 없이 Bypass로 동작 중이므로,
//   여기서는 정식 역할(role) 기반 인가를 넣지 않는다. 대신 최소한의 안전장치로
//   NODE_ENV==='development'가 아니면 무조건 차단한다 — 즉 이 API는 로컬 개발
//   환경에서만 동작하고, 프로덕션 빌드/배포본에서는 항상 403을 반환한다.
//
//   ⚠ 이원화 구조와 정식 인증이 확정되면 이 체크를 실제 역할 기반 인가로
//   교체해야 한다 (예: 자카르타 본사 관리자 세션만 허용). 그 전까지 이 API를
//   프로덕션에 배포하지 말 것 — NODE_ENV 체크만으로는 "배포된 프로덕션 서버를
//   개발 모드로 잘못 띄운 경우"까지는 막지 못한다.

import { NextResponse } from 'next/server';
import { runBootstrap } from '../../../../../scripts/runBootstrapPipeline';

export const runtime = 'nodejs';

export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { success: false, error: '이 API는 로컬 개발 환경(NODE_ENV=development)에서만 사용할 수 있습니다.' },
      { status: 403 }
    );
  }

  try {
    const result = await runBootstrap({ resetDb: true });
    return NextResponse.json({ success: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[api/cmms/bootstrap] 파이프라인 실행 실패:', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
