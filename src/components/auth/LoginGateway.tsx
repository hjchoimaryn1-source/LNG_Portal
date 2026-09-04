// src/components/auth/LoginGateway.tsx
"use client";

import React, { useState } from 'react';

interface LoginGatewayProps {
  onEnter?: () => void;
  onLogin?: () => void;
}

export default function LoginGateway({ onEnter, onLogin }: LoginGatewayProps) {
  const [imgError, setImgError] = useState(false);

  const handleLogin = () => {
    if (onLogin) {
      onLogin();
    } else if (onEnter) {
      onEnter();
    }
  };

  return (
    <div className="gateway-root">
      <style>{`
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
      `}</style>

      <div className="window">
        {/* 상단 타이틀바 */}
        <div className="title-bar">
          <span className="flex items-center gap-1.5">
            <span>💻</span>
            <span>NIAS CMMS</span>
          </span>
          <div className="title-bar-controls">
            <button type="button" aria-label="Minimize">_</button>
            <button type="button" aria-label="Maximize">□</button>
            <button type="button" aria-label="Close">✕</button>
          </div>
        </div>

        <div className="window-body">
          {/* 2. Header Block: 독립된 Raised-Bevel 패널 */}
          <div className="header-panel">
            <div className="logo-area">
              {!imgError ? (
                <img
                  src="/images/bsg-lines-logo.png"
                  alt="LOGO"
                  style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="logo-placeholder">LOGO</div>
              )}
            </div>

            <div className="company-title">BERKAT SAMUDRA GEMILANG LINES</div>
          </div>

          {/* 3. Monitor Box: Sunken-Panel Tone-Down Gray (#d8dee9) with Inset Shadow */}
          <div className="status-card">
            <div className="status-header">
              <span>&gt;_ SYSTEM INITIALIZATION MONITOR</span>
              <span className="status-badge">SYS_READY</span>
            </div>
            <div className="status-item">
              &gt; GATEWAY STATUS: <span className="highlight">DEV NO-AUTH BYPASS ACTIVE</span>
            </div>
            <div className="status-item">
              &gt; SYSTEM SCOPE: <span className="highlight">120 ISO TANKS • 5-NODE SUPPLY CHAIN</span>
            </div>
            <div className="status-item">
              &gt; DATA HYDRATION: <span className="highlight">DEFERRED (EXECUTES POST-LOGIN)</span>
            </div>
          </div>

          {/* 4. Button: Classic Windows 3D Bevel Button */}
          <button type="button" className="enter-btn" onClick={handleLogin}>
            <span>[ ENTER PORTAL ]</span>
            <span>➔</span>
          </button>
        </div>

        {/* 하단 상태 바 */}
        <div className="status-bar">
          <span>PORTAL v2.5.0-CMMS</span>
          <span className="ready-indicator">⦿ SESSION STANDBY</span>
        </div>
      </div>
    </div>
  );
}
