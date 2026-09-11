// src/components/auth/loginGatewayAccountCardStyles.ts
// TASK 2 (Quick-Login 계정 카드) 전용 스타일 — scadaStyles.ts / CMMS_Architecture.md §3.6.1
// 기존 팔레트 재사용 (Bevel #d1d7e0 / hover #dbe1ea / active #c3cad4, 프레임 그레이 #c0c7d0,
// 타이틀바 그라데이션 #002244→#0052a3 계열, 배지 블루 #0284c7). 신규 ad-hoc 색상 없음.
export const LOGIN_GATEWAY_ACCOUNT_CARD_STYLES = `
  .gateway-root .quick-login-row {
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 14px;
  }
  .gateway-root .quick-login-label {
    font-size: 11px;
    font-weight: bold;
    color: #334155;
    font-family: monospace;
  }
  .gateway-root .quick-login-card {
    width: 100%;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 12px;
    background: #d1d7e0;
    border-top: 2px solid #ffffff;
    border-left: 2px solid #ffffff;
    border-bottom: 2px solid #334155;
    border-right: 2px solid #334155;
    box-shadow: 1px 1px 0px #0f172a;
    font-family: 'Segoe UI', Tahoma, sans-serif;
    color: #0f172a;
    cursor: pointer;
    text-align: left;
  }
  .gateway-root .quick-login-card:hover:not(:disabled) {
    background: #dbe1ea;
  }
  .gateway-root .quick-login-card:active:not(:disabled) {
    border-top: 2px solid #334155;
    border-left: 2px solid #334155;
    border-bottom: 2px solid #ffffff;
    border-right: 2px solid #ffffff;
    box-shadow: inset 1px 1px 3px rgba(0, 0, 0, 0.4);
    background: #c3cad4;
  }
  .gateway-root .quick-login-card:disabled {
    background: #d1d7e0;
    color: #94a3b8;
    cursor: not-allowed;
    box-shadow: none;
  }
  .gateway-root .quick-login-card-identity {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .gateway-root .quick-login-card-name {
    font-size: 13px;
    font-weight: 800;
  }
  .gateway-root .quick-login-card-role {
    font-size: 10px;
    color: #334155;
  }
  .gateway-root .quick-login-card-badge {
    font-size: 10px;
    font-weight: 800;
    font-family: monospace;
    color: #ffffff;
    background: #0284c7;
    padding: 3px 6px;
    border-radius: 2px;
    letter-spacing: 0.3px;
    white-space: nowrap;
  }
`;
