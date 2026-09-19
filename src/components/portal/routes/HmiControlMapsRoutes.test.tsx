// @vitest-environment jsdom
//
// HMI CONTROL MAPS 섹터 이전 회귀 가드 — DAILY_OPS_LIVE_PID_MAP / DAILY_OPS_HMI_OVERVIEW가
// LngProcessRoutes.tsx에서 HmiControlMapsRoutes.tsx로 이전된 뒤에도 각자 올바른 컴포넌트를
// 렌더링하는지 확인한다(구 LngProcessRoutes.test.tsx의 Sub-stage C 회귀 가드를 대체).

import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { __resetDailyOpsPatrolStoreForTests } from '../../../cmms-daily-ops/state/useDailyOpsPatrolStore';
import { DailyOpsDataProvider } from '../../../context/DailyOpsDataContext';
import type { SubProcessKey } from '../../../types/lng';

const { default: HmiControlMapsRoutes } = await import('./HmiControlMapsRoutes');

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

function stubFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true, records: [], status: {} }),
      } as Response)
    )
  );
}

async function mount(activeKey: SubProcessKey) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(
      <DailyOpsDataProvider>
        <HmiControlMapsRoutes activeKey={activeKey} />
      </DailyOpsDataProvider>
    );
    await Promise.resolve();
    await Promise.resolve();
  });
}

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

describe('HmiControlMapsRoutes — HMI CONTROL MAPS 섹터', () => {
  it('renders HmiOverviewContainer when active, not PIDOverlayView', async () => {
    stubFetch();
    await mount('DAILY_OPS_HMI_OVERVIEW');
    const text = container!.textContent ?? '';
    expect(text).toContain('HMI OVERVIEW');
    expect(text).not.toContain('P&ID LIVE OVERLAY');
  });

  it('regression guard: DAILY_OPS_LIVE_PID_MAP still renders PIDOverlayView unchanged', async () => {
    stubFetch();
    await mount('DAILY_OPS_LIVE_PID_MAP');
    const text = container!.textContent ?? '';
    expect(text).toContain('P&ID LIVE OVERLAY');
    expect(text).not.toContain('HMI OVERVIEW');
  });

  it('renders Metering placeholder for HMI_METERING_MAP', async () => {
    await mount('HMI_METERING_MAP');
    expect(container!.textContent ?? '').toContain('Metering HMI Map');
  });

  it('renders Buffering placeholder for HMI_BUFFERING_MAP', async () => {
    await mount('HMI_BUFFERING_MAP');
    expect(container!.textContent ?? '').toContain('Buffering HMI Map');
  });

  it('renders Vapor placeholder for HMI_VAPOR_MAP', async () => {
    await mount('HMI_VAPOR_MAP');
    expect(container!.textContent ?? '').toContain('Vapor HMI Map');
  });
});
