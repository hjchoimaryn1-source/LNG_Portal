// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AavPatrolForm } from './AavPatrolForm';

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
    root!.render(<AavPatrolForm onSave={onSave} />);
  });
}

describe('AavPatrolForm', () => {
  it('renders 4 AAV unit blocks with 9 fields each (8 + Stage E-4 inlet DP)', () => {
    mount(() => {});
    const unitHeaders = Array.from(container!.querySelectorAll('div')).filter((el) =>
      /^AAV-(102|103|105|106)$/.test(el.textContent ?? '')
    );
    expect(unitHeaders.length).toBeGreaterThanOrEqual(4);
    // 4 units x 9 numeric fields = 36 number inputs
    expect(container!.querySelectorAll('input[type="number"]')).toHaveLength(36);
  });

  it('saves the entered value under the selected shift slot and equipment tag', () => {
    const onSave = vi.fn();
    mount(onSave);

    const numberInputs = container!.querySelectorAll('input[type="number"]');
    const nativeValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
    act(() => {
      nativeValueSetter.call(numberInputs[0], '4.2');
      numberInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    });

    const saveButtons = Array.from(container!.querySelectorAll('button')).filter((b) => b.textContent === '저장');
    act(() => {
      saveButtons[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    const input = onSave.mock.calls[0][0] as {
      equipmentTag: string;
      shiftTimeSlot: string;
      values: Record<string, unknown>;
    };
    expect(input.equipmentTag).toBe('AAV-102');
    expect(input.shiftTimeSlot).toBe('08:00');
    expect(input.values.pressure_gauge_us_bar).toBe(4.2);
  });
});
