// src/components/cmms/CmmsAssetHierarchyTree.tsx
//
// PURPOSE
//   평면(flat) CmmsAssetRow[] 배열을 parentTag 필드 기반으로
//   부모-자식 트리로 렌더링한다. 검색(Tag/Name/KKS) + 노드 개별 expand/collapse.
//
// RULES
//   - 250줄 이하 유지 (현재 약 180줄)
//   - CmmsAssetRow 타입 직접 의존 — any 금지

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { ChevronRight, ChevronDown, Search } from 'lucide-react';
import { type CmmsAssetRow } from '../../context/CmmsAwarePortalProvider';

// ---------------------------------------------------------------------------
// 스타일 헬퍼
// ---------------------------------------------------------------------------

const CRIT_BADGE: Record<CmmsAssetRow['criticality'], string> = {
  CRITICAL: 'bg-red-950 text-red-400 border-red-900',
  HIGH:     'bg-orange-950 text-orange-400 border-orange-900',
  MEDIUM:   'bg-amber-950 text-amber-400 border-amber-900',
  LOW:      'bg-slate-800 text-slate-500 border-slate-700',
};

// ---------------------------------------------------------------------------
// Tree Node component (recursive)
// ---------------------------------------------------------------------------

interface TreeNodeProps {
  asset: CmmsAssetRow;
  depth: number;
  childrenMap: Map<string, CmmsAssetRow[]>;
  expandedMap: Record<string, boolean>;
  onToggle: (tag: string) => void;
  onSelect: (asset: CmmsAssetRow) => void;
}

function TreeNode({ asset, depth, childrenMap, expandedMap, onToggle, onSelect }: TreeNodeProps) {
  const children = childrenMap.get(asset.equipmentTag) ?? [];
  const hasChildren = children.length > 0;
  const isExpanded = expandedMap[asset.equipmentTag] !== false; // default open

  return (
    <>
      <div
        role="row"
        onClick={() => onSelect(asset)}
        style={{ paddingLeft: `${depth * 20 + 12}px` }}
        className="flex items-center gap-2 py-2 pr-3 border-b border-slate-800/50 cursor-pointer hover:bg-slate-800/60 transition-colors group select-none"
      >
        {/* Expand toggle */}
        <button
          type="button"
          aria-label={isExpanded ? '접기' : '펼치기'}
          onClick={(e) => { e.stopPropagation(); if (hasChildren) onToggle(asset.equipmentTag); }}
          className={`flex-shrink-0 text-slate-500 hover:text-cyan-400 transition-colors ${!hasChildren && 'invisible'}`}
        >
          {isExpanded
            ? <ChevronDown className="w-3.5 h-3.5" />
            : <ChevronRight className="w-3.5 h-3.5" />
          }
        </button>

        {/* Tag */}
        <span className="text-cyan-300 font-bold text-xs min-w-[130px] truncate">{asset.equipmentTag}</span>

        {/* Asset name */}
        <span className="flex-1 text-slate-300 text-xs truncate group-hover:text-white">{asset.assetName}</span>

        {/* Badges */}
        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
          {asset.kksCode && (
            <span className="bg-[#1a1d25] border border-amber-900/50 text-amber-400 text-[10px] px-1.5 py-0.5 rounded font-mono">
              {asset.kksCode}
            </span>
          )}
          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${CRIT_BADGE[asset.criticality]}`}>
            {asset.criticality}
          </span>
        </div>
      </div>

      {/* Recursive children */}
      {hasChildren && isExpanded && children.map(child => (
        <TreeNode
          key={child.equipmentTag}
          asset={child}
          depth={depth + 1}
          childrenMap={childrenMap}
          expandedMap={expandedMap}
          onToggle={onToggle}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// CmmsAssetHierarchyTree
// ---------------------------------------------------------------------------

interface CmmsAssetHierarchyTreeProps {
  assets: CmmsAssetRow[];
  onSelectAsset: (asset: CmmsAssetRow) => void;
}

export function CmmsAssetHierarchyTree({ assets, onSelectAsset }: CmmsAssetHierarchyTreeProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  const handleToggle = useCallback((tag: string) => {
    setExpandedMap(prev => ({ ...prev, [tag]: prev[tag] === false ? true : false }));
  }, []);

  // Build parent→children map + root list from (potentially searched) flat list
  const { roots, childrenMap } = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    // When searching, flatten matching nodes as roots (ignore hierarchy)
    if (q) {
      const matches = assets.filter(a =>
        a.equipmentTag.toLowerCase().includes(q) ||
        a.assetName.toLowerCase().includes(q) ||
        a.kksCode.toLowerCase().includes(q)
      );
      return { roots: matches, childrenMap: new Map<string, CmmsAssetRow[]>() };
    }

    // Full tree mode
    const tagSet = new Set(assets.map(a => a.equipmentTag));
    const map = new Map<string, CmmsAssetRow[]>();
    const rootNodes: CmmsAssetRow[] = [];

    assets.forEach(asset => {
      const parent = asset.parentTag;
      if (!parent || !tagSet.has(parent)) {
        rootNodes.push(asset);
      } else {
        const list = map.get(parent) ?? [];
        list.push(asset);
        map.set(parent, list);
      }
    });

    return { roots: rootNodes, childrenMap: map };
  }, [assets, searchTerm]);

  return (
    <div className="bg-[#0f1319] border border-slate-800 rounded-lg overflow-hidden flex flex-col" style={{ height: '640px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0d1117] border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold font-mono">Asset Hierarchy Tree</span>
          <span className="bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono">
            {searchTerm ? `${roots.length} 검색결과` : `Root ${roots.length}건`}
          </span>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
          <input
            type="text"
            id="cmms-tree-search"
            placeholder="Tag / Name / KKS 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#1a1f2b] border border-slate-700 text-slate-200 pl-7 pr-3 py-1 rounded text-xs focus:outline-none focus:border-cyan-500 w-52"
          />
        </div>
      </div>

      {/* Column labels */}
      <div className="flex items-center gap-2 px-4 py-1.5 bg-[#0d1117] border-b border-slate-800/60 text-[9px] uppercase tracking-widest text-slate-600 font-mono flex-shrink-0">
        <span className="w-3.5 mr-2" />
        <span className="min-w-[130px]">Equipment Tag</span>
        <span className="flex-1">Asset Name</span>
        <span className="hidden sm:block">KKS / Criticality</span>
      </div>

      {/* Scrollable tree body */}
      <div className="flex-1 overflow-y-auto" role="grid">
        {roots.length > 0 ? (
          roots.map(root => (
            <TreeNode
              key={root.equipmentTag}
              asset={root}
              depth={0}
              childrenMap={childrenMap}
              expandedMap={expandedMap}
              onToggle={handleToggle}
              onSelect={onSelectAsset}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 font-mono text-xs">
            <Search className="w-8 h-8 mb-2 opacity-30" />
            <p>검색 결과가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
