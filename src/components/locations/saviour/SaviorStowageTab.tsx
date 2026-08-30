// src/components/locations/saviour/SaviorStowageTab.tsx
"use client";

import React, { useState, useMemo } from 'react';
import {
  Layers,
  Box,
  Anchor,
  CheckCircle2,
  Package,
  MapPin,
  Search,
  Radio,
  XCircle,
} from 'lucide-react';
import { OFFICIAL_SAVIOUR_BAY_PLAN_120, SERIAL_TO_ISOT_MAP } from '../../../utils/saviourBayPlanData';

interface SaviorStowageTabProps {
  onSuccessToast?: (msg: string) => void;
}

export interface BaySlotData {
  id: string;
  locationKey: string;
  bay: string;
  tier: string;
  row: string;
  deckMode: 'ON_DECK' | 'CARGO_HOLD';
  slotType: 'LADEN' | 'STANDBY' | 'EMPTY_SLOT' | 'CRANE' | 'DISABLED_HULL' | 'SOLID_BALLAST';
  craneName?: string;
  tankNo: string;
  serialNo: string;
  pressureMPa: number;
  tempC: number;
  heelVolM3: number;
  netMassKg: number;
  mmbtu: number;
  bogLossPctDay: number;
}

export interface StagingTank {
  tankNo: string;
  serialNo: string;
  yard: 'ARUN' | 'NIAS';
  status: 'LADEN' | 'EMPTY';
  pressureMPa: number;
  tempC: number;
  volumeM3: number;
  massTon: number;
  origin: string;
}

const BAYS = ['BAY 21', 'BAY 19', 'BAY 17', 'BAY 15', 'BAY 13', 'BAY 11', 'BAY 09', 'BAY 07', 'BAY 05', 'BAY 03', 'BAY 01'];
const ROWS = ['ROW 06', 'ROW 04', 'ROW 02', 'ROW 00/01', 'ROW 03', 'ROW 05'];

// The 21 Shore Inventory ISOT IDs
const SHORE_21_ISOT_SET = new Set([
  // Arun Yard (10)
  'ISOT-007', 'ISOT-018', 'ISOT-052', 'ISOT-053', 'ISOT-060',
  'ISOT-074', 'ISOT-081', 'ISOT-083', 'ISOT-097', 'ISOT-110',
  // Nias Yard (11)
  'ISOT-009', 'ISOT-014', 'ISOT-017', 'ISOT-026', 'ISOT-031',
  'ISOT-036', 'ISOT-064', 'ISOT-086', 'ISOT-088', 'ISOT-103', 'ISOT-120',
]);

// The 21 Shore Inventory Serials (Digits)
const SHORE_21_SERIAL_DIGITS = new Set([
  // Arun Yard (10 Units)
  '8101386', // ISOT-007
  '8101597', // ISOT-018
  '8102187', // ISOT-052
  '8102192', // ISOT-053
  '8102438', // ISOT-060
  '8103563', // ISOT-074
  '8103650', // ISOT-081
  '8103671', // ISOT-083
  '8111002', // ISOT-097
  '8111614', // ISOT-110
  // Nias Yard (11 Units)
  '8101426', // ISOT-009
  '8101513', // ISOT-014
  '8101581', // ISOT-017
  '8101750', // ISOT-026
  '8101848', // ISOT-031
  '8101909', // ISOT-036
  '8102567', // ISOT-064
  '8103711', // ISOT-086
  '8103732', // ISOT-088
  '8111297', // ISOT-103
  '8113176', // ISOT-120
]);

const formatStandardSerial = (raw: string): string => {
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits.length === 7) {
    return `SIMU ${digits.slice(0, 6)} ${digits.slice(6)}`;
  }
  return raw;
};

const getIsotNumberFromSerial = (raw: string): string => {
  const digits = raw.replace(/[^0-9]/g, '');
  return SERIAL_TO_ISOT_MAP[digits] || `ISOT-${digits.slice(-3)}`;
};

// Precise check if a tank belongs to the 21 shore yard pool
const isShoreInventoryTank = (tankNo?: string, serialNo?: string): boolean => {
  if (tankNo && SHORE_21_ISOT_SET.has(tankNo)) return true;
  if (serialNo) {
    const digits = serialNo.replace(/[^0-9]/g, '');
    if (SHORE_21_SERIAL_DIGITS.has(digits)) return true;
    const derivedIsot = getIsotNumberFromSerial(serialNo);
    if (SHORE_21_ISOT_SET.has(derivedIsot)) return true;
  }
  return false;
};

// Helper to check if slot is disabled due to vessel hull narrowing at bow/stern
const isSlotDisabledByHull = (bay: string, row: string): boolean => {
  if (row === 'ROW 06' && (bay === 'BAY 21' || bay === 'BAY 19' || bay === 'BAY 09' || bay === 'BAY 01')) {
    return true;
  }
  if (row === 'ROW 05' && (bay === 'BAY 21' || bay === 'BAY 19' || bay === 'BAY 01')) {
    return true;
  }
  return false;
};

// Initializer: Exactly 99 Onboard Tanks Loaded as EMPTY HEEL ('STANDBY') & 21 Shore Slots Kept as EMPTY_SLOT
const buildInitialStowageMap = (): Record<string, BaySlotData> => {
  const map: Record<string, BaySlotData> = {};
  const allModes: Array<{ mode: 'ON_DECK' | 'CARGO_HOLD'; tiers: string[] }> = [
    { mode: 'ON_DECK', tiers: ['Tier 86', 'Tier 84', 'Tier 82'] },
    { mode: 'CARGO_HOLD', tiers: ['Tier 06', 'Tier 04', 'Tier 02'] },
  ];

  // 1. Initialize base layout with slots, cranes, disabled hull, and ballast
  allModes.forEach(({ mode, tiers }) => {
    tiers.forEach((tier) => {
      BAYS.forEach((bay) => {
        ROWS.forEach((row) => {
          const key = `${mode}-${bay}-${tier}-${row}`;
          const shortTier = tier.replace('Tier ', 'T');
          const shortBay = bay.replace('BAY ', 'B');
          const shortRow = row.replace('ROW ', 'R').replace('00/01', '01');
          const locationKey = `${shortTier}-${shortBay}-${shortRow}`;

          // Hull narrowing
          if (isSlotDisabledByHull(bay, row)) {
            map[key] = {
              id: key,
              locationKey,
              bay,
              tier,
              row,
              deckMode: mode,
              slotType: 'DISABLED_HULL',
              tankNo: '',
              serialNo: '',
              pressureMPa: 0,
              tempC: 0,
              heelVolM3: 0,
              netMassKg: 0,
              mmbtu: 0,
              bogLossPctDay: 0,
            };
            return;
          }

          // Solid Ballast Tier 02 (46 Individual Concrete Blocks)
          if (tier === 'Tier 02') {
            map[key] = {
              id: key,
              locationKey,
              bay,
              tier,
              row,
              deckMode: mode,
              slotType: 'SOLID_BALLAST',
              tankNo: 'BALLAST',
              serialNo: 'SOLID',
              pressureMPa: 0,
              tempC: 0,
              heelVolM3: 0,
              netMassKg: 30000,
              mmbtu: 0,
              bogLossPctDay: 0,
            };
            return;
          }

          // Cranes at Bay 15 and Bay 07 Row 06
          if (bay === 'BAY 07' && row === 'ROW 06') {
            map[key] = {
              id: key,
              locationKey,
              bay,
              tier,
              row,
              deckMode: mode,
              slotType: 'CRANE',
              craneName: 'CRANE 1 (45T)',
              tankNo: 'CRANE 1',
              serialNo: 'CRANE 1 (45T)',
              pressureMPa: 0,
              tempC: 0,
              heelVolM3: 0,
              netMassKg: 0,
              mmbtu: 0,
              bogLossPctDay: 0,
            };
            return;
          }

          if (bay === 'BAY 15' && row === 'ROW 06') {
            map[key] = {
              id: key,
              locationKey,
              bay,
              tier,
              row,
              deckMode: mode,
              slotType: 'CRANE',
              craneName: 'CRANE 2 (45T)',
              tankNo: 'CRANE 2',
              serialNo: 'CRANE 2 (45T)',
              pressureMPa: 0,
              tempC: 0,
              heelVolM3: 0,
              netMassKg: 0,
              mmbtu: 0,
              bogLossPctDay: 0,
            };
            return;
          }

          // Default empty slot
          map[key] = {
            id: key,
            locationKey,
            bay,
            tier,
            row,
            deckMode: mode,
            slotType: 'EMPTY_SLOT',
            tankNo: '',
            serialNo: '',
            pressureMPa: 0,
            tempC: 0,
            heelVolM3: 0,
            netMassKg: 0,
            mmbtu: 0,
            bogLossPctDay: 0,
          };
        });
      });
    });
  });

  // 2. Map all 120 records from Excel: exactly 99 onboard as EMPTY HEEL ('STANDBY'), 21 shore as EMPTY_SLOT
  OFFICIAL_SAVIOUR_BAY_PLAN_120.forEach((record) => {
    // If this slot corresponds to one of the 21 shore inventory units, leave it as EMPTY_SLOT
    if (isShoreInventoryTank(record.tankNo, record.serialNo)) {
      return;
    }

    const key = `${record.deckMode}-${record.bay}-${record.tier}-${record.row}`;
    if (map[key] && map[key].slotType !== 'DISABLED_HULL' && map[key].slotType !== 'CRANE') {
      const realTankNo = getIsotNumberFromSerial(record.serialNo);
      // Double check derived ISOT
      if (SHORE_21_ISOT_SET.has(realTankNo)) {
        return;
      }

      const realSerialNo = formatStandardSerial(record.serialNo);

      map[key] = {
        ...map[key],
        slotType: 'STANDBY', // Default to EMPTY HEEL (공탱크 / 회송 힐)
        tankNo: realTankNo,
        serialNo: realSerialNo,
        pressureMPa: 0.28,
        tempC: -124.5,
        heelVolM3: 0.95,
        netMassKg: 420,
        mmbtu: 22.5,
        bogLossPctDay: 0.01,
      };
    }
  });

  return map;
};

