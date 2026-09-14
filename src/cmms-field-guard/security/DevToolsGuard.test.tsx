// @vitest-environment jsdom
// src/cmms-field-guard/security/DevToolsGuard.test.tsx
import { describe, it, expect, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { FieldGuardProvider } from '../core/FieldGuardContext';
import { DevToolsGuard } from './DevToolsGuard';

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
        <DevToolsGuard />
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
  window.dispatchEvent(event);
  return event;
}

describe('DevToolsGuard', () => {
  it('prevents F12, Ctrl+Shift+I/J/C, and Ctrl+U when isField is true', () => {
    mount('FIELD_CLIENT');

    expect(dispatchKey('F12').defaultPrevented).toBe(true);
    expect(dispatchKey('I', { ctrlKey: true, shiftKey: true }).defaultPrevented).toBe(true);
    expect(dispatchKey('J', { ctrlKey: true, shiftKey: true }).defaultPrevented).toBe(true);
    expect(dispatchKey('C', { ctrlKey: true, shiftKey: true }).defaultPrevented).toBe(true);
    expect(dispatchKey('U', { ctrlKey: true }).defaultPrevented).toBe(true);
  });

  it('does not prevent default when isField is false', () => {
    mount('DEV');

    expect(dispatchKey('F12').defaultPrevented).toBe(false);
    expect(dispatchKey('I', { ctrlKey: true, shiftKey: true }).defaultPrevented).toBe(false);
  });
});
