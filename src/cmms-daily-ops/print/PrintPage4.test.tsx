// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { PrintPage4 } from './PrintPage4';
import type { DailyReportSnapshotPayload } from '../dao/dailyReportSnapshotDao';

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

function mount(payload: DailyReportSnapshotPayload) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root!.render(<PrintPage4 payload={payload} />);
  });
}

const BASE_PAYLOAD: DailyReportSnapshotPayload = {
  reportDate: '2026-09-18',
  generatedAt: '2026-09-18T00:00:00Z',
  generatedBy: 'HJ',
  domains: {
    electrical: {
      'MV-SWGR-01': { status_text: 'NORMAL', bus_voltage: 20000, total_load_current_a: 150, room_temperature_c: 28 },
      'LV-SWGR-01': { status_text: 'NORMAL', bus_voltage: 400, total_load_current_a: 300, room_temperature_c: 27 },
      'TRAFO-01': { status_text: 'NORMAL', oil_temperature_c: 55, winding_temperature_c: 60, oil_level_text: 'NORMAL' },
      'UPS-01': { status_text: 'NORMAL', battery_capacity_pct: 98, ups_load_pct: 40, room_temperature_c: 26 },
    },
  },
  stationTotal: {
    volumeFlowrateMmscfd: 0,
    energyFlowrateMmbtud: 0,
    volumeTotalMmcf: 0,
    volumeTotalMscf: 0,
    energyTotalMmbtu: 0,
  },
};

describe('PrintPage4 electrical section', () => {
  it('converts MV-SWGR-01 bus_voltage to kV for display, leaving the raw payload untouched', () => {
    mount(BASE_PAYLOAD);
    expect(container!.textContent).toContain('모선 전압 (kV)');
    expect(container!.textContent).toContain('20');
    expect(BASE_PAYLOAD.domains.electrical!['MV-SWGR-01']!.bus_voltage).toBe(20000);
  });

  it('keeps LV-SWGR-01 bus_voltage in V, unconverted', () => {
    mount(BASE_PAYLOAD);
    expect(container!.textContent).toContain('모선 전압 (V)');
    expect(container!.textContent).toContain('400');
  });

  it('only prints columns relevant to each tag (defect (1) regression)', () => {
    mount(BASE_PAYLOAD);
    const tables = Array.from(container!.querySelectorAll('table.print-field-grid'));

    const trafoTable = tables.find((t) => t.querySelector('caption')?.textContent === 'TRAFO-01')!;
    expect(trafoTable.textContent).not.toContain('모선 전압');
    expect(trafoTable.textContent).toContain('권선 온도');

    const upsTable = tables.find((t) => t.querySelector('caption')?.textContent === 'UPS-01')!;
    expect(upsTable.textContent).not.toContain('모선 전압');
    expect(upsTable.textContent).not.toContain('유온');
    // Defect (2): UPS should now include room temperature.
    expect(upsTable.textContent).toContain('실내 온도');
  });
});
