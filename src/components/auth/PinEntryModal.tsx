// src/components/auth/PinEntryModal.tsx
// Standalone PIN-entry modal for LoginGateway.tsx's Quick-Login flow
// (AGENTS.md §3: modals must be standalone files, never inline JSX).
"use client";

import React, { useState } from 'react';
import type { UserAccountSeedRow } from '../../lib/rbac/userAccountsSeed';
import { PIN_ENTRY_MODAL_STYLES } from './pinEntryModalStyles';

interface PinEntryModalProps {
  account: UserAccountSeedRow;
  onSubmit: (pin: string) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  errorMessage?: string;
}

const PIN_LENGTH = 4;

export default function PinEntryModal({ account, onSubmit, onCancel, isSubmitting, errorMessage }: PinEntryModalProps) {
  const [pin, setPin] = useState('');

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH);
    setPin(digitsOnly);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== PIN_LENGTH || isSubmitting) return;
    onSubmit(pin);
  };

  return (
    <div className="pin-modal-overlay" role="dialog" aria-modal="true" aria-label="PIN 입력">
      <style>{PIN_ENTRY_MODAL_STYLES}</style>
      <form className="pin-modal-panel" onSubmit={handleSubmit}>
        <div className="pin-modal-title">&gt;_ PIN 입력 필요</div>
        <div className="pin-modal-subtitle">
          {account.displayName} ({account.userId})
        </div>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          className="pin-modal-input"
          value={pin}
          onChange={handlePinChange}
          placeholder="••••"
          maxLength={PIN_LENGTH}
          disabled={isSubmitting}
        />
        {errorMessage && <div className="pin-modal-error">{errorMessage}</div>}
        <div className="pin-modal-actions">
          <button type="button" className="pin-modal-button" onClick={onCancel} disabled={isSubmitting}>
            취소
          </button>
          <button
            type="submit"
            className="pin-modal-button pin-modal-button-primary"
            disabled={pin.length !== PIN_LENGTH || isSubmitting}
          >
            {isSubmitting ? '확인 중...' : '확인'}
          </button>
        </div>
      </form>
    </div>
  );
}
