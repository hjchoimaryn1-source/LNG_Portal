// @vitest-environment jsdom
//
// Seeds the real B2 store (setLatestPatrolEntry / __resetDailyOpsPatrolStoreForTests)
// rather than mocking useDailyOpsPatrolValue — same convention PidTagBadge.test.tsx
// already uses for this exact store.

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useOverviewHmiData } from '../useOverviewHmiData';
import { DailyOpsDataProvider } from '../../../context/DailyOpsDataContext';
import { OVERVIEW_UNIT_SLOTS } from '../overviewUnitSlots';
import {
  AAV_NORMAL_MIN_BAR,
  AAV_TYPICAL_MIN_BAR,
  AAV_TYPICAL_MAX_BAR,
  GC_METHANE_NORMAL_MAX_PCT,
  GC_METHANE_TYPICAL_MAX_PCT,
  ISO_TANK_UNLOADING_SKID_NORMAL_MIN_PCT,
  ISO_TANK_UNLOADING_SKID_TYPICAL_MIN_PCT,
  METERING_TRAIN_NORMAL_MAX_BARG,
  METERING_TRAIN_TYPICAL_MAX_BARG,
  N2_SKID_NORMAL_MIN_BAR,
  N2_SKID_TYPICAL_MIN_BAR,
  NG_BUFFER_TANK_NORMAL_MIN_BARG,
  NG_BUFFER_TANK_TYPICAL_MIN_BARG,
  NG_BUFFER_TANK_TYPICAL_MAX_BARG,
} from '../hmiOverviewConstants';
import { setLatestPatrolEntry, __resetDailyOpsPatrolStoreForTests } from '../../state/useDailyOpsPatrolStore';
import { FALLBACK_PRIMARY_COLUMN_BY_DOMAIN, FALLBACK_SECONDARY_COLUMN_BY_DOMAIN } from '../hmiOverviewColumnMap';
import type { OverviewHmiData } from '../hmiOverviewTypes';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const NG_BUFFER_TANK_SLOT = OVERVIEW_UNIT_SLOTS.find((s) => s.domain === 'ng_buffer_tank')!;
const AAV_SLOT = OVERVIEW_UNIT_SLOTS.find((s) => s.domain === 'aav')!;
const N2_SLOT = OVERVIEW_UNIT_SLOTS.find((s) => s.domain === 'n2_skid')!;
const METERING_A_SLOT = OVERVIEW_UNIT_SLOTS.find((s) => s.domain === 'metering_train_a')!;
const GC_SLOT = OVERVIEW_UNIT_SLOTS.find((s) => s.domain === 'gc')!;
const ISO_TANK_SLOT = OVERVIEW_UNIT_SLOTS.find((s) => s.domain === 'iso_tank_unloading_skid')!;

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
    root!.render(
      <DailyOpsDataProvider>
        <Probe />
      </DailyOpsDataProvider>
    );
    await Promise.resolve();
  });
  return captured!;
}

