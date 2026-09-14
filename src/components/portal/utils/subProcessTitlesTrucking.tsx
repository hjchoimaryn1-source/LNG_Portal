// src/components/portal/utils/subProcessTitlesTrucking.tsx
// Phase 11a Stage 2-A — Trucking & Logistics (NP-03) title entries.
import React from 'react';
import { Truck } from 'lucide-react';
import type { SubProcessTitleEntry } from './subProcessTitleTypes';

export const SUBPROCESS_TITLES_TRUCKING: Record<string, SubProcessTitleEntry> = {
  TRUCKING_HUB: {
    location: 'Trucking & Logistics (NP-03)',
    process: 'Hub Overview',
    icon: <Truck className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  TRUCKING_PRE_OP: {
    location: 'Trucking & Logistics (NP-03)',
    process: 'Pre-Op Checklist',
    icon: <Truck className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  TRUCKING_PERIODIC_INSPECTION: {
    location: 'Trucking & Logistics (NP-03)',
    process: 'Periodic Inspection',
    icon: <Truck className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  TRUCKING_TRAFFIC_MGMT: {
    location: 'Trucking & Logistics (NP-03)',
    process: 'Traffic Mgmt Verification',
    icon: <Truck className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  TRUCKING_POST_TRANSIT: {
    location: 'Trucking & Logistics (NP-03)',
    process: 'Post-Transit Report',
    icon: <Truck className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
};
