// @vitest-environment jsdom
//
// Login gateway redesign (2026-09-19, HJ final spec) regression guard.
// Mirrors SidebarNav.test.tsx's manual createRoot/act mount pattern — no
// @testing-library/react in this repo.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import LoginGateway from './LoginGateway';
import type { LoginDirectoryEntry } from '../../lib/rbac/userSecurityLoginDirectoryDao';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// 실 seedStage1PersonnelAccounts.ts 결과에서 rafi(LOGISTIC)/jefi(HR)를 DISABLED로
// 전환(2026-09-19, 로스터 정정)하고 ADMIN을 드롭다운에서 제외(2026-09-19, 2차 —
// ADMIN은 HQ 관리 계정이라 "Sign in with another account" 수동 입력 경로로만
// 접근)한 뒤 남은 10건. UserDropdownSelect.tsx는 role_code 순서
// (STAGE1_ROLE_CODES) -> displayRank(NULL은 항상 뒤로) -> 그룹 내 fullName
// 알파벳순으로 재정렬하므로, 이 배열은 "컴포넌트가 실제로 렌더링해야 하는
// 최종 순서"로 이미 정렬해 둔다(MAINTENANCE: Agunawan < Indra Prabayugo
// 알파벳순 / OP_TEAM: Shadiq — Sr. OP Team Leader, displayRank=1 — 가
// Asman/Juli보다 항상 먼저, 2026-09-19 4차 지시).
const DIRECTORY: LoginDirectoryEntry[] = [
  { username: 'edi', roleCode: 'SITE_MANAGER', fullName: 'Edi Hermawan', displayRank: null },
  { username: 'shadiq', roleCode: 'OP_TEAM', fullName: 'Shadiq M. Shalih', displayRank: 1 },
  { username: 'asman', roleCode: 'OP_TEAM', fullName: 'Asman Sampeaman', displayRank: null },
  { username: 'juli', roleCode: 'OP_TEAM', fullName: 'Juli Surungan', displayRank: null },
  { username: 'arsyan', roleCode: 'HSSE', fullName: 'Arsyan AN', displayRank: null },
  { username: 'chandra', roleCode: 'HSSE', fullName: 'Chandra R.D', displayRank: null },
  { username: 'agunawan', roleCode: 'MAINTENANCE', fullName: 'Agunawan', displayRank: null },
  { username: 'indra', roleCode: 'MAINTENANCE', fullName: 'Indra Prabayugo', displayRank: null },
  { username: 'parulian', roleCode: 'LOGISTIC', fullName: 'Indra Parulian', displayRank: null },
  { username: 'albert', roleCode: 'HR', fullName: 'Albert A. Gea', displayRank: null },
];

let container: HTMLDivElement | null = null;
let root: Root | null = null;

function installFetchMock() {
  (globalThis as any).fetch = vi.fn((url: string, init?: RequestInit) => {
    if (url.includes('login-directory')) {
      return Promise.resolve({ json: () => Promise.resolve({ success: true, accounts: DIRECTORY }) });
    }
    if (url.includes('/user-security/login') && init?.method === 'POST') {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            roleCode: 'HR',
            employeeId: 'BSG259444',
            mustChangePassword: true,
            permissions: {},
          }),
      });
    }
    return Promise.resolve({ ok: false, json: () => Promise.resolve({ success: false, error: 'INVALID_CREDENTIALS' }) });
  });
}

async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(React.createElement(LoginGateway, {}));
  });
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function trigger(): HTMLButtonElement {
  return container!.querySelector('#login-user-field') as HTMLButtonElement;
}

function windowEl(): HTMLElement {
  return container!.querySelector('.window') as HTMLElement;
}

