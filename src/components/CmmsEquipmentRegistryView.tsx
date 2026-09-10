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
//
//   스타일: WIN_TAB_INACTIVE와 통일된 Win98 베벨 스타일 (scadaStyles.ts 공용 토큰 사용).

'use client';

import React, { useMemo, useState } from 'react';
import { useCmmsAssets, type CmmsAssetRow } from '../context/CmmsAwarePortalProvider';
import { AdminCmmsResetButton } from './AdminCmmsResetButton';
import { CmmsAssetDetailModal } from './cmms/CmmsAssetDetailModal';
import { CmmsAssetHierarchyTree } from './cmms/CmmsAssetHierarchyTree';
import {
  BEVEL_BUTTON,
  BEVEL_BUTTON_PRESSED,
  SUNKEN_PANEL,
  SUNKEN_INPUT,
  TITLE_BAR,
  CRITICALITY_BADGE,
  STATUS_BADGE,
  STATUS_LABEL_KO,
} from './cmms/scadaStyles';

type CriticalityFilter = 'ALL' | CmmsAssetRow['criticality'];
type StatusFilter = 'ALL' | CmmsAssetRow['status'];
type ViewMode = 'grid' | 'tree';

/** 정보 바(타이틀바 바로 아래, 튀어나온 느낌) — RAISED_PANEL의 위쪽 테두리 없는 변형 */
const RAISED_PANEL_INLINE = 'bg-[#ece9e2] border-2 border-t-0 border-l-white border-r-[#505050] border-b-[#505050]';

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
      <div className="flex items-center justify-center h-64 text-slate-500 font-mono text-[12px]">
        <div className="w-4 h-4 mr-2 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
        LOADING ASSET DATA...
      </div>
    );
  }

  if (cmmsAssetsError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-700 gap-2 font-mono">
        <p className="font-bold text-[13px]">⚠ CMMS 자산 데이터를 불러오지 못했습니다.</p>
        <p className="text-[11px] text-slate-500">{cmmsAssetsError}</p>
        <button onClick={() => reloadCmmsAssets()} className={`${BEVEL_BUTTON} mt-2`}>
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="p-3">
      {/* 헤더 타이틀바 */}
      <div className={`flex items-center justify-between ${TITLE_BAR} mb-0`}>
        <span>EQUIPMENT & ASSET REGISTRY — PLANT MASTER ASSET HIERARCHY (NIAS CMMS)</span>
      </div>

      {/* 정보 바 + 관리자 버튼 + 뷰 토글 */}
      <div className={`${RAISED_PANEL_INLINE} flex flex-col md:flex-row md:items-center justify-between gap-2 px-3 py-2`}>
        <div className="text-[11px] font-mono text-slate-600">
          총 <span className="font-bold text-slate-900">{cmmsAssetRows.length}</span>건
          {cmmsSnapshotGeneratedAt && (
            <span className="ml-2 text-slate-400">
              (스냅샷 생성: {new Date(cmmsSnapshotGeneratedAt).toLocaleString('ko-KR')})
            </span>
          )}
          {hasMockData && <span className="ml-3 text-amber-700 font-bold">⚠ 일부 자산은 임시(Mock) 데이터입니다.</span>}
        </div>
        <div className="flex items-center gap-2">
          <AdminCmmsResetButton />
          <div className="flex">
            <button
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? BEVEL_BUTTON_PRESSED : BEVEL_BUTTON}
            >
              GRID VIEW
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`${viewMode === 'tree' ? BEVEL_BUTTON_PRESSED : BEVEL_BUTTON} ml-1`}
            >
              HIERARCHY TREE
            </button>
          </div>
        </div>
      </div>

      <div className="h-2" />

      {viewMode === 'tree' ? (
        <CmmsAssetHierarchyTree assets={cmmsAssetRows} onSelectAsset={setSelectedAsset} />
      ) : (
        <>
          {/* 검색/필터 바 */}
          <div className="flex flex-col sm:flex-row gap-2 mb-2">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="태그, 이름, KKS 코드, 위치로 검색..."
              className={`${SUNKEN_INPUT} flex-1`}
            />
            <select
              value={criticalityFilter}
              onChange={(e) => setCriticalityFilter(e.target.value as CriticalityFilter)}
              className={SUNKEN_INPUT}
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
              className={SUNKEN_INPUT}
            >
              <option value="ALL">전체 상태</option>
              <option value="OPERATIONAL">운영중</option>
              <option value="MAINTENANCE">정비중</option>
              <option value="STANDBY">대기</option>
              <option value="OUT_OF_SERVICE">가동중지</option>
            </select>
          </div>

          {/* 테이블 (SCADA 고밀도 스타일) */}
          <div className={SUNKEN_PANEL}>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] font-mono border-collapse">
                <thead>
                  <tr className="bg-slate-200 border-b-2 border-slate-400">
                    <th className="text-left px-2 py-1.5 font-bold text-slate-700 border-r border-slate-300">
                      EQUIPMENT TAG
                    </th>
                    <th className="text-left px-2 py-1.5 font-bold text-slate-700 border-r border-slate-300">
                      자산명
                    </th>
                    <th className="text-left px-2 py-1.5 font-bold text-slate-700 border-r border-slate-300">
                      KKS 코드
                    </th>
                    <th className="text-left px-2 py-1.5 font-bold text-slate-700 border-r border-slate-300">
                      위치
                    </th>
                    <th className="text-left px-2 py-1.5 font-bold text-slate-700 border-r border-slate-300">
                      중요도
                    </th>
                    <th className="text-left px-2 py-1.5 font-bold text-slate-700">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, idx) => (
                    <tr
                      key={row.equipmentTag}
                      onClick={() => setSelectedAsset(row)}
                      className={`cursor-pointer hover:bg-blue-50 border-b border-slate-200 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                      }`}
                    >
                      <td className="px-2 py-1 font-bold text-slate-800 border-r border-slate-200">
                        {row.equipmentTag}
                        {row.isMockData && (
                          <span className="ml-1.5 px-1 text-[9px] font-bold text-amber-800 bg-amber-100 border border-amber-600">
                            MOCK
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1 text-slate-700 border-r border-slate-200">{row.assetName}</td>
                      <td className="px-2 py-1 text-slate-500 border-r border-slate-200">{row.kksCode}</td>
                      <td className="px-2 py-1 text-slate-600 border-r border-slate-200">{row.locationArea}</td>
                      <td className="px-2 py-1 border-r border-slate-200">
                        <span className={`px-1.5 py-0.5 text-[10px] font-bold border ${CRITICALITY_BADGE[row.criticality]}`}>
                          {row.criticality}
                        </span>
                      </td>
                      <td className="px-2 py-1">
                        <span className={`px-1.5 py-0.5 text-[10px] font-bold border ${STATUS_BADGE[row.status]}`}>
                          {STATUS_LABEL_KO[row.status]}
                        </span>
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

      <CmmsAssetDetailModal asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
    </div>
  );
}

