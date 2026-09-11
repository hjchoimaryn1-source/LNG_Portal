// src/components/LNGPortalApp.tsx
"use client";

import React, { useState } from 'react';
import { CmmsAwarePortalProvider } from '../context/CmmsAwarePortalProvider';
import { PTWPermitsProvider } from '../context/PTWPermitsProvider';
import { ThemeProvider } from '../context/ThemeContext';
import { SubProcessKey } from '../types/lng';
import LoginGateway from './auth/LoginGateway';
import SectorLauncherHub from './launcher/SectorLauncherHub';
import LNGPortalInner from './portal/LNGPortalInner';

export default function LNGPortalApp() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeSector, setActiveSector] = useState<SubProcessKey | null>(null);

  return (
    <ThemeProvider>
      {activeSector !== null ? (
        /* Module Entry: Only when operator clicks one of the 5 sector cards, mount provider and load module */
        <CmmsAwarePortalProvider>
          <PTWPermitsProvider>
            <LNGPortalInner
              initialKey={activeSector}
              onReturnToLauncher={() => setActiveSector(null)}
              onLogout={() => {
                setActiveSector(null);
                setIsAuthenticated(false);
              }}
            />
          </PTWPermitsProvider>
        </CmmsAwarePortalProvider>
      ) : (
        /* Unified Background: Full-screen plant background image with dark overlay */
        <div
          className="relative h-screen w-screen bg-[#d4d0c8] overflow-hidden flex flex-col font-sans select-none"
          style={{ backgroundColor: '#d4d0c8' }}
        >
          {!isAuthenticated ? (
            /* State 1: Compact classic SCADA login box centered directly on photo background */
            <div className="flex-1 flex items-center justify-center p-4">
              <LoginGateway
                onLogin={() => setIsAuthenticated(true)}
                onEnter={() => setIsAuthenticated(true)}
              />
            </div>
          ) : (
            /* State 2: Dismiss login box and smoothly reveal the 5 Sector Launcher Cards */
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 sm:p-6 justify-center">
              <SectorLauncherHub
                onSelectSector={(targetKey) => setActiveSector(targetKey)}
                onLogout={() => setIsAuthenticated(false)}
              />
            </div>
          )}
        </div>
      )}
    </ThemeProvider>
  );
}
