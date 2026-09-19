// src/components/portal/sidebar/SidebarSectorListView.tsx
//
// Dashboard-mode sidebar (Stage 1, contextual sidebar, 2026-09-18): a flat
// list of section headers, filtered by role visibility exactly as today's
// flattened SidebarNav.tsx list already was. Clicking a header navigates to
// that sector's entry leaf key — same navigation call every section header
// already used before this split.
//
// Stage 2 (2026-09-19, HJ 지시): each section's second-level items now render
// directly beneath its header too (reusing SidebarSectionSubItems.tsx — the
// exact same role-gated item list SidebarSectionMenu.tsx already shows once
// you're inside a section), so a user can jump straight to a sub-section
// without the extra click through the header first. activeKey is always
// 'CMMS_OVERVIEW_DASHBOARD' while this view is mounted (that's the condition
// SidebarNav.tsx uses to render it at all), so no sub-item is ever shown as
// selected here — correct, since selecting one immediately navigates away
// from Dashboard mode.
"use client";

import React from 'react';
import Link from 'next/link';
import { SubProcessKey } from '../../../types/lng';
import { useActiveSession } from '../../../lib/rbac/activeSessionStore';
import { SIDEBAR_SECTIONS } from './sidebarSections';
import { useSidebarFleetCounts } from './useSidebarFleetCounts';
import SidebarSectionSubItems from './SidebarSectionSubItems';

// 2026-09-19(HJ 디자인 통일 승인) — Win98 베이지 베벨 폐기, SidebarSectionMenu.tsx의
// SECTION_HEADER_BEVEL과 동일한 TIER 2(.tier2-header) 네이비로 통일(같은 섹션 헤더가
// Dashboard 모드/섹션 진입 모드 사이를 이동할 때 색이 바뀌지 않도록).
const SECTOR_HEADER_BUTTON = "tier2-header w-full text-left flex items-center justify-between cursor-pointer select-none hover:brightness-125";

interface SidebarSectorListViewProps {
  onSelectKey: (key: SubProcessKey) => void;
}

export default function SidebarSectorListView({ onSelectKey }: SidebarSectorListViewProps) {
  const session = useActiveSession();
  const counts = useSidebarFleetCounts();
  const visibleSections = SIDEBAR_SECTIONS.filter((sec) => sec.visible(session));

  return (
    <div>
      {visibleSections.map((sec) => (
        <div key={sec.id}>
          <button onClick={() => onSelectKey(sec.entryKey)} className={SECTOR_HEADER_BUTTON}>
            <span>{sec.label}</span>
            {sec.headerBadge && (
              <span className="font-mono text-xs font-bold text-white/80 normal-case">{sec.headerBadge(counts)}</span>
            )}
          </button>
          {sec.hasSubMenu && (
            <SidebarSectionSubItems
              items={sec.items}
              session={session}
              activeKey="CMMS_OVERVIEW_DASHBOARD"
              activeSubTab={undefined}
              counts={counts}
              onSelectKey={onSelectKey}
            />
          )}
        </div>
      ))}
      {/* Stage 1D 사이드바 연결(2026-09-19) — /admin/personnel은 레거시
          SubProcessKey/activeKey SPA 상태머신에 얹지 않고 독립된 App Router
          경로로 남겨둔다(app/admin/personnel/page.tsx 헤더 코멘트 참조) —
          그래서 다른 섹션처럼 onSelectKey(SubProcessKey)를 호출하는 대신
          next/link로 그 경로를 그대로 새 진입점 링크만 건다. ADMIN 전용
          클라이언트 UX 게이트일 뿐, 실제 보안 경계는 Stage 1C의
          /admin/personnel API 라우트 서버측 ADMIN 체크가 담당한다. */}
      {session?.roleCode === 'ADMIN' && (
        <Link href="/admin/personnel" className={SECTOR_HEADER_BUTTON}>
          <span>Personnel Management</span>
        </Link>
      )}
    </div>
  );
}