// Initial Real Yard Staging Pool (21 Total Units: 10 in Arun Yard + 11 in Nias Yard)
const buildInitialYardStagingPool = (): StagingTank[] => {
  return [
    // =========================================================================
    // 1. ARUN YARD (10 Real Units - Priority Loading Targets)
    // =========================================================================
    { tankNo: 'ISOT-007', serialNo: 'SIMU 810138 6', yard: 'ARUN', status: 'LADEN', pressureMPa: 0.77, tempC: -126.8, volumeM3: 40.9, massTon: 18.1, origin: 'Arun PAG Storage Yard' },
    { tankNo: 'ISOT-018', serialNo: 'SIMU 810159 7', yard: 'ARUN', status: 'LADEN', pressureMPa: 0.76, tempC: -126.5, volumeM3: 40.9, massTon: 18.1, origin: 'Arun PAG Storage Yard' },
    { tankNo: 'ISOT-052', serialNo: 'SIMU 810218 7', yard: 'ARUN', status: 'LADEN', pressureMPa: 0.78, tempC: -126.9, volumeM3: 40.9, massTon: 18.1, origin: 'Arun PAG Storage Yard' },
    { tankNo: 'ISOT-053', serialNo: 'SIMU 810219 2', yard: 'ARUN', status: 'LADEN', pressureMPa: 0.77, tempC: -126.6, volumeM3: 40.9, massTon: 18.1, origin: 'Arun PAG Storage Yard' },
    { tankNo: 'ISOT-060', serialNo: 'SIMU 810243 8', yard: 'ARUN', status: 'LADEN', pressureMPa: 0.75, tempC: -126.7, volumeM3: 40.9, massTon: 18.1, origin: 'Arun PAG Storage Yard' },
    { tankNo: 'ISOT-074', serialNo: 'SIMU 810356 3', yard: 'ARUN', status: 'LADEN', pressureMPa: 0.76, tempC: -126.4, volumeM3: 40.9, massTon: 18.1, origin: 'Arun PAG Storage Yard' },
    { tankNo: 'ISOT-081', serialNo: 'SIMU 810365 0', yard: 'ARUN', status: 'LADEN', pressureMPa: 0.78, tempC: -126.8, volumeM3: 40.9, massTon: 18.1, origin: 'Arun PAG Storage Yard' },
    { tankNo: 'ISOT-083', serialNo: 'SIMU 810367 1', yard: 'ARUN', status: 'LADEN', pressureMPa: 0.77, tempC: -126.5, volumeM3: 40.9, massTon: 18.1, origin: 'Arun PAG Storage Yard' },
    { tankNo: 'ISOT-097', serialNo: 'SIMU 811100 2', yard: 'ARUN', status: 'LADEN', pressureMPa: 0.76, tempC: -126.7, volumeM3: 40.9, massTon: 18.1, origin: 'Arun PAG Storage Yard' },
    { tankNo: 'ISOT-110', serialNo: 'SIMU 811161 4', yard: 'ARUN', status: 'LADEN', pressureMPa: 0.77, tempC: -126.6, volumeM3: 40.9, massTon: 18.1, origin: 'Arun PAG Storage Yard' },

    // =========================================================================
    // 2. NIAS YARD (11 Real Units - Laydown Stock & Empty Return Buffer)
    // =========================================================================
    { tankNo: 'ISOT-009', serialNo: 'SIMU 810142 6', yard: 'NIAS', status: 'LADEN', pressureMPa: 0.76, tempC: -126.5, volumeM3: 40.9, massTon: 18.1, origin: 'Nias Laydown Yard 1' },
    { tankNo: 'ISOT-014', serialNo: 'SIMU 810151 3', yard: 'NIAS', status: 'LADEN', pressureMPa: 0.77, tempC: -126.7, volumeM3: 40.9, massTon: 18.1, origin: 'Nias Laydown Yard 1' },
    { tankNo: 'ISOT-017', serialNo: 'SIMU 810158 1', yard: 'NIAS', status: 'LADEN', pressureMPa: 0.75, tempC: -126.8, volumeM3: 40.9, massTon: 18.1, origin: 'Nias Laydown Yard 1' },
    { tankNo: 'ISOT-026', serialNo: 'SIMU 810175 0', yard: 'NIAS', status: 'LADEN', pressureMPa: 0.78, tempC: -126.4, volumeM3: 40.9, massTon: 18.1, origin: 'Nias Laydown Yard 1' },
    { tankNo: 'ISOT-031', serialNo: 'SIMU 810184 8', yard: 'NIAS', status: 'LADEN', pressureMPa: 0.76, tempC: -126.6, volumeM3: 40.9, massTon: 18.1, origin: 'Nias Laydown Yard 1' },
    { tankNo: 'ISOT-036', serialNo: 'SIMU 810190 9', yard: 'NIAS', status: 'LADEN', pressureMPa: 0.77, tempC: -126.5, volumeM3: 40.9, massTon: 18.1, origin: 'Nias Laydown Yard 1' },
    { tankNo: 'ISOT-086', serialNo: 'SIMU 810371 1', yard: 'NIAS', status: 'LADEN', pressureMPa: 0.75, tempC: -126.9, volumeM3: 40.9, massTon: 18.1, origin: 'Nias Laydown Yard 1' },
    { tankNo: 'ISOT-088', serialNo: 'SIMU 810373 2', yard: 'NIAS', status: 'LADEN', pressureMPa: 0.78, tempC: -126.4, volumeM3: 40.9, massTon: 18.1, origin: 'Nias Laydown Yard 1' },
    { tankNo: 'ISOT-103', serialNo: 'SIMU 811129 7', yard: 'NIAS', status: 'LADEN', pressureMPa: 0.77, tempC: -126.7, volumeM3: 40.9, massTon: 18.1, origin: 'Nias Laydown Yard 1' },
    { tankNo: 'ISOT-120', serialNo: 'SIMU 811317 6', yard: 'NIAS', status: 'LADEN', pressureMPa: 0.76, tempC: -126.8, volumeM3: 40.9, massTon: 18.1, origin: 'Nias Laydown Yard 1' },
    { tankNo: 'ISOT-064', serialNo: 'SIMU 810256 7', yard: 'NIAS', status: 'EMPTY', pressureMPa: 0.28, tempC: -124.5, volumeM3: 0.9, massTon: 0.4, origin: 'Nias Laydown Yard 2' },
  ];
};

