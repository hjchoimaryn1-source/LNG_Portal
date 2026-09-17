// src/db/migrations/dailyOpsPatrolPdfSeed.ts
//
// PURPOSE
//   daily_ops_patrol_entries 백필 — Daily Operation Report, LNG Nias
//   Gasifikasi, Report Date 2026-09-15 (Prepared by Shadiq Muhammad S.,
//   Acknowledged by Edi Hermawan)의 순간값(instantaneous reading) 8건.
//   gasMeteringLedgerDailyPdfSeed.ts가 이미 같은 보고서의 GC 조성/Energy
//   Total/NG Buffer Tank 압력을 gas_metering_ledger_daily에 적재했고, 그
//   헤더 주석이 "U/S metering gauge, diff-pressure transmitter, pressure
//   transmitter, temp gauge, D/S gauge — per-train instantaneous readings…
//   belong to daily_ops_patrol_entries.metering_train_a/b, a separate
//   seeding task"라고 명시적으로 남겨둔 나머지 절반이 이 파일이다.
//
//   보고서 원문에 없는 값은 어떤 필드도 채우지 않는다(추정 금지) — shift_time_slot만
//   예외: 이 테이블의 NOT NULL 필수 키이지만 보고서는 4시간 교대 단위가 아닌
//   일일 스냅샷이라 시간대가 없다. 측정값이 아닌 스키마 키 요건이므로 '00:00'을
//   자리표시자로 사용한다 — 실제 관측 시각이라는 뜻이 아니다(HJ 확인 필요, 아래
//   runner 로그 참고).
//
//   AAV 매핑 미해결 사항: 보고서는 D/S(Downstream) 값만 제공하는데
//   hmiOverviewColumnMap.ts의 PRIMARY_COLUMN_BY_DOMAIN.aav는 U/S(Upstream)
//   게이지 컬럼(pressure_gauge_us_bar)을 읽는다 — 이 시딩만으로는 HMI Overview
//   AAV 타일이 여전히 OFFLINE으로 남는다(별도 HJ 결정 필요, pidCandidateTags.ts는
//   PIDOverlayView와 공유하는 파일이라 여기서 임의로 바꾸지 않았다). D/S 게이지와
//   D/S 트랜스미터 중에서는, 같은 보고서의 Metering Train 값이 명시적으로
//   "Pressure Transmitter"/"Temp Gauge"로 라벨링되고 소수점 2자리 정밀도(6.34,
//   2.69)를 갖는 것과 동일한 정밀도 패턴(5.10, 26.87 등)을 AAV D/S 값도 보이므로,
//   수동 게이지가 아닌 트랜스미터 판독으로 보고 pressure_transmitter_ds_bar /
//   temperature_transmitter_ds_c에 매핑했다 — 이는 값이 아닌 컬럼 선택에 대한
//   해석이며, HJ 확인 대상으로 별도 보고한다.

import type { PatrolDomain, ShiftTimeSlot, ReadingStatus } from '../../cmms-daily-ops/types/patrolLog';
import type { PatrolValues } from '../../cmms-daily-ops/dao/dailyOpsPatrolDao';

export interface PatrolSeedRow {
  domain: PatrolDomain;
  equipmentTag: string;
  reportDate: string;
  shiftTimeSlot: ShiftTimeSlot;
  readingStatus: ReadingStatus;
  remarkText: string | null;
  recordedBy: string;
  values: PatrolValues;
}

const REPORT_DATE = '2026-09-15';
const SOURCE_NOTE =
  'Backfill from Daily Operation Report (LNG Nias Gasifikasi) 2026-09-15. ' +
  'Prepared: Shadiq Muhammad S. / Ack: Edi Hermawan. One-time manual snapshot, not a live feed.';
const RECORDED_BY = 'Shadiq Muhammad S. (Daily Operation Report, backfilled)';

// 보고서에 교대 시각이 없음 — 스키마의 NOT NULL 키 요건 충족을 위한 자리표시자.
const NO_SHIFT_GRANULARITY_PLACEHOLDER: ShiftTimeSlot = '00:00';

