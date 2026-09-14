// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { GcPatrolForm } from './GcPatrolForm';

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
    root!.render(<GcPatrolForm onSave={onSave} />);
  });
}

describe('GcPatrolForm', () => {
  it('renders the 4 status fields and 11 composition fields', () => {
    mount(() => {});
    expect(container!.querySelectorAll('input[type="text"]')).toHaveLength(4);
    expect(container!.querySelectorAll('input[type="number"]')).toHaveLength(11);
  });

  it('saves under the GC-01 equipment tag', () => {
    const onSave = vi.fn();
    mount(onSave);

    const saveButton = Array.from(container!.querySelectorAll('button')).find((b) => b.textContent === '저장')!;
    act(() => {
      saveButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ equipmentTag: 'GC-01' }));
  });
});
