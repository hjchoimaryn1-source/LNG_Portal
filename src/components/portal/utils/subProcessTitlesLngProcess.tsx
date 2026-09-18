// src/components/portal/utils/subProcessTitlesLngProcess.tsx
import React from 'react';
import { Building2, Ship, MapPin, Database, Wrench, Globe, Activity, ClipboardList, Sliders, ShieldCheck } from 'lucide-react';
import type { SubProcessTitleEntry } from './subProcessTitleTypes';

export const SUBPROCESS_TITLES_LNG_PROCESS: Record<string, SubProcessTitleEntry> = {
  LNG_PROCESS_OVERVIEW: {
    location: 'LNG-Process',
    process: 'Overview',
    icon: <Activity className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  NIAS_TERMINAL_OVERVIEW: {
    location: 'LNG-Process',
    process: 'Overview',
    icon: <Activity className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  'terminal-overview': {
    location: 'LNG-Process',
    process: 'Overview',
    icon: <Activity className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  ARUN_LOADING_COQ: {
    location: 'LNG-Process',
    process: 'PAGT ( Arun ) > Loading Operations',
    icon: <Building2 className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  ARUN_MASTER_HISTORY: {
    location: 'LNG-Process',
    process: 'PAGT ( Arun ) > Master History Archive',
    icon: <Building2 className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  ARUN_HEEL_BOG_LOSS: {
    location: 'LNG-Process',
    process: 'PAGT ( Arun ) > Heel & BOG Loss',
    icon: <Building2 className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  SAVIOUR_VOYAGE_MONITORING: {
    location: 'LNG-Process',
    process: 'Marine Transit > Voyage Monitoring',
    icon: <Ship className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  SAVIOUR_MARINE_PRESSURE: {
    location: 'LNG-Process',
    process: 'Marine Transit > Marine Pressure Log',
    icon: <Ship className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  NIAS_TANK_OVERVIEW: {
    location: 'LNG-Process',
    process: 'Nias Tank Yard > Overview & Yard Map',
    icon: <Building2 className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  NIAS_LAYDOWN_1_2_LOG: {
    location: 'LNG-Process',
    process: 'Nias Tank Yard > Laydown 1 Log & BOG',
    icon: <MapPin className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  NIAS_ACTIVE_BAY_TANKS: {
    location: 'LNG-Process',
    process: 'Nias Tank Yard > Active Bay Mounted Tanks',
    icon: <Activity className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  NIAS_LAYDOWN_3_HEEL: {
    location: 'LNG-Process',
    process: 'Nias Tank Yard > Laydown 2 (Heel 4%)',
    icon: <MapPin className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  NIAS_GAS_PROCESS_TELEMETRY: {
    location: 'LNG-Process',
    process: 'Regas & Gas Process > Gas Process Telemetry',
    icon: <Activity className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  NIAS_PATROL_LOG: {
    location: 'LNG-Process',
    process: 'Regas & Gas Process > Patrol Log',
    icon: <Activity className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  NIAS_GAS_METERING_DAILY: {
    location: 'LNG-Process',
    process: 'Regas & Gas Process > Gas Metering (Daily)',
    icon: <Activity className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  NIAS_PLTMG_POWER_OUTPUT: {
    location: 'LNG-Process',
    process: 'PLTMG Power > Power & Output',
    icon: <Activity className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  NIAS_HEAT_SETTLEMENT: {
    location: 'LNG-Process',
    process: 'Regas & Gas Process > Monthly Report (PLN EPI)',
    icon: <Activity className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  DAILY_OPS_ISO_TANK_LOGISTICS: {
    location: 'LNG-Process',
    process: 'ISO Tank Logistics',
    icon: <Activity className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  DAILY_OPS_ELECTRICAL_SYSTEM: {
    location: 'LNG-Process',
    process: 'Electrical System',
    icon: <Activity className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  DAILY_OPS_OVERVIEW: {
    location: 'LNG-Process',
    process: 'Daily Ops Overview',
    icon: <Activity className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  MAINTENANCE_MRO_HUB: {
    location: 'Work Order & Maintenance',
    process: 'MRO Depot',
    icon: <Wrench className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  MRO_PARTS_INVENTORY: {
    location: 'LNG-Process',
    process: 'MRO Depot > Parts Inventory & Stock Ledger',
    icon: <Wrench className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  GLOBAL_FLEET_HUB: {
    location: 'Equipment & Asset Registry',
    process: 'Global 120-Fleet Hub',
    icon: <Globe className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  DATA_INGESTION_HUB: {
    location: 'Equipment & Asset Registry',
    process: 'CSV Ingestion Hub',
    icon: <Database className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  EQUIPMENT_ASSET_REGISTRY: {
    location: 'Equipment & Asset Registry',
    process: 'All Assets Directory',
    icon: <ClipboardList className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  WORK_ORDER_MAINTENANCE: {
    location: 'Work Order & Maintenance',
    process: 'PMS Preventive Maintenance Ledger',
    icon: <Sliders className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
  CALIBRATION_COMPLIANCE: {
    location: 'Calibration & Compliance',
    process: 'Regulatory Instrumentation Audit Certs',
    icon: <ShieldCheck className="w-3.5 h-3.5 text-black font-bold" />,
    color: 'text-black font-bold',
  },
};
