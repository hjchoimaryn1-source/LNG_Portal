// src/cmms-daily-ops/components/patrol/AavPatrolForm.tsx
//
// PURPOSE
//   AAV-102/103/105/106 4개 유닛의 순찰 입력 폼. 4개 유닛이 하나의
//   순찰 라운드(같은 shift time slot)를 공유하므로 슬롯 선택은 이 레벨에서
//   한 번만 하고, 유닛별 값/상태/저장은 AavUnitBlock이 독립적으로 관리한다.

'use client';

import { useState } from 'react';
import type { ShiftTimeSlot } from '../../types/patrolLog';
import { ShiftSlotSelector } from './ShiftSlotSelector';
import { AavUnitBlock } from './AavUnitBlock';
import type { PatrolSaveHandler } from './patrolFormTypes';

export const AAV_EQUIPMENT_TAGS = ['AAV-102', 'AAV-103', 'AAV-105', 'AAV-106'];

export interface AavPatrolFormProps {
  onSave: PatrolSaveHandler;
}

export function AavPatrolForm({ onSave }: AavPatrolFormProps) {
  const [shiftTimeSlot, setShiftTimeSlot] = useState<ShiftTimeSlot>('08:00');

  return (
    <div className="space-y-3">
      <ShiftSlotSelector activeSlot={shiftTimeSlot} onSelect={setShiftTimeSlot} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {AAV_EQUIPMENT_TAGS.map((tag) => (
          <AavUnitBlock key={tag} equipmentTag={tag} shiftTimeSlot={shiftTimeSlot} onSave={onSave} />
        ))}
      </div>
    </div>
  );
}
