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
});
