// src/components/cmms/CmmsAssetDetailModal.tsx
//
// PURPOSE
//   자산 상세 팝업 모달. CmmsAssetRow 타입의 단일 자산을 받아 모든 필드를
//   다크 인더스트리얼 테마로 출력한다. Grid View / Tree View 양쪽에서 공용 사용.
//
// RULES
//   - 250줄 이하 유지 (현재 약 130줄)
//   - CmmsAssetRow 타입 직접 의존 — any 금지

'use client';

import React, { useEffect } from 'react';
import { X, Tag, Cpu, MapPin, AlertTriangle, Activity, Hash } from 'lucide-react';
import { type CmmsAssetRow } from '../../context/CmmsAwarePortalProvider';

// ---------------------------------------------------------------------------
// 스타일 헬퍼
// ---------------------------------------------------------------------------

const CRIT_STYLES: Record<CmmsAssetRow['criticality'], { badge: string; bar: string }> = {
  CRITICAL: { badge: 'bg-red-950 text-red-400 border-red-800',   bar: 'bg-red-500' },
  HIGH:     { badge: 'bg-orange-950 text-orange-400 border-orange-800', bar: 'bg-orange-400' },
  MEDIUM:   { badge: 'bg-amber-950 text-amber-400 border-amber-800',   bar: 'bg-amber-400' },
  LOW:      { badge: 'bg-slate-800 text-slate-400 border-slate-700',    bar: 'bg-slate-500' },
};

const STATUS_STYLES: Record<CmmsAssetRow['status'], string> = {
  OPERATIONAL:    'bg-emerald-950 text-emerald-400 border-emerald-800',
  MAINTENANCE:    'bg-blue-950 text-blue-400 border-blue-800',
  STANDBY:        'bg-slate-800 text-slate-400 border-slate-700',
  OUT_OF_SERVICE: 'bg-red-950 text-red-400 border-red-800',
};

const STATUS_LABEL_KO: Record<CmmsAssetRow['status'], string> = {
  OPERATIONAL:    '운영중',
  MAINTENANCE:    '정비중',
  STANDBY:        '대기',
  OUT_OF_SERVICE: '가동중지',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FieldRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-800/60 last:border-0">
      <span className="mt-0.5 text-slate-500 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <span className="block text-[10px] uppercase tracking-widest text-slate-500 mb-0.5">{label}</span>
        <span className="block text-sm text-slate-200 font-mono break-all">{value ?? <em className="text-slate-600 not-italic">—</em>}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CmmsAssetDetailModal
// ---------------------------------------------------------------------------

interface CmmsAssetDetailModalProps {
  asset: CmmsAssetRow | null;
  onClose: () => void;
}

export function CmmsAssetDetailModal({ asset, onClose }: CmmsAssetDetailModalProps) {
  // ESC key to close
  useEffect(() => {
    if (!asset) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [asset, onClose]);

  if (!asset) return null;

  const crit = CRIT_STYLES[asset.criticality];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-[#12161e] border border-cyan-500/30 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden text-slate-200 font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent bar */}
        <div className={`h-1 w-full ${crit.bar}`} />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0d1117] border-b border-slate-800">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-semibold mb-0.5">
              Asset Specification — CMMS
            </p>
            <h2 className="text-base font-bold text-white leading-tight">{asset.assetName}</h2>
          </div>
          <button
            id="cmms-asset-modal-close"
            onClick={onClose}
            aria-label="모달 닫기"
            className="text-slate-500 hover:text-white hover:bg-slate-800 rounded p-1.5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto space-y-1">
          <FieldRow icon={<Tag className="w-3.5 h-3.5" />}      label="Equipment Tag"  value={<span className="text-cyan-300 font-bold">{asset.equipmentTag}</span>} />
          <FieldRow icon={<Hash className="w-3.5 h-3.5" />}     label="KKS Code"       value={<span className="text-amber-300">{asset.kksCode}</span>} />
          <FieldRow icon={<Cpu className="w-3.5 h-3.5" />}      label="ISO Class"      value={asset.isoClass} />
          <FieldRow icon={<Tag className="w-3.5 h-3.5" />}      label="Parent Tag"     value={asset.parentTag ?? <em className="text-slate-600 not-italic">Root (없음)</em>} />
          <FieldRow icon={<MapPin className="w-3.5 h-3.5" />}   label="Location / Area" value={asset.locationArea} />
          <FieldRow
            icon={<AlertTriangle className="w-3.5 h-3.5" />}
            label="Criticality"
            value={
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${crit.badge}`}>
                {asset.criticality}
              </span>
            }
          />
          <FieldRow
            icon={<Activity className="w-3.5 h-3.5" />}
            label="Status"
            value={
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${STATUS_STYLES[asset.status]}`}>
                {STATUS_LABEL_KO[asset.status]} ({asset.status})
              </span>
            }
          />
          {asset.manufacturer && (
            <FieldRow icon={<Cpu className="w-3.5 h-3.5" />} label="Manufacturer" value={asset.manufacturer} />
          )}
          {asset.isMockData && (
            <div className="mt-3 px-3 py-2 bg-amber-950/50 border border-amber-700/50 rounded text-amber-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              이 자산 레코드는 임시(Mock) 데이터입니다. 확정 데이터로 추후 교체됩니다.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#0d1117] border-t border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold px-5 py-1.5 rounded text-xs transition-colors"
          >
            확인 (ESC)
          </button>
        </div>
      </div>
    </div>
  );
}
