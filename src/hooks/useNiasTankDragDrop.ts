// src/hooks/useNiasTankDragDrop.ts
import { useState } from 'react';
import { ActiveBayState } from '../types/lng';
import { NiasTankAsset, NiasZone } from '../components/locations/NiasTerminalView';

export interface UseNiasTankDragDropOptions {
  activeBays: ActiveBayState[];
  tankInventory: NiasTankAsset[];
  setTankInventory: React.Dispatch<React.SetStateAction<NiasTankAsset[]>>;
  moveTankLocation: (
    tankNo: string,
    targetZone: string,
    slotNumber?: number,
    metadata?: any
  ) => void;
  mountTankToBay: (bayId: string, tankNo: string) => void;
  unmountBay: (bayId: string) => void;
  setEventStream?: React.Dispatch<
    React.SetStateAction<
      Array<{ id: string; time: string; text: string; tag: string; tagColor: string }>
    >
  >;
  setToastMessage?: (msg: string | null) => void;
  getRackTag?: (bayId: string) => string;
}

export function useNiasTankDragDrop({
  activeBays,
  tankInventory,
  setTankInventory,
  moveTankLocation,
  mountTankToBay,
  unmountBay,
  setEventStream,
  setToastMessage,
  getRackTag,
}: UseNiasTankDragDropOptions) {
  const [draggingTankNo, setDraggingTankNo] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  const defaultGetRackTag = (bayId: string): string => {
    if (bayId.includes('1') || bayId.toLowerCase().includes('01')) return 'T-201';
    if (bayId.includes('2') || bayId.toLowerCase().includes('02')) return 'T-202';
    if (bayId.includes('3') || bayId.toLowerCase().includes('03')) return 'T-203';
    if (bayId.includes('4') || bayId.toLowerCase().includes('04')) return 'T-204';
    return bayId;
  };

  const resolveRackTag = getRackTag || defaultGetRackTag;

  const handleDragStart = (e: React.DragEvent, tankNo: string, fromZone: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ tankNo, fromZone }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggingTankNo(tankNo);
  };

  const handleDragEnd = () => {
    setDraggingTankNo(null);
    setDragOverTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTarget !== targetId) {
      setDragOverTarget(targetId);
    }
  };

  const handleDragLeave = (targetId: string) => {
    if (dragOverTarget === targetId) {
      setDragOverTarget(null);
    }
  };

  const handleDropToZone = (
    tankNo: string,
    targetZone: string,
    slotNumber?: number
  ) => {
    if (!tankNo) return;
    moveTankLocation(tankNo, targetZone, slotNumber);

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (setEventStream) {
      setEventStream((prev) => [
        {
          id: `ev-${Date.now()}`,
          time: nowTime,
          text: `[${tankNo}] Drag & drop relocated to ${targetZone}${slotNumber ? ` (Slot ${slotNumber})` : ''}`,
          tag: 'DND_MOVE',
          tagColor: 'text-slate-950 font-bold',
        },
        ...prev,
      ]);
    }

    if (setToastMessage) {
      setToastMessage(`✅ ${tankNo} relocated to ${targetZone}${slotNumber ? ` (Slot ${slotNumber})` : ''}`);
      setTimeout(() => setToastMessage(null), 3000);
    }
    setDraggingTankNo(null);
    setDragOverTarget(null);
  };

  const handleDropToYard = (
    tankNo: string,
    targetYard: 'Laydown 1' | 'Laydown 2' | 'Laydown 3',
    slotIdx?: number
  ) => {
    handleDropToZone(tankNo, targetYard, slotIdx ? slotIdx + 1 : undefined);
  };

  const handleDropToBay = (tankNo: string, bayId: string) => {
    handleDropToZone(tankNo, bayId);
  };

  const handleDrop = (
    e: React.DragEvent,
    targetZone: 'LAYDOWN_1' | 'LAYDOWN_2' | 'FOUR_BAY_REGAS' | 'LAYDOWN_3',
    slotNumber?: number,
    bayId?: string
  ) => {
    e.preventDefault();
    setDragOverTarget(null);
    setDraggingTankNo(null);

    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (!dataStr) return;
      const { tankNo } = JSON.parse(dataStr);
      if (!tankNo) return;

      if (targetZone === 'FOUR_BAY_REGAS' && bayId) {
        const bayZoneKey = bayId.replace(' ', '_').toUpperCase() as NiasZone;
        setTankInventory((prev) =>
          prev.map((t) => (t.id === tankNo ? { ...t, currentZone: bayZoneKey } : t))
        );
        mountTankToBay(bayId, tankNo);
        if (setToastMessage) {
          setToastMessage(`Mounted ${tankNo} to ${resolveRackTag(bayId)} for Regasification`);
          setTimeout(() => setToastMessage(null), 3000);
        }
        return;
      }

      if (targetZone === 'LAYDOWN_1') {
        const occupiedBay = activeBays.find((b) => b.tankNo === tankNo);
        if (occupiedBay) {
          unmountBay(occupiedBay.bayId);
        }
        setTankInventory((prev) =>
          prev.map((t) =>
            t.id === tankNo ? { ...t, currentZone: 'LAYDOWN_1', slotIndex: slotNumber || t.slotIndex } : t
          )
        );
        moveTankLocation(tankNo, 'Laydown 1', slotNumber);
        if (setToastMessage) {
          setToastMessage(`Relocated ${tankNo} to ORU (LD-1)${slotNumber ? ` (Slot #${slotNumber})` : ''}`);
          setTimeout(() => setToastMessage(null), 3000);
        }
        return;
      }

      if (targetZone === 'LAYDOWN_2' || targetZone === 'LAYDOWN_3') {
        const occupiedBay = activeBays.find((b) => b.tankNo === tankNo);
        if (occupiedBay) {
          unmountBay(occupiedBay.bayId);
        }
        setTankInventory((prev) =>
          prev.map((t) =>
            t.id === tankNo ? { ...t, currentZone: 'LAYDOWN_2', slotIndex: slotNumber || t.slotIndex } : t
          )
        );
        moveTankLocation(tankNo, 'Laydown 2', slotNumber);
        if (setToastMessage) {
          setToastMessage(`Relocated ${tankNo} to ORU (LD-2)${slotNumber ? ` (Slot #${slotNumber})` : ''}`);
          setTimeout(() => setToastMessage(null), 3000);
        }
        return;
      }
    } catch (err) {
      console.error('Failed to parse drag payload:', err);
    }
  };

  return {
    draggingTankNo,
    draggedTankNo: draggingTankNo,
    setDraggingTankNo,
    setDraggedTankNo: setDraggingTankNo,
    dragOverTarget,
    setDragOverTarget,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDropToZone,
    handleDropToYard,
    handleDropToBay,
  };
}
