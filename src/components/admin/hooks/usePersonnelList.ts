// src/components/admin/hooks/usePersonnelList.ts
//
// PURPOSE
//   personnel_master 목록/필터/생성/수정/퇴직 처리 — Stage 1C
//   /api/v1/cmms/user-security/personnel 라우트의 클라이언트 측 데이터 계층.
//   퇴직은 하드 삭제가 아니라 서버의 resign 액션(employment_status='RESIGNED')
//   호출이다.

import { useCallback, useEffect, useState } from 'react';

const PERSONNEL_API = '/api/v1/cmms/user-security/personnel';

export interface PersonnelRecord {
  employeeId: string;
  fullName: string;
  positionTitle: string;
  departmentGroup: string;
  employmentStatus: string;
  hireDate: string | null;
  resignationDate: string | null;
  isLocalResident: boolean;
  contactNo: string | null;
  remarks: string | null;
}

export interface PersonnelFilter {
  departmentGroup?: string;
  employmentStatus?: string;
}

export interface CreatePersonnelInput {
  employeeId: string;
  fullName: string;
  positionTitle: string;
  departmentGroup: string;
  hireDate?: string | null;
  isLocalResident?: boolean;
  contactNo?: string | null;
  remarks?: string | null;
}

export interface UpdatePersonnelInput {
  positionTitle?: string;
  departmentGroup?: string;
  contactNo?: string | null;
  remarks?: string | null;
}

function buildQuery(filter: PersonnelFilter): string {
  const params = new URLSearchParams();
  if (filter.departmentGroup) params.set('departmentGroup', filter.departmentGroup);
  if (filter.employmentStatus) params.set('employmentStatus', filter.employmentStatus);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function usePersonnelList() {
  const [records, setRecords] = useState<PersonnelRecord[]>([]);
  const [filter, setFilter] = useState<PersonnelFilter>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback((nextFilter: PersonnelFilter = filter) => {
    setLoading(true);
    setError(null);
    fetch(`${PERSONNEL_API}${buildQuery(nextFilter)}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json: { success: boolean; records?: PersonnelRecord[]; error?: string }) => {
        if (json.success && json.records) {
          setRecords(json.records);
        } else {
          setError(json.error ?? 'Failed to load personnel.');
        }
      })
      .catch(() => setError('Failed to load personnel.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refresh(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function createPersonnel(input: CreatePersonnelInput): Promise<string | null> {
    const res = await fetch(PERSONNEL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!json.success) return json.error ?? 'Failed to create personnel.';
    refresh(filter);
    return null;
  }

  async function updatePersonnel(employeeId: string, update: UpdatePersonnelInput): Promise<string | null> {
    const res = await fetch(PERSONNEL_API, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, update }),
    });
    const json = await res.json();
    if (!json.success) return json.error ?? 'Failed to update personnel.';
    refresh(filter);
    return null;
  }

  async function resignPersonnel(employeeId: string, resignationDate: string): Promise<string | null> {
    const res = await fetch(PERSONNEL_API, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, resign: { resignationDate } }),
    });
    const json = await res.json();
    if (!json.success) return json.error ?? 'Failed to resign personnel.';
    refresh(filter);
    return null;
  }

  return { records, filter, setFilter, loading, error, createPersonnel, updatePersonnel, resignPersonnel };
}