beforeEach(() => {
  // useOverviewHmiData now requires DailyOpsDataProvider (Stage 3 Step 2 —
  // 20s cross-device poll reuses its refresh()). Stub fetch so the
  // provider's mount-time hydration effects resolve harmlessly.
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, records: [], acknowledgements: [] }),
    })
  );
});

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  container = null;
  root = null;
  __resetDailyOpsPatrolStoreForTests();
  vi.unstubAllGlobals();
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
    expect(unit.isThresholdValidated).toBe(false);
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

  it('marks ng_buffer_tank units as threshold-validated (HJ-confirmed band)', async () => {
    act(() => {
      setLatestPatrolEntry(NG_BUFFER_TANK_SLOT.domain, NG_BUFFER_TANK_SLOT.equipmentTag, {
        [NG_BUFFER_TANK_SLOT.primaryColumn]: 7.8,
      });
    });
    const data = await readHookResult();
    const unit = data.units.find((u) => u.equipmentTag === NG_BUFFER_TANK_SLOT.equipmentTag)!;
    expect(unit.isThresholdValidated).toBe(true);
  });

  it('reports ALARM for AAV outside its PLACEHOLDER normal band', async () => {
    act(() => {
      setLatestPatrolEntry(AAV_SLOT.domain, AAV_SLOT.equipmentTag, {
        [AAV_SLOT.primaryColumn]: AAV_NORMAL_MIN_BAR - 0.1,
      });
    });
    const data = await readHookResult();
    const unit = data.units.find((u) => u.equipmentTag === AAV_SLOT.equipmentTag)!;
    expect(unit.status).toBe('ALARM');
    expect(unit.isThresholdValidated).toBe(false);
  });

  it('reports WARNING for AAV inside normal but outside its PLACEHOLDER typical band', async () => {
    act(() => {
      setLatestPatrolEntry(AAV_SLOT.domain, AAV_SLOT.equipmentTag, {
        [AAV_SLOT.primaryColumn]: AAV_TYPICAL_MAX_BAR + 0.1,
      });
    });
    const data = await readHookResult();
    const unit = data.units.find((u) => u.equipmentTag === AAV_SLOT.equipmentTag)!;
    expect(unit.status).toBe('WARNING');
  });

  it('reports NORMAL for AAV mid-typical-band', async () => {
    const midTypical = (AAV_TYPICAL_MIN_BAR + AAV_TYPICAL_MAX_BAR) / 2;
    act(() => {
      setLatestPatrolEntry(AAV_SLOT.domain, AAV_SLOT.equipmentTag, {
        [AAV_SLOT.primaryColumn]: midTypical,
      });
    });
    const data = await readHookResult();
    const unit = data.units.find((u) => u.equipmentTag === AAV_SLOT.equipmentTag)!;
    expect(unit.status).toBe('NORMAL');
  });

  it('reports ALARM for Metering Train A above its PLACEHOLDER normal band', async () => {
    act(() => {
      setLatestPatrolEntry(METERING_A_SLOT.domain, METERING_A_SLOT.equipmentTag, {
        [METERING_A_SLOT.primaryColumn]: METERING_TRAIN_NORMAL_MAX_BARG + 0.1,
      });
    });
    const data = await readHookResult();
    const unit = data.units.find((u) => u.equipmentTag === METERING_A_SLOT.equipmentTag)!;
    expect(unit.status).toBe('ALARM');
    expect(unit.isThresholdValidated).toBe(false);
  });

  it('reports WARNING for Metering Train A above its PLACEHOLDER typical band', async () => {
    act(() => {
      setLatestPatrolEntry(METERING_A_SLOT.domain, METERING_A_SLOT.equipmentTag, {
        [METERING_A_SLOT.primaryColumn]: METERING_TRAIN_TYPICAL_MAX_BARG + 0.1,
      });
    });
    const data = await readHookResult();
    const unit = data.units.find((u) => u.equipmentTag === METERING_A_SLOT.equipmentTag)!;
    expect(unit.status).toBe('WARNING');
  });

  it('reports ALARM for N2 Skid below its PLACEHOLDER normal band', async () => {
    act(() => {
      setLatestPatrolEntry(N2_SLOT.domain, N2_SLOT.equipmentTag, {
        [N2_SLOT.primaryColumn]: N2_SKID_NORMAL_MIN_BAR - 1,
      });
    });
    const data = await readHookResult();
    const unit = data.units.find((u) => u.equipmentTag === N2_SLOT.equipmentTag)!;
    expect(unit.status).toBe('ALARM');
  });

  it('reports WARNING for N2 Skid below its PLACEHOLDER typical band', async () => {
    act(() => {
      setLatestPatrolEntry(N2_SLOT.domain, N2_SLOT.equipmentTag, {
        [N2_SLOT.primaryColumn]: N2_SKID_TYPICAL_MIN_BAR - 1,
      });
    });
    const data = await readHookResult();
    const unit = data.units.find((u) => u.equipmentTag === N2_SLOT.equipmentTag)!;
    expect(unit.status).toBe('WARNING');
  });

  it('reports ALARM for GC methane% above its PLACEHOLDER normal band', async () => {
    act(() => {
      setLatestPatrolEntry(GC_SLOT.domain, GC_SLOT.equipmentTag, {
        [GC_SLOT.primaryColumn]: GC_METHANE_NORMAL_MAX_PCT + 0.1,
      });
    });
    const data = await readHookResult();
    const unit = data.units.find((u) => u.equipmentTag === GC_SLOT.equipmentTag)!;
    expect(unit.status).toBe('ALARM');
    expect(unit.isThresholdValidated).toBe(false);
  });

  it('reports WARNING for GC methane% above its PLACEHOLDER typical band', async () => {
    act(() => {
      setLatestPatrolEntry(GC_SLOT.domain, GC_SLOT.equipmentTag, {
        [GC_SLOT.primaryColumn]: GC_METHANE_TYPICAL_MAX_PCT + 0.1,
      });
    });
    const data = await readHookResult();
    const unit = data.units.find((u) => u.equipmentTag === GC_SLOT.equipmentTag)!;
    expect(unit.status).toBe('WARNING');
  });

  it('reports ALARM for ISO Tank Unloading Skid level below its PLACEHOLDER normal band', async () => {
    act(() => {
      setLatestPatrolEntry(ISO_TANK_SLOT.domain, ISO_TANK_SLOT.equipmentTag, {
        [ISO_TANK_SLOT.primaryColumn]: ISO_TANK_UNLOADING_SKID_NORMAL_MIN_PCT - 1,
      });
    });
    const data = await readHookResult();
    const unit = data.units.find((u) => u.equipmentTag === ISO_TANK_SLOT.equipmentTag)!;
    expect(unit.status).toBe('ALARM');
    expect(unit.isThresholdValidated).toBe(false);
  });

  it('reports WARNING for ISO Tank Unloading Skid level below its PLACEHOLDER typical band', async () => {
    act(() => {
      setLatestPatrolEntry(ISO_TANK_SLOT.domain, ISO_TANK_SLOT.equipmentTag, {
        [ISO_TANK_SLOT.primaryColumn]: ISO_TANK_UNLOADING_SKID_TYPICAL_MIN_PCT - 1,
      });
    });
    const data = await readHookResult();
    const unit = data.units.find((u) => u.equipmentTag === ISO_TANK_SLOT.equipmentTag)!;
    expect(unit.status).toBe('WARNING');
  });
});

