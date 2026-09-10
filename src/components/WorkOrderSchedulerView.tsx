// src/components/WorkOrderSchedulerView.tsx
//
// PURPOSE
//   PM(Preventive Maintenance) Scheduler 뼈대(Scaffold) 화면.
//   실제 PM 스케줄 백엔드가 아직 없어, useCmmsAssets()로 받아온 실 자산 목록을
//   기준으로 "다음 PM 예정일"을 결정론적 규칙(criticality 기반 주기)으로
//   mock 생성해 보여준다. LNGPortalApp.tsx의 WORK_ORDER_DIRECTORY 탭에서
//   "PM Scheduler [SCAFFOLD PREVIEW]" 토글로만 노출된다.
//
//   ⚠ SCAFFOLD: 날짜 계산/정렬/필터 로직은 아직 mock이며, 실제 PM 이력
//   테이블이 준비되면 buildMockPmSchedule()만 실 데이터 연동으로 교체하면 된다.

'use client';

import React, { useMemo, useState } from 'react';
import { useCmmsAssets, type CmmsAssetRow } from '../context/CmmsAwarePortalProvider';
import {
  SUNKEN_PANEL,
  SUNKEN_INPUT,
  TITLE_BAR,
  CRITICALITY_BADGE,
} from './cmms/scadaStyles';

type PmStatus = 'OVERDUE' | 'DUE_SOON' | 'SCHEDULED';

interface MockPmScheduleRow {
  asset: CmmsAssetRow;
  nextDueDate: Date;
  intervalDays: number;
  pmStatus: PmStatus;
}

/** criticality가 높을수록 PM 주기를 짧게 잡는 단순 mock 규칙 */
const INTERVAL_DAYS_BY_CRITICALITY: Record<CmmsAssetRow['criticality'], number> = {
  CRITICAL: 30,
  HIGH: 60,
  MEDIUM: 90,
  LOW: 180,
};

const PM_STATUS_BADGE: Record<PmStatus, string> = {
  OVERDUE: 'text-red-700 bg-red-50 border-red-700',
  DUE_SOON: 'text-amber-700 bg-amber-50 border-amber-700',
  SCHEDULED: 'text-emerald-800 bg-emerald-50 border-emerald-700',
};

const PM_STATUS_LABEL_KO: Record<PmStatus, string> = {
  OVERDUE: '기한 초과',
  DUE_SOON: '임박',
  SCHEDULED: '예정',
};

/** equipmentTag 문자열 해시 → 0~intervalDays 범위의 결정론적 오프셋(일) */
function mockOffsetDays(tag: string, intervalDays: number): number {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) % 100000;
  }
  return hash % intervalDays;
}

