// src/components/portal/utils/subProcessTitlesMoc.tsx
// Phase 11c Stage 2-A — Management of Change (NP-12) title entries.
import React from 'react';
import { Wrench } from 'lucide-react';
import type { SubProcessTitleEntry } from './subProcessTitleTypes';

export const SUBPROCESS_TITLES_MOC: Record<string, SubProcessTitleEntry> = {
  MOC_HUB: {
    location: 'Management of Change (NP-12)',
    process: 'Hub Overview',
    icon: <Wrench className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  MOC_PLAN_OF_CHANGE: {
    location: 'Management of Change (NP-12)',
    process: 'Plan of Change',
    icon: <Wrench className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  MOC_COMPLETION_REPORT: {
    location: 'Management of Change (NP-12)',
    process: 'Completion Report',
    icon: <Wrench className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
};
