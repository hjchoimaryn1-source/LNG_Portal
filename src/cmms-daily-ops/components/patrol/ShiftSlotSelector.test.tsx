// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ShiftSlotSelector, SHIFT_TIME_SLOTS } from './ShiftSlotSelector';

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

describe('ShiftSlotSelector', () => {
  it('renders all 6 fixed shift slots', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root!.render(<ShiftSlotSelector activeSlot="08:00" onSelect={() => {}} />);
    });

    const buttons = container.querySelectorAll('button');
    expect(buttons).toHaveLength(SHIFT_TIME_SLOTS.length);
    SHIFT_TIME_SLOTS.forEach((slot, i) => {
      expect(buttons[i].textContent).toBe(slot);
    });
  });

  it('calls onSelect with the clicked slot', () => {
    const onSelect = vi.fn();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root!.render(<ShiftSlotSelector activeSlot="00:00" onSelect={onSelect} />);
    });

    const buttons = container.querySelectorAll('button');
    act(() => {
      buttons[3].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onSelect).toHaveBeenCalledWith('12:00');
  });
});
