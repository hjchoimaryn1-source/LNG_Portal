// src/components/locations/nias/hooks/useNiasTankTrendModal.ts
//
// PURPOSE
//   Large Screen SCADA Console: Historical Telemetry Trend Modal trigger
//   state, extracted verbatim from NiasTerminalView.tsx (Phase 13 Target A).

import { useState } from 'react';

export interface UseNiasTankTrendModalOptions {
  handleSelectTankForWorkstation: (tankNo: string) => void;
}

export function useNiasTankTrendModal({ handleSelectTankForWorkstation }: UseNiasTankTrendModalOptions) {
  const [trendModalTankNo, setTrendModalTankNo] = useState<string | null>(null);

  const handleOpenTankTrendModal = (tNo: string) => {
    handleSelectTankForWorkstation(tNo);
    setTrendModalTankNo(tNo);
  };

  return { trendModalTankNo, setTrendModalTankNo, handleOpenTankTrendModal };
}

export default useNiasTankTrendModal;