export const DAILY_OPS_PATROL_PDF_SEED_ROWS: PatrolSeedRow[] = [
  {
    domain: 'ng_buffer_tank',
    equipmentTag: 'V-101',
    reportDate: REPORT_DATE,
    shiftTimeSlot: NO_SHIFT_GRANULARITY_PLACEHOLDER,
    readingStatus: 'low_pressure_warning',
    remarkText: `${SOURCE_NOTE} Pressure 4.2 Bar is below normal operating range (7.4–8.0 Barg) — preserved as-reported, not clipped.`,
    recordedBy: RECORDED_BY,
    values: { pressure_transmitter_barg: 4.2 },
  },
  {
    domain: 'aav',
    equipmentTag: 'AAV-102',
    reportDate: REPORT_DATE,
    shiftTimeSlot: NO_SHIFT_GRANULARITY_PLACEHOLDER,
    readingStatus: 'normal',
    remarkText: SOURCE_NOTE,
    recordedBy: RECORDED_BY,
    values: { pressure_transmitter_ds_bar: 5.1, temperature_transmitter_ds_c: 26.87 },
  },
  {
    domain: 'aav',
    equipmentTag: 'AAV-103',
    reportDate: REPORT_DATE,
    shiftTimeSlot: NO_SHIFT_GRANULARITY_PLACEHOLDER,
    readingStatus: 'normal',
    remarkText: SOURCE_NOTE,
    recordedBy: RECORDED_BY,
    values: { pressure_transmitter_ds_bar: 5.05, temperature_transmitter_ds_c: 26.81 },
  },
  {
    domain: 'aav',
    equipmentTag: 'AAV-105',
    reportDate: REPORT_DATE,
    shiftTimeSlot: NO_SHIFT_GRANULARITY_PLACEHOLDER,
    readingStatus: 'normal',
    remarkText: SOURCE_NOTE,
    recordedBy: RECORDED_BY,
    values: { pressure_transmitter_ds_bar: 6.65, temperature_transmitter_ds_c: 26.87 },
  },
  {
    domain: 'aav',
    equipmentTag: 'AAV-106',
    reportDate: REPORT_DATE,
    shiftTimeSlot: NO_SHIFT_GRANULARITY_PLACEHOLDER,
    readingStatus: 'normal',
    remarkText: SOURCE_NOTE,
    recordedBy: RECORDED_BY,
    values: { pressure_transmitter_ds_bar: 5.11, temperature_transmitter_ds_c: 26.73 },
  },
  {
    domain: 'metering_train_a',
    equipmentTag: 'METERING-TRAIN-A',
    reportDate: REPORT_DATE,
    shiftTimeSlot: NO_SHIFT_GRANULARITY_PLACEHOLDER,
    readingStatus: 'normal',
    remarkText: SOURCE_NOTE,
    recordedBy: RECORDED_BY,
    values: { press_barg: 6.34, temp_c: 28, energy_total_mmbtu: 26.8 },
  },
  {
    domain: 'metering_train_b',
    equipmentTag: 'METERING-TRAIN-B',
    reportDate: REPORT_DATE,
    shiftTimeSlot: NO_SHIFT_GRANULARITY_PLACEHOLDER,
    readingStatus: 'normal',
    remarkText: SOURCE_NOTE,
    recordedBy: RECORDED_BY,
    values: { press_barg: 2.69, temp_c: 29, energy_total_mmbtu: 338.36 },
  },
  {
    domain: 'gc',
    equipmentTag: 'GC-01',
    reportDate: REPORT_DATE,
    shiftTimeSlot: NO_SHIFT_GRANULARITY_PLACEHOLDER,
    readingStatus: 'normal',
    remarkText: SOURCE_NOTE,
    recordedBy: RECORDED_BY,
    values: { mol_methane: 96.6, gc_analyzer_status: 'Normal / Running' },
  },
];