async function openDropdown() {
  await act(async () => {
    trigger().dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

async function pressKey(key: string) {
  await act(async () => {
    trigger().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  });
}

/** <style> 태그 내용(CSS 소스, 한글 주석 포함)은 화면에 렌더링되는 텍스트가
 * 아니므로 제외하고 실제 사용자에게 보이는 텍스트만 뽑아낸다. */
function visibleText(): string {
  const clone = container!.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('style, script').forEach((el) => el.remove());
  return clone.textContent ?? '';
}

// React가 인스턴스에 패치해둔 value setter를 통해 일반 대입(`el.value = x`)하면
// 내부 tracker가 "이미 이 값"으로 인식해 input 이벤트를 씹는다(널리 알려진 이슈) —
// 프로토타입의 원본 네이티브 setter를 직접 호출해 우회한다.
const NATIVE_INPUT_VALUE_SETTER = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
function setInputValue(el: HTMLInputElement, value: string) {
  NATIVE_INPUT_VALUE_SETTER.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

async function completeLoginToChangePasswordStep() {
  await openDropdown();
  const firstOption = container!.querySelector('[role="option"]') as HTMLElement;
  await act(async () => {
    firstOption.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  const passwordInput = container!.querySelector('#login-password-field') as HTMLInputElement;
  await act(async () => {
    setInputValue(passwordInput, 'Nias2026!');
  });
  const submitButton = container!.querySelector('button[type="submit"]') as HTMLButtonElement;
  expect(submitButton.disabled).toBe(false);
  await act(async () => {
    submitButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  await flush();
}

const KOREAN_RE = /[가-힣ᄀ-ᇿ㄰-㆏]/;

let scrollIntoViewSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  installFetchMock();
  // jsdom에는 scrollIntoView 자체가 없다(UserDropdownSelect.tsx는 존재 여부를
  // 확인 후 호출하도록 방어 처리했지만, 실제로 호출됐는지 검증하려면 여기서
  // 스텁을 심어야 한다) — 전 테스트에 균일하게 적용되도록 beforeEach에서 설치.
  scrollIntoViewSpy = vi.fn();
  window.HTMLElement.prototype.scrollIntoView = scrollIntoViewSpy;
});

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

describe('LoginGateway — dropdown picker redesign', () => {
  it('renders the dropdown disabled with the "Select user" placeholder until the directory resolves, never a loading-text element', async () => {
    let resolveDirectory!: () => void;
    const gate = new Promise<void>((resolve) => {
      resolveDirectory = resolve;
    });
    (globalThis as any).fetch = vi.fn((url: string) => {
      if (url.includes('login-directory')) {
        return gate.then(() => ({ json: () => Promise.resolve({ success: true, accounts: DIRECTORY }) }));
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({ success: false }) });
    });

    await mount();
    expect(trigger().disabled).toBe(true);
    expect(trigger().textContent).toContain('Select user');
    expect(/loading/i.test(visibleText())).toBe(false);

    await act(async () => {
      resolveDirectory();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(trigger().disabled).toBe(false);
    expect(/loading/i.test(visibleText())).toBe(false);
  });

  it('enables the dropdown once the directory resolves and lists exactly 10 options in the specified order, with ADMIN excluded', async () => {
    await mount();
    await flush();
    expect(trigger().disabled).toBe(false);

    await openDropdown();

    const options = Array.from(container!.querySelectorAll('[role="option"]'));
    expect(options).toHaveLength(10);
    const rendered = options.map((o) => ({
      role: o.querySelector('.role-part')?.textContent,
      name: o.querySelector('.name-part')?.textContent?.replace(/^\s*—\s*/, ''),
    }));
    expect(rendered).toEqual(DIRECTORY.map((d) => ({ role: d.roleCode.replace(/_/g, ' '), name: d.fullName })));
    expect(rendered.some((r) => r.role === 'ADMIN')).toBe(false);

    // HJ 지시(2026-09-19, 3차): 6그룹 순서를 DIRECTORY 픽스처 순서에 기대는 게
    // 아니라 조직 위계 문자열 그대로 하드코딩해 잠근다 — 이 배열 자체가
    // 우연히 잘못 정렬돼도(픽스처 실수) 걸러내기 위함.
    expect(rendered.map((r) => r.role)).toEqual([
      'SITE MANAGER',
      'OP TEAM',
      'OP TEAM',
      'OP TEAM',
      'HSSE',
      'HSSE',
      'MAINTENANCE',
      'MAINTENANCE',
      'LOGISTIC',
      'HR',
    ]);

    // HJ 지시(2026-09-19, 4차): OP_TEAM 그룹 안에서는 Shadiq(Sr. OP Team
    // Leader, displayRank=1)가 항상 맨 위 — DIRECTORY 픽스처가 아니라 이름을
    // 그대로 하드코딩해 잠근다.
    const opTeamNames = rendered.filter((r) => r.role === 'OP TEAM').map((r) => r.name);
    expect(opTeamNames).toEqual(['Shadiq M. Shalih', 'Asman Sampeaman', 'Juli Surungan']);
  });

  it('renders the open listbox as an absolute overlay outside any overflow:hidden ancestor, so the panel-clipping regression cannot silently return', async () => {
    // jsdom은 실제 페인트/클리핑을 수행하지 않으므로 "화면에서 잘리는지"는
    // 여기서 검증할 수 없다(반드시 실 브라우저에서 확인 필요) — 대신 클리핑을
    // 유발하는 CSS 선언(조상의 overflow:hidden) 자체가 되돌아오지 않도록
    // 계산된 스타일을 고정한다.
    await mount();
    await flush();
    await openDropdown();

    const listbox = container!.querySelector('.dropdown-listbox') as HTMLElement;
    expect(getComputedStyle(listbox).position).toBe('absolute');
    expect(Number(getComputedStyle(listbox).zIndex)).toBeGreaterThan(0);

    const loginStage = container!.querySelector('.login-stage') as HTMLElement;
    const windowBody = container!.querySelector('.window-body') as HTMLElement;
    expect(getComputedStyle(loginStage).overflow).not.toBe('hidden');
    expect(getComputedStyle(windowBody).overflow).not.toBe('hidden');
  });

  it('sizes the listbox tall enough for all 10 rows (ADMIN excluded) without needing an inner scrollbar, and scrolls the active row into view on keyboard nav as a fallback', async () => {
    // 행 높이(line-height 16px + padding 8px*2 = 32px) x 10 = 320px + 그룹
    // 경계 5곳(SITE_MANAGER/OP_TEAM/HSSE/MAINTENANCE/LOGISTIC/HR = 6그룹) x 1px
    // border = 325px — loginGatewayDropdownStyles.ts가 실제로 이 값 이상의
    // max-height를 선언하고 있는지 실측 CSS로 확인한다(추측 아님).
    const ROW_HEIGHT = 32;
    const ROW_COUNT = 10;
    const GROUP_BOUNDARIES = 5;
    const requiredContentHeight = ROW_HEIGHT * ROW_COUNT + GROUP_BOUNDARIES;
    expect(requiredContentHeight).toBe(325);

    await mount();
    await flush();
    await openDropdown();

    const listbox = container!.querySelector('.dropdown-listbox') as HTMLElement;
    const declaredMaxHeight = parseInt(getComputedStyle(listbox).maxHeight, 10);
    expect(declaredMaxHeight).toBeGreaterThanOrEqual(requiredContentHeight);
    expect(getComputedStyle(listbox).overflowY).toBe('auto');

    const rows = container!.querySelectorAll('[role="option"]');
    expect(rows).toHaveLength(10);

    // 스크롤 폴백 동작: activeIndex가 바뀌면 해당 행에 scrollIntoView가 호출된다.
    scrollIntoViewSpy.mockClear();
    await pressKey('ArrowDown');
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({ block: 'nearest' });
  });

  it('keeps the panel at exactly 1000x600 before/after the directory loads, with the dropdown open, and after switching to CHANGE_PASSWORD', async () => {
    await mount();
    expect(getComputedStyle(windowEl()).width).toBe('1000px');
    expect(getComputedStyle(windowEl()).height).toBe('600px');

    await flush();
    expect(getComputedStyle(windowEl()).width).toBe('1000px');
    expect(getComputedStyle(windowEl()).height).toBe('600px');

    await openDropdown();
    expect(getComputedStyle(windowEl()).width).toBe('1000px');
    expect(getComputedStyle(windowEl()).height).toBe('600px');
    await pressKey('Escape');

    // "Sign in with another account" 폴백도 같은 1000x600 안에서 슬롯만 바뀐다.
    const fallbackLink = Array.from(container!.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Sign in with another account')
    ) as HTMLButtonElement;
    await act(async () => {
      fallbackLink.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    const fallbackInput = container!.querySelector('#login-user-field') as HTMLInputElement;
    expect(fallbackInput.tagName).toBe('INPUT');
    expect(getComputedStyle(windowEl()).width).toBe('1000px');
    expect(getComputedStyle(windowEl()).height).toBe('600px');

    // HJ 지시(2026-09-19, 5차): 별도 안내 줄 대신 placeholder 안에 admin 힌트를
    // 넣는다("admin" 리터럴 값 자체는 노출하지 않는다).
    expect(fallbackInput.placeholder).toBe('Username (Admin sign-in)');

    // 드롭다운 모드로 되돌려서(완주에는 [role="option"] 클릭이 필요) 계속 진행.
    const backLink = Array.from(container!.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Back to account list')
    ) as HTMLButtonElement;
    await act(async () => {
      backLink.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await completeLoginToChangePasswordStep();
    expect(visibleText()).toContain('Password change required');
    expect(getComputedStyle(windowEl()).width).toBe('1000px');
    expect(getComputedStyle(windowEl()).height).toBe('600px');
  });

  it('reports the logo frame\'s declared rendered size (150px, up from the earlier 110px baseline)', async () => {
    await mount();
    await flush();
    const logo = container!.querySelector('.company-logo') as HTMLElement;
    expect(getComputedStyle(logo).height).toBe('150px');
  });

  it('supports ArrowDown keyboard navigation and Enter selection, moving focus to the password field', async () => {
    await mount();
    await flush();

    // 첫 ArrowDown은 열면서 activeIndex를 0(edi, ADMIN 제외 후 첫 항목)에
    // seed한다(네이티브 select 관례). 이후 ArrowDown 2회로
    // edi(0)->shadiq(1, displayRank=1로 OP_TEAM 최상단)->asman(2)로 이동.
    await pressKey('ArrowDown');
    await pressKey('ArrowDown');
    await pressKey('ArrowDown');
    await pressKey('Enter');

    expect(trigger().textContent).toContain('Asman Sampeaman');
    expect(document.activeElement).toBe(container!.querySelector('#login-password-field'));
  });

  it('Escape closes the listbox without selecting', async () => {
    await mount();
    await flush();
    await pressKey('ArrowDown');
    expect(container!.querySelector('[role="listbox"]')).not.toBeNull();
    await pressKey('Escape');
    expect(container!.querySelector('[role="listbox"]')).toBeNull();
    expect(trigger().textContent).toContain('Select user');
  });

  it('type-ahead jumps to the first OP TEAM entry on "op" (Shadiq, displayRank=1, ahead of Asman/Juli)', async () => {
    await mount();
    await flush();
    await pressKey('o');
    await pressKey('p');
    const active = container!.querySelector('.dropdown-option.active');
    expect(active?.querySelector('.name-part')?.textContent).toContain('Shadiq M. Shalih');
  });

  it('renders no Korean characters anywhere on the login screen, in any step', async () => {
    await mount();
    expect(KOREAN_RE.test(visibleText())).toBe(false);

    await flush();
    expect(KOREAN_RE.test(visibleText())).toBe(false);

    await openDropdown();
    expect(KOREAN_RE.test(visibleText())).toBe(false);
    await pressKey('Escape');

    await completeLoginToChangePasswordStep();
    expect(visibleText()).toContain('Password change required');
    expect(KOREAN_RE.test(visibleText())).toBe(false);
  });
});

describe('page.tsx — server-side login directory prefetch', () => {
  // node:sqlite를 정적 import하는 체인(getUserSecurityDb)을 끌고 오는 모듈이라
  // vitest의 vite-node 리졸버로 직접 import할 수 없다(userSecuritySessionCore.ts
  // 헤더 주석과 동일한 제약). export 여부는 소스 텍스트로 검증한다.
  it('declares force-dynamic so the directory is never statically cached at build time', () => {
    const source = readFileSync(join(__dirname, '../../app/page.tsx'), 'utf8');
    expect(source).toMatch(/export const dynamic = ['"]force-dynamic['"]/);
  });
});
