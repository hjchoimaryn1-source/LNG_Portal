// src/components/shared/GuardrailBlockedBanner.tsx
//
// HqSettlementDisputePanel.tsx의 기존 인라인 차단 배너를 추출한 공용 프레젠테이션
// 컴포넌트. Phase 3(MOD_1~5) 가드레일 UI 확산에서 공통으로 재사용한다.

'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';

export interface GuardrailBlockedBannerProps {
  message: string | null;
  /** 'error' (default): hard block, red. 'warning': non-blocking notice (e.g. fatigue guardrail onboarding gap), amber. */
  variant?: 'error' | 'warning';
}

const VARIANT_STYLES: Record<'error' | 'warning', string> = {
  error: 'text-red-700 bg-red-50 border-red-700',
  warning: 'text-amber-800 bg-amber-50 border-amber-600',
};

export default function GuardrailBlockedBanner({ message, variant = 'error' }: GuardrailBlockedBannerProps) {
  if (!message) return null;

  return (
    <div className={`px-2 py-1 text-[11px] font-mono border-b flex items-center gap-1 ${VARIANT_STYLES[variant]}`}>
      <ShieldAlert className="w-3 h-3" /> {message}
    </div>
  );
}
