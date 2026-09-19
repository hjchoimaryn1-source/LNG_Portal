// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { DailyReportPrintView } from './DailyReportPrintView';
import { PortalDataProvider } from '../../context/PortalDataContext';

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

const SAMPLE_PAYLOAD = {
  reportDate: '2026-09-14',
  generatedAt: '2026-09-14T00:00:00Z',
  generatedBy: 'HJ',
  domains: {
    aav: { 'AAV-102': { pressure_gauge_us_bar: 4.2 } },
  },
  stationTotal: {
    volumeFlowrateMmscfd: 18,
    energyFlowrateMmbtud: 180,
    volumeTotalMmcf: 8,
    volumeTotalMscf: 8000,
    energyTotalMmbtu: 80,
  },
};

function stubFetchFound() {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      if (url.includes('daily-report-snapshots')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, snapshot: { id: 1, payload: SAMPLE_PAYLOAD } }),
        } as Response);
      }
      if (url.includes('daily-report-critical-events')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, records: [] }) } as Response);
      }
      if (url.includes('daily-report-safety-notes')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, record: null }) } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => ({ success: true, records: [] }) } as Response);
    })
  );
}

function stubFetchNotFound() {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve({ ok: true, json: async () => ({ success: true, snapshot: null }) } as Response))
  );
}

async function mountAndFlush() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(
      <PortalDataProvider>
        <DailyReportPrintView reportDate="2026-09-14" />
      </PortalDataProvider>
    );
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('DailyReportPrintView', () => {
  it('shows a message rather than blank output when no snapshot exists yet', async () => {
    stubFetchNotFound();
    await mountAndFlush();
    expect(container!.textContent).toContain('Generate the report first');
  });

  it('renders all 5 pages once the snapshot and child data load', async () => {
    stubFetchFound();
    await mountAndFlush();

    const pages = container!.querySelectorAll('.print-page');
    expect(pages).toHaveLength(5);
    expect(container!.textContent).toContain('AAV-102');
    expect(container!.textContent).toContain('4.2');
    expect(container!.textContent).toContain('STATION TOTAL');
  });

  it('renders NG Buffer Tank as real data (Stage E-2) while flagging ISO Tank cargo/Carrier Gas as missing', async () => {
    stubFetchFound();
    await mountAndFlush();
    expect(container!.textContent).toContain('V-101');
    const gapNotices = container!.querySelectorAll('.print-gap-notice');
    expect(gapNotices.length).toBeGreaterThanOrEqual(2); // Carrier Gas, ISO Tank Cargo x2
  });
});
