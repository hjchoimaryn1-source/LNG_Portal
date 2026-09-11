// src/components/locations/nias/constants/niasEventStreamSeed.ts

export interface NiasEventStreamEntry {
  id: string;
  time: string;
  text: string;
  tag: string;
  tagColor: string;
}

// Daily Operations & BOG Event Stream Ticker — initial seed data.
// Extracted verbatim from NiasTerminalView (lines 353-382).
export const NIAS_EVENT_STREAM_SEED: NiasEventStreamEntry[] = [
  {
    id: 'ev-1',
    time: '11:45',
    text: '[ISOT-017] Standby hookup verified on Bay 03 (0.78 MPa holding pressure)',
    tag: 'STANDBY',
    tagColor: 'text-slate-950 font-bold',
  },
  {
    id: 'ev-2',
    time: '09:30',
    text: '[ISOT-009] Controlled BOG depressurization completed (0.80 ➔ 0.73 MPa, loss: 426 kg)',
    tag: 'DEPRESS',
    tagColor: 'text-slate-950 font-bold',
  },
  {
    id: 'ev-3',
    time: '08:15',
    text: '[ISOT-086] Reallocated from Laydown 1 Buffer to Laydown 2 for venting',
    tag: 'TRANSFER',
    tagColor: 'text-slate-950 font-bold',
  },
  {
    id: 'ev-4',
    time: '07:40',
    text: '[ISOT-064] Depleted heel tank staged for Empty Return cycle (4% residual)',
    tag: 'HEEL',
    tagColor: 'text-slate-950 font-bold',
  },
];
