// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { PIDOverlayView } from './PIDOverlayView';
import { __resetDailyOpsPatrolStoreForTests } from '../state/useDailyOpsPatrolStore';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  container = null;
  root = null;
  __resetDailyOpsPatrolStoreForTests();
  vi.unstubAllGlobals();
});

function stubFetch(coordinates: Array<{ tagId: string; x: number; y: number; calibrated: boolean }>) {
  const postCalls: unknown[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        postCalls.push(JSON.parse(init.body as string));
        return Promise.resolve({ ok: true, json: async () => ({ success: true }) } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => ({ success: true, records: coordinates }) } as Response);
    })
  );
  return postCalls;
}

async function mountAndFlush() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(<PIDOverlayView />);
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('PIDOverlayView', () => {
  it('renders only calibrated badges, silently omitting calibrated=false rows', async () => {
    stubFetch([
      { tagId: 'AAV-102', x: 100, y: 200, calibrated: true },
      { tagId: 'AAV-103', x: 150, y: 250, calibrated: false },
    ]);
    await mountAndFlush();

    const svgText = container!.querySelector('svg')!.textContent ?? '';
    expect(svgText).toContain('AAV-102');
    expect(svgText).not.toContain('AAV-103');
  });

  it('opens the calibration picker with only uncalibrated candidates on canvas click in calibrate mode', async () => {
    stubFetch([{ tagId: 'AAV-102', x: 100, y: 200, calibrated: true }]);
    await mountAndFlush();

    const calibrateButton = Array.from(container!.querySelectorAll('button')).find(
      (b) => b.textContent === 'Calibrate Tags'
    )!;
    act(() => {
      calibrateButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const svg = container!.querySelector('svg')!;
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1316, height: 924 }) as DOMRect;
    act(() => {
      svg.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 100, clientY: 100 }));
    });

    const pickerText = container!.textContent ?? '';
    expect(pickerText).toContain('AAV-103');
    expect(pickerText).toContain('AAV-105');
    expect(pickerText).toContain('AAV-106');
    expect(pickerText).not.toContain('보정할 태그 없음');
  });

  it('saves the picked tag coordinate and renders its badge immediately', async () => {
    const postCalls = stubFetch([]);
    await mountAndFlush();

    const calibrateButton = Array.from(container!.querySelectorAll('button')).find(
      (b) => b.textContent === 'Calibrate Tags'
    )!;
    act(() => {
      calibrateButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const svg = container!.querySelector('svg')!;
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1316, height: 924 }) as DOMRect;
    act(() => {
      svg.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 200, clientY: 300 }));
    });

    const tagButton = Array.from(container!.querySelectorAll('button')).find((b) => b.textContent === 'AAV-102')!;
    await act(async () => {
      tagButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    expect(postCalls).toHaveLength(1);
    expect(postCalls[0]).toMatchObject({ tagId: 'AAV-102', calibrated: true });
    expect(container!.querySelector('svg')!.textContent).toContain('AAV-102');
  });
});
