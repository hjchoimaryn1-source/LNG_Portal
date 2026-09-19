// @vitest-environment jsdom
//
// Regression guard for the hydration mismatch fixed 2026-09-19: WatermarkOverlay
// used to seed its clock from `new Date().toLocaleString()` inside useState's
// initializer, so the server-rendered HTML and the client's first render
// carried different (and Korean-locale, "오후/오전") timestamp text. This test
// reproduces the real SSR -> hydrateRoot flow (not just createRoot) and asserts
// React itself reports no hydration mismatch — the same signal "no hydration
// warning in the dev console" maps to.

import { describe, it, expect, afterEach, vi } from 'vitest';
// renderToString (NOT renderToStaticMarkup — that strips the hydration
// markers/comment boundaries between adjacent text children entirely, which
// produces a FALSE-POSITIVE mismatch here since it's not meant to be hydrated).
import { renderToString } from 'react-dom/server';
import { createRoot, hydrateRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import React from 'react';
import { WatermarkOverlay } from './WatermarkOverlay';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

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

describe('WatermarkOverlay — SSR/hydration parity', () => {
  it('hydrates the exact server-rendered HTML without React logging a hydration mismatch', async () => {
    const serverHtml = renderToString(React.createElement(WatermarkOverlay, { ip: '203.0.113.5' }));
    expect(serverHtml).toContain('203.0.113.5');

    container = document.createElement('div');
    container.innerHTML = serverHtml;
    document.body.appendChild(container);

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await act(async () => {
      root = hydrateRoot(container!, React.createElement(WatermarkOverlay, { ip: '203.0.113.5' }));
    });

    const hydrationErrors = errorSpy.mock.calls.filter(
      (args) => typeof args[0] === 'string' && /hydrat/i.test(args[0])
    );
    expect(hydrationErrors).toEqual([]);
  });

  it('populates a fixed, locale-independent English timestamp after mount (no Korean 오전/오후, no toLocaleString drift)', async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
      root!.render(React.createElement(WatermarkOverlay, { ip: '203.0.113.5' }));
    });

    const text = container.querySelector('[data-testid="field-guard-watermark"] span')?.textContent ?? '';
    expect(text).toMatch(/^203\.0\.113\.5 · \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    expect(/[가-힣]/.test(text)).toBe(false);
  });
});
