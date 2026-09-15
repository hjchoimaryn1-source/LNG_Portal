// @vitest-environment jsdom
//
// Seeds the real B2 store (setLatestPatrolEntry / __resetDailyOpsPatrolStoreForTests)
// rather than mocking useDailyOpsPatrolValue — same convention PidTagBadge.test.tsx
// already uses for this exact store.

import { describe, it, expect, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useOverviewHmiData } from '../useOverviewHmiData';
import { OVERVIEW_UNIT_SLOTS } from '../overviewUnitSlots';
import {
  NG_BUFFER_TANK_NORMAL_MIN_BARG,
  NG_BUFFER_TANK_TYPICAL_MIN_BARG,
  NG_BUFFER_TANK_TYPICAL_MAX_BARG,
} from '../hmiOverviewConstants';
import { setLatestPatrolEntry, __resetDailyOpsPatrolStoreForTests } from '../../state/useDailyOpsPatrolStore';
import type { OverviewHmiData } from '../hmiOverviewTypes';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const NG_BUFFER_TANK_SLOT = OVERVIEW_UNIT_SLOTS.find((s) => s.domain === 'ng_buffer_tank')!;
const AAV_SLOT = OVERVIEW_UNIT_SLOTS.find((s) => s.domain === 'aav')!;
const N2_SLOT = OVERVIEW_UNIT_SLOTS.find((s) => s.domain === 'n2_skid')!;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

async function readHookResult(): Promise<OverviewHmiData> {
  let captured: OverviewHmiData | undefined;
  function Probe() {
    captured = useOverviewHmiData('2026-09-15');
    return null;
  }
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(<Probe />);
    await Promise.resolve();
  });
  return captured!;
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  container = null;
  root = null;
  __resetDailyOpsPatrolStoreForTests();
});

describe('useOverviewHmiData', () => {
  it('marks every unit OFFLINE with a null primaryValue when the store has no data', async () => {
    const data = await readHookResult();
    expect(data.units.length).toBe(OVERVIEW_UNIT_SLOTS.length);
    const ngUnit = data.units.find((u) => u.equipmentTag === NG_BUFFER_TANK_SLOT.equipmentTag)!;
    expect(ngUnit.status).toBe('OFFLINE');
    expect(ngUnit.primaryValue).toBeNull();
  });

  it('maps a present AAV primary/secondary reading to NORMAL with both values', async () => {
    act(() => {
      setLatestPatrolEntry(AAV_SLOT.domain, AAV_SLOT.equipmentTag, {
        [AAV_SLOT.primaryColumn]: 3.2,
        [AAV_SLOT.secondaryColumn]: -162.1,
      });
    });
    const data = await readHookResult();
    const unit = data.units.find((u) => u.equipmentTag === AAV_SLOT.equipmentTag)!;
    expect(unit.status).toBe('NORMAL');
    expect(unit.primaryValue).toBe(3.2);
    expect(unit.secondaryValue).toBe(-162.1);
  });

  it('leaves secondaryValue undefined for a domain with no secondary column (n2_skid)', async () => {
    act(() => {
      setLatestPatrolEntry(N2_SLOT.domain, N2_SLOT.equipmentTag, { [N2_SLOT.primaryColumn]: 145 });
    });
    const data = await readHookResult();
    const unit = data.units.find((u) => u.equipmentTag === N2_SLOT.equipmentTag)!;
    expect(unit.primaryValue).toBe(145);
    expect(unit.secondaryValue).toBeUndefined();
    expect(unit.secondaryUnit).toBeUndefined();
  });

  it('reports NORMAL inside the typical NG buffer tank band', async () => {
    const midTypical = (NG_BUFFER_TANK_TYPICAL_MIN_BARG + NG_BUFFER_TANK_TYPICAL_MAX_BARG) / 2;
    act(() => {
      setLatestPatrolEntry(NG_BUFFER_TANK_SLOT.domain, NG_BUFFER_TANK_SLOT.equipmentTag, {
        [NG_BUFFER_TANK_SLOT.primaryColumn]: midTypical,
      });
    });
    const data = await readHookResult();
    const unit = data.units.find((u) => u.equipmentTag === NG_BUFFER_TANK_SLOT.equipmentTag)!;
    expect(unit.status).toBe('NORMAL');
  });

  it('reports WARNING inside the normal band but outside the typical band', async () => {
    const belowTypical = NG_BUFFER_TANK_TYPICAL_MIN_BARG - 0.5;
    act(() => {
      setLatestPatrolEntry(NG_BUFFER_TANK_SLOT.domain, NG_BUFFER_TANK_SLOT.equipmentTag, {
        [NG_BUFFER_TANK_SLOT.primaryColumn]: belowTypical,
      });
    });
    const data = await readHookResult();
    const unit = data.units.find((u) => u.equipmentTag === NG_BUFFER_TANK_SLOT.equipmentTag)!;
    expect(unit.status).toBe('WARNING');
  });

  it('reports ALARM outside the normal band', async () => {
    const belowNormal = NG_BUFFER_TANK_NORMAL_MIN_BARG - 0.5;
    act(() => {
      setLatestPatrolEntry(NG_BUFFER_TANK_SLOT.domain, NG_BUFFER_TANK_SLOT.equipmentTag, {
        [NG_BUFFER_TANK_SLOT.primaryColumn]: belowNormal,
      });
    });
    const data = await readHookResult();
    const unit = data.units.find((u) => u.equipmentTag === NG_BUFFER_TANK_SLOT.equipmentTag)!;
    expect(unit.status).toBe('ALARM');
  });
});
