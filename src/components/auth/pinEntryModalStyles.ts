// src/components/auth/pinEntryModalStyles.ts
// PinEntryModal.tsx 전용 스타일 — LoginGateway 팔레트 재사용
// (Bevel #d1d7e0, 프레임 #334155/#0f172a, 배지/강조 블루 #0284c7). 신규 ad-hoc 색상 없음.
export const PIN_ENTRY_MODAL_STYLES = `
  .pin-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
  }
  .pin-modal-panel {
    width: 280px;
    box-sizing: border-box;
    background: #d1d7e0;
    border-top: 2px solid #ffffff;
    border-left: 2px solid #ffffff;
    border-bottom: 2px solid #334155;
    border-right: 2px solid #334155;
    box-shadow: 2px 2px 0px #0f172a;
    padding: 14px;
    font-family: 'Segoe UI', Tahoma, sans-serif;
    color: #0f172a;
  }
  .pin-modal-title {
    font-size: 12px;
    font-weight: 800;
    font-family: monospace;
    margin-bottom: 4px;
  }
  .pin-modal-subtitle {
    font-size: 11px;
    color: #334155;
    margin-bottom: 10px;
  }
  .pin-modal-input {
    width: 100%;
    box-sizing: border-box;
    font-family: monospace;
    font-size: 18px;
    letter-spacing: 6px;
    text-align: center;
    padding: 8px 6px;
    background: #f1f5f9;
    border-top: 2px solid #334155;
    border-left: 2px solid #334155;
    border-bottom: 2px solid #ffffff;
    border-right: 2px solid #ffffff;
    box-shadow: inset 1px 1px 3px rgba(0, 0, 0, 0.3);
    margin-bottom: 8px;
  }
  .pin-modal-error {
    font-size: 11px;
    color: #b91c1c;
    margin-bottom: 8px;
  }
  .pin-modal-actions {
    display: flex;
    gap: 8px;
  }
  .pin-modal-button {
    flex: 1;
    padding: 8px 6px;
    font-size: 11px;
    font-weight: 800;
    font-family: monospace;
    cursor: pointer;
    background: #d1d7e0;
    border-top: 2px solid #ffffff;
    border-left: 2px solid #ffffff;
    border-bottom: 2px solid #334155;
    border-right: 2px solid #334155;
  }
  .pin-modal-button:hover:not(:disabled) {
    background: #dbe1ea;
  }
  .pin-modal-button:disabled {
    color: #94a3b8;
    cursor: not-allowed;
  }
  .pin-modal-button-primary {
    background: #0284c7;
    color: #ffffff;
    border-top: 2px solid #38bdf8;
    border-left: 2px solid #38bdf8;
    border-bottom: 2px solid #075985;
    border-right: 2px solid #075985;
  }
  .pin-modal-button-primary:hover:not(:disabled) {
    background: #0369a1;
  }
`;
