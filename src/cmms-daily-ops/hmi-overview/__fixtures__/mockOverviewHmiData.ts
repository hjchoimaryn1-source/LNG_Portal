// src/cmms-daily-ops/hmi-overview/__fixtures__/mockOverviewHmiData.ts
//
// PURPOSE
//   Dev-only fixture for manual/isolated review of HmiOverviewView.tsx.
//   NOT imported from any production route. Tags below (`UNIT-1`,
//   `NG-BUFFER-TANK-1`, etc.) are clearly-marked placeholders — never a
//   confirmed field naming decision (see hmi-overview module naming
//   constraint: equipment identifiers are unresolved pending field
//   confirmation).
//
//   Includes two ng_buffer_tank units to visually verify the normal-range
//   indicator: one inside the typical band (7.4-8.0 barg), one outside the
//   normal band (4.5-8.0 barg).

import type { OverviewHmiData } from '../hmiOverviewTypes';

export const mockOverviewHmiData: OverviewHmiData = {
  generatedAt: '2026-09-15T08:00:00.000Z',
  units: [
    { equipmentTag: 'UNIT-1', label: 'UNIT-1', domain: 'aav', status: 'NORMAL', primaryValue: 3.2, primaryUnit: 'bar', secondaryValue: -162.1, secondaryUnit: 'C' },
    { equipmentTag: 'UNIT-2', label: 'UNIT-2', domain: 'aav', status: 'WARNING', primaryValue: 3.9, primaryUnit: 'bar', secondaryValue: -158.4, secondaryUnit: 'C' },
    { equipmentTag: 'UNIT-3', label: 'UNIT-3', domain: 'aav', status: 'OFFLINE', primaryValue: null, primaryUnit: 'bar' },
    { equipmentTag: 'UNIT-4', label: 'UNIT-4', domain: 'aav', status: 'NORMAL', primaryValue: 3.1, primaryUnit: 'bar', secondaryValue: -161.8, secondaryUnit: 'C' },

    { equipmentTag: 'METERING-A-1', label: 'Metering Train A', domain: 'metering_train_a', status: 'NORMAL', primaryValue: 42.6, primaryUnit: 'MMSCFD', secondaryValue: 43900, secondaryUnit: 'MMBTU/D' },
    { equipmentTag: 'METERING-B-1', label: 'Metering Train B', domain: 'metering_train_b', status: 'NORMAL', primaryValue: 39.8, primaryUnit: 'MMSCFD', secondaryValue: 41020, secondaryUnit: 'MMBTU/D' },

    { equipmentTag: 'NG-BUFFER-TANK-1', label: 'NG Buffer Tank (typical)', domain: 'ng_buffer_tank', status: 'NORMAL', primaryValue: 7.8, primaryUnit: 'barg' },
    { equipmentTag: 'NG-BUFFER-TANK-2', label: 'NG Buffer Tank (out of range)', domain: 'ng_buffer_tank', status: 'ALARM', primaryValue: 3.9, primaryUnit: 'barg' },

    { equipmentTag: 'N2-SKID-1', label: 'N2 Skid', domain: 'n2_skid', status: 'NORMAL', primaryValue: 145, primaryUnit: 'bar' },

    { equipmentTag: 'GC-1', label: 'Gas Chromatograph', domain: 'gc', status: 'NORMAL', primaryValue: 96.4, primaryUnit: 'mol% CH4' },

    { equipmentTag: 'ISO-UNLOAD-1', label: 'ISO Tank Unloading Skid', domain: 'iso_tank_unloading_skid', status: 'NORMAL', primaryValue: 62.3, primaryUnit: '%', secondaryValue: 0.42, secondaryUnit: 'MPa' },
  ],
};
