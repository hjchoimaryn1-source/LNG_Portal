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
    // Approval Hub Phase 1 Stage 1c — localStorage 기존 동작은 유지한 채,
    // 서버 shift_overrides 테이블에도 나란히 기록한다(fire-and-forget, 기존
    // UX를 막지 않음). 실패해도 localStorage 쓰기는 이미 반영된 상태다.
    fetch('/api/v1/cmms/shift-overrides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        staffId: record.staffId,
        targetDate: record.targetDate,
        overrideType: record.overrideType,
        assignedShift: record.assignedShift,
        reason: record.reason,
        approvedBy: record.approvedBy,
        approvedAt: record.approvedAt,
      }),
    }).catch((e) => console.error('Failed to persist shift override to server', e));
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
