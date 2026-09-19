// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { IsoTankUnloadingSkidPatrolForm } from './IsoTankUnloadingSkidPatrolForm';

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
    root!.render(<IsoTankUnloadingSkidPatrolForm onSave={onSave} />);
  });
}

describe('IsoTankUnloadingSkidPatrolForm', () => {
  it('renders 4 ISO tank cards (T-201~204) with 6 fields each', () => {
    mount(() => {});
    expect(container!.textContent).toContain('T-201');
    expect(container!.textContent).toContain('T-202');
    expect(container!.textContent).toContain('T-203');
    expect(container!.textContent).toContain('T-204');
    expect(container!.querySelectorAll('input[type="number"]')).toHaveLength(24);
    expect(container!.querySelectorAll('select')).toHaveLength(4);
  });

  it('saves an individual tank row independently of the others', () => {
    const onSave = vi.fn();
    mount(onSave);

    const saveButtons = Array.from(container!.querySelectorAll('button')).filter((b) => b.textContent === '저장');
    act(() => {
      saveButtons[2].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ equipmentTag: 'T-203' }));
  });
});
