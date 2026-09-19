APPROVED BY HJ CHOI 2026-09-16

# Phase 10 — Stage 2D: Final NP-05 PM Mapping (Pending HJ Approval)

**미승인 상태 — pm_schedules INSERT 금지.** 이 문서는 `docs/phase10-stage1d-np05-pm-mapping-proposal.md`(원본, 미수정 보존)를 Stage 2C 산출물(시스템 레벨 자산 태그, VALIDITY_EXPIRY interval_type)로 갱신한 최종 매핑안이다. 본 문서에 대한 HJ 서면 승인 코멘트("APPROVED BY HJ CHOI <날짜>"가 이 파일 상단에 존재)가 확인되기 전까지 `pm_schedules`(또는 다른 어떤 테이블)에도 INSERT하지 않는다. 작성 시점 기준 `pm_schedules` row count는 0이며, 이 문서 작성으로 인해 변경되지 않았다.

Stage1D 대비 변경분만 아래에 기록한다 — 변경 없는 항목(1~5)은 Stage1D 원본을 그대로 참조할 것.

---

## Stage 2C에서 해소된 항목

### Item 6 — Pressure Safety Valves (PSV)

Stage1D: "No standalone `assets` row — attach to parent ISO tank tag as proxy, or defer (HJ 미결)."

**갱신**: `NIAS-90-SYS-PSV` (Stage2C 신설, `iso_14224_class='SAFETY_SYSTEM'`, `criticality=CRITICAL`)를 proxy `equipment_tag`로 사용.

| Sub-item | interval_type | interval_value (days) | equipment_tag | Citation |
| --- | --- | --- | --- | --- |
| Visual inspection | CALENDAR | 30 | `NIAS-90-SYS-PSV` | App 01.1 PSVs row ("Monthly") |
| Popping test & recertification | CALENDAR | 365 | `NIAS-90-SYS-PSV` | App 01.1 PSVs row ("Annually") |

Ch.8 §8.9의 ISO-tank 전용 PSV(S-1/S-2/S-3/A-13, 2년 주기)는 여전히 개별 탱크(`NIAS-10-TK-*`)에 귀속되는 항목이라 이 proxy 태그와 별개다 — Item 1 상세(Stage1D)의 Biennial PSV replacement 행 참고. 이 문서는 그 행을 변경하지 않는다.

### Item 7 — Emergency Shutdown (ESD) Valves

Stage1D: "No standalone `assets` row — same proxy-tag question as Item 6 (HJ 미결)."

**갱신**: `NIAS-90-SYS-ESD` (Stage2C 신설)를 proxy `equipment_tag`로 사용.

| Sub-item | interval_type | interval_value (days) | equipment_tag | Citation |
| --- | --- | --- | --- | --- |
| Alarm & interlock test | CALENDAR | 90 | `NIAS-90-SYS-ESD` | App 01.1 DCS & ESD Systems row ("Quarterly") |
| Functional test & software backup | CALENDAR | 365 | `NIAS-90-SYS-ESD` | App 01.1 DCS & ESD Systems row ("Annually") |

Ch.8 §8.7의 ISO-tank 전용 ESD 밸브(A-3/A-5/A-17, weekly)는 개별 탱크에 귀속 — Item 1 상세(Stage1D) 참고, 이 문서는 그 행을 변경하지 않는다.

### Item 8 — Fire & Gas Detection System

Stage1D: "No standalone `assets` row" (proxy 여부 언급 없이 갭으로만 표시).

**갱신**: `NIAS-90-SYS-FG` (Stage2C 신설)를 proxy `equipment_tag`로 사용.

| Sub-item | interval_type | interval_value (days) | equipment_tag | Citation |
| --- | --- | --- | --- | --- |
| Detector bump test | CALENDAR | 30 | `NIAS-90-SYS-FG` | App 01.1 Fire & Gas System row ("Monthly") |
| Full calibration & loop test | CALENDAR | 180 | `NIAS-90-SYS-FG` | App 01.1 Fire & Gas System row ("Semi-annually") |

### Item 9 — Tube-type gas detectors (calibration, Ch.7 §7.4)

Stage1D: "Does not fit `RUNNING_HOURS`/`CALENDAR` CHECK constraint — needs schema extension (a third interval type) or expiry-date field. **No interval_type/interval_value proposed.**"

**갱신**: Stage2C가 정확히 이 갭을 메우는 `VALIDITY_EXPIRY` interval_type + nullable `expiry_date` 컬럼을 추가했다.

| Sub-item | interval_type | expiry_date | equipment_tag | Citation |
| --- | --- | --- | --- | --- |
| Sensor/cartridge validity calibration | `VALIDITY_EXPIRY` | 제조사 인쇄 유효기한(실물 확인 필요 — 이 문서는 값을 추정하지 않음) | `NIAS-90-SYS-FG` (proxy — 개별 감지기 자산 행 없음, Item 8과 동일 그룹) | Ch.7 §7.4 |

`next_due_date`는 삽입 시 `computeNextDueDateForValidityExpiry('VALIDITY_EXPIRY', expiryDate)`(`src/utils/pmValidityExpiryCalculator.ts`)로 계산하며, `expiryDate` 자체를 그대로 반환한다 — last-performed 이력에서 역산하지 않는다.

**여전히 미해결(HJ 확인 필요)**: §7.4 두 번째 조항("conspicuous error 발견 시 반응적으로 교정 요청")은 고정 스케줄이 아닌 온디맨드(on-demand) 트리거다. `VALIDITY_EXPIRY`는 이 반응적 트리거를 모델링하지 않는다 — 정기 유효기한 관리만 다룬다. 실제 제조사 유효기한 값도 이 문서에서 추정하지 않았다(실물/구매 기록 확인 필요).

---

## 변경 없음 (Stage1D 원본 참조)

- **Item 1** (LNG ISO Tank, 480행 vs 템플릿 질문), **Item 2** (AAV, App01/App02 주기 불일치), **Item 3** (NG Buffer Tank, 후보 없음), **Item 4** (NG Metering Skid, proxy interval), **Item 5** (Vent Stack, 근거 없음) — Stage2C의 두 산출물(시스템 자산 태그, VALIDITY_EXPIRY)과 무관한 미결 사항이므로 이 스테이지에서 갱신하지 않는다. `docs/phase10-stage1d-np05-pm-mapping-proposal.md` 원본 그대로 유효하다.

---

## 이 문서가 하지 않는 것

- `pm_schedules`, `assets` 등 어떤 테이블에도 행을 쓰지 않았다(작성 전후 `pm_schedules` row count 0 → 0, 직접 확인).
- `pm_code` 값을 채번하지 않았다 — 승인 후 삽입 시점에 부여.
- Item 9의 실제 유효기한 날짜, Item 1의 480행-vs-템플릿 결정, Item 2의 App01/App02 충돌 해소 등 Stage1D에서 이미 HJ 미결로 남은 사항을 이 문서가 대신 결정하지 않았다.
