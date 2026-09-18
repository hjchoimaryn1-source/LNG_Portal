// src/cmms-daily-ops/dao/deriveIsoTankCargoTags.ts
//
// PURPOSE
//   iso_tank_cargo 도메인(FORM-NP-08-33-N Section D, Laydown 1/2 소재 SIMU
//   탱크)의 equipment_tag 목록을 fleetTanks에서 동적으로 도출하는 순수 함수.
//   patrolEquipmentTags.ts의 다른 도메인과 달리 정적 배열이 아니다 — SIMU
//   탱크 모집단이 Nias↔Saviour 선적 사이클로 교체되기 때문(Section C의
//   T-201~204처럼 고정 설비가 아님). React 바인딩 없음 — 호출부(UI 레이어)가
//   useFleetTankFacade()로 읽은 fleetTanks를 여기 넘긴다.
//
//   Position 필터: CSV 시드값은 대문자("LAYDOWN 1")이지만 런타임 재배치
//   로직(tankOperationsService.ts calculateTankRelocation)은 타이틀케이스로
//   덮어쓴다 — "Laydown 1"/"Laydown 1 (Slot N)"/"Laydown 2"/"Laydown 2 (Slot N)".
//   정확매치는 재배치된 탱크를 누락시키므로 대소문자 무시 접두어 매치를
//   쓴다. "LAYDOWN PAG"(Arun) / "MV. SAVIOUR" / "SAVIOUR"는 "laydown 1|2"
//   접두어와 매치되지 않아 자연 배제된다.
//
//   ORU-SKID 탑재(Section C 대상) 배제: mountTankToBay가 position을
//   `REGAS ${bayId}`로 덮어씀과 동시에 isMountedToBay를 세팅하므로
//   (PortalDataContext.tsx) laydown 접두어 매치 자체가 이미 배제하지만,
//   isMountedToBay 체크를 의도 표현용으로 이중 방어한다.

import type { FleetTankItem } from '../../types/lng';
import type { ShiftTimeSlot } from '../types/patrolLog';

const LAYDOWN_1_2_PREFIX = /^laydown\s*[12]\b/i;

/** iso_tank_cargo는 1일 1회 점검 대상이라 4시간 슬롯 중 하나로 고정해 upsert한다(스키마 변경 없음). */
export const ISO_TANK_CARGO_DAILY_SLOT: ShiftTimeSlot = '00:00';

export function deriveIsoTankCargoTags(fleetTanks: FleetTankItem[]): string[] {
  return fleetTanks
    .filter((tank) => !tank.isMountedToBay && LAYDOWN_1_2_PREFIX.test(tank.position))
    .map((tank) => tank.serialNo)
    .filter((serialNo) => serialNo.length > 0);
}
