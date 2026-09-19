// src/components/auth/loginGatewayStyles.ts
// LoginGateway.tsx의 기본 윈도우 프레임/버튼 스타일 (AGENTS.md §3 250줄 하드캡 대응 In-Place Refactoring).
export const LOGIN_GATEWAY_STYLES = `
  .gateway-root {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: transparent;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    user-select: none;
  }

  /* 1. 윈도우 팝업 프레임 — 확대(2026-09-19, 2차): 1000x600 고정. title-bar/
     status-bar는 auto 높이, .window-body가 flex:1로 나머지를 채운다 — 왼쪽
     사진 칼럼/오른쪽 폼 칼럼이 항상 동일한 전체 높이를 공유하므로 스텝이
     바뀌어도(.login-stage가 flex:1로 채움) 패널 크기 불변. */
  .gateway-root .window {
    width: 1000px;
    height: 600px;
    max-width: 96vw;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    background: #c0c7d0;
    border: 2px solid #1a365d;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.65), 0 2px 4px rgba(0, 0, 0, 0.4);
  }

  /* 타이틀바 */
  .gateway-root .title-bar {
    flex-shrink: 0;
    background: linear-gradient(90deg, #002244, #0052a3);
    color: #ffffff;
    padding: 6px 10px;
    font-size: 13px;
    font-weight: bold;
    letter-spacing: 0.5px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #001730;
  }
  .gateway-root .title-bar-controls {
    display: flex;
    align-items: center;
  }
  .gateway-root .title-bar-controls button {
    width: 18px;
    height: 18px;
    border-top: 1px solid #ffffff;
    border-left: 1px solid #ffffff;
    border-bottom: 1px solid #475569;
    border-right: 1px solid #475569;
    background: #d4d8de;
    font-size: 10px;
    line-height: 12px;
    cursor: pointer;
    margin-left: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: #1e293b;
  }
  .gateway-root .title-bar-controls button:active {
    border-top: 1px solid #475569;
    border-left: 1px solid #475569;
    border-bottom: 1px solid #ffffff;
    border-right: 1px solid #ffffff;
    background: #c2c7ce;
  }

  /* 본문 영역 — 좌(사진)/우(폼) 2칼럼. 패딩 없음(칼럼 각자 자기 패딩 소유).
     overflow는 visible이어야 한다(2026-09-19, 3차 — 드롭다운 클리핑 버그 수정):
     .login-stage 안의 .dropdown-listbox(position:absolute)는 화면상 .window의
     600px 경계를 넘어 펼쳐질 수 있어야 하는데, 이 요소가 overflow:hidden이면
     CSS 클리핑은 하위 트리의 position 속성과 무관하게 이 박스의 페인트 영역
     밖을 모두 잘라내므로 리스트박스 자체의 max-height/overflow-y:auto 선언과
     무관하게 화면에서 잘려 보인다. .window은 overflow를 선언하지 않아(기본값
     visible) 자체로는 클리핑하지 않으므로, 이 값만 바꾸면 패널 자체 크기는
     그대로 유지된다(폭/높이는 overflow가 아니라 위의 고정 1000x600으로 결정). */
  .gateway-root .window-body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: row;
    overflow: visible;
  }

  /* 2a. 왼쪽 칼럼 — 사진(450px 고정, 세로 전체, cover), 1px 인셋 보더. */
  .gateway-root .photo-column {
    width: 450px;
    flex-shrink: 0;
    box-sizing: border-box;
    padding: 6px;
    display: flex;
  }
  .gateway-root .photo-frame {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    overflow: hidden;
    border-top: 1px solid #64748b;
    border-left: 1px solid #64748b;
    border-bottom: 1px solid #ffffff;
    border-right: 1px solid #ffffff;
  }
  .gateway-root .site-photo {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
  }

  /* 2b. 오른쪽 칼럼 — 로고 프레임(로고만) + 회사명 캡션 + 폼(.login-stage가 flex:1로
     나머지 채움, loginGatewayDropdownStyles.ts). */
  .gateway-root .form-column {
    flex: 1;
    min-width: 0;
    box-sizing: border-box;
    padding: 22px 32px 18px 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  /* 로고 프레임/이미지 확대 이력: 44px -> 66px(반영 안 보임, dev 서버 .next
     캐시 오염으로 판명) -> 88px(2026-09-19, 2차, 캐시 정리 후 재설정) -> 110px
     (2026-09-19, 4차, 클린 재빌드로 캐시 아님을 확인 후 재설정) -> 150px
     (2026-09-19, 5차: HJ가 프레임 안 여백이 과하고 로고가 더 커야 한다고
     재지시 — 이미지 자체를 150px로 키우는 동시에 프레임 padding을 20px/8px
     에서 10px/4px로 줄여 로고가 박스를 꽉 채우도록 함). */
  .gateway-root .logo-frame {
    box-sizing: border-box;
    padding: 4px 10px;
    margin-bottom: 8px;
    display: inline-flex;
    flex-shrink: 0;
    background: rgba(226, 232, 240, 0.5);
    border-top: 2px solid #64748b;
    border-left: 2px solid #64748b;
    border-bottom: 2px solid #ffffff;
    border-right: 2px solid #ffffff;
    box-shadow: inset 1px 1px 3px rgba(0, 0, 0, 0.15);
  }
  .gateway-root .company-logo {
    height: 150px;
    width: auto;
    object-fit: contain;
    display: block;
  }
  .gateway-root .logo-placeholder {
    height: 150px;
    width: 150px;
    background: #0077b6;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 12px;
    border-top: 1px solid #ffffff;
    border-left: 1px solid #ffffff;
    border-bottom: 1px solid #003e4d;
    border-right: 1px solid #003e4d;
  }
  /* 2026-09-19, 6차(HJ 지시): 회사명 캡션을 로고 박스 아래에서 위로 이동해
     오른쪽 칼럼 맨 위 타이틀로 승격 — 저채도 회색(#64748b)/11px이던 이전
     "로고 아래 부제" 스타일 대신, 고대비 남색(.window 테두리와 동일 톤)과
     13px로 굵게 키워 헤딩다운 무게감을 준다. */
  .gateway-root .company-caption {
    flex-shrink: 0;
    font-size: 13px;
    font-weight: 700;
    color: #1a365d;
    letter-spacing: 1.2px;
    text-align: center;
    text-transform: uppercase;
    margin-bottom: 10px;
  }

  /* 하단 상태바 (Classic Groove & Industrial Bevel) */
  .gateway-root .status-bar {
    flex-shrink: 0;
    background: #b5bdc7;
    border-top: 1px solid #94a3b8;
    padding: 5px 12px;
    font-size: 11px;
    font-family: monospace;
    color: #334155;
    display: flex;
    justify-content: space-between;
  }
  .gateway-root .ready-indicator {
    color: #047857;
    font-weight: bold;
  }
`;
