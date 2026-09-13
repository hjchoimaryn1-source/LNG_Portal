// src/components/auth/loginGatewayTaskStyles.ts
// TASK 2(로그인 UI 리팩터: 세션 타임아웃/계정 잠금/역할 접근 요약) 전용 스타일 분리본.
// loginGatewayStyles.ts와 함께 LoginGateway.tsx에서 이어붙여 사용된다.
export const LOGIN_GATEWAY_TASK_STYLES = `
  /* 3b. 역할 선택 + 안내 문구 (TASK 2) */
  .gateway-root .role-select-row {
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 14px;
  }
  .gateway-root .role-select-label {
    font-size: 11px;
    font-weight: bold;
    color: #334155;
    font-family: monospace;
  }
  .gateway-root .role-select {
    width: 100%;
    height: 30px;
    background: #ffffff;
    border-top: 2px solid #64748b;
    border-left: 2px solid #64748b;
    border-bottom: 2px solid #ffffff;
    border-right: 2px solid #ffffff;
    font-size: 12px;
    font-family: 'Segoe UI', Tahoma, sans-serif;
    color: #0f172a;
    padding: 0 6px;
  }
  .gateway-root .role-access-summary {
    width: 100%;
    box-sizing: border-box;
    background: rgba(226, 232, 240, 0.5);
    border-top: 2px solid #ffffff;
    border-left: 2px solid #ffffff;
    border-bottom: 2px solid #475569;
    border-right: 2px solid #475569;
    padding: 8px 10px;
    margin-bottom: 14px;
    font-size: 11px;
    font-family: monospace;
    color: #1e293b;
    line-height: 1.5;
  }
  .gateway-root .role-access-summary .summary-title {
    font-weight: 800;
    color: #0369a1;
    display: block;
    margin-bottom: 3px;
  }

  /* 3c. 계정 잠금 배너 (로컬 목업, TASK 2) */
  .gateway-root .lockout-banner {
    width: 100%;
    box-sizing: border-box;
    background: #fde8e8;
    border-top: 2px solid #b91c1c;
    border-left: 2px solid #b91c1c;
    border-bottom: 2px solid #7f1d1d;
    border-right: 2px solid #7f1d1d;
    padding: 8px 10px;
    margin-bottom: 14px;
    font-size: 11px;
    font-family: monospace;
    font-weight: bold;
    color: #7f1d1d;
    text-align: center;
  }
`;
