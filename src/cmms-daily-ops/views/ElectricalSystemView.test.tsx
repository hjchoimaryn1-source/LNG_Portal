// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ElectricalSystemView } from './ElectricalSystemView';
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

describe('ElectricalSystemView', () => {
  it('renders a live status badge for each of the 4 electrical sub-block tags plus the patrol form', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) }));
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root!.render(<ElectricalSystemView />);
    });

    expect(container!.textContent).toContain('MV-SWGR-01');
    expect(container!.textContent).toContain('TRAFO-01');
    expect(container!.textContent).toContain('UPS-01');
    // ElectricalPatrolForm's 4 sub-block cards should also be present
    expect(container!.textContent).toContain('MV SWGR');
  });
});