function buildMockPmSchedule(assets: CmmsAssetRow[], now: Date): MockPmScheduleRow[] {
  return assets.map((asset) => {
    const intervalDays = INTERVAL_DAYS_BY_CRITICALITY[asset.criticality];
    const offset = mockOffsetDays(asset.equipmentTag, intervalDays);
    const nextDueDate = new Date(now.getTime() + (offset - intervalDays / 2) * 24 * 60 * 60 * 1000);
    const daysUntilDue = Math.round((nextDueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    const pmStatus: PmStatus = daysUntilDue < 0 ? 'OVERDUE' : daysUntilDue <= 14 ? 'DUE_SOON' : 'SCHEDULED';
    return { asset, nextDueDate, intervalDays, pmStatus };
  });
}

export function WorkOrderSchedulerView() {
  const { cmmsAssetRows, cmmsAssetsLoading, cmmsAssetsError, hasMockData } = useCmmsAssets();
  const [statusFilter, setStatusFilter] = useState<'ALL' | PmStatus>('ALL');
  const [searchText, setSearchText] = useState('');

  const scheduleRows = useMemo(() => {
    const now = new Date();
    const rows = buildMockPmSchedule(cmmsAssetRows, now);
    return rows.sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime());
  }, [cmmsAssetRows]);

  const filteredRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return scheduleRows.filter((row) => {
      if (statusFilter !== 'ALL' && row.pmStatus !== statusFilter) return false;
      if (q && !`${row.asset.equipmentTag} ${row.asset.assetName}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [scheduleRows, statusFilter, searchText]);

  if (cmmsAssetsLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 font-mono text-[12px]">
        <div className="w-4 h-4 mr-2 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
        LOADING PM SCHEDULE...
      </div>
    );
  }

  if (cmmsAssetsError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-700 gap-2 font-mono">
        <p className="font-bold text-[13px]">⚠ 자산 데이터를 불러오지 못해 PM 스케줄을 생성할 수 없습니다.</p>
        <p className="text-[11px] text-slate-500">{cmmsAssetsError}</p>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className={`flex items-center justify-between ${TITLE_BAR} mb-0`}>
        <span>PM SCHEDULER — SCAFFOLD PREVIEW (MOCK 주기 규칙 기반)</span>
      </div>

      <div className="bg-amber-50 border border-amber-400 text-amber-800 text-[11px] font-mono px-3 py-1.5 mt-1">
        ⚠ 이 화면은 뼈대(Scaffold)입니다. 자산 목록은 실제 CMMS 스냅샷을 사용하지만, PM 예정일/주기는
        criticality 기반 mock 규칙으로 계산됩니다. 실제 PM 이력 데이터 연동 전까지 참고용으로만 사용하세요.
        {hasMockData && ' (자산 데이터 자체에도 일부 Mock이 포함되어 있습니다.)'}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 my-2">
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="태그, 자산명으로 검색..."
          className={`${SUNKEN_INPUT} flex-1`}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'ALL' | PmStatus)}
          className={SUNKEN_INPUT}
        >
          <option value="ALL">전체 상태</option>
          <option value="OVERDUE">기한 초과</option>
          <option value="DUE_SOON">임박</option>
          <option value="SCHEDULED">예정</option>
        </select>
      </div>

      <div className={SUNKEN_PANEL}>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] font-mono border-collapse">
            <thead>
              <tr className="bg-slate-200 border-b-2 border-slate-400">
                <th className="text-left px-2 py-1.5 font-bold text-slate-700 border-r border-slate-300">EQUIPMENT TAG</th>
                <th className="text-left px-2 py-1.5 font-bold text-slate-700 border-r border-slate-300">자산명</th>
                <th className="text-left px-2 py-1.5 font-bold text-slate-700 border-r border-slate-300">중요도</th>
                <th className="text-left px-2 py-1.5 font-bold text-slate-700 border-r border-slate-300">PM 주기(일)</th>
                <th className="text-left px-2 py-1.5 font-bold text-slate-700 border-r border-slate-300">다음 PM 예정일</th>
                <th className="text-left px-2 py-1.5 font-bold text-slate-700">상태</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, idx) => (
                <tr
                  key={row.asset.equipmentTag}
                  className={`border-b border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                >
                  <td className="px-2 py-1 font-bold text-slate-800 border-r border-slate-200">{row.asset.equipmentTag}</td>
                  <td className="px-2 py-1 text-slate-700 border-r border-slate-200">{row.asset.assetName}</td>
                  <td className="px-2 py-1 border-r border-slate-200">
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold border ${CRITICALITY_BADGE[row.asset.criticality]}`}>
                      {row.asset.criticality}
                    </span>
                  </td>
                  <td className="px-2 py-1 text-slate-600 border-r border-slate-200">{row.intervalDays}</td>
                  <td className="px-2 py-1 text-slate-600 border-r border-slate-200">
                    {row.nextDueDate.toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-2 py-1">
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold border ${PM_STATUS_BADGE[row.pmStatus]}`}>
                      {PM_STATUS_LABEL_KO[row.pmStatus]}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    조건에 맞는 PM 예정 항목이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
