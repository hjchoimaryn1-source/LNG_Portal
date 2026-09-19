// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ElectricalPatrolForm } from './ElectricalPatrolForm';

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
});

function mount(onSave: (input: unknown) => void) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root!.render(<ElectricalPatrolForm onSave={onSave} />);
  });
}

describe('ElectricalPatrolForm', () => {
  it('renders 4 sub-blocks: MV SWGR, LV SWGR, TRAFO, UPS', () => {
    mount(() => {});
    expect(container!.textContent).toContain('MV SWGR');
    expect(container!.textContent).toContain('LV SWGR');
    expect(container!.textContent).toContain('TRAFO');
    expect(container!.textContent).toContain('UPS');
  });

  it('TRAFO block exposes oil/winding temperature fields not shown for SWGR blocks', () => {
    mount(() => {});
    expect(container!.textContent).toContain('권선 온도');
    expect(container!.textContent).toContain('유면');
  });

  it('saves TRAFO-01 independently with only its relevant columns', () => {
    const onSave = vi.fn();
    mount(onSave);

    const saveButtons = Array.from(container!.querySelectorAll('button')).filter((b) => b.textContent === '저장');
    // order: MV-SWGR-01, LV-SWGR-01, TRAFO-01, UPS-01
    act(() => {
      saveButtons[2].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    const input = onSave.mock.calls[0][0] as { equipmentTag: string; values: Record<string, unknown> };
    expect(input.equipmentTag).toBe('TRAFO-01');
    expect(Object.keys(input.values).sort()).toEqual(
      ['status_text', 'oil_temperature_c', 'winding_temperature_c', 'oil_level_text'].sort()
    );
  });
});
