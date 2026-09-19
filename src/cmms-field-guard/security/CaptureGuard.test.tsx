// @vitest-environment jsdom
// src/cmms-field-guard/security/CaptureGuard.test.tsx
import { describe, it, expect, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { FieldGuardProvider } from '../core/FieldGuardContext';
import { CaptureGuard } from './CaptureGuard';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

function mount(mode: 'DEV' | 'FIELD_CLIENT') {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root!.render(
      <FieldGuardProvider mode={mode}>
        <CaptureGuard />
      </FieldGuardProvider>,
    );
  });
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  container = null;
  root = null;
});

function dispatchKey(key: string, opts: Partial<KeyboardEventInit> = {}) {
  const event = new KeyboardEvent('keydown', { key, cancelable: true, ...opts });
  act(() => {
    window.dispatchEvent(event);
  });
  return event;
}

describe('CaptureGuard', () => {
  it('prevents PrintScreen default behavior when isField is true', () => {
    mount('FIELD_CLIENT');
    expect(dispatchKey('PrintScreen').defaultPrevented).toBe(true);
  });

  it('does not prevent PrintScreen when isField is false', () => {
    mount('DEV');
    expect(dispatchKey('PrintScreen').defaultPrevented).toBe(false);
  });

  it('renders no visible output (blur/focus blackout removed)', () => {
    mount('FIELD_CLIENT');
    expect(container?.innerHTML).toBe('');

    act(() => {
      window.dispatchEvent(new Event('blur'));
    });
    expect(container?.innerHTML).toBe('');
  });
});
