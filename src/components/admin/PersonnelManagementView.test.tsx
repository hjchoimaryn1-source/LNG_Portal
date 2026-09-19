// @vitest-environment jsdom
// src/components/admin/PersonnelManagementView.test.tsx
// HJ 지시(2026-09-19): 인력 관리 화면의 "인력/계정" / "감사 로그" 탭과 같은 줄
// 우측 상단에 대시보드로 돌아가는 링크를 추가 — /admin/personnel이 메인 SPA
// (activeKey 상태머신) 밖의 독립 App Router 경로라 브라우저 뒤로가기 외엔
// 돌아갈 방법이 없었다.

import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import React from 'react';
import PersonnelManagementView from './PersonnelManagementView';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

function installFetchMock(authenticated: boolean, roleCode?: string) {
  (globalThis as any).fetch = vi.fn((url: string) => {
    if (url.includes('/user-security/session')) {
      return Promise.resolve({ json: () => Promise.resolve(authenticated ? { authenticated: true, roleCode, employeeId: 'E-1' } : { authenticated: false }) });
    }
    if (url.includes('/user-security/personnel')) {
      return Promise.resolve({ json: () => Promise.resolve({ success: true, records: [] }) });
    }
    if (url.includes('/user-security/accounts')) {
      return Promise.resolve({ json: () => Promise.resolve({ success: true, records: [] }) });
    }
    if (url.includes('/user-security/audit-log')) {
      return Promise.resolve({ json: () => Promise.resolve({ success: true, records: [] }) });
    }
    return Promise.resolve({ json: () => Promise.resolve({ success: false }) });
  });
}

async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(React.createElement(PersonnelManagementView));
  });
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

afterEach(() => {
  if (root && container) {
    act(() => {
      root!.unmount();
    });
    container.remove();
  }
  container = null;
  root = null;
  vi.restoreAllMocks();
});

describe('PersonnelManagementView — dashboard return link', () => {
  it('renders a "대시보드로 돌아가기" link to "/" alongside the 인력/계정 · 감사 로그 tabs for an ADMIN session', async () => {
    installFetchMock(true, 'ADMIN');
    await mount();
    await flush();

    const link = Array.from(container!.querySelectorAll('a')).find((a) => a.textContent?.includes('대시보드로 돌아가기'));
    expect(link?.getAttribute('href')).toBe('/');

    // 같은 줄(부모)에 두 탭 버튼도 같이 있어야 한다.
    const text = container!.textContent ?? '';
    expect(text).toContain('인력 / 계정');
    expect(text).toContain('감사 로그');
  });

  it('does not render the tabs or the dashboard link for a non-ADMIN/unauthenticated session', async () => {
    installFetchMock(false);
    await mount();
    await flush();

    expect(container!.querySelector('a')).toBeNull();
    expect(container!.textContent ?? '').toContain('접근 권한이 없습니다');
  });
});
