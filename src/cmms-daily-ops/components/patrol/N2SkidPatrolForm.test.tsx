// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { N2SkidPatrolForm } from './N2SkidPatrolForm';

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
    root!.render(<N2SkidPatrolForm onSave={onSave} />);
  });
}

describe('N2SkidPatrolForm', () => {
  it('renders 10 cylinders + 3 skid-area rows (13 total)', () => {
    mount(() => {});
    expect(container!.textContent).toContain('N2-CYL-01');
    expect(container!.textContent).toContain('N2-CYL-10');
    expect(container!.textContent).toContain('N2-SKID-SUPPLY-3');
    expect(container!.querySelectorAll('input[type="number"]')).toHaveLength(13);
    expect(container!.querySelectorAll('input[type="text"]')).toHaveLength(13);
    expect(container!.querySelectorAll('select')).toHaveLength(13);
  });

  it('saves an individual cylinder row independently of the others', () => {
    const onSave = vi.fn();
    mount(onSave);

    const saveButtons = Array.from(container!.querySelectorAll('button')).filter((b) => b.textContent === '저장');
    act(() => {
      saveButtons[2].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ equipmentTag: 'N2-CYL-03' }));
  });
});
