// src/components/AdminCmmsResetButton.tsx
//
// PURPOSE
//   "사무실 총괄담당 관리자 전용" DB Reset & Re-sync 버튼.
//   확인 모달 → POST /api/v1/cmms/bootstrap → 성공 시 reloadCmmsAssets()로
//   화면의 127건 자산 데이터를 자동 갱신한다.
//
//   ⚠ 이 컴포넌트 자체는 권한 체크를 하지 않는다. 실제 배치할 때는
//   관리자 화면(예: 설정 탭, 사이드바 관리자 섹션)에만 렌더링되도록
//   상위에서 조건부 렌더링하거나, 이 프로젝트의 인증 컨텍스트로 감싸야 한다.

'use client';

import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useCmmsAssets } from '../context/CmmsAwarePortalProvider';

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
        await reloadCmmsAssets(); // 화면 자산 데이터 자동 갱신
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
      <button
        onClick={() => setState('confirming')}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded hover:bg-red-100"
      >
        <RotateCcw className="w-4 h-4" />
        DB Reset & Re-sync
      </button>

      {/* 확인 모달 */}
      {state === 'confirming' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-800">CMMS 데이터베이스를 초기화하시겠습니까?</h3>
                <p className="text-sm text-slate-500 mt-1">
                  기존 승격 이력과 검토 상태가 모두 삭제되고, ISO Tank/고정설비 데이터가 처음부터
                  다시 적재·자동승격됩니다. 이 작업은 되돌릴 수 없습니다.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setState('idle')}
                className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded"
              >
                취소
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded font-medium"
              >
                초기화 진행
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 실행 중 */}
      {state === 'running' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm text-slate-600">파이프라인 실행 중... (수 초 소요)</p>
          </div>
        </div>
      )}

      {/* 성공 결과 */}
      {state === 'success' && resultSummary?.result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-800">초기화 및 재동기화 완료</h3>
                <ul className="text-sm text-slate-600 mt-2 space-y-1">
                  <li>총 자산: {resultSummary.result.snapshotTotalCount}건</li>
                  <li>Mock 데이터: {resultSummary.result.snapshotMockCount}건</li>
                  <li>승격 성공: {resultSummary.result.promotedCount}건</li>
                  {resultSummary.result.promoteFailedCount > 0 && (
                    <li className="text-red-600">승격 실패: {resultSummary.result.promoteFailedCount}건</li>
                  )}
                </ul>
              </div>
            </div>
            <div className="flex justify-end mt-5">
              <button
                onClick={() => setState('idle')}
                className="px-3 py-1.5 text-sm text-white bg-slate-800 hover:bg-slate-700 rounded"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 에러 */}
      {state === 'error' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5">
            <div className="flex items-start gap-3">
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-800">실행 실패</h3>
                <p className="text-sm text-slate-500 mt-1">{resultSummary?.error ?? '알 수 없는 오류'}</p>
              </div>
            </div>
            <div className="flex justify-end mt-5">
              <button
                onClick={() => setState('idle')}
                className="px-3 py-1.5 text-sm text-white bg-slate-800 hover:bg-slate-700 rounded"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
