// src/components/locations/nias/hooks/useNiasPowerThermalStorage.ts
import {
  EngineSpecConfig,
  DEFAULT_ENGINE_SPEC_CONFIG,
  GeneratorEngineState,
  PLTMG_GENERATOR_FLEET_MOCK,
} from '@/data/pltmgEngineSpec';

const STORAGE_KEY_PLTMG_LOGS = 'nias_pltmg_dispatch_logs_v1';
const STORAGE_KEY_SPEC_CONFIG = 'nias_man_engine_spec_config_v2';

function loadEngineSpecConfig(): EngineSpecConfig {
  if (typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY_SPEC_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.mcrKwPerUnit && parsed.heatRateKjKwh) {
          return {
            ...DEFAULT_ENGINE_SPEC_CONFIG,
            ...parsed,
            modelName: 'MAN 7L 51/60 DF', // Locked
          };
        }
      }
    } catch (e) {
      console.warn('Could not read saved MAN Engine Spec Config:', e);
    }
  }
  return DEFAULT_ENGINE_SPEC_CONFIG;
}

function saveEngineSpecConfig(config: EngineSpecConfig): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY_SPEC_CONFIG, JSON.stringify(config));
  }
}

function loadEngineFleet(): GeneratorEngineState[] {
  if (typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY_PLTMG_LOGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 5) return parsed;
      }
    } catch (e) {
      console.warn('Could not read saved PLTMG dispatch logs:', e);
    }
  }
  return PLTMG_GENERATOR_FLEET_MOCK;
}

function saveEngineFleet(engines: GeneratorEngineState[]): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY_PLTMG_LOGS, JSON.stringify(engines));
  }
}

/**
 * Wraps the PLTMG Power/Thermal tab's direct localStorage access
 * (nias_pltmg_dispatch_logs_v1, nias_man_engine_spec_config_v2) behind
 * a small load/save API, matching the abstraction boundary the rest of
 * the LNG-Process views already have via PortalDataContext/DAO hooks.
 */
export function useNiasPowerThermalStorage() {
  return {
    loadEngineSpecConfig,
    saveEngineSpecConfig,
    loadEngineFleet,
    saveEngineFleet,
  };
}

export default useNiasPowerThermalStorage;
