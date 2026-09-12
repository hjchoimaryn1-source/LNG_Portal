// src/data/ptwWorkAreas.ts
// PPE Matrix hazard-zone classification list and Plant Work Location master.
// Source: NIAS_NP-09 App 01 PPE Matrix Guidance.docx (PPE Matrix Table,
// "Area / Area" column). English names quoted verbatim from the source; the
// Indonesian half after "/" is intentionally dropped for this UI field.

export const PTW_WORK_AREAS = [
  'All Site Areas',
  'ISO Tank Movement & Unloading Area',
  'ISO Tank & Buffer Tank Storage Area',
  'LNG Cryogenic Pump & Piping Area',
  'Air Ambient Vaporizer & BOG Compressor Area',
  'Pressure Safety Valve (PSV) Vent Stack Area',
  'Control Valve & Instrumentation Area',
  'Electrical System (MCC, Panels)',
  'Fire & Gas System',
  'DCS and ESD System (Control Room)',
  'Non-Routine / High Risk Tasks',
] as const;

export type PTWWorkArea = (typeof PTW_WORK_AREAS)[number];

// Simplified Plant Work Locations
export const PLANT_WORK_LOCATIONS = [
  'Vaporizer Area',
  'BOG Compressor Area',
  'LNG ISO Tank Storage Area',
  'LNG ISO Tank Unloading Area',
  'Gas Metering Area',
  'Vent Stack Area',
  'Electrical MCC & Substation',
  'DCS / Control Room',
  'Jetty Area',
] as const;

export type PlantWorkLocation = (typeof PLANT_WORK_LOCATIONS)[number];

// Mapping from Plant Work Location to cascaded Safety & PPE Zones (NP-09 App 01)
export const LOCATION_TO_PPE_ZONES: Record<PlantWorkLocation, PTWWorkArea[]> = {
  'Vaporizer Area': ['Air Ambient Vaporizer & BOG Compressor Area', 'All Site Areas'],
  'BOG Compressor Area': ['Air Ambient Vaporizer & BOG Compressor Area', 'All Site Areas'],
  'LNG ISO Tank Storage Area': ['ISO Tank & Buffer Tank Storage Area', 'All Site Areas'],
  'LNG ISO Tank Unloading Area': [
    'ISO Tank Movement & Unloading Area',
    'LNG Cryogenic Pump & Piping Area',
    'All Site Areas',
  ],
  'Gas Metering Area': ['Control Valve & Instrumentation Area', 'All Site Areas'],
  'Vent Stack Area': ['Pressure Safety Valve (PSV) Vent Stack Area', 'All Site Areas'],
  'Electrical MCC & Substation': ['Electrical System (MCC, Panels)', 'All Site Areas'],
  'DCS / Control Room': ['DCS and ESD System (Control Room)', 'All Site Areas'],
  'Jetty Area': ['LNG Cryogenic Pump & Piping Area', 'All Site Areas'],
};
