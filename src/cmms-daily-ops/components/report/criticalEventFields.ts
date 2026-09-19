// src/cmms-daily-ops/components/report/criticalEventFields.ts
//
// PURPOSE
//   CriticalEventsEditor.tsx의 컬럼 정의/타입 — 150줄 캡 대응 분리
//   (원 지시에는 없던 파일, 순수 상수/타입이라 React 바인딩 없음).

export interface SavedEvent {
  id: number;
  eventTime: string | null;
  equipmentSystem: string | null;
  conditionAlarm: string | null;
  impact: string | null;
  immediateAction: string | null;
  status: string | null;
  pic: string | null;
}

export interface DraftRow {
  eventTime: string;
  equipmentSystem: string;
  conditionAlarm: string;
  impact: string;
  immediateAction: string;
  status: string;
  pic: string;
}

export const DRAFT_FIELDS: Array<{ key: keyof DraftRow; label: string }> = [
  { key: 'eventTime', label: 'Time' },
  { key: 'equipmentSystem', label: 'Equipment/System' },
  { key: 'conditionAlarm', label: 'Condition/Alarm' },
  { key: 'impact', label: 'Impact' },
  { key: 'immediateAction', label: 'Immediate Action' },
  { key: 'status', label: 'Status' },
  { key: 'pic', label: 'PIC' },
];

export function emptyDraft(): DraftRow {
  return { eventTime: '', equipmentSystem: '', conditionAlarm: '', impact: '', immediateAction: '', status: '', pic: '' };
}
