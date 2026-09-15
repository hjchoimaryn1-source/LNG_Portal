# Known Issues Backlog (Reference)

미해결 이슈 기록 전용 문서. 이 문서에 항목을 추가하는 커밋은 코드 변경을 동반하지 않는다.
각 항목은 append-only로 추가하며 기존 항목을 수정/삭제하지 않는다.

---

## 2026-09-15 — `today()` UTC/WIB off-by-one (보고됨, 본 커밋 시점 검증 불가)

HJ가 Phase 12 field-readiness pass에서 보고한 이슈: 일일 운전 데이터의 기준 날짜를 산출하는
`today()` 헬퍼(`dailyOpsDateHelpers.ts`)가 UTC 기준으로 날짜를 계산하기 때문에, 현장 표준시인
WIB(UTC+7) 기준으로 매일 UTC 17:00~24:00 구간(= WIB 익일 00:00~07:00) 동안 날짜가 하루 이르게
평가되어, 야간 근무조가 입력한 데이터가 전일자 버킷에 기록되거나 당일 화면에서 누락되는 off-by-one이
발생한다. 영향 화면으로 `LngEnergyOperationView`, `DailyOpsOverviewView`, `ElectricalSystemView`
3종이 지목되었다. **단, 본 커밋(`3cc6e3b`) 기준 저장소에는 `dailyOpsDateHelpers.ts`, `today()`
정의, 그리고 지목된 3개 View가 모두 존재하지 않아 코드 수준에서 재현/검증하지 못했다.** 해당
daily-ops 모듈이 본 저장소 브랜치에 병합되는 시점에 재검증이 필요하며, 그 전까지는 보고 내용
그대로를 미확인 상태로 보존한다. 본 항목에 대한 수정은 시도하지 않았다.

---

## 2026-09-15 — 세션/토큰 검증 부재 (보안 갭, 코드 검증 완료)

로그인 시 세션 토큰이 발급되지만 이후 요청에서 전혀 검증되지 않는다. `src/cmms-auth/sessionStore.ts`가
`randomUUID()`로 `sessionId`를 생성해 `auth_sessions` 테이블(`expires_at` 포함)에 기록하고,
`src/app/api/v1/cmms/auth/login/route.ts`가 이를 응답으로 반환하지만, `src/cmms-auth/` 외부에서
`sessionId`를 소비하는 코드는 존재하지 않는다 — 클라이언트 측 `src/lib/rbac/activeSessionStore.ts`의
`ActiveSession` 인터페이스에는 `sessionId` 필드 자체가 없고(`userId`/`roleCode`/`homeLocation`/
`effectiveRole`만 보유), 따라서 후속 요청에 토큰이 실려 나가지도, 서버에서 조회·만료 검증되지도 않는다.
결과적으로 `activeSessionStore.roleCode`는 클라이언트가 주장하는 값이 그대로 신뢰되며, 새로고침 시
소실되는 인메모리 상태에 불과하다(파일 상단 주석이 DEV-ONLY 임시 어댑터임을 명시).

추가로, 조사 과정에서 확인된 더 넓은 갭: **서버 라우트에서의 RBAC 재검증이 현재 한 곳도 존재하지 않는다.**
`evaluateMutationGuardrails` / `resolveEffectivePermission` 소비처 11곳은 전부 클라이언트 컴포넌트·훅이며
(`useWorkOrders.ts`, `PTWStatusActions.tsx`, `OverviewCalibrationRoutes.tsx` 등), `src/app/api/**` 전체에
`roleCode` 참조가 0건이고 Next.js `middleware.ts`도 없다. `src/app/api/v1/cmms/bootstrap/route.ts`의 403은
프로덕션 빌드 차단용 환경 가드로 RBAC와 무관하다. 즉 클라이언트 가드를 우회한 직접 API 호출은 현재
역할 검증 없이 통과한다.

field-guard Sub-stage D 승인 시 함께 다룰 보안 갭으로 분류한다. 본 항목에 대한 수정은 시도하지 않았다.
