// src/components/inventory/modals/StockAdjustmentModal.tsx
//
// PURPOSE
//   부품 입출고/조정 입력 폼. WorkOrderDetailModal.tsx와 동일한 Win98 베벨
//   스타일(scadaStyles.ts)을 재사용한다. 재고 쓰기는 이 파일이 직접 하지
//   않고 useMroInventory().adjustStock()에 위임한다.

'use client';

import React, { useEffect, useState } from 'react';
import type { MroPartRecord, StockTxType } from '../../../adapters/db/mroInventoryDao';
import { BEVEL_BUTTON, BEVEL_ICON_BUTTON, RAISED_PANEL, SUNKEN_INPUT, TITLE_BAR } from '../../cmms/scadaStyles';
import GuardrailBlockedBanner from '../../shared/GuardrailBlockedBanner';

const TX_TYPE_LABEL_KO: Record<StockTxType, string> = {
  RECEIPT: '입고 (RECEIPT)',
  ISSUE: '출고 (ISSUE)',
  ADJUSTMENT: '재고 조정 (ADJUSTMENT)',
  RETURN: '반납 (RETURN)',
  SCRAP: '폐기 (SCRAP)',
};

interface StockAdjustmentModalProps {
  part: MroPartRecord | null;
  onClose: () => void;
  onSubmit: (input: { txType: StockTxType; quantity: number; reason?: string; performedBy: string }) => Promise<{ success: boolean; error?: string }>;
}

export default function StockAdjustmentModal({ part, onClose, onSubmit }: StockAdjustmentModalProps) {
  const [txType, setTxType] = useState<StockTxType>('RECEIPT');
  const [quantity, setQuantity] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [performedBy, setPerformedBy] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setTxType('RECEIPT');
    setQuantity('');
    setReason('');
    setPerformedBy('');
    setFormError(null);
  }, [part]);

  useEffect(() => {
    if (!part) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [part, onClose]);

  if (!part) return null;

  const parsedQuantity = Number(quantity);
  const isValid = Number.isFinite(parsedQuantity) && parsedQuantity > 0 && performedBy.trim().length > 0;

  async function handleSubmit() {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setFormError(null);
    const result = await onSubmit({ txType, quantity: parsedQuantity, reason: reason.trim() || undefined, performedBy: performedBy.trim() });
    setSubmitting(false);
    if (result.success) {
      onClose();
    } else {
      setFormError(result.error ?? '조정 처리에 실패했습니다.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className={`${RAISED_PANEL} shadow-2xl w-full max-w-md`} onClick={(e) => e.stopPropagation()}>
        <div className={`flex items-center justify-between ${TITLE_BAR}`}>
          <span>STOCK ADJUSTMENT — {part.partNo}</span>
          <button onClick={onClose} aria-label="모달 닫기" className={`${BEVEL_ICON_BUTTON} w-5 h-5`}>
            ✕
          </button>
        </div>

        <GuardrailBlockedBanner message={formError} />

        <div className="p-3 space-y-2.5">
          <div className="text-[12px] text-slate-700">
            <span className="font-semibold">{part.partName}</span>{' '}
            <span className="text-slate-500">
              (현재 재고: {part.currentStockQty} {part.uom})
            </span>
          </div>

          <label className="block text-[11px] font-semibold text-slate-600">
            구분
            <select value={txType} onChange={(e) => setTxType(e.target.value as StockTxType)} className={`${SUNKEN_INPUT} w-full mt-0.5`}>
              {(Object.keys(TX_TYPE_LABEL_KO) as StockTxType[]).map((type) => (
                <option key={type} value={type}>
                  {TX_TYPE_LABEL_KO[type]}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-[11px] font-semibold text-slate-600">
            수량 ({part.uom})
            <input
              type="number"
              min="0"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={`${SUNKEN_INPUT} w-full mt-0.5`}
              placeholder="0"
            />
          </label>

          <label className="block text-[11px] font-semibold text-slate-600">
            처리자
            <input
              type="text"
              value={performedBy}
              onChange={(e) => setPerformedBy(e.target.value)}
              className={`${SUNKEN_INPUT} w-full mt-0.5`}
              placeholder="사번 또는 이름"
            />
          </label>

          <label className="block text-[11px] font-semibold text-slate-600">
            사유 (선택)
            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} className={`${SUNKEN_INPUT} w-full mt-0.5`} placeholder="예: WO-2031 정비 소요" />
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className={BEVEL_BUTTON}>
              취소
            </button>
            <button onClick={handleSubmit} disabled={!isValid || submitting} className={BEVEL_BUTTON}>
              {submitting ? '처리 중...' : '확인'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