// 2026-09-17 (HJ-approved) — AAV U/S -> D/S fallback. The 2026-09-15 Daily
// Operation Report backfill (dailyOpsPatrolPdfSeed.ts) only ever supplies D/S
// (pressure_transmitter_ds_bar/temperature_transmitter_ds_c) values for AAV,
// never the U/S columns AAV_SLOT.primaryColumn/secondaryColumn point at — so
// this covers the fallback path directly, seeding the store the same way
// DailyOpsDataContext.refresh() would from the real seeded rows.
describe('useOverviewHmiData — AAV D/S fallback', () => {
  const AAV_FALLBACK_PRIMARY_COLUMN = FALLBACK_PRIMARY_COLUMN_BY_DOMAIN.aav!;
  const AAV_FALLBACK_SECONDARY_COLUMN = FALLBACK_SECONDARY_COLUMN_BY_DOMAIN.aav!;
  const AAV_SLOTS = OVERVIEW_UNIT_SLOTS.filter((s) => s.domain === 'aav');

  // Mirrors the 4 seeded rows (dailyOpsPatrolPdfSeed.ts): AAV-102/103/105/106.
  const SEEDED_DS_VALUES: Record<string, { pressure: number; temp: number }> = {
    'AAV-102': { pressure: 5.1, temp: 26.87 },
    'AAV-103': { pressure: 5.05, temp: 26.81 },
    'AAV-105': { pressure: 6.65, temp: 26.87 },
    'AAV-106': { pressure: 5.11, temp: 26.73 },
  };

  it('resolves each seeded AAV tag to its D/S value when the U/S column is absent', async () => {
    act(() => {
      for (const slot of AAV_SLOTS) {
        const seeded = SEEDED_DS_VALUES[slot.equipmentTag];
        setLatestPatrolEntry(slot.domain, slot.equipmentTag, {
          [AAV_FALLBACK_PRIMARY_COLUMN]: seeded.pressure,
          [AAV_FALLBACK_SECONDARY_COLUMN]: seeded.temp,
        });
      }
    });
    const data = await readHookResult();
    for (const slot of AAV_SLOTS) {
      const seeded = SEEDED_DS_VALUES[slot.equipmentTag];
      const unit = data.units.find((u) => u.equipmentTag === slot.equipmentTag)!;
      expect(unit.primaryValue).toBe(seeded.pressure);
      expect(unit.secondaryValue).toBe(seeded.temp);
      expect(unit.status).not.toBe('OFFLINE');
    }
  });

  it('prefers the U/S value over the D/S fallback when both are present', async () => {
    act(() => {
      setLatestPatrolEntry(AAV_SLOT.domain, AAV_SLOT.equipmentTag, {
        [AAV_SLOT.primaryColumn]: 3.2,
        [AAV_SLOT.secondaryColumn]: -162.1,
        [AAV_FALLBACK_PRIMARY_COLUMN]: 5.1,
        [AAV_FALLBACK_SECONDARY_COLUMN]: 26.87,
      });
    });
    const data = await readHookResult();
    const unit = data.units.find((u) => u.equipmentTag === AAV_SLOT.equipmentTag)!;
    expect(unit.primaryValue).toBe(3.2);
    expect(unit.secondaryValue).toBe(-162.1);
  });

  it('does not apply the D/S fallback to non-AAV domains (metering_train_a has no fallback column)', async () => {
    act(() => {
      setLatestPatrolEntry(METERING_A_SLOT.domain, METERING_A_SLOT.equipmentTag, {
        // Same column name AAV's fallback uses, but under a domain with no
        // FALLBACK_PRIMARY_COLUMN_BY_DOMAIN entry — must be ignored.
        [AAV_FALLBACK_PRIMARY_COLUMN]: 999,
      });
    });
    const data = await readHookResult();
    const unit = data.units.find((u) => u.equipmentTag === METERING_A_SLOT.equipmentTag)!;
    expect(unit.primaryValue).toBeNull();
    expect(unit.status).toBe('OFFLINE');
  });
});
