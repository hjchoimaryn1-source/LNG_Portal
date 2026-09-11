// src/components/auth/QuickLoginAccountCard.tsx
// TASK 2: LoginGateway.tsx의 Quick-Login 계정 카드 — 단일 표현(presentational) 컴포넌트.
"use client";

import React from 'react';
import type { UserAccountSeedRow } from '../../lib/rbac/userAccountsSeed';

interface QuickLoginAccountCardProps {
  account: UserAccountSeedRow;
  disabled?: boolean;
  onSelect: (account: UserAccountSeedRow) => void;
}

export default function QuickLoginAccountCard({ account, disabled, onSelect }: QuickLoginAccountCardProps) {
  return (
    <button
      type="button"
      className="quick-login-card"
      disabled={disabled}
      onClick={() => onSelect(account)}
    >
      <span className="quick-login-card-identity">
        <span className="quick-login-card-name">{account.displayName}</span>
        <span className="quick-login-card-role">{account.homeLocation} · {account.userId}</span>
      </span>
      <span className="quick-login-card-badge">{account.roleCode}</span>
    </button>
  );
}
