// src/cmms-daily-ops/types/patrolLog.ts
//
// Phase 12 Stage A — Daily Ops 순찰 로그 도메인 타입.
// src/cmms-trucking/types.ts의 격리 규칙(외부 임포트 금지, DAO/컴포넌트가
// 이 파일을 참조하되 역방향 금지)을 그대로 따른다.

/** daily_ops_patrol_entries.domain — FORM-NP-08-33-N/NP-08-40이 다루는 9개 순찰 대상. */
export type PatrolDomain =
  | 'metering_train_a'
  | 'metering_train_b'
  | 'aav'
  | 'n2_skid'
  | 'gc'
  | 'electrical'
  | 'iso_tank_unloading_skid'
  | 'iso_tank_cargo'
  | 'ng_buffer_tank';

/** daily_ops_patrol_entries.shift_time_slot — 4시간 교대 순찰 슬롯(고정 6개). */
export type ShiftTimeSlot = '00:00' | '04:00' | '08:00' | '12:00' | '16:00' | '20:00';

/**
 * daily_ops_patrol_entries.reading_status — 원본 PDF의 자유서술 remarks
 * ("Progress Order", "Low pressure warning", "Belum terbaca di panel" 등)를
 * 고정 상태값으로 정규화한 것. 여기 나열되지 않은 문구는 전부 'other' +
 * remark_text(자유 텍스트)로 수용한다.
 */
export type ReadingStatus = 'normal' | 'no_reading' | 'progress_order' | 'low_pressure_warning' | 'other';
