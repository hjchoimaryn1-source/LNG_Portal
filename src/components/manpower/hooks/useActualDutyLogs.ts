import { useState, useEffect, useCallback } from 'react';
import { DailyActualLog } from '../../../types/manpowerActual';

const STORAGE_KEY = 'NIAS_ACTUAL_DUTY_LOGS';

export function useActualDutyLogs() {
  const [actualMap, setActualMap] = useState<Record<string, DailyActualLog>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Sync to localStorage whenever actualMap changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(actualMap));
    } catch (e) {
      console.error('Failed to save actual duty logs to localStorage', e);
    }
  }, [actualMap]);

  /**
   * Locks daily actual operational logs for a given dateKey.
   */
  const lockDailyActuals = useCallback((dateKey: string, records: DailyActualLog[]) => {
    setActualMap((prev) => {
      const next = { ...prev };
      records.forEach((rec) => {
        const id = `${rec.staffId}_${dateKey}`;
        next[id] = {
          ...rec,
          id,
          dateKey,
          lockedAt: rec.lockedAt || new Date().toISOString(),
        };
      });
      return next;
    });
  }, []);

  /**
   * Retrieves logged actual record if present.
   */
  const getActualLog = useCallback(
    (staffId: string, dateKey: string): DailyActualLog | undefined => {
      return actualMap[`${staffId}_${dateKey}`];
    },
    [actualMap]
  );

  return {
    actualMap,
    lockDailyActuals,
    getActualLog,
  };
}
