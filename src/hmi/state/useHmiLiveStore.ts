// src/hmi/state/useHmiLiveStore.ts
//
// PURPOSE
//   useDailyOpsPatrolStore.ts(B2) 위에 얹는 파생 레이어 — 원본 스토어 파일은
//   1바이트도 건드리지 않는다. 원본이 export하는 단일 컬럼 구독 훅
//   (useDailyOpsPatrolValue)만 여러 번 호출해서 장비 1개의 여러 컬럼을
//   HmiEquipmentSnapshot 하나로 조합한다.
//
//   DEVIATION (HMI-1b 재정의, HJ 지시 채택):
//   - useHmiAllEquipment()는 두지 않는다. 원본 스토어는 전체 열거/구독 API를
//     export하지 않고(내부 Map/리스너 비공개) 원본 수정은 금지돼 있어,
//     "전체 스냅샷 구독"은 불가능 — 대신 배지 단위 개별 구독(PidTagBadge.tsx가
//     자신의 equipmentTag로 useHmiEquipment 호출)으로 대체한다.
//   - readingStatus는 항상 'other' 고정. DailyOpsDataContext.tsx가 초기
//     하이드레이션 시 PatrolEntry.readingStatus를 버리고 values(컬럼값)만
//     스토어에 넣으므로, 클라이언트 스토어엔 애초에 reading_status가 없다.
//     실제 배선은 스토어가 reading_status도 들고 다니도록 확장하는 별도
//     스테이지 몫.
//   - instrumentType은 항상 'OTHER' 고정 — patrolFieldMaps.ts에 계기 종류
//     매핑이 없다. displayName도 equipmentTag를 그대로 쓴다(표시명 레지스트리
//     부재).
//   - Rules-of-Hooks: 도메인별 컬럼 수가 2~15개로 다르므로(patrolFieldMaps.ts
//     기준 gc가 최대 15개), useDailyOpsPatrolValue를 조건/루프 없이 슬롯
//     15개로 펼쳐 고정 호출한다 — 컬럼이 없는 슬롯은 빈 컬럼명('')으로
//     무해하게 조회하고 버린다. 도메인이 늘어 최대 컬럼 수가 15를 넘으면
//     MAX_FIELD_SLOTS와 슬롯 호출을 함께 늘릴 것.

'use client';

import { useDailyOpsPatrolValue } from '../../cmms-daily-ops/state/useDailyOpsPatrolStore';
import { PATROL_FIELD_MAP } from '../../cmms-daily-ops/dao/patrolFieldMaps';
import { evaluateAlarmState, worstAlarmPriority } from '../alarms/evaluateAlarmState';
import type { HmiEquipmentSnapshot, HmiInstrumentReading, PatrolDomain } from '../types/hmiCore';

/** patrolFieldMaps.ts 기준 도메인당 최대 컬럼 수(gc=15). */
const MAX_FIELD_SLOTS = 15;

function columnAt(domain: PatrolDomain, slot: number): string {
  return PATROL_FIELD_MAP[domain][slot]?.columnName ?? '';
}

/** 장비 1개(domain+equipmentTag)의 라이브 스냅샷을 구독한다. */
export function useHmiEquipment(domain: PatrolDomain, equipmentTag: string): HmiEquipmentSnapshot {
  const slot0 = useDailyOpsPatrolValue(domain, equipmentTag, columnAt(domain, 0));
  const slot1 = useDailyOpsPatrolValue(domain, equipmentTag, columnAt(domain, 1));
  const slot2 = useDailyOpsPatrolValue(domain, equipmentTag, columnAt(domain, 2));
  const slot3 = useDailyOpsPatrolValue(domain, equipmentTag, columnAt(domain, 3));
  const slot4 = useDailyOpsPatrolValue(domain, equipmentTag, columnAt(domain, 4));
  const slot5 = useDailyOpsPatrolValue(domain, equipmentTag, columnAt(domain, 5));
  const slot6 = useDailyOpsPatrolValue(domain, equipmentTag, columnAt(domain, 6));
  const slot7 = useDailyOpsPatrolValue(domain, equipmentTag, columnAt(domain, 7));
  const slot8 = useDailyOpsPatrolValue(domain, equipmentTag, columnAt(domain, 8));
  const slot9 = useDailyOpsPatrolValue(domain, equipmentTag, columnAt(domain, 9));
  const slot10 = useDailyOpsPatrolValue(domain, equipmentTag, columnAt(domain, 10));
  const slot11 = useDailyOpsPatrolValue(domain, equipmentTag, columnAt(domain, 11));
  const slot12 = useDailyOpsPatrolValue(domain, equipmentTag, columnAt(domain, 12));
  const slot13 = useDailyOpsPatrolValue(domain, equipmentTag, columnAt(domain, 13));
  const slot14 = useDailyOpsPatrolValue(domain, equipmentTag, columnAt(domain, 14));
  const slotValues = [
    slot0, slot1, slot2, slot3, slot4, slot5, slot6, slot7,
    slot8, slot9, slot10, slot11, slot12, slot13, slot14,
  ];

  const fieldSpecs = PATROL_FIELD_MAP[domain];
  const readings: HmiInstrumentReading[] = [];
  for (let i = 0; i < fieldSpecs.length && i < MAX_FIELD_SLOTS; i++) {
    const value = slotValues[i];
    if (value === undefined || value === null) continue;
    const reading: HmiInstrumentReading = {
      tagId: equipmentTag,
      domain,
      columnName: fieldSpecs[i].columnName,
      instrumentType: 'OTHER',
      value,
      unit: fieldSpecs[i].unit,
      readingStatus: 'other',
      lastUpdatedAt: null,
      alarmPriority: 'NORMAL',
    };
    reading.alarmPriority = evaluateAlarmState(reading);
    readings.push(reading);
  }

  return {
    equipmentTag,
    domain,
    displayName: equipmentTag,
    readings,
    interlock: { status: 'NOT_IMPLEMENTED', reason: null },
    worstAlarmPriority: worstAlarmPriority(readings),
  };
}
