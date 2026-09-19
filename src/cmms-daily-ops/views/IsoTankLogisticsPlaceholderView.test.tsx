// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { IsoTankLogisticsPlaceholderView } from './IsoTankLogisticsPlaceholderView';

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

describe('IsoTankLogisticsPlaceholderView', () => {
  it('renders a deferral notice rather than any real logistics content', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root!.render(<IsoTankLogisticsPlaceholderView />);
    });
    expect(container!.textContent).toContain('ISO Tank Logistics');
    expect(container!.textContent).toContain('Coming in a later phase');
  });
});
