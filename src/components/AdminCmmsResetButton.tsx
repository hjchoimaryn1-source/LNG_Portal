// src/components/AdminCmmsResetButton.tsx
//
// PURPOSE
//   "사무실 총괄담당 관리자 전용" DB Reset & Re-sync 버튼.
//   확인 모달 → POST /api/v1/cmms/bootstrap → 성공 시 reloadCmmsAssets()로
//   화면의 자산 데이터를 자동 갱신한다. Win98 베벨 스타일로 통일.
//
//   ⚠ 이 컴포넌트 자체는 권한 체크를 하지 않는다 (API 쪽에서 NODE_ENV 체크).

'use client';

import React, { useState } from 'react';
import { useCmmsAssets } from '../context/CmmsAwarePortalProvider';
import { BEVEL_BUTTON, RAISED_PANEL, TITLE_BAR } from './cmms/scadaStyles';

interface BootstrapApiResult {
  success: boolean;
  result?: {
    snapshotTotalCount: number;
    snapshotMockCount: number;
    promotedCount: number;
    promoteFailedCount: number;
    completedAt: string;
  };
  error?: string;
}

type RunState = 'idle' | 'confirming' | 'running' | 'success' | 'error';

function DialogFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`${RAISED_PANEL} shadow-2xl w-full max-w-md`}>
        <div className={TITLE_BAR}>{title}</div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function AdminCmmsResetButton() {
  const { reloadCmmsAssets } = useCmmsAssets();
  const [state, setState] = useState<RunState>('idle');
  const [resultSummary, setResultSummary] = useState<BootstrapApiResult | null>(null);

  const handleReset = async () => {
    setState('running');
    try {
      const res = await fetch('/api/v1/cmms/bootstrap', { method: 'POST' });
      const data: BootstrapApiResult = await res.json();
      setResultSummary(data);

      if (data.success) {
        setState('success');
        await reloadCmmsAssets();
      } else {
        setState('error');
      }
    } catch (err) {
      setResultSummary({ success: false, error: err instanceof Error ? err.message : String(err) });
      setState('error');
    }
  };

  return (
    <>
      <button onClick={() => setState('confirming')} className={BEVEL_BUTTON}>
        ⟲ DB RESET &amp; RE-SYNC
      </button>

      {state === 'confirming' && (
        <DialogFrame title="⚠ CONFIRM — DATABASE RESET">
          <p className="text-[12px] text-slate-800 font-mono leading-relaxed">
            CMMS 데이터베이스를 초기화하시겠습니까?
          </p>
          <p className="text-[11px] text-slate-600 font-mono mt-2 leading-relaxed">
            기존 승격 이력과 검토 상태가 모두 삭제되고, ISO Tank/고정설비 데이터가 처음부터
            다시 적재·자동승격됩니다. 이 작업은 되돌릴 수 없습니다.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setState('idle')} className={BEVEL_BUTTON}>
              취소
            </button>
            <button onClick={handleReset} className={`${BEVEL_BUTTON} text-red-800`}>
              초기화 진행
            </button>
          </div>
        </DialogFrame>
      )}

      {state === 'running' && (
        <DialogFrame title="PROCESSING...">
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-6 h-6 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
            <p className="text-[11px] text-slate-600 font-mono">파이프라인 실행 중... (수 초 소요)</p>
          </div>
        </DialogFrame>
      )}

      {state === 'success' && resultSummary?.result && (
        <DialogFrame title="✓ SYNC COMPLETE">
          <div className={`${'bg-white border-2 border-t-[#707070] border-l-[#707070] border-r-white border-b-white'} p-2 font-mono text-[12px]`}>
            <div className="grid grid-cols-2 gap-y-1">
              <span className="text-slate-500">TOTAL ASSETS</span>
              <span className="text-slate-900 font-bold">{resultSummary.result.snapshotTotalCount}</span>
              <span className="text-slate-500">MOCK DATA</span>
              <span className="text-slate-900">{resultSummary.result.snapshotMockCount}</span>
              <span className="text-slate-500">PROMOTED OK</span>
              <span className="text-emerald-700 font-bold">{resultSummary.result.promotedCount}</span>
              {resultSummary.result.promoteFailedCount > 0 && (
                <>
                  <span className="text-slate-500">PROMOTED FAIL</span>
                  <span className="text-red-700 font-bold">{resultSummary.result.promoteFailedCount}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={() => setState('idle')} className={BEVEL_BUTTON}>
              확인
            </button>
          </div>
        </DialogFrame>
      )}

      {state === 'error' && (
        <DialogFrame title="✕ EXECUTION FAILED">
          <p className="text-[12px] text-red-700 font-mono">{resultSummary?.error ?? '알 수 없는 오류'}</p>
          <div className="flex justify-end mt-4">
            <button onClick={() => setState('idle')} className={BEVEL_BUTTON}>
              닫기
            </button>
          </div>
        </DialogFrame>
      )}
    </>
  );
}
