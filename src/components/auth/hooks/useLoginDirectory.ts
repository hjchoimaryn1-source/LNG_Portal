// src/components/auth/hooks/useLoginDirectory.ts
// LoginGateway.tsx의 250줄 하드캡 대응 In-Place 추출(AGENTS.md §3 State Layer
// 컨벤션) — page.tsx의 SSR prefetch(initialDirectory)가 있으면 그대로 쓰고,
// 없거나 빈 배열이면 /login-directory를 클라이언트에서 직접 fetch한다.
"use client";

import { useEffect, useState } from 'react';
import type { LoginDirectoryEntry } from '../../../lib/rbac/userSecurityLoginDirectoryDao';

export function useLoginDirectory(initialDirectory?: LoginDirectoryEntry[]) {
  const [directory, setDirectory] = useState<LoginDirectoryEntry[]>(initialDirectory ?? []);
  const [directoryLoading, setDirectoryLoading] = useState(!initialDirectory || initialDirectory.length === 0);

  useEffect(() => {
    if (initialDirectory && initialDirectory.length > 0) return; // SSR prefetch 성공 — 재요청 불필요
    let cancelled = false;
    fetch('/api/v1/cmms/user-security/login-directory')
      .then((res) => res.json())
      .then((data: { success: true; accounts: LoginDirectoryEntry[] } | { success: false }) => {
        if (cancelled) return;
        setDirectory(data.success ? data.accounts : []);
        setDirectoryLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setDirectory([]);
          setDirectoryLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [initialDirectory]);

  return { directory, directoryLoading };
}
