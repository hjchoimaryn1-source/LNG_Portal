// src/components/cmms/CmmsAssetDetailModal.tsx
//
// PURPOSE
//   자산 상세 팝업 모달. WIN_TAB_INACTIVE와 통일된 Win98 베벨 스타일.
//   Grid View / Tree View 양쪽에서 공용 사용.

'use client';

import React, { useEffect } from 'react';
import { type CmmsAssetRow } from '../../context/CmmsAwarePortalProvider';
import {
  BEVEL_BUTTON,
  BEVEL_ICON_BUTTON,
  RAISED_PANEL,
  SUNKEN_PANEL,
  TITLE_BAR,
  CRITICALITY_LABEL,
  CRITICALITY_BADGE,
  STATUS_BADGE,
  STATUS_LABEL_KO,
} from './scadaStyles';

function DataField({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[130px_1fr] border-b border-slate-300 last:border-b-0">
      <div className="bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 border-r border-slate-300 uppercase tracking-wide">
        {label}
      </div>
      <div className={`px-2.5 py-1.5 text-[12px] text-slate-800 ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}

interface CmmsAssetDetailModalProps {
  asset: CmmsAssetRow | null;
  onClose: () => void;
}

export function CmmsAssetDetailModal({ asset, onClose }: CmmsAssetDetailModalProps) {
  useEffect(() => {
    if (!asset) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [asset, onClose]);

  if (!asset) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className={`${RAISED_PANEL} shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 타이틀바 */}
        <div className={`flex items-center justify-between ${TITLE_BAR}`}>
          <span>ASSET DETAIL — {asset.equipmentTag}</span>
          <button onClick={onClose} aria-label="모달 닫기" className={`${BEVEL_ICON_BUTTON} w-5 h-5`}>
            ✕
          </button>
        </div>

        <div className="p-3">
          {/* 자산명 + 배지 */}
          <div className={`${SUNKEN_PANEL} px-3 py-2 mb-3`}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-bold text-slate-900">{asset.equipmentTag}</span>
              {asset.isMockData && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-600">
                  MOCK DATA
                </span>
              )}
            </div>
            <div className="text-[12px] text-slate-600 mt-0.5">{asset.assetName}</div>
          </div>

          {/* 배지 요약 */}
          <div className="flex gap-2 mb-3">
            <span className={`px-2 py-1 text-[11px] font-bold border ${CRITICALITY_BADGE[asset.criticality]}`}>
              {CRITICALITY_LABEL[asset.criticality]}
            </span>
            <span className={`px-2 py-1 text-[11px] font-bold border ${STATUS_BADGE[asset.status]}`}>
              {STATUS_LABEL_KO[asset.status]} ({asset.status})
            </span>
          </div>

          {/* 데이터 필드 */}
          <div className={SUNKEN_PANEL}>
            <DataField label="KKS CODE" value={asset.kksCode} mono />
            <DataField label="ISO 14224" value={asset.isoClass} />
            <DataField label="LOCATION" value={asset.locationArea} />
            <DataField label="MANUFACTURER" value={asset.manufacturer ?? '— NOT CONFIRMED —'} />
            <DataField
              label="PARENT TAG"
              value={asset.parentTag ?? '— TOP LEVEL / NO HIERARCHY —'}
              mono={!!asset.parentTag}
            />
          </div>

          {/* 확장 예정 섹션 */}
          <div className="mt-3 px-2.5 py-2 bg-slate-100 border border-slate-300 text-[10px] text-slate-500 font-mono">
            ⚠ MAINTENANCE HISTORY / PM SCHEDULE / SIMOPS — TO BE LINKED VIA e-PTW MODULE
          </div>

          <div className="flex justify-end mt-3">
            <button onClick={onClose} className={BEVEL_BUTTON}>
              확인 (ESC)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
