import { useState, useEffect, useCallback } from 'react';
import { ManagerOverrideRecord } from '../../../types/manpowerOverride';

const STORAGE_KEY = 'NIAS_SITE_MANAGER_OVERRIDES';

export function useManagerOverrides() {
  const [overrideRecords, setOverrideRecords] = useState<Record<string, ManagerOverrideRecord>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error('Failed to parse manager overrides from localStorage', e);
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(overrideRecords));
    } catch (e) {
      console.error('Failed to save manager overrides to localStorage', e);
    }
  }, [overrideRecords]);

  const saveOverride = useCallback((record: ManagerOverrideRecord) => {
    const key = `${record.staffId}_${record.targetDate}`;
    setOverrideRecords((prev) => ({
      ...prev,
      [key]: record,
    }));
  }, []);

  const revokeOverride = useCallback((staffId: string, targetDate: string) => {
    const key = `${staffId}_${targetDate}`;
    setOverrideRecords((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const getOverride = useCallback(
    (staffId: string, targetDate: string): ManagerOverrideRecord | undefined => {
      return overrideRecords[`${staffId}_${targetDate}`];
    },
    [overrideRecords]
  );

  return {
    overrideRecords,
    saveOverride,
    revokeOverride,
    getOverride,
  };
}
