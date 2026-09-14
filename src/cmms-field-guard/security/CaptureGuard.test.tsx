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

function overlayVisible(): boolean {
  return document.body.querySelector('[data-testid="capture-guard-overlay"]') !== null;
}

describe('CaptureGuard', () => {
  it('shows the blackout overlay on blur and hides it on focus when isField is true', () => {
    mount('FIELD_CLIENT');
    expect(overlayVisible()).toBe(false);

    act(() => {
      window.dispatchEvent(new Event('blur'));
    });
    expect(overlayVisible()).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('focus'));
    });
    expect(overlayVisible()).toBe(false);
  });

  it('never shows the overlay when isField is false', () => {
    mount('DEV');

    act(() => {
      window.dispatchEvent(new Event('blur'));
    });
    expect(overlayVisible()).toBe(false);
  });
});
