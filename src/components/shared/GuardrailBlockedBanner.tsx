// src/components/shared/GuardrailBlockedBanner.tsx
//
// HqSettlementDisputePanel.tsx의 기존 인라인 차단 배너를 추출한 공용 프레젠테이션
// 컴포넌트. Phase 3(MOD_1~5) 가드레일 UI 확산에서 공통으로 재사용한다.

'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';

export interface GuardrailBlockedBannerProps {
  message: string | null;
}

export default function GuardrailBlockedBanner({ message }: GuardrailBlockedBannerProps) {
  if (!message) return null;

  return (
    <div className="px-2 py-1 text-[11px] text-red-700 font-mono bg-red-50 border-b border-red-700 flex items-center gap-1">
      <ShieldAlert className="w-3 h-3" /> {message}
    </div>
  );
}
