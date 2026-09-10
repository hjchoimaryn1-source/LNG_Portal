// src/components/CmmsEquipmentRegistryView.tsx
//
// PURPOSE
//   CMMS 자산(assets 테이블 → cmms_asset_snapshot.json) 목록을 보여주는
//   신규 화면. useCmmsAssets()로 데이터를 가져오며, 기존 PortalDataContext
//   기반 화면들과 완전히 독립적이다 (Strangler Fig — 레거시 화면 무영향).
//
//   ⚠ 이름 주의: LNGPortalApp.tsx 안에 이미 하드코딩 9건짜리 "EquipmentRegistryView"
//   함수가 로컬로 정의되어 있어(레거시 Equipment & Asset 탭), 이름 충돌을 피하기
//   위해 컴포넌트명을 CmmsEquipmentRegistryView로 명명했다. 절대 EquipmentRegistryView로
//   되돌리지 말 것.

'use client';

import React, { useMemo, useState } from 'react';
import { Search, AlertTriangle, Loader2, LayoutGrid, Network } from 'lucide-react';
import { useCmmsAssets, type CmmsAssetRow } from '../context/CmmsAwarePortalProvider';
import { AdminCmmsResetButton } from './AdminCmmsResetButton';
import { CmmsAssetDetailModal } from './cmms/CmmsAssetDetailModal';
import { CmmsAssetHierarchyTree } from './cmms/CmmsAssetHierarchyTree';

// ----------------------------------------------------------------------------
// 스타일 헬퍼
// ----------------------------------------------------------------------------

const CRITICALITY_STYLES: Record<CmmsAssetRow['criticality'], string> = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-300',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  LOW: 'bg-slate-100 text-slate-700 border-slate-300',
};

const STATUS_STYLES: Record<CmmsAssetRow['status'], string> = {
  OPERATIONAL: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  MAINTENANCE: 'bg-blue-100 text-blue-800 border-blue-300',
  STANDBY: 'bg-slate-100 text-slate-700 border-slate-300',
  OUT_OF_SERVICE: 'bg-red-100 text-red-800 border-red-300',
};

const STATUS_LABEL_KO: Record<CmmsAssetRow['status'], string> = {
  OPERATIONAL: '운영중',
  MAINTENANCE: '정비중',
  STANDBY: '대기',
  OUT_OF_SERVICE: '가동중지',
};

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${className}`}>
      {children}
    </span>
  );
}

// ----------------------------------------------------------------------------
// 메인 컴포넌트
// ----------------------------------------------------------------------------

type CriticalityFilter = 'ALL' | CmmsAssetRow['criticality'];
type StatusFilter = 'ALL' | CmmsAssetRow['status'];
type ViewMode = 'grid' | 'tree';

export function CmmsEquipmentRegistryView() {
  const { cmmsAssetRows, cmmsAssetsLoading, cmmsAssetsError, cmmsSnapshotGeneratedAt, hasMockData, reloadCmmsAssets } =
    useCmmsAssets();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedAsset, setSelectedAsset] = useState<CmmsAssetRow | null>(null);
  const [searchText, setSearchText] = useState('');
  const [criticalityFilter, setCriticalityFilter] = useState<CriticalityFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const filteredRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return cmmsAssetRows.filter((row) => {
      if (criticalityFilter !== 'ALL' && row.criticality !== criticalityFilter) return false;
      if (statusFilter !== 'ALL' && row.status !== statusFilter) return false;
      if (q) {
        const haystack = `${row.equipmentTag} ${row.assetName} ${row.kksCode} ${row.locationArea}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [cmmsAssetRows, searchText, criticalityFilter, statusFilter]);

  if (cmmsAssetsLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        자산 데이터 로딩 중...
      </div>
    );
  }

  if (cmmsAssetsError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-600 gap-2">
        <AlertTriangle className="w-8 h-8" />
        <p className="font-medium">CMMS 자산 데이터를 불러오지 못했습니다.</p>
        <p className="text-sm text-slate-500">{cmmsAssetsError}</p>
        <button
          onClick={() => reloadCmmsAssets()}
          className="mt-2 px-3 py-1.5 text-sm bg-slate-800 text-white rounded hover:bg-slate-700"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Equipment Registry (CMMS)</h1>
            <p className="text-sm text-slate-500">
              총 {cmmsAssetRows.length}건
              {cmmsSnapshotGeneratedAt && (
                <span className="ml-2 text-slate-400">
                  (스냅샷 생성: {new Date(cmmsSnapshotGeneratedAt).toLocaleString('ko-KR')})
                </span>
              )}
            </p>
          </div>
          <AdminCmmsResetButton />
        </div>
        <div className="flex items-center gap-2">
          {hasMockData && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-300 rounded text-amber-800 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>일부 자산은 건설 완료 전 임시(Mock) 데이터입니다.</span>
            </div>
          )}
          {/* View mode toggle */}
          <div className="flex rounded border border-slate-200 overflow-hidden" role="group" aria-label="View mode">
            <button
              id="cmms-view-grid"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Grid View
            </button>
            <button
              id="cmms-view-tree"
              onClick={() => setViewMode('tree')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-l border-slate-200 transition-colors ${
                viewMode === 'tree'
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              Hierarchy Tree
            </button>
          </div>
        </div>
      </div>

      {/* Tree view */}
      {viewMode === 'tree' ? (
        <CmmsAssetHierarchyTree assets={cmmsAssetRows} onSelectAsset={setSelectedAsset} />
      ) : (
        <>
      {/* 검색/필터 바 */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="cmms-grid-search"
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="태그, 이름, KKS 코드, 위치로 검색..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
        <select
          value={criticalityFilter}
          onChange={(e) => setCriticalityFilter(e.target.value as CriticalityFilter)}
          className="px-3 py-2 border border-slate-300 rounded text-sm bg-white"
        >
          <option value="ALL">전체 중요도</option>
          <option value="CRITICAL">CRITICAL</option>
          <option value="HIGH">HIGH</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="LOW">LOW</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="px-3 py-2 border border-slate-300 rounded text-sm bg-white"
        >
          <option value="ALL">전체 상태</option>
          <option value="OPERATIONAL">운영중</option>
          <option value="MAINTENANCE">정비중</option>
          <option value="STANDBY">대기</option>
          <option value="OUT_OF_SERVICE">가동중지</option>
        </select>
      </div>

      {/* 테이블 */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600">Equipment Tag</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600">자산명</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600">KKS 코드</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600">위치</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600">중요도</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((row) => (
                <tr
                  key={row.equipmentTag}
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => setSelectedAsset(row)}
                >
                  <td className="px-4 py-2.5 font-mono text-slate-800">
                    {row.equipmentTag}
                    {row.isMockData && (
                      <span className="ml-2">
                        <Badge className="bg-amber-100 text-amber-700 border-amber-300">MOCK</Badge>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-slate-700">{row.assetName}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{row.kksCode}</td>
                  <td className="px-4 py-2.5 text-slate-600">{row.locationArea}</td>
                  <td className="px-4 py-2.5">
                    <Badge className={CRITICALITY_STYLES[row.criticality]}>{row.criticality}</Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge className={STATUS_STYLES[row.status]}>{STATUS_LABEL_KO[row.status]}</Badge>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    조건에 맞는 자산이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {/* Asset detail modal — renders above both views */}
      <CmmsAssetDetailModal asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
    </div>
  );
}
