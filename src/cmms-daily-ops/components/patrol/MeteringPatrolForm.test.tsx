// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MeteringPatrolForm } from './MeteringPatrolForm';

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

function mount(train: 'A' | 'B', onSave: (input: unknown) => void) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root!.render(<MeteringPatrolForm train={train} onSave={onSave} />);
  });
}

describe('MeteringPatrolForm', () => {
  it('renders the 9-field manifest for the given train', () => {
    mount('A', () => {});
    expect(container!.textContent).toContain('METERING-TRAIN-A');
    expect(container!.querySelectorAll('input[type="number"]')).toHaveLength(9);
  });

  it('saves under the correct equipment tag for Train B', () => {
    const onSave = vi.fn();
    mount('B', onSave);

    const saveButton = Array.from(container!.querySelectorAll('button')).find((b) => b.textContent === '저장')!;
    act(() => {
      saveButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ equipmentTag: 'METERING-TRAIN-B', shiftTimeSlot: '08:00' })
    );
  });
});
