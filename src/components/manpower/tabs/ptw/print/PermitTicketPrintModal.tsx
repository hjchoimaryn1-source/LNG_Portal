// src/components/manpower/tabs/ptw/print/PermitTicketPrintModal.tsx
//
// PURPOSE
//   PermitTicketPrintView(A4 레이아웃)를 화면 미리보기로 띄우고, [PRINT] 버튼이
//   window.print()를 호출하도록 배선한다. 인쇄 시에는 `.ptw-print-sheet`
//   요소만 보이도록 하는 "print-isolation" CSS를 <style>로 내장한다 — 별도
//   라이브러리 없이 브라우저 인쇄 대화상자를 그대로 PDF 저장 경로로 쓴다
//   (Chrome/Edge "다른 이름으로 저장" > PDF).

'use client';

import React, { useEffect, useMemo } from 'react';
import { PTWPermit } from '../../../../../types/lng';
import { evaluateSimopsDryRun } from '../../../../../hooks/useSIMOPSCheck';
import PermitTicketPrintView from './PermitTicketPrintView';

export interface PermitTicketPrintModalProps {
  permit: PTWPermit | null;
  allPermits: PTWPermit[];
  onClose: () => void;
}

export default function PermitTicketPrintModal({ permit, allPermits, onClose }: PermitTicketPrintModalProps) {
  useEffect(() => {
    if (!permit) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [permit, onClose]);

  const simopsRisk = useMemo(() => {
    if (!permit) return null;
    const otherActivePermits = allPermits.filter((p) => p.id !== permit.id);
    return evaluateSimopsDryRun(permit.type, permit.workArea || '', permit.equipmentTag || '', otherActivePermits);
  }, [permit, allPermits]);

  if (!permit) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 overflow-y-auto py-6 print:bg-white print:p-0">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .ptw-print-sheet, .ptw-print-sheet * { visibility: visible; }
          .ptw-print-sheet { position: absolute; top: 0; left: 0; }
          @page { size: A4; margin: 10mm; }
        }
      `}</style>

      <div className="no-print flex justify-center gap-2 mb-4 print:hidden">
        <button
          onClick={onClose}
          className="px-4 py-1.5 text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white cursor-pointer"
        >
          CLOSE (ESC)
        </button>
        <button
          onClick={() => window.print()}
          className="px-4 py-1.5 text-xs font-bold bg-blue-700 hover:bg-blue-600 text-white cursor-pointer"
        >
          PRINT / EXPORT PDF
        </button>
      </div>

      <div className="ptw-print-sheet shadow-2xl">
        <PermitTicketPrintView permit={permit} simopsRisk={simopsRisk} />
      </div>
    </div>
  );
}
