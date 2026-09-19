// src/components/auth/loginGatewayDropdownStyles.ts
// Login gateway redesign (2026-09-19, HJ final spec — 2-column split modal,
// 1000x600). The site photo lives in loginGatewayStyles.ts's .photo-column
// (left column, own file since it's part of the .window frame), not here.
// Covers two concerns:
//   1) the form stage (flex:1) that holds either the LOGIN form or the
//      CHANGE_PASSWORD form inside .form-column, so switching between them
//      never resizes the panel.
//   2) UserDropdownSelect.tsx's own listbox/option visuals.
export const LOGIN_GATEWAY_DROPDOWN_STYLES = `
  /* 1) Form stage — shared by the LOGIN step and the CHANGE_PASSWORD step
     (PasswordChangeGate.tsx renders inside this same box). flex:1 fills
     whatever vertical space remains in .form-column below the constant
     logo-frame/company-caption header (loginGatewayStyles.ts) — since that
     header never changes between steps, the space available here is always
     identical, so the panel itself never resizes even though this file no
     longer hardcodes a px height (2026-09-19 2-column redesign).
     overflow: visible (2026-09-19, 3차 정정 — 이전엔 "타이트한 콘텐츠 방어용
     안전망"이라며 hidden이었으나 이는 착오였다: 패널이 리사이즈되지 않는 이유는
     .window의 고정 1000x600px + flex 레이아웃 때문이지 overflow와 무관하고,
     overflow는 오직 "박스 밖으로 튀어나온 내용을 잘라 보여줄지"만 결정한다.
     hidden으로 두면 .dropdown-wrap 안의 .dropdown-listbox(position:absolute,
     loginGatewayDropdownStyles.ts 하단)가 이 박스의 페인트 영역에서 클리핑돼
     10개 항목 중 일부만 보이는 버그가 생긴다(리스트박스 자신의 max-height/
     overflow-y:auto 선언과는 무관하게, 상위 박스의 overflow:hidden이 그
     자손을 통째로 잘라낸다) — visible로 바꿔 리스트박스가 이 박스 경계
     아래로(필요하면 .window 경계 밖으로도) 자유롭게 펼쳐지게 한다. */
  .gateway-root .login-stage {
    width: 100%;
    flex: 1;
    min-height: 0;
    box-sizing: border-box;
    overflow: visible;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .gateway-root .stage-form {
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .gateway-root .field-label {
    font-size: 11px;
    font-weight: bold;
    color: #334155;
    font-family: monospace;
  }
  .gateway-root .stage-title {
    font-size: 13px;
    font-weight: 800;
    color: #0f172a;
    font-family: monospace;
    letter-spacing: 0.3px;
    margin-bottom: 2px;
  }
  .gateway-root .error-line {
    box-sizing: border-box;
    min-height: 15px;
    font-size: 11px;
    font-family: monospace;
    font-weight: bold;
    color: #b91c1c;
    text-align: center;
  }
  .gateway-root .mode-toggle-link {
    background: none;
    border: none;
    font-size: 11px;
    font-family: monospace;
    color: #0369a1;
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
    align-self: center;
  }

  /* 2) UserDropdownSelect.tsx */
  .gateway-root .dropdown-wrap {
    position: relative;
    width: 100%;
  }
  .gateway-root .dropdown-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    text-align: left;
    cursor: pointer;
  }
  .gateway-root .dropdown-trigger:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: #f1f5f9;
  }
  .gateway-root .dropdown-placeholder {
    color: #94a3b8;
  }
  .gateway-root .dropdown-caret {
    color: #64748b;
    font-size: 10px;
    margin-left: 6px;
  }
  /* max-height 계산(2026-09-19, 2차 — ADMIN이 드롭다운에서 빠지면서 11->10건):
     .dropdown-option 행 높이 = padding-top(8) + line-height(16, 아래 명시) +
     padding-bottom(8) = 32px. 10행 x 32px = 320px. 역할 그룹 6개(SITE_MANAGER/
     OP_TEAM/HSSE/MAINTENANCE/LOGISTIC/HR) 경계마다 .group-start의 1px
     border-top이 추가로 쌓여 5곳 x 1px = 5px. 합계 320+5=325px — 여기에 안전
     여유 15px를 더해 340px로 지정(추측치가 아니라 실측 가능한 CSS 선언값 기반
     산출; 이전 단계 "화면엔 6개만 보이고 스크롤도 안 됨" 보고는 이 계산 자체의
     오류가 아니라 dev 서버 .next 캐시 오염이 원인이었음— 아래 overflow-y:auto는
     처음부터 선언돼 있었다). 계정 수가 더 늘어나면 이 상수도 같이 늘려야 한다.
     10행이 그래도 340px를 넘는 실제 브라우저 폰트 렌더링이 있다면 overflow-y:auto가
     스크롤 폴백으로 동작한다(마우스 휠/키보드 ArrowDown 모두 activeIndex가 바뀔 때
     scrollIntoView로 보이는 범위를 따라간다, UserDropdownSelect.tsx 참조). */
  .gateway-root .dropdown-listbox {
    position: absolute;
    top: calc(100% + 2px);
    left: 0;
    right: 0;
    z-index: 30;
    max-height: 340px;
    overflow-y: auto;
    margin: 0;
    padding: 0;
    list-style: none;
    background: #ffffff;
    border-top: 2px solid #64748b;
    border-left: 2px solid #64748b;
    border-bottom: 2px solid #ffffff;
    border-right: 2px solid #ffffff;
    box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.35);
    /* 스크롤 폴백이 실제로 동작 중임을 눈으로 알 수 있도록 스크롤바를 명시
       (일부 OS/브라우저 기본 스크롤바는 얇거나 자동 숨김이라 스크롤 가능 여부를
       알아채기 어렵다) — SCADA 테마 색상(트랙 #dbe1ea, 썸 #64748b)으로 통일. */
    scrollbar-width: auto;
    scrollbar-color: #64748b #dbe1ea;
  }
  .gateway-root .dropdown-listbox::-webkit-scrollbar {
    width: 10px;
  }
  .gateway-root .dropdown-listbox::-webkit-scrollbar-track {
    background: #dbe1ea;
  }
  .gateway-root .dropdown-listbox::-webkit-scrollbar-thumb {
    background: #64748b;
    border: 2px solid #dbe1ea;
    border-radius: 2px;
  }
  .gateway-root .dropdown-listbox::-webkit-scrollbar-thumb:hover {
    background: #475569;
  }
  .gateway-root .dropdown-option {
    box-sizing: border-box;
    padding: 8px 18px 8px 10px;
    line-height: 16px;
    font-family: monospace;
    font-size: 12px;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .gateway-root .dropdown-option.group-start {
    border-top: 1px solid #cbd5e1;
  }
  .gateway-root .dropdown-option.active {
    background: #dbe1ea;
  }
  .gateway-root .role-part {
    font-weight: 800;
    color: #0f172a;
  }
  .gateway-root .name-part {
    color: #64748b;
  }
`;
