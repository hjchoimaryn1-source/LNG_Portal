// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { SignatureBlock } from './SignatureBlock';

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
  vi.unstubAllGlobals();
});

function stubFetch(getRecords: unknown[], postRecords: unknown[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, records: postRecords }) } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => ({ success: true, records: getRecords }) } as Response);
    })
  );
}

async function mountAndFlush(role: 'prepared_by' | 'acknowledged_by' = 'prepared_by') {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(<SignatureBlock snapshotId={1} role={role} />);
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('SignatureBlock', () => {
  it('shows the sign form when no signature exists yet for this role', async () => {
    stubFetch([], []);
    await mountAndFlush();
    expect(container!.querySelector('input[placeholder="Name"]')).not.toBeNull();
  });

  it('shows only signer name + signed_at as text once signed for this role (no image)', async () => {
    stubFetch(
      [{ role: 'prepared_by', signerName: 'Ahmad', signerTitle: 'Field Supervisor', signedAt: '2026-09-14T10:00:00Z' }],
      []
    );
    await mountAndFlush('prepared_by');
    expect(container!.textContent).toContain('Ahmad (Field Supervisor)');
    expect(container!.textContent).toContain('2026-09-14T10:00:00Z');
    expect(container!.querySelector('img')).toBeNull();
    expect(container!.querySelector('input')).toBeNull();
  });

  it('does not react to the other role signature (only shows its own role)', async () => {
    stubFetch([{ role: 'acknowledged_by', signerName: 'HJ', signerTitle: null, signedAt: '2026-09-14T12:00:00Z' }], []);
    await mountAndFlush('prepared_by');
    expect(container!.querySelector('input[placeholder="Name"]')).not.toBeNull();
    expect(container!.textContent).not.toContain('HJ');
  });
});
