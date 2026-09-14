# Phase 10 — Stage 4A: Stage2C DROP/CREATE Remediation Note

## 1. DROP/CREATE 발생 사실
커밋 `4894225` (Phase10-Stage2C)의 `src/db/migrations/phase10Stage2CRunner.ts`
`rebuildPmSchedules()`가 `pm_schedules.interval_type` CHECK에 `'VALIDITY_EXPIRY'`를
추가하기 위해 다음 순서를 실행함 (SQLite는 `ALTER TABLE ... ALTER COLUMN` 및 기존
컬럼의 CHECK 제약 변경을 지원하지 않음 — 표준 12-step 재생성 절차):

```
CREATE TABLE pm_schedules_new ( ... CHECK (interval_type IN ('RUNNING_HOURS','CALENDAR','VALIDITY_EXPIRY')) ... )
INSERT INTO pm_schedules_new (...) SELECT (...) FROM pm_schedules
DROP TABLE pm_schedules
ALTER TABLE pm_schedules_new RENAME TO pm_schedules
CREATE INDEX IF NOT EXISTS idx_pm_next_due ...
```

→ **DROP TABLE이 실제로 실행됨.** 본 스테이지부터 금지되는 패턴의 선례.

## 2. 참조 무결성 영향 검증

`grep -r "pm_schedules"` 전체 결과 22개 파일. 분류:

| 분류 | 파일 | 영향 |
|---|---|---|
| 마이그레이션/정의 (본인) | `phase10Stage2CRunner.ts`, `phase10_stage2c_system_safety_assets.sql`, `phase10Stage1ARunner.ts`, `phase10_stage1a_mro_schema.sql` | 재생성 주체. `INSERT...SELECT`가 기존 12개 컬럼을 전부 제네릭 복사 후 `expiry_date` 1개만 추가 — 컬럼 손실 없음 |
| FK 참조 실사용 코드 | 없음 | `src/adapters/db/workOrderDao.ts`는 주석에서 "PM 주기를 pm_schedules로 분리하지 않고 work_orders에 직접 둔다"고 명시 — **런타임에 pm_schedules를 참조하는 DAO/쿼리 코드 자체가 아직 없음** |
| 타입 정의 | `src/types/lng.ts` | pm_schedules 관련 매치 없음 (grep 무결과) |
| 문서/보고서 | `CMMS_Architecture.md`, `pmChecklistSchema.json`, `NIAS_Portal_Full_Context.md`, `docs/phase10-stage0/1d/2d/3-*.md` | 서술/제안 문서. FK나 실행 코드 아님 |
| UI 네비게이션 문자열 | `SidebarNav.tsx`, `usePortalNavigation.tsx`, `getInitialNav.ts`, `WorkOrderSubTabs.tsx`, `WorkOrderRoutes.tsx`, `subProcessTitlesManpowerSafety.tsx` | "PM Schedules" 등 메뉴 레이블 텍스트 매치로 추정 — DB 테이블 참조 아님 (라벨 문자열, FK 없음) |
| 정적 스키마 파일 | `src/db/schema/cmms_schema.sql`, `schema/cmms_schema.sqlite.sql` | `CREATE TABLE pm_schedules` 정의 자체가 **없음** (주석에서만 언급, §4.4 축약 설계로 work_orders에 흡수됨). 재생성과 무관 |

**결론: 영향받은 참조 없음 (없음).** `pm_schedules`는 Stage2C 시점 0 rows였고,
이를 소비하는 DAO/서비스 레이어가 아직 구현되지 않아 DROP/CREATE로 인한 FK 깨짐,
쿼리 실패, 타입 불일치 사례가 전혀 없음. 유일한 잠재적 드리프트는
`phase10_stage1a_mro_schema.sql`의 `CREATE TABLE IF NOT EXISTS pm_schedules`가
구 CHECK(`RUNNING_HOURS`/`CALENDAR`만)로 남아있다는 점이나, Stage2C 러너가
`sqlite_master.sql`을 검사해 `VALIDITY_EXPIRY` 부재 시 자동 재생성하므로
(idempotent, 재실행 검증됨) 신규 DB 부트스트랩 경로에서도 자기 치유(self-healing)
되어 실질적 리스크 없음.

## 3. 재발 방지책
`CLAUDE.md`에 ALTER-only 가드레일이 없었음을 확인 → 본 스테이지에서
`CLAUDE.md` §5 "DB Schema Change Policy (ALTER-only)"로 명문화 완료:
- `DROP TABLE` / 재생성 목적 `CREATE TABLE` / `TRUNCATE` 계열 전면 금지.
- 불가피한 CHECK 제약 변경 등으로 재생성이 필요할 경우, 커밋 전 반드시 중단하고
  HJ 확인 요청.

## 4. 영향 범위 재확인
- 하드 블록 6개 안전 파일(`ptwCargoHandlingRules.ts`, `ptwCargoHandlingTransitions.ts`,
  `ptwCargoHandlingValidators.ts`, `ptwStatusMapper.ts`, `gasSafetyAdapter.ts`,
  `gasTestDao.ts`) 및 `mro_parts`/`mro_stock_transactions` 관련 어댑터
  (`mroInventoryDbAdapter.ts`, `mroInventoryDao.ts`): `git diff f8f6219..HEAD` 기준
  0 touches, 본 재확인 시점까지 동일.
