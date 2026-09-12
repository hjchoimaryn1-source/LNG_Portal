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

  /* 1. 윈도우 팝업 프레임 (Industrial Classic Gray) */
  .gateway-root .window {
    width: 520px;
    max-width: 95vw;
    background: #c0c7d0;
    border: 2px solid #1a365d;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.65), 0 2px 4px rgba(0, 0, 0, 0.4);
  }

  /* 타이틀바 */
  .gateway-root .title-bar {
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

  /* 본문 영역 */
  .gateway-root .window-body {
    padding: 20px 24px 22px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  /* 2. Header Block: 독립된 Raised-Bevel 패널 */
  .gateway-root .header-panel {
    width: 100%;
    box-sizing: border-box;
    padding: 12px 14px;
    background: rgba(226, 232, 240, 0.5);
    border-top: 2px solid #ffffff;
    border-left: 2px solid #ffffff;
    border-bottom: 2px solid #475569;
    border-right: 2px solid #475569;
    margin-bottom: 18px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  }
  .gateway-root .logo-area {
    margin-bottom: 8px;
    display: flex;
    justify-content: center;
  }
  .gateway-root .logo-placeholder {
    width: 48px;
    height: 48px;
    background: #0077b6;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 11px;
    border-top: 1px solid #ffffff;
    border-left: 1px solid #ffffff;
    border-bottom: 1px solid #003e4d;
    border-right: 1px solid #003e4d;
  }
  .gateway-root .company-title {
    font-size: 17px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: 0.8px;
    text-align: center;
  }

  /* 3. Monitor Box: Sunken-Panel Tone-Down Gray (#d8dee9) with Inset Shadow */
  .gateway-root .status-card {
    width: 100%;
    background: #d8dee9;
    border-top: 2px solid #64748b;
    border-left: 2px solid #64748b;
    border-bottom: 2px solid #ffffff;
    border-right: 2px solid #ffffff;
    border-radius: 2px;
    padding: 14px 16px;
    box-shadow: inset 2px 2px 5px rgba(0, 0, 0, 0.22);
    margin-bottom: 18px;
    box-sizing: border-box;
  }
  .gateway-root .status-header {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    font-weight: bold;
    color: #334155;
    border-bottom: 1px solid #b4c2d4;
    padding-bottom: 6px;
    margin-bottom: 9px;
    font-family: monospace;
  }
  .gateway-root .status-badge {
    color: #0284c7;
    font-weight: 800;
  }
  .gateway-root .status-item {
    font-family: monospace;
    font-size: 12px;
    color: #1e293b;
    margin-bottom: 6px;
    letter-spacing: 0.2px;
  }
  .gateway-root .status-item:last-child {
    margin-bottom: 0;
  }
  .gateway-root .status-item span.highlight {
    color: #0369a1;
    font-weight: 800;
  }

  /* 4. Button: Classic Windows 3D Bevel Button */
  .gateway-root .enter-btn {
    width: 100%;
    height: 42px;
    background: #d1d7e0;
    border-top: 2px solid #ffffff;
    border-left: 2px solid #ffffff;
    border-bottom: 2px solid #334155;
    border-right: 2px solid #334155;
    box-shadow: 1px 1px 0px #0f172a;
    font-size: 13px;
    font-weight: 800;
    font-family: 'Segoe UI', Tahoma, monospace, sans-serif;
    letter-spacing: 1px;
    color: #0f172a;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background-color 0.05s ease;
  }
  .gateway-root .enter-btn:hover {
    background: #dbe1ea;
  }
  .gateway-root .enter-btn:active {
    border-top: 2px solid #334155;
    border-left: 2px solid #334155;
    border-bottom: 2px solid #ffffff;
    border-right: 2px solid #ffffff;
    box-shadow: inset 1px 1px 3px rgba(0, 0, 0, 0.4);
    background: #c3cad4;
    padding-top: 2px;
    padding-left: 2px;
  }
  .gateway-root .enter-btn:disabled {
    background: #d1d7e0;
    color: #94a3b8;
    cursor: not-allowed;
    box-shadow: none;
  }

  /* 하단 상태바 (Classic Groove & Industrial Bevel) */
  .gateway-root .status-bar {
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
