// src/components/auth/UserDropdownSelect.tsx
// Login gateway redesign (2026-09-19, HJ final spec — supersedes the rejected
// card-grid layout): custom combobox/listbox — native <select> cannot style
// two-tone option text ([ROLE CODE] bold + " — Full Name" muted). Follows the
// ARIA 1.2 "combobox with listbox popup, aria-activedescendant" pattern: focus
// stays on the trigger button at all times, the active option is tracked in
// state and announced via aria-activedescendant rather than moving DOM focus
// into <li> elements — avoids focus-management complexity while still
// supporting full keyboard control (Up/Down/Enter/Esc/type-ahead).
"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Stage1RoleCode } from '../../lib/rbac/userSecurityRolePermissionSeed';
import { STAGE1_ROLE_CODES } from '../../lib/rbac/userSecurityRolePermissionSeed';
import { SUNKEN_INPUT } from '../cmms/scadaStyles';

export interface DirectoryAccount {
  username: string;
  roleCode: Stage1RoleCode;
  fullName: string;
  displayRank: number | null;
}

interface UserDropdownSelectProps {
  id: string;
  options: DirectoryAccount[];
  value: string;
  onSelect: (username: string) => void;
  isLoading: boolean;
}

function formatRoleLabel(roleCode: Stage1RoleCode): string {
  return roleCode.replace(/_/g, ' ');
}

const TYPEAHEAD_RESET_MS = 700;

export default function UserDropdownSelect({ id, options, value, onSelect, isLoading }: UserDropdownSelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const typeaheadRef = useRef({ buffer: '', timer: undefined as ReturnType<typeof setTimeout> | undefined });

  const flatOptions = useMemo(() => {
    const roleOrder = new Map(STAGE1_ROLE_CODES.map((r, i) => [r, i]));
    // userSecurityLoginDirectoryDao.ts의 ORDER BY와 동일한 규칙(역할군 ->
    // display_rank, NULL은 항상 뒤로 -> fullName)을 클라이언트에서도 그대로
    // 재현한다 — 서버가 이미 이 순서로 내려줘도 이 컴포넌트가 항상 재정렬하므로
    // 두 쪽이 어긋나면 화면 순서가 조용히 틀어진다(4차 지시와 동일한 이유).
    const sorted = [...options].sort((a, b) => {
      const ra = roleOrder.get(a.roleCode) ?? STAGE1_ROLE_CODES.length;
      const rb = roleOrder.get(b.roleCode) ?? STAGE1_ROLE_CODES.length;
      if (ra !== rb) return ra - rb;
      const rankA = a.displayRank ?? Number.POSITIVE_INFINITY;
      const rankB = b.displayRank ?? Number.POSITIVE_INFINITY;
      if (rankA !== rankB) return rankA - rankB;
      return a.fullName.localeCompare(b.fullName);
    });
    return sorted.map((o, i) => ({ ...o, groupStart: i > 0 && sorted[i - 1].roleCode !== o.roleCode }));
  }, [options]);

  const selected = flatOptions.find((o) => o.username === value) ?? null;
  const listboxId = `${id}-listbox`;
  const optionId = (i: number) => `${id}-option-${i}`;

  useEffect(() => {
    if (!open) return;
    function handleDocMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleDocMouseDown);
    return () => document.removeEventListener('mousedown', handleDocMouseDown);
  }, [open]);

  // 키보드(↑/↓/타입어헤드)로 activeIndex가 바뀔 때, 목록이 max-height를 넘어
  // 스크롤 중이어도 하이라이트된 행이 항상 보이는 범위 안에 들어오게 한다
  // (마우스 휠 스크롤 자체는 overflow-y:auto의 네이티브 동작이라 별도 처리 불필요).
  useEffect(() => {
    if (!open) return;
    const activeEl = document.getElementById(optionId(activeIndex));
    // 일부 환경(jsdom 등)은 scrollIntoView 자체가 없다 — 방어적으로 존재 확인.
    if (typeof activeEl?.scrollIntoView === 'function') {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeIndex]);

  function runTypeahead(char: string) {
    const state = typeaheadRef.current;
    clearTimeout(state.timer);
    state.buffer += char.toLowerCase();
    const match = flatOptions.findIndex((o) =>
      (formatRoleLabel(o.roleCode) + ' ' + o.fullName).toLowerCase().startsWith(state.buffer)
    );
    if (match >= 0) setActiveIndex(match);
    state.timer = setTimeout(() => {
      state.buffer = '';
    }, TYPEAHEAD_RESET_MS);
  }

  function commitSelection(i: number) {
    const opt = flatOptions[i];
    if (!opt) return;
    onSelect(opt.username);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (isLoading) return;

    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const startIndex = value ? flatOptions.findIndex((o) => o.username === value) : 0;
        setActiveIndex(startIndex >= 0 ? startIndex : 0);
        setOpen(true);
        return;
      }
      if (e.key.length === 1 && /[a-z0-9]/i.test(e.key)) {
        e.preventDefault();
        setOpen(true);
        runTypeahead(e.key);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, flatOptions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        commitSelection(activeIndex);
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        break;
      default:
        if (e.key.length === 1 && /[a-z0-9]/i.test(e.key)) {
          e.preventDefault();
          runTypeahead(e.key);
        }
    }
  }

  return (
    <div className="dropdown-wrap" ref={rootRef}>
      <button
        type="button"
        id={id}
        role="combobox"
        aria-label="User"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={open ? optionId(activeIndex) : undefined}
        disabled={isLoading}
        className={`${SUNKEN_INPUT} w-full dropdown-trigger`}
        onClick={() => {
          if (isLoading) return;
          if (!open) {
            const startIndex = value ? flatOptions.findIndex((o) => o.username === value) : 0;
            setActiveIndex(startIndex >= 0 ? startIndex : 0);
          }
          setOpen((o) => !o);
        }}
        onKeyDown={handleKeyDown}
      >
        {selected ? (
          <span>
            <span className="role-part">{formatRoleLabel(selected.roleCode)}</span>
            <span className="name-part"> &mdash; {selected.fullName}</span>
          </span>
        ) : (
          <span className="dropdown-placeholder">Select user</span>
        )}
        <span className="dropdown-caret" aria-hidden="true">&#9662;</span>
      </button>

      {open && !isLoading && (
        <ul id={listboxId} role="listbox" aria-label="User" className="dropdown-listbox">
          {flatOptions.map((opt, i) => (
            <li
              key={opt.username}
              id={optionId(i)}
              role="option"
              aria-selected={opt.username === value}
              className={`dropdown-option${i === activeIndex ? ' active' : ''}${opt.groupStart ? ' group-start' : ''}`}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => commitSelection(i)}
            >
              <span className="role-part">{formatRoleLabel(opt.roleCode)}</span>
              <span className="name-part"> &mdash; {opt.fullName}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