export default function SaviorStowageTab({
  onSuccessToast,
}: SaviorStowageTabProps) {
  // Master Stowage Slots State & Staging Pool State
  const [stowageSlots, setStowageSlots] = useState<Record<string, BaySlotData>>(() => buildInitialStowageMap());
  const [stagingPool, setStagingPool] = useState<StagingTank[]>(() => buildInitialYardStagingPool());

  // Left Staging Pool Yard Tab: ARUN vs NIAS
  const [activeYardTab, setActiveYardTab] = useState<'ARUN' | 'NIAS'>('ARUN');

  // Drag & Drop State
  const [draggedItem, setDraggedItem] = useState<{
    source: 'POOL' | 'SLOT';
    tankNo: string;
    serialNo: string;
    status: 'LADEN' | 'STANDBY';
    fromSlotKey?: string;
  } | null>(null);
  const [hoveredDropSlotKey, setHoveredDropSlotKey] = useState<string | null>(null);

  // 1-Level View Controls: Deck Mode (ON_DECK vs CARGO_HOLD)
  const [deckViewMode, setDeckViewMode] = useState<'ON_DECK' | 'CARGO_HOLD'>('ON_DECK');

  // 2-Level View Controls: Single Tier Selection Sub-Tab Bar
  const [selectedTier, setSelectedTier] = useState<string>('Tier 86');

  // Selected Tank State for Telemetry Modal
  const [selectedSlotModal, setSelectedSlotModal] = useState<BaySlotData | null>(null);

  // Staging Pool Search
  const [poolSearch, setPoolSearch] = useState<string>('');

  // Handle Level 1 Deck Mode Switch
  const handleDeckModeChange = (mode: 'ON_DECK' | 'CARGO_HOLD') => {
    setDeckViewMode(mode);
    if (mode === 'ON_DECK') {
      setSelectedTier('Tier 86');
    } else {
      setSelectedTier('Tier 06');
    }
  };

  // Filtered Staging Tanks Pool (Split by active yard tab: Arun vs Nias)
  const filteredStagingPool = useMemo(() => {
    return stagingPool.filter((tank) => {
      if (tank.yard !== activeYardTab) return false;

      if (poolSearch) {
        const q = poolSearch.toLowerCase().trim();
        return (
          tank.tankNo.toLowerCase().includes(q) ||
          tank.serialNo.toLowerCase().includes(q) ||
          tank.origin.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [stagingPool, activeYardTab, poolSearch]);

  // Yard Counts summary
  const yardCounts = useMemo(() => {
    const arunCount = stagingPool.filter((t) => t.yard === 'ARUN').length;
    const niasCount = stagingPool.filter((t) => t.yard === 'NIAS').length;
    return { arunCount, niasCount, totalCount: stagingPool.length };
  }, [stagingPool]);

  // Tier-by-Tier Granular Breakdown for KPI Cards
  const tierCounts = useMemo(() => {
    const allSlots = Object.values(stowageSlots);

    const getCounts = (mode: string, tier: string) => {
      const slots = allSlots.filter((s) => s.deckMode === mode && s.tier === tier);
      const laden = slots.filter((s) => s.slotType === 'LADEN').length;
      const emptyHeel = slots.filter((s) => s.slotType === 'STANDBY' && !isShoreInventoryTank(s.tankNo, s.serialNo)).length;
      const emptySlot = slots.filter((s) => s.slotType === 'EMPTY_SLOT' || isShoreInventoryTank(s.tankNo, s.serialNo)).length;
      return { laden, emptyHeel, emptySlot, totalOnboard: laden + emptyHeel };
    };

    const t86 = getCounts('ON_DECK', 'Tier 86');
    const t84 = getCounts('ON_DECK', 'Tier 84');
    const t82 = getCounts('ON_DECK', 'Tier 82');
    const totalOnDeckOnboard = t86.totalOnboard + t84.totalOnboard + t82.totalOnboard;
    const totalOnDeckLaden = t86.laden + t84.laden + t82.laden;
    const totalOnDeckEmpty = t86.emptyHeel + t84.emptyHeel + t82.emptyHeel;

    const t06 = getCounts('CARGO_HOLD', 'Tier 06');
    const t04 = getCounts('CARGO_HOLD', 'Tier 04');
    const totalHoldOnboard = t06.totalOnboard + t04.totalOnboard;
    const totalHoldLaden = t06.laden + t04.laden;
    const totalHoldEmpty = t06.emptyHeel + t04.emptyHeel;

    const totalOnboard = totalOnDeckOnboard + totalHoldOnboard;
    const totalLaden = totalOnDeckLaden + totalHoldLaden;
    const totalEmptyHeel = totalOnDeckEmpty + totalHoldEmpty;

    return {
      t86,
      t84,
      t82,
      totalOnDeckOnboard,
      totalOnDeckLaden,
      totalOnDeckEmpty,
      t06,
      t04,
      totalHoldOnboard,
      totalHoldLaden,
      totalHoldEmpty,
      totalOnboard,
      totalLaden,
      totalEmptyHeel,
    };
  }, [stowageSlots]);

  // Slot click handler for details modal
  const handleSlotClick = (slot: BaySlotData) => {
    if (slot.slotType === 'CRANE' || slot.slotType === 'DISABLED_HULL' || slot.slotType === 'SOLID_BALLAST') return;
    setSelectedSlotModal(slot);
  };

  // =========================================================================
  // DRAG AND DROP HANDLERS (LOADING & DISCHARGING)
  // =========================================================================

  const handleDragStartFromPool = (e: React.DragEvent, tank: StagingTank) => {
    setDraggedItem({
      source: 'POOL',
      tankNo: tank.tankNo,
      serialNo: tank.serialNo,
      status: tank.status === 'LADEN' ? 'LADEN' : 'STANDBY',
    });
    e.dataTransfer.setData('text/plain', tank.tankNo);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragStartFromSlot = (e: React.DragEvent, slot: BaySlotData) => {
    if (slot.slotType === 'CRANE' || slot.slotType === 'DISABLED_HULL' || slot.slotType === 'SOLID_BALLAST') return;
    setDraggedItem({
      source: 'SLOT',
      tankNo: slot.tankNo,
      serialNo: slot.serialNo,
      status: slot.slotType === 'LADEN' ? 'LADEN' : 'STANDBY',
      fromSlotKey: slot.id,
    });
    e.dataTransfer.setData('text/plain', slot.tankNo);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverSlot = (e: React.DragEvent, slotKey: string) => {
    e.preventDefault();
    const targetSlot = stowageSlots[slotKey];
    if (targetSlot && targetSlot.slotType !== 'CRANE' && targetSlot.slotType !== 'DISABLED_HULL' && targetSlot.slotType !== 'SOLID_BALLAST') {
      e.dataTransfer.dropEffect = 'move';
      if (hoveredDropSlotKey !== slotKey) {
        setHoveredDropSlotKey(slotKey);
      }
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  // Loading tank into vessel slot
  const handleDropOnSlot = (e: React.DragEvent, targetSlotKey: string) => {
    e.preventDefault();
    setHoveredDropSlotKey(null);
    if (!draggedItem) return;

    const targetSlot = stowageSlots[targetSlotKey];
    if (!targetSlot || targetSlot.slotType === 'CRANE' || targetSlot.slotType === 'DISABLED_HULL' || targetSlot.slotType === 'SOLID_BALLAST') {
      return;
    }

    if (draggedItem.source === 'POOL') {
      // Remove loaded tank from yard pool
      setStagingPool((prev) => prev.filter((t) => t.serialNo !== draggedItem.serialNo && t.tankNo !== draggedItem.tankNo));

      // If target slot had a tank, displace it to the active yard pool
      if (targetSlot.serialNo && targetSlot.slotType !== 'EMPTY_SLOT') {
        const displacedTank: StagingTank = {
          tankNo: targetSlot.tankNo || getIsotNumberFromSerial(targetSlot.serialNo),
          serialNo: targetSlot.serialNo,
          yard: activeYardTab,
          status: targetSlot.slotType === 'LADEN' ? 'LADEN' : 'EMPTY',
          pressureMPa: targetSlot.pressureMPa || 0.28,
          tempC: targetSlot.tempC || -124.5,
          volumeM3: targetSlot.heelVolM3 || 0.9,
          massTon: (targetSlot.netMassKg || 400) / 1000,
          origin: `${activeYardTab === 'ARUN' ? 'Arun PAG Yard' : 'Nias Laydown Yard'} (Discharged from ${targetSlot.locationKey})`,
        };
        setStagingPool((prev) => [displacedTank, ...prev]);
      }

      setStowageSlots((prev) => ({
        ...prev,
        [targetSlotKey]: {
          ...prev[targetSlotKey],
          tankNo: draggedItem.tankNo,
          serialNo: draggedItem.serialNo,
          slotType: draggedItem.status === 'LADEN' ? 'LADEN' : 'STANDBY',
          pressureMPa: draggedItem.status === 'LADEN' ? 0.77 : 0.28,
          tempC: draggedItem.status === 'LADEN' ? -126.8 : -124.5,
          heelVolM3: draggedItem.status === 'LADEN' ? 40.9 : 0.9,
          netMassKg: draggedItem.status === 'LADEN' ? 18100 : 400,
        },
      }));

      if (onSuccessToast) onSuccessToast(`Loaded ${draggedItem.tankNo} (${draggedItem.serialNo}) to ${targetSlot.locationKey}`);
    }

    if (draggedItem.source === 'SLOT' && draggedItem.fromSlotKey) {
      if (draggedItem.fromSlotKey === targetSlotKey) {
        setDraggedItem(null);
        return;
      }

      const sourceSlot = stowageSlots[draggedItem.fromSlotKey];
      if (!sourceSlot) return;

      setStowageSlots((prev) => ({
        ...prev,
        [targetSlotKey]: {
          ...prev[targetSlotKey],
          tankNo: sourceSlot.tankNo,
          serialNo: sourceSlot.serialNo,
          slotType: sourceSlot.slotType,
          pressureMPa: sourceSlot.pressureMPa,
          tempC: sourceSlot.tempC,
          heelVolM3: sourceSlot.heelVolM3,
          netMassKg: sourceSlot.netMassKg,
        },
        [draggedItem.fromSlotKey!]: {
          ...prev[draggedItem.fromSlotKey!],
          tankNo: targetSlot.tankNo,
          serialNo: targetSlot.serialNo,
          slotType: targetSlot.slotType,
          pressureMPa: targetSlot.pressureMPa,
          tempC: targetSlot.tempC,
          heelVolM3: targetSlot.heelVolM3,
          netMassKg: targetSlot.netMassKg,
        },
      }));

      if (onSuccessToast) onSuccessToast(`Moved ${sourceSlot.locationKey} <-> ${targetSlot.locationKey}`);
    }

    setDraggedItem(null);
  };

  // Discharging tank from vessel slot to active Yard Pool (Arun or Nias)
  const handleDropOnPool = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.source !== 'SLOT' || !draggedItem.fromSlotKey) return;

    const sourceSlot = stowageSlots[draggedItem.fromSlotKey];
    if (!sourceSlot || !sourceSlot.serialNo) return;

    const returnedTank: StagingTank = {
      tankNo: sourceSlot.tankNo || getIsotNumberFromSerial(sourceSlot.serialNo),
      serialNo: sourceSlot.serialNo,
      yard: activeYardTab,
      status: sourceSlot.slotType === 'LADEN' ? 'LADEN' : 'EMPTY',
      pressureMPa: sourceSlot.pressureMPa || 0.28,
      tempC: sourceSlot.tempC || -124.5,
      volumeM3: sourceSlot.heelVolM3 || 0.9,
      massTon: (sourceSlot.netMassKg || 400) / 1000,
      origin: `${activeYardTab === 'ARUN' ? 'Arun PAG Yard' : 'Nias Laydown Yard'} (Discharged from ${sourceSlot.locationKey})`,
    };

    setStagingPool((prev) => [returnedTank, ...prev]);

    setStowageSlots((prev) => ({
      ...prev,
      [draggedItem.fromSlotKey!]: {
        ...prev[draggedItem.fromSlotKey!],
        tankNo: '',
        serialNo: '',
        slotType: 'EMPTY_SLOT',
        pressureMPa: 0,
        tempC: 0,
        heelVolM3: 0,
        netMassKg: 0,
      },
    }));

    if (onSuccessToast) onSuccessToast(`Discharged ${sourceSlot.tankNo} (${sourceSlot.serialNo}) to ${activeYardTab === 'ARUN' ? 'Arun Yard' : 'Nias Yard'}`);
    setDraggedItem(null);
  };

  return (
    <div className="space-y-2.5 animate-in fade-in duration-200 select-none font-mono w-full">
      {/* ========================================================================= */}
      {/* 1. 4 TIER-BY-TIER LOADED QUANTITY KPI CARDS                                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 font-mono">
        
        {/* Card 1: ON-DECK SUMMARY */}
        <div className="bg-[#e8e4dc] border border-[#8a8579] rounded-xs overflow-hidden shadow-xs flex flex-col justify-between">
          <div className="bg-[#1e293b] text-white px-2.5 py-1.5 flex items-center justify-between border-b border-[#334155]">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-white flex items-center gap-1 no-underline">
              <Layers className="w-3.5 h-3.5 text-cyan-300" />
              ON-DECK SUMMARY
            </span>
            <span className="text-[9px] font-black font-mono px-1.5 py-0.2 bg-[#002b4d] text-cyan-300 border border-blue-800 rounded-xs">
              {tierCounts.totalOnDeckOnboard} / 78 ONBOARD
            </span>
          </div>

          <div className="p-2 flex flex-col justify-center space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 border-b border-[#c8c2b5] pb-0.5">
              <span className="text-slate-600">TIER 86 (TOP):</span>
              <span className="font-black text-slate-900 bg-white px-1.5 py-0.2 rounded-xs border border-slate-300">
                {tierCounts.t86.totalOnboard} Units ({tierCounts.t86.emptyHeel} Heel{tierCounts.t86.laden > 0 ? ` / ${tierCounts.t86.laden} Laden` : ''})
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 border-b border-[#c8c2b5] pb-0.5">
              <span className="text-slate-600">TIER 84 (MID):</span>
              <span className="font-black text-slate-900 bg-white px-1.5 py-0.2 rounded-xs border border-slate-300">
                {tierCounts.t84.totalOnboard} Units ({tierCounts.t84.emptyHeel} Heel{tierCounts.t84.laden > 0 ? ` / ${tierCounts.t84.laden} Laden` : ''})
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
              <span className="text-slate-600">TIER 82 (MAIN):</span>
              <span className="font-black text-slate-900 bg-white px-1.5 py-0.2 rounded-xs border border-slate-300">
                {tierCounts.t82.totalOnboard} Units ({tierCounts.t82.emptyHeel} Heel{tierCounts.t82.laden > 0 ? ` / ${tierCounts.t82.laden} Laden` : ''})
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: CARGO HOLD SUMMARY */}
        <div className="bg-[#e8e4dc] border border-[#8a8579] rounded-xs overflow-hidden shadow-xs flex flex-col justify-between">
          <div className="bg-[#1e293b] text-white px-2.5 py-1.5 flex items-center justify-between border-b border-[#334155]">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-white flex items-center gap-1 no-underline">
              <Box className="w-3.5 h-3.5 text-cyan-300" />
              CARGO HOLD SUMMARY
            </span>
            <span className="text-[9px] font-black font-mono px-1.5 py-0.2 bg-[#002b4d] text-cyan-300 border border-blue-800 rounded-xs">
              {tierCounts.totalHoldOnboard} / 42 ONBOARD
            </span>
          </div>

          <div className="p-2 flex flex-col justify-center space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 border-b border-[#c8c2b5] pb-0.5">
              <span className="text-slate-600">TIER 06 (UPPER):</span>
              <span className="font-black text-slate-900 bg-white px-1.5 py-0.2 rounded-xs border border-slate-300">
                {tierCounts.t06.totalOnboard} Units ({tierCounts.t06.emptyHeel} Heel{tierCounts.t06.laden > 0 ? ` / ${tierCounts.t06.laden} Laden` : ''})
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 border-b border-[#c8c2b5] pb-0.5">
              <span className="text-slate-600">TIER 04 (MID):</span>
              <span className="font-black text-slate-900 bg-white px-1.5 py-0.2 rounded-xs border border-slate-300">
                {tierCounts.t04.totalOnboard} Units ({tierCounts.t04.emptyHeel} Heel{tierCounts.t04.laden > 0 ? ` / ${tierCounts.t04.laden} Laden` : ''})
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
              <span>HOLD STATUS:</span>
              <span className="text-slate-700 font-black">EMPTY HEEL RETENTION</span>
            </div>
          </div>
        </div>

        {/* Card 3: SOLID BALLAST BASE (1,380T) */}
        <div className="bg-[#e8e4dc] border border-[#8a8579] rounded-xs overflow-hidden shadow-xs flex flex-col justify-between">
          <div className="bg-[#1e293b] text-white px-2.5 py-1.5 flex items-center justify-between border-b border-[#334155]">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-white flex items-center gap-1 no-underline">
              <Anchor className="w-3.5 h-3.5 text-cyan-300" />
              SOLID BALLAST BASE
            </span>
            <span className="text-[9px] font-black font-mono px-1.5 py-0.2 bg-[#0f172a] text-slate-200 border border-slate-600 rounded-xs">
              TIER 02
            </span>
          </div>

          <div className="p-2 flex flex-col justify-center space-y-0.5 text-center">
            <span className="text-base font-black text-slate-900 block leading-tight no-underline">
              46 CONCRETE BLOCKS
            </span>
            <span className="text-[10.5px] font-bold text-slate-600 block no-underline">
              1,380.0 TONS FIXED WEIGHT
            </span>
            <div className="pt-1 mt-0.5 border-t border-[#c8c2b5] text-[9.5px] font-bold text-slate-500 no-underline">
              Keel Counterweight Matrix (46 Fixed Slots)
            </div>
          </div>
        </div>

        {/* Card 4: FLEET STOWAGE TOTAL */}
        <div className="bg-[#f0f7ff] border border-[#7ba4cc] rounded-xs overflow-hidden shadow-xs flex flex-col justify-between">
          <div className="bg-[#1e293b] text-white px-2.5 py-1.5 flex items-center justify-between border-b border-[#334155]">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-white flex items-center gap-1 no-underline">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300" />
              FLEET STOWAGE TOTAL
            </span>
            <span className={`text-[9px] font-black font-mono px-1.5 py-0.2 rounded-xs border ${
              tierCounts.totalLaden > 0 ? 'bg-[#064e3b] text-emerald-300 border-emerald-500' : 'bg-[#002b4d] text-cyan-300 border border-blue-800'
            }`}>
              {tierCounts.totalLaden > 0 ? `${tierCounts.totalLaden} LADEN LOADED` : 'EMPTY HEEL BASELINE'}
            </span>
          </div>

          <div className="p-2 flex flex-col justify-center space-y-0.5 text-center">
            <span className="text-lg sm:text-xl font-black text-[#002b4d] block leading-tight no-underline">
              ONBOARD HEEL: {tierCounts.totalOnboard} / 120 UNITS
            </span>
            <span className="text-[10.5px] font-bold text-[#004a99] block no-underline">
              {tierCounts.totalEmptyHeel} Empty Heel Onboard &bull; 21 in Shore Yards
            </span>
            <div className="pt-1 mt-0.5 border-t border-[#b8d2eb] text-[9.5px] font-bold text-[#004a99] no-underline">
              Arun 10 &amp; Nias 11 Standby in Yard Pools
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. 2-PANEL BLUEPRINT VIEW (LEFT: 250px COMPACT / RIGHT: 100% FLUID)        */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row gap-2.5 items-start w-full animate-in fade-in duration-150">
        
        {/* ===================================================================== */}
        {/* LEFT PANEL: YARD STAGING POOL (ARUN 10 UNITS / NIAS 11 UNITS)         */}
        {/* ===================================================================== */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }}
          onDrop={handleDropOnPool}
          className="w-full lg:w-[250px] shrink-0 bg-white border border-slate-700 rounded-xs shadow-sm overflow-hidden flex flex-col"
        >
          {/* Staging Pool Header */}
          <div className="bg-[#334155] text-white p-2 flex items-center justify-between border-b border-[#1e293b]">
            <div className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-200 no-underline">
                YARD POOL (SHORE)
              </span>
            </div>
            <span className="text-[9px] font-bold font-mono px-1.5 py-0.2 bg-[#d4d0c8] text-slate-900 border border-slate-500 rounded-xs">
              {yardCounts.totalCount} UNITS
            </span>
          </div>

          {/* 2-TAB TOGGLE: ARUN (10) vs NIAS (11) (Classic Gray 3D Buttons) */}
          <div className="p-1.5 bg-[#334155] border-b border-slate-700 space-y-1.5">
            <div className="grid grid-cols-2 gap-1 font-mono">
              <button
                type="button"
                onClick={() => setActiveYardTab('ARUN')}
                className={`flex items-center justify-center gap-1 py-1 px-1 text-[10.5px] rounded-xs transition-all cursor-pointer no-underline ${
                  activeYardTab === 'ARUN'
                    ? 'bg-[#c8c4bc] text-slate-950 font-black border-t-2 border-l-2 border-slate-700 border-b border-r border-white shadow-inner'
                    : 'bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-800 font-bold border-t border-l border-white border-b-2 border-r-2 border-slate-600 shadow-xs'
                }`}
              >
                <MapPin className="w-3 h-3 text-slate-700" />
                <span className="no-underline">ARUN ({yardCounts.arunCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveYardTab('NIAS')}
                className={`flex items-center justify-center gap-1 py-1 px-1 text-[10.5px] rounded-xs transition-all cursor-pointer no-underline ${
                  activeYardTab === 'NIAS'
                    ? 'bg-[#c8c4bc] text-slate-950 font-black border-t-2 border-l-2 border-slate-700 border-b border-r border-white shadow-inner'
                    : 'bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-800 font-bold border-t border-l border-white border-b-2 border-r-2 border-slate-600 shadow-xs'
                }`}
              >
                <MapPin className="w-3 h-3 text-slate-700" />
                <span className="no-underline">NIAS ({yardCounts.niasCount})</span>
              </button>
            </div>

            {/* Search Bar (White Background) */}
            <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-xs border border-slate-400 shadow-inner">
              <Search className="w-3 h-3 text-slate-500 shrink-0" />
              <input
                type="text"
                placeholder={`Search ${activeYardTab === 'ARUN' ? 'Arun' : 'Nias'}...`}
                value={poolSearch}
                onChange={(e) => setPoolSearch(e.target.value)}
                className="w-full bg-transparent text-[11px] font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none no-underline"
              />
            </div>
          </div>

          {/* Draggable Staging Tank Cards List */}
          <div className="p-1 space-y-1 max-h-[480px] overflow-y-auto custom-scada-scrollbar bg-[#f1f5f9]">
            {filteredStagingPool.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-[10.5px] font-bold px-2 no-underline">
                No tanks in {activeYardTab === 'ARUN' ? 'Arun Yard' : 'Nias Yard'}. (Drag from vessel to discharge here).
              </div>
            ) : (
              filteredStagingPool.map((tank, idx) => {
                return (
                  <div
                    key={`${tank.tankNo}-${tank.serialNo}-${idx}`}
                    draggable={true}
                    onDragStart={(e) => handleDragStartFromPool(e, tank)}
                    className="group px-1.5 py-1 bg-white hover:bg-cyan-50/70 border border-[#8b9aa8] hover:border-cyan-500 rounded-xs shadow-xs cursor-grab active:cursor-grabbing transition-all flex items-center justify-between gap-1.5 hover:ring-1 hover:ring-cyan-400 select-none no-underline"
                    title={`Drag ${tank.tankNo} (${tank.serialNo}) to vessel to load`}
                  >
                    <span className="text-[10px] font-black font-mono text-[#002b4d] bg-slate-100 group-hover:bg-cyan-100 px-1 py-0.2 rounded-2xs border border-slate-300 group-hover:border-cyan-300 shrink-0 no-underline">
                      {tank.tankNo}
                    </span>
                    <span className="text-[10.5px] font-black font-mono text-slate-900 group-hover:text-blue-950 tracking-tight text-center truncate no-underline">
                      {tank.serialNo}
                    </span>
                    <span className={`text-[8px] font-black px-1 py-0.2 rounded-2xs border shrink-0 no-underline ${
                      tank.status === 'LADEN' ? 'bg-sky-100 text-sky-900 border-sky-300' : 'bg-slate-100 text-slate-600 border-slate-300'
                    }`}>
                      {tank.status === 'LADEN' ? 'LADEN' : 'EMPTY'}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Drop Zone Footer Note (Dark Slate Gray #334155 Theme) */}
          <div className="p-1.5 bg-[#334155] border-t border-slate-600 text-center text-[9.5px] font-bold text-slate-200 no-underline">
            Drag to ship to load &bull; Drag here to discharge ({activeYardTab})
          </div>
        </div>

        {/* ===================================================================== */}
        {/* RIGHT PANEL: FULL FLUID 100% RESPONSIVE VESSEL GRID                   */}
        {/* ===================================================================== */}
        <div className="flex-1 min-w-0 w-full space-y-2">
          
          {/* 2-Stage Controller Bar (Industrial Dark Slate Theme #334155 with Classic Gray 3D Buttons) */}
          <div className="bg-[#334155] p-1.5 rounded-xs border border-slate-700 space-y-1 select-none">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Stage 1: Deck Mode */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-200 uppercase tracking-tight font-mono no-underline">LOCATION:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDeckModeChange('ON_DECK')}
                      className={`px-2.5 py-1 text-xs rounded-xs transition-all cursor-pointer font-mono no-underline ${
                        deckViewMode === 'ON_DECK'
                          ? 'bg-[#c8c4bc] text-slate-950 font-black border-t-2 border-l-2 border-slate-700 border-b border-r border-white shadow-inner'
                          : 'bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-800 font-bold border-t border-l border-white border-b-2 border-r-2 border-slate-600 shadow-xs'
                      }`}
                    >
                      [ ON DECK (78) ]
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeckModeChange('CARGO_HOLD')}
                      className={`px-2.5 py-1 text-xs rounded-xs transition-all cursor-pointer font-mono no-underline ${
                        deckViewMode === 'CARGO_HOLD'
                          ? 'bg-[#c8c4bc] text-slate-950 font-black border-t-2 border-l-2 border-slate-700 border-b border-r border-white shadow-inner'
                          : 'bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-800 font-bold border-t border-l border-white border-b-2 border-r-2 border-slate-600 shadow-xs'
                      }`}
                    >
                      [ CARGO HOLD (42) ]
                    </button>
                  </div>
                </div>

                {/* Stage 2: Tier Selection */}
                <div className="flex items-center gap-1.5 border-l border-slate-500 pl-2.5">
                  <span className="text-[11px] font-semibold text-slate-200 uppercase tracking-tight font-mono no-underline">TIER:</span>
                  <div className="flex items-center gap-1">
                    {deckViewMode === 'ON_DECK' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedTier('Tier 86')}
                          className={`px-2 py-0.5 text-xs rounded-xs transition-all cursor-pointer font-mono no-underline ${
                            selectedTier === 'Tier 86'
                              ? 'bg-[#c8c4bc] text-slate-950 font-black border-t-2 border-l-2 border-slate-700 border-b border-r border-white shadow-inner'
                              : 'bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-800 font-bold border-t border-l border-white border-b-2 border-r-2 border-slate-600 shadow-xs'
                          }`}
                        >
                          [ TIER 86 ]
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedTier('Tier 84')}
                          className={`px-2 py-0.5 text-xs rounded-xs transition-all cursor-pointer font-mono no-underline ${
                            selectedTier === 'Tier 84'
                              ? 'bg-[#c8c4bc] text-slate-950 font-black border-t-2 border-l-2 border-slate-700 border-b border-r border-white shadow-inner'
                              : 'bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-800 font-bold border-t border-l border-white border-b-2 border-r-2 border-slate-600 shadow-xs'
                          }`}
                        >
                          [ TIER 84 ]
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedTier('Tier 82')}
                          className={`px-2 py-0.5 text-xs rounded-xs transition-all cursor-pointer font-mono no-underline ${
                            selectedTier === 'Tier 82'
                              ? 'bg-[#c8c4bc] text-slate-950 font-black border-t-2 border-l-2 border-slate-700 border-b border-r border-white shadow-inner'
                              : 'bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-800 font-bold border-t border-l border-white border-b-2 border-r-2 border-slate-600 shadow-xs'
                          }`}
                        >
                          [ TIER 82 ]
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedTier('Tier 06')}
                          className={`px-2 py-0.5 text-xs rounded-xs transition-all cursor-pointer font-mono no-underline ${
                            selectedTier === 'Tier 06'
                              ? 'bg-[#c8c4bc] text-slate-950 font-black border-t-2 border-l-2 border-slate-700 border-b border-r border-white shadow-inner'
                              : 'bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-800 font-bold border-t border-l border-white border-b-2 border-r-2 border-slate-600 shadow-xs'
                          }`}
                        >
                          [ TIER 06 ]
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedTier('Tier 04')}
                          className={`px-2 py-0.5 text-xs rounded-xs transition-all cursor-pointer font-mono no-underline ${
                            selectedTier === 'Tier 04'
                              ? 'bg-[#c8c4bc] text-slate-950 font-black border-t-2 border-l-2 border-slate-700 border-b border-r border-white shadow-inner'
                              : 'bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-800 font-bold border-t border-l border-white border-b-2 border-r-2 border-slate-600 shadow-xs'
                          }`}
                        >
                          [ TIER 04 ]
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedTier('Tier 02')}
                          className={`px-2 py-0.5 text-xs rounded-xs transition-all cursor-pointer font-mono no-underline ${
                            selectedTier === 'Tier 02'
                              ? 'bg-[#c8c4bc] text-slate-950 font-black border-t-2 border-l-2 border-slate-700 border-b border-r border-white shadow-inner'
                              : 'bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-800 font-bold border-t border-l border-white border-b-2 border-r-2 border-slate-600 shadow-xs'
                          }`}
                        >
                          [ TIER 02 (BALLAST) ]
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Stowage Status Pill (Classic Gray 3D) */}
              <div className="flex items-center gap-1.5 font-mono">
                <div className={`flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-xs shadow-xs no-underline ${
                  tierCounts.totalLaden > 0
                    ? 'bg-[#064e3b] text-emerald-300 border border-emerald-500 font-black'
                    : 'bg-[#d4d0c8] text-slate-900 border-t border-l border-white border-b-2 border-r-2 border-slate-600 font-black'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{tierCounts.totalLaden > 0 ? `LADEN (${tierCounts.totalLaden} / 120)` : `ONBOARD HEEL (${tierCounts.totalOnboard} / 120)`}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Vessel Hull Container (100% Fluid Width, No Horizontal Scrollbar) */}
          <div className="bg-white border border-[#475569] rounded-xs p-1.5 shadow-sm w-full overflow-hidden">
            <div className="w-full border border-[#475569] rounded-l-xs rounded-r-[24px] bg-[#f8fafc] flex items-stretch shadow-inner overflow-hidden relative select-none">
              
              {/* A. LEFT (STERN / AFT): Compact Bridge Header */}
              <div className="w-14 shrink-0 bg-[#e2e8f0] border-r border-[#475569] border-l-2 border-l-[#475569] p-1 flex flex-col justify-between items-center text-center font-mono rounded-l-xs">
                <span className="px-1 py-0.2 bg-[#334155] text-white text-[7.5px] font-black tracking-wider rounded-2xs block no-underline">
                  AFT
                </span>
                <div className="space-y-0.5 my-auto">
                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight block no-underline">
                    BRIDGE
                  </span>
                  <span className="text-[7.5px] font-bold text-slate-500 block no-underline">
                    PEAK
                  </span>
                </div>
                <span className="text-[7px] text-slate-400 font-bold no-underline">FR 00</span>
              </div>

              {/* B. MIDDLE: MAIN TOP-DOWN CARGO BAY CANVAS OR SOLID BALLAST GRID */}
              <div className="flex-1 min-w-0 bg-white p-1.5 flex flex-col justify-between space-y-1 overflow-hidden">
                <div className="flex justify-between items-center text-[10.5px] font-mono font-bold text-slate-700 border-b border-[#8b9aa8] pb-0.5 px-0.5">
                  <span className="no-underline">▲ PORT SIDE (Row 06, 04, 02)</span>
                  <span className="text-blue-900 font-black uppercase text-[10.5px] no-underline">
                    {deckViewMode} &bull; {selectedTier} &bull; {selectedTier === 'Tier 02' ? 'FIXED SOLID BALLAST (46 BLOCKS)' : `${tierCounts.totalOnboard} ONBOARD TANKS`}
                  </span>
                </div>

                {/* FLUID RESPONSIVE TABLE WITH STANDARD BAY/ROW GRID (TIER 02 & ALL TIERS) */}
                <div className="w-full overflow-hidden py-0.5">
                  <table className="w-full table-fixed text-center border-collapse text-xs font-mono">
                    <thead>
                      <tr className="bg-[#4e5d6e] text-white border-b border-[#8b9aa8] font-black">
                        <th className="py-1 px-0.5 w-12 border-r border-[#8b9aa8] text-center bg-[#3e4d5e] text-[9px] no-underline">
                          ROW
                        </th>
                        {BAYS.map((bay) => (
                          <th key={bay} className="py-1 px-0.5 border-r border-[#8b9aa8] font-black text-white text-[9.5px] truncate no-underline">
                            {bay.replace('BAY ', 'B')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#8b9aa8]">
                      {ROWS.map((row, rIdx) => {
                        const isPort = rIdx < 3;
                        const isCenter = row === 'ROW 00/01';

                        return (
                          <tr key={row} className={isCenter ? 'bg-blue-50/60 border-y border-blue-400' : ''}>
                            <td className={`py-1 px-0.5 font-mono font-bold text-[8.5px] border-r border-[#8b9aa8] text-center truncate no-underline ${
                              isPort ? 'text-blue-900 bg-blue-50/50' : isCenter ? 'text-slate-900 font-black bg-blue-100/60' : 'text-emerald-900 bg-emerald-50/50'
                            }`}>
                              <span className="block font-black no-underline">{row.replace('ROW ', 'R')}</span>
                            </td>

                            {BAYS.map((bay) => {
                              const key = `${deckViewMode}-${bay}-${selectedTier}-${row}`;
                              const slot = stowageSlots[key];

                              if (!slot) {
                                return (
                                  <td key={key} className="p-0.5 border-r border-[#8b9aa8]">
                                    <div className="w-full h-[40px] flex items-center justify-center text-slate-400 text-[9px] no-underline">—</div>
                                  </td>
                                );
                              }

                              if (slot.slotType === 'DISABLED_HULL') {
                                return (
                                  <td key={key} className="p-0.5 opacity-0 pointer-events-none">
                                    <div className="w-full h-[40px]" />
                                  </td>
                                );
                              }

                              if (slot.slotType === 'CRANE') {
                                return (
                                  <td key={key} className="p-0.5 border-r border-[#8b9aa8]">
                                    <div className="w-full h-[40px] border border-amber-500 bg-amber-500/10 text-amber-900 font-black text-[9px] flex items-center justify-center text-center shadow-xs rounded-2xs font-mono pointer-events-none truncate no-underline">
                                      CRANE 45T
                                    </div>
                                  </td>
                                );
                              }

                              // TIER 02 SOLID BALLAST INDIVIDUAL CELL WITH ELEGANT CROSS & "SOLID" TEXT
                              if (slot.slotType === 'SOLID_BALLAST') {
                                return (
                                  <td key={key} className="p-0.5 border-r border-[#8b9aa8] text-center">
                                    <div
                                      className="relative w-full h-[40px] rounded-2xs border border-[#475569] bg-[#1e293b] flex items-center justify-center text-center cursor-not-allowed select-none overflow-hidden"
                                      title={`[${slot.locationKey}] Solid Concrete Ballast Block (30.0T Fixed Counterweight)`}
                                    >
                                      {/* Background Diagonal X Cross Lines */}
                                      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30 stroke-slate-400" preserveAspectRatio="none" viewBox="0 0 100 100">
                                        <line x1="0" y1="0" x2="100" y2="100" strokeWidth="2.5" />
                                        <line x1="100" y1="0" x2="0" y2="100" strokeWidth="2.5" />
                                      </svg>

                                      {/* Centered Clean "SOLID" Text */}
                                      <span className="relative z-10 font-mono text-[11px] font-bold text-slate-300 tracking-wider no-underline drop-shadow-xs">
                                        SOLID
                                      </span>
                                    </div>
                                  </td>
                                );
                              }

                              const isShoreTank = isShoreInventoryTank(slot.tankNo, slot.serialNo);
                              const isLaden = slot.slotType === 'LADEN';
                              const hasTank = Boolean(slot.serialNo && slot.slotType !== 'EMPTY_SLOT' && !isShoreTank);
                              const isDropTarget = hoveredDropSlotKey === key;

                              return (
                                <td
                                  key={key}
                                  onDragOver={(e) => handleDragOverSlot(e, key)}
                                  onDrop={(e) => handleDropOnSlot(e, key)}
                                  className="p-0.5 border-r border-[#8b9aa8] text-center"
                                >
                                  {hasTank ? (
                                    /* 40ft ISO TANK 3D WIDE RECTANGULAR CYLINDER GRAPHIC */
                                    <div
                                      draggable={true}
                                      onDragStart={(e) => handleDragStartFromSlot(e, slot)}
                                      onClick={() => handleSlotClick(slot)}
                                      className={`relative w-full h-[40px] p-0.5 rounded-2xs border text-center transition-all select-none cursor-grab active:cursor-grabbing flex items-center justify-center no-underline ${
                                        isDropTarget
                                          ? 'bg-cyan-300 border-cyan-500 ring-2 ring-cyan-500 scale-105 shadow-md z-20'
                                          : isLaden
                                          ? 'bg-[#061e38] border-cyan-500 shadow-sm hover:border-cyan-300 hover:ring-1 hover:ring-cyan-300'
                                          : 'bg-[#0f172a] border-slate-600 shadow-xs hover:border-slate-400 hover:ring-1 hover:ring-slate-400'
                                      }`}
                                      title={`[${slot.locationKey}] ${slot.tankNo} • ${slot.serialNo} • ${isLaden ? 'LADEN LNG' : 'EMPTY HEEL'}`}
                                    >
                                      {/* Steel Corner Castings */}
                                      <div className="absolute top-0 left-0 w-1.5 h-1 bg-slate-400 border-r border-b border-slate-700 pointer-events-none" />
                                      <div className="absolute top-0 right-0 w-1.5 h-1 bg-slate-400 border-l border-b border-slate-700 pointer-events-none" />
                                      <div className="absolute bottom-0 left-0 w-1.5 h-1 bg-slate-400 border-r border-t border-slate-700 pointer-events-none" />
                                      <div className="absolute bottom-0 right-0 w-1.5 h-1 bg-slate-400 border-l border-t border-slate-700 pointer-events-none" />

                                      {/* Wide Rectangular Cylindrical Tank (No truncation, generous text space) */}
                                      <div
                                        className={`relative w-full h-[32px] rounded-2xs border-y border-x-2 flex flex-col justify-center items-center px-0.5 py-0.2 pointer-events-none no-underline ${
                                          isLaden
                                            ? 'border-cyan-300 border-x-cyan-200 shadow-[0_0_4px_rgba(56,189,248,0.35)]'
                                            : 'border-slate-400 border-x-slate-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]'
                                        }`}
                                        style={{
                                          background: isLaden
                                            ? 'linear-gradient(180deg, #e0f2fe 0%, #38bdf8 25%, #0284c7 70%, #0369a1 100%)'
                                            : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 25%, #e2e8f0 60%, #cbd5e1 90%, #94a3b8 100%)',
                                        }}
                                      >
                                        {/* Empty Heel Bottom Retention Line */}
                                        {!isLaden && (
                                          <div className="absolute bottom-0.5 inset-x-2 h-[2px] rounded-full bg-cyan-500/70 pointer-events-none" />
                                        )}

                                        {/* Row 1 (Top): TANK ID */}
                                        <span
                                          className={`font-mono text-[10px] font-bold tracking-tight leading-none truncate no-underline ${
                                            isLaden ? 'text-cyan-950 font-black' : 'text-slate-800'
                                          }`}
                                        >
                                          {slot.tankNo}
                                        </span>

                                        {/* Row 2 (Bottom): CONTAINER SERIAL NO (SIMU 810XXXX X - No clipping, tracking-tighter) */}
                                        <span
                                          className={`font-mono text-[10px] font-bold tracking-tighter leading-none mt-0.5 whitespace-nowrap no-underline ${
                                            isLaden ? 'text-white font-black drop-shadow-xs' : 'text-slate-900'
                                          }`}
                                        >
                                          {slot.serialNo}
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    /* Fluid Empty Slot Guide: [+EMPTY] */
                                    <div
                                      onClick={() => handleSlotClick(slot)}
                                      className={`w-full h-[40px] flex items-center justify-center p-0.5 rounded-2xs border border-dashed text-center transition-all no-underline ${
                                        isDropTarget
                                          ? 'bg-cyan-200 border-cyan-600 text-cyan-950 font-black ring-1 ring-cyan-400 scale-105 shadow-md'
                                          : 'border-[#475569] bg-slate-50/70 text-slate-500 hover:border-slate-500'
                                      }`}
                                      title={`[${slot.locationKey}] Empty Slot (Drag a yard tank here to load)`}
                                    >
                                      <span className="text-[9px] font-bold font-mono text-slate-500 whitespace-nowrap no-underline">
                                        {isDropTarget ? '[DROP]' : '[+EMPTY]'}
                                      </span>
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-700 border-t border-[#8b9aa8] pt-0.5 px-0.5">
                  <span className="no-underline">▼ STARBOARD SIDE (Row 01, 03, 05)</span>
                  <span className="text-blue-900 font-bold no-underline">NORMAL LOADED DRAFT: 6.20m</span>
                </div>
              </div>

              {/* C. RIGHT (BOW / FORE): Compact Curved Bow */}
              <div className="w-14 shrink-0 bg-[#e2e8f0] border-l border-[#475569] border-r-2 border-r-[#475569] p-1 flex flex-col justify-between items-center text-center font-mono rounded-r-[24px]">
                <span className="px-1 py-0.2 bg-[#334155] text-white text-[7.5px] font-black tracking-wider rounded-2xs block no-underline">
                  FORE
                </span>

                <div className="my-auto space-y-0.5 flex flex-col items-center">
                  <div className="w-5 h-8 border border-[#8b9aa8] rounded-br-full bg-white/70 flex items-center justify-center shadow-inner">
                    <Anchor className="w-3.5 h-3.5 text-slate-700" />
                  </div>
                  <span className="text-[7.5px] font-black text-slate-600 no-underline">BOW</span>
                </div>

                <span className="text-[7px] text-slate-400 font-bold no-underline">FR 120</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MARINE TANK TELEMETRY DETAIL MODAL                                     */}
      {/* ========================================================================= */}
      {selectedSlotModal && selectedSlotModal.slotType !== 'CRANE' && selectedSlotModal.slotType !== 'DISABLED_HULL' && selectedSlotModal.slotType !== 'SOLID_BALLAST' && (
        <div
          onClick={() => setSelectedSlotModal(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 font-mono"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border-2 border-[#8a8579] rounded-xs w-full max-w-lg shadow-2xl text-slate-900 overflow-hidden"
          >
            <div className="bg-[#0a2540] px-3.5 py-2.5 font-bold flex justify-between items-center text-white border-b-2 border-[#071a2e]">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-300 animate-pulse" />
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider no-underline">
                  TELEMETRY DETAIL: {selectedSlotModal.tankNo} ({selectedSlotModal.serialNo})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSlotModal(null)}
                className="text-slate-300 hover:text-white p-1 cursor-pointer font-bold"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 font-mono text-xs bg-[#f8fafc]">
              <div className="p-2 bg-white border border-[#8b9aa8] rounded-xs flex justify-between items-center shadow-xs">
                <span className="text-slate-700 font-bold no-underline">CELL LOCATION:</span>
                <span className="font-black text-blue-900 bg-blue-50 px-2 py-0.5 border border-blue-200 rounded-xs no-underline">
                  {selectedSlotModal.locationKey} &bull; {selectedSlotModal.bay} &bull; {selectedSlotModal.row} &bull; {selectedSlotModal.tier} ({selectedSlotModal.deckMode})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-800">
                <div className="p-2.5 bg-white border border-[#8b9aa8] rounded-xs space-y-1 shadow-xs">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase no-underline">TANK PRESSURE</span>
                  <div className="flex items-baseline justify-between no-underline">
                    <span className="text-base font-black text-blue-900">{selectedSlotModal.pressureMPa} MPa</span>
                    <span className="text-[10px] text-slate-600 font-bold">({(selectedSlotModal.pressureMPa * 10).toFixed(1)} barg)</span>
                  </div>
                </div>

                <div className="p-2.5 bg-white border border-[#8b9aa8] rounded-xs space-y-1 shadow-xs">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase no-underline">LIQUID TEMPERATURE</span>
                  <div className="flex items-baseline justify-between no-underline">
                    <span className="text-base font-black text-cyan-800">{selectedSlotModal.tempC} °C</span>
                    <span className="text-[10px] text-emerald-700 font-bold">{selectedSlotModal.slotType === 'LADEN' ? 'Sub-cooled' : 'Holding'}</span>
                  </div>
                </div>

                <div className="p-2.5 bg-white border border-[#8b9aa8] rounded-xs space-y-1 shadow-xs">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase no-underline">CARGO / HEEL MASS</span>
                  <div className="flex items-baseline justify-between no-underline">
                    <span className="text-base font-black text-slate-900">{selectedSlotModal.netMassKg.toLocaleString()} kg</span>
                    <span className="text-[10px] text-slate-600 font-bold">({selectedSlotModal.heelVolM3} m³)</span>
                  </div>
                </div>

                <div className="p-2.5 bg-white border border-[#8b9aa8] rounded-xs space-y-1 shadow-xs">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase no-underline">CARGO STATUS</span>
                  <div className="flex items-baseline justify-between no-underline">
                    <span className="text-base font-black text-amber-800">{selectedSlotModal.slotType === 'LADEN' ? 'LADEN LNG' : 'EMPTY HEEL'}</span>
                    <span className="text-[10px] text-slate-600 font-bold">COQ Verified</span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-white border border-[#8b9aa8] rounded-xs space-y-1.5 shadow-xs">
                <div className="flex justify-between border-b border-slate-200 pb-1 no-underline">
                  <span className="text-slate-600 font-bold">BOG Loss Monitoring:</span>
                  <span className="font-black text-emerald-700">0.01% / day (PASS - In-Spec Vacuum)</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1 no-underline">
                  <span className="text-slate-600 font-bold">Sea Passage Location:</span>
                  <span className="font-black text-blue-900">05°12'N 97°08'E (Malacca Strait)</span>
                </div>
                <div className="flex justify-between no-underline">
                  <span className="text-slate-600 font-bold">Safety Valve &amp; Outer Shell:</span>
                  <span className="font-black text-emerald-800">100% IN-SPEC (Inspected)</span>
                </div>
              </div>
            </div>

            <div className="px-4 py-2.5 bg-[#dfdbd1] border-t-2 border-[#8a8579] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSlotModal(null)}
                className="px-4 py-1 font-bold text-xs rounded-xs border-t border-l border-white border-b-2 border-r-2 border-slate-600 bg-[#d4d0c8] hover:bg-[#e0dcd4] active:bg-[#bcbaae] text-slate-900 shadow-xs transition-all cursor-pointer font-mono no-underline"
              >
                [ CLOSE ]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
