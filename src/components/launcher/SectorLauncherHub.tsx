// src/components/launcher/SectorLauncherHub.tsx
"use client";

import React, { useState } from 'react';
import { SubProcessKey } from '../../types/lng';

interface SectorButton {
  id: string;
  name: string;
  targetKey: SubProcessKey;
}

const SECTOR_BUTTONS: SectorButton[] = [
  {
    id: 'MOD_1_LNG_PROCESS',
    name: 'LNG-Process',
    targetKey: 'LNG_PROCESS_OVERVIEW',
  },
  {
    id: 'MOD_2_EQUIPMENT',
    name: 'Equipment & Asset',
    targetKey: 'EQUIPMENT_ASSET_REGISTRY',
  },
  {
    id: 'MOD_3_WORK_ORDER',
    name: 'Maintenance & Work Orders',
    targetKey: 'WORK_ORDER_DIRECTORY',
  },
  {
    id: 'MOD_4_MANPOWER',
    name: 'Site Manning & Roster',
    targetKey: 'MANPOWER_DAILY_SHIFT',
  },
  {
    id: 'MOD_5_SAFETY_PTW',
    name: 'Safety & PTW',
    targetKey: 'PTW_PERMITS',
  },
];

interface SectorLauncherHubProps {
  onSelectSector: (key: SubProcessKey) => void;
  onLogout?: () => void;
}

export default function SectorLauncherHub({ onSelectSector, onLogout }: SectorLauncherHubProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="w-full flex items-center justify-center p-2 sm:p-4 select-none font-sans">
      <style>{`
        .scada-window {
          width: 860px;
          max-width: 96vw;
          background: #c0c7d0;
          border: 2px solid #1a365d;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.75), 0 4px 10px rgba(0, 0, 0, 0.5);
        }

        .scada-titlebar {
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

        .scada-window-controls {
          display: flex;
          align-items: center;
        }

        .scada-window-controls button {
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

        .scada-photo-frame {
          border-top: 2px solid #475569;
          border-left: 2px solid #475569;
          border-bottom: 2px solid #ffffff;
          border-right: 2px solid #ffffff;
          background: #0f172a;
          box-shadow: inset 2px 2px 6px rgba(0, 0, 0, 0.6);
        }

        .scada-btn-3d {
          background: #d1d7e0;
          border-top: 2px solid #ffffff;
          border-left: 2px solid #ffffff;
          border-bottom: 2px solid #334155;
          border-right: 2px solid #334155;
          box-shadow: 1px 1px 0px #0f172a;
          color: #0f172a;
          font-weight: 800;
          font-size: 12px;
          letter-spacing: 0.3px;
          cursor: pointer;
          transition: background-color 0.05s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          user-select: none;
          height: 38px;
          padding: 0 6px;
        }

        .scada-btn-3d:hover {
          background: #dbe1ea;
        }

        .scada-btn-3d:active {
          border-top: 2px solid #334155;
          border-left: 2px solid #334155;
          border-bottom: 2px solid #ffffff;
          border-right: 2px solid #ffffff;
          box-shadow: inset 1px 1px 3px rgba(0, 0, 0, 0.4);
          background: #c3cad4;
          padding-top: 2px;
          padding-left: 2px;
        }

        .scada-statusbar {
          background: #b5bdc7;
          border-top: 1px solid #94a3b8;
          padding: 5px 12px;
          font-size: 11px;
          font-family: monospace;
          color: #334155;
          display: flex;
          justify-content: space-between;
        }
      `}</style>

      <div className="scada-window">
        {/* Titlebar */}
        <div className="scada-titlebar">
          <div className="flex items-center gap-2">
            <span>💻</span>
            <span>NIAS CMMS - SCADA SECTOR LAUNCHER</span>
          </div>
          <div className="scada-window-controls">
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="!w-auto !px-2 !h-[18px] text-[10px] font-mono mr-1 text-slate-800"
                title="Lock Session and Return to Login"
              >
                [ 🔒 LOCK ]
              </button>
            )}
            <button type="button" aria-label="Minimize">_</button>
            <button type="button" aria-label="Maximize">□</button>
            <button type="button" aria-label="Close" onClick={onLogout}>✕</button>
          </div>
        </div>

        {/* Window Body */}
        <div className="p-3 sm:p-4 flex flex-col gap-3">
          {/* Header Subtitle Bar */}
          <div className="flex items-center justify-between px-1 font-mono text-[11px] text-slate-800">
            <span className="font-bold">BERKAT SAMUDRA GEMILANG LINES • VIRTUAL PIPELINE</span>
            <span className="font-black text-emerald-800">⦿ 5 MODULES READY</span>
          </div>

          {/* 2. Center Photo: Display a single large, framed plant/site image */}
          <div className="scada-photo-frame w-full h-72 sm:h-96 relative overflow-hidden rounded-xs">
            {!imgError ? (
              <img
                src="/images/ISO%20Tank.jpg"
                alt="NIAS LNG Terminal Plant"
                className="w-full h-full object-cover select-none"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-300 font-mono text-sm">
                <span>[ NIAS LNG TERMINAL &amp; ISO TANK REPOSITORY ]</span>
              </div>
            )}
            {/* Image Overlay Label */}
            <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-xs text-white px-2.5 py-1 text-[11px] font-mono border border-white/20 rounded-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ORU NIAS REGASIFICATION &amp; 120 ISO TANKS SUPPLY CHAIN</span>
            </div>
          </div>

          {/* 3. Bottom Button Bar: Directly below the photo, 5 simple classic 3D beveled buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
            {SECTOR_BUTTONS.map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => onSelectSector(btn.targetKey)}
                className="scada-btn-3d"
              >
                [ {btn.name} ]
              </button>
            ))}
          </div>
        </div>

        {/* Status Bar */}
        <div className="scada-statusbar">
          <span>PORTAL v2.5.0-CMMS • SECTOR DISPATCH</span>
          <span className="font-bold text-emerald-800">⦿ SESSION STANDBY</span>
        </div>
      </div>
    </div>
  );
}
