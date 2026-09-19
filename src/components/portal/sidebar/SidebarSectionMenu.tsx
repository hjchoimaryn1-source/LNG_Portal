// src/components/portal/sidebar/SidebarSectionMenu.tsx
//
// In-sector-mode sidebar (Stage 1, contextual sidebar, 2026-09-18): renders
// ONLY the one section whose members include the current activeKey, expanded
// with its full leaf list — same markup/behavior as SidebarNav.tsx's former
// flattened per-section blocks, just scoped to one section instead of all 9.
//
// If activeKey doesn't belong to any section with a submenu (e.g.
// HQ_OVERVIEW_DASHBOARD, which is a leaf-only sector-list entry with nothing
// beneath it), falls back to the sector list rather than rendering an empty
// header — an empty submenu would strand the user with no way back out.
"use client";

import React from 'react';
import { SubProcessKey } from '../../../types/lng';
import { useActiveSession } from '../../../lib/rbac/activeSessionStore';
import { SIDEBAR_SECTIONS } from './sidebarSections';
import { useSidebarFleetCounts } from './useSidebarFleetCounts';
import SidebarSectionSubItems from './SidebarSectionSubItems';
import SidebarSectorListView from './SidebarSectorListView';

// 2026-09-19(HJ 디자인 통일 승인) — Win98 베이지 베벨(TIER 2 밖의 별도 색상) 폐기,
// 위젯/콘텐츠 섹션 헤더와 동일한 TIER 2(.tier2-header) 네이비로 통일.
const SECTION_HEADER_BEVEL =
  "tier2-header flex items-center justify-between cursor-default select-none";

interface SidebarSectionMenuProps {
  activeKey: SubProcessKey;
  activeSubTab?: string;
  onSelectKey: (key: SubProcessKey) => void;
}

export default function SidebarSectionMenu({ activeKey, activeSubTab, onSelectKey }: SidebarSectionMenuProps) {
  const session = useActiveSession();
  const counts = useSidebarFleetCounts();

  const activeSection = SIDEBAR_SECTIONS.find((sec) => sec.matches(activeKey));

  if (!activeSection || !activeSection.hasSubMenu) {
    return <SidebarSectorListView onSelectKey={onSelectKey} />;
  }

  return (
    <div>
      <div className={SECTION_HEADER_BEVEL}>
        <span>{activeSection.label}</span>
        {activeSection.headerBadge && (
          <span className="font-mono text-xs font-bold text-white/80 normal-case">{activeSection.headerBadge(counts)}</span>
        )}
      </div>
      <SidebarSectionSubItems
        items={activeSection.items}
        session={session}
        activeKey={activeKey}
        activeSubTab={activeSubTab}
        counts={counts}
        onSelectKey={onSelectKey}
      />
    </div>
  );
}
