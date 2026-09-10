// src/components/cmms/CmmsAssetHierarchyTree.tsx
//
// PURPOSE
//   평면(flat) CmmsAssetRow[] 배열을 parentTag 필드 기반으로
//   부모-자식 트리로 렌더링한다. 검색(Tag/Name/KKS) + 노드 개별 expand/collapse.
//   WIN_TAB_INACTIVE와 통일된 Win98 베벨 스타일.

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { type CmmsAssetRow } from '../../context/CmmsAwarePortalProvider';
import { SUNKEN_PANEL, SUNKEN_INPUT, TITLE_BAR, BEVEL_ICON_BUTTON, CRITICALITY_DOT } from './scadaStyles';

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
        style={{ paddingLeft: `${depth * 18 + 6}px` }}
        className="flex items-center gap-1.5 py-1 pr-3 border-b border-slate-100 cursor-pointer hover:bg-blue-50 font-mono text-[12px]"
      >
        {hasChildren ? (
          <button
            type="button"
            aria-label={isExpanded ? '접기' : '펼치기'}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(asset.equipmentTag);
            }}
            className={`${BEVEL_ICON_BUTTON} w-4 h-4 flex-shrink-0`}
          >
            {isExpanded ? '−' : '+'}
          </button>
        ) : (
          <span className="w-4 h-4 flex-shrink-0" />
        )}

        <span className={`w-2 h-2 flex-shrink-0 ${CRITICALITY_DOT[asset.criticality]}`} />
        <span className="font-bold text-slate-800 min-w-[110px]">{asset.equipmentTag}</span>
        <span className="flex-1 text-slate-600 truncate">{asset.assetName}</span>

        {asset.kksCode && (
          <span className="hidden sm:inline-block bg-amber-50 border border-amber-400 text-amber-700 text-[10px] px-1 flex-shrink-0">
            {asset.kksCode}
          </span>
        )}
        <span
          className={`flex-shrink-0 px-1 text-[9px] font-bold border ${
            asset.status === 'OUT_OF_SERVICE'
              ? 'text-red-700 border-red-600 bg-red-50'
              : asset.status === 'OPERATIONAL'
                ? 'text-emerald-700 border-emerald-600 bg-emerald-50'
                : 'text-slate-600 border-slate-400 bg-slate-50'
          }`}
        >
          {asset.status}
        </span>
        {asset.isMockData && (
          <span className="flex-shrink-0 px-1 text-[9px] font-bold text-amber-800 bg-amber-100 border border-amber-600">
            MOCK
          </span>
        )}
      </div>

      {hasChildren &&
        isExpanded &&
        children.map((child) => (
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

interface CmmsAssetHierarchyTreeProps {
  assets: CmmsAssetRow[];
  onSelectAsset: (asset: CmmsAssetRow) => void;
}

export function CmmsAssetHierarchyTree({ assets, onSelectAsset }: CmmsAssetHierarchyTreeProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  const handleToggle = useCallback((tag: string) => {
    setExpandedMap((prev) => ({ ...prev, [tag]: prev[tag] === false ? true : false }));
  }, []);

  const { roots, childrenMap } = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    if (q) {
      const matches = assets.filter(
        (a) =>
          a.equipmentTag.toLowerCase().includes(q) ||
          a.assetName.toLowerCase().includes(q) ||
          a.kksCode.toLowerCase().includes(q)
      );
      return { roots: matches, childrenMap: new Map<string, CmmsAssetRow[]>() };
    }

    const tagSet = new Set(assets.map((a) => a.equipmentTag));
    const map = new Map<string, CmmsAssetRow[]>();
    const rootNodes: CmmsAssetRow[] = [];

    assets.forEach((asset) => {
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
    <div className={SUNKEN_PANEL}>
      <div className={`flex items-center justify-between ${TITLE_BAR}`}>
        <span>PLANT MASTER ASSET HIERARCHY</span>
        <span className="text-[10px] font-normal opacity-80">
          {searchTerm ? `${roots.length}건 검색결과` : `ROOT ${roots.length}건`}
        </span>
      </div>

      <div className="p-2 bg-slate-50 border-b border-slate-300">
        <input
          type="text"
          placeholder="TAG / NAME / KKS 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`${SUNKEN_INPUT} w-64`}
        />
      </div>

      <div className="max-h-[560px] overflow-y-auto bg-white">
        {roots.length > 0 ? (
          roots.map((root) => (
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
          <div className="px-4 py-8 text-center text-slate-400 text-[12px] font-mono">검색 결과가 없습니다.</div>
        )}
      </div>
    </div>
  );
}
