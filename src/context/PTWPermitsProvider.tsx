// src/context/PTWPermitsProvider.tsx
//
// PURPOSE
//   usePTWPermits()(components/manpower/hooks)는 지금까지 PTWMasterRegisterTab
//   내부 로컬 state였다 — Work Order 트리 등 다른 서브트리에서는 permits를
//   읽을 방법이 없었다. CmmsAwarePortalProvider와 동일한 Strangler-Fig 패턴으로
//   기존 훅 로직은 무수정으로 두고 Context 한 겹만 씌운다.
//
//   기존 usePTWPermits()를 직접 호출하던 곳(PTWMasterRegisterTab)은
//   usePTWPermitsContext()로 호출부만 바꾸면 된다 — 반환 shape은 동일하다.

'use client';

import React, { createContext, useContext } from 'react';
import { usePTWPermits } from '../components/manpower/hooks/usePTWPermits';

type PTWPermitsContextType = ReturnType<typeof usePTWPermits>;

const PTWPermitsContext = createContext<PTWPermitsContextType | undefined>(undefined);

export function PTWPermitsProvider({ children }: { children: React.ReactNode }) {
  const value = usePTWPermits();
  return <PTWPermitsContext.Provider value={value}>{children}</PTWPermitsContext.Provider>;
}

/** PTW permits 전역 state가 필요한 컴포넌트(Work Order 상세 등)가 사용하는 훅. */
export function usePTWPermitsContext(): PTWPermitsContextType {
  const ctx = useContext(PTWPermitsContext);
  if (!ctx) {
    throw new Error('usePTWPermitsContext must be used within a PTWPermitsProvider');
  }
  return ctx;
}
