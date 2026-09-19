// @vitest-environment jsdom
// src/cmms-field-guard/security/FieldSecurityGuard.test.tsx
import { describe, it, expect, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { FieldGuardProvider } from '../core/FieldGuardContext';
import { FieldSecurityGuard } from './FieldSecurityGuard';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;
const REAL_LOCAL_STORAGE = window.localStorage;

function mount(mode: 'DEV' | 'FIELD_CLIENT') {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root!.render(
      <FieldGuardProvider mode={mode}>
        <FieldSecurityGuard ip="10.0.0.5" />
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
  // installFieldStorageGuard() permanently overrides window.localStorage via
  // defineProperty — restore the jsdom original so later tests/files aren't polluted.
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    get: () => REAL_LOCAL_STORAGE,
  });
});

describe('FieldSecurityGuard', () => {
  it('renders the watermark in FIELD_CLIENT mode', () => {
    mount('FIELD_CLIENT');
    expect(document.body.querySelector('[data-testid="field-guard-watermark"]')).not.toBeNull();
  });

  it('renders nothing in DEV mode', () => {
    mount('DEV');
    expect(container?.innerHTML).toBe('');
  });

  it('installs the in-memory storage guard in FIELD_CLIENT mode', () => {
    mount('FIELD_CLIENT');

    window.localStorage.setItem('probe', 'value');
    expect(window.localStorage.getItem('probe')).toBe('value');
    expect(REAL_LOCAL_STORAGE.getItem('probe')).toBeNull();
  });

  it('leaves real localStorage untouched in DEV mode', () => {
    mount('DEV');

    window.localStorage.setItem('probe', 'value');
    expect(REAL_LOCAL_STORAGE.getItem('probe')).toBe('value');

    window.localStorage.removeItem('probe');
  });
});
