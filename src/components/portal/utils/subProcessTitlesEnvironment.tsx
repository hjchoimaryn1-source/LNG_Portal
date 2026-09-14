// src/components/portal/utils/subProcessTitlesEnvironment.tsx
// Phase 11b Stage 2-A — Environmental & Waste Management (NP-10) title entries.
import React from 'react';
import { Wrench } from 'lucide-react';
import type { SubProcessTitleEntry } from './subProcessTitleTypes';

export const SUBPROCESS_TITLES_ENVIRONMENT: Record<string, SubProcessTitleEntry> = {
  ENVIRONMENT_HUB: {
    location: 'Environment & Waste (NP-10)',
    process: 'Hub Overview',
    icon: <Wrench className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  ENVIRONMENT_AIR_WATER_NOISE: {
    location: 'Environment & Waste (NP-10)',
    process: 'Air / Water / Noise Monitoring',
    icon: <Wrench className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  ENVIRONMENT_WASTE_TRANSFER: {
    location: 'Environment & Waste (NP-10)',
    process: 'Waste Transfer Log',
    icon: <Wrench className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  ENVIRONMENT_THWS_INVENTORY: {
    location: 'Environment & Waste (NP-10)',
    process: 'THWS Inventory',
    icon: <Wrench className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
};
