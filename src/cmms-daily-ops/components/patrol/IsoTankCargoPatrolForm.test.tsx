// @vitest-environment jsdom
//
// useFleetTankFacade is mocked directly rather than mounting a real
// PortalDataProvider — PortalDataProvider's CSV-loading chain resolves
// through several real setTimeout(0) hops (yieldToMain in csvParser.ts)
// that don't reliably settle inside a single test's act()/timer window in
// this jsdom+vitest setup (observed to stall for seconds), which is also
// why NiasTerminalView.test.tsx only ever exercises it with blank CSV text.
// Mocking the facade keeps this test deterministic and fast while still
// exercising the real deriveIsoTankCargoTags() pure function.

import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { IsoTankCargoPatrolForm } from './IsoTankCargoPatrolForm';
import { NodeState, type FleetTankItem } from '../../../types/lng';

const mockUseFleetTankFacade = vi.fn();
vi.mock('../../../hooks/portalDataFacade/useFleetTankFacade', () => ({
  useFleetTankFacade: () => mockUseFleetTankFacade(),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function tank(overrides: Partial<FleetTankItem>): FleetTankItem {
  return {
    no: 1,
    tankNo: 'ISOT-000',
    rawTankNo: 'ISOT-000',
    serialNo: 'SIMU-0000000',
    location: 'ORU NIAS',
    position: 'Laydown 1',
    node: NodeState.NODE_3_NIAS_LAYDOWN_YARD,
    level: 50,
    levelM3: 20,
    levelMmH2O: 500,
    battery: 90,
    pressureMPa: 0.76,
    tempC: -126.7,
    depress: 'None',
    pressBeforeMPa: 0.76,
    pressAfterMPa: 0.76,
    remarks: '',
    lastReportDate: '2026-08-13',
    ...overrides,
  };
}

let container: HTMLDivElement | null = null;
let root: Root | null = null;

function mount(onSave: (input: unknown) => void) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root!.render(<IsoTankCargoPatrolForm onSave={onSave} />);
  });
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  container = null;
  root = null;
  vi.clearAllMocks();
});

describe('IsoTankCargoPatrolForm', () => {
  it('renders one row per Laydown 1/2 SIMU serial derived from fleetTanks, excluding ship-bound tanks', () => {
    mockUseFleetTankFacade.mockReturnValue({
      fleetTanks: [
        tank({ serialNo: 'SIMU-8101513', position: 'LAYDOWN 1' }),
        tank({ serialNo: 'SIMU-8102567', position: 'Laydown 2' }),
        tank({ serialNo: 'SIMU-8101236', position: 'MV. SAVIOUR' }),
        tank({ serialNo: 'SIMU-SKID', position: 'REGAS Bay 01', isMountedToBay: 'Bay 01' }),
      ],
    });

    mount(() => {});

    expect(container!.textContent).toContain('SIMU-8101513');
    expect(container!.textContent).toContain('SIMU-8102567');
    expect(container!.textContent).not.toContain('SIMU-8101236');
    expect(container!.textContent).not.toContain('SIMU-SKID');
    expect(container!.querySelectorAll('input[type="number"]')).toHaveLength(12);
  });

  it('shows an empty-state notice when no tanks are at Laydown 1/2', () => {
    mockUseFleetTankFacade.mockReturnValue({ fleetTanks: [] });
    mount(() => {});
    expect(container!.textContent).toContain('현재 Laydown 1/2에 위치한 탱크가 없습니다.');
  });

  it('saves a tank row with the fixed daily shift slot (00:00) and correct equipmentTag', () => {
    mockUseFleetTankFacade.mockReturnValue({
      fleetTanks: [tank({ serialNo: 'SIMU-8101513', position: 'Laydown 1' })],
    });
    const onSave = vi.fn();
    mount(onSave);

    const saveButtons = Array.from(container!.querySelectorAll('button')).filter((b) => b.textContent === '저장');
    act(() => {
      saveButtons[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ equipmentTag: 'SIMU-8101513', shiftTimeSlot: '00:00' })
    );
  });
});
